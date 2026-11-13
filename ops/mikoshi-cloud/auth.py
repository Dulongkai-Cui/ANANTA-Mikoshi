"""Mikoshi invitation identity service. Standard library; never stores raw session/invite tokens.

The HTTP gateway supplies its configured external origin and a trusted peer address.
It must not derive either from an untrusted Host/X-Forwarded-For header.
"""
from __future__ import annotations

import argparse
from contextlib import contextmanager
from dataclasses import dataclass, field
from datetime import datetime, timezone
import hashlib
import hmac
from http.cookies import CookieError, SimpleCookie
import json
import os
from pathlib import Path
import re
import secrets
import sqlite3
import threading
import time
from typing import Callable, Mapping
from urllib.parse import urlsplit
import uuid

COOKIE_NAME = "mikoshi_session"
SESSION_SECONDS = 7 * 86400
ROLES = {"admin": "管理员", "editor": "编辑成员", "viewer": "只读成员"}
TOKEN = re.compile(r"[A-Za-z0-9_-]{40,64}\Z", re.ASCII)
EMAIL = re.compile(r"[^\s@\x00-\x1f]+@[^\s@\x00-\x1f]+\.[^\s@\x00-\x1f]+\Z")
MAX_AUTH_BODY = 8192
_HASH_SLOTS = threading.BoundedSemaphore(4)


class AuthError(Exception):
    def __init__(self, status: int, code: str, message: str):
        super().__init__(message)
        self.status, self.code, self.message = status, code, message


@dataclass(frozen=True)
class AuthContext:
    user: dict
    session_id: str  # Database key: a hash, never the browser cookie value.
    csrf: str

    @property
    def role(self) -> str:
        return self.user["role"]

    def payload(self) -> dict:
        return {"session": {"version": 1, "mode": "production", "user": self.user}, "csrf": self.csrf}


@dataclass
class AuthResponse:
    status: int
    body: dict
    headers: list[tuple[str, str]] = field(default_factory=list)


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _stamp(value: int) -> str:
    return datetime.fromtimestamp(value, timezone.utc).isoformat(timespec="seconds")


def _email(value: object) -> str:
    if not isinstance(value, str) or len(value) > 254 or not EMAIL.fullmatch(value.strip()):
        raise AuthError(400, "invalid_input", "请填写有效的邮箱地址。")
    _valid_unicode(value)
    return value.strip().lower()


def _password(value: object) -> str:
    if not isinstance(value, str) or not 12 <= len(value) <= 128:
        raise AuthError(400, "invalid_input", "密码需要 12 至 128 个字符。")
    _valid_unicode(value)
    return value


def _valid_unicode(value: str) -> None:
    try:
        value.encode("utf-8")
    except UnicodeEncodeError:
        raise AuthError(400, "invalid_input", "请求包含无效字符。") from None


def _scrypt(password: str, salt: bytes) -> str:
    with _HASH_SLOTS:
        return hashlib.scrypt(password.encode("utf-8"), salt=salt, n=32768, r=8, p=1,
                              dklen=32, maxmem=64 * 1024 * 1024).hex()


def _password_hash(password: str) -> str:
    salt = secrets.token_bytes(16)
    return "scrypt1$" + salt.hex() + "$" + _scrypt(password, salt)


def _password_matches(password: str, encoded: str | None) -> bool:
    # Unknown accounts perform the same cost of work as known accounts.
    if not encoded:
        _scrypt(password, bytes(16))
        return False
    try:
        version, salt, expected = encoded.split("$")
        if version != "scrypt1" or len(salt) != 32 or len(expected) != 64:
            raise ValueError("hash format")
        return hmac.compare_digest(_scrypt(password, bytes.fromhex(salt)), expected)
    except (ValueError, TypeError):
        raise AuthError(503, "service_unavailable", "账号服务暂时不可用，请稍后重试。") from None


def _profile(row: sqlite3.Row) -> dict:
    name = row["display_name"]
    return {"id": row["id"], "displayName": name, "email": row["email"],
            "role": row["role"], "roleLabel": ROLES[row["role"]],
            "initials": name[:1].upper()}


class AuthStore:
    """Separate identity DB; does not modify any KOL or legacy identity tables."""

    def __init__(self, database: str | Path, *, clock: Callable[[], float] = time.time):
        self.database = Path(database)
        self.clock = clock
        self.database.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        if self.database.is_symlink():
            raise ValueError("身份库不能使用符号链接。")
        new = not self.database.exists()
        with self.connect() as con:
            con.executescript("""
                CREATE TABLE IF NOT EXISTS auth_meta (id INTEGER PRIMARY KEY CHECK(id=1), version INTEGER NOT NULL);
                INSERT OR IGNORE INTO auth_meta VALUES (1,1);
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT NOT NULL,
                    password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('admin','editor','viewer')),
                    created_at INTEGER NOT NULL, disabled INTEGER NOT NULL DEFAULT 0 CHECK(disabled IN (0,1)));
                CREATE TABLE IF NOT EXISTS sessions (
                    token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id),
                    csrf TEXT NOT NULL, created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL);
                CREATE INDEX IF NOT EXISTS session_user ON sessions(user_id);
                CREATE TABLE IF NOT EXISTS invites (
                    id TEXT PRIMARY KEY, token_hash TEXT NOT NULL UNIQUE,
                    role TEXT NOT NULL CHECK(role IN ('admin','editor','viewer')), label TEXT NOT NULL,
                    created_at INTEGER NOT NULL, expires_at INTEGER NOT NULL, created_by TEXT,
                    revoked_at INTEGER, consumed_at INTEGER, consumed_by TEXT,
                    bootstrap INTEGER NOT NULL DEFAULT 0 CHECK(bootstrap IN (0,1)));
                CREATE TABLE IF NOT EXISTS rate_limits (
                    bucket TEXT PRIMARY KEY, window_start INTEGER NOT NULL, attempts INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS audit (
                    id INTEGER PRIMARY KEY AUTOINCREMENT, at INTEGER NOT NULL,
                    actor TEXT, action TEXT NOT NULL, target TEXT);
            """)
            if con.execute("SELECT version FROM auth_meta WHERE id=1").fetchone()[0] != 1:
                raise ValueError("身份库版本不兼容。")
            # Additive, transactional migration: preserve every existing identity,
            # session and invitation. Old single-use rows retain their behavior.
            con.execute("BEGIN IMMEDIATE")
            columns = {row["name"] for row in con.execute("PRAGMA table_info(invites)")}
            if "reusable" not in columns:
                con.execute("ALTER TABLE invites ADD COLUMN reusable INTEGER NOT NULL DEFAULT 0 CHECK(reusable IN (0,1))")
            if "use_count" not in columns:
                con.execute("ALTER TABLE invites ADD COLUMN use_count INTEGER NOT NULL DEFAULT 0 CHECK(use_count>=0)")
                con.execute("UPDATE invites SET use_count=CASE WHEN consumed_at IS NULL THEN 0 ELSE 1 END")
        if new:
            self.database.chmod(0o600)

    @contextmanager
    def connect(self):
        con = sqlite3.connect(self.database, timeout=10)
        con.row_factory = sqlite3.Row
        con.execute("PRAGMA foreign_keys=ON")
        con.execute("PRAGMA synchronous=FULL")
        try:
            with con:
                yield con
        finally:
            con.close()

    def now(self) -> int:
        return int(self.clock())

    def reserve_attempt(self, action: str, peer: str, email: str) -> None:
        """Fixed windows are persistent across processes/restarts; denied calls do not extend locks."""
        now, window = self.now(), 900
        limits = [(digest(action + ":peer:" + peer), 60),
                  (digest(action + ":account:" + email), 10)]
        with self.connect() as con:
            con.execute("BEGIN IMMEDIATE")
            con.execute("DELETE FROM rate_limits WHERE window_start < ?", (now - 86400,))
            for bucket, cap in limits:
                row = con.execute("SELECT * FROM rate_limits WHERE bucket=?", (bucket,)).fetchone()
                if row and now - row["window_start"] < window and row["attempts"] >= cap:
                    raise AuthError(429, "rate_limited", "尝试次数较多，请在 15 分钟后重试。")
            for bucket, _ in limits:
                con.execute("""INSERT INTO rate_limits VALUES (?, ?, 1)
                    ON CONFLICT(bucket) DO UPDATE SET
                    attempts=CASE WHEN ?-window_start>=? THEN 1 ELSE attempts+1 END,
                    window_start=CASE WHEN ?-window_start>=? THEN ? ELSE window_start END""",
                            (bucket, now, now, window, now, window, now))

    def _session(self, con: sqlite3.Connection, user_id: str) -> tuple[AuthContext, str]:
        now = self.now()
        raw, csrf = secrets.token_urlsafe(32), secrets.token_urlsafe(32)
        key = digest(raw)
        con.execute("DELETE FROM sessions WHERE expires_at<=?", (now,))
        con.execute("INSERT INTO sessions VALUES (?,?,?,?,?)", (key, user_id, csrf, now, now + SESSION_SECONDS))
        row = con.execute("SELECT * FROM users WHERE id=?", (user_id,)).fetchone()
        return AuthContext(_profile(row), key, csrf), raw

    def login(self, email: object, password: object, peer: str) -> tuple[AuthContext, str]:
        email = _email(email)
        self.reserve_attempt("login", peer, email)
        if not isinstance(password, str) or not 1 <= len(password) <= 128:
            raise AuthError(401, "invalid_credentials", "邮箱或密码不正确。")
        _valid_unicode(password)
        with self.connect() as con:
            user = con.execute("SELECT * FROM users WHERE email=?", (email,)).fetchone()
        if not _password_matches(password, user["password_hash"] if user else None) or not user or user["disabled"]:
            raise AuthError(401, "invalid_credentials", "邮箱或密码不正确。")
        with self.connect() as con:
            con.execute("BEGIN IMMEDIATE")
            # Disabled status is rechecked inside the session creation transaction.
            if con.execute("SELECT disabled FROM users WHERE id=?", (user["id"],)).fetchone()[0]:
                raise AuthError(401, "invalid_credentials", "邮箱或密码不正确。")
            context, token = self._session(con, user["id"])
            con.execute("INSERT INTO audit(at,actor,action) VALUES (?,?,'login')", (self.now(), user["id"]))
        return context, token

    def register(self, email: object, password: object, display_name: object,
                 invite_code: object, peer: str) -> tuple[AuthContext, str]:
        email = _email(email)
        self.reserve_attempt("register", peer, email)
        password = _password(password)
        if not isinstance(display_name, str) or not 1 <= len(display_name.strip()) <= 50 or any(ord(c)<32 for c in display_name):
            raise AuthError(400, "invalid_input", "姓名需要 1 至 50 个可显示字符。")
        _valid_unicode(display_name)
        if not isinstance(invite_code, str) or not TOKEN.fullmatch(invite_code):
            raise AuthError(400, "invalid_invitation", "邀请码无效、已使用或已过期。")
        encoded = _password_hash(password)
        now, user_id = self.now(), str(uuid.uuid4())
        try:
            with self.connect() as con:
                con.execute("BEGIN IMMEDIATE")
                invitation = con.execute("SELECT * FROM invites WHERE token_hash=?", (digest(invite_code),)).fetchone()
                if (not invitation or invitation["revoked_at"] is not None
                        or (not invitation["reusable"] and invitation["consumed_at"] is not None)
                        or (invitation["expires_at"] <= now and not (invitation["reusable"] and invitation["expires_at"] == 0))):
                    raise AuthError(400, "invalid_invitation", "邀请码无效、已使用或已过期。")
                if invitation["bootstrap"] and con.execute("SELECT 1 FROM users LIMIT 1").fetchone():
                    raise AuthError(400, "invalid_invitation", "邀请码无效、已使用或已过期。")
                con.execute("INSERT INTO users(id,email,display_name,password_hash,role,created_at) VALUES (?,?,?,?,?,?)",
                            (user_id, email, display_name.strip(), encoded, invitation["role"], now))
                con.execute("UPDATE invites SET consumed_at=?,consumed_by=?,use_count=use_count+1 WHERE id=?", (now, user_id, invitation["id"]))
                context, token = self._session(con, user_id)
                con.execute("INSERT INTO audit(at,actor,action,target) VALUES (?,?,'register',?)", (now, user_id, invitation["id"]))
            return context, token
        except sqlite3.IntegrityError:
            raise AuthError(400, "registration_failed", "无法注册，请核对邮箱及邀请码，或联系管理员。") from None

    def session(self, token: str) -> AuthContext | None:
        if not TOKEN.fullmatch(token):
            return None
        with self.connect() as con:
            row = con.execute("""SELECT u.*,s.token_hash,s.csrf FROM sessions s JOIN users u ON u.id=s.user_id
                WHERE s.token_hash=? AND s.expires_at>? AND u.disabled=0""", (digest(token), self.now())).fetchone()
        return AuthContext(_profile(row), row["token_hash"], row["csrf"]) if row else None

    def logout(self, context: AuthContext) -> None:
        with self.connect() as con:
            con.execute("DELETE FROM sessions WHERE token_hash=?", (context.session_id,))
            con.execute("INSERT INTO audit(at,actor,action) VALUES (?,?,'logout')", (self.now(), context.user["id"]))

    def _require_admin(self, context: AuthContext) -> None:
        with self.connect() as con:
            row = con.execute("SELECT role,disabled FROM users WHERE id=?", (context.user["id"],)).fetchone()
        if not row or row["disabled"] or row["role"] != "admin":
            raise AuthError(403, "forbidden", "此操作需要管理员权限。")

    def _invite_view(self, row: sqlite3.Row) -> dict:
        status = ("revoked" if row["revoked_at"] is not None else "used" if not row["reusable"] and row["consumed_at"] is not None
                  else "expired" if row["expires_at"] <= self.now() and not (row["reusable"] and row["expires_at"] == 0) else "active")
        return {"id": row["id"], "role": row["role"], "label": row["label"], "status": status,
                "reusable": bool(row["reusable"]), "useCount": row["use_count"],
                "createdAt": _stamp(row["created_at"]), "expiresAt": _stamp(row["expires_at"]) if row["expires_at"] else None,
                "usedAt": _stamp(row["consumed_at"]) if row["consumed_at"] is not None else None}

    def create_invite(self, context: AuthContext, role: object, label: object = "", days: object = 7, reusable: object = False) -> dict:
        self._require_admin(context)
        if not isinstance(role, str) or role not in ROLES or type(days) is not int or not 1 <= days <= 7:
            raise AuthError(400, "invalid_input", "请选择有效角色，以及 1 至 7 天的有效期。")
        if type(reusable) is not bool or (reusable and role == "admin"):
            raise AuthError(400, "invalid_input", "长期团队邀请仅支持编辑成员或只读成员；管理员请使用单次邀请。")
        if not isinstance(label, str) or len(label) > 80 or any(ord(c)<32 for c in label):
            raise AuthError(400, "invalid_input", "邀请备注不能超过 80 个可显示字符。")
        _valid_unicode(label)
        now, key, code = self.now(), str(uuid.uuid4()), secrets.token_urlsafe(32)
        with self.connect() as con:
            con.execute("BEGIN IMMEDIATE")
            if con.execute("SELECT count(*) FROM invites WHERE (reusable=1 OR consumed_at IS NULL) AND revoked_at IS NULL AND (expires_at=0 OR expires_at>?)", (now,)).fetchone()[0] >= 100:
                raise AuthError(409, "invite_limit", "未使用的有效邀请已达 100 个，请先撤销不需要的邀请。")
            con.execute("INSERT INTO invites(id,token_hash,role,label,created_at,expires_at,created_by,reusable) VALUES (?,?,?,?,?,?,?,?)",
                        (key, digest(code), role, label.strip(), now, 0 if reusable else now+days*86400, context.user["id"], int(reusable)))
            con.execute("INSERT INTO audit(at,actor,action,target) VALUES (?,?,'invite_create',?)", (now, context.user["id"], key))
            row = con.execute("SELECT * FROM invites WHERE id=?", (key,)).fetchone()
        return {"invite": self._invite_view(row), "code": code}

    def list_invites(self, context: AuthContext) -> dict:
        self._require_admin(context)
        with self.connect() as con:
            rows = con.execute("SELECT * FROM invites ORDER BY created_at DESC,id DESC LIMIT 200").fetchall()
        return {"items": [self._invite_view(row) for row in rows]}

    def revoke_invite(self, context: AuthContext, invitation_id: str) -> dict:
        self._require_admin(context)
        with self.connect() as con:
            con.execute("BEGIN IMMEDIATE")
            row = con.execute("SELECT * FROM invites WHERE id=?", (invitation_id,)).fetchone()
            if not row:
                raise AuthError(404, "not_found", "邀请不存在。")
            if row["consumed_at"] is not None and not row["reusable"]:
                raise AuthError(409, "already_used", "邀请已使用；撤销邀请不能撤销已建立的账号。")
            con.execute("UPDATE invites SET revoked_at=coalesce(revoked_at,?) WHERE id=?", (self.now(), invitation_id))
            con.execute("INSERT INTO audit(at,actor,action,target) VALUES (?,?,'invite_revoke',?)", (self.now(), context.user["id"], invitation_id))
        return {"ok": True}

    def bootstrap(self, output: str | Path) -> None:
        """One offline administrator invitation; never creates or changes an account password."""
        output = Path(output)
        now, code = self.now(), secrets.token_urlsafe(32)
        with self.connect() as con:
            con.execute("BEGIN IMMEDIATE")
            if con.execute("SELECT 1 FROM users LIMIT 1").fetchone():
                raise ValueError("已有用户，不能再次初始化管理员。")
            if con.execute("SELECT 1 FROM invites WHERE bootstrap=1 AND consumed_at IS NULL AND revoked_at IS NULL AND expires_at>?", (now,)).fetchone():
                raise ValueError("已有有效的管理员初始化邀请。")
            con.execute("INSERT INTO invites(id,token_hash,role,label,created_at,expires_at,bootstrap) VALUES (?,?,'admin','首位管理员',?,?,1)",
                        (str(uuid.uuid4()), digest(code), now, now+86400))
            # Never overwrite an existing secret or follow a symlink. Keep the secret out of stdout/logs.
            fd = os.open(output, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
            try:
                with os.fdopen(fd, "w", encoding="utf-8") as out:
                    out.write(code + "\n")
                    out.flush()
                    os.fsync(out.fileno())
            except BaseException:
                output.unlink(missing_ok=True)
                raise


def _headers(headers: Mapping[str, str]) -> dict[str, str]:
    return {key.lower(): value for key, value in headers.items()}


def authenticate(store: AuthStore, cookie_header: str) -> AuthContext | None:
    try:
        cookie = SimpleCookie(cookie_header)
        item = cookie.get(COOKIE_NAME)
    except (CookieError, ValueError):
        return None
    return store.session(item.value) if item else None


def require_origin(headers: Mapping[str, str], expected_origin: str) -> None:
    hdr = _headers(headers)
    parsed = urlsplit(expected_origin)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc or parsed.path not in {"", "/"} or parsed.query or parsed.fragment:
        raise ValueError("必须配置明确的外部 origin。")
    if hdr.get("origin") != expected_origin.rstrip("/"):
        raise AuthError(403, "csrf_failed", "请求来源不匹配，请回到本站重新操作。")


def require_write(context: AuthContext | None, headers: Mapping[str, str], expected_origin: str) -> None:
    if context is None:
        raise AuthError(401, "unauthenticated", "请先登录 Mikoshi。")
    require_origin(headers, expected_origin)
    supplied = _headers(headers).get("x-csrf-token", "")
    if not hmac.compare_digest(supplied.encode("utf-8"), context.csrf.encode("utf-8")):
        raise AuthError(403, "csrf_failed", "登录校验已失效，请刷新后重试。")


def session_cookie(token: str, secure: bool = True, *, clear: bool = False) -> str:
    flags = f"{COOKIE_NAME}={token}; Path=/; HttpOnly; SameSite=Lax; Max-Age={0 if clear else SESSION_SECONDS}"
    return flags + ("; Secure" if secure else "") + ("; Expires=Thu, 01 Jan 1970 00:00:00 GMT" if clear else "")


def handle_auth(store: AuthStore, method: str, path: str, headers: Mapping[str, str], body: bytes,
                peer: str, expected_origin: str, secure_cookie: bool = True) -> AuthResponse:
    """Gateway adapter; paths are relative to the gateway API prefix, e.g. /auth/session."""
    common = [("Cache-Control", "private, no-store"), ("Vary", "Cookie"), ("X-Content-Type-Options", "nosniff")]
    try:
        hdr = _headers(headers)
        method = method.upper()
        context = authenticate(store, hdr.get("cookie", ""))
        if method == "GET" and path in {"/auth/session", "/auth/check"}:
            if not context:
                raise AuthError(401, "unauthenticated", "请先登录 Mikoshi。")
            return AuthResponse(200, context.payload(), common)
        if method == "GET" and path == "/auth/invites":
            if not context:
                raise AuthError(401, "unauthenticated", "请先登录 Mikoshi。")
            return AuthResponse(200, store.list_invites(context), common)
        revoke = re.fullmatch(r"/auth/invites/([0-9a-f-]{36})/revoke", path)
        if method != "POST" or path not in {"/auth/login", "/auth/register", "/auth/logout", "/auth/invites"} and not revoke:
            raise AuthError(404, "not_found", "身份接口不存在。")
        require_origin(headers, expected_origin)
        if hdr.get("content-type", "").split(";", 1)[0].strip().lower() != "application/json":
            raise AuthError(415, "invalid_content_type", "请使用 JSON 请求。")
        if not 0 < len(body) <= MAX_AUTH_BODY:
            raise AuthError(413, "invalid_size", "请求为空或过大。")
        try:
            data = json.loads(body)
        except (ValueError, UnicodeDecodeError):
            raise AuthError(400, "invalid_input", "请求格式无效。") from None
        if not isinstance(data, dict):
            raise AuthError(400, "invalid_input", "请求格式无效。")
        if path in {"/auth/login", "/auth/register"}:
            allowed = {"email", "password"} if path.endswith("login") else {"email", "password", "displayName", "inviteCode"}
            if set(data) - allowed:
                raise AuthError(400, "invalid_input", "请求包含不支持的字段。")
            if path.endswith("login"):
                new, token = store.login(data.get("email"), data.get("password"), peer)
            else:
                new, token = store.register(data.get("email"), data.get("password"), data.get("displayName"), data.get("inviteCode"), peer)
            return AuthResponse(200, new.payload(), common + [("Set-Cookie", session_cookie(token, secure_cookie))])
        require_write(context, headers, expected_origin)
        if path == "/auth/logout":
            store.logout(context)
            return AuthResponse(200, {"ok": True}, common + [("Set-Cookie", session_cookie("", secure_cookie, clear=True))])
        if path == "/auth/invites":
            result = store.create_invite(context, data.get("role"), data.get("label", ""), data.get("expiresInDays", 7), data.get("reusable", False))
            return AuthResponse(201, result, common)
        return AuthResponse(200, store.revoke_invite(context, revoke[1]), common)
    except AuthError as exc:
        extra = [("Retry-After", "900")] if exc.status == 429 else []
        return AuthResponse(exc.status, {"error": exc.message, "code": exc.code}, common + extra)
    except (sqlite3.Error, OSError):
        return AuthResponse(503, {"error": "账号服务暂时不可用，请稍后重试。", "code": "service_unavailable"}, common)


def main() -> None:
    parser = argparse.ArgumentParser(description="Mikoshi 身份库离线初始化；不在控制台输出邀请码。")
    sub = parser.add_subparsers(dest="command", required=True)
    bootstrap = sub.add_parser("bootstrap")
    bootstrap.add_argument("--database", required=True, type=Path)
    bootstrap.add_argument("--output", required=True, type=Path)
    args = parser.parse_args()
    try:
        AuthStore(args.database).bootstrap(args.output)
    except (ValueError, OSError, sqlite3.Error):
        raise SystemExit("初始化未完成：请核对私有输出目录、已有邀请和用户状态；未输出凭据。") from None
    print("管理员初始化邀请已写入指定私有文件，有效期 24 小时；请由负责人领取。")


if __name__ == "__main__":
    main()

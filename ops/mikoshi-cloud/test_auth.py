"""Identity boundary checks against real temporary SQLite databases; no production credentials/data."""
from concurrent.futures import ThreadPoolExecutor
from http.cookies import SimpleCookie
import json
from pathlib import Path
import shutil
import unittest
import uuid

from auth import AuthError, AuthStore, authenticate, handle_auth, require_write, SESSION_SECONDS


ORIGIN = "https://mikoshi.example.invalid"
PASSWORD = "Temporary-test-password-2026"


class AuthTests(unittest.TestCase):
    def setUp(self):
        # Explicit workspace temp root avoids Windows sandbox TEMP ACL incompatibility.
        self.test_base = Path(__file__).resolve().parents[2] / ".local" / "sbs-0019" / "auth-tests"
        self.root = self.test_base / str(uuid.uuid4())
        self.root.mkdir(parents=True)
        self.now = 1800000000
        self.store = AuthStore(self.root / "auth.sqlite", clock=lambda: self.now)
        bootstrap = self.root / "initial.txt"
        self.store.bootstrap(bootstrap)
        self.code = bootstrap.read_text().strip()
        self.admin, self.admin_token = self.store.register("owner@example.invalid", PASSWORD, "负责人", self.code, "local-test")

    def tearDown(self):
        resolved = self.root.resolve()
        self.assertEqual(resolved.parent, self.test_base.resolve())
        shutil.rmtree(resolved)

    def request(self, method, path, data=None, *, token=None, csrf=None, origin=ORIGIN, content_type="application/json", body=None):
        headers = {"Content-Type": content_type}
        if origin is not None:
            headers["Origin"] = origin
        if token:
            headers["Cookie"] = "mikoshi_session=" + token
        if csrf:
            headers["X-CSRF-Token"] = csrf
        return handle_auth(self.store, method, path, headers, body if body is not None else json.dumps(data or {}).encode(),
                           "local-test", ORIGIN)

    def invitation(self, role="editor", days=7):
        return self.store.create_invite(self.admin, role, "测试邀请", days)

    def member(self, role="editor", email="member@example.invalid"):
        invitation = self.invitation(role)
        return self.store.register(email, PASSWORD, "测试成员", invitation["code"], "local-test")

    def test_register_and_login_persist_with_http_cookie(self):
        invitation = self.invitation()
        result = self.request("POST", "/auth/register", {"email": "MEMBER@example.invalid", "password": PASSWORD,
                              "displayName": "成员", "inviteCode": invitation["code"]})
        self.assertEqual(result.status, 200)
        self.assertEqual(result.body["session"]["user"]["role"], "editor")
        cookie = dict(result.headers)["Set-Cookie"]
        for flag in ("HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=604800"):
            self.assertIn(flag, cookie)
        token = SimpleCookie(cookie)["mikoshi_session"].value
        reopened = AuthStore(self.root / "auth.sqlite", clock=lambda: self.now)
        self.assertEqual(reopened.session(token).user["email"], "member@example.invalid")
        logged, _ = reopened.login("member@example.invalid", PASSWORD, "local-test")
        self.assertEqual(logged.role, "editor")

    def test_plaintext_password_and_tokens_not_persisted(self):
        invitation = self.invitation()
        with self.store.connect() as con:
            data = "\n".join(con.iterdump())
        for value in (PASSWORD, invitation["code"], self.code, self.admin_token):
            self.assertNotIn(value, data)
        self.assertIn("scrypt1$", data)

    def test_missing_invalid_and_reused_invitation(self):
        for code in ("", "not-an-invite", "A"*43, self.code):
            with self.subTest(code_kind=len(code)):
                result = self.request("POST", "/auth/register", {"email": "new@example.invalid", "password": PASSWORD,
                                      "displayName": "成员", "inviteCode": code})
                self.assertEqual(result.status, 400)
                self.assertEqual(result.body["code"], "invalid_invitation")

    def test_role_cannot_be_supplied_at_registration(self):
        invitation = self.invitation("viewer")
        data = {"email": "new@example.invalid", "password": PASSWORD, "displayName": "成员",
                "inviteCode": invitation["code"], "role": "admin"}
        result = self.request("POST", "/auth/register", data)
        self.assertEqual(result.status, 400)
        del data["role"]
        result = self.request("POST", "/auth/register", data)
        self.assertEqual(result.body["session"]["user"]["role"], "viewer")

    def test_expired_and_revoked_invitation(self):
        invitation = self.invitation(days=1)
        self.now += 86400
        with self.assertRaises(AuthError) as raised:
            self.store.register("new@example.invalid", PASSWORD, "成员", invitation["code"], "local-test")
        self.assertEqual(raised.exception.code, "invalid_invitation")
        invitation = self.invitation()
        self.store.revoke_invite(self.admin, invitation["invite"]["id"])
        with self.assertRaises(AuthError) as raised:
            self.store.register("new@example.invalid", PASSWORD, "成员", invitation["code"], "local-test")
        self.assertEqual(raised.exception.code, "invalid_invitation")

    def test_invitation_is_atomically_consumed_once(self):
        invitation = self.invitation()
        def claim(number):
            try:
                self.store.register(f"new{number}@example.invalid", PASSWORD, "成员", invitation["code"], f"peer-{number}")
                return 200
            except AuthError as error:
                return error.status
        with ThreadPoolExecutor(max_workers=2) as pool:
            outcomes = sorted(pool.map(claim, [1, 2]))
        self.assertEqual(outcomes, [200, 400])
        with self.store.connect() as con:
            self.assertEqual(con.execute("SELECT count(*) FROM users").fetchone()[0], 2)

    def test_duplicate_email_does_not_consume_invitation(self):
        invitation = self.invitation()
        with self.assertRaises(AuthError):
            self.store.register("owner@example.invalid", PASSWORD, "成员", invitation["code"], "local-test")
        member, _ = self.store.register("other@example.invalid", PASSWORD, "成员", invitation["code"], "local-test")
        self.assertEqual(member.role, "editor")

    def test_session_expiry_forgery_and_disabled_user(self):
        self.assertIsNone(self.store.session("A"*43))
        self.assertIsNone(authenticate(self.store, "mikoshi_session=not-a-session"))
        self.assertIsNotNone(self.store.session(self.admin_token))
        self.now += SESSION_SECONDS
        self.assertIsNone(self.store.session(self.admin_token))
        context, token = self.store.login("owner@example.invalid", PASSWORD, "local-test")
        with self.store.connect() as con:
            con.execute("UPDATE users SET disabled=1 WHERE id=?", (context.user["id"],))
        self.assertIsNone(self.store.session(token))
        with self.assertRaises(AuthError):
            self.store.login("owner@example.invalid", PASSWORD, "local-test")

    def test_logout_invalidates_cookie_and_server_session(self):
        result = self.request("POST", "/auth/logout", token=self.admin_token, csrf=self.admin.csrf)
        self.assertEqual(result.status, 200)
        self.assertIn("Max-Age=0", dict(result.headers)["Set-Cookie"])
        self.assertIsNone(self.store.session(self.admin_token))
        self.assertEqual(self.request("GET", "/auth/session", token=self.admin_token).status, 401)

    def test_anonymous_and_nonadmin_invite_access(self):
        self.assertEqual(self.request("GET", "/auth/invites").status, 401)
        for role in ("viewer", "editor"):
            member, token = self.member(role, role+"@example.invalid")
            self.assertEqual(self.request("GET", "/auth/invites", token=token).status, 403)
            self.assertEqual(self.request("POST", "/auth/invites", {"role":"admin"}, token=token, csrf=member.csrf).status, 403)

    def test_invite_http_lifecycle_and_no_secret_in_list(self):
        result = self.request("POST", "/auth/invites", {"role":"editor", "label":"同事", "expiresInDays":2},
                              token=self.admin_token, csrf=self.admin.csrf)
        self.assertEqual(result.status, 201)
        code, invitation_id = result.body["code"], result.body["invite"]["id"]
        result = self.request("GET", "/auth/invites", token=self.admin_token)
        self.assertEqual(result.status, 200)
        self.assertNotIn(code, json.dumps(result.body))
        self.assertNotIn("token_hash", json.dumps(result.body))
        result = self.request("POST", f"/auth/invites/{invitation_id}/revoke", token=self.admin_token, csrf=self.admin.csrf)
        self.assertEqual(result.status, 200)

    def test_cross_origin_and_missing_origin_rejected(self):
        for origin in (None, "null", "https://evil.invalid", ORIGIN+".evil.invalid", "http://mikoshi.example.invalid"):
            for path in ("/auth/login", "/auth/register", "/auth/logout", "/auth/invites"):
                with self.subTest(origin=origin, path=path):
                    self.assertEqual(self.request("POST", path, origin=origin, token=self.admin_token, csrf=self.admin.csrf).status, 403)

    def test_missing_wrong_csrf_rejected_but_valid_writes_work(self):
        for csrf in (None, "wrong"):
            self.assertEqual(self.request("POST", "/auth/logout", token=self.admin_token, csrf=csrf).status, 403)
        self.assertIsNotNone(self.store.session(self.admin_token))
        with self.assertRaises(AuthError):
            require_write(None, {"Origin":ORIGIN}, ORIGIN)
        require_write(self.admin, {"Origin":ORIGIN, "X-CSRF-Token":self.admin.csrf}, ORIGIN)

    def test_login_failure_generic_and_rate_limit_persistent(self):
        known = self.request("POST", "/auth/login", {"email":"owner@example.invalid","password":"incorrect"})
        unknown = self.request("POST", "/auth/login", {"email":"unknown@example.invalid","password":"incorrect"})
        self.assertEqual((known.status, known.body), (unknown.status, unknown.body))
        for _ in range(9):
            self.assertEqual(self.request("POST", "/auth/login", {"email":"owner@example.invalid","password":"incorrect"}).status, 401)
        reopened = AuthStore(self.root/"auth.sqlite", clock=lambda:self.now)
        result = handle_auth(reopened, "POST", "/auth/login", {"Origin":ORIGIN,"Content-Type":"application/json"},
                              json.dumps({"email":"owner@example.invalid","password":PASSWORD}).encode(), "different-ip", ORIGIN)
        self.assertEqual(result.status, 429)
        self.assertEqual(dict(result.headers)["Retry-After"], "900")
        self.now += 901
        self.assertEqual(self.request("POST", "/auth/login", {"email":"owner@example.invalid","password":PASSWORD}).status, 200)

    def test_bootstrap_not_http_or_reusable(self):
        self.assertEqual(self.request("POST", "/auth/bootstrap").status, 404)
        with self.assertRaises(ValueError):
            self.store.bootstrap(self.root/"again.txt")
        self.assertFalse((self.root/"again.txt").exists())

    def test_bootstrap_never_overwrites_existing_file(self):
        store = AuthStore(self.root/"second.sqlite", clock=lambda:self.now)
        file = self.root/"untouched.txt"
        file.write_text("keep")
        with self.assertRaises(FileExistsError):
            store.bootstrap(file)
        self.assertEqual(file.read_text(), "keep")
        with store.connect() as con:
            self.assertEqual(con.execute("SELECT count(*) FROM invites").fetchone()[0], 0)
        store.bootstrap(self.root/"valid.txt")
        with self.assertRaises(ValueError):
            store.bootstrap(self.root/"extra.txt")

    def test_malformed_payload_and_unsupported_method(self):
        for body in (b"[1]", b"{", b"x"*8193):
            self.assertIn(self.request("POST", "/auth/login", body=body).status, (400,413))
        self.assertEqual(self.request("POST", "/auth/login", content_type="text/plain").status, 415)
        self.assertEqual(self.request("PUT", "/auth/login").status, 404)
        self.assertEqual(self.request("POST", "/auth/login", {"email":"\ud800@example.invalid","password":PASSWORD}).status, 400)

    def test_session_payload_contains_only_profile_and_csrf(self):
        result = self.request("GET", "/auth/session", token=self.admin_token)
        self.assertEqual(result.status, 200)
        self.assertEqual(result.body["session"]["mode"], "production")
        self.assertEqual(set(result.body["session"]["user"]), {"id","displayName","email","roleLabel","initials","role"})
        self.assertNotIn(self.admin_token, json.dumps(result.body))
        self.assertEqual(self.request("GET", "/auth/check", token=self.admin_token).status, 200)


if __name__ == "__main__":
    unittest.main()

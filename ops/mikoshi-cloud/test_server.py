"""Real loopback HTTP checks using only copied SQLite workspaces and disposable identities."""
from contextlib import closing
import gzip
import hashlib
import http.client
from http.cookies import SimpleCookie
import json
from pathlib import Path
import re
import shutil
import socket
import sqlite3
import threading
import time
import unittest
import uuid

from server import ASSET, COMPONENT, DIST, INTEGRATION, STATIC, MAX_BODY, make_server


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / ".local/sbs-0019/runtime/workspace.sqlite"
PASSWORD = "Gateway-test-password-2026"


def sha256(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


class GatewayTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.test_base = ROOT / ".local/sbs-0019/gateway-tests"
        cls.root = cls.test_base / str(uuid.uuid4())
        cls.root.mkdir(parents=True)
        cls.source_hash = sha256(SOURCE)
        cls.backup = cls.root / "source-copy.sqlite"
        # Read-only input connection plus SQLite's online backup API; never start Store on SOURCE.
        with closing(sqlite3.connect(SOURCE.resolve().as_uri() + "?mode=ro", uri=True)) as source:
            with closing(sqlite3.connect(cls.backup)) as dest:
                source.backup(dest)
                if dest.execute("PRAGMA integrity_check").fetchone()[0] != "ok":
                    raise AssertionError("Source copy integrity failure")

    @classmethod
    def tearDownClass(cls):
        if sha256(SOURCE) != cls.source_hash:
            raise AssertionError("Source workspace changed during test execution")
        resolved = cls.root.resolve()
        if resolved.parent != cls.test_base.resolve():
            raise AssertionError("Unsafe test cleanup path")
        shutil.rmtree(resolved)

    def setUp(self):
        self.case = self.root / str(uuid.uuid4())
        self.case.mkdir()
        self.database = self.case / "workspace.sqlite"
        shutil.copyfile(self.backup, self.database)
        self.server = make_server(0, self.database, self.case / "auth.sqlite", "http://127.0.0.1")
        self.port = self.server.server_address[1]
        self.origin = f"http://127.0.0.1:{self.port}"
        self.server.origin = self.origin
        self.thread = threading.Thread(target=self.server.serve_forever, daemon=True)
        self.thread.start()
        self.addCleanup(self.stop_server)
        self.server.auth.bootstrap(self.case / "first-invite.txt")
        code = (self.case / "first-invite.txt").read_text().strip()
        status, body, headers = self.request("POST", "/mikoshi-api/auth/register", {
            "email": "owner@example.invalid", "password": PASSWORD, "displayName": "测试负责人", "inviteCode": code,
        })
        self.assertEqual(status, 200)
        self.admin = {"cookie": SimpleCookie(headers["Set-Cookie"])["mikoshi_session"].value, "csrf":body["csrf"]}

    def stop_server(self):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=5)

    def request(self, method, path, data=None, *, account=None, origin="same", csrf=True,
                accept_gzip=False, raw_body=None, extra_headers=None, stream_body=False):
        headers = {}
        if data is not None or raw_body is not None:
            headers["Content-Type"] = "application/json"
        if origin == "same":
            headers["Origin"] = self.origin
        elif origin is not None:
            headers["Origin"] = origin
        if account:
            headers["Cookie"] = "mikoshi_session=" + account["cookie"]
            if csrf:
                headers["X-CSRF-Token"] = account["csrf"]
        if accept_gzip:
            headers["Accept-Encoding"] = "gzip"
        if extra_headers:
            headers.update(extra_headers)
        body = raw_body if raw_body is not None else json.dumps(data, ensure_ascii=False).encode() if data is not None else None
        connection = http.client.HTTPConnection("127.0.0.1", self.port, timeout=15)
        try:
            if stream_body and body:
                connection.putrequest(method, path)
                for key,value in headers.items(): connection.putheader(key,value)
                connection.putheader('Content-Length',str(len(body)))
                connection.endheaders()
                for offset in range(0,len(body),16384):
                    connection.send(body[offset:offset+16384])
                    # Force the server to receive a body still in flight when rejecting a header.
                    time.sleep(.0005)
            else:
                connection.request(method, path, body, headers)
            response = connection.getresponse()
            raw, result_headers = response.read(), dict(response.getheaders())
            if result_headers.get("Content-Encoding") == "gzip":
                raw = gzip.decompress(raw)
            result = json.loads(raw) if raw and "application/json" in result_headers.get("Content-Type", "") else raw
            return response.status, result, result_headers
        finally:
            connection.close()

    def member(self, role):
        status, invitation, _ = self.request("POST", "/mikoshi-api/auth/invites", {"role":role}, account=self.admin)
        self.assertEqual(status, 201)
        status, body, headers = self.request("POST", "/mikoshi-api/auth/register", {
            "email": f"{role}@example.invalid", "password": PASSWORD, "displayName": "测试成员", "inviteCode":invitation["code"],
        })
        self.assertEqual(status, 200)
        self.assertEqual(body["session"]["user"]["role"], role)
        return {"cookie": SimpleCookie(headers["Set-Cookie"])["mikoshi_session"].value, "csrf":body["csrf"]}

    def state(self, account=None):
        status, data, _ = self.request("GET", "/kol-studio/api/state", account=account or self.admin)
        self.assertEqual(status, 200)
        return data

    def test_long_lived_team_registration_over_http(self):
        before = self.state()
        status, invite, _ = self.request('POST', '/mikoshi-api/auth/invites', {'role': 'editor', 'reusable': True}, account=self.admin)
        self.assertEqual(status, 201)
        for index in range(2):
            status, body, headers = self.request('POST', '/mikoshi-api/auth/register', {
                'email': f'team{index}@example.invalid', 'password': PASSWORD,
                'displayName': '团队成员', 'inviteCode': invite['code'],
            })
            self.assertEqual(status, 200)
            self.assertEqual(body['session']['user']['role'], 'editor')
            member = {'cookie': SimpleCookie(headers['Set-Cookie'])['mikoshi_session'].value, 'csrf': body['csrf']}
            self.assertEqual(self.request('GET', '/mikoshi-api/auth/session', account=member)[0], 200)
        _, listed, _ = self.request('GET', '/mikoshi-api/auth/invites', account=self.admin)
        current = next(item for item in listed['items'] if item['id'] == invite['invite']['id'])
        self.assertEqual((current['status'], current['useCount'], current['expiresAt']), ('active', 2, None))
        self.assertEqual(self.request('POST', f"/mikoshi-api/auth/invites/{current['id']}/revoke", {}, account=self.admin)[0], 200)
        self.assertEqual(self.request('POST', '/mikoshi-api/auth/register', {
            'email': 'blocked@example.invalid', 'password': PASSWORD, 'displayName': '成员', 'inviteCode': invite['code'],
        })[0], 400)
        self.assertEqual(self.request('POST', '/mikoshi-api/auth/login', {'email': 'team0@example.invalid', 'password': PASSWORD})[0], 200)
        self.assertEqual(self.state(), before)

    def test_anonymous_cannot_access_any_workspace_asset_or_api(self):
        avatar = next((DIST / "assets/avatars").glob("*.jpg")).relative_to(DIST).as_posix()
        work = next((DIST / "assets/works").glob("*.json")).relative_to(DIST).as_posix()
        resources = ["", "index.html", "app.js", "style.css", "persistence.js", "read.js", "read.css", "bridge.js",
                     "embedded.css", "data.json", "research.json", "avatars.json", "recent-works.json",
                     "api/state", "api/history", avatar, work]
        for name in resources:
            with self.subTest(resource=name):
                self.assertEqual(self.request("GET", "/kol-studio/"+name)[0], 401)
                self.assertEqual(self.request("HEAD", "/kol-studio/"+name)[0], 401)
        self.assertEqual(self.request("PUT", "/kol-studio/api/state", {})[0], 401)

    def test_database_and_traversal_are_not_served_even_to_admin(self):
        resources = ["workspace.sqlite", "../workspace.sqlite", "../../ops/mikoshi-cloud/auth.py",
                     "%2e%2e/%2e%2e/user-data/workspace.sqlite", "assets/avatars/../../workspace.sqlite",
                     "%252e%252e/workspace.sqlite", "assets/avatars/%2e%2e%2fapp.js", ".git/config", ".openai/hosting.json"]
        for name in resources:
            with self.subTest(resource=name):
                self.assertEqual(self.request("GET", "/kol-studio/"+name, account=self.admin)[0], 404)
        self.assertEqual(self.request("GET", "/mikoshi-api/auth/bootstrap", account=self.admin)[0], 404)

    def test_roles_are_enforced_for_state_history_and_invites(self):
        viewer, editor = self.member("viewer"), self.member("editor")
        viewer_state = self.state(viewer)
        self.assertEqual(viewer_state["role"], "viewer")
        self.assertNotIn("csrf", viewer_state)
        self.assertEqual(self.request("PUT", "/kol-studio/api/state", {"state":viewer_state["state"], "version":viewer_state["version"]}, account=viewer)[0], 403)
        for account in (viewer, editor):
            self.assertEqual(self.request("GET", "/kol-studio/api/history", account=account)[0], 403)
            self.assertEqual(self.request("GET", "/mikoshi-api/auth/invites", account=account)[0], 403)
        self.assertEqual(self.state(editor)["role"], "editor")
        self.assertEqual(self.request("GET", "/kol-studio/api/history", account=self.admin)[0], 200)

    def test_editor_saves_revision_and_stale_write_cannot_overwrite(self):
        editor = self.member("editor")
        original = self.state(editor)
        modified = json.loads(json.dumps(original["state"]))
        modified["migrationGatewayTest"] = "saved-only-in-disposable-database"
        status, saved, _ = self.request("PUT", "/kol-studio/api/state", {"state":modified, "version":original["version"]}, account=editor)
        self.assertEqual(status, 200)
        self.assertNotEqual(saved["version"], original["version"])
        self.assertEqual(self.state()["state"]["migrationGatewayTest"], modified["migrationGatewayTest"])
        status, _, _ = self.request("PUT", "/kol-studio/api/state", {"state":original["state"], "version":original["version"]}, account=editor)
        self.assertEqual(status, 409)
        self.assertEqual(self.state()["version"], saved["version"])
        status, history, _ = self.request("GET", "/kol-studio/api/history", account=self.admin)
        self.assertEqual(status, 200)
        self.assertTrue(any(item["version"] == original["version"] for item in history["items"]))
        status, revision, headers = self.request("GET", "/kol-studio/api/history/"+original["version"], account=self.admin)
        self.assertEqual(status, 200)
        self.assertEqual(revision, original["state"])
        self.assertIn("attachment", headers["Content-Disposition"])

    def test_csrf_and_origin_block_writes_without_changing_revision(self):
        before = self.state()
        payload = {"state":before["state"], "version":before["version"]}
        for origin, csrf in (("https://evil.example.invalid", True), (None, True), ("same", False)):
            with self.subTest(origin=origin, csrf=csrf):
                self.assertEqual(self.request("PUT", "/kol-studio/api/state", payload, account=self.admin, origin=origin, csrf=csrf, stream_body=True)[0], 403)
        self.assertEqual(self.state()["version"], before["version"])
        self.assertEqual(self.request("POST", "/mikoshi-api/auth/login", {"email":"owner@example.invalid", "password":PASSWORD}, origin="https://evil.example.invalid")[0], 403)

    def test_cookie_logout_and_forgery_on_actual_http(self):
        self.assertEqual(self.request("GET", "/mikoshi-api/auth/session", account=self.admin)[0], 200)
        forged = {"cookie":"A"*43, "csrf":self.admin["csrf"]}
        self.assertEqual(self.request("GET", "/kol-studio/api/state", account=forged)[0], 401)
        self.assertEqual(self.request("POST", "/mikoshi-api/auth/logout", {}, account=self.admin)[0], 200)
        self.assertEqual(self.request("GET", "/kol-studio/api/state", account=self.admin)[0], 401)

    def test_embedded_html_and_all_direct_entry_resources(self):
        for role, account in (("admin",self.admin), ("viewer",self.member("viewer"))):
            status, raw, headers = self.request("GET", "/kol-studio/?embedded=1&view=kols", account=account)
            self.assertEqual(status, 200)
            html = raw.decode()
            self.assertIn('src="bridge.js"', html)
            self.assertIn('href="embedded.css"', html)
            self.assertIn("frame-ancestors 'self'", headers["Content-Security-Policy"])
            self.assertIn("no-store", headers["Cache-Control"])
            if role == "viewer":
                self.assertIn('src="read.js"', html)
                self.assertNotIn('src="persistence.js', html)
            else:
                self.assertIn('src="persistence.js', html)
            for resource in re.findall(r'(?:src|href)="([^"#]+)"', html):
                with self.subTest(role=role, resource=resource):
                    self.assertEqual(self.request("GET", "/kol-studio/"+resource, account=account)[0], 200)
        self.assertEqual(self.request("GET", "/kol-studio/data.json", account=self.admin)[1], {})
        for resource in STATIC:
            self.assertEqual(self.request("GET", "/kol-studio/"+resource, account=self.admin)[0], 200)

    def test_upstream_api_paths_are_adapted(self):
        status, raw, _ = self.request("GET", "/kol-studio/read.js", account=self.admin)
        self.assertEqual(status, 200)
        self.assertIn(b"'/kol-studio/api/state'", raw)
        self.assertNotIn(b"fetch('/api/state'", raw)
        status, raw, _ = self.request("GET", "/kol-studio/planner.js", account=self.admin)
        self.assertEqual(status, 200)
        self.assertNotIn(b"fetch('/api/history", raw)
        self.assertIn(b"/kol-studio/api/history", raw)

    def test_resources_manifest_paths_exist_and_match_whitelist(self):
        assets = [file for file in (DIST/"assets").rglob("*") if file.is_file()]
        self.assertGreater(len(assets), 1900)
        for asset in assets:
            relative = asset.relative_to(DIST).as_posix()
            self.assertTrue(ASSET.fullmatch(relative), relative)
        def values(value):
            if isinstance(value, str): yield value
            elif isinstance(value, list):
                for item in value: yield from values(item)
            elif isinstance(value, dict):
                for item in value.values(): yield from values(item)
        paths = set()
        for name in ("avatars.json", "research.json", "recent-works.json"):
            for value in values(json.loads((DIST/name).read_bytes())):
                if value.startswith("assets/"): paths.add(value.split("?",1)[0])
        for value in values(self.state()["state"]):
            if value.startswith("assets/"): paths.add(value.split("?",1)[0])
        self.assertGreater(len(paths), 900)
        for path in paths:
            self.assertTrue((DIST/path).is_file(), path)
            self.assertTrue(ASSET.fullmatch(path), path)
        avatar = next(file for file in assets if file.suffix == ".jpg")
        work = next(file for file in assets if file.suffix == ".json")
        for file in (avatar, work):
            status, body, _ = self.request("GET", "/kol-studio/"+file.relative_to(DIST).as_posix(), account=self.admin)
            self.assertEqual(status, 200)
            self.assertEqual(body, json.loads(file.read_bytes()) if file.suffix==".json" else file.read_bytes())

    def test_gzip_and_viewer_redaction(self):
        viewer = self.member("viewer")
        status, data, headers = self.request("GET", "/kol-studio/api/state", account=viewer, accept_gzip=True)
        self.assertEqual(status, 200)
        self.assertEqual(headers["Content-Encoding"], "gzip")
        self.assertEqual(len(data["state"]["kols"]), 963)
        self.assertEqual(len(data["state"]["ideas"]), 96)
        def assert_redacted(value):
            if isinstance(value, dict):
                self.assertFalse(set(value).intersection({"original","sourceSnapshot","sourceHTMLSha256","audit","localPath"}))
                for item in value.values(): assert_redacted(item)
            elif isinstance(value, list):
                for item in value: assert_redacted(item)
            elif isinstance(value, str):
                self.assertFalse(re.match(r"^(?:[A-Za-z]:[\\/]|\\\\)",value))
        assert_redacted(data["state"])

    def test_malformed_body_does_not_change_workspace(self):
        before = self.state()["version"]
        self.assertEqual(self.request("PUT", "/kol-studio/api/state", raw_body=b"{", account=self.admin)[0], 400)
        self.assertEqual(self.request("PUT", "/kol-studio/api/state", {}, account=self.admin,
                                      extra_headers={"Content-Type":"text/plain"})[0], 415)
        self.assertEqual(self.request("POST", "/mikoshi-api/auth/login", raw_body=b"x"*8193)[0], 413)
        self.assertEqual(self.state()["version"], before)

    def test_large_streamed_denied_uploads_return_json_and_keep_state(self):
        before=self.state()["version"]
        viewer=self.member('viewer')
        # Invalid business data is deliberate: denial must happen before parsing/saving it.
        body=b'{"padding":"'+b'x'*(2*1024*1024)+b'"}'
        for account,expected in ((None,401),(viewer,403)):
            status,data,_=self.request('PUT','/kol-studio/api/state',raw_body=body,account=account,stream_body=True)
            self.assertEqual(status,expected)
            self.assertIn('error',data)
        self.assertEqual(self.state()["version"],before)

    def test_declared_oversize_is_rejected_without_reading_unbounded_body(self):
        before=self.state()["version"]
        connection=http.client.HTTPConnection('127.0.0.1',self.port,timeout=3)
        try:
            connection.putrequest('PUT','/kol-studio/api/state')
            connection.putheader('Content-Type','application/json')
            connection.putheader('Content-Length',str(MAX_BODY+1))
            connection.endheaders()
            response=connection.getresponse()
            self.assertEqual(response.status,413)
            self.assertEqual(json.loads(response.read())['code'],'body_too_large')
        finally:
            connection.close()
        self.assertEqual(self.state()["version"],before)

    def test_slow_body_has_total_deadline_and_does_not_save(self):
        before=self.state()["version"]
        self.server.body_timeout=.25
        connection=http.client.HTTPConnection('127.0.0.1',self.port,timeout=3)
        try:
            connection.putrequest('PUT','/kol-studio/api/state')
            connection.putheader('Content-Type','application/json')
            connection.putheader('Content-Length','1000')
            connection.putheader('Cookie','mikoshi_session='+self.admin['cookie'])
            connection.putheader('Origin',self.origin)
            connection.putheader('X-CSRF-Token',self.admin['csrf'])
            connection.endheaders()
            started=time.monotonic()
            for _ in range(3):
                connection.send(b'x')
                time.sleep(.06)
            response=connection.getresponse()
            self.assertEqual(response.status,408)
            self.assertEqual(json.loads(response.read())['code'],'request_timeout')
            self.assertLess(time.monotonic()-started,2)
        finally:
            connection.close()
        self.assertEqual(self.state()["version"],before)

    def test_truncated_and_ambiguous_body_headers_do_not_save(self):
        before=self.state()["version"]
        for mode in ('truncated','duplicate-length','chunked'):
            connection=http.client.HTTPConnection('127.0.0.1',self.port,timeout=3)
            try:
                connection.putrequest('PUT','/kol-studio/api/state')
                connection.putheader('Content-Type','application/json')
                connection.putheader('Content-Length','1000')
                if mode=='duplicate-length': connection.putheader('Content-Length','2')
                if mode=='chunked': connection.putheader('Transfer-Encoding','chunked')
                connection.endheaders()
                if mode=='truncated':
                    connection.send(b'{}')
                    connection.sock.shutdown(socket.SHUT_WR)
                response=connection.getresponse()
                self.assertEqual(response.status,400)
                self.assertIn('error',json.loads(response.read()))
            finally:
                connection.close()
        self.assertEqual(self.state()["version"],before)


if __name__ == "__main__":
    unittest.main()

"""Portable fresh-clone checks against new local data, without production fixtures."""
import hashlib
import http.client
import json
import shutil
import threading
import unittest
import uuid
from pathlib import Path

from init_dev import initialize, ROOT
from server import make_server


class DevSetupTests(unittest.TestCase):
    def setUp(self):
        self.name = 'dev-test-' + uuid.uuid4().hex
        self.path = ROOT / '.local' / self.name

    def tearDown(self):
        if self.path.exists():
            if self.path.resolve().parent != (ROOT / '.local').resolve():
                raise AssertionError('Invalid test cleanup path')
            shutil.rmtree(self.path)

    def test_initialized_gateway_registration_and_empty_workspace(self):
        initialize(self.name)
        srv = make_server(0, self.path/'workspace.sqlite', self.path/'auth.sqlite', 'http://127.0.0.1')
        srv.origin = f'http://127.0.0.1:{srv.server_port}'
        thread = threading.Thread(target=srv.serve_forever, daemon=True)
        thread.start()
        connection = http.client.HTTPConnection('127.0.0.1', srv.server_port, timeout=10)
        try:
            connection.request('GET', '/kol-studio/api/state')
            result = connection.getresponse()
            self.assertEqual(result.status, 401)
            result.read()
            body = json.dumps({'email':'developer@example.invalid', 'displayName':'Local developer',
                'password':'Disposable-dev-test-2026', 'inviteCode':(self.path/'bootstrap-invite.txt').read_text().strip()})
            connection.request('POST', '/mikoshi-api/auth/register', body, {'Content-Type':'application/json', 'Origin':srv.origin})
            result = connection.getresponse()
            self.assertEqual(result.status, 200)
            cookie = result.getheader('Set-Cookie').split(';')[0]
            result.read()
            for endpoint in ('api/state', '', 'app.js', 'persistence.js', 'embedded.css', 'bridge.js'):
                connection.request('GET', '/kol-studio/' + endpoint, headers={'Cookie':cookie})
                result = connection.getresponse()
                self.assertEqual(result.status, 200, endpoint)
                raw = result.read()
                if endpoint == 'api/state':
                    self.assertEqual(json.loads(raw)['state']['kols'], [])
        finally:
            connection.close()
            srv.shutdown()
            srv.server_close()
            thread.join(timeout=5)

    def test_reinitialization_refuses_to_overwrite(self):
        initialize(self.name)
        before = {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in self.path.iterdir() if p.is_file()}
        with self.assertRaises(FileExistsError): initialize(self.name)
        self.assertEqual(before, {p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in self.path.iterdir() if p.is_file()})

    def test_reference_snapshot_and_path_boundary(self):
        with self.assertRaises(ValueError): initialize('../outside')
        initialize(self.name, reference_snapshot=True)
        from local_server import Store
        state = Store(self.path/'workspace.sqlite').get()['state']
        self.assertEqual((len(state['kols']), len(state['ideas'])), (963, 95))


if __name__ == '__main__': unittest.main()

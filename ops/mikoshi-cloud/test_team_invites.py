"""Long-lived team invitations; real isolated SQLite, no production accounts."""
from concurrent.futures import ThreadPoolExecutor
import unittest
import test_auth as identity_tests
from auth import AuthError, AuthStore

PASSWORD = identity_tests.PASSWORD

class TeamInviteTests(unittest.TestCase):
    setUp = identity_tests.AuthTests.setUp
    tearDown = identity_tests.AuthTests.tearDown
    request = identity_tests.AuthTests.request
    invitation = identity_tests.AuthTests.invitation

    def test_team_invite_multiple_members_then_revoke(self):
        invite = self.store.create_invite(self.admin, 'editor', 'team', reusable=True)
        self.assertIsNone(invite['invite']['expiresAt'])
        self.now += 365 * 86400
        for i in range(2):
            member, _ = self.store.register(f'member{i}@example.invalid', PASSWORD, '成员', invite['code'], 'test')
            self.assertEqual(member.role, 'editor')
        view = next(i for i in self.store.list_invites(self.admin)['items'] if i['id'] == invite['invite']['id'])
        self.assertEqual((view['status'], view['useCount']), ('active', 2))
        self.store.revoke_invite(self.admin, invite['invite']['id'])
        with self.assertRaises(AuthError):
            self.store.register('after@example.invalid', PASSWORD, '成员', invite['code'], 'test')
        member, _ = self.store.login('member0@example.invalid', PASSWORD, 'test')
        self.assertEqual(member.role, 'editor')  # Revocation never deletes registered people.

    def test_team_invite_parallel_consumption_and_duplicate_email_rollback(self):
        invite = self.store.create_invite(self.admin, 'viewer', reusable=True)
        def register(i):
            return self.store.register(f'parallel{i}@example.invalid', PASSWORD, '成员', invite['code'], f'peer{i}')[0].role
        with ThreadPoolExecutor(max_workers=4) as pool:
            self.assertEqual(list(pool.map(register, range(4))), ['viewer'] * 4)
        with self.assertRaises(AuthError):
            register(0)
        view = next(i for i in self.store.list_invites(self.admin)['items'] if i['id'] == invite['invite']['id'])
        self.assertEqual(view['useCount'], 4)

    def test_admin_and_non_boolean_reuse_rejected(self):
        for role, flag in [('admin', True), ('editor', 'true'), ('editor', 1)]:
            with self.assertRaises(AuthError):
                self.store.create_invite(self.admin, role, reusable=flag)

    def test_old_schema_migration_preserves_records_and_is_idempotent(self):
        fresh = self.invitation()
        with self.store.connect() as con:
            con.execute('ALTER TABLE invites DROP COLUMN reusable')
            con.execute('ALTER TABLE invites DROP COLUMN use_count')
            tables = ('users', 'sessions', 'audit', 'rate_limits')
            before = {table: [tuple(r) for r in con.execute(f'SELECT * FROM {table}')] for table in tables}
            old_columns = [r['name'] for r in con.execute('PRAGMA table_info(invites)')]
            old_invites = [tuple(r) for r in con.execute('SELECT * FROM invites ORDER BY id')]
        for _ in range(2):
            self.store = AuthStore(self.root / 'auth.sqlite', clock=lambda: self.now)
            with self.store.connect() as con:
                self.assertEqual(before, {table: [tuple(r) for r in con.execute(f'SELECT * FROM {table}')] for table in tables})
                self.assertEqual(old_invites, [tuple(r) for r in con.execute('SELECT '+','.join(old_columns)+' FROM invites ORDER BY id')])
                counts = [(r['bootstrap'], r['reusable'], r['use_count']) for r in con.execute('SELECT * FROM invites')]
                self.assertIn((1, 0, 1), counts)
                self.assertIn((0, 0, 0), counts)
        self.store.register('new@example.invalid', PASSWORD, '成员', fresh['code'], 'test')
        with self.assertRaises(AuthError):
            self.store.register('again@example.invalid', PASSWORD, '成员', fresh['code'], 'test')

    def test_team_invitation_http_contract(self):
        result = self.request('POST', '/auth/invites', {'role': 'editor', 'reusable': True}, token=self.admin_token, csrf=self.admin.csrf)
        self.assertEqual(result.status, 201)
        self.assertTrue(result.body['invite']['reusable'])
        self.assertEqual(result.body['invite']['useCount'], 0)
        self.assertIsNone(result.body['invite']['expiresAt'])


if __name__ == '__main__':
    unittest.main()

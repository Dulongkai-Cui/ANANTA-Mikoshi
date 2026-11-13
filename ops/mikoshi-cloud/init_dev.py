"""Initialize a NEW loopback development workspace. Never opens production databases."""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'Components/kol-selection/upstream'))
from local_server import Store, validate_plan
from auth import AuthStore


def initialize(name='dev', reference_snapshot=False):
    if not name or any(c not in 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_' for c in name):
        raise ValueError('Use a simple development workspace name (letters, digits, - or _).')
    target = ROOT / '.local' / name
    target.parent.mkdir(exist_ok=True)
    # Exclusive directory creation prevents retries from overwriting user data.
    target.mkdir(mode=0o700, exist_ok=False)
    if reference_snapshot:
        dist = ROOT / 'Components/kol-selection/upstream/dist'
        state = json.loads((dist / 'data.json').read_text(encoding='utf-8'))
        state['planner'] = json.loads((dist / 'planner-defaults.json').read_text(encoding='utf-8'))
    else:
        state = {
            'version': 1, 'updatedAt': datetime.now(timezone.utc).isoformat(),
            'kols': [], 'ideas': [], 'sources': [], 'relationships': [], 'budgets': [],
            'sellingPoints': [], 'dataNotes': ['Local development workspace; not production data.'],
            'audit': {}, 'planner': {'schema': 1, 'ideaIds': [], 'matches': [], 'nodes': [], 'events': []},
        }
    validate_plan(state)
    store = Store(target / 'workspace.sqlite')
    store.save({'version': None, 'state': state})
    auth = AuthStore(target / 'auth.sqlite')
    auth.bootstrap(target / 'bootstrap-invite.txt')
    return target


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--name', default='dev')
    parser.add_argument('--reference-snapshot', action='store_true', help='Use the old bundled 963 UP / 95 idea reference, NOT live cloud data.')
    args = parser.parse_args()
    try:
        target = initialize(args.name, args.reference_snapshot)
    except (FileExistsError, ValueError) as error:
        raise SystemExit(f'Initialization refused: {error}')
    print(f'Development workspace created: {target}')
    print('Read bootstrap-invite.txt locally to create your development administrator within 24 hours.')
    print('No password or invitation is printed. Never copy these files to GitHub or production.')

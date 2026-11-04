"""node-redis bridge for live_clients.py. Needs Node.js 18+ and npm, and network access to the npm registry."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

KEY = 'node_redis'
VERSION = '6.3.1'
HERE = Path(__file__).parent


def prepare(version, cache):
    d = Path(cache) / 'bridges' / f'node-redis-{version}'
    d.mkdir(parents=True, exist_ok=True)
    if not (d / 'node_modules' / 'redis').exists():
        (d / 'package.json').write_text('{"type":"module"}')
        sh('npm', 'install', '--no-audit', '--no-fund', '--cache', str(d / '.npm-cache'), f'redis@{version}', cwd=d)
    (d / 'probe.mjs').write_text((HERE / 'node_redis_probe.mjs').read_text())

    def run(port, user, password, mode, *payload):
        out = subprocess.run(['node', 'probe.mjs', str(port), user, password, mode, *payload], cwd=d,
                             capture_output=True, text=True, timeout=60, env=os.environ)
        return parse(out.stdout, out.stderr)
    return run

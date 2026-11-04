"""go-redis bridge for live_clients.py. Needs Go 1.24+, and network access to the Go module proxy."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

KEY = 'go_redis'
VERSION = '9.22.0'
HERE = Path(__file__).parent


def prepare(version, cache):
    d = Path(cache) / 'bridges' / f'go-redis-{version}'
    d.mkdir(parents=True, exist_ok=True)
    (d / 'go.mod').write_text(f'module probe\n\ngo 1.24\n\nrequire github.com/redis/go-redis/v9 v{version}\n')
    (d / 'main.go').write_text((HERE / 'go_redis_probe.go').read_text())
    sh('go', 'mod', 'tidy', cwd=d)
    sh('go', 'build', '-o', 'probe', '.', cwd=d)

    def run(port, user, password, mode, *payload):
        out = subprocess.run([str(d / 'probe'), str(port), user, password, mode, *payload],
                             capture_output=True, text=True, timeout=60, env=os.environ)
        return parse(out.stdout, out.stderr)
    return run

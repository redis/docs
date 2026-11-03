"""redis-rb bridge for live_clients.py. Needs Ruby 3.1+ and RubyGems, and network access to rubygems.org."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

KEY = 'redis_rb'
VERSION = '6.0.0'
HERE = Path(__file__).parent


def prepare(version, cache):
    d = Path(cache) / 'bridges' / f'redis-rb-{version}'
    d.mkdir(parents=True, exist_ok=True)
    env = {'GEM_HOME': str(d / 'gems'), 'GEM_PATH': str(d / 'gems')}
    if not (d / 'gems').exists():
        sh('gem', 'install', 'redis', '-v', version, '--no-document', '--install-dir', str(d / 'gems'), env=env)
    (d / 'probe.rb').write_text((HERE / 'redis_rb_probe.rb').read_text())

    def run(port, user, password, mode, *payload):
        out = subprocess.run(['ruby', 'probe.rb', str(port), user, password, mode, *payload], cwd=d,
                             capture_output=True, text=True, timeout=60, env={**os.environ, **env})
        return parse(out.stdout, out.stderr)
    return run

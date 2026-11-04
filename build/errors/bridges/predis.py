"""Predis bridge for live_clients.py. Needs PHP 8.1+ and Composer, and network access to Packagist."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

KEY = 'predis'
VERSION = '3.5.1'
HERE = Path(__file__).parent


def prepare(version, cache):
    d = Path(cache) / 'bridges' / f'predis-{version}'
    d.mkdir(parents=True, exist_ok=True)
    if not (d / 'vendor' / 'autoload.php').exists():
        sh('composer', 'require', '--no-interaction', '--no-progress', f'predis/predis:{version}', cwd=d)
    (d / 'probe.php').write_text((HERE / 'predis_probe.php').read_text())

    def run(port, user, password, mode, *payload):
        out = subprocess.run(['php', 'probe.php', str(port), user, password, mode, *payload], cwd=d,
                             capture_output=True, text=True, timeout=60, env=os.environ)
        return parse(out.stdout, out.stderr)
    return run

"""redis-rs bridges for live_clients.py. Needs Rust 1.88+ and Cargo, and network access to crates.io.
rust_sync.py and rust_async.py share this code."""
import os, subprocess
from pathlib import Path
from _common import parse, sh

HERE = Path(__file__).parent
VERSION = '1.6.0'

CARGO = '''[package]
name = "probe"
version = "0.1.0"
edition = "2021"

[dependencies]
redis = {{ version = "={v}", features = ["tokio-comp"] }}
tokio = {{ version = "1", features = ["rt-multi-thread", "macros"] }}
'''


def prepare_api(api, version, cache):
    d = Path(cache) / 'bridges' / f'redis-rs-{version}'
    (d / 'src').mkdir(parents=True, exist_ok=True)
    (d / 'Cargo.toml').write_text(CARGO.format(v=version))
    (d / 'src' / 'main.rs').write_text((HERE / 'rust_redis_src' / 'main.rs').read_text())
    sh('cargo', 'build', '--release', '--quiet', cwd=d)

    def run(port, user, password, mode, *payload):
        out = subprocess.run([str(d / 'target' / 'release' / 'probe'), api, str(port), user, password, mode, *payload],
                             capture_output=True, text=True, timeout=60, env=os.environ)
        return parse(out.stdout, out.stderr)
    return run

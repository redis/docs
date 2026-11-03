"""Run the checks of live_checks.py with another client library.

    python3 build/errors/live_clients.py jedis
    python3 build/errors/live_clients.py node_redis --version 6.3.1 --only standalone

It reproduces the same errors on the same throwaway Docker container as
live_checks.py, but sends each command through the client library of a bridge in
bridges/. It records the exception class and message that the client raises,
under the bridge's KEY, in client_baselines/<client>.json. It doesn't touch
live_baseline.json. data/client-exceptions.json is written by hand from the
result.
"""
import argparse, importlib.util, json, os, sys
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE)); sys.path.insert(0, str(HERE / 'bridges'))
import live_checks as lc
from _common import Bridge, ClientErr

CACHE = Path(os.environ.get('ERRORS_CACHE', Path.home() / '.cache' / 'redis-docs-errors'))


def load(name):
    spec = importlib.util.spec_from_file_location(name, HERE / 'bridges' / f'{name}.py')
    mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
    return mod


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('client', help='a bridge in build/errors/bridges/, such as jedis or node_redis')
    ap.add_argument('--version', help='the client version (default: the bridge\'s)')
    ap.add_argument('--image', default='redis:8.10', help='the Redis Docker image (default: redis:8.10)')
    ap.add_argument('--out', help='where to write the result (default: client_baselines/<client>.json)')
    ap.add_argument('--only', default='', help='comma-separated steps to run, such as standalone,cluster')
    a = ap.parse_args()

    bridge = load(a.client)
    version = a.version or bridge.VERSION
    Bridge.run = staticmethod(bridge.prepare(version, CACHE))

    def py_err(fn):
        try:
            fn(); return 'no error'
        except ClientErr as e:
            return f'{e.cls}: {e.msg}'

    lc.redis = None  # no redis-py: the result has only this client's names
    lc.client = lambda **kw: Bridge(**kw)
    lc.py_err = py_err
    lc.CLIENT_KEY = bridge.KEY
    lc.EXTRA_META = {bridge.KEY: version}
    out = Path(a.out) if a.out else HERE / 'client_baselines' / f'{a.client}.json'
    out.parent.mkdir(exist_ok=True)
    only = tuple(s for s in a.only.split(',') if s)
    result = lc.run(a.image, str(out), only=only)
    bad = result.get('_failures')
    print(f'\nWrote {out}' + (f'\nFAILED STEPS: {bad}' if bad else ''))


if __name__ == '__main__':
    main()

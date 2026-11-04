"""Run the checks of live_checks.py with another client library.

    python3 build/errors/live_clients.py jedis
    python3 build/errors/live_clients.py node_redis --version 6.3.1 --only standalone

It reproduces the same errors on the same throwaway Docker container as
live_checks.py, but sends each command through the client library of a bridge in
bridges/. It records the exception class and message that the client raises,
under the bridge's KEY, and lists the pages where they differ from
client_baselines/<client>.json. With --accept it saves the new run as that
baseline. It doesn't touch live_baseline.json. data/client-exceptions.json is
written by hand from the result, and `update_errors.py check` fails when it
disagrees with the baselines.
"""
import argparse, functools, importlib.util, json, os, sys
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
    ap.add_argument('--accept', action='store_true', help='save the run as client_baselines/<client>.json')
    ap.add_argument('--out', help='where to write the run (default: .errors-update/clients/<client>.json)')
    ap.add_argument('--only', default='', help='comma-separated steps to run, such as standalone,cluster')
    a = ap.parse_args()
    if a.only and a.accept:
        sys.exit('--accept needs a full run, because a page can span several steps. Leave out --only.')

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
    # A bridge can set environment variables for a step, such as ioredis, which waits
    # while the server is loading unless its ready check is off.
    for i, step in enumerate(lc.STEPS):
        env = getattr(bridge, 'STEP_ENV', {}).get(step.__name__)
        if env:
            lc.STEPS[i] = with_env(step, env)
    baseline_path = HERE / 'client_baselines' / f'{a.client}.json'
    out = Path(a.out) if a.out else baseline_path if a.accept else HERE.parents[1] / '.errors-update' / 'clients' / f'{a.client}.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    only = tuple(s for s in a.only.split(',') if s)
    old = baseline_path.read_text() if baseline_path.exists() else None
    result = lc.run(a.image, str(out), only=only)
    bad = result.get('_failures')
    if bad:
        if a.accept and old is not None: baseline_path.write_text(old)
        sys.exit(f'\nFAILED STEPS: {bad}\nThe baseline wasn\'t saved.')
    if only:
        sys.exit(f'\nWrote {out}. A run with --only isn\'t compared, because a page can span several steps.')
    changes = changed(json.loads(old), result, bridge.KEY) if old else []
    if old and not changes:
        print(f'\nEvery reply is the same as in {baseline_path.name}.')
    for page, what in changes:
        print(f'- common/{page}.md: {what}')
    if a.accept:
        print(f'\nSaved {baseline_path}. Update data/client-exceptions.json to match, then run '
              'python3 build/errors/update_errors.py check')
    elif changes or old is None:
        print(f'\nWrote {out}. Check data/client-exceptions.json, then save it with --accept.')


def with_env(step, env):
    """`step`, run with the environment variables `env` set."""
    @functools.wraps(step)
    def run():
        old = {k: os.environ.get(k) for k in env}
        os.environ.update(env)
        try:
            return step()
        finally:
            for k, v in old.items():
                if v is None: os.environ.pop(k, None)
                else: os.environ[k] = v
    return run


def changed(baseline, results, key):
    """The pages whose server reply or whose client's reply differs: [(page, what changed)]."""
    out = []
    for page in sorted((set(baseline) | set(results)) - {'_meta', '_failures'}):
        if page not in baseline or page not in results: continue
        for kind in ('raw', key):
            a, b = baseline[page].get(kind, []), results[page].get(kind, [])
            if lc._same(a) != lc._same(b):
                out.append((page, f'{kind}: was {str(a)[:200]!r}, now {str(b)[:200]!r}'))
    return out


if __name__ == '__main__':
    main()

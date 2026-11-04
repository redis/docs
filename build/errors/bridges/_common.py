"""The part of every client bridge that doesn't depend on the client library.

A bridge lets live_checks.py run its checks with another client library. The
checks call `client(...)` and `py_err(...)` as if the client were redis-py, so a
bridge offers the redis-py methods that the checks use, and turns each one into
a raw command for a small probe program written in the client's language. The
probe runs the command and prints what the client returns or raises.

A bridge module defines:

    KEY       the key the exceptions are recorded under, such as 'jedis'
    VERSION   the default client version
    prepare(version, cache)  installs the client and the probe (once), returns a
                             function run(port, user, password, mode, *payload)
                             that returns the probe's output, or raises ClientErr
"""
import os, subprocess

SEP = '\x01'


class ClientErr(Exception):
    """An error that the client raised: its class name and message."""
    def __init__(self, cls, msg):
        super().__init__(f'{cls}: {msg}')
        self.cls, self.msg = cls, msg


def parse(stdout, stderr=''):
    """The probe prints one line, `OK<TAB>value` or `EXC<TAB>class<TAB>message`."""
    lines = [l for l in stdout.splitlines() if l.startswith(('OK\t', 'EXC\t'))]
    if not lines:
        raise RuntimeError(f'the probe printed no result: {stdout!r} {stderr[-300:]!r}')
    parts = lines[-1].split('\t', 2)
    if parts[0] == 'EXC':
        raise ClientErr(parts[1], parts[2] if len(parts) > 2 else '')
    return parts[1]


def sh(*cmd, cwd=None, env=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env={**os.environ, **(env or {})}, timeout=900)
    if r.returncode:
        raise SystemExit(f'{" ".join(cmd[:3])} failed:\n{r.stdout[-800:]}\n{r.stderr[-800:]}')
    return r


def _a(x):
    # Binary arguments, such as the output of DUMP, travel as hex.
    return 'hex:' + x.hex() if isinstance(x, bytes) else str(x)


def pack(args):
    return SEP.join(_a(x) for x in args)


class Bridge:
    """The redis-py methods that live_checks.py calls, as raw commands."""
    run = None  # set by live_clients.py: run(port, user, password, mode, *payload)

    def __init__(self, port, username=None, password=None):
        self.port, self.user, self.pw = port, username or '', password or ''

    def execute_command(self, *args):
        return self.run(self.port, self.user, self.pw, 'cmd', pack(args))

    def get(self, k): return self.execute_command('GET', k)
    def set(self, k, v): return self.execute_command('SET', k, v)
    def ping(self): return self.execute_command('PING')
    def incr(self, k): return self.execute_command('INCR', k)
    def evalsha(self, sha, n): return self.execute_command('EVALSHA', sha, n)
    def restore(self, name, ttl, data): return self.execute_command('RESTORE', name, ttl, data)
    def xgroup_create(self, s, g, i, mkstream=False):
        return self.execute_command('XGROUP', 'CREATE', s, g, i, *(['MKSTREAM'] if mkstream else []))
    def xreadgroup(self, g, c, streams):
        return self.execute_command('XREADGROUP', 'GROUP', g, c, 'STREAMS', *streams.keys(), *streams.values())
    def mget(self, *keys): return self.execute_command('MGET', *keys)
    def mset(self, d): return self.execute_command('MSET', *[x for kv in d.items() for x in kv])
    def pipeline(self, transaction=True): return Tx(self)


class Tx:
    """A MULTI/EXEC block: the commands queue here, and execute() sends them."""
    def __init__(self, b): self.b, self.cmds = b, []
    def execute_command(self, *args): self.cmds.append(pack(args))
    def set(self, k, v): self.execute_command('SET', k, v)
    def execute(self): return self.b.run(self.b.port, self.b.user, self.b.pw, 'tx', *self.cmds)

"""Reproduce the errors that the error pages show, on a real Redis server.

For every page under content/develop/reference/errors/common/, this runs the
commands behind its examples and records the exact replies, plus what
redis-py raises when it's installed. update_errors.py verify compares the
replies with live_baseline.json, so a new release that changes a reply shows
up as a page to check.

Everything runs in one throwaway Docker container (the official redis image),
with several redis-server processes on ports 6550-6575 of 127.0.0.1.
"""
import json, re, socket, subprocess, threading, time

try:
    import redis
except ImportError:  # optional: without it, the redis-py exception names aren't recorded
    redis = None

C = 'redis-docs-error-checks'
CRUN = '/tmp/rerr'
PORTS = '127.0.0.1:6550-6575:6550-6575'
results = {}


class _Missing(Exception):
    pass


class _NoClient:
    def __getattr__(self, name):
        raise _Missing


def client(**kw):
    return redis.Redis(**kw) if redis else _NoClient()


def free(port):
    # Docker accepts connections on every published port, so ask for a reply.
    s = socket.socket(); s.settimeout(1)
    try:
        s.connect(('127.0.0.1', port)); s.sendall(b'PING\r\n')
        return not s.recv(64)
    except OSError:
        return True
    finally:
        s.close()


def dx(*args, user='redis'):
    return subprocess.run(['docker', 'exec', '-u', user, C, *args], check=True, capture_output=True, text=True)


def start(port, *args, dirname=None):
    assert free(port), f'port {port} in use'
    d = f'{CRUN}/{dirname or port}'
    dx('mkdir', '-p', d)
    dx('redis-server', '--port', str(port), '--daemonize', 'yes',
       '--save', '', '--dir', d,
       '--logfile', f'{CRUN}/{port}.log', '--pidfile', f'{CRUN}/{port}.pid', *args)
    for _ in range(100):
        if not free(port): return d
        time.sleep(0.05)
    raise RuntimeError(f'{port} did not start')


def stop(port, password=None):
    try:
        c = Conn(port)
        if password: c.cmd('AUTH', password)
        c.cmd('SHUTDOWN', 'NOSAVE')
    except Exception:
        pass


class Conn:
    def __init__(self, port):
        self.s = socket.create_connection(('127.0.0.1', port), timeout=10)
        self.f = self.s.makefile('rb')

    def send(self, *args):
        out = [b'*%d\r\n' % len(args)]
        for a in args:
            a = a if isinstance(a, bytes) else str(a).encode()
            out.append(b'$%d\r\n%s\r\n' % (len(a), a))
        self.s.sendall(b''.join(out))

    def read(self):
        line = self.f.readline()
        if not line: return None
        t, rest = line[:1], line[1:-2]
        if t in (b'+', b'-', b':'): return line[:-2].decode()
        if t == b'$':
            n = int(rest)
            if n < 0: return '$-1'
            data = self.f.read(n + 2)[:-2]
            return data
        if t == b'*':
            n = int(rest)
            return [self.read() for _ in range(max(n, 0))]
        return line.decode()

    def cmd(self, *args):
        self.send(*args)
        return self.read()


def rec(key, raw=None, py=None, note=None):
    r = results.setdefault(key, {})
    if raw is not None: r.setdefault('raw', []).append(raw)
    if py is not None: r.setdefault('redis_py', []).append(py)
    if note: r.setdefault('notes', []).append(note)
    print(key, raw, py, flush=True)


def py_err(fn):
    try:
        fn(); return 'no error'
    except _Missing:
        return None
    except Exception as e:
        return f'{type(e).__module__}.{type(e).__name__}: {e}'


def standalone():
    p = 6550
    start(p, '--enable-debug-command', 'yes')
    c = Conn(p); r = client(port=p)
    rec('err-unknown-command', c.cmd('FOO', 'bar'), py_err(lambda: r.execute_command('FOO', 'bar')))
    rec('err-unknown-command', c.cmd('FOO'))
    rec('err-unknown-command', c.cmd('CONFIG', 'FOO'))
    rec('err-wrong-number-of-arguments', c.cmd('GET'), py_err(lambda: r.execute_command('GET')))
    rec('err-wrong-number-of-arguments', c.cmd('CONFIG', 'GET'))
    rec('err-syntax-error', c.cmd('SET', 'k', 'v', 'NX', 'XX'), py_err(lambda: r.execute_command('SET', 'k', 'v', 'NX', 'XX')))
    c.cmd('SET', 'n', 'abc')
    rec('err-not-an-integer', c.cmd('INCR', 'n'), py_err(lambda: r.incr('n')))
    rec('err-not-an-integer', c.cmd('EXPIRE', 'n', 'ten'))
    c.cmd('SET', 'f', '1.5')
    rec('err-not-an-integer', c.cmd('INCR', 'f'), note='INCR on 1.5')
    c.cmd('SET', 'big', '9223372036854775807')
    rec('err-not-an-integer', c.cmd('INCR', 'big'), note='INCR on int64 max')
    rec('err-not-an-integer', c.cmd('INCRBYFLOAT', 'n', '1'), note='INCRBYFLOAT on abc')
    c.cmd('RPUSH', 'l', 'a')
    rec('wrongtype', c.cmd('GET', 'l'), py_err(lambda: r.get('l')))
    rec('wrongtype', c.cmd('HGET', 'l', 'f'))
    rec('wrongtype', c.cmd('TYPE', 'l'), note='TYPE')
    # Transactions
    c.cmd('MULTI')
    rec('execabort', c.cmd('FOO'), note='queued unknown command')
    c.cmd('SET', 'a', '1')
    rec('execabort', c.cmd('EXEC'))
    def tx():
        p_ = r.pipeline(transaction=True)
        p_.execute_command('FOO'); p_.set('a', '1'); p_.execute()
    rec('execabort', py=py_err(tx))
    c.cmd('MULTI')
    c.cmd('INCR', 'n')
    rec('execabort', c.cmd('EXEC'), note='runtime error in EXEC: no abort, reply array')
    c.cmd('MULTI')
    rec('execabort', c.cmd('GET'), note='wrong arity while queuing')
    rec('execabort', c.cmd('EXEC'))
    # Scripts
    rec('noscript', c.cmd('EVALSHA', 'f' * 40, '0'), py_err(lambda: r.evalsha('f' * 40, 0)))
    rec('noscript', c.cmd('EVALSHA_RO', 'f' * 40, '0'))
    # RESTORE
    c.cmd('SET', 'bk', 'v')
    dump = c.cmd('DUMP', 'bk')
    rec('busykey', c.cmd('RESTORE', 'bk', '0', dump), py_err(lambda: r.restore('bk', 0, dump)))
    rec('busykey', note=f"RESTORE REPLACE -> {c.cmd('RESTORE', 'bk', '0', dump, 'REPLACE')}")
    # Streams
    rec('busygroup', note=f"first create -> {c.cmd('XGROUP', 'CREATE', 's', 'g', '$', 'MKSTREAM')}")
    rec('busygroup', c.cmd('XGROUP', 'CREATE', 's', 'g', '$', 'MKSTREAM'), py_err(lambda: r.xgroup_create('s', 'g', '$', mkstream=True)))
    rec('nogroup', c.cmd('XREADGROUP', 'GROUP', 'nog', 'c1', 'STREAMS', 's', '>'), py_err(lambda: r.xreadgroup('nog', 'c1', {'s': '>'})))
    rec('nogroup', c.cmd('XREADGROUP', 'GROUP', 'g', 'c1', 'STREAMS', 'missing', '>'), note='missing key')
    rec('nogroup', c.cmd('XGROUP', 'CREATECONSUMER', 's', 'nog', 'c1'))
    rec('nogroup', c.cmd('XPENDING', 's', 'nog'))
    rec('nogroup', c.cmd('XCLAIM', 's', 'nog', 'c1', '0', '0-1'))
    rec('nogroup', c.cmd('XGROUP', 'CREATE', 'missing', 'g', '$'), note='create on missing key without MKSTREAM')
    rec('nogroup', c.cmd('XGROUP', 'SETID', 's', 'nog', '$'))
    # AUTH with no password set
    rec('wrongpass', c.cmd('AUTH', 'secret'), py_err(lambda: r.execute_command('AUTH', 'secret')), note='AUTH when no password configured')
    # OOM: a limit a little below the memory in use, so that removing keys can make room.
    c.cmd('DEBUG', 'POPULATE', '10000')
    used = int(re.search(rb'used_memory:(\d+)', c.cmd('INFO', 'memory')).group(1))
    c.cmd('CONFIG', 'SET', 'maxmemory', str(used - 100_000))
    rec('oom', c.cmd('SET', 'o', 'v'), py_err(lambda: r.set('o', 'v')))
    rec('oom', note=f"GET while over maxmemory -> {c.cmd('GET', 'bk')}")
    rec('oom', note=f"DEL while over maxmemory -> {c.cmd('DEL', 'bk')}")
    rec('oom', note=f"policy -> {c.cmd('CONFIG', 'GET', 'maxmemory-policy')}")
    c.cmd('CONFIG', 'SET', 'maxmemory-policy', 'volatile-lru')
    rec('oom', note=f"volatile-lru SET with no TTL keys -> {c.cmd('SET', 'o2', 'v')}")
    c.cmd('CONFIG', 'SET', 'maxmemory-policy', 'allkeys-lru')
    rec('oom', note=f"allkeys-lru SET -> {c.cmd('SET', 'o', 'v')}")
    c.cmd('CONFIG', 'SET', 'maxmemory', '0'); c.cmd('CONFIG', 'SET', 'maxmemory-policy', 'noeviction')
    # BUSY: Lua script
    c.cmd('CONFIG', 'SET', 'busy-reply-threshold', '200')
    def long_running(*args):
        lc = Conn(p); box = {}
        def run(): box['reply'] = lc.cmd(*args)
        t = threading.Thread(target=run); t.start(); time.sleep(0.6)
        return t, box
    t, box = long_running('EVAL', 'while true do end', '0')
    rec('busy', c.cmd('GET', 'k'), py_err(lambda: r.get('k')))
    rec('busy', note=f"PING during busy -> {c.cmd('PING')}")
    rec('busy', note=f"SCRIPT KILL -> {c.cmd('SCRIPT', 'KILL')}")
    t.join(5); rec('busy', note=f"script caller got -> {box.get('reply')}")
    c.cmd('FUNCTION', 'LOAD', "#!lua name=lib\nredis.register_function('spin', function() while true do end end)")
    t, box = long_running('FCALL', 'spin', '0')
    rec('busy', c.cmd('GET', 'k'), note='function')
    rec('busy', note=f"SCRIPT KILL on function -> {c.cmd('SCRIPT', 'KILL')}")
    rec('busy', note=f"FUNCTION KILL -> {c.cmd('FUNCTION', 'KILL')}")
    t.join(5); rec('busy', note=f"function caller got -> {box.get('reply')}")
    t, box = long_running('EVAL', "redis.call('set','x','1') while true do end", '0')
    rec('busy', note=f"SCRIPT KILL after a write -> {c.cmd('SCRIPT', 'KILL')}")
    rec('busy', note=f"SHUTDOWN NOSAVE -> {c.cmd('SHUTDOWN', 'NOSAVE')}")
    t.join(5)


def maxclients():
    p = 6557
    start(p, '--maxclients', '1')
    # The last connection of start() may still hold the only slot, so try until this one has it.
    for _ in range(50):
        try:
            keep = Conn(p)
            if keep.cmd('PING') == '+PONG': break
        except OSError:
            pass
        time.sleep(0.05)
    else:
        raise RuntimeError(f'{p} never accepted a first client')
    c = Conn(p)
    rec('err-max-clients', c.read())
    rec('err-max-clients', py=py_err(lambda: client(port=p).ping()))
    keep.cmd('SHUTDOWN', 'NOSAVE')


def noreplicas():
    p = 6558
    start(p, '--min-replicas-to-write', '1')
    c = Conn(p); r = client(port=p)
    rec('noreplicas', c.cmd('SET', 'a', '1'), py_err(lambda: r.set('a', '1')))
    rec('noreplicas', note=f"GET -> {c.cmd('GET', 'a')}")
    c.cmd('SHUTDOWN', 'NOSAVE')


def misconf():
    p = 6559
    start(p, '--save', '3600 1', dirname='ro')
    dx('chmod', '555', f'{CRUN}/ro')
    c = Conn(p); r = client(port=p)
    c.cmd('BGSAVE'); time.sleep(1.5)
    rec('misconf', c.cmd('SET', 'a', '1'), py_err(lambda: r.set('a', '1')))
    rec('misconf', note=f"GET -> {c.cmd('GET', 'a')}")
    info = c.cmd('INFO', 'persistence').decode()
    rec('misconf', note=[l for l in info.split('\r\n') if 'bgsave' in l])
    log = dx('cat', f'{CRUN}/{p}.log').stdout
    line = next((l[l.index('Failed opening'):] for l in log.splitlines() if 'Failed opening the temp RDB file' in l), None)
    rec('misconf', note=f'log -> {line}')
    dx('chmod', '755', f'{CRUN}/ro')
    c.cmd('SHUTDOWN', 'NOSAVE')


def security():
    p = 6560
    start(p, '--requirepass', 'secret')
    c = Conn(p)
    rec('noauth', c.cmd('GET', 'a'), py_err(lambda: client(port=p).get('a')))
    rec('noauth', note=f"PING before AUTH -> {c.cmd('PING')}")
    rec('wrongpass', c.cmd('AUTH', 'wrong'), py_err(lambda: client(port=p, password='wrong').get('a')))
    rec('wrongpass', c.cmd('AUTH', 'nosuchuser', 'wrong'), note='unknown user')
    c.cmd('AUTH', 'secret')
    c.cmd('ACL', 'SETUSER', 'app', 'on', '>apppw', '+ping', '+get', '~allowed:*')
    c.cmd('ACL', 'SETUSER', 'off-user', 'off', '>offpw', '+@all', '~*')
    rec('wrongpass', Conn(p).cmd('AUTH', 'off-user', 'offpw'), note='disabled user')
    a = Conn(p); a.cmd('AUTH', 'app', 'apppw')
    ra = client(port=p, username='app', password='apppw')
    rec('noperm', a.cmd('SET', 'allowed:1', 'x'), py_err(lambda: ra.set('allowed:1', 'x')))
    rec('noperm', a.cmd('GET', 'other'), py_err(lambda: ra.get('other')))
    # Only the fields of each ACL LOG entry that the page names, as the others change between releases.
    named = (b'username', b'reason', b'object')
    rec('noperm', note=[{k.decode(): v.decode() for k, v in zip(e[::2], e[1::2]) if k in named}
                        for e in c.cmd('ACL', 'LOG', '2')])
    c.cmd('SHUTDOWN', 'NOSAVE')


def denied():
    # Protected mode refuses a connection from outside the container when there's no password.
    p = 6565
    start(p, '--protected-mode', 'yes')
    rec('denied', Conn(p).cmd('PING'), py_err(lambda: client(port=p).ping()))
    stop_from_inside(p)


def stop_from_inside(port):
    # The server refuses connections from outside, so shut it down from inside the container.
    subprocess.run(['docker', 'exec', '-u', 'redis', C, 'redis-cli', '-p', str(port), 'SHUTDOWN', 'NOSAVE'],
                   capture_output=True)


def replication():
    m, rp, md = 6562, 6561, 6563
    start(m); start(rp, '--replicaof', '127.0.0.1', str(m))
    time.sleep(1.5)
    c = Conn(rp); r = client(port=rp)
    rec('readonly', c.cmd('SET', 'a', '1'), py_err(lambda: r.set('a', '1')))
    rec('readonly', note=f"GET on replica -> {c.cmd('GET', 'a')}")
    rec('readonly', note=f"replica-read-only -> {c.cmd('CONFIG', 'GET', 'replica-read-only')}")
    start(md, '--replicaof', '127.0.0.1', '6499', '--replica-serve-stale-data', 'no')
    time.sleep(0.5)
    c = Conn(md); r = client(port=md)
    rec('masterdown', c.cmd('GET', 'a'), py_err(lambda: r.get('a')))
    info = c.cmd('INFO', 'replication').decode()
    rec('masterdown', note=[l for l in info.split('\r\n') if l.startswith(('master_host:', 'master_port:', 'master_link_status:'))])
    for p in (rp, m, md): stop(p)


def loading():
    p = 6564
    d = start(p, '--enable-debug-command', 'yes')
    c = Conn(p)
    c.cmd('DEBUG', 'POPULATE', '30000')
    c.cmd('SAVE'); c.cmd('SHUTDOWN', 'NOSAVE')
    time.sleep(0.5)
    # At 200 microseconds a key, loading takes at least 6 seconds, and about 30 on
    # Docker Desktop, where short sleeps last longer. By default the server answers
    # commands only every 512 KB of the file, which is once for this file, so it
    # also answers every 1 KB. SHUTDOWN works while loading.
    dx('redis-server', '--port', str(p), '--daemonize', 'yes', '--save', '', '--dir', d,
       '--logfile', f'{CRUN}/{p}.log', '--pidfile', f'{CRUN}/{p}.pid', '--key-load-delay', '200',
       '--loading-process-events-interval-bytes', '1024')
    reply = None
    for _ in range(200):
        try:
            c = Conn(p); reply = c.cmd('GET', 'key:1')
            if isinstance(reply, str) and reply.startswith('-LOADING'): break
        except OSError:
            pass
        time.sleep(0.02)
    else:
        raise RuntimeError(f'never saw LOADING, last reply {reply!r}')
    py = py_err(lambda: client(port=p).get('key:1'))
    ping = c.cmd('PING')
    info = c.cmd('INFO', 'persistence')
    lines = [l for l in info.decode().split('\r\n') if l.startswith('loading')] if isinstance(info, bytes) else info
    # Every reply must come from the same load, or they contradict each other.
    if 'loading:1' not in lines:
        raise RuntimeError(f'loading finished during the check: {lines!r}')
    rec('loading', reply, py)
    rec('loading', note=f'PING while loading -> {ping}')
    rec('loading', note=lines)
    stop(p)


def cluster():
    ports = [6571, 6572, 6573]
    for p in ports:
        start(p, '--cluster-enabled', 'yes', '--cluster-config-file', f'nodes-{p}.conf',
              '--cluster-node-timeout', '2000')
    dx('redis-cli', '--cluster', 'create', *[f'127.0.0.1:{p}' for p in ports], '--cluster-replicas', '0', '--cluster-yes')
    for _ in range(100):
        if all(b'cluster_state:ok' in Conn(p).cmd('CLUSTER', 'INFO') for p in ports): break
        time.sleep(0.1)
    else:
        raise RuntimeError('the cluster never reached cluster_state:ok')
    conns = {p: Conn(p) for p in ports}
    ids = {p: conns[p].cmd('CLUSTER', 'MYID').decode() for p in ports}
    slot = int(conns[6571].cmd('CLUSTER', 'KEYSLOT', 'foo')[1:])
    # The key doesn't exist, so only the node that serves its slot replies with nil.
    owner = next((p for p in ports if conns[p].cmd('GET', 'foo') == '$-1'), None)
    if owner is None:
        raise RuntimeError('no node serves the slot of foo')
    other = next(p for p in ports if p != owner)
    r_other = client(port=other)
    rec('moved', conns[other].cmd('GET', 'foo'), py_err(lambda: r_other.get('foo')))
    rec('crossslot', conns[owner].cmd('MSET', 'a', '1', 'b', '2'), py_err(lambda: client(port=owner).mset({'a': '1', 'b': '2'})))
    rec('crossslot', conns[owner].cmd('MGET', 'user:1', 'user:2'))
    rec('crossslot', note=f"KEYSLOT user:1 {conns[owner].cmd('CLUSTER', 'KEYSLOT', 'user:1')} user:2 {conns[owner].cmd('CLUSTER', 'KEYSLOT', 'user:2')} {{user}}:1 {conns[owner].cmd('CLUSTER', 'KEYSLOT', '{user}:1')} {{user}}:2 {conns[owner].cmd('CLUSTER', 'KEYSLOT', '{user}:2')}")
    for p in ports:
        reply = conns[p].cmd('MSET', '{user}:1', 'a', '{user}:2', 'b')
        if reply == '+OK':
            rec('crossslot', note=f'MSET {{user}}:1 {{user}}:2 on owner -> {reply}')
    # Migration: ASK and TRYAGAIN
    conns[owner].cmd('SET', '{foo}a', '1')
    conns[other].cmd('CLUSTER', 'SETSLOT', str(slot), 'IMPORTING', ids[owner])
    conns[owner].cmd('CLUSTER', 'SETSLOT', str(slot), 'MIGRATING', ids[other])
    r_owner = client(port=owner)
    rec('ask', conns[owner].cmd('GET', '{foo}missing'), py_err(lambda: r_owner.get('{foo}missing')))
    rec('ask', note=f"GET existing key on source -> {conns[owner].cmd('GET', '{foo}a')}")
    rec('ask', note=f"GET on target without ASKING -> {conns[other].cmd('GET', '{foo}missing')}")
    t = Conn(other)
    rec('ask', note=f"ASKING then GET on target -> {t.cmd('ASKING')} {t.cmd('GET', '{foo}missing')}")
    rec('tryagain', conns[owner].cmd('MGET', '{foo}a', '{foo}missing'), py_err(lambda: r_owner.mget('{foo}a', '{foo}missing')))
    for p in (owner, other): conns[p].cmd('CLUSTER', 'SETSLOT', str(slot), 'NODE', ids[owner])
    # CLUSTERDOWN: lone cluster node with no slots
    lone = 6574
    start(lone, '--cluster-enabled', 'yes', '--cluster-config-file', f'nodes-{lone}.conf')
    rec('clusterdown', Conn(lone).cmd('GET', 'foo'), py_err(lambda: client(port=lone).get('foo')))
    stop(lone)
    # CLUSTERDOWN: a primary fails
    victim = next(p for p in ports if p != owner)
    stop(victim)
    for _ in range(150):
        reply = Conn(owner).cmd('GET', 'foo')
        if isinstance(reply, str) and reply.startswith('-CLUSTERDOWN'):
            rec('clusterdown', reply, py_err(lambda: client(port=owner).get('foo')))
            break
        time.sleep(0.1)
    else:
        rec('clusterdown', note='never saw cluster down')
    rec('clusterdown', note=f"CLUSTER INFO state -> {[l for l in Conn(owner).cmd('CLUSTER', 'INFO').decode().split(chr(13)+chr(10)) if 'state' in l]}")
    for p in ports: stop(p)


STEPS = [standalone, maxclients, noreplicas, misconf, security, denied, replication, loading, cluster]


def run(image, out, only=()):
    """Run every step on `image` and write the replies to `out`. Returns them."""
    results.clear()
    if subprocess.run(['docker', 'info'], capture_output=True).returncode:
        raise SystemExit('Docker isn\'t running. Start Docker Desktop, then run this step again.')
    subprocess.run(['docker', 'rm', '-f', C], capture_output=True)
    started = subprocess.run(['docker', 'run', '-d', '--rm', '--name', C, '-p', PORTS, '--entrypoint', 'sleep',
                              image, 'infinity'], capture_output=True, text=True)
    if started.returncode:
        raise SystemExit(f'Couldn\'t start {image}: {started.stderr.strip()}\n'
                         'Check that the version exists on Docker Hub, and that ports 6550-6575 are free.')
    try:
        dx('mkdir', '-p', CRUN, user='root'); dx('chown', 'redis', CRUN, user='root')
        ver = dx('redis-server', '--version').stdout.strip()
        results['_meta'] = {'redis': ver, 'redis_py': redis.__version__ if redis else None,
                            'date': time.strftime('%Y-%m-%d')}
        for step in STEPS:
            if only and step.__name__ not in only: continue
            try:
                step()
            except Exception as e:
                rec('_failures', note=f'{step.__name__}: {type(e).__name__}: {e}')
    finally:
        subprocess.run(['docker', 'rm', '-f', C], capture_output=True)
    text = json.dumps(results, indent=2, ensure_ascii=False,
                      default=lambda b: b.decode(errors='replace') if isinstance(b, bytes) else str(b))
    open(out, 'w').write(text + '\n')
    return json.loads(text)


def _same(v):
    """A reply with its numbers, such as ports, IDs and timings, blanked out.

    Random hex IDs, such as the replication ID in INFO, go first, because
    they mix digits and letters. A timing can be 0 in one run and 0.001 in
    the next, so a number with a decimal point is one number."""
    return re.sub(r'\d+(\.\d+)*', '#', re.sub(r'\b[0-9a-f]{40}\b', '<id>', json.dumps(v, sort_keys=True)))


def unrecorded(baseline, results):
    """The pages that have a check but no baseline yet, such as a new page's."""
    return sorted(set(results) - set(baseline) - {'_meta', '_failures'})


def compare(baseline, results):
    """The pages whose replies differ: [(page, what changed)].

    Server replies and notes always count. redis-py names count only when both
    runs recorded them, as a run without redis-py installed has none. Pages
    with no baseline yet have nothing to compare with, so they're skipped."""
    changes = []
    skip = unrecorded(baseline, results)
    for page in sorted(set(baseline) | set(results)):
        if page == '_meta' or page in skip: continue
        old, new = baseline.get(page, {}), results.get(page, {})
        kinds = ['raw', 'notes'] + (['redis_py'] if baseline['_meta'].get('redis_py') and results['_meta'].get('redis_py') else [])
        for kind in kinds:
            a, b = old.get(kind, []), new.get(kind, [])
            if _same(a) == _same(b): continue
            if len(a) != len(b):
                changes.append((page, f'{kind}: {len(a)} replies in the baseline, {len(b)} now: {b}'))
                continue
            for x, y in zip(a, b):
                if _same(x) != _same(y):
                    changes.append((page, f'{kind}: was {str(x)[:200]!r}, now {str(y)[:200]!r}'))
    return changes

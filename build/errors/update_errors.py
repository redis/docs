#!/usr/bin/env python3
"""Keep the Redis error reference up to date with new Redis releases.

The error reference (content/develop/reference/errors/) shows every error
message in data/errors.json. This tool compares the source code of the
release the data was made from with a newer release, and lists what changed.
Deciding what a new message means takes judgment, so a person or an AI agent
fills in a work file, and the tool merges it back into the data.

    python3 build/errors/update_errors.py diff [VERSION]   compare with a release (default: the latest)
    python3 build/errors/update_errors.py apply            merge the filled-in work file into the data
    python3 build/errors/update_errors.py check            check the data and the pages (offline)
    python3 build/errors/update_errors.py verify VERSION   rerun the error pages' examples in Docker

See build/errors/README.md for the whole procedure.
"""

import argparse
import bisect
import difflib
import functools
import io
import json
import os
import re
import subprocess
import sys
import tarfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DATA = ROOT / 'data' / 'errors.json'
PAGES = ROOT / 'content' / 'develop' / 'reference' / 'errors'
WORK = ROOT / '.errors-update'
CACHE = Path(os.environ.get('ERRORS_CACHE', Path.home() / '.cache' / 'redis-docs-errors'))

# Repositories, keyed as in the "versions" of data/errors.json: the git URL, the
# module's name in modules/modules.yaml of the Redis repo, the folders to scan,
# and the data modules whose messages come from it.
REPOS = {
    'redis': ('https://github.com/redis/redis.git', None, ['src/', 'modules/vector-sets/'], ['core', 'vectorset']),
    'search': ('https://github.com/RediSearch/RediSearch.git', 'redisearch', ['src/'], ['search']),
    'json': ('https://github.com/RedisJSON/RedisJSON.git', 'redisjson', ['redis_json/', 'json_path/'], ['json']),
    'bloom': ('https://github.com/RedisBloom/RedisBloom.git', 'redisbloom', ['src/'], ['bloom']),
    'timeseries': ('https://github.com/RedisTimeSeries/RedisTimeSeries.git', 'redistimeseries', ['src/'], ['timeseries']),
}
REPO_OF = {m: name for name, (_, _, _, mods) in REPOS.items() for m in mods}

# Each data module's list page, as in layouts/partials/errors/catalog.html.
LIST_PAGES = {'core': 'redis', 'vectorset': 'vector-sets', 'search': 'search',
              'json': 'json', 'bloom': 'probabilistic', 'timeseries': 'time-series'}

BASES = ('source', 'tested', 'inferred')
SCAN_VERSION = 2
MIN_ANCHOR = 10


def log(*args):
    print(*args, file=sys.stderr, flush=True)


def git(repo, *args, binary=False):
    out = subprocess.run(['git', '-C', str(repo), *args], capture_output=True, check=True)
    return out.stdout if binary else out.stdout.decode('utf-8', 'replace')


# --- Releases and sources ---------------------------------------------------

def release_tags():
    """The Redis release tags, oldest first, such as 8.10.3. No release candidates."""
    out = subprocess.run(['git', 'ls-remote', '--tags', '--refs', REPOS['redis'][0]],
                         capture_output=True, text=True, check=True).stdout
    tags = re.findall(r'refs/tags/(\d+\.\d+\.\d+)$', out, re.M)
    return sorted(set(tags), key=lambda t: tuple(map(int, t.split('.'))))


def fetch(name, tag):
    """A local clone of repository `name` that has `tag`, fetched shallowly."""
    repo = CACHE / name
    if not (repo / '.git').exists():
        repo.mkdir(parents=True, exist_ok=True)
        git(repo, 'init', '-q')
        git(repo, 'remote', 'add', 'origin', REPOS[name][0])
    try:
        git(repo, 'rev-parse', '-q', '--verify', f'refs/tags/{tag}^{{commit}}')
    except subprocess.CalledProcessError:
        log(f'Fetching {name} {tag}...')
        for attempt in (1, 2):
            try:
                git(repo, 'fetch', '-q', '--depth', '1', 'origin', 'tag', tag)
                break
            except subprocess.CalledProcessError as e:
                if attempt == 2:
                    sys.exit(f'Couldn\'t fetch {name} {tag} from {REPOS[name][0]}:\n{e.stderr.decode().strip()}')
                time.sleep(3)
    return repo


def module_refs(redis_tag):
    """The module tags that a Redis release bundles, such as {'search': 'v8.10.1'}."""
    repo = fetch('redis', redis_tag)
    refs = {}
    try:
        manifest = git(repo, 'show', f'{redis_tag}:modules/modules.yaml')
        for block in re.split(r'\n\s*-\s+name:\s*', manifest)[1:]:
            mod = block.split()[0]
            ref = re.search(r'^\s*ref:\s*(\S+)', block, re.M)
            if ref: refs[mod] = ref.group(1)
    except subprocess.CalledProcessError:
        pass  # Before 8.10, each module's Makefile has the version.
    out = {}
    for name, (_, yaml_name, _, _) in REPOS.items():
        if not yaml_name: continue
        ref = refs.get(yaml_name)
        if not ref:
            makefile = git(repo, 'show', f'{redis_tag}:modules/{yaml_name}/Makefile')
            ref = re.search(r'^MODULE_VERSION\s*=\s*(\S+)', makefile, re.M).group(1)
        out[name] = ref
    return out


def tag_of(name, version):
    """The git tag of a version as data/errors.json stores it: 8.10.1 -> v8.10.1 for modules."""
    return version if name == 'redis' else 'v' + version.lstrip('v')


# --- Reading string literals -----------------------------------------------

C_TOKENS = re.compile(r'//[^\n]*|/\*.*?\*/|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\\n])\'', re.S)
RS_TOKENS = re.compile(r'//[^\n]*|/\*.*?\*/|\br(#*)"[\s\S]*?"\1|"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\\n])\'', re.S)
C_GAP = re.compile(r'(?:\s|/\*.*?\*/|//[^\n]*\n|PRI[a-zA-Z0-9]+)*', re.S)
ESCAPES = re.compile(r'\\(\n\s*|x[0-9a-fA-F]{2}|u\{[0-9a-fA-F]+\}|.)', re.S)
PRINTF = re.compile(r'%(?:[-+ #0]*(?:\*|\d+)?(?:\.(?:\*|\d+))?(?:hh|h|ll|l|L|z|j|t|q)?[diouxXeEfFgGaAcspnSIU])')
RUST_FMT = re.compile(r'\{[^{}]*\}')
PLACEHOLDER = re.compile(r'<[^<>\n]{1,40}>')
SOURCE_FILE = re.compile(r'\.(c|h|cc|cpp|rs)$')
# Tests, and the command-line tools that ship with Redis: their messages aren't server replies.
SKIP_PATH = re.compile(r'(^|/)(tests?|benches?|fuzz|examples?|deps|vendor)/|(^|/)test_|_tests?\.(c|h|cc|cpp|rs)$|'
                       r'(^|/)(redis-cli|redis-benchmark|redis-check-aof|redis-check-rdb|cli_common|cli_commands)\.c$')
# Code (comments and strings removed) that sends or sets an error, and code that only logs.
ERROR_CODE = re.compile(r'(?i)err|bail')
LOG_CODE = re.compile(r'serverLog|serverPanic|serverAssert|RedisModule_Log|printf|\bLOG_|RS_LOG|_LOG\b|#\s*(error|warning)\b|'
                      r'\b(debug|info|warn|trace|error|panic|assert|assert_eq|unreachable|todo)!|\bassert|RS_ASSERT')


def unescape(body, rust):
    def one(m):
        e = m.group(1)
        if e[0] == '\n': return '' if rust else e[1:]
        if e[0] == 'x': return chr(int(e[1:], 16))
        if e[0] == 'u': return chr(int(e[2:-1], 16))
        return {'n': '\n', 't': '\t', 'r': '', '0': '', 'a': '', 'b': '', 'e': '', 'f': '', 'v': ''}.get(e, e)
    return ESCAPES.sub(one, body)


def normalize(text, rust=False, message=False):
    """Text with the parts that change replaced by \\0 and runs of white space by one space.

    Source strings use printf formats (or Rust {} formats); messages in the
    data use <placeholders>."""
    if message:
        text = PLACEHOLDER.sub('\0', text)
    else:
        text = PRINTF.sub('\0', text).replace('%%', '%')
        if rust:
            text = RUST_FMT.sub('\0', text.replace('{{', '\1').replace('}}', '\2')).replace('\1', '{').replace('\2', '}')
    return re.sub(r'\s+', ' ', text).strip()


def literals(text, rust):
    """Each string literal in a source file: (line, normalized value, error), in order.

    Adjacent C literals are joined, as the compiler does. `error` is true when
    the code just before the literal sends or sets an error, rather than logging."""
    tokens = list((RS_TOKENS if rust else C_TOKENS).finditer(text))
    starts = [m.start() for m in re.finditer(r'\n', text)]
    code = list(text)
    for m in tokens:  # blank comments and strings, keeping line breaks
        for i in range(m.start(), m.end()):
            if code[i] != '\n': code[i] = ' '
    code_lines = ''.join(code).split('\n')
    out = []
    i = 0
    while i < len(tokens):
        m = tokens[i]
        s = m.group(0)
        i += 1
        if s.startswith(('/', "'")):
            continue
        raw = m.group(0)
        if raw.startswith('r'):
            body = raw[raw.index('"') + 1:-(len(m.group(1) or '') + 1)]
        else:
            body = unescape(raw[1:-1], rust)
        end = m.end()
        while not rust and i < len(tokens) and tokens[i].group(0).startswith('"'):
            gap = text[end:tokens[i].start()]
            if not C_GAP.fullmatch(gap): break
            body += ('d' if 'PRI' in gap else '') + unescape(tokens[i].group(0)[1:-1], False)
            end = tokens[i].end()
            i += 1
        line = bisect.bisect_left(starts, m.start()) + 1
        error = False
        for ln in range(line, max(0, line - 4), -1):  # this line and up to 3 before it
            c = code_lines[ln - 1]
            if LOG_CODE.search(c): break
            if ERROR_CODE.search(c):
                error = True
                break
        out.append((line, normalize(body, rust), error))
    return out


def scan(name, tag):
    """Every string literal of a repository at a tag, cached on disk."""
    cache = CACHE / f'scan-{name}-{tag}-{SCAN_VERSION}.json'
    if cache.exists():
        return json.loads(cache.read_text())
    repo = fetch(name, tag)
    folders = [f for f in REPOS[name][2] if git(repo, 'ls-tree', '--name-only', tag, '--', f.rstrip('/'))]
    log(f'Reading the {name} {tag} source...')
    tar = tarfile.open(fileobj=io.BytesIO(git(repo, 'archive', '--format=tar', tag, '--', *folders, binary=True)))
    rows = []
    for member in tar.getmembers():
        path = member.name
        if not member.isfile() or not SOURCE_FILE.search(path) or SKIP_PATH.search(path):
            continue
        text = tar.extractfile(member).read().decode('utf-8', 'replace')
        for line, value, error in literals(text, path.endswith('.rs')):
            rows.append([value, path, line, error])
    result = {'repo': name, 'tag': tag, 'literals': rows}
    cache.parent.mkdir(parents=True, exist_ok=True)
    cache.write_text(json.dumps(result))
    return result


class Corpus:
    """All string literals of one repository at one tag, for fast searching."""

    def __init__(self, scanned):
        self.tag = scanned['tag']
        self.name = scanned['repo']
        self.rows = scanned['literals']
        self.text = '\n'.join(r[0] for r in self.rows)
        self.offsets, pos = [], 0
        for r in self.rows:
            self.offsets.append(pos)
            pos += len(r[0]) + 1
        self.errors = {r[0] for r in self.rows if r[3]}
        self.values = {r[0] for r in self.rows}

    def __contains__(self, fragment):
        return fragment in self.text

    def where(self, fragment, limit=5):
        """The places (path, line) whose literal contains the fragment.

        Places in code that sends or sets an error come first."""
        rows, at = [], self.text.find(fragment)
        while at >= 0:
            rows.append(self.rows[bisect.bisect_right(self.offsets, at) - 1])
            at = self.text.find(fragment, at + 1)
        rows.sort(key=lambda r: (not r[3], r[1], r[2]))
        return list(dict.fromkeys((r[1], r[2]) for r in rows))[:limit]


# --- Following messages through the source ----------------------------------

def fragments(entry):
    """The fixed parts of a message, without its prefix, longest first."""
    msg = entry['message']
    if entry.get('prefix') and msg.startswith(entry['prefix']):
        msg = msg[len(entry['prefix']):]
    parts = [p.strip() for p in normalize(msg, message=True).split('\0')]
    return sorted((p for p in parts if len(p) >= MIN_ANCHOR), key=len, reverse=True)


def longest_present(fragment, corpus):
    """The longest start or end of `fragment`, cut at a space, that the corpus contains."""
    if fragment in corpus:
        return fragment
    best = ''
    cuts = [i for i, ch in enumerate(fragment) if ch == ' '] + [len(fragment)]
    for side in ('start', 'end'):
        pieces = [fragment[:c] for c in cuts] if side == 'start' else [fragment[c + 1:] for c in reversed(cuts[:-1])] + [fragment]
        lo, hi, got = 0, len(pieces) - 1, ''
        while lo <= hi:  # a piece is present only if every shorter piece is
            mid = (lo + hi) // 2
            if pieces[mid] in corpus:
                got, lo = pieces[mid], mid + 1
            else:
                hi = mid - 1
        if len(got) > len(best): best = got
    return best


def anchor(entry, corpus):
    """The longest piece of the message's fixed text found in the source, or None."""
    best = ''
    for f in fragments(entry):
        if len(f) <= len(best): break
        got = longest_present(f, corpus)
        if len(got) > len(best): best = got
    if len(best) >= MIN_ANCHOR:
        return best
    # A short message, such as "Bad capacity", counts when a whole string in the source is the message.
    whole = normalize(entry['message'], message=True)
    return whole if '\0' not in whole and len(whole) >= 6 and whole in corpus.values else None


@functools.lru_cache(maxsize=4096)
def file_lines(name, tag, path):
    try:
        return git(CACHE / name, 'show', f'{tag}:{path}').split('\n')
    except subprocess.CalledProcessError:
        return []


COMMENT_LINE = re.compile(r'^\s*(//|/\*|\*|$)')


def window(name, tag, path, line, size=3):
    """The code around a line, without blank lines and comments."""
    lines = file_lines(name, tag, path)
    return [ln.strip() for ln in lines[max(0, line - 1 - size):line + size] if not COMMENT_LINE.match(ln)]


def context(name, tag, places, size=8):
    """Source lines around the first places, for whoever reviews the change."""
    out = []
    for path, line in places[:2]:
        lines = file_lines(name, tag, path)
        lo = max(0, line - 1 - size)
        out.append(f'--- {path}:{line}\n' + '\n'.join(f'{lo + i + 1:5}  {t}' for i, t in enumerate(lines[lo:line + size])))
    return '\n'.join(out)


def code_changed(name, old_tag, old_places, new_tag, new_places):
    """A diff of the code around a message's main place, when it changed between the tags.

    The main place is the first one that sends an error. It's compared with the
    nearest place in the same file or, when the message moved, its new main place."""
    if not old_places or not new_places:
        return None
    op, ol = old_places[0]
    same = [l for p, l in new_places if p == op]
    np_, nl = (op, min(same, key=lambda l: abs(l - ol))) if same else new_places[0]
    a, b = window(name, old_tag, op, ol), window(name, new_tag, np_, nl)
    if a == b:
        return None
    return '\n'.join(difflib.unified_diff(a, b, f'{op}:{ol} in {old_tag}', f'{np_}:{nl} in {new_tag}', lineterm='', n=1))


def remap(name, old_tag, new_tag, path, line, hint=None):
    """Where a line of the old release is in the new one: (path, line), or None if it's gone.

    When the line appears several times, the copy whose neighbouring lines also
    match wins, then the one near `hint` (a piece of the message), then the nearest."""
    old, new = file_lines(name, old_tag, path), file_lines(name, new_tag, path)
    if not 0 < line <= len(old) or not old[line - 1].strip():
        return None
    text = old[line - 1].strip()
    hits = [i + 1 for i, t in enumerate(new) if t.strip() == text]
    if not hits:
        return None

    def rank(h):
        same = sum(1 for d in (-2, -1, 1, 2) if 0 < line + d <= len(old) and 0 < h + d <= len(new)
                   and old[line - 1 + d].strip() == new[h - 1 + d].strip())
        near = bool(hint) and hint[:24] in ' '.join(new[max(0, h - 4):h + 3])
        return (-near, -same, abs(h - line))
    return (path, min(hits, key=rank))


def unused_code_uses(code, corpus_name, tag):
    """How many times the source sets a Redis Search code, outside its definition."""
    tail = code[len('SEARCH_'):]
    rust = ''.join(w.capitalize() for w in tail.split('_'))
    repo = CACHE / corpus_name
    try:
        out = git(repo, 'grep', '-n', '-E', rf'QUERY_ERROR_CODE_{tail}\b|::{rust}\b', tag, '--', 'src')
    except subprocess.CalledProcessError:
        return 0
    return sum(1 for ln in out.splitlines()
               if 'headers/query_error.h' not in ln and 'query_error/src/lib.rs' not in ln and not SKIP_PATH.search(ln))


# --- diff ---------------------------------------------------------------------

def load_data():
    return json.loads(DATA.read_text())


def save_data(data):
    DATA.write_text(json.dumps(data, indent=1, ensure_ascii=False) + '\n')


def cmd_diff(args):
    data = load_data()
    base = dict(data['versions'])
    if args.base:
        base = {'redis': args.base, **{k: v.lstrip('v') for k, v in module_refs(args.base).items()}}
    version = args.version or release_tags()[-1]
    target = {'redis': version, **{k: v.lstrip('v') for k, v in module_refs(version).items()}}
    if target == base and not args.base:
        print(f'The error reference is already up to date with Redis {version}. Nothing to do.')
        return 0
    log('Base:   ' + ', '.join(f'{k} {v}' for k, v in base.items()))
    log('Target: ' + ', '.join(f'{k} {v}' for k, v in target.items()))

    data_text = '\n'.join(normalize(e['message'], message=True) for e in data['errors'])
    new, gone, review, tracked = [], [], [], {}
    untracked = 0
    for name in REPOS:
        old_tag, new_tag = tag_of(name, base[name]), tag_of(name, target[name])
        old, cur = Corpus(scan(name, old_tag)), Corpus(scan(name, new_tag))

        # Messages in the data: still in the source? Did the code around them change?
        for e in data['errors']:
            if REPO_OF[e['module']] != name: continue
            a = anchor(e, old)
            if not a:
                untracked += 1
                continue
            old_places = old.where(a)
            if a not in cur:
                gone.append({'id': f'gone-{len(gone) + 1}', 'module': e['module'], 'message': e['message'],
                             'explain': e.get('explain', ''), 'last_seen': [f'{p}:{l}' for p, l in old_places],
                             'context': context(name, old_tag, old_places), 'decision': None})
                continue
            if old_tag == new_tag:
                continue
            # The recorded places, where the error is sent, moved to the new release.
            # Sources that aren't "path:line", such as a note, stay as they are.
            sources = e.get('sources', [])
            recorded = [m.groups() for m in (re.fullmatch(r'(\S+):(\d+)', s) for s in sources) if m]
            notes = [s for s in sources if not re.fullmatch(r'\S+:\d+', s)]
            moved = [remap(name, old_tag, new_tag, path, int(line), a) for path, line in recorded]
            new_places = [m for m in moved if m] or cur.where(a)
            updated = [f'{p}:{l}' for p, l in new_places] + notes
            if updated != sources:
                tracked[(e['module'], e['message'])] = updated
            if recorded and moved[0]:
                changed = code_changed(name, old_tag, [(recorded[0][0], int(recorded[0][1]))], new_tag, [moved[0]])
            else:
                changed = code_changed(name, old_tag, old_places, new_tag, cur.where(a))
            if changed:
                review.append({'id': f'review-{len(review) + 1}', 'module': e['module'], 'message': e['message'],
                               'explain': e.get('explain', ''), 'commands': e.get('commands', []),
                               'where': updated, 'code_diff': changed, 'decision': None, 'set': {}})

        # Strings near error code that the base release didn't have.
        for value in sorted(cur.errors - old.errors):
            parts = sorted((p.strip() for p in value.split('\0')), key=len, reverse=True)
            if ' ' not in value or len(parts[0]) < MIN_ANCHOR or parts[0] in data_text:
                continue
            places = cur.where(value)
            new.append({'id': f'new-{len(new) + 1}', 'repo': name, 'string': value.replace('\0', '<?>'),
                        'where': [f'{p}:{l}' for p, l in places], 'context': context(name, new_tag, places),
                        'decision': None, 'entries': []})

    codes = []
    for e in data['errors']:
        if e.get('unused') and e['prefix'] not in [c['code'] for c in codes]:
            uses = unused_code_uses(e['prefix'], 'search', tag_of('search', target['search']))
            if uses:
                codes.append({'code': e['prefix'], 'uses': uses, 'decision': None})

    work = {'created': time.strftime('%Y-%m-%d'), 'base': base, 'target': target,
            'new': new, 'gone': gone, 'review': review, 'unused_codes_now_used': codes,
            'sources': [[m, msg, w] for (m, msg), w in tracked.items()]}
    out = WORK / target['redis']
    out.mkdir(parents=True, exist_ok=True)
    (out / 'work.json').write_text(json.dumps(work, indent=1, ensure_ascii=False) + '\n')
    print(f'''Compared Redis {base["redis"]} with Redis {target["redis"]}.

- {len(new)} new strings near error code. Decide for each one whether it's an error message apps can get.
- {len(gone)} messages in the data are no longer in the source. They may be removed or reworded.
- {len(review)} messages whose surrounding code changed. Check that their explanation still holds.
- {len(codes)} Redis Search codes marked unused are now set in the source.
- {untracked} messages in the data can't be followed through the source automatically.

Work file: {(out / "work.json").relative_to(ROOT)}
Fill in every "decision", then run: python3 build/errors/update_errors.py apply''')


# --- apply --------------------------------------------------------------------

ENTRY_FIELDS = {'message', 'prefix', 'module', 'commands', 'explain', 'explain_basis',
                'internal', 'unused', 'verified', 'example', 'sources'}


def validate_entry(e, where):
    problems = []
    missing = {'message', 'prefix', 'module', 'commands', 'explain', 'explain_basis'} - set(e)
    if missing: problems.append(f'{where}: missing {", ".join(sorted(missing))}')
    if set(e) - ENTRY_FIELDS: problems.append(f'{where}: unknown fields {", ".join(sorted(set(e) - ENTRY_FIELDS))}')
    if e.get('module') not in REPO_OF: problems.append(f'{where}: unknown module {e.get("module")!r}')
    if e.get('explain_basis') not in BASES: problems.append(f'{where}: explain_basis must be one of {", ".join(BASES)}')
    if not str(e.get('explain', '')).strip(): problems.append(f'{where}: empty explain')
    if e.get('prefix') and not e.get('message', '').startswith(e['prefix']):
        problems.append(f'{where}: the message must start with its prefix {e["prefix"]!r}')
    return problems


def latest_work():
    files = sorted(WORK.glob('*/work.json'), key=lambda p: p.stat().st_mtime)
    if not files:
        sys.exit('No work file. Run the diff step first.')
    return files[-1]


def cmd_apply(args):
    path = Path(args.work) if args.work else latest_work()
    work = json.loads(path.read_text())
    data = load_data()
    problems = []
    for item in work['new']:
        item.setdefault('entries', [])
        if item.get('decision') not in ('add', 'skip'):
            problems.append(f'{item["id"]}: decision must be "add" or "skip"')
        if item['decision'] == 'add':
            if not item['entries']: problems.append(f'{item["id"]}: "add" needs at least one entry')
            for i, e in enumerate(item['entries']):
                problems += validate_entry(e, f'{item["id"]} entry {i + 1}')
    for item in work['gone']:
        if item['decision'] not in ('remove', 'keep'):
            problems.append(f'{item["id"]}: decision must be "remove" or "keep"')
    for item in work['review']:
        if item['decision'] not in ('ok', 'update'):
            problems.append(f'{item["id"]}: decision must be "ok" or "update"')
        if item['decision'] == 'update' and not item['set']:
            problems.append(f'{item["id"]}: "update" needs the fields to change in "set"')
        if set(item['set']) - ENTRY_FIELDS:
            problems.append(f'{item["id"]}: unknown fields in "set"')
    for item in work['unused_codes_now_used']:
        if item['decision'] not in ('used', 'still unused'):
            problems.append(f'{item["code"]}: decision must be "used" or "still unused"')
    if problems:
        sys.exit('The work file isn\'t complete:\n' + '\n'.join('- ' + p for p in problems))

    by_key = {(e['module'], e['message']): e for e in data['errors']}
    for item in work['review']:
        if item['decision'] == 'update':
            by_key[(item['module'], item['message'])].update(item['set'])
    for item in work['unused_codes_now_used']:
        if item['decision'] == 'used':
            for e in data['errors']:
                if e['prefix'] == item['code']: e.pop('unused', None)
    removed = {(i['module'], i['message']) for i in work['gone'] if i['decision'] == 'remove'}
    errors = [e for e in data['errors'] if (e['module'], e['message']) not in removed]
    sources = {(m, msg): w for m, msg, w in work['sources']}
    for e in errors:
        e['sources'] = sources.get((e['module'], e['message']), e.get('sources', []))
    added_by = {}
    for item in work['new']:
        for e in item['entries'] if item['decision'] == 'add' else []:
            key = (e['module'], e['message'])
            if key in by_key and key not in removed:
                sys.exit(f'{item["id"]}: {e["module"]} already has the message {e["message"]!r}')
            if key in added_by:
                sys.exit(f'{item["id"]}: {added_by[key]} adds the message {e["message"]!r} too. Keep one of them.')
            added_by[key] = item['id']
            e.setdefault('sources', item.get('where', []))
            errors.append(e)
    added = len(added_by)
    data['errors'] = sorted(errors, key=sort_key)
    data['versions'] = work['target']
    save_data(data)
    print(f'Added {added} messages, removed {len(removed)}, updated '
          f'{sum(1 for i in work["review"] if i["decision"] == "update")}. The data is now for Redis {work["target"]["redis"]}.')
    return cmd_check(args)


def sort_key(e):
    """The order of data/errors.json, which is also the order of the tables."""
    order = list(LIST_PAGES)
    if e['module'] not in ('core', 'vectorset'):
        return (order.index(e['module']), 0, '', e['message'].lower())
    # Redis: codes other than ERR first, by code, then ERR, then messages without a code.
    p = e['prefix']
    group = 0 if p and p != 'ERR' and p.isupper() else (1 if p == 'ERR' else 2)
    text = re.sub(r'^[A-Z_]+ ', '', e['message']) if group < 2 else e['message']
    return (order.index(e['module']), group, p if group == 0 else '', text.lower())


# --- check --------------------------------------------------------------------

def front_matter(text):
    m = re.match(r'---\n(.*?)\n---\n', text, re.S)
    return m.group(1) if m else ''


def group_of(e):
    # Time series messages that start with both ERR and TSDB: are listed together.
    if e['module'] == 'timeseries' and e['message'].startswith('ERR TSDB:'):
        return 'ERR TSDB:'
    return e['prefix']


def needs_section(module, group):
    """Codes that must have their own section on the list page.

    Every Redis server message has a real code, and so do the Redis Search
    messages that start with SEARCH_. In the other modules, a message without
    a code still has a first word, such as Bad, that clients read as its code:
    those are listed under "Messages without a code"."""
    return module in ('core', 'vectorset') or group.startswith('SEARCH_')


def check(data):
    """Problems that need fixing, and notes worth a look."""
    problems, notes = [], []
    # A row's link comes from its module and message, so a repeated message breaks it.
    seen = set()
    for e in data['errors']:
        key = (e['module'], e['message'])
        if key in seen:
            problems.append(f'Listed twice: {e["module"]}: {e["message"]}')
        seen.add(key)
    public = [e for e in data['errors'] if not (e.get('internal') or e.get('unused'))]
    for e in public:
        if not str(e.get('explain', '')).strip():
            problems.append(f'No explanation: {e["module"]}: {e["message"]}')
        elif e.get('explain_basis') not in BASES:
            problems.append(f'No explain_basis: {e["module"]}: {e["message"]}')

    # Each code has its own section on its list page, or sits with the messages without a code.
    for module, page in LIST_PAGES.items():
        text = (PAGES / 'all' / f'{page}.md').read_text()
        calls = re.findall(r'\{\{<\s*error-catalog\s+module="%s"\s+([^>]*)>\}\}' % module, text)
        named = [c for call in calls for c in (re.findall(r'code="([^"]*)"', call) or [''])[0].split(',') if c]
        has_others = any('others="true"' in call for call in calls)
        for code in sorted({c for c in named if named.count(c) > 1}):
            problems.append(f'all/{page}.md: the code {code} is listed twice')
        for code in sorted({group_of(e) for e in public if e['module'] == module} - set(named)):
            if needs_section(module, code) or not has_others:
                problems.append(f'all/{page}.md: the code {code or "(none)"} has no section. Add one with '
                                f'{{{{< error-catalog module="{module}" code="{code}" >}}}} and an explanation.')

    # The error pages explain messages that the data still has.
    messages = [e for e in data['errors'] if e['module'] == 'core']
    for page in sorted((PAGES / 'common').glob('*.md')):
        if page.name == '_index.md': continue
        fm = front_matter(page.read_text())
        prefix = re.search(r'^\s+prefix:\s*(\S+)', fm, re.M)
        message = re.search(r'^\s+message:\s*(.+)$', fm, re.M)
        if prefix and prefix.group(1) != 'ERR' and not any(e['prefix'] == prefix.group(1) for e in messages):
            problems.append(f'common/{page.name}: no message in the data has the prefix {prefix.group(1)}')
        if message:
            text = message.group(1).strip()
            if text[:1] == "'" and text[-1:] == "'": text = text[1:-1].replace("''", "'")
            elif text[:1] == '"' and text[-1:] == '"': text = text[1:-1]
            def same(msg):
                if text.endswith('...'):  # a page may shorten a long message
                    return msg.startswith(text[:-3])
                return re.fullmatch('.+'.join(map(re.escape, PLACEHOLDER.split(msg))), text)
            if not any(same(e['message']) for e in messages):
                notes.append(f'common/{page.name}: its message isn\'t in the data word for word: {text}')

    # The versions that the pages name.
    index = (PAGES / 'all' / '_index.md').read_text()
    for name, version in data['versions'].items():
        if version not in index:
            problems.append(f'all/_index.md doesn\'t mention {name} {version}, the version the data comes from')
    current = '.'.join(data['versions']['redis'].split('.')[:2])
    for page in sorted(PAGES.rglob('*.md')):
        for m in sorted(set(re.findall(r'\bRedis (?:Open Source )?(\d+\.\d+)\b', page.read_text()))):
            if m != current:
                notes.append(f'{page.relative_to(PAGES)} mentions Redis {m}. Check it still fits Redis {current}.')
    mentions = sum(1 for e in public if re.search(r'\bRedis \d+\.\d+\b', e.get('explain', '')))
    if mentions:
        notes.append(f'{mentions} explanations name a Redis version. After an update, check those that name an older one.')
    return problems, notes


def cmd_check(args):
    problems, notes = check(load_data())
    for n in notes: print('Note:', n)
    if problems:
        print(f'\n{len(problems)} problems:')
        for p in problems: print('-', p)
        return 1
    print('No problems found.')
    return 0


# --- verify -------------------------------------------------------------------

def cmd_verify(args):
    sys.path.insert(0, str(Path(__file__).parent))
    import live_checks
    out = WORK / args.version / 'live.json'
    out.parent.mkdir(parents=True, exist_ok=True)
    results = live_checks.run(f'redis:{args.version}', out)
    baseline_path = Path(__file__).parent / 'live_baseline.json'
    baseline = json.loads(baseline_path.read_text())
    changes = live_checks.compare(baseline, results)
    if args.accept:
        baseline_path.write_text(json.dumps(results, indent=2, ensure_ascii=False) + '\n')
        print(f'Saved these replies as the new baseline: {baseline_path.relative_to(ROOT)}')
        return 0
    new = live_checks.unrecorded(baseline, results)
    if new:
        print('These pages have no baseline yet, so their replies weren\'t compared. Check them by hand, '
              f'then save them with --accept: {", ".join(f"common/{p}.md" for p in new)}\n')
    if not changes:
        print(f'Every reply that the error pages show is the same on Redis {args.version}.')
        return 0
    print(f'{len(changes)} replies differ from the baseline. Check these pages:\n')
    for page, what in changes:
        print(f'- common/{page}.md: {what}')
    print('\nWhen the pages are right again, run: python3 build/errors/update_errors.py verify '
          f'{args.version} --accept')
    return 1


def main(argv=None):
    p = argparse.ArgumentParser(description=__doc__.split('\n\n')[0])
    sub = p.add_subparsers(dest='step', required=True)
    d = sub.add_parser('diff', help='compare the data\'s release with a newer one')
    d.add_argument('version', nargs='?', help='Redis version, such as 8.12.0 (default: the latest release)')
    d.add_argument('--base', help='compare from this Redis version instead of the data\'s (for testing)')
    a = sub.add_parser('apply', help='merge the filled-in work file into data/errors.json')
    a.add_argument('--work', help='the work file (default: the newest one)')
    sub.add_parser('check', help='check the data and the pages, offline')
    v = sub.add_parser('verify', help='rerun the error pages\' examples on redis:VERSION in Docker')
    v.add_argument('version')
    v.add_argument('--accept', action='store_true', help='save the replies as the new baseline')
    args = p.parse_args(argv)
    return {'diff': cmd_diff, 'apply': cmd_apply, 'check': cmd_check, 'verify': cmd_verify}[args.step](args) or 0


if __name__ == '__main__':
    sys.exit(main())

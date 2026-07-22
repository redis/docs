#!/usr/bin/env python3
"""
Verify that docs redis-cli examples still produce the documented output.

Companion to check_tryit_payloads.py (which checks URL size). This one actually
runs the examples and compares their output, so it catches examples that have
gone stale, reference a command the sandbox can't run, or depend on setup that
no longer happens.

What it does, per page:
  * Parse every `clients-example` and `{{% redis-cli %}}` block into
    (command, expected-output) pairs from its `> ` / `redis> ` transcript (the
    command line plus the output lines that follow it, up to the next command).
  * Run that page's commands in ONE redis.io/cli session, in document order,
    mirroring the live page's shared session (static/js/cli.js). The API caps a
    request at 20 commands, so commands are sent in <=20-command batches with the
    session id threaded across them so state accumulates.
  * Format each reply exactly the way the in-page terminal does — a faithful port
    of cli.js's formatReply / reprString (RESP -> redis-cli text: `(integer)`,
    `(nil)`, quoted/escaped bulk strings, nested `1) 2) ...` arrays, `(error) ...`).
  * Compare formatted-actual to documented-expected.

Outcomes and CI gating:
  * PASS      — matched (after normalization).
  * ERROR     — the command errored *and the docs show real output* -> a
                genuinely broken example. This is the gating signal.
  * (a documented error that errors is a PASS: error-message text is volatile.)
  * MISMATCH  — output differs but did not error. Reported for review but does
                NOT gate CI by default (use --strict), because much of it is
                unavoidable non-determinism (auto stream IDs, unordered
                SMEMBERS/HGETALL, timestamps, cumulative session state).

Commands whose reply *order* Redis does not guarantee (KEYS, SMEMBERS, HGETALL,
scans, set algebra, FT.SEARCH/FT.AGGREGATE without SORTBY — see UNORDERED_CMDS)
are compared as an unordered multiset, so a different element order is not a
mismatch. Commands whose *output itself* is random rather than merely unordered
(SPOP, SRANDMEMBER, ZRANDMEMBER, HRANDFIELD — see NONDETERMINISTIC_CMDS) can't
be verified at all: any example using one is auto-skipped, with a logged notice.

No content annotations are required. Volatile values are masked by default
(--raw to disable); anything you want to permanently exclude goes in a build-side
--skip-file (never in the docs).

Usage:
    python build/check_tryit_output.py [--content-dir content] [--page GLOB]
        [--raw] [--strict] [--skip-file build/tryit_verify_skip.txt]
        [--include-nonrunnable] [--api URL] [--quiet]

Exit status: 1 if any ERROR (or, with --strict, any MISMATCH), else 0.
Requires `curl` on PATH (uses the system cert store; avoids macOS Python's
missing-CA issue). Hits the live redis.io/cli, which runs commands in a
throwaway sandbox session, so run it sparingly / in CI, not on every save.
"""
import argparse
import base64
import glob
import json
import os
import re
import subprocess
import sys


API_DEFAULT = "https://redis.io/cli"

BATCH_MAX = 20  # redis.io/cli rejects requests with more than 20 commands

# --- reply formatting: faithful port of static/js/cli.js formatReply/reprString ---
_ESC = {0x5c: "\\\\", 0x22: '\\"', 0x0a: "\\n", 0x0d: "\\r",
        0x09: "\\t", 0x07: "\\a", 0x08: "\\b"}


def _repr_bytes(raw):
    """Quote/escape a byte string byte-for-byte the way redis-cli's sdscatrepr does."""
    out = ['"']
    for b in raw:
        if b in _ESC:
            out.append(_ESC[b])
        elif 0x20 <= b <= 0x7e:
            out.append(chr(b))
        else:
            out.append("\\x%02x" % b)
    out.append('"')
    return "".join(out)


def _repr_string(s):
    """A text bulk string: its UTF-8 bytes are what redis-cli would see."""
    return _repr_bytes(s.encode("utf-8"))


def format_reply(reply, indent="", status=False):
    if reply is None:
        return "(nil)"
    if isinstance(reply, dict) and isinstance(reply.get("$int"), str):
        return "(integer) %s" % reply["$int"]
    if isinstance(reply, dict) and isinstance(reply.get("$status"), str):
        # RESP simple-string element inside an array (e.g. CMS.INFO field names);
        # rendered unquoted like a top-level status reply.
        return reply["$status"]
    if isinstance(reply, dict) and isinstance(reply.get("$bin"), str):
        # Binary bulk string (BF.SCANDUMP, DUMP, ...) base64-encoded by the
        # backend because its bytes aren't valid UTF-8; decode and repr the raw
        # bytes byte-for-byte like redis-cli.
        return _repr_bytes(base64.b64decode(reply["$bin"]))
    if isinstance(reply, bool):
        return "(integer) %d" % (1 if reply else 0)
    if isinstance(reply, str):
        return reply if status else _repr_string(reply)
    if isinstance(reply, (int, float)):
        return "(integer) %s" % reply
    if isinstance(reply, list):
        if not reply:
            return "(empty array)"
        # redis-cli right-justifies list indices to the width of the largest index
        # (so "1)".."9)" get a leading space once there are >=10 elements), and uses
        # that same width for the nested-element indent.
        width = len(str(len(reply)))
        parts = []
        for i, x in enumerate(reply):
            idx = str(i + 1).rjust(width)
            nested = indent + " " * (width + 2)
            prefix = "" if i == 0 else "\n" + indent
            parts.append("%s%s) %s" % (prefix, idx, format_reply(x, nested)))
        return "".join(parts)
    return "-PROTOCOLERR Unknown reply type"


def render(reply):
    """Render one API reply object ({error,value,status}) as redis-cli text."""
    if reply.get("error"):
        return "(error) %s" % reply.get("value")
    return format_reply(reply.get("value"), "", bool(reply.get("status")))


# --- parsing ---
# Two shortcode block types carry a redis-cli transcript we can verify:
#   {{< clients-example [attrs] >}} … {{< /clients-example >}}  (tabbed; has set/step/runnable)
#   {{% redis-cli %}} … {{% /redis-cli %}}                       (standalone; always interactive)
# Both are parsed uniformly and yielded in document order, so the page still runs
# as one session. redis-cli blocks carry no set/step, so we synthesize
# set="redis-cli" with a per-file 1-based step counter.
_BLOCK = re.compile(
    r'\{\{<\s*clients-example\s+(?P<ce>.*?)>\}\}'   # clients-example open (attrs in group)
    r'|'
    r'\{\{%\s*redis-cli\b(?P<rc>[^%]*?)%\}\}',      # redis-cli open
    re.S)
_CE_CLOSE = re.compile(r'\{\{<\s*/clients-example\s*>\}\}')
_RC_CLOSE = re.compile(r'\{\{%\s*/redis-cli\s*%\}\}')


def _attr(attrs, name):
    # negative lookbehind so prereq="..." doesn't match inside needs_prereq="..."
    m = re.search(r'(?<![\w])' + re.escape(name) + r'="([^"]*)"', attrs)
    return m.group(1) if m else None


def _pairs_from_body(body):
    """Extract (command, expected-output) pairs from a "> "/"redis> " transcript."""
    pairs, cur, out = [], None, []
    for line in body.split("\n"):
        s = line.strip()
        if s.startswith("redis> ") or s.startswith("> "):
            if cur is not None:
                pairs.append((cur, "\n".join(out).strip("\n")))
            cur = s[len("redis> "):] if s.startswith("redis> ") else s[2:]
            out = []
        elif cur is not None:
            # Discard doc comment lines (e.g. "# Retrieve data points ...") — they
            # describe the example, not part of any reply. A redis reply never
            # renders as a standalone "#"-prefixed line (INFO is one quoted bulk
            # string), so this only strips prose.
            if line.strip().startswith("#"):
                continue
            out.append(line.rstrip())
    if cur is not None:
        pairs.append((cur, "\n".join(out).strip("\n")))
    return pairs


def parse_page(text):
    """Yield {runnable, try_it, set, step, pairs} per transcript block, in document order."""
    rc_step = 0
    pos = 0
    for m in _BLOCK.finditer(text):
        if m.start() < pos:
            continue  # an opener sitting inside a block we've already consumed
        if m.group("ce") is not None:
            # {{< clients-example >}}
            attrs = m.group("ce")
            base = {"runnable": _attr(attrs, "runnable"), "try_it": _attr(attrs, "try_it"),
                    "set": _attr(attrs, "set"), "step": _attr(attrs, "step")}
            # Self-closing tags ("... />}}") are data-driven (examples.json) and have
            # no inline "> "-transcript — no body to parse, and no closing tag.
            if m.group(0).rstrip().endswith("/>}}"):
                yield {**base, "pairs": []}
                pos = m.end()
                continue
            close = _CE_CLOSE.search(text, m.end())
            body = text[m.end():close.start()] if close else text[m.end():]
            yield {**base, "pairs": _pairs_from_body(body)}
            pos = close.end() if close else len(text)
        else:
            # {{% redis-cli %}} — standalone, always interactive
            rc_step += 1
            close = _RC_CLOSE.search(text, m.end())
            body = text[m.end():close.start()] if close else text[m.end():]
            yield {"runnable": None, "try_it": None,
                   "set": "redis-cli", "step": str(rc_step),
                   "pairs": _pairs_from_body(body)}
            pos = close.end() if close else len(text)


# --- normalization for volatile values ---
_NORM = [
    (re.compile(r'\b\d{13}-\d+\b'), "<stream-id>"),   # auto stream IDs (ms-seq)
    (re.compile(r'\b\d{10}-\d+\b'), "<stream-id>"),
    (re.compile(r'\b1[6-9]\d{8,11}\b'), "<timestamp>"),  # unix seconds/ms (2022+)
]


def normalize(s, on):
    if not on:
        return s
    for rx, repl in _NORM:
        s = rx.sub(repl, s)
    return s


# Commands whose reply element ORDER is not guaranteed by Redis. Their output is
# the same *set* of elements every run but in an arbitrary order (hash-bucket
# layout, set encoding, cursor iteration, randomization), so it's compared as an
# unordered multiset instead of exact text. Ordered commands (LRANGE, ZRANGE,
# SORT, XRANGE, HMGET, ...) are intentionally NOT here — their order is meaningful.
UNORDERED_CMDS = {
    # keyspace / scan
    "KEYS", "SCAN", "HSCAN", "SSCAN", "ZSCAN",
    # sets: membership order undefined; set-algebra results unordered
    "SMEMBERS", "SINTER", "SUNION", "SDIFF",
    # hashes: field order undefined for hashtable-encoded hashes
    "HKEYS", "HVALS", "HGETALL",
    # search/aggregate without SORTBY: result order is not guaranteed
    "FT.SEARCH", "FT.AGGREGATE",
    # vector set similarity: ranked by score, but equal-score ties break in any
    # order (compared as a multiset, so tied elements may swap places)
    "VSIM",
}

# Commands whose *output itself* is non-deterministic (random element(s)), not
# merely unordered — the result can't be verified against a fixed transcript.
# Any example that uses one is auto-skipped (with a logged notice); it still
# runs, so later examples that build on it see the same cumulative state.
NONDETERMINISTIC_CMDS = {"SPOP", "SRANDMEMBER", "ZRANDMEMBER", "HRANDFIELD"}

_IDX = re.compile(r'^\s*\d+\)\s+')  # a redis-cli "N) " list index


def _multiset(text):
    """Order-insensitive key: the sorted list of element lines with their
    "N) " index stripped. Two renderings of the same flat reply in different
    orders produce the same key."""
    return sorted(_IDX.sub("", ln).strip() for ln in text.split("\n") if ln.strip())


# --- execution ---
def execute(commands, api, session_id, auth=None):
    payload = json.dumps({"commands": commands, "id": session_id})
    # -L follows redirects (e.g. http->https); --post301/--post302 keep it a POST
    # across the redirect (curl would otherwise downgrade to GET and get a 400).
    cmd = ["curl", "-sS", "-L", "--post301", "--post302", "-X", "POST", api,
           "-H", "Content-Type: application/json", "--data", payload]
    stdin = None
    if auth:
        # Feed HTTP basic-auth credentials via a --config file on stdin so they
        # never appear in the process list (unlike -u user:pass on argv).
        cmd += ["--config", "-"]
        stdin = 'user = "%s"\n' % auth
    out = subprocess.run(cmd, input=stdin,
                         capture_output=True, text=True, timeout=60)
    if out.returncode != 0:
        raise RuntimeError(out.stderr.strip() or ("curl exit %d" % out.returncode))
    try:
        return json.loads(out.stdout)
    except json.JSONDecodeError:
        raise RuntimeError("non-JSON response from %s (check the URL/scheme, e.g. https): %r"
                           % (api, out.stdout[:100]))


def run_session(commands, api, auth=None):
    """Run all commands in one session, reusing the id across <=20-command batches."""
    replies, sid = [], None
    for i in range(0, len(commands), BATCH_MAX):
        rep = execute(commands[i:i + BATCH_MAX], api, sid, auth)
        if "replies" not in rep:
            raise RuntimeError(rep.get("value", rep))
        sid = rep.get("id", sid)
        replies.extend(rep["replies"])
    return replies


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--content-dir", default="content")
    ap.add_argument("--page", default="**/*.md", help="glob under --content-dir")
    ap.add_argument("--raw", action="store_true",
                    help="disable volatile-value normalization (on by default)")
    ap.add_argument("--strict", action="store_true",
                    help="also exit non-zero on MISMATCH (default: only ERROR gates)")
    ap.add_argument("--skip-file", default=None,
                    help="build-side config (NOT content): lines of 'set/step' or a "
                         "file-path substring to exclude; '#' starts a comment")
    ap.add_argument("--include-nonrunnable", action="store_true",
                    help="also verify runnable=\"false\" blocks (default: skip them)")
    ap.add_argument("--api", default=API_DEFAULT)
    ap.add_argument("--auth", default=os.environ.get("TRYIT_AUTH"),
                    help="HTTP basic auth as user:pass (or set env TRYIT_AUTH); "
                         "for password-protected endpoints e.g. staging")
    ap.add_argument("--quiet", action="store_true", help="suppress the summary line")
    args = ap.parse_args()
    normalize_on = not args.raw

    skips = []
    if args.skip_file and os.path.exists(args.skip_file):
        for ln in open(args.skip_file, encoding="utf-8"):
            ln = ln.split("#", 1)[0].strip()
            if ln:
                skips.append(ln)

    def is_skipped(f, setn, step):
        key = "%s/%s" % (setn, step)
        return any(s == key or s in f for s in skips)

    files = sorted(glob.glob(os.path.join(args.content_dir, args.page), recursive=True))
    total = passed = mismatched = errored = skipped_ct = 0

    for f in files:
        try:
            text = open(f, encoding="utf-8").read()
        except (OSError, UnicodeDecodeError):
            continue
        if "clients-example" not in text and "redis-cli" not in text:
            continue

        items = []        # (cmd, expected, set, step) in document order
        autoskip = set()  # (set, step) skipped from verification (non-det output or try_it opt-out)
        for blk in parse_page(text):
            if not args.include_nonrunnable and blk["runnable"] == "false":
                continue
            # try_it="false": the author opted this example out of the interactive
            # "Try it" button, so opt it out of verification too. Its commands still
            # run (below), keeping cumulative state correct for later examples.
            if blk["try_it"] == "false":
                autoskip.add((blk["set"], blk["step"]))
            nondet = sorted({c.split()[0].upper() for c, _ in blk["pairs"]
                             if c.split() and c.split()[0].upper() in NONDETERMINISTIC_CMDS})
            if nondet:
                # Random-output commands can't be verified against a transcript;
                # skip the whole example (but still run it, below, so cumulative
                # state stays correct for later examples that build on it).
                autoskip.add((blk["set"], blk["step"]))
                print("SKIP   %s  [%s/%s]  (non-deterministic: %s)"
                      % (f, blk["set"], blk["step"], ", ".join(nondet)))
            for cmd, exp in blk["pairs"]:
                items.append((cmd, exp, blk["set"], blk["step"]))
        if not items:
            continue

        cmds = [c for c, _, _, _ in items]
        try:
            replies = run_session(cmds, args.api, args.auth)
        except Exception as e:
            print("ERROR  %s  (request failed: %s)" % (f, e))
            errored += len(items)
            total += len(items)
            continue

        # The API returns one reply per command; if it returns fewer (partial
        # batch, dropped tail), zip() below would silently skip the trailing
        # commands and the run could still exit 0. Count the shortfall as errors
        # so it gates instead of passing unverified.
        if len(replies) < len(items):
            missing = len(items) - len(replies)
            print("ERROR  %s  (API returned %d replies for %d commands; "
                  "%d trailing command(s) unverified)"
                  % (f, len(replies), len(items), missing))
            errored += missing
            total += missing

        for (cmd, exp, setn, step), rep in zip(items, replies):
            total += 1
            if exp == "":            # command has no documented output to check
                continue
            if (setn, step) in autoskip or is_skipped(f, setn, step):
                skipped_ct += 1
                continue
            a = normalize(render(rep), normalize_on)
            e = normalize(exp, normalize_on)
            first = cmd.split()[0].upper() if cmd.split() else ""
            if a == e:
                passed += 1
            elif first in UNORDERED_CMDS and _multiset(a) == _multiset(e):
                passed += 1  # same elements, order not guaranteed for this command
            elif rep.get("error"):
                if e.startswith("(error)"):
                    passed += 1      # errors as documented; message text is volatile
                else:
                    errored += 1
                    print("ERROR  %s  [%s/%s]  (errored, but docs expect output)\n"
                          "    cmd:      %s\n    expected: %s\n    got:      %s"
                          % (f, setn, step, cmd,
                             e.replace("\n", "\n              "),
                             a.replace("\n", "\n              ")))
            else:
                mismatched += 1
                print("MISMATCH  %s  [%s/%s]\n    cmd:      %s\n    expected: %s\n    actual:   %s"
                      % (f, setn, step, cmd,
                         e.replace("\n", "\n              "),
                         a.replace("\n", "\n              ")))

    if not args.quiet:
        print("\n%d commands: %d pass, %d mismatch, %d error, %d skipped%s. Gating on: %s"
              % (total, passed, mismatched, errored, skipped_ct,
                 "" if normalize_on else " (raw)",
                 "error+mismatch" if args.strict else "error only"))

    return 1 if (errored or (args.strict and mismatched)) else 0


if __name__ == "__main__":
    sys.exit(main())

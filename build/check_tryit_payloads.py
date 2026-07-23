#!/usr/bin/env python3
"""
Check interactive "Try it" payload sizes across the docs.

The external "Try it" button on a `clients-example` block opens
`redis.io/cli?commands=<base64>&autorun=true`, where <base64> is the URL-safe
base64 of a JSON array of the block's CLI commands. The server rejects the
request with "Request Line is too large (N > 4094)" once the **HTTP request
line** exceeds ~4094 bytes. The request line is `GET /cli?commands=<base64>&
autorun=true HTTP/1.1`, i.e. the base64 payload plus ~40 bytes of scaffolding,
so the base64 must be ≲ 4054 bytes. Two subtleties this checker accounts for:

  * The cap is on the request line / URL, not the raw typed command text.
    Sizes are computed to match the browser exactly: base64 of
    JSON.stringify(cmds) (compact separators, real UTF-8) — see _payload_b64_len.
  * A block with `needs_prereq="true"` has its set's `prereq="true"` block
    prepended by the button, so it inherits the prereq's payload size.

A block is only subject to the limit if its external button is actually shown:
`try_it != "false"` and `runnable != "false"`. Blocks over the limit should get
`try_it="false"` (the on-page terminal still runs them — it does not go through
the URL). See the DOC-6823 work on content/develop/get-started/document-database.md.

Usage:
    python build/check_tryit_payloads.py [--content-dir content] [--limit 4094]
                                         [--overhead 40] [--warn-frac 0.85] [--quiet]

Exit status: 1 if any interactive block's request line exceeds the limit, else 0
(so it can gate CI). Stdlib only; run from the repo root.
"""

import argparse
import base64
import glob
import json
import os
import re
import sys

# Match a shortcode attribute value. The negative lookbehind on a word char
# stops `prereq="..."` from also matching inside `needs_prereq="..."`.
def _attr(tag, name):
    m = re.search(r'(?<![\w])' + re.escape(name) + r'="([^"]*)"', tag)
    return m.group(1) if m else None


_OPEN_TAG = re.compile(r'\{\{<\s*clients-example\s+.*?>\}\}', re.S)
_CLOSE = '{{< /clients-example'


def _parse_blocks(text):
    """Yield (open_tag, body_between_tags) for each clients-example block."""
    parts = re.split(r'(' + _OPEN_TAG.pattern + r')', text, flags=re.S)
    i = 1
    while i < len(parts):
        tag = parts[i]
        body = parts[i + 1] if i + 1 < len(parts) else ""
        end = body.find(_CLOSE)
        if end >= 0:
            body = body[:end]
        yield tag, body
        i += 2


def _cli_cmds(body):
    """Extract the redis-cli command lines (the `> ` / `redis> ` prefixed lines)."""
    cmds = []
    for line in body.split("\n"):
        s = line.strip()
        if s.startswith("redis> "):
            cmds.append(s[len("redis> "):])
        elif s.startswith("> "):
            cmds.append(s[2:])
    return cmds


def _payload_b64_len(cmds):
    """Bytes of the URL-safe base64 payload the button would send (no padding).

    Mirrors the browser's btoa(unescape(encodeURIComponent(JSON.stringify(cmds)))):
    JSON.stringify emits compact JSON (no spaces after ',' / ':') and keeps real
    Unicode, so use compact separators and ensure_ascii=False + UTF-8 bytes.
    Default json.dumps (spaces, \\uXXXX escapes) would overstate the size.
    """
    js = json.dumps(cmds, separators=(",", ":"), ensure_ascii=False)
    b64 = base64.b64encode(js.encode("utf-8")).decode().rstrip("=")
    return len(b64)


def scan(content_dir):
    """Return (blocks, set_prereq) for all clients-example blocks under content_dir."""
    blocks = []
    set_prereq = {}  # (file, set) -> prereq command list
    for f in sorted(glob.glob(os.path.join(content_dir, "**", "*.md"), recursive=True)):
        try:
            text = open(f, encoding="utf-8").read()
        except (OSError, UnicodeDecodeError):
            continue
        if "clients-example" not in text:
            continue
        for tag, body in _parse_blocks(text):
            b = {
                "file": f,
                "set": _attr(tag, "set"),
                "step": _attr(tag, "step"),
                "prereq": _attr(tag, "prereq") == "true",
                "needs_prereq": _attr(tag, "needs_prereq") == "true",
                "runnable": _attr(tag, "runnable"),
                "try_it": _attr(tag, "try_it"),
                "cmds": _cli_cmds(body),
            }
            blocks.append(b)
            if b["prereq"]:
                set_prereq[(b["file"], b["set"])] = b["cmds"]
    return blocks, set_prereq


def payload_for(b, set_prereq):
    """The full command list the button would send for block b."""
    cmds = []
    if b["needs_prereq"]:
        cmds += set_prereq.get((b["file"], b["set"]), [])
    cmds += b["cmds"]
    return cmds


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--content-dir", default="content")
    ap.add_argument("--limit", type=int, default=4094,
                    help="max HTTP request-line bytes for redis.io/cli "
                         "(observed server cap: 4094)")
    ap.add_argument("--overhead", type=int, default=40,
                    help="bytes added to the base64 payload to form the request "
                         "line: 'GET /cli?commands=' + '&autorun=true HTTP/1.1' "
                         "(~40; observed ~24, so 40 is conservative)")
    ap.add_argument("--warn-frac", type=float, default=0.85,
                    help="warn when payload exceeds this fraction of the limit")
    ap.add_argument("--quiet", action="store_true",
                    help="only print offenders, not the summary")
    args = ap.parse_args()

    blocks, set_prereq = scan(args.content_dir)

    over, near = [], []
    for b in blocks:
        # Only blocks whose external button is actually shown are subject to the limit.
        if b["try_it"] == "false" or b["runnable"] == "false" or not b["cmds"]:
            continue
        b64 = _payload_b64_len(payload_for(b, set_prereq))
        size = b64 + args.overhead  # estimated HTTP request-line length
        if size > args.limit:
            over.append((size, b64, b))
        elif size > args.limit * args.warn_frac:
            near.append((size, b64, b))

    for size, b64, b in sorted(near, key=lambda x: x[0], reverse=True):
        print(f"WARN  req-line ~{size} B ({100*size/args.limit:.0f}% of "
              f"{args.limit}, b64={b64})  {b['set']}/{b['step']}  ({b['file']})")
    for size, b64, b in sorted(over, key=lambda x: x[0], reverse=True):
        print(f"OVER  req-line ~{size} B (> {args.limit}, b64={b64})  "
              f"{b['set']}/{b['step']}  ({b['file']})  -- set try_it=\"false\" "
              f"or trim to b64 <= {args.limit - args.overhead}")

    if not args.quiet:
        interactive = sum(1 for b in blocks
                          if b["try_it"] != "false" and b["runnable"] != "false"
                          and b["cmds"])
        print(f"\nScanned {len(blocks)} blocks ({interactive} interactive) under "
              f"{args.content_dir}/. Request-line limit={args.limit} B "
              f"(base64 payload + {args.overhead} B scaffolding). "
              f"{len(over)} over, {len(near)} near.")

    return 1 if over else 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Phase 0 of the tce-examples skill: audit a docs page for TCE coverage.

Finds every CLI example block on a page, extracts the Redis commands it demonstrates,
and reports which client libraries already implement it. Emits a human table by
default, or --json for a machine-readable work plan to drive the Phase 2 fan-out.

Command extraction delegates to build/components/cli_parser.extract_cli_commands so
the prompt-parsing rules live in exactly one place (and stay covered by
build/test_cli_parser.py). One wrinkle it does NOT handle: that parser recognises
"> " and "redis> " but not a full "127.0.0.1:6379> " prompt, which appears in real
pages. We normalise host:port prompts to "> " before delegating rather than
duplicating the parser.

Usage:
    python3 .claude/skills/tce-examples/scripts/audit_page.py content/commands/hset.md
    python3 .../audit_page.py --json content/commands/hset.md
    python3 .../audit_page.py content/develop/data-types/*.md
"""

from __future__ import annotations

import argparse
import json
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
sys.path.insert(0, os.path.join(REPO_ROOT, "build"))

from components.cli_parser import extract_cli_commands  # noqa: E402

CLIENTS_TSV = os.path.join(REPO_ROOT, "build", "example-test-harness", "clients.tsv")
EXAMPLES_JSON = os.path.join(REPO_ROOT, "data", "examples.json")

# A full redis-cli prompt, e.g. "127.0.0.1:6379> " or "localhost:6379> ". Normalised to
# "> " so extract_cli_commands sees a form it recognises.
HOSTPORT_PROMPT = re.compile(r"^\s*[\w.\-]+:\d+>\s")

# Block openers. Each entry: (format label, compiled opener, compiled closer).
#
# Closers are REGEXES, not literals. Hugo does not require the space before the closing
# delimiter, and real pages use both forms: 588 use `{{< /clients-example >}}` while
# content/commands/lpop.md, content/develop/get-started/data-store.md and
# content/develop/ai/search-and-query/query/exact-match.md use `{{< /clients-example>}}`.
# Matching a literal meant the block never closed on those pages: the scanner ran to end of
# file, so it reported a wrong line range and could absorb later CLI blocks' commands.
BLOCK_PATTERNS = [
    ("redis-cli", re.compile(r"{{%\s*redis-cli\s*%}}"),
     re.compile(r"{{%\s*/\s*redis-cli\s*%}}")),
    ("highlight", re.compile(r"{{<\s*highlight\b[^>]*>}}"),
     re.compile(r"{{<\s*/\s*highlight\s*>}}")),
    ("clients-example", re.compile(r"{{<\s*clients-example\b[^>]*(?<!/)>}}"),
     re.compile(r"{{<\s*/\s*clients-example\s*>}}")),
]
SELF_CLOSING = re.compile(r"{{<\s*clients-example\b[^>]*/>}}")
FENCE = re.compile(r"^\s*(`{3,}|~{3,})\s*([\w.+-]*)\s*$")

# set=/step= as named params, and the positional form: {{< clients-example id step ... >}}
NAMED_SET = re.compile(r'\bset="([^"]*)"')
NAMED_STEP = re.compile(r'\bstep="([^"]*)"')
POSITIONAL = re.compile(r'{{<\s*clients-example\s+"?([\w.\-]+)"?(?:\s+"?([\w.\-]*)"?)?')

# Languages that indicate a fenced block may hold CLI content rather than client code.
CLI_FENCE_LANGS = {"", "bash", "sh", "shell", "text", "plaintext", "console", "redis"}


def load_clients():
    """Return the ordered list of client display names from clients.tsv."""
    displays = []
    if not os.path.exists(CLIENTS_TSV):
        return displays
    with open(CLIENTS_TSV, encoding="utf-8") as fh:
        for line in fh:
            line = line.rstrip("\n")
            if not line.strip() or line.startswith("#"):
                continue
            fields = line.split("\t")
            if len(fields) > 1:
                displays.append(fields[1])
    return displays


def load_examples():
    """Return parsed data/examples.json, or {} if the site hasn't been built."""
    if not os.path.exists(EXAMPLES_JSON):
        return {}
    try:
        with open(EXAMPLES_JSON, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, json.JSONDecodeError):
        return {}


def commands_in(lines):
    """Extract Redis command names from block lines, normalising host:port prompts."""
    normalised = []
    for line in lines:
        if HOSTPORT_PROMPT.match(line):
            line = "> " + HOSTPORT_PROMPT.sub("", line, count=1)
        normalised.append(line.strip())
    return extract_cli_commands("\n".join(normalised))


def parse_shortcode_args(opener):
    """Pull (set, step) out of a clients-example opener, named or positional."""
    set_id = NAMED_SET.search(opener)
    step = NAMED_STEP.search(opener)
    if set_id or step:
        return (set_id.group(1) if set_id else "", step.group(1) if step else "")
    pos = POSITIONAL.search(opener)
    if pos:
        return (pos.group(1) or "", pos.group(2) or "")
    return ("", "")


def scan(path):
    """Find every CLI example block in a markdown file."""
    with open(path, encoding="utf-8") as fh:
        lines = fh.read().split("\n")

    blocks = []
    i = 0
    while i < len(lines):
        line = lines[i]

        # Self-closing clients-example: a reference to an existing example, no inline CLI.
        if SELF_CLOSING.search(line):
            set_id, step = parse_shortcode_args(line)
            blocks.append({
                "format": "clients-example (self-closing)",
                "start": i + 1, "end": i + 1,
                "set": set_id, "step": step, "commands": [],
            })
            i += 1
            continue

        matched = False
        for label, opener, closer in BLOCK_PATTERNS:
            if not opener.search(line):
                continue
            set_id, step = parse_shortcode_args(line) if label == "clients-example" else ("", "")
            body, j = [], i + 1
            while j < len(lines) and not closer.search(lines[j]):
                body.append(lines[j])
                j += 1
            if j >= len(lines):
                # Ran off the end: an unbalanced shortcode, or a closer form this scanner
                # doesn't recognise. Say so rather than silently reporting a bogus range.
                print(f"warning: {path}: unclosed {label} block opened at line {i + 1}",
                      file=sys.stderr)
            blocks.append({
                "format": label,
                "start": i + 1, "end": min(j + 1, len(lines)),
                "set": set_id, "step": step, "commands": commands_in(body),
            })
            i = j + 1
            matched = True
            break
        if matched:
            continue

        # Fenced code block.
        fence = FENCE.match(line)
        if fence:
            marker, lang = fence.group(1), fence.group(2).lower()
            body, j = [], i + 1
            while j < len(lines):
                closing = FENCE.match(lines[j])
                if closing and closing.group(1)[0] == marker[0] and not closing.group(2):
                    break
                body.append(lines[j])
                j += 1
            if lang in CLI_FENCE_LANGS:
                cmds = commands_in(body)
                if cmds:
                    blocks.append({
                        "format": f"fenced ({lang or 'no lang'})",
                        "start": i + 1, "end": min(j + 1, len(lines)),
                        "set": "", "step": "", "commands": cmds,
                    })
            i = j + 1
            continue

        i += 1
    return blocks


def coverage(examples, displays, set_id, step):
    """Return (implemented, missing, other) client display names for a set/step.

    Keys in data/examples.json that aren't client display names are reported as
    `other` rather than counted as coverage — a set carries metadata keys such as
    "steps_commands" alongside the per-client entries, and an empty `step` would
    otherwise tally those as implemented clients.
    """
    if not set_id or set_id not in examples:
        return ([], list(displays), [])
    known = set(displays)
    implemented, other = [], []
    for display, data in examples[set_id].items():
        if display not in known:
            other.append(display)
            continue
        if not isinstance(data, dict):
            continue
        steps = data.get("named_steps") or {}
        # An empty step means the set-level example, so presence of the client counts.
        if not step or step in steps:
            implemented.append(display)
    ordered = [d for d in displays if d in implemented]
    return (ordered, [d for d in displays if d not in implemented], sorted(other))


def audit(path, examples, displays):
    blocks = scan(path)
    for block in blocks:
        impl, missing, other = coverage(examples, displays, block["set"], block["step"])
        block["implemented"] = impl
        block["missing"] = missing
        block["unrecognised_keys"] = other
        if not block["set"]:
            block["status"] = "needs TCE (not wired to a shortcode)"
        elif not impl:
            block["status"] = "wired, no implementations found"
        elif missing:
            block["status"] = f"partial ({len(impl)} present, {len(missing)} missing)"
        else:
            block["status"] = "complete"
    return {"file": os.path.relpath(path, REPO_ROOT), "blocks": blocks}


def render(report, displays):
    rel = report["file"]
    blocks = report["blocks"]
    print(f"\n## {rel}")
    if not blocks:
        print("  No CLI example blocks found.")
        return
    print(f"  {len(blocks)} block(s); {len(displays)} clients in clients.tsv\n")
    for n, b in enumerate(blocks, 1):
        loc = f"L{b['start']}" if b["start"] == b["end"] else f"L{b['start']}-{b['end']}"
        ident = f'set="{b["set"]}" step="{b["step"]}"' if b["set"] else "—"
        print(f"  {n}. {b['format']}  {loc}")
        print(f"     shortcode : {ident}")
        print(f"     commands  : {', '.join(b['commands']) or '—'}")
        print(f"     status    : {b['status']}")
        if b["missing"] and b["set"]:
            print(f"     missing   : {', '.join(b['missing'])}")
        print()


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+", help="markdown file(s) to audit")
    ap.add_argument("--json", action="store_true",
                    help="emit a machine-readable work plan instead of a table")
    args = ap.parse_args()

    displays = load_clients()
    if not displays:
        print(f"warning: no clients read from {CLIENTS_TSV}", file=sys.stderr)
    examples = load_examples()
    if not examples:
        print("warning: data/examples.json missing or unreadable — coverage will read as "
              "empty. Run `python3 build/make.py` first.", file=sys.stderr)

    reports = []
    for path in args.paths:
        if not os.path.exists(path):
            print(f"error: no such file: {path}", file=sys.stderr)
            return 2
        reports.append(audit(path, examples, displays))

    if args.json:
        json.dump({"clients": displays, "reports": reports}, sys.stdout, indent=2)
        sys.stdout.write("\n")
    else:
        for report in reports:
            render(report, displays)
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python3
"""Report Markdown links whose target lives under a real content mount
(/operate/, /develop/, /integrate/, /commands/) but was never rewritten to
this migration's canonical `/content/<path>.md[#anchor]` form.

Why this exists (DOC-7104, PR #4086 review): `build/migrate_shortcode_links.py`
correctly canonicalizes almost everything, but a hand-fix applied AFTER its
pipeline ran -- inserting a separator slash a relref-plus-literal-suffix
concatenation was missing -- produces a syntactically fine bare path that
never gets a second pass through `linkify`. The bare path resolves to the
exact same rendered href as the canonical form, so
`build/diff_rendered_hrefs.py` (this migration's usual verification) is
BLIND to the defect by construction -- it only surfaced because a human
reviewer read the diff and recognized the shape, and even then caught 8 of
the 21 real instances in that one PR. This is the automated backstop: it
does not care WHY a link ended up bare (this concatenation idiom, a manual
fix, a future gap), only that it did.

Three outcomes per candidate link, and why each is handled differently:
  * FIXABLE -- resolves to a real content file via the exact same resolver
    `migrate_shortcode_links.py` uses (`_find_content_file`, no module-mount
    remapping). `--fix` rewrites it to the canonical form; without `--fix`
    it's reported so a human can choose to apply it.
  * MOUNT_ONLY -- doesn't resolve directly, but resolves once module mounts
    are followed (`check_shortcode_paths.resolve_relref`). The one real
    mount (rs/rc active-active) has an unresolved product question about
    which permalink is "correct" (see `migrate_shortcode_links.py`'s
    `_find_content_file` docstring) -- baking in a guess here would be
    exactly the kind of wrong rewrite this whole migration avoids. Reported,
    never auto-fixed.
  * DEAD -- doesn't resolve at all, by any route. A pre-existing broken
    link, invisible to every check before this one: Hugo's `relref`
    shortcode only ever validated its OWN target, never text a page
    author concatenated onto it afterward. Reported only -- guessing the
    intended real target is a content-fact decision, not a mechanical fix.

`/commands` and `/commands/` are a fourth, silent case: the commands index
is templated with no backing `_index.md` (a known, accepted gap -- see
project memory reference_commands_group_link_convention), so a bare
`/commands/?group=x` link is correct AS WRITTEN and not a finding.

Usage:
  build/check_uncanonicalized_links.py <file-or-dir>...
  build/check_uncanonicalized_links.py --fix <file-or-dir>...

Exit status: 1 if any FIXABLE or DEAD finding remains after running (0 if
--fix cleared every FIXABLE one and only MOUNT_ONLY findings remain, or if
there's nothing to report). MOUNT_ONLY alone does not fail the run -- it's
a known, deliberately-unresolved category, not a defect this script expects
to be zero.
"""

import sys
import os
import re
import argparse

sys.path.insert(0, os.path.dirname(__file__))
import migrate_shortcode_links as msl  # noqa: E402

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".claude", "hooks"))
import check_shortcode_paths as csp  # noqa: E402

MOUNT_PREFIX_RX = re.compile(r'^/(operate|develop|integrate|commands)(/|$)')


def find_root(start):
    return csp.find_root(start) or os.getcwd()


def iter_markdown_files(paths):
    for p in paths:
        if os.path.isdir(p):
            for dirpath, _dirs, filenames in os.walk(p):
                for name in filenames:
                    if name.endswith(".md"):
                        yield os.path.join(dirpath, name)
        elif p.endswith(".md"):
            yield p


def check_file(path, root):
    """Return a list of (category, line_no, old_href, new_href_or_None)."""
    text = open(path, encoding="utf-8").read()
    findings = []
    for m in msl.LINK_RX.finditer(text):
        href = m.group(1)
        if href.startswith(msl.SKIP_HREF_PREFIXES):
            continue
        if not MOUNT_PREFIX_RX.match(href):
            continue

        split = re.search(r"[#?]", href)
        base_ref, suffix = (href[: split.start()], href[split.start() :]) if split else (href, "")

        bare = base_ref.rstrip("/")
        if bare in ("/commands",):
            continue  # templated index, no backing file by design

        line_no = text.count("\n", 0, m.start()) + 1
        target = msl._find_content_file(root, base_ref)
        if target is not None:
            findings.append(("FIXABLE", line_no, href, f"/{target}{suffix}"))
            continue
        if csp.resolve_relref(root, base_ref):
            findings.append(("MOUNT_ONLY", line_no, href, None))
            continue
        findings.append(("DEAD", line_no, href, None))
    return findings


def apply_fixes(path, findings):
    fixable = [f for f in findings if f[0] == "FIXABLE"]
    if not fixable:
        return 0
    text = open(path, encoding="utf-8").read()
    for _cat, _line, old_href, new_href in fixable:
        old_link = "](" + old_href + ")"
        new_link = "](" + new_href + ")"
        text = text.replace(old_link, new_link)
    open(path, "w", encoding="utf-8").write(text)
    return len(fixable)


def main(argv):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("paths", nargs="+", help="files or directories to scan")
    parser.add_argument("--fix", action="store_true", help="rewrite FIXABLE links in place")
    args = parser.parse_args(argv)

    root = find_root(args.paths[0])
    files = sorted(set(iter_markdown_files(args.paths)))
    if not files:
        print("No .md files found under the given paths.")
        return 1

    totals = {"FIXABLE": 0, "MOUNT_ONLY": 0, "DEAD": 0}
    fixed = 0
    for path in files:
        findings = check_file(path, root)
        if not findings:
            continue
        if args.fix:
            fixed += apply_fixes(path, findings)
        for cat, line_no, old_href, new_href in findings:
            totals[cat] += 1
            if cat == "FIXABLE":
                arrow = " -> " + new_href if args.fix else " (would rewrite to " + new_href + ")"
                print(f"{cat:10} {path}:{line_no}  {old_href}{arrow}")
            else:
                print(f"{cat:10} {path}:{line_no}  {old_href}")

    print(
        f"\n{len(files)} files scanned. "
        f"FIXABLE={totals['FIXABLE']} MOUNT_ONLY={totals['MOUNT_ONLY']} DEAD={totals['DEAD']}"
        + (f" (fixed {fixed})" if args.fix else "")
    )
    if args.fix:
        return 1 if totals["DEAD"] else 0
    return 1 if (totals["FIXABLE"] or totals["DEAD"]) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

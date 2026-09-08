#!/usr/bin/env python3
"""Compare two Hugo `public/` builds by each page's href set, to verify a
shortcode-to-render-hook migration (DOC-6909) changed no reader-visible link.

Fingerprints rather than raw-diffs HTML, so benign whitespace/attribute-order
noise from the hook doesn't drown out real differences.

The build is known to be non-deterministic on two families even with zero
input change (develop/ai/redisvl/**, operate/rc/changelog/**) -- see project
memory reference_hugo_build_nondeterminism_control. Those are excluded by
default; pass --no-ignore-noisy to include them (e.g. to confirm the noise is
still confined to just those two).

Usage:
  build/diff_rendered_hrefs.py <public_before_dir> <public_after_dir> [path-prefix-filter] [--no-ignore-noisy]

A path-prefix-filter (e.g. "develop/clients/go") restricts the comparison to
pages under that URL prefix, so a single unit's migration doesn't require
diffing the whole 18k-page site.
"""

import sys
import os
import re
import hashlib

NOISY_PREFIXES = ("develop/ai/redisvl/", "operate/rc/changelog/")
HREF_RX = re.compile(r'href="[^"]*"')


def fingerprint(public_dir, prefix_filter=None):
    fps = {}
    for dirpath, _, filenames in os.walk(public_dir):
        for name in filenames:
            if not name.endswith(".html"):
                continue
            full = os.path.join(dirpath, name)
            rel = os.path.relpath(full, public_dir)
            if prefix_filter and not rel.startswith(prefix_filter):
                continue
            with open(full, encoding="utf-8", errors="replace") as f:
                hrefs = sorted(HREF_RX.findall(f.read()))
            fps[rel] = hashlib.md5("\n".join(hrefs).encode()).hexdigest()
    return fps


def is_noisy(rel):
    return any(rel.startswith(p) for p in NOISY_PREFIXES)


def main(argv):
    ignore_noisy = "--no-ignore-noisy" not in argv
    argv = [a for a in argv if a != "--no-ignore-noisy"]
    if len(argv) < 2:
        print(__doc__)
        return 1
    before_dir, after_dir = argv[0], argv[1]
    prefix_filter = argv[2] if len(argv) > 2 else None

    before = fingerprint(before_dir, prefix_filter)
    after = fingerprint(after_dir, prefix_filter)

    only_before = sorted(set(before) - set(after))
    only_after = sorted(set(after) - set(before))
    changed = sorted(p for p in set(before) & set(after) if before[p] != after[p])

    if ignore_noisy:
        skipped = [p for p in changed if is_noisy(p)]
        changed = [p for p in changed if not is_noisy(p)]
        if skipped:
            print(f"ignored {len(skipped)} known-nondeterministic pages (redisvl/changelog)")

    print(f"compared {len(before)} vs {len(after)} pages"
          + (f" under prefix '{prefix_filter}'" if prefix_filter else ""))
    print(f"only in before: {len(only_before)}")
    print(f"only in after:  {len(only_after)}")
    print(f"href set changed: {len(changed)}")
    for p in only_before[:20]:
        print(f"  - {p}")
    for p in only_after[:20]:
        print(f"  + {p}")
    for p in changed[:40]:
        print(f"  ~ {p}")

    return 1 if (only_before or only_after or changed) else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

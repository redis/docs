#!/usr/bin/env python3
"""Convert a content page from `relref`/callout shortcodes to the DOC-6909
render-hook equivalents: plain Markdown links resolved by
layouts/_default/_markup/render-link.html, and `> [!NOTE]` etc. blockquotes
resolved by layouts/_default/_markup/render-blockquote.html.

Formalizes the three ad hoc converters used to migrate develop/clients/redis-py
(the DOC-6909 proof section) so later sections don't reinvent them.

Stages, and why this order is load-bearing:
  1. relref-to-plain   -- unwrap `]({{< relref "X" >}})` to `](X)`.
  2. callouts-to-blockquote -- `{{< note >}}...{{< /note >}}` to `> [!NOTE]...`.
     MUST run before stage 3: shortcode callouts pipe their inner content
     through markdownify with no page context, so a link inside one resolves
     against site root, not the page -- only a native blockquote resolves
     links in page context.
  3. linkify -- rewrite any Markdown link (freshly unwrapped by stage 1, or
     already plain) whose target resolves to a real content page into the
     canonical `/content/<path>.md[#anchor]` form. Links that don't resolve
     to a content page (external, anchor-only, page-bundle resources) are
     left untouched -- a missed rewrite is fine, a wrong one is not.

Usage:
  build/migrate_shortcode_links.py <stage> <file>...
  build/migrate_shortcode_links.py all <file>...   # runs all 3 stages in order

Idempotent: re-running any stage on already-converted content is a no-op.
"""

import sys
import os
import re

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".claude", "hooks"))
import check_shortcode_paths as csp  # noqa: E402  (reuse mount-aware path resolution)

RELREF_RX = re.compile(r'\]\(\{\{<\s*relref\s+"([^"]*)"\s*>\}\}\)')
CALLOUT_RX = re.compile(
    r'\{\{<\s*(note|warning|tip|info|alert)\s*>\}\}(.*?)\{\{<\s*/\1\s*>\}\}',
    re.DOTALL,
)
LINK_RX = re.compile(r'\]\(([^)\s]+)\)')
SKIP_HREF_PREFIXES = ("http://", "https://", "mailto:", "#", "/content/")


def relref_to_plain(text):
    return RELREF_RX.sub(lambda m: f"]({m.group(1)})", text)


def callouts_to_blockquote(text):
    def repl(m):
        kind, body = m.group(1), m.group(2).strip("\n")
        lines = body.split("\n")
        quoted = "\n".join(f"> {line}" if line else ">" for line in lines)
        return f"> [!{kind.upper()}]\n{quoted}"

    return CALLOUT_RX.sub(repl, text)


def _find_content_file(root, ref):
    """Resolve a Hugo logical path (as written in an unwrapped relref -- absolute
    or bare-relative, both root-anchored per house style) to its actual content
    file, and return the winning repo-root-relative path, or None.

    Deliberately does NOT follow check_shortcode_paths' module-mount remapping
    (_mount_variants): that's fine for a read-only validator asking "does this
    resolve at all", but wrong for a rewrite. The one real mount
    (content/operate/rs/.../active-active/develop -> content/operate/rc/.../
    active-active/develop) has an open product question attached (DOC-6909
    mount probe: relref itself resolves an in-mount-target link to the rs
    permalink, leaving the rc mount -- surprising, but not this tool's call to
    make). Falling back to the mount source would silently bake that choice
    into a literal path forever. Leaving such a link as relref (unconverted)
    keeps it exactly as surprising/correct as it already was, and is
    consistent with "a missed rewrite is fine, a wrong one is not"."""
    path = csp._norm_relref(ref).lstrip("/")
    if not path:
        return None  # site root / current section -- nothing to rewrite to
    base = os.path.join(root, "content", path)
    for candidate_path in (base + ".md", os.path.join(base, "_index.md"), os.path.join(base, "index.md")):
        if csp._exists_exact(candidate_path):
            return os.path.relpath(candidate_path, root)
    parent, want = os.path.dirname(base), os.path.basename(base).lower()
    if not os.path.isdir(parent):
        return None
    try:
        entries = os.listdir(parent)
    except OSError:
        return None
    for e in entries:
        stem = e[:-3] if e.endswith(".md") else e
        if stem.lower() != want:
            continue
        hit = os.path.join(parent, e)
        if os.path.isdir(hit):
            for f in ("_index.md", "index.md"):
                fp = os.path.join(hit, f)
                if os.path.exists(fp):
                    return os.path.relpath(fp, root)
        else:
            return os.path.relpath(hit, root)
    return None


def linkify(text, root):
    def repl(m):
        href = m.group(1)
        if href.startswith(SKIP_HREF_PREFIXES):
            return m.group(0)
        base_ref, frag = href, ""
        if "#" in href:
            base_ref, anchor = href.split("#", 1)
            frag = "#" + anchor
        target = _find_content_file(root, base_ref)
        if target is None:
            return m.group(0)  # doesn't resolve to a page -- leave untouched
        return f"](/{target}{frag})"

    return LINK_RX.sub(repl, text)


STAGES = {
    "relref-to-plain": lambda text, root: relref_to_plain(text),
    "callouts-to-blockquote": lambda text, root: callouts_to_blockquote(text),
    "linkify": lambda text, root: linkify(text, root),
}


def convert_file(path, root, stages):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    original = text
    for stage in stages:
        text = STAGES[stage](text, root)
    if text != original:
        with open(path, "w", encoding="utf-8") as f:
            f.write(text)
    return text != original


def main(argv):
    if len(argv) < 2:
        print(__doc__)
        return 1
    stage, files = argv[0], argv[1:]
    if stage == "all":
        stages = ["relref-to-plain", "callouts-to-blockquote", "linkify"]
    elif stage in STAGES:
        stages = [stage]
    else:
        print(f"unknown stage: {stage}. Choices: all, {', '.join(STAGES)}", file=sys.stderr)
        return 1
    root = csp.find_root(files[0]) if files else csp.find_root(os.getcwd())
    if not root:
        print("could not locate Hugo root (content/ + layouts/)", file=sys.stderr)
        return 1
    changed = 0
    for fp in files:
        if convert_file(fp, root, stages):
            changed += 1
            print(f"converted: {os.path.relpath(fp, root)}")
    print(f"{changed}/{len(files)} files changed")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))

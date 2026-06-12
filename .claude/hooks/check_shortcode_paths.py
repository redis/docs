#!/usr/bin/env python3
"""PostToolUse hook: validate that Hugo shortcode file references point at real
project files, so hallucinated paths are caught at edit time rather than during
a doc build.

Two modes:
  * Hook mode (default): reads the PostToolUse JSON blob on stdin, pulls
    tool_input.file_path, validates that one markdown file. On a failure it
    prints to stderr and exits 2, which feeds the message back to Claude.
  * Scan mode (--scan [paths...] | --scan --all): validates the given files (or
    every content/**/*.md when --all) and prints a report. Used for dry-runs.

What gets checked:
  * file refs (image / image-card image / embed-code / embed-yaml / embed-md) —
    these point at concrete files (static/ or content/embeds/); a miss is a real
    build bug, so it always blocks.
  * relref links — only ABSOLUTE targets (e.g. "/develop/clients/foo"), and only
    those the current edit INTRODUCED (diff-scoped against git HEAD). Relative
    refs are skipped: Hugo's global-lookup fallback can't be replicated cheaply,
    and that's where false positives live. Resolution is a plain filesystem
    check (no page index, no front-matter parsing) — see resolve_relref.
"""

import sys
import os
import re
import json
import glob
import subprocess

# (name, regex capturing the path in group 1, resolver key)
HARD_RULES = [
    ("image",      re.compile(r'\{\{[<%]\s*image\s+[^>]*?\bfilename\s*=\s*["\']([^"\']+)["\']'), "static"),
    ("image-card", re.compile(r'\{\{[<%]\s*image-card\s+[^>]*?\bimage\s*=\s*["\']([^"\']+)["\']'), "static"),
    ("embed-code", re.compile(r'\{\{[<%]\s*embed-code\s+["\']([^"\']+)["\']'), "static-code"),
    ("embed-yaml", re.compile(r'\{\{[<%]\s*embed-yaml\s+["\']([^"\']+)["\']'), "embeds"),
    ("embed-md",   re.compile(r'\{\{[<%]\s*embed-md\s+["\']([^"\']+)["\']'), "embeds"),
]

# relref is validated only for ABSOLUTE targets, diff-scoped to links the current
# edit introduced (see head_relrefs). Set SHORTCODE_SKIP_RELREF=1 to turn it off.
RELREF_DISABLED = os.environ.get("SHORTCODE_SKIP_RELREF") == "1"
RELREF_RX = re.compile(r'\{\{[<%]\s*relref\s+["\']([^"\']+)["\']')


def find_root(start):
    """Walk up from a file/dir until we find the Hugo root (has content + layouts)."""
    d = os.path.abspath(start)
    if os.path.isfile(d):
        d = os.path.dirname(d)
    while True:
        if os.path.isdir(os.path.join(d, "content")) and os.path.isdir(os.path.join(d, "layouts")):
            return d
        parent = os.path.dirname(d)
        if parent == d:
            return None
        d = parent


def exists_any(*paths):
    return any(os.path.exists(p) for p in paths)


def _strip_frag(ref):
    return re.split(r"[#?]", ref, 1)[0]


def _strip_dots(rel):
    parts = rel.split("/")
    while parts and parts[0] in (".", ".."):
        parts.pop(0)
    return "/".join(parts)


def resolve_static(root, ref, src_file):
    ref = _strip_frag(ref)
    rel = ref.lstrip("/")
    stripped = _strip_dots(rel)
    cur = os.path.dirname(os.path.abspath(src_file))
    return exists_any(
        os.path.join(root, "static", stripped),
        os.path.join(root, "assets", stripped),
        os.path.join(root, "content", stripped),  # page-bundle resource
        os.path.join(root, "static", rel),
        os.path.join(root, "content", rel),
        os.path.normpath(os.path.join(cur, ref)),  # page-relative
    )


def resolve_static_code(root, ref, _src):
    rel = _strip_dots(_strip_frag(ref).lstrip("/"))
    return exists_any(os.path.join(root, "static", "code", rel),
                      os.path.join(root, "static", "code", os.path.basename(rel)))


def resolve_embeds(root, ref, _src):
    rel = _strip_frag(ref).lstrip("/")
    base = os.path.basename(rel)
    cands = []
    for c in (os.path.join(root, "content", "embeds", base),
              os.path.join(root, "content", "embeds", rel),
              os.path.join(root, "content", rel)):
        cands.append(c)
        if not c.endswith(".md"):
            cands.append(c + ".md")  # GetPage resolves extensionless refs
    return exists_any(*cands)


RESOLVERS = {
    "static": resolve_static,
    "static-code": resolve_static_code,
    "embeds": resolve_embeds,
}


def is_abs_relref(ref):
    """Only absolute, internal targets are resolvable confidently from disk."""
    p = _strip_frag(ref).strip()
    return p.startswith("/")


def _norm_relref(ref):
    """Reduce a relref target to a logical content path: drop anchor/query, a
    trailing slash, an author-written /index.md|/_index.md|/index|/_index, or .md."""
    path = _strip_frag(ref).rstrip("/")
    for suf in ("/index.md", "/_index.md", "/index", "/_index"):
        if path.endswith(suf):
            return path[: -len(suf)]
    if path.endswith(".md"):
        path = path[:-3]
    return path


def resolve_relref(root, ref):
    """Resolve an ABSOLUTE relref to a content page by trying the handful of
    filesystem forms a Hugo logical path can take. No index, no front matter."""
    path = _norm_relref(ref).lstrip("/")
    if not path:
        return True  # site root / current section
    base = os.path.join(root, "content", path)
    if os.path.isdir(base) or exists_any(
        base + ".md",
        os.path.join(base, "_index.md"),
        os.path.join(base, "index.md"),
    ):
        return True
    # case-insensitive fallback (the filesystem may be case-sensitive on CI)
    parent, want = os.path.dirname(base), os.path.basename(base).lower()
    if os.path.isdir(parent):
        for e in os.listdir(parent):
            stem = e[:-3] if e.endswith(".md") else e
            if stem.lower() == want:
                return True
    return False


def head_relrefs(path, root):
    """relref targets in the committed (HEAD) version of the file, so only links
    the current edit introduced get flagged. Returns None when the file isn't in
    HEAD (new/untracked) or git is unavailable -> then every relref is checked."""
    rel = os.path.relpath(os.path.abspath(path), root)
    try:
        out = subprocess.run(
            ["git", "-C", root, "show", f"HEAD:{rel}"],
            capture_output=True, text=True, timeout=5,
        )
    except Exception:
        return None
    if out.returncode != 0:
        return None
    return set(RELREF_RX.findall(out.stdout))


def check_file(path, root, prior_relrefs=None):
    """Return (broken, bad_links).
      broken    = image/embed file refs that don't exist (always checked).
      bad_links = absolute relrefs that don't resolve, minus any already present
                  in prior_relrefs (so only newly-added links are flagged).
    """
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except (OSError, UnicodeDecodeError):
        return [], []
    broken = []
    for name, rx, key in HARD_RULES:
        for m in rx.finditer(text):
            ref = m.group(1)
            if not RESOLVERS[key](root, ref, path):
                broken.append((name, ref))
    bad_links = []
    if not RELREF_DISABLED:
        for m in RELREF_RX.finditer(text):
            ref = m.group(1)
            if prior_relrefs is not None and ref in prior_relrefs:
                continue  # pre-existing link, not introduced by this edit
            if not is_abs_relref(ref):
                continue  # relative / pure-anchor -> skip (can't resolve cheaply)
            if not resolve_relref(root, ref):
                bad_links.append(("relref", ref))
    return broken, bad_links


def run_scan(argv):
    if "--all" in argv:
        root = find_root(os.getcwd()) or os.getcwd()
        files = glob.glob(os.path.join(root, "content", "**", "*.md"), recursive=True)
    else:
        files = [a for a in argv if a != "--scan"]
        root = (find_root(files[0]) if files else find_root(os.getcwd())) or os.getcwd()
    total_broken = total_links = files_with_issue = 0
    sample_broken, sample_links = [], []
    by_type = {}
    for fp in files:
        # scan mode checks ALL relrefs (prior=None), not just newly-added ones
        broken, bad_links = check_file(fp, root, None)
        if broken or bad_links:
            files_with_issue += 1
        if broken:
            total_broken += len(broken)
            for sc, ref in broken:
                by_type[sc] = by_type.get(sc, 0) + 1
                if len(sample_broken) < 40:
                    sample_broken.append(f"{os.path.relpath(fp, root)}: {sc} -> {ref}")
        if bad_links:
            total_links += len(bad_links)
            for sc, ref in bad_links:
                if len(sample_links) < 40:
                    sample_links.append(f"{os.path.relpath(fp, root)}: {sc} -> {ref}")
    print(f"Scanned {len(files)} files under {root}")
    print(f"BROKEN file refs: {total_broken}  {dict(sorted(by_type.items()))}")
    print(f"BROKEN relref links (absolute, all): {total_links}")
    if sample_broken:
        print("\n--- sample broken file refs (always block) ---")
        print("\n".join(sample_broken))
    if sample_links:
        print("\n--- sample broken absolute relrefs (block only when newly added) ---")
        print("\n".join(sample_links))
    return 0


def run_hook():
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return 0
    fp = (data.get("tool_input") or {}).get("file_path", "")
    if not fp or not fp.endswith(".md"):
        return 0
    root = find_root(fp)
    if not root or "/content/" not in os.path.abspath(fp).replace(os.sep, "/") + "/":
        return 0
    prior = head_relrefs(fp, root)
    broken, bad_links = check_file(fp, root, prior)
    if not broken and not bad_links:
        return 0
    lines = [f"Shortcode reference check for {os.path.relpath(fp, root)}:"]
    for sc, ref in broken:
        lines.append(f"  [broken file] {sc} points at a file that does not exist: {ref}")
    for sc, ref in bad_links:
        lines.append(f"  [broken link] relref target does not resolve to a page: {ref}")
    sys.stderr.write("\n".join(lines) + "\n")
    return 2


if __name__ == "__main__":
    if "--scan" in sys.argv:
        sys.exit(run_scan(sys.argv[1:]))
    sys.exit(run_hook())

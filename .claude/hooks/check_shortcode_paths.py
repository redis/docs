#!/usr/bin/env python3
"""PostToolUse hook: validate that Hugo shortcode file references point at real
project files, so hallucinated paths are caught at edit time rather than during
a doc build.

Two modes:
  * Hook mode (default): reads the PostToolUse JSON blob on stdin, pulls
    tool_input.file_path, validates that one markdown file. On a hard failure it
    prints to stderr and exits 2, which feeds the message back to Claude.
  * Scan mode (--scan [paths...] | --scan --all): validates the given files (or
    every content/**/*.md when --all) and prints a report. Used for dry-runs.

Severity:
  * hard  — image/image-card(image)/embed-code/embed-yaml/embed-md. These point
            at concrete files (static/ or content/embeds/); a miss is a real bug.
  * soft  — relref/image-card(url). Resolution is fuzzier (Hugo's GetPage does
            section/anchor/relative magic), so misses are warnings only.
"""

import sys
import os
import re
import json
import glob

# (name, regex capturing the path in group 1, resolver key)
HARD_RULES = [
    ("image",      re.compile(r'\{\{[<%]\s*image\s+[^>]*?\bfilename\s*=\s*["\']([^"\']+)["\']'), "static"),
    ("image-card", re.compile(r'\{\{[<%]\s*image-card\s+[^>]*?\bimage\s*=\s*["\']([^"\']+)["\']'), "static"),
    ("embed-code", re.compile(r'\{\{[<%]\s*embed-code\s+["\']([^"\']+)["\']'), "static-code"),
    ("embed-yaml", re.compile(r'\{\{[<%]\s*embed-yaml\s+["\']([^"\']+)["\']'), "embeds"),
    ("embed-md",   re.compile(r'\{\{[<%]\s*embed-md\s+["\']([^"\']+)["\']'), "embeds"),
]
# relref/image-card url resolution can't be replicated faithfully without Hugo
# (global lookup, aliases, generated /commands pages), and Hugo itself only WARNs
# on broken relrefs (config.toml: refLinksErrorLevel = "WARNING"). So these are
# OFF by default to keep the hook false-positive-free. Flip CHECK_RELREF to True
# (or set CHECK_SHORTCODE_RELREF=1 in the env) to surface them as non-blocking notes.
CHECK_RELREF = os.environ.get("CHECK_SHORTCODE_RELREF") == "1"
SOFT_RULES = [
    ("relref",         re.compile(r'\{\{[<%]\s*relref\s+["\']([^"\']+)["\']'), "relref"),
    ("image-card-url", re.compile(r'\{\{[<%]\s*image-card\s+[^>]*?\burl\s*=\s*["\']([^"\']+)["\']'), "relref"),
]


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


def resolve_relref(root, ref, src_file):
    # strip anchor / query, then trailing slash
    path = _strip_frag(ref).rstrip("/")
    if not path:
        return True  # pure anchor ref to current page
    if path.startswith("/"):
        bases = [os.path.join(root, "content", path.lstrip("/"))]
    else:
        cur = os.path.dirname(os.path.abspath(src_file))
        bases = [os.path.join(cur, path), os.path.join(root, "content", path)]
    candidates = []
    for b in bases:
        if b.endswith(".md"):
            candidates.append(b)  # ref already carried the .md extension
        else:
            candidates += [b + ".md", os.path.join(b, "_index.md"), os.path.join(b, "index.md")]
            if os.path.isdir(b):
                candidates.append(b)  # section dir served without an _index.md
    if exists_any(*candidates):
        return True
    # case-insensitive fallback (Hugo is lenient about case)
    lc = {c.lower() for c in candidates}
    for b in bases:
        parent = os.path.dirname(b)
        if os.path.isdir(parent):
            for entry in os.listdir(parent):
                if os.path.join(parent, entry).lower() in lc:
                    return True
    return False


RESOLVERS = {
    "static": resolve_static,
    "static-code": resolve_static_code,
    "embeds": resolve_embeds,
    "relref": resolve_relref,
}


def check_file(path, root):
    """Return (hard_misses, soft_misses) as lists of (shortcode, ref)."""
    try:
        with open(path, encoding="utf-8") as f:
            text = f.read()
    except (OSError, UnicodeDecodeError):
        return [], []
    hard, soft = [], []
    for name, rx, key in HARD_RULES:
        for m in rx.finditer(text):
            ref = m.group(1)
            if not RESOLVERS[key](root, ref, path):
                hard.append((name, ref))
    if CHECK_RELREF:
        for name, rx, key in SOFT_RULES:
            for m in rx.finditer(text):
                ref = m.group(1)
                if ref.startswith(("http://", "https://", "//", "mailto:")):
                    continue
                if not RESOLVERS[key](root, ref, path):
                    soft.append((name, ref))
    return hard, soft


def run_scan(argv):
    if "--all" in argv:
        root = find_root(os.getcwd()) or os.getcwd()
        files = glob.glob(os.path.join(root, "content", "**", "*.md"), recursive=True)
    else:
        files = [a for a in argv if a != "--scan"]
        root = (find_root(files[0]) if files else find_root(os.getcwd())) or os.getcwd()
    total_hard = total_soft = files_with_hard = 0
    sample_hard, sample_soft = [], []
    by_type = {}
    for fp in files:
        hard, soft = check_file(fp, root)
        if hard:
            files_with_hard += 1
            total_hard += len(hard)
            for sc, ref in hard:
                by_type[sc] = by_type.get(sc, 0) + 1
                if len(sample_hard) < 40:
                    sample_hard.append(f"{os.path.relpath(fp, root)}: {sc} -> {ref}")
        if soft:
            total_soft += len(soft)
            for sc, ref in soft:
                if len(sample_soft) < 40:
                    sample_soft.append(f"{os.path.relpath(fp, root)}: {sc} -> {ref}")
    print(f"Scanned {len(files)} files under {root}")
    print(f"HARD misses: {total_hard} across {files_with_hard} files  {dict(sorted(by_type.items()))}")
    print(f"SOFT misses: {total_soft}")
    if sample_hard:
        print("\n--- sample HARD misses (these would block an edit) ---")
        print("\n".join(sample_hard))
    if sample_soft:
        print("\n--- sample SOFT misses (warn only) ---")
        print("\n".join(sample_soft))
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
    hard, soft = check_file(fp, root)
    if not hard and not soft:
        return 0
    lines = [f"Shortcode reference check for {os.path.relpath(fp, root)}:"]
    for sc, ref in hard:
        lines.append(f"  [broken] {sc} points at a file that does not exist: {ref}")
    for sc, ref in soft:
        lines.append(f"  [warn]   {sc} could not be resolved (verify it exists): {ref}")
    sys.stderr.write("\n".join(lines) + "\n")
    return 2 if hard else 0


if __name__ == "__main__":
    if "--scan" in sys.argv:
        sys.exit(run_scan(sys.argv[1:]))
    sys.exit(run_hook())

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

Guiding principle: a false block is worse than a missed catch. When resolution
is uncertain the hook errs toward NOT blocking.

What gets checked:
  * file refs (image / image-card image / embed-code / embed-yaml / embed-md) —
    these point at concrete files (static/ or content/embeds/); a miss is a real
    build bug, so it always blocks. File-ref existence is case-exact at the leaf
    so wrong-case paths (which fail on a case-sensitive build host) are caught.
  * relref links — only ABSOLUTE targets (e.g. "/develop/clients/foo"), and only
    those the current edit INTRODUCED (diff-scoped against git HEAD). Relative
    refs are skipped (Hugo's global-lookup fallback can't be replicated cheaply).
    Resolution is a plain filesystem check that also follows Hugo module mounts
    (config.toml [[module.mounts]]) so mounted content isn't wrongly flagged.
  * plain `/content/<path>.md` links — the repo-root-relative notation the
    render-link.html hook resolves in place of relref (DOC-6909). Same
    diff-scoping and resolution as relref, after trimming the "/content"
    prefix: this is deliberately the one form the migration converters emit
    (explicit .md/_index.md/index.md suffix), not the full extensionless
    space Hugo could otherwise resolve.
"""

import sys
import os
import re
import json
import glob
import subprocess
from collections import Counter

# (name, regex capturing the path in group 1, resolver key). The pre-attribute
# wildcard is [^}] (not [^>]) so a '>' inside an earlier attribute value (e.g.
# alt="A > B") doesn't hide a later filename=/image=.
# The pre-attribute body uses a tempered match (?:(?!\}\}).)*? — "any char until
# the shortcode's closing }}" — so a '>' or '}' inside an earlier attribute value
# (e.g. alt="A > B", alt="hash {slot}") can't hide a later filename=/image=, and
# the match can't bleed into the next shortcode. (?![\w-]) stops "image" matching
# "image-card".
HARD_RULES = [
    ("image",      re.compile(r'\{\{[<%]\s*image(?![\w-])(?:(?!\}\}).)*?\bfilename\s*=\s*["\']([^"\']+)["\']'), "static"),
    ("image-card", re.compile(r'\{\{[<%]\s*image-card(?![\w-])(?:(?!\}\}).)*?\bimage\s*=\s*["\']([^"\']+)["\']'), "static"),
    ("embed-code", re.compile(r'\{\{[<%]\s*embed-code\s+["\']([^"\']+)["\']'), "static-code"),
    ("embed-yaml", re.compile(r'\{\{[<%]\s*embed-yaml\s+["\']([^"\']+)["\']'), "embed-yaml"),
    ("embed-md",   re.compile(r'\{\{[<%]\s*embed-md\s+["\']([^"\']+)["\']'), "embeds"),
]

# relref is validated only for ABSOLUTE targets, diff-scoped to links the current
# edit introduced (see head_text). Set SHORTCODE_SKIP_RELREF=1 to turn it off.
RELREF_DISABLED = os.environ.get("SHORTCODE_SKIP_RELREF") == "1"
RELREF_RX = re.compile(r'\{\{[<%]\s*relref\s+["\']([^"\']+)["\']')

# Plain `/content/<path>.md[?query][#fragment]` links (the relref-replacement
# notation), same diff-scoping as relref. Requires the literal .md/_index.md/
# index.md suffix the converters emit -> see module docstring. The optional
# `?query` (house style's `?group=` command-reference links) is what linkify
# preserves when it rewrites such a link -- resolve_plain_link/_norm_relref
# already strip both `?` and `#` before resolving, this just makes sure the
# regex captures that href shape in the first place. Set
# SHORTCODE_SKIP_PLAIN_LINK=1 to turn it off.
PLAIN_LINK_DISABLED = os.environ.get("SHORTCODE_SKIP_PLAIN_LINK") == "1"
PLAIN_LINK_RX = re.compile(r'\]\((/content/[^)\s]+\.md(?:\?[^)\s#]*)?(?:#[^)\s]*)?)\)')


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


def _exists_exact(p):
    """os.path.exists, but also require the final path component's case to match
    what's stored on disk, so wrong-case refs that fail on a case-sensitive build
    host are caught. Falls back to True if the parent can't be listed, so it never
    invents a false 'missing' (no false block)."""
    if not os.path.exists(p):
        return False
    parent = os.path.dirname(p) or "."
    try:
        return os.path.basename(p) in os.listdir(parent)
    except OSError:
        return True


def exists_exact_any(*paths):
    return any(_exists_exact(p) for p in paths)


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
    return exists_exact_any(
        os.path.join(root, "static", stripped),
        os.path.join(root, "assets", stripped),
        os.path.join(root, "content", stripped),  # page-bundle resource
        os.path.join(root, "static", rel),
        os.path.join(root, "content", rel),
        os.path.normpath(os.path.join(cur, ref)),  # page-relative
    )


def resolve_embed_code(root, ref, _src):
    # embed-code does readFile "./static/code/<arg>" exactly, so the check is
    # exact (and case-strict): no basename/extension/fragment leniency, which
    # Hugo's readFile does not allow. Exact can't false-block a Hugo-valid embed.
    return _exists_exact(os.path.join(root, "static", "code", ref.lstrip("/")))


def resolve_embed_yaml(root, ref, _src):
    # embed-yaml does readFile "./content/embeds/<arg>" exactly -> same exact check.
    return _exists_exact(os.path.join(root, "content", "embeds", ref.lstrip("/")))


def resolve_embeds(root, ref, _src):
    # embed-md resolves via .Site.GetPage, which IS lenient (extensionless,
    # basename, etc.), so accept the broader candidate set here.
    rel = _strip_frag(ref).lstrip("/")
    base = os.path.basename(rel)
    cands = []
    for c in (os.path.join(root, "content", "embeds", base),
              os.path.join(root, "content", "embeds", rel),
              os.path.join(root, "content", rel)):
        cands.append(c)
        if not c.endswith(".md"):
            cands.append(c + ".md")  # GetPage resolves extensionless refs
    return exists_exact_any(*cands)


RESOLVERS = {
    "static": resolve_static,
    "static-code": resolve_embed_code,
    "embed-yaml": resolve_embed_yaml,
    "embeds": resolve_embeds,
}


# ---- relref resolution (absolute only) ----------------------------------------

_MOUNTS_CACHE = {}


def _load_mounts(root):
    """Parse [[module.mounts]] source/target pairs from config.toml so relrefs to
    mounted (target) paths can be remapped to their physical (source) location.
    Returns [(target_rel, source_rel)] with the leading path kept as written."""
    mounts = []
    try:
        text = open(os.path.join(root, "config.toml"), encoding="utf-8").read()
    except OSError:
        return mounts
    for block in re.split(r"\[\[module\.mounts\]\]", text)[1:]:
        block = re.split(r"\n\s*\[", block)[0]  # stop at next table
        s = re.search(r'source\s*=\s*"([^"]+)"', block)
        t = re.search(r'target\s*=\s*"([^"]+)"', block)
        if s and t:
            mounts.append((t.group(1).strip("/"), s.group(1).strip("/")))
    return mounts


def _mounts(root):
    if root not in _MOUNTS_CACHE:
        _MOUNTS_CACHE[root] = _load_mounts(root)
    return _MOUNTS_CACHE[root]


def _mount_variants(path, root):
    """A content-relative path plus any module-mount source equivalents."""
    variants = [path]
    full = "content/" + path
    for target_rel, source_rel in _mounts(root):
        if full == target_rel or full.startswith(target_rel + "/"):
            remapped = source_rel + full[len(target_rel):]
            if remapped.startswith("content/"):
                variants.append(remapped[len("content/"):])
    return variants


def is_abs_relref(ref):
    """Only absolute, internal targets are resolvable confidently from disk."""
    return _strip_frag(ref).strip().startswith("/")


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


def _base_resolves(base):
    if os.path.isdir(base) or exists_any(
        base + ".md", os.path.join(base, "_index.md"), os.path.join(base, "index.md")
    ):
        return True
    # case-insensitive fallback: relref URLs are case-folded by Hugo, so don't
    # block on case alone (this is the false-block-averse direction for links).
    parent, want = os.path.dirname(base), os.path.basename(base).lower()
    if os.path.isdir(parent):
        try:
            entries = os.listdir(parent)
        except OSError:
            return True  # parent exists but unlistable -> fail open, don't block
        for e in entries:
            stem = e[:-3] if e.endswith(".md") else e
            if stem.lower() == want:
                return True
    return False


def resolve_relref(root, ref):
    """Resolve an ABSOLUTE relref to a content page by trying the handful of
    filesystem forms a Hugo logical path can take, following module mounts. No
    page index, no front-matter parsing."""
    path = _norm_relref(ref).lstrip("/")
    if not path:
        return True  # site root / current section
    return any(_base_resolves(os.path.join(root, "content", cand))
               for cand in _mount_variants(path, root))


def resolve_plain_link(root, ref):
    """A `/content/<path>.md` link (PLAIN_LINK_RX already guarantees the
    prefix). render-link.html resolves these by trimming the leading
    "/content" and otherwise following the same GetPage path as relref, so
    reuse resolve_relref on the trimmed remainder."""
    return resolve_relref(root, ref[len("/content"):])


# ---- diff scoping --------------------------------------------------------------

def head_text(path, root):
    """Committed (HEAD) content of the file. Returns:
      * the file's text  -> file is in HEAD; diff link occurrences against it.
      * "NEW"             -> file is genuinely new/untracked; check every link.
      * None              -> git unavailable/timeout/other error; SKIP link
                             checks entirely (fail safe -> never false-block)."""
    rel = os.path.relpath(os.path.abspath(path), root)
    try:
        out = subprocess.run(
            ["git", "-C", root, "show", f"HEAD:{rel}"],
            capture_output=True, text=True, timeout=5,
        )
    except Exception:
        return None
    if out.returncode == 0:
        return out.stdout
    err = (out.stderr or "").lower()
    if "does not exist in" in err or "exists on disk, but not in" in err:
        return "NEW"  # confirmed new file -> check every link
    return None       # not a repo / other failure -> skip links to avoid false blocks


def _new_occurrences(text, prior, rx):
    """Occurrences of rx in text beyond however many were already in prior
    ("NEW" counts none as prior; otherwise prior is the HEAD text to diff
    against)."""
    prior_counts = Counter() if prior == "NEW" else Counter(rx.findall(prior))
    seen = Counter()
    for m in rx.finditer(text):
        ref = m.group(1)
        seen[ref] += 1
        if seen[ref] > prior_counts.get(ref, 0):
            yield ref


def check_file(path, root, prior):
    """Return (broken, bad_links).
      broken    = image/embed file refs that don't exist (always checked).
      bad_links = absolute relrefs / `/content/*.md` links that don't resolve.
                  prior controls their scope (both share it):
                  None  -> skip link checks entirely;
                  "NEW" -> check every occurrence (new file / dry-run);
                  text  -> check only occurrences beyond those already in
                           this HEAD text.
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
    if prior is not None:
        if not RELREF_DISABLED:
            for ref in _new_occurrences(text, prior, RELREF_RX):
                if is_abs_relref(ref) and not resolve_relref(root, ref):
                    bad_links.append(("relref", ref))
        if not PLAIN_LINK_DISABLED:
            for ref in _new_occurrences(text, prior, PLAIN_LINK_RX):
                if not resolve_plain_link(root, ref):
                    bad_links.append(("link", ref))
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
    by_link_type = {}
    for fp in files:
        # scan mode checks ALL occurrences ("NEW"), not just newly-added ones
        broken, bad_links = check_file(fp, root, "NEW")
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
                by_link_type[sc] = by_link_type.get(sc, 0) + 1
                if len(sample_links) < 40:
                    sample_links.append(f"{os.path.relpath(fp, root)}: {sc} -> {ref}")
    print(f"Scanned {len(files)} files under {root}  ({files_with_issue} with issues)")
    print(f"BROKEN file refs: {total_broken}  {dict(sorted(by_type.items()))}")
    print(f"BROKEN links (relref + /content/*.md, absolute, all): {total_links}  {dict(sorted(by_link_type.items()))}")
    if sample_broken:
        print("\n--- sample broken file refs (always block) ---")
        print("\n".join(sample_broken))
    if sample_links:
        print("\n--- sample broken relref/link targets (block only when newly added) ---")
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
    prior = head_text(fp, root)
    broken, bad_links = check_file(fp, root, prior)
    if not broken and not bad_links:
        return 0
    lines = [f"Shortcode reference check for {os.path.relpath(fp, root)}:"]
    for sc, ref in broken:
        lines.append(f"  [broken file] {sc} points at a file that does not exist: {ref}")
    for sc, ref in bad_links:
        target = "relref target" if sc == "relref" else "link target"
        lines.append(f"  [broken link] {target} does not resolve to a page: {ref}")
    sys.stderr.write("\n".join(lines) + "\n")
    return 2


if __name__ == "__main__":
    if "--scan" in sys.argv:
        sys.exit(run_scan(sys.argv[1:]))
    try:
        sys.exit(run_hook())
    except Exception:
        sys.exit(0)  # never block an edit because of a hook bug (fail open)

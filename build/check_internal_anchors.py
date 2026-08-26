"""Report internal links whose target page or heading anchor doesn't exist.

Two classes of internal link are invisible to the build, and both were behind
DOC-6998 and DOC-7003:

1. **Absolute self-links.** ``https://redis.io/docs/...`` written out in full rather
   than as a ``relref``. Hugo treats them as external and never resolves them;
   ``.lychee.toml`` excludes ``redis.io`` as internal. So they fall in a hole and
   nothing checks them. Four legacy ones hard-404 on the live site today.

2. **relref with an anchor.** ``{{< relref "/a/b#some-heading" >}}`` resolves the
   *page*, so a broken ``#anchor`` builds clean and fails silently in the reader's
   browser. `relref` validates pages, never headings.

Both are deterministic and offline: the answer is in the built ``public/`` tree, so
there is no network, no rate limiting and no false-positive story of the kind that
makes external anchor checking unusable.

Design notes, each of which is load-bearing:

* **Anchors come from Hugo's own output, never from a reimplemented slug rule.**
  This repo already contains three disagreeing slug implementations (DOC-6905); a
  fourth would be a liability. Reading ``id=``/``name=`` out of the built HTML uses
  Hugo as the oracle.
* **Only the docs tree is resolvable.** ``redis.io/blog/``, ``/legal/``, ``/pricing/``
  and friends are the marketing site, built elsewhere and absent from ``public/``.
  They are reported as SKIPPED, never as broken -- 121 of the 199 distinct
  self-links are of that kind, so treating them as missing would bury the real ones.
* **Alias stubs count as resolved.** Hugo writes a redirecting stub at an alias URL,
  which is exactly what a reader gets, so a link to an aliased path is not broken.
* **The URL prefix is configurable** because CI rewrites ``baseURL`` to include a
  path prefix (``https://redis.io/docs/latest``) while ``public/`` stays rooted at
  the tree root. A mapping hardcoded to the local layout would silently pass in CI.
* **Attribute quoting is optional in the regex.** Hugo drops optional quotes when
  minifying. This site doesn't minify today, but assuming quotes is precisely the
  bug that made an earlier audit report 23 present anchors as missing.
* **Legacy ``<a name="...">`` anchors are part of the pool.** ``protocol-spec.md``
  alone defines 17 of them, and command pages link to them by name.

Usage::

    build/check_internal_anchors.py [--public public] [--content content] [--json]

Exits 1 when anything is MISSING, 0 otherwise. ``--json`` prints machine-readable
findings for a workflow to post.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from urllib.parse import unquote

# Mirrors SKIP_SOURCE_PATHS in build/extract_external_urls.sh. Kept textually
# identical so the two tools cannot disagree about what "current docs" means --
# archived version trees and release notes are frozen and out of scope.
SKIP_SOURCE_PATHS = re.compile(
    r"/(kubernetes|rs|rc|redis-data-integration|redisvl)/[0-9]"
    r"|/release-notes/"
    r"|/legacy-release-notes/"
)

# Path prefixes stripped from a self-link before resolving it against public/.
# Longest first: /docs/latest/ must win over /docs/.
URL_PREFIXES = ("/docs/latest/", "/docs/staging/", "/docs/")

# First path segments that live in the docs tree. Anything else on redis.io is the
# marketing site and cannot be resolved from public/.
DOCS_SEGMENTS = {
    "docs", "commands", "develop", "operate", "integrate", "embeds",
}

SELF_LINK_PATTERNS = (
    re.compile(r"\]\(\s*(https?://(?:www\.)?redis\.io[^\s)]*)\s*\)"),
    re.compile(r"""href=["'](https?://(?:www\.)?redis\.io[^"']*)["']"""),
    re.compile(r"<(https?://(?:www\.)?redis\.io[^>\s]*)>"),
)

RELREF_ANCHORED = re.compile(
    r"""relref\s+["'](?P<path>/[^"'#]*)#(?P<anchor>[^"']+)["']"""
)

# id= / name= with double, single, or absent quotes.
# A page that mounts its content client-side (the OpenAPI reference pages use Redoc)
# exposes almost no anchors in its static HTML -- the api-reference page has 3 against
# 130 on a normal content page. Its anchors are real in the browser and invisible here,
# so they are UNVERIFIABLE, never missing. Reporting them would be the single largest
# false-positive class: 69 of an unfiltered 172 findings.
CLIENT_RENDERED = re.compile(r"redoc|swagger-ui|rapidoc", re.I)

ANCHOR_ATTR = re.compile(
    r"""(?:id|name)\s*=\s*(?:"([^"]+)"|'([^']+)'|([A-Za-z0-9_:.\-]+))"""
)


def live_sources(content: Path) -> list[Path]:
    """Markdown files representing current docs (archives excluded)."""
    return sorted(
        p for p in content.rglob("*.md") if not SKIP_SOURCE_PATHS.search(p.as_posix())
    )


def anchors_in(html: Path, _cache: dict[Path, set[str]] = {}) -> set[str]:
    """Every anchor a browser could jump to on a built page."""
    if html not in _cache:
        text = html.read_text(encoding="utf-8", errors="replace")
        found = set()
        for m in ANCHOR_ATTR.finditer(text):
            found.add(next(g for g in m.groups() if g is not None))
        _cache[html] = found
    return _cache[html]


def is_client_rendered(html: Path, _cache: dict[Path, bool] = {}) -> bool:
    """True when the page builds its content in the browser, so anchors can't be read."""
    if html not in _cache:
        _cache[html] = bool(CLIENT_RENDERED.search(
            html.read_text(encoding="utf-8", errors="replace")))
    return _cache[html]


def resolve_page(public: Path, url_path: str) -> Path | None:
    """Map a site path to its built HTML file, or None if it isn't in the tree."""
    rel = url_path.strip("/")
    # The literal path first: the docs tree publishes non-page artifacts too
    # (sitemap.xml, docs.ndjson, the .md twin of every page), and a link to one of
    # those is a link to a real file, not a page that failed to resolve.
    for candidate in (
        public / rel,
        public / rel / "index.html",
        public / f"{rel}.html",
    ):
        if candidate.is_file():
            return candidate
    if not rel:
        root = public / "index.html"
        return root if root.is_file() else None
    return None


def self_link_target(url: str) -> tuple[str, str] | None:
    """Split a self-link into (site path, anchor), or None if outside the docs tree."""
    body = re.sub(r"^https?://(?:www\.)?redis\.io", "", url)
    path, _, anchor = body.partition("#")
    path = path.split("?", 1)[0] or "/"
    first = path.strip("/").split("/", 1)[0]
    if first not in DOCS_SEGMENTS:
        return None
    for prefix in URL_PREFIXES:
        if path.startswith(prefix):
            path = "/" + path[len(prefix):]
            break
    return path, unquote(anchor)


def check(content: Path, public: Path) -> tuple[list[dict], dict[str, int]]:
    findings: list[dict] = []
    tally = {"self_ok": 0, "self_skipped": 0, "relref_ok": 0,
             "relref_unhandled": 0, "unverifiable": 0}

    for src in live_sources(content):
        rel_src = src.as_posix()
        for lineno, line in enumerate(src.read_text(encoding="utf-8", errors="replace").splitlines(), 1):
            for pattern in SELF_LINK_PATTERNS:
                for m in pattern.finditer(line):
                    url = m.group(1).rstrip(".,;:")
                    target = self_link_target(url)
                    if target is None:
                        tally["self_skipped"] += 1
                        continue
                    path, anchor = target
                    page = resolve_page(public, path)
                    if page is None:
                        findings.append(dict(kind="self-link", file=rel_src,
                                             line=lineno, target=url,
                                             problem="page not in built site"))
                        continue
                    if anchor and is_client_rendered(page):
                        tally["unverifiable"] += 1
                        continue
                    if anchor and anchor not in anchors_in(page):
                        findings.append(dict(kind="self-link", file=rel_src,
                                             line=lineno, target=url,
                                             problem=f"anchor #{anchor} not on page"))
                        continue
                    tally["self_ok"] += 1

            for m in RELREF_ANCHORED.finditer(line):
                path, anchor = m.group("path"), unquote(m.group("anchor"))
                page = resolve_page(public, path)
                if page is None:
                    # A relref that didn't resolve would have failed the build, so
                    # this means the path shape isn't one we map (not a defect).
                    tally["relref_unhandled"] += 1
                    continue
                if is_client_rendered(page):
                    tally["unverifiable"] += 1
                    continue
                if anchor not in anchors_in(page):
                    findings.append(dict(kind="relref", file=rel_src, line=lineno,
                                         target=f'{path}#{anchor}',
                                         problem=f"anchor #{anchor} not on target page"))
                    continue
                tally["relref_ok"] += 1

    return findings, tally


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--content", type=Path, default=Path("content"))
    ap.add_argument("--public", type=Path, default=Path("public"))
    ap.add_argument("--json", action="store_true", help="emit findings as JSON")
    args = ap.parse_args(argv)

    if not args.public.is_dir():
        print(f"ERROR: '{args.public}' not found. Build the site first (make hugo).",
              file=sys.stderr)
        return 2

    findings, tally = check(args.content, args.public)

    # A run that checked nothing must never look like a pass. If the corpus yields
    # no resolvable links at all, the scoping or the build is broken, not the docs.
    checked = tally["self_ok"] + tally["relref_ok"] + len(findings)
    if checked == 0:
        print("ERROR: resolved 0 internal links; scoping or the build likely failed.",
              file=sys.stderr)
        return 2

    if args.json:
        print(json.dumps({"findings": findings, "tally": tally}, indent=2))
    else:
        for f in findings:
            print(f"{f['file']}:{f['line']}: {f['kind']}: {f['target']} -- {f['problem']}")
        print(
            f"\nchecked {checked} internal links: "
            f"{tally['self_ok']} self-links OK, {tally['relref_ok']} anchored relrefs OK, "
            f"{len(findings)} broken "
            f"({tally['self_skipped']} self-links outside the docs tree skipped, "
            f"{tally['relref_unhandled']} relref paths unmapped)",
            file=sys.stderr,
        )
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main())

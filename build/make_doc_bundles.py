#!/usr/bin/env python3
"""Package a finished Hugo build into per-product documentation download bundles.

The download widget on every documentation page lets a reader pick products, a
version for each versioned product, and a file format. This script produces the
.tar.gz that every one of those choices maps to, so nothing has to be assembled
at request time: the page links straight at these files, and merges several of
them in the browser when more than one product is picked (see
static/js/download-docs.js).

The products, their paths, and the formats all come from data/doc_bundles.json,
which the widget's template reads too -- the two cannot drift apart.

Bundle file names are `<docset>-<version>-<format>.tar.gz`, e.g.
`redis-software-7.22-md.tar.gz`. Inside, everything lives under
`redis-docs/<docset>-<version>/` so that merged archives from several products
unpack into one coherent tree without colliding.

Bundles are byte-for-byte reproducible -- fixed mtimes, sorted entries, and no
build timestamp anywhere inside the archive -- so `gsutil rsync -c` only
re-uploads a bundle whose content actually changed. Build metadata that does
change every run (sizes, checksums) goes in the separate index file instead.

Usage:

    # every product, at the version published on the unversioned path
    python3 build/make_doc_bundles.py --source public --out bundles

    # one archived version, from a versioned matrix build
    python3 build/make_doc_bundles.py --source output --out bundles \
        --only redis-software --version 7.22
"""

import argparse
import gzip
import hashlib
import io
import json
import os
import posixpath
import re
import sys
import tarfile
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_MANIFEST = REPO_ROOT / "data" / "doc_bundles.json"
DEFAULT_URL_BASE = "https://redis.io/docs/latest/"

# Hugo publishes one directory per page holding one file per output format (see
# [outputs] in config.toml), so a page is any directory containing `file`.
# `suffix` is the extension the file takes inside the bundle; None means keep
# the published directory layout as-is.
FORMATS = {
    "md": {"file": "index.html.md", "suffix": ".md"},
    "md-single": {"file": "index.html.md", "suffix": None},
    "html": {"file": "index.html", "suffix": None},
    "json": {"file": "index.json", "suffix": ".json"},
}

# Archived versions live in directories named after the version (7.22, 7.4.6).
VERSION_DIR = re.compile(r"^\d+(?:\.\d+)*$")

# Fixed timestamp for every archive member. See the note on reproducibility above.
FIXED_MTIME = 0

TAR_ROOT = "redis-docs"

# --- Offline HTML -----------------------------------------------------------
#
# The published pages address everything from the site root -- /css/..., /images/...,
# /operate/... -- which resolves to the filesystem root when a page is opened with
# file://, so an untouched copy loads without styling and with dead links. For the
# html format the URLs are therefore rewritten per page: to a path inside the
# archive when the target travels with it, and to the live site when it does not.

# Attributes carrying a single URL. Relative ones matter as much as root-relative
# ones: a page written with ../../../../../images/x.png is correct on the site, where
# that climbs to the site root, and wrong in a bundle rooted at the product. Both
# forms are resolved to a site path and rewritten from there.
HTML_URL = re.compile(
    r'(?P<lead>\b(?:href|src|poster|action|data-src)\s*=\s*)(?P<q>["\'])(?P<url>[^"\'>]*)(?P=q)'
)
# Schemes, fragments, bare queries, empty values, and template placeholders in inline
# scripts: none of them name a file in the build.
NOT_A_PATH = re.compile(r'^(?:[a-zA-Z][\w+.-]*:|//|#|\?|\$\{|\s*$)')
CSS_ROOT_URL = re.compile(r'url\(\s*(?P<q>["\']?)(?P<url>/[^"\')\s]+)(?P=q)\s*\)')

# The path the site is published under, read back off any asset reference: "" for a
# bare local build, "/docs/latest" in production.
SITE_PREFIX_HINT = re.compile(
    r'(?:href|src)\s*=\s*["\'](?P<prefix>(?:/[\w.-]+)*?)/(?:css|scss|js|fonts|images)/'
)

BODY_OPEN = re.compile(r'<body\b[^>]*>', re.IGNORECASE)

# The site header: search, product menus, sign-in. None of it works from a copy on
# disk, so it is emptied -- the bar itself stays, keeping the page's proportions.
HEADER_BLOCK = re.compile(r'(?P<open><header\b[^>]*>).*?</header>', re.IGNORECASE | re.DOTALL)

# Templates mark whatever cannot work from a copy on disk -- "Edit this page", "Ask
# AI", and the like -- so that this script does not have to recognise their markup.
# Grep the layouts for data-offline-hide to see what is dropped.
OFFLINE_HIDE = re.compile(r'<(?P<tag>[a-zA-Z][\w-]*)\b[^>]*\bdata-offline-hide\b[^>]*>')

# A bundle holds one product, but the sidebar lists its neighbours too -- and after
# rewriting, only what travels in the bundle has a relative link. So a sidebar entry
# with nothing but absolute links leads somewhere this copy does not go, and is
# dropped: a Redis for Kubernetes copy stops offering Redis Software and Redis Cloud.
SIDEBAR_OPEN = re.compile(r'<nav\b[^>]*\bid=["\']sidebar["\'][^>]*>', re.IGNORECASE)
LIST_ITEM_OPEN = re.compile(r'<li\b[^>]*>', re.IGNORECASE)
LIST_TAG = re.compile(r'</?(?P<tag>ul|ol|li)\b[^>]*>', re.IGNORECASE)
ANY_HREF = re.compile(r'href\s*=\s*["\'](?P<url>[^"\']*)["\']', re.IGNORECASE)
NOT_A_LOCAL_FILE = ("http://", "https://", "#", "mailto:", "javascript:", "data:")

# Sits directly below the header, so it is the first thing on the page rather than
# something the sticky header scrolls over. Styled inline: the situation it exists to
# explain is one where the stylesheet may be missing.
OFFLINE_NOTICE = """
<div role="note" style="display:flex;gap:12px;align-items:flex-start;margin:0;
padding:16px 20px;background:#FFF4CC;border-bottom:2px solid #E8B931;color:#163341;
font:15px/1.55 system-ui,-apple-system,'Segoe UI',sans-serif">
<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#B26B00"
stroke-width="2" stroke-linecap="round" style="flex:0 0 20px;margin-top:1px"
aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v5"/><path d="M12 16h.01"/></svg>
<span>You are viewing an <strong>offline copy</strong> of the Redis documentation. Some
page features are unavailable. To view the latest version of this page, or to use
interactive features, visit the
<a href="{url}" style="color:#163341;font-weight:600;text-decoration:underline">live page</a>.</span>
</div>
"""


def load_manifest(path):
    with open(path, encoding="utf-8") as f:
        manifest = json.load(f)
    ids = [d["id"] for d in manifest["docsets"]]
    duplicates = {i for i in ids if ids.count(i) > 1}
    if duplicates:
        raise ValueError(f"duplicate docset ids in {path}: {sorted(duplicates)}")
    return manifest


def find_docset(manifest, docset_id):
    for docset in manifest["docsets"]:
        if docset["id"] == docset_id:
            return docset
    known = ", ".join(d["id"] for d in manifest["docsets"])
    raise SystemExit(f"unknown docset '{docset_id}'. Known docsets: {known}")


def archived_versions(source, docset):
    """Archived versions of this docset present in the build, newest-ish first.

    CI never needs this -- each version is built and packaged by its own matrix
    job -- but a local build renders every version at its versioned path, so one
    build can produce the whole set. Without it, local testing offers versions in
    the picker that 404.
    """
    if "versions" not in docset:
        return []
    base = Path(source) / docset["path"]
    if not base.is_dir():
        return []
    found = [d.name for d in base.iterdir() if d.is_dir() and VERSION_DIR.match(d.name)]
    return sorted(found, key=lambda v: [int(p) for p in v.split(".")], reverse=True)


def resolve_root(source, docset, version):
    """Return the directory in the build output holding this docset+version.

    A versioned matrix build publishes the selected version twice: at its
    versioned path and (because CI rsyncs it over the top) at the unversioned
    one. Prefer the versioned path, but fall back so this also works against a
    build that only kept the unversioned copy.
    """
    base = Path(source) / docset["path"]
    if version != "latest":
        versioned = base / version
        if versioned.is_dir():
            return versioned
    return base


def iter_pages(root, page_file, excludes, skip_version_dirs, out_dir=None):
    """Yield (page path relative to root, path to the page's format file).

    `excludes` are POSIX paths relative to `root`; they and everything beneath
    them are left out. `skip_version_dirs` drops archived-version directories
    directly under `root`, which a local build has but a CI "latest" build does
    not -- both then produce the same bundle.
    """
    root = root.resolve()
    out_dir = out_dir.resolve() if out_dir else None
    excludes = set(excludes or ())
    pages = []

    for dirpath, dirnames, filenames in os.walk(root):
        current = Path(dirpath)
        rel = current.relative_to(root)
        rel_posix = rel.as_posix()

        keep = []
        for name in sorted(dirnames):
            child = current / name
            child_rel = name if rel_posix == "." else f"{rel_posix}/{name}"
            if child_rel in excludes:
                continue
            if skip_version_dirs and rel_posix == "." and VERSION_DIR.match(name):
                continue
            # Writing the bundles inside the build output is convenient locally;
            # don't then package them into themselves.
            if out_dir and child.resolve() == out_dir:
                continue
            keep.append(name)
        dirnames[:] = keep

        if page_file in filenames:
            pages.append((rel_posix, current / page_file))

    # Sorting by relative path is both deterministic and hierarchical, which is
    # the order the single-file Markdown bundle reads in.
    pages.sort(key=lambda page: page[0])
    return pages


def archive_name(rel_posix, page_file, suffix):
    """Path a page takes inside the bundle, relative to the docset directory."""
    if suffix is None:
        return page_file if rel_posix == "." else f"{rel_posix}/{page_file}"
    if rel_posix == ".":
        return f"index{suffix}"
    return f"{rel_posix}{suffix}"


def page_url(url_base, docset, version, rel_posix):
    path = docset["path"]
    if version != "latest":
        path = f"{path}/{version}"
    if rel_posix != ".":
        path = f"{path}/{rel_posix}"
    return f"{url_base.rstrip('/')}/{path}/"


def single_markdown(pages, url_base, docset, version):
    """Concatenate every page into one document, each preceded by its URL."""
    parts = []
    for rel_posix, path in pages:
        url = page_url(url_base, docset, version, rel_posix)
        body = path.read_text(encoding="utf-8").strip()
        parts.append(f"<!-- page: {url} -->\n\n{body}\n")
    return "\n".join(parts).encode("utf-8")


READING_NOTES = {
    "html": """Open index.html in a browser. Styling, fonts, images, and the links
between these pages all resolve inside this directory, so it reads offline as it
does on the site. Every page carries a notice saying it is a copy, with a link to
the live version.

Links that lead outside this product, and anything interactive, point at redis.io
and need a connection.""",

    "md": """Links and images are absolute redis.io URLs, exactly as the site
publishes them: cross-references stay valid, and images load when you are online.""",

    "md-single": """Every page follows a comment giving its URL on the site. Links
and images are absolute redis.io URLs, exactly as the site publishes them.""",

    "json": """One document per page: title, description, table of contents, code
examples, and body. Links inside the body are absolute redis.io URLs.""",
}


def readme(docset, version, fmt, url_base, page_count):
    fmt_spec = f"{fmt['label']} -- {fmt['summary']}"
    root_url = page_url(url_base, docset, version, ".")
    return f"""# {docset['title']} documentation ({version})

Format: {fmt_spec}
Pages: {page_count}
Published at: {root_url}

Downloaded from {url_base.rstrip('/')}/downloads/

{READING_NOTES[fmt['id']]}

The documentation source lives at https://github.com/redis/docs.
"""


def end_of_element(html, tag, after_open):
    """Index just past the matching close tag, counting nested tags of the same name.

    Returns `after_open` when there is no close to find -- a void or self-closed
    element -- so the caller drops just the opening tag.
    """
    opener = re.compile(rf"<{tag}\b", re.IGNORECASE)
    closer = re.compile(rf"</{tag}\s*>", re.IGNORECASE)
    depth = 1
    position = after_open

    while depth:
        next_close = closer.search(html, position)
        if not next_close:
            return after_open
        next_open = opener.search(html, position)
        if next_open and next_open.start() < next_close.start():
            depth += 1
            position = next_open.end()
        else:
            depth -= 1
            position = next_close.end()

    return position


def strip_offline_hidden(html):
    """Drop the elements the templates marked as unusable from a copy on disk."""
    while True:
        match = OFFLINE_HIDE.search(html)
        if not match:
            return html
        end = end_of_element(html, match.group("tag"), match.end())
        html = html[:match.start()] + html[end:]


def offline_source(path):
    """A page's HTML with the parts that cannot work offline taken out.

    Used by both passes -- collecting assets and writing pages -- so that neither
    sees markup the other has dropped.
    """
    return strip_offline_hidden(path.read_text(encoding="utf-8", errors="replace"))


def detect_site_prefix(html):
    """The path the site is published under, read off one of its own asset URLs."""
    match = SITE_PREFIX_HINT.search(html)
    return match.group("prefix") if match else ""


def split_url(url):
    """Separate a URL from its query and fragment, both of which survive rewriting."""
    for separator in ("#", "?"):
        if separator in url:
            head, tail = url.split(separator, 1)
            rest, suffix = split_url(head)
            return rest, suffix + separator + tail
    return url, ""


def as_site_path(path, site_dir):
    """Turn a URL's path, relative or not, into a path from the site root."""
    if path.startswith("/"):
        return path
    return "/" + posixpath.normpath(posixpath.join(site_dir, path))


def resolve_in_build(source, prefix, path):
    """Path under the build that a site path points at, or None.

    Page URLs are directories: /operate/rs/ and /operate/rs both mean
    operate/rs/index.html.
    """
    if prefix:
        if path == prefix:
            path = "/"
        elif path.startswith(prefix + "/"):
            path = path[len(prefix):]
        else:
            return None  # not published by this site
    rest = path.lstrip("/")
    if rest == "" or rest.endswith("/"):
        rest += "index.html"
    elif "." not in posixpath.basename(rest):
        rest += "/index.html"
    return rest if (Path(source) / rest).is_file() else None


def collect_offline_assets(source, prefix, root, pages):
    """Files the pages reference that have to travel with them.

    Returns {path inside the product directory: path in the build}. Only what is
    actually referenced is collected, so a bundle carries its own stylesheet, fonts,
    and screenshots and nothing else. Stylesheets are followed too, since they
    reference fonts and images of their own.
    """
    docset_rest = Path(root).resolve().relative_to(Path(source).resolve()).as_posix()
    assets = {}
    queue = []

    def offer(url, site_dir):
        """Record the asset a URL points at, if it is one, and return its path."""
        if NOT_A_PATH.match(url):
            return None
        path, _ = split_url(url)
        rest = resolve_in_build(source, prefix, as_site_path(path, site_dir))
        if rest is None:
            return None
        # Pages are never assets. Not the ones already in the archive, and above all
        # not the ones deliberately left out of it: archived versions of this product
        # and child products offered separately are both still sitting in the build,
        # one link away, and would otherwise be dragged back in as though they were
        # stylesheets. Those links belong on the live site.
        if posixpath.basename(rest) == "index.html":
            return None
        if rest.startswith(docset_rest + "/"):
            bundle_path = rest[len(docset_rest) + 1:]
        else:
            bundle_path = rest
        if bundle_path not in assets:
            assets[bundle_path] = Path(source) / rest
            queue.append(bundle_path)
        return bundle_path

    for rel_posix, path in pages:
        # Relative URLs on a page resolve against where that page sits on the site.
        site_dir = docset_rest if rel_posix == "." else f"{docset_rest}/{rel_posix}"
        for match in HTML_URL.finditer(offline_source(path)):
            offer(match.group("url"), site_dir)

    # Stylesheets reach further: work through whatever they pull in as well.
    while queue:
        bundle_path = queue.pop()
        if not bundle_path.endswith(".css"):
            continue
        css = assets[bundle_path].read_text(encoding="utf-8", errors="replace")
        for match in CSS_ROOT_URL.finditer(css):
            offer(match.group("url"), posixpath.dirname(bundle_path))

    return assets


def offline_url_rewriter(source, prefix, root, page_names, assets, url_base,
                         from_path, site_dir):
    """Rewrite one file's URLs, given where that file sits in the archive and on the site.

    Targets travelling in the archive become paths relative to `from_path`; the rest
    become absolute URLs on the live site, which is the only place they exist. A URL
    that resolves to nothing at all -- /chat, a live-reload script -- is absolutised
    too: it cannot work from disk either way, but at least it works online.

    Relative URLs are resolved against `site_dir`, the file's own directory on the
    site, and then treated exactly like root-relative ones. Leaving them alone would
    break the ones written to climb to the site root, which is further away on the
    site than it is in a bundle rooted at one product.
    """
    docset_rest = Path(root).resolve().relative_to(Path(source).resolve()).as_posix()
    here = posixpath.dirname(from_path)
    live = url_base.rstrip("/") + "/"

    def absolute(path):
        if prefix and path.startswith(prefix):
            path = path[len(prefix):]
        return live + path.lstrip("/")

    def target(path):
        rest = resolve_in_build(source, prefix, path)
        if rest is None:
            return None
        if rest.startswith(docset_rest + "/"):
            inner = rest[len(docset_rest) + 1:]
            if inner in page_names:
                return inner
            return inner if inner in assets else None
        return rest if rest in assets else None

    def rewrite(url):
        if NOT_A_PATH.match(url):
            return url
        written, suffix = split_url(url)
        path = as_site_path(written, site_dir)
        bundle_path = target(path)
        if bundle_path is None:
            return absolute(path) + suffix
        return posixpath.relpath(bundle_path, here or ".") + suffix

    return rewrite


def end_of_list_item(html, after_open, limit):
    """Index just past a list item, honouring HTML's implied end tags.

    The nav templates leave their <li> elements unclosed -- legal, and browsers cope
    -- so looking for `</li>` finds nothing and would take the item to be empty. An
    item runs until its own close tag, the next item at the same level, or the end of
    the list holding it, whichever comes first.
    """
    depth = 0
    for match in LIST_TAG.finditer(html, after_open, limit):
        tag = match.group("tag").lower()
        closing = match.group(0).startswith("</")
        if tag in ("ul", "ol"):
            if not closing:
                depth += 1
            elif depth:
                depth -= 1
            else:
                return match.start()  # the list holding this item ends here
        elif depth == 0:
            return match.end() if closing else match.start()
    return limit


def leads_into_the_bundle(fragment):
    """Whether anything in here links to a file travelling in this bundle."""
    return any(
        not match.group("url").startswith(NOT_A_LOCAL_FILE) and match.group("url")
        for match in ANY_HREF.finditer(fragment)
    )


def inner_list(fragment):
    """Contents of the first <ul> in a fragment, or "" if it has none."""
    opening = re.search(r"<ul\b[^>]*>", fragment, re.IGNORECASE)
    if not opening:
        return ""
    return fragment[opening.end():end_of_element(fragment, "ul", opening.end())]


def flatten_version_level(html, page_name):
    """Lift the archived-version node out of the sidebar, promoting its contents.

    A versioned bundle *is* that version, so a "Redis Software > 8.0 > Clusters" tree
    spends a level restating what the whole download already says. The node is found
    by where it points rather than by its label: it is the one whose link is the
    bundle's own root page.
    """
    opening = SIDEBAR_OPEN.search(html)
    if not opening:
        return html
    sidebar_end = end_of_element(html, "nav", opening.end())
    root_href = posixpath.relpath("index.html", posixpath.dirname(page_name) or ".")

    position = opening.end()
    while True:
        item = LIST_ITEM_OPEN.search(html, position, sidebar_end)
        if not item:
            return html
        item_end = end_of_list_item(html, item.end(), sidebar_end)
        inner = html[item.end():item_end]
        anchor = ANY_HREF.search(inner)
        if anchor and split_url(anchor.group("url"))[0] == root_href:
            return html[:item.start()] + inner_list(inner) + html[item_end:]
        position = item.end()  # not it; look inside it


def prune_sidebar(html):
    """Drop sidebar entries that lead outside the bundle. Call after rewriting URLs.

    Walks the list items left to right, skipping the children of any it removes --
    they go with the parent -- so one pass is enough and the spans never overlap.
    """
    opening = SIDEBAR_OPEN.search(html)
    if not opening:
        return html
    sidebar_end = end_of_element(html, "nav", opening.end())

    spans = []
    position = opening.end()
    while True:
        item = LIST_ITEM_OPEN.search(html, position, sidebar_end)
        if not item:
            break
        item_end = end_of_list_item(html, item.end(), sidebar_end)
        if leads_into_the_bundle(html[item.end():item_end]):
            position = item.end()  # keep it, and look inside it next
        else:
            spans.append((item.start(), item_end))
            position = item_end  # its children go with it

    for start, end in reversed(spans):
        html = html[:start] + html[end:]
    return html


def offline_page(html, rewrite, live_url, page_name, flatten_version):
    """Make one page work from disk, and say plainly that it is a copy."""
    html = HTML_URL.sub(
        lambda m: m.group("lead") + m.group("q") + rewrite(m.group("url")) + m.group("q"),
        html,
    )
    # Both of these read the rewritten links, so they have to come after the rewrite.
    if flatten_version:
        html = flatten_version_level(html, page_name)
    html = prune_sidebar(html)
    notice = OFFLINE_NOTICE.format(url=live_url)

    # Empty the header and put the notice straight after it, where it is the first
    # thing in the content. Above the header it would be the first thing the sticky
    # header scrolls over instead.
    stripped, replaced = HEADER_BLOCK.subn(
        lambda m: m.group("open") + "</header>" + notice, html, count=1
    )
    if replaced:
        return stripped
    return BODY_OPEN.sub(lambda m: m.group(0) + notice, html, count=1)


def add_file(tar, name, data):
    info = tarfile.TarInfo(name)
    info.size = len(data)
    info.mtime = FIXED_MTIME
    info.mode = 0o644
    info.uid = info.gid = 0
    info.uname = info.gname = ""
    tar.addfile(info, io.BytesIO(data))


def add_offline_html(tar, prefix, source, root, pages, docset, version, url_base):
    """Add the pages as a copy that opens from disk, plus the assets they need."""
    page_names = {archive_name(rel, "index.html", None) for rel, _ in pages}
    site_prefix = detect_site_prefix(offline_source(pages[0][1]))
    assets = collect_offline_assets(source, site_prefix, root, pages)

    collision = page_names & set(assets)
    if collision:
        raise SystemExit(
            f"{docset['id']}: page and asset want the same path: {sorted(collision)[:3]}"
        )

    docset_rest = Path(root).resolve().relative_to(Path(source).resolve()).as_posix()

    for rel_posix, path in pages:
        name = archive_name(rel_posix, "index.html", None)
        site_dir = docset_rest if rel_posix == "." else f"{docset_rest}/{rel_posix}"
        rewrite = offline_url_rewriter(
            source, site_prefix, root, page_names, assets, url_base, name, site_dir
        )
        html = offline_page(
            offline_source(path),
            rewrite,
            page_url(url_base, docset, version, rel_posix),
            name,
            flatten_version=(version != "latest"),
        )
        add_file(tar, f"{prefix}/{name}", html.encode("utf-8"))

    for bundle_path, path in sorted(assets.items()):
        if bundle_path.endswith(".css"):
            rewrite = offline_url_rewriter(
                source, site_prefix, root, page_names, assets, url_base, bundle_path,
                posixpath.dirname(bundle_path),
            )
            css = CSS_ROOT_URL.sub(
                lambda m: "url(" + m.group("q") + rewrite(m.group("url")) + m.group("q") + ")",
                path.read_text(encoding="utf-8", errors="replace"),
            )
            add_file(tar, f"{prefix}/{bundle_path}", css.encode("utf-8"))
        else:
            add_file(tar, f"{prefix}/{bundle_path}", path.read_bytes())


def build_bundle(source, out_dir, docset, version, fmt, url_base):
    """Write one bundle. Returns its index entry, or None if it has no pages."""
    spec = FORMATS[fmt["id"]]
    root = resolve_root(source, docset, version)
    if not root.is_dir():
        return None

    pages = iter_pages(
        root,
        spec["file"],
        docset.get("exclude"),
        skip_version_dirs=(version == "latest" and "versions" in docset),
        out_dir=out_dir,
    )
    if not pages:
        return None

    prefix = f"{TAR_ROOT}/{docset['id']}-{version}"
    manifest_entry = {
        "docset": docset["id"],
        "title": docset["title"],
        "version": version,
        "format": fmt["id"],
        "pages": len(pages),
        "published_at": page_url(url_base, docset, version, "."),
    }

    raw = io.BytesIO()
    # filename="" and mtime=0 keep the gzip header free of anything that varies
    # between builds.
    with gzip.GzipFile(filename="", mode="wb", fileobj=raw, mtime=FIXED_MTIME) as gz:
        with tarfile.open(fileobj=gz, mode="w", format=tarfile.PAX_FORMAT) as tar:
            add_file(
                tar,
                f"{prefix}/MANIFEST.json",
                (json.dumps(manifest_entry, indent=2, sort_keys=True) + "\n").encode("utf-8"),
            )
            add_file(
                tar,
                f"{prefix}/README.md",
                readme(docset, version, fmt, url_base, len(pages)).encode("utf-8"),
            )
            if fmt["id"] == "md-single":
                add_file(
                    tar,
                    f"{prefix}/{docset['id']}-{version}.md",
                    single_markdown(pages, url_base, docset, version),
                )
            elif fmt["id"] == "html":
                add_offline_html(tar, prefix, source, root, pages, docset, version, url_base)
            else:
                for rel_posix, path in pages:
                    name = archive_name(rel_posix, spec["file"], spec["suffix"])
                    add_file(tar, f"{prefix}/{name}", path.read_bytes())

    data = raw.getvalue()
    filename = f"{docset['id']}-{version}-{fmt['id']}.tar.gz"
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / filename).write_bytes(data)

    entry = dict(manifest_entry)
    entry["file"] = filename
    entry["bytes"] = len(data)
    entry["sha256"] = hashlib.sha256(data).hexdigest()
    return entry


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("--source", required=True,
                        help="directory holding the finished Hugo build (public/ or output/)")
    parser.add_argument("--out", required=True, help="directory to write bundles into")
    parser.add_argument("--manifest", default=str(DEFAULT_MANIFEST),
                        help=f"products and formats to offer (default: {DEFAULT_MANIFEST})")
    parser.add_argument("--only", action="append", metavar="DOCSET",
                        help="bundle just this docset id; repeatable (default: all of them)")
    parser.add_argument("--version", default="latest",
                        help="version label for the bundles (default: latest)")
    parser.add_argument("--all-versions", action="store_true",
                        help="also package every archived version present in the build. For "
                             "local testing: CI builds each version in its own job, but one "
                             "local build renders them all")
    parser.add_argument("--formats", help="comma-separated format ids (default: all of them)")
    parser.add_argument("--url-base", default=DEFAULT_URL_BASE,
                        help=f"where these pages are published (default: {DEFAULT_URL_BASE})")
    args = parser.parse_args()

    manifest = load_manifest(args.manifest)
    source = Path(args.source)
    out_dir = Path(args.out)

    if not source.is_dir():
        raise SystemExit(f"--source {source} is not a directory; build the site first")

    formats = manifest["formats"]
    if args.formats:
        wanted = [f.strip() for f in args.formats.split(",") if f.strip()]
        by_id = {f["id"]: f for f in formats}
        unknown = [w for w in wanted if w not in by_id]
        if unknown:
            raise SystemExit(f"unknown format(s): {', '.join(unknown)}. "
                             f"Known formats: {', '.join(by_id)}")
        formats = [by_id[w] for w in wanted]

    if args.only:
        docsets = [find_docset(manifest, d) for d in args.only]
    else:
        docsets = manifest["docsets"]

    if args.version != "latest" and len(docsets) != 1:
        raise SystemExit("--version applies to a single product; pass one --only too")
    if args.all_versions and args.version != "latest":
        raise SystemExit("--all-versions already covers every version; drop --version")

    # (docset, version) pairs to package.
    targets = [(docset, args.version) for docset in docsets]
    if args.all_versions:
        for docset in docsets:
            for version in archived_versions(source, docset):
                targets.append((docset, version))

    entries = []
    for docset, version in targets:
        for fmt in formats:
            entry = build_bundle(source, out_dir, docset, version, fmt, args.url_base)
            if entry is None:
                continue
            entries.append(entry)
            print(f"  {entry['file']}  {entry['pages']} pages  {entry['bytes'] / 1e6:.1f} MB")

    if not entries:
        selected = ", ".join(d["id"] for d in docsets)
        raise SystemExit(f"no pages found under {source} for: {selected}")

    # One index per invocation, named after what was built, so the latest build
    # and each versioned matrix build can write into the same bucket directory
    # without overwriting each other.
    scope = "latest" if not args.only else f"{'-'.join(args.only)}-{args.version}"
    if args.all_versions:
        scope += "-all-versions"
    index = out_dir / f"_bundles-{scope}.json"
    index.write_text(json.dumps({"bundles": entries}, indent=2) + "\n", encoding="utf-8")

    total = sum(e["bytes"] for e in entries)
    print(f"Wrote {len(entries)} bundles ({total / 1e6:.1f} MB) to {out_dir} and {index.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())

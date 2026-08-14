#!/usr/bin/env python3
"""
Tests for make_doc_bundles, the packager behind the documentation download widget.

The two things worth pinning down are what lands in a bundle and what must not.
A "latest" bundle is built from a tree that still contains archived-version
directories locally but not in CI, and a parent product's directory physically
contains a child product that the picker offers separately -- if either leaks,
readers get the same pages twice under different versions with no error to show
it happened.

The rest cover the layout inside the archive (readers unpack these by hand) and
byte-for-byte reproducibility, which is what keeps `gsutil rsync -c` from
re-uploading every bundle on every push.
"""

import json
import os
import sys
import tarfile
import tempfile
from pathlib import Path

# Add the build directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from make_doc_bundles import (
    DEFAULT_MANIFEST,
    archived_versions,
    build_bundle,
    load_manifest,
)

MANIFEST = load_manifest(DEFAULT_MANIFEST)
FORMATS = {f["id"]: f for f in MANIFEST["formats"]}
URL_BASE = "https://redis.io/docs/latest/"


def make_pages(site_root, page_paths):
    """Lay out a Hugo build: one directory per page, one file per output format."""
    for rel in page_paths:
        directory = Path(site_root) / rel if rel else Path(site_root)
        directory.mkdir(parents=True, exist_ok=True)
        label = rel or "root"
        (directory / "index.html.md").write_text(f"# {label}\n", encoding="utf-8")
        (directory / "index.html").write_text(f"<h1>{label}</h1>\n", encoding="utf-8")
        (directory / "index.json").write_text(
            json.dumps({"title": label}) + "\n", encoding="utf-8"
        )


def bundle(page_paths, docset, fmt="md", version="latest", out_inside=None):
    """Build one bundle over a throwaway site and return (names, tar, entry).

    `out_inside` writes the bundles to that path under the site root, the way a
    local `make bundles` run does.
    """
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        make_pages(site / docset["path"], page_paths)
        out = site / out_inside if out_inside else Path(tmp) / "bundles"

        entry = build_bundle(site, out, docset, version, FORMATS[fmt], URL_BASE)
        if entry is None:
            return None, None, None

        with tarfile.open(out / entry["file"]) as tar:
            names = sorted(tar.getnames())
            contents = {m.name: tar.extractfile(m).read().decode("utf-8")
                        for m in tar.getmembers()}
        return names, contents, entry


def test_pages_become_flat_markdown_files():
    """Hugo's <page>/index.html.md becomes <page>.md, so the tree is readable."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    names, _, entry = bundle(["", "clusters", "clusters/add-node"], docset)
    assert "redis-docs/rs-latest/index.md" in names, names
    assert "redis-docs/rs-latest/clusters.md" in names, names
    assert "redis-docs/rs-latest/clusters/add-node.md" in names, names
    assert entry["pages"] == 3, entry
    print("✓ pages become flat .md files under one product directory")


def test_html_keeps_the_published_layout():
    """HTML is served from <page>/index.html; keep that so links still resolve."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    names, _, _ = bundle(["", "clusters/add-node"], docset, fmt="html")
    assert "redis-docs/rs-latest/index.html" in names, names
    assert "redis-docs/rs-latest/clusters/add-node/index.html" in names, names
    print("✓ HTML bundles keep the published directory layout")


def test_json_bundles_use_the_json_output():
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    names, contents, _ = bundle(["", "clusters"], docset, fmt="json")
    assert "redis-docs/rs-latest/clusters.json" in names, names
    assert json.loads(contents["redis-docs/rs-latest/clusters.json"])["title"] == "clusters"
    print("✓ JSON bundles carry the per-page JSON output")


def test_archived_versions_are_left_out_of_latest():
    """A local build keeps 7.22/ next to the latest pages; CI's does not."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs",
              "versions": "rs"}
    names, _, entry = bundle(["", "clusters", "7.22", "7.22/clusters", "7.4.6"], docset)
    leaked = [n for n in names if "/7." in n]
    assert not leaked, leaked
    assert entry["pages"] == 2, entry
    print("✓ archived version directories stay out of the latest bundle")


def test_unversioned_product_keeps_numeric_directories():
    """Only versioned products have version directories; don't guess elsewhere."""
    docset = {"id": "commands", "title": "Command reference", "path": "commands"}
    names, _, _ = bundle(["", "7.22"], docset)
    assert "redis-docs/commands-latest/7.22.md" in names, names
    print("✓ numeric directories survive in products that are not versioned")


def test_excluded_child_product_is_left_out():
    """Libraries and tools physically contains RDI, which is offered separately."""
    docset = {"id": "integrations", "title": "Libraries and tools", "path": "integrate",
              "exclude": ["redis-data-integration"]}
    names, _, entry = bundle(
        ["", "jedis", "redis-data-integration", "redis-data-integration/reference"],
        docset,
    )
    leaked = [n for n in names if "redis-data-integration" in n]
    assert not leaked, leaked
    assert entry["pages"] == 2, entry
    print("✓ a child product excluded from its parent does not appear twice")


def test_versioned_bundle_reads_the_versioned_path():
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs",
              "versions": "rs"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        make_pages(site / "operate/rs", ["", "clusters"])
        make_pages(site / "operate/rs/7.22", ["", "clusters", "clusters/add-node"])
        out = Path(tmp) / "bundles"

        entry = build_bundle(site, out, docset, "7.22", FORMATS["md"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            names = sorted(tar.getnames())

    assert entry["file"] == "rs-7.22-md.tar.gz", entry
    assert "redis-docs/rs-7.22/clusters/add-node.md" in names, names
    assert entry["pages"] == 3, entry
    print("✓ a versioned bundle is built from the versioned path")


def test_versioned_bundle_falls_back_to_the_unversioned_path():
    """CI rsyncs the selected version over the top of the product directory, so
    a versioned build may publish it there and nowhere else."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs",
              "versions": "rs"}
    names, _, entry = bundle(["", "clusters"], docset, version="7.22")
    assert entry["file"] == "rs-7.22-md.tar.gz", entry
    assert "redis-docs/rs-7.22/clusters.md" in names, names
    print("✓ a versioned bundle falls back to the unversioned path")


def test_single_file_bundle_concatenates_pages_behind_their_urls():
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    names, contents, _ = bundle(["", "clusters/add-node"], docset, fmt="md-single")
    assert "redis-docs/rs-latest/rs-latest.md" in names, names
    body = contents["redis-docs/rs-latest/rs-latest.md"]
    assert "<!-- page: https://redis.io/docs/latest/operate/rs/ -->" in body, body
    assert "<!-- page: https://redis.io/docs/latest/operate/rs/clusters/add-node/ -->" in body, body
    assert body.index("# root") < body.index("# clusters/add-node"), body
    print("✓ the single-file bundle concatenates pages in reading order")


def test_every_bundle_carries_a_manifest_and_readme():
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs",
              "versions": "rs"}
    _, contents, _ = bundle(["", "clusters"], docset, version="7.22")
    manifest = json.loads(contents["redis-docs/rs-7.22/MANIFEST.json"])
    assert manifest["version"] == "7.22", manifest
    assert manifest["published_at"] == "https://redis.io/docs/latest/operate/rs/7.22/", manifest
    assert "redis-docs/rs-7.22/README.md" in contents
    print("✓ bundles describe themselves with a MANIFEST.json and a README")


def test_bundles_are_reproducible():
    """No timestamps inside, so an unchanged product produces identical bytes
    and `gsutil rsync -c` skips it."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    digests = set()
    for _ in range(2):
        _, _, entry = bundle(["", "clusters", "clusters/add-node"], docset)
        digests.add(entry["sha256"])
    assert len(digests) == 1, digests
    print("✓ bundles are byte-for-byte reproducible")


def test_product_missing_from_the_build_is_skipped():
    """Versioned matrix builds publish one product; the rest are absent, not empty."""
    docset = {"id": "absent", "title": "Absent", "path": "operate/nope"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        make_pages(site / "operate/rs", [""])
        entry = build_bundle(site, Path(tmp) / "bundles", docset,
                             "latest", FORMATS["md"], URL_BASE)
    assert entry is None, entry
    print("✓ a product missing from the build is skipped, not reported empty")


def test_bundles_are_not_packaged_into_themselves():
    """`make bundles` can write into public/, which is also the source tree."""
    docset = {"id": "site", "title": "Whole site", "path": "."}
    names, _, _ = bundle(["", "clusters"], docset, out_inside="downloads/bundles")
    leaked = [n for n in names if "tar.gz" in n or "downloads/bundles" in n]
    assert not leaked, leaked
    print("✓ the output directory is not packaged into the bundles")


OFFLINE_PAGE = """<!doctype html><html><head>
<link href="/css/site.css" rel="stylesheet">
</head><body>
<header class="sticky top-0 h-[70px]">
<a href="/">home</a><input placeholder="Search"><button>Sign in</button>
</header>
<nav data-offline-hide class="page-tools">
<nav>Edit this page</nav>Ask AI to explain this page
</nav>
<img src="/images/shot.png">
<a href="/operate/rs/clusters/">a page in this bundle</a>
<a href="/develop/clients/">a page in another product</a>
<a href="/chat?q=hello">not a file at all</a>
<a href="https://github.com/redis/docs">external</a>
<a href="#anchor">anchor</a>
</body></html>"""


def offline_bundle(pages):
    """Build an html bundle over a site with real assets, and unpack it."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"

        for rel in pages:
            directory = site / "operate/rs" / rel if rel else site / "operate/rs"
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "index.html").write_text(OFFLINE_PAGE, encoding="utf-8")
        # A page of another product, and the assets the pages ask for.
        (site / "develop/clients").mkdir(parents=True)
        (site / "develop/clients/index.html").write_text("<html></html>", encoding="utf-8")
        (site / "css").mkdir(parents=True)
        (site / "css/site.css").write_text(
            "body{background:url('/images/tile.png')}", encoding="utf-8"
        )
        (site / "images").mkdir(parents=True)
        (site / "images/shot.png").write_bytes(b"png")
        (site / "images/tile.png").write_bytes(b"png")

        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, "latest", FORMATS["html"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            names = sorted(tar.getnames())
            contents = {m.name: tar.extractfile(m).read().decode("utf-8")
                        for m in tar.getmembers() if m.name.endswith((".html", ".css"))}
        return names, contents


def test_offline_html_carries_the_assets_its_pages_ask_for():
    names, _ = offline_bundle(["", "clusters", "clusters/add-node"])
    assert "redis-docs/rs-latest/css/site.css" in names, names
    assert "redis-docs/rs-latest/images/shot.png" in names, names
    # Reached only from inside the stylesheet.
    assert "redis-docs/rs-latest/images/tile.png" in names, names
    print("✓ an offline HTML bundle carries the assets its pages reference")


def test_offline_html_rewrites_urls_for_the_page_depth():
    """Everything is published from the site root, which is the filesystem root
    when a page is opened with file://."""
    _, contents = offline_bundle(["", "clusters/add-node"])
    root = contents["redis-docs/rs-latest/index.html"]
    deep = contents["redis-docs/rs-latest/clusters/add-node/index.html"]

    assert 'href="css/site.css"' in root, root
    assert 'href="../../css/site.css"' in deep, deep
    assert 'src="../../images/shot.png"' in deep, deep
    # A stylesheet's own references are relative to the stylesheet.
    assert "url('../images/tile.png')" in contents["redis-docs/rs-latest/css/site.css"]
    print("✓ URLs are rewritten to the depth of the page holding them")


def test_offline_html_repoints_relative_urls_written_for_the_site():
    """Pages that hand-write ../../../../ to climb to the site root are correct on the
    site and wrong in a bundle rooted at one product, which is shallower. Resolving
    them against the page's own place on the site catches that; leaving them alone
    ships a dead image."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        page = site / "operate/rs/security/access-control/create-db-roles"
        page.mkdir(parents=True)
        # From operate/rs/security/access-control/create-db-roles/, five levels up is
        # the site root -- as the author intended.
        (page / "index.html").write_text(
            '<html><body><img src="../../../../../images/shot.png">'
            '<img src="../../../../../images/missing.png"></body></html>',
            encoding="utf-8",
        )
        (site / "images").mkdir(parents=True)
        (site / "images/shot.png").write_bytes(b"png")

        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, "latest", FORMATS["html"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            names = sorted(tar.getnames())
            body = tar.extractfile(
                "redis-docs/rs-latest/security/access-control/create-db-roles/index.html"
            ).read().decode()

    # Three levels up is the bundle root, not five.
    assert 'src="../../../images/shot.png"' in body, body
    assert "redis-docs/rs-latest/images/shot.png" in names, names
    # One that resolves to nothing still goes to the live site rather than dangling.
    assert 'src="https://redis.io/docs/latest/images/missing.png"' in body, body
    print("✓ relative URLs written for the site are repointed at the bundle")


def test_offline_html_keeps_links_it_cannot_satisfy_on_the_live_site():
    _, contents = offline_bundle(["", "clusters", "clusters/add-node"])
    deep = contents["redis-docs/rs-latest/clusters/add-node/index.html"]

    # In the bundle: relative to this page, which sits one level below it.
    assert 'href="../index.html"' in deep, deep
    # Another product, and a URL that is not a file: absolute, so they work online.
    assert 'href="https://redis.io/docs/latest/develop/clients/"' in deep, deep
    assert 'href="https://redis.io/docs/latest/chat?q=hello"' in deep, deep
    # Untouched.
    assert 'href="https://github.com/redis/docs"' in deep, deep
    assert 'href="#anchor"' in deep, deep
    print("✓ links that cannot be satisfied offline point at the live site")


def test_offline_html_says_it_is_a_copy():
    _, contents = offline_bundle(["", "clusters/add-node"])
    deep = contents["redis-docs/rs-latest/clusters/add-node/index.html"]

    assert "You are viewing an" in deep and "offline copy" in deep, deep
    assert 'href="https://redis.io/docs/latest/operate/rs/clusters/add-node/"' in deep, deep
    # Directly below the header, so the sticky header does not scroll over it, and
    # ahead of the content.
    assert "</header>" in deep and deep.index("</header>") < deep.index("offline copy"), deep
    assert deep.index("offline copy") < deep.index("a page in this bundle"), deep
    # Styled inline, for the case this notice exists to explain.
    assert "border-bottom:2px solid" in deep, deep
    print("✓ every offline page carries a notice below the header")


def test_offline_html_empties_the_site_header():
    """Search, product menus, and sign-in all need the live site."""
    _, contents = offline_bundle(["", "clusters/add-node"])
    deep = contents["redis-docs/rs-latest/clusters/add-node/index.html"]

    assert "Sign in" not in deep, deep
    assert "Search" not in deep, deep
    # The bar itself stays, so the page keeps its proportions.
    assert '<header class="sticky top-0 h-[70px]"></header>' in deep, deep
    print("✓ the site header is emptied but the bar is kept")


def test_offline_html_drops_what_the_templates_marked():
    """"Edit this page", "Ask AI", and the like need the live site or a repo round
    trip, so a copy on disk would only mislead. Templates mark them with
    data-offline-hide; grep the layouts for it."""
    _, contents = offline_bundle(["", "clusters/add-node"])
    deep = contents["redis-docs/rs-latest/clusters/add-node/index.html"]

    assert "Edit this page" not in deep, deep
    assert "Ask AI to explain this page" not in deep, deep
    assert "page-tools" not in deep, deep
    # A nested element of the same name must not end the removal early.
    assert "<nav" not in deep, deep
    # Content after the marked element survives.
    assert 'src="../../images/shot.png"' in deep, deep
    print("✓ elements marked data-offline-hide are dropped, nesting and all")


SIDEBAR_PAGE = """<!doctype html><html><body>
<nav id="sidebar">
<ul>
<li class="my-2"><a href="/operate/rs/">Redis Software</a>
<li class="my-2"><a href="/operate/kubernetes/">Redis for Kubernetes</a>
  <ul class="child-list">
  <li class="my-2"><a href="/operate/kubernetes/architecture/">Architecture</a>
  <li class="my-2"><a href="/operate/kubernetes/gone/">Not in the bundle</a>
  </ul>
<li class="my-2"><a href="/operate/rc/">Redis Cloud</a>
</ul>
</nav>
<p>content</p></body></html>"""


def sidebar_bundle():
    """An html bundle for one product, over a site holding several."""
    docset = {"id": "k8s", "title": "Redis for Kubernetes", "path": "operate/kubernetes"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        for rel in ("", "architecture"):
            directory = site / "operate/kubernetes" / rel if rel else site / "operate/kubernetes"
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "index.html").write_text(SIDEBAR_PAGE, encoding="utf-8")
        # Neighbours of the bundled product, and a page of it left out of the bundle.
        for other in ("operate/rs", "operate/rc"):
            (site / other).mkdir(parents=True)
            (site / other / "index.html").write_text("<html></html>", encoding="utf-8")

        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, "latest", FORMATS["html"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            return tar.extractfile("redis-docs/k8s-latest/index.html").read().decode()


def test_offline_html_leaves_out_pages_the_bundle_excludes():
    """Archived versions and child products are one link away in the build -- the
    version selector and the nav point straight at them. Collecting assets must not
    drag them back in as though they were stylesheets: the md and json formats copy
    a page list, but html follows references."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs",
              "versions": "rs", "exclude": ["child"]}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        page = site / "operate/rs"
        page.mkdir(parents=True)
        (page / "index.html").write_text(
            '<html><body><a href="/operate/rs/7.22/">7.22</a>'
            '<a href="/operate/rs/7.22/deep/">deep</a>'
            '<a href="/operate/rs/child/">child product</a>'
            '<img src="/images/x.png"></body></html>',
            encoding="utf-8",
        )
        for excluded in ("7.22", "7.22/deep", "child"):
            (page / excluded).mkdir(parents=True, exist_ok=True)
            (page / excluded / "index.html").write_text("<html></html>", encoding="utf-8")
        (site / "images").mkdir(parents=True)
        (site / "images/x.png").write_bytes(b"png")

        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, "latest", FORMATS["html"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            names = sorted(tar.getnames())
            body = tar.extractfile("redis-docs/rs-latest/index.html").read().decode()

    leaked = [n for n in names if "7.22" in n or "child" in n]
    assert not leaked, leaked
    # The asset it does need still arrives.
    assert "redis-docs/rs-latest/images/x.png" in names, names
    # And those links point at the live site instead.
    assert 'href="https://redis.io/docs/latest/operate/rs/7.22/"' in body, body
    print("✓ excluded versions and child products are not pulled in as assets")


def test_offline_sidebar_keeps_only_the_product_in_the_bundle():
    """Opening one product's copy should not show a menu of the others: their links
    all lead back to the live site."""
    page = sidebar_bundle()

    assert "Redis for Kubernetes" in page, page
    assert "Architecture" in page, page
    assert "Redis Software" not in page, page
    assert "Redis Cloud" not in page, page
    # A page of this product that the bundle does not carry goes too.
    assert "Not in the bundle" not in page, page
    print("✓ the offline sidebar keeps only the product the bundle holds")


def versioned_sidebar_page(version):
    """The nav a real page carries: a versioned page sits one level deeper, under a
    node for the version itself."""
    if version == "latest":
        branch = """  <li class="my-2"><a href="/operate/rs/clusters/">Clusters</a>
  <li class="my-2"><a href="/operate/rs/databases/">Databases</a>"""
    else:
        branch = f"""  <li class="my-2"><a href="/operate/rs/{version}/">{version}</a>
    <ul class="child-list">
    <li class="my-2"><a href="/operate/rs/{version}/clusters/">Clusters</a>
    <li class="my-2"><a href="/operate/rs/{version}/databases/">Databases</a>
    </ul>"""

    return f"""<!doctype html><html><body>
<nav id="sidebar">
<ul>
<li class="my-2"><a href="/operate/rs/">Redis Software</a>
  <ul class="child-list">
{branch}
  </ul>
</ul>
</nav></body></html>"""


def versioned_bundle(version):
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs", "versions": "rs"}
    page = versioned_sidebar_page(version)
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        base = site / "operate/rs" / version if version != "latest" else site / "operate/rs"
        for rel in ("", "clusters", "databases"):
            directory = base / rel if rel else base
            directory.mkdir(parents=True, exist_ok=True)
            (directory / "index.html").write_text(page, encoding="utf-8")
        if version != "latest":
            (site / "operate/rs").mkdir(parents=True, exist_ok=True)
            (site / "operate/rs/index.html").write_text("<html></html>", encoding="utf-8")

        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, version, FORMATS["html"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            prefix = f"redis-docs/rs-{version}"
            return {
                "root": tar.extractfile(f"{prefix}/index.html").read().decode(),
                "deep": tar.extractfile(f"{prefix}/clusters/index.html").read().decode(),
            }


def test_versioned_bundle_drops_the_version_level_from_the_sidebar():
    """The whole download is 8.0, so a "Redis Software > 8.0 > Clusters" tree spends a
    level restating that. Its children are promoted instead."""
    pages = versioned_bundle("8.0")

    for where, page in pages.items():
        sidebar = page[page.index('<nav id="sidebar"'):page.index("</nav>")]
        assert ">8.0</a>" not in sidebar, (where, sidebar)
        assert "Redis Software" in sidebar, (where, sidebar)
        assert "Clusters" in sidebar and "Databases" in sidebar, (where, sidebar)
    print("✓ a versioned bundle drops the version level, keeping its children")


def test_latest_bundle_keeps_the_product_level():
    """The same node in a latest bundle is the product itself; leave it be."""
    pages = versioned_bundle("latest")
    sidebar = pages["deep"][pages["deep"].index('<nav id="sidebar"'):]

    assert "Redis Software" in sidebar, sidebar
    assert "Clusters" in sidebar, sidebar
    print("✓ a latest bundle keeps its product level")


def test_offline_sidebar_survives_unclosed_list_items():
    """The nav templates never close their <li> elements. Treating an item as ending
    at `</li>` finds nothing, and would strip the opening tags instead of the items."""
    page = sidebar_bundle()
    sidebar = page[page.index('<nav id="sidebar"'):page.index("</nav>")]

    assert sidebar.count("<li") == 2, sidebar
    assert "<ul" in sidebar and "</ul>" in sidebar, sidebar
    assert "<p>content</p>" in page, page
    print("✓ pruning copes with list items that are never closed")


def test_offline_notice_falls_back_when_there_is_no_header():
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        page = site / "operate/rs"
        page.mkdir(parents=True)
        (page / "index.html").write_text("<html><body><h1>x</h1></body></html>", encoding="utf-8")
        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, "latest", FORMATS["html"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            body = tar.extractfile("redis-docs/rs-latest/index.html").read().decode()

    assert "You are viewing an" in body and "offline copy" in body, body
    assert body.index("offline copy") < body.index("<h1>"), body
    print("✓ with no header, the notice goes to the top of the body")


def test_other_formats_are_not_rewritten():
    """Only HTML needs this; Markdown and JSON keep the absolute URLs the site
    publishes, which stay valid."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        page = site / "operate/rs/clusters"
        page.mkdir(parents=True)
        (page / "index.html.md").write_text(
            "[x](https://redis.io/docs/latest/develop/)\n", encoding="utf-8"
        )
        out = Path(tmp) / "bundles"
        entry = build_bundle(site, out, docset, "latest", FORMATS["md"], URL_BASE)
        with tarfile.open(out / entry["file"]) as tar:
            body = tar.extractfile("redis-docs/rs-latest/clusters.md").read().decode()

    assert body == "[x](https://redis.io/docs/latest/develop/)\n", body
    print("✓ Markdown bundles are passed through untouched")


def test_archived_versions_are_discovered_newest_first():
    """`make serve_downloads` packages these from one local build, so that the
    version dropdowns are not offering archives that 404."""
    docset = {"id": "rs", "title": "Redis Software", "path": "operate/rs",
              "versions": "rs"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        make_pages(site / "operate/rs", ["", "7.4", "7.8", "7.22", "8.0", "clusters"])
        found = archived_versions(site, docset)

    # Numeric, not lexical: 7.22 is newer than 7.8.
    assert found == ["8.0", "7.22", "7.8", "7.4"], found
    print("✓ archived versions are discovered, ordered numerically")


def test_unversioned_product_reports_no_archived_versions():
    docset = {"id": "commands", "title": "Command reference", "path": "commands"}
    with tempfile.TemporaryDirectory() as tmp:
        site = Path(tmp) / "public"
        make_pages(site / "commands", ["", "7.4"])
        assert archived_versions(site, docset) == []
    print("✓ a product that is not versioned reports no archived versions")


def test_shipped_manifest_is_usable():
    """The real data/doc_bundles.json is what CI and the picker both read."""
    ids = [d["id"] for d in MANIFEST["docsets"]]
    assert "redis-software" in ids, ids
    assert set(FORMATS) == {"md", "md-single", "html", "json"}, sorted(FORMATS)
    for docset in MANIFEST["docsets"]:
        assert not docset["path"].startswith("/"), docset
        for excluded in docset.get("exclude", []):
            assert not excluded.startswith("/"), docset
    print("✓ the shipped manifest names the products the pipeline expects")


def main():
    tests = [
        test_pages_become_flat_markdown_files,
        test_html_keeps_the_published_layout,
        test_json_bundles_use_the_json_output,
        test_archived_versions_are_left_out_of_latest,
        test_unversioned_product_keeps_numeric_directories,
        test_excluded_child_product_is_left_out,
        test_versioned_bundle_reads_the_versioned_path,
        test_versioned_bundle_falls_back_to_the_unversioned_path,
        test_single_file_bundle_concatenates_pages_behind_their_urls,
        test_every_bundle_carries_a_manifest_and_readme,
        test_bundles_are_reproducible,
        test_product_missing_from_the_build_is_skipped,
        test_bundles_are_not_packaged_into_themselves,
        test_offline_html_carries_the_assets_its_pages_ask_for,
        test_offline_html_rewrites_urls_for_the_page_depth,
        test_offline_html_repoints_relative_urls_written_for_the_site,
        test_offline_html_keeps_links_it_cannot_satisfy_on_the_live_site,
        test_offline_html_says_it_is_a_copy,
        test_offline_html_empties_the_site_header,
        test_offline_html_drops_what_the_templates_marked,
        test_offline_html_leaves_out_pages_the_bundle_excludes,
        test_offline_sidebar_keeps_only_the_product_in_the_bundle,
        test_versioned_bundle_drops_the_version_level_from_the_sidebar,
        test_latest_bundle_keeps_the_product_level,
        test_offline_sidebar_survives_unclosed_list_items,
        test_offline_notice_falls_back_when_there_is_no_header,
        test_other_formats_are_not_rewritten,
        test_archived_versions_are_discovered_newest_first,
        test_unversioned_product_reports_no_archived_versions,
        test_shipped_manifest_is_usable,
    ]
    try:
        for t in tests:
            t()
        print("\n✅ All tests passed!")
        return 0
    except AssertionError as e:
        print(f"\n❌ Test failed: {e}")
        return 1
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == '__main__':
    sys.exit(main())

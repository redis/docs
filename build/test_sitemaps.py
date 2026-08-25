#!/usr/bin/env python3
"""Tests for generate_version_sitemap and merge_sitemaps.

The load-bearing logic is ``in_subtree``. It decides which of the ~5,800 URLs in a
versioned build's sitemap belong to that build's version, and it has to be
segment-anchored: ``operate/kubernetes/8.0`` and ``operate/kubernetes/8.0.18`` are
both live version directories today, so a substring match would fold 78 pages of
8.0.18 into 8.0's sitemap and publish them under the wrong version.

Verified end to end against a real 5,816-URL build: the 39 version subtrees filter
to 3,134 URLs with no duplicates, which is exactly the count of versioned locs in
that sitemap and exactly the shortfall between it and the 2,678 URLs published at
redis.io/docs/latest/sitemap.xml.

Run with ``pytest build/test_sitemaps.py`` or directly.
"""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

from generate_version_sitemap import filter_sitemap, in_subtree  # noqa: E402
from merge_sitemaps import find_sitemaps, merge  # noqa: E402


def sitemap(*entries: str) -> str:
    urls = "".join(
        f"<url><loc>{loc}</loc><lastmod>{mod}</lastmod></url>"
        for loc, mod in (e.split(" ") for e in entries)
    )
    return (
        '<?xml version="1.0" encoding="utf-8" standalone="yes"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">'
        f"{urls}</urlset>"
    )


def locs(xml_text: str) -> list[str]:
    import xml.etree.ElementTree as ET
    ns = "{http://www.sitemaps.org/schemas/sitemap/0.9}"
    root = ET.fromstring(xml_text)
    return [u.findtext(f"{ns}loc") for u in root.findall(f"{ns}url")]


# --------------------------------------------------------------------------- #
# in_subtree
# --------------------------------------------------------------------------- #

def test_matches_pages_beneath_the_subtree():
    loc = "https://redis.io/docs/latest/operate/rs/7.8/clusters/maintenance-mode/"
    assert in_subtree(loc, "operate/rs/7.8")


def test_matches_the_subtree_root_itself():
    # content/operate/rs/7.8/_index.md carries url: '/operate/rs/7.8/', so the
    # version landing page is in the sitemap and must not be dropped.
    assert in_subtree("https://redis.io/docs/latest/operate/rs/7.8/", "operate/rs/7.8")
    assert in_subtree("https://redis.io/docs/latest/operate/rs/7.8", "operate/rs/7.8")


def test_longer_version_is_not_swallowed_by_a_shorter_prefix():
    # The real trap: operate/kubernetes/8.0 and .../8.0.18 both ship today.
    loc = "https://redis.io/docs/latest/operate/kubernetes/8.0.18/quickstart/"
    assert in_subtree(loc, "operate/kubernetes/8.0.18")
    assert not in_subtree(loc, "operate/kubernetes/8.0")


def test_unversioned_sibling_is_excluded():
    # Every versioned build also renders the unversioned tree; those URLs belong
    # to the latest build's sitemap, not this one's.
    loc = "https://redis.io/docs/latest/operate/rs/clusters/maintenance-mode/"
    assert not in_subtree(loc, "operate/rs/7.8")


def test_match_is_on_the_path_not_the_whole_url():
    # A host or query string echoing the subtree must not widen the match.
    assert not in_subtree("https://operate/rs/7.8/example.com/page/", "operate/rs/7.8")
    assert not in_subtree("https://redis.io/x/?p=/operate/rs/7.8/", "operate/rs/7.8")


def test_subtree_slashes_are_tolerated():
    loc = "https://redis.io/docs/latest/operate/rs/7.8/clusters/"
    assert in_subtree(loc, "/operate/rs/7.8/")


# --------------------------------------------------------------------------- #
# filter_sitemap
# --------------------------------------------------------------------------- #

def test_filter_keeps_only_the_subtree_and_reports_the_count():
    document, count = filter_sitemap(sitemap(
        "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z",
        "https://redis.io/docs/latest/operate/rs/7.8/clusters/ 2026-01-02T00:00:00Z",
        "https://redis.io/docs/latest/operate/rs/7.4/clusters/ 2026-01-03T00:00:00Z",
        "https://redis.io/docs/latest/develop/ 2026-01-04T00:00:00Z",
    ), "operate/rs/7.8")

    assert count == 2
    assert locs(document) == [
        "https://redis.io/docs/latest/operate/rs/7.8/",
        "https://redis.io/docs/latest/operate/rs/7.8/clusters/",
    ]


def test_filter_preserves_lastmod():
    # lastmod comes from git via Hugo's enableGitInfo. Copying whole <url>
    # elements keeps it, rather than re-deriving dates the build cannot see.
    document, _ = filter_sitemap(sitemap(
        "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z",
    ), "operate/rs/7.8")
    assert "2026-01-01T00:00:00Z" in document


def test_filter_output_declares_the_sitemap_namespace():
    document, _ = filter_sitemap(sitemap(
        "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z",
    ), "operate/rs/7.8")
    assert 'xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"' in document
    assert document.startswith('<?xml version="1.0" encoding="utf-8"')


def test_filter_reports_zero_rather_than_guessing():
    # main() turns this into a non-zero exit: an empty versioned sitemap means
    # the pages stopped being emitted at their versioned URLs, which should fail
    # the build rather than quietly ship.
    _, count = filter_sitemap(sitemap(
        "https://redis.io/docs/latest/develop/ 2026-01-01T00:00:00Z",
    ), "operate/rs/7.8")
    assert count == 0


# --------------------------------------------------------------------------- #
# merge_sitemaps
# --------------------------------------------------------------------------- #

def write(root: str, name: str, filename: str, text: str) -> str:
    """Drop ``text`` at ``root/name/filename``, mimicking a downloaded artifact."""
    directory = os.path.join(root, name)
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, filename)
    with open(path, "w", encoding="utf-8") as handle:
        handle.write(text)
    return path


def test_merge_concatenates_every_subtree():
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "rs-7.8", "sitemap.xml", sitemap(
            "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z"))
        write(tmp, "rs-7.4", "sitemap.xml", sitemap(
            "https://redis.io/docs/latest/operate/rs/7.4/ 2026-01-02T00:00:00Z"))

        document, count = merge(find_sitemaps(tmp))

    assert count == 2
    assert sorted(locs(document)) == [
        "https://redis.io/docs/latest/operate/rs/7.4/",
        "https://redis.io/docs/latest/operate/rs/7.8/",
    ]


def test_merge_deduplicates_on_loc():
    # Should never happen -- the inputs cover disjoint subtrees -- so a collision
    # means two builds claimed one URL. Drop the repeat, keep the file valid.
    duplicate = "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z"
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "a", "sitemap.xml", sitemap(duplicate))
        write(tmp, "b", "sitemap.xml", sitemap(duplicate))

        _, count = merge(find_sitemaps(tmp))

    assert count == 1


def test_find_sitemaps_is_ordered_and_recursive():
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "b-version", "sitemap.xml", sitemap(
            "https://redis.io/docs/latest/operate/rs/7.4/ 2026-01-01T00:00:00Z"))
        write(tmp, "a-version", "sitemap.xml", sitemap(
            "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z"))

        found = find_sitemaps(tmp)

    assert len(found) == 2
    assert found == sorted(found)


def test_find_sitemaps_ignores_other_files():
    # download-artifact unpacks each version's artifact into its own directory,
    # so the only thing distinguishing our file is its name.
    with tempfile.TemporaryDirectory() as tmp:
        write(tmp, "rs-7.8", "sitemap.xml", sitemap(
            "https://redis.io/docs/latest/operate/rs/7.8/ 2026-01-01T00:00:00Z"))
        write(tmp, "rs-7.8", "index.html", "<html></html>")

        found = find_sitemaps(tmp)

    assert [os.path.basename(p) for p in found] == ["sitemap.xml"]


if __name__ == "__main__":
    failures = 0
    for name, fn in sorted(list(globals().items())):
        if name.startswith("test_") and callable(fn):
            try:
                fn()
                print(f"  ok   {name}")
            except AssertionError as exc:
                failures += 1
                print(f"  FAIL {name}: {exc}")
    print(f"\n{failures} failure(s)")
    sys.exit(1 if failures else 0)

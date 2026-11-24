#!/usr/bin/env python3
"""
Test script for version_archiver's link versioning.

When a version is archived, intra-product links must point at the frozen copy,
not at latest. The archiver originally rewrote only `relref`, so a section
migrated to plain Markdown links (DOC-6909) was silently left pointing at
latest -- wrong content in an archived version, with no error or warning.

These tests cover both notations, the guards they share, and the forms that must
NOT be touched.
"""

import os
import sys
import tempfile

# Add the build directory to the path
sys.path.insert(0, os.path.dirname(__file__))

from version_archiver import VersionArchiver


def archive(product, version, page_relpath, content):
    """Run the real version_relrefs() over one page in an isolated tree.

    page_relpath is relative to the versioned directory, so nesting can be
    realistic -- it matters for source-relative links, which resolve against the
    page's own location.
    """
    cwd = os.getcwd()
    with tempfile.TemporaryDirectory() as tmp:
        arch_cwd = tmp
        os.chdir(arch_cwd)
        try:
            archiver = VersionArchiver(product, version)
            page = os.path.join(archiver.new_directory, page_relpath)
            os.makedirs(os.path.dirname(page), exist_ok=True)
            with open(page, "w") as f:
                f.write(content)
            archiver.version_relrefs()
            with open(page) as f:
                return f.read()
        finally:
            os.chdir(cwd)


DEEP = os.path.join("databases", "configure", "page.md")


def test_relref_is_versioned():
    """The original behaviour: an intra-product relref gains the version."""
    out = archive("rs", "9.9", DEEP,
                  '[a]({{< relref "/operate/rs/databases/memory/eviction" >}})')
    assert "/operate/rs/9.9/databases/memory/eviction" in out, out
    print("✓ relref link is versioned")


def test_plain_content_link_is_versioned():
    """DOC-6909's repo-root-relative form must be versioned the same way."""
    out = archive("rs", "9.9", DEEP,
                  '[b](/content/operate/rs/databases/memory/eviction.md)')
    assert "](/content/operate/rs/9.9/databases/memory/eviction.md)" in out, out
    print("✓ plain /content/ link is versioned")


def test_plain_content_link_keeps_anchor():
    """An anchor must survive versioning."""
    out = archive("rs", "9.9", DEEP,
                  '[c](/content/operate/rs/databases/memory/eviction.md#policies)')
    assert "/operate/rs/9.9/databases/memory/eviction.md#policies" in out, out
    print("✓ anchor preserved when versioning a plain link")


def test_source_relative_link_is_left_alone():
    """Source-relative links need no rewriting and must not be touched.

    The whole subtree is copied, so a link between two pages inside it already
    resolves within the versioned directory.
    """
    link = '[d](../memory/eviction.md)'
    out = archive("rs", "9.9", DEEP, link)
    assert out == link, out
    # and confirm the claim: it resolves inside the frozen tree
    page_dir = os.path.join("content", "operate", "rs", "9.9",
                            os.path.dirname(DEEP))
    resolved = os.path.normpath(os.path.join(page_dir, "../memory/eviction.md"))
    assert resolved.startswith(os.path.join("content", "operate", "rs", "9.9")), resolved
    print("✓ source-relative link untouched, and resolves inside the version")


def test_release_notes_are_exempt():
    """Release notes are deliberately not versioned, in either notation."""
    both = ('[e]({{< relref "/operate/rs/release-notes/rs-7-8" >}})\n'
            '[f](/content/operate/rs/release-notes/rs-7-8.md)')
    out = archive("rs", "9.9", DEEP, both)
    assert out == both, out
    print("✓ release-notes links exempt in both notations")


def test_already_versioned_is_idempotent():
    """Re-running must not double-version an already-versioned link."""
    both = ('[g]({{< relref "/operate/rs/9.9/databases/memory/eviction" >}})\n'
            '[h](/content/operate/rs/9.9/databases/memory/eviction.md)')
    out = archive("rs", "9.9", DEEP, both)
    assert out == both, out
    assert "9.9/9.9" not in out, out
    print("✓ already-versioned links are left alone (idempotent)")


def test_other_product_and_external_urls_untouched():
    """Only the product being archived is rewritten, and external URLs are safe.

    The GitHub blob URL is the important one: it contains the substring
    '/content/operate/rs/', so the pattern must anchor on a link destination
    ('](/content/...') rather than matching anywhere in the line.
    """
    content = ('[i](/content/operate/kubernetes/deploy/quickstart.md)\n'
               '[j](https://github.com/redis/docs/blob/main/content/operate/rs/x.md)\n'
               '[k]({{< relref "/develop/data-types/hashes" >}})')
    out = archive("rs", "9.9", DEEP, content)
    assert out == content, out
    print("✓ other products, external URLs and other sections untouched")


def test_other_products_use_their_own_prefix():
    """The pattern is parameterised, so non-'operate' products work too."""
    out = archive("redis-data-integration", "1.20", DEEP,
                  '[l](/content/integrate/redis-data-integration/reference/config.md)')
    assert "/integrate/redis-data-integration/1.20/reference/config.md" in out, out
    print("✓ redis-data-integration (integrate prefix) is versioned")


def test_links_into_older_versions_untouched():
    """A link from latest into an older snapshot must keep pointing there.

    Archiving kubernetes 8.2.0 turned /content/operate/kubernetes/7.22/... into
    /content/operate/kubernetes/8.2.0/7.22/..., which does not exist.
    """
    both = ('[m]({{< relref "/operate/kubernetes/7.22/re-clusters/auto-tiering" >}})\n'
            '[n](/content/operate/kubernetes/7.22/re-clusters/auto-tiering.md)')
    out = archive("kubernetes", "8.2.0", DEEP, both)
    assert out == both, out
    print("✓ links into older version directories are left alone")


def test_agent_and_os_files_not_copied():
    """Agent instruction files, .DS_Store and hidden dirs (.claude/) stay out of a version."""
    cwd = os.getcwd()
    with tempfile.TemporaryDirectory() as tmp:
        os.chdir(tmp)
        try:
            archiver = VersionArchiver("kubernetes", "9.9")
            sub = os.path.join(archiver.latest, "flex")
            os.makedirs(sub)
            for name in ("AGENTS.md", "CLAUDE.md", "CLAUDE.local.md", ".DS_Store", "_index.md"):
                open(os.path.join(archiver.latest, name), "w").close()
            open(os.path.join(sub, "AGENTS.md"), "w").close()
            open(os.path.join(sub, "plan.md"), "w").close()
            hidden = os.path.join(sub, ".claude")
            os.makedirs(hidden)
            open(os.path.join(hidden, "state"), "w").close()
            archiver.archive_version()
            copied = sorted(
                os.path.relpath(os.path.join(r, f), archiver.new_directory)
                for r, _, fs in os.walk(archiver.new_directory) for f in fs
            )
        finally:
            os.chdir(cwd)
    assert copied == ["_index.md", os.path.join("flex", "plan.md")], copied
    print("✓ agent instruction and OS files are not copied into the version")


def main():
    tests = [
        test_relref_is_versioned,
        test_plain_content_link_is_versioned,
        test_plain_content_link_keeps_anchor,
        test_source_relative_link_is_left_alone,
        test_release_notes_are_exempt,
        test_already_versioned_is_idempotent,
        test_other_product_and_external_urls_untouched,
        test_other_products_use_their_own_prefix,
        test_links_into_older_versions_untouched,
        test_agent_and_os_files_not_copied,
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

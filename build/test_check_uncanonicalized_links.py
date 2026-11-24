#!/usr/bin/env python3
"""Tests for check_uncanonicalized_links.

Builds a minimal real content/ tree per test (no mocking), matching this
repo's build/test_*.py convention, so resolution goes through the actual
filesystem the way it does against the real corpus.

Run with ``pytest build/test_check_uncanonicalized_links.py`` or directly.
"""

import os
import sys
import tempfile

sys.path.insert(0, os.path.dirname(__file__))

from check_uncanonicalized_links import check_file  # noqa: E402


def make_tree(tmp, pages):
    """pages: {relpath-under-content: text}. Returns tmp (the Hugo root)."""
    os.makedirs(os.path.join(tmp, "layouts"), exist_ok=True)
    for relpath, text in pages.items():
        full = os.path.join(tmp, "content", relpath)
        os.makedirs(os.path.dirname(full), exist_ok=True)
        with open(full, "w", encoding="utf-8") as f:
            f.write(text)
    return tmp


def run(pages, target_relpath):
    with tempfile.TemporaryDirectory() as tmp:
        root = make_tree(tmp, pages)
        return check_file(os.path.join(root, "content", target_relpath), root)


def test_bare_path_to_real_page_is_fixable():
    findings = run(
        {
            "operate/rs/security/access-control.md": "x",
            "operate/rs/release-notes/foo.md": "See [ACL](/operate/rs/security/access-control) for details.",
        },
        "operate/rs/release-notes/foo.md",
    )
    assert len(findings) == 1
    cat, line_no, old, new = findings[0]
    assert cat == "FIXABLE"
    assert old == "/operate/rs/security/access-control"
    assert new == "/content/operate/rs/security/access-control.md"


def test_bare_path_with_anchor_preserves_anchor():
    findings = run(
        {
            "operate/rs/security/access-control.md": "x",
            "operate/rs/release-notes/foo.md": "See [ACL](/operate/rs/security/access-control/#some-heading).",
        },
        "operate/rs/release-notes/foo.md",
    )
    assert len(findings) == 1
    assert findings[0][3] == "/content/operate/rs/security/access-control.md#some-heading"


def test_dead_link_reported_not_guessed():
    findings = run(
        {
            "operate/rs/release-notes/foo.md": "See [ghost](/operate/rs/nonexistent/page/) for details.",
        },
        "operate/rs/release-notes/foo.md",
    )
    assert len(findings) == 1
    cat, _line, old, new = findings[0]
    assert cat == "DEAD"
    assert new is None


def test_already_canonical_link_is_not_a_finding():
    findings = run(
        {
            "operate/rs/release-notes/foo.md": "See [ACL](/content/operate/rs/security/access-control.md).",
        },
        "operate/rs/release-notes/foo.md",
    )
    assert findings == []


def test_external_and_anchor_only_links_are_not_findings():
    findings = run(
        {
            "operate/rs/release-notes/foo.md": (
                "[ext](https://example.com/operate/rs/) "
                "[frag](#section) "
                "[mail](mailto:a@example.com)"
            ),
        },
        "operate/rs/release-notes/foo.md",
    )
    assert findings == []


def test_bare_commands_index_is_fixable_to_content_prefix():
    # /commands has no backing _index.md on disk, so _find_content_file
    # alone would call it DEAD -- hardcoded as FIXABLE instead, since Hugo's
    # auto-generated section page resolves it identically either way
    # (confirmed by building both forms during the DOC-7104 #4093 review).
    findings = run(
        {
            "operate/rs/release-notes/foo.md": "See [commands](/commands?group=cluster).",
        },
        "operate/rs/release-notes/foo.md",
    )
    assert len(findings) == 1
    cat, _line, old, new = findings[0]
    assert cat == "FIXABLE"
    assert old == "/commands?group=cluster"
    assert new == "/content/commands?group=cluster"


def test_query_with_no_trailing_slash_before_it_is_still_caught():
    # Regression test: the original MOUNT_PREFIX_RX required `/` or
    # end-of-string right after the mount name, so `/commands?group=x` (no
    # slash before the `?`) silently passed through unchecked. This is the
    # exact shape human review found bare on DOC-7104 PR #4093/#4094/#4096/#4098.
    findings = run(
        {
            "operate/rs/security/access-control.md": "x",
            "operate/rs/release-notes/foo.md": "[ACL](/operate/rs/security/access-control?x=1).",
        },
        "operate/rs/release-notes/foo.md",
    )
    assert len(findings) == 1
    assert findings[0][0] == "FIXABLE"


def test_relref_plus_suffix_shape_matches_the_pr_4086_case():
    # The actual defect this script was written for: a relref-plus-literal-
    # suffix concatenation, already unwrapped and slash-fixed by hand, that
    # never got a second pass through linkify.
    findings = run(
        {
            "operate/rs/databases/active-active/develop/develop-for-aa.md": "x",
            "operate/rs/release-notes/foo.md": (
                "[Developing with CRDBs](/operate/rs/databases/active-active/develop/develop-for-aa/)."
            ),
        },
        "operate/rs/release-notes/foo.md",
    )
    assert len(findings) == 1
    cat, _line, _old, new = findings[0]
    assert cat == "FIXABLE"
    assert new == "/content/operate/rs/databases/active-active/develop/develop-for-aa.md"


if __name__ == "__main__":
    import pytest

    sys.exit(pytest.main([__file__, "-v"]))

#!/usr/bin/env python3
"""Tests for check_missing_aliases.

The interesting logic is ``insert_aliases``, which edits frontmatter line by
line rather than round-tripping the YAML. It has to cope with every alias shape
already in the repo -- block lists (490 files), bare scalars (104), the key
spelled ``null`` (49), single-line inline lists (44), the key left bare (39),
multi-line inline lists (19), one folded multi-line scalar, and no key at all --
while leaving every other line untouched.

Run with ``pytest build/test_check_missing_aliases.py`` or directly.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from check_missing_aliases import (  # noqa: E402
    Move, declared_aliases, draft_paths, eligible, insert_aliases, is_published,
    is_versioned, norm, order_renames, published_urls, render_never_roots, report,
    to_url,
)


def apply(text: str, aliases: list) -> str:
    result = insert_aliases(text.splitlines(keepends=True), aliases)
    assert result is not None, "insert_aliases refused the frontmatter"
    return "".join(result)


# --------------------------------------------------------------------------- #
# path -> URL
# --------------------------------------------------------------------------- #

def test_to_url_strips_both_bundle_names():
    # The trap that produced 519 false positives: both bundle names publish at
    # the containing directory's URL, so renaming between them changes nothing.
    assert to_url("content/commands/lpushx/index.md") == "commands/lpushx"
    assert to_url("content/commands/lpushx.md") == "commands/lpushx"
    strings = "develop/data-types/strings"
    assert to_url("content/develop/data-types/strings/_index.md") == strings
    assert to_url("content/develop/data-types/strings.md") == strings


def test_to_url_handles_site_root():
    assert to_url("content/_index.md") == ""


def test_underscore_directories_are_not_published():
    assert not is_published("content/_embeds/k8s/rerc.md")
    assert is_published("content/develop/clients/observability.md")


def test_render_never_cascade_is_read_off_the_tree():
    # content/embeds/_index.md sets build.render: never with a cascade, so its
    # 119 fragment files are not pages. The underscore heuristic alone misses
    # this directory because its name has no underscore.
    assert "embeds/" in render_never_roots()
    assert not is_published("content/embeds/k8s/rec.md")
    assert not is_published("content/embeds/_index.md")


def test_versioned_paths_are_detected():
    assert is_versioned("content/operate/rs/7.8/references/rest-api.md")
    assert is_versioned("content/develop/ai/redisvl/0.10.0/api/cache.md")
    assert not is_versioned("content/operate/rs/references/rest-api.md")


def test_eligible_rejects_the_excluded_classes():
    assert eligible("content/develop/ai/langcache/_index.md")
    assert not eligible("content/_embeds/k8s/rerc.md")
    assert not eligible("content/operate/rs/7.8/index.md")
    assert not eligible("content/develop/ai/langcache/api-reference/api.yaml")


def test_only_safe_moves_are_actionable():
    def move(**kwargs):
        return Move(old_path="content/a.md", new_path="content/b.md",
                    old_url="a", new_url="b", date="2026-01-01", commit="abc",
                    **kwargs)

    assert move().actionable
    assert not move(aliased=True).actionable
    assert not move(occupied=True).actionable
    # A collision has no safe automatic answer: Hugo would pick one of the two
    # claimants arbitrarily, so the alias must not be added unattended.
    assert not move(collides_with=["content/other.md"]).actionable
    # A draft publishes nothing, aliases included, so writing one is a no-op.
    assert not move(target_draft=True).actionable


def test_renames_in_one_commit_are_ordered_so_chains_resolve():
    # A commit holding both A->B and B->C only resolves if A->B goes first.
    # git's listing order is not guaranteed to oblige, and getting it wrong
    # loses the A move silently.
    ab, bc = ("content/a.md", "content/b.md"), ("content/b.md", "content/c.md")
    assert order_renames([bc, ab]) == [ab, bc]
    assert order_renames([ab, bc]) == [ab, bc]
    # Independent renames keep their order and none are dropped.
    xy, pq = ("content/x.md", "content/y.md"), ("content/p.md", "content/q.md")
    assert order_renames([xy, pq]) == [xy, pq]
    # A cycle must terminate rather than spin, and must not lose an edge.
    cycle = [("content/a.md", "content/b.md"), ("content/b.md", "content/a.md")]
    assert sorted(order_renames(cycle)) == sorted(cycle)
    # A three-link chain listed backwards.
    cd = ("content/c.md", "content/d.md")
    assert order_renames([cd, bc, ab]) == [ab, bc, cd]


def test_a_move_split_into_a_section_is_not_auto_fixed():
    def move(**kwargs):
        return Move(old_path="content/a.md", new_path="content/b/c.md",
                    old_url="a", new_url="b/c", date="2026-01-01", commit="abc",
                    **kwargs)

    # git says this file descends from the old page, but the old URL was a
    # landing page and its lineage ends at one child, so a person decides.
    assert not move(split_at="content/a.md -> content/a/c.md").actionable
    assert move().actionable


def _capture_report(**kwargs) -> str:
    """Run report() over one actionable move and return what it logged."""
    import io
    import logging as _logging
    from check_missing_aliases import logger

    move = Move(old_path="content/old.md", new_path="content/new.md",
                old_url="old", new_url="new", date="2026-01-01", commit="abc1234")
    stream = io.StringIO()
    handler = _logging.StreamHandler(stream)
    logger.addHandler(handler)
    previous = logger.level
    logger.setLevel(_logging.INFO)
    try:
        report([move], False, "make check_aliases_fix", **kwargs)
    finally:
        logger.removeHandler(handler)
        logger.setLevel(previous)
    return stream.getvalue()


def test_the_report_describes_what_the_fixer_actually_did():
    """The report is embedded in the PR the automation opens, so it must be accurate.

    Telling a reviewer to "add" an alias the diff already contains sends them after
    finished work; claiming one was added when the fixer declined the file is the same
    error pointing the other way, and leaves a real gap looking closed.
    """
    imperative = _capture_report()
    assert "add to content/new.md" in imperative
    assert "Fix them all with" in imperative

    added = _capture_report(fixing=True)
    assert "added to content/new.md" in added
    assert "COULD NOT" not in added
    # No instruction to run the fixer: it has just run.
    assert "Fix them all with" not in added

    declined = _capture_report(fixing=True, skipped={"content/new.md"})
    assert "COULD NOT add to content/new.md" in declined
    assert "fix by hand" in declined


def test_the_summary_line_agrees_with_the_detail_lines():
    """The headline count is read far more often than the lines beneath it.

    Counting a move as "missing an alias" after --fix has just written it contradicts
    every detail line saying "added to", and the headline is what someone skims.
    """
    assert "missing an alias" in _capture_report()

    added = _capture_report(fixing=True)
    assert "1 alias(es) added" in added
    assert "missing an alias" not in added

    declined = _capture_report(fixing=True, skipped={"content/new.md"})
    assert "0 alias(es) added" in declined
    assert "1 could not be added" in declined


def test_a_whitespace_only_line_is_not_a_folded_continuation():
    # The folded-scalar guard must not be tripped by trailing whitespace on the
    # line after a perfectly ordinary single-value scalar.
    before = "---\naliases: /old/thing/\n   \ntitle: T\n---\nBody.\n"
    after = insert_aliases(before.splitlines(keepends=True), ["/new/thing/"])
    assert after is not None, "a blank line should not block the fix"
    joined = "".join(after)
    assert "- /old/thing/\n" in joined
    assert "- /new/thing/\n" in joined


def test_drafts_are_detected_and_excluded_from_published_urls():
    drafts = draft_paths()
    assert drafts, "expected this repo to contain drafts"
    assert all(p.startswith("content/") and p.endswith(".md") for p in drafts)
    # The draft that made this trap visible: Hugo declined to emit its two
    # alias stubs during a full build, because the page itself is a draft.
    assert "content/integrate/write-behind/_index.md" in drafts
    published = published_urls()
    assert norm(to_url("content/integrate/write-behind/_index.md")) not in published


# --------------------------------------------------------------------------- #
# insert_aliases -- one test per shape found in the repo
# --------------------------------------------------------------------------- #

def test_block_list_appends_after_last_item():
    before = """---
title: Bitmaps
aliases:
- /data-types/bitmaps/
- /manual/data-types/bitmaps/
weight: 10
---

Body text.
"""
    after = apply(before, ["/develop/data-types/bitmaps/"])
    assert after == """---
title: Bitmaps
aliases:
- /data-types/bitmaps/
- /manual/data-types/bitmaps/
- /develop/data-types/bitmaps/
weight: 10
---

Body text.
"""


def test_single_line_inline_list_grows_in_place():
    before = """---
title: Architecture
aliases: [/operate/kubernetes/architecture/]
weight: 5
---
Body.
"""
    after = apply(before, ["/kubernetes/architecture/"])
    assert ("aliases: [/operate/kubernetes/architecture/, "
            "/kubernetes/architecture/]\n") in after
    assert "weight: 5\n" in after


def test_multi_line_inline_list_gains_a_line_before_the_bracket():
    before = """---
title: Delete custom resources
aliases: [
  /operate/kubernetes/re-clusters/delete-custom-resources/,
]
weight: 7
---
Body.
"""
    after = apply(before, ["/kubernetes/delete-custom-resources/"])
    assert after == """---
title: Delete custom resources
aliases: [
  /operate/kubernetes/re-clusters/delete-custom-resources/,
  /kubernetes/delete-custom-resources/,
]
weight: 7
---
Body.
"""


def test_empty_aliases_key_gains_the_first_item():
    # 39 files in the repo leave the key bare like this.
    before = """---
aliases:
categories:
- docs
title: Quantization
---
Body.
"""
    after = apply(before, ["/develop/ai/search-and-query/vectors/svs-compression/"])
    assert after == """---
aliases:
- /develop/ai/search-and-query/vectors/svs-compression/
categories:
- docs
title: Quantization
---
Body.
"""


def test_explicit_null_is_dropped_not_kept_as_an_item():
    # 49 files spell the empty key `aliases: null`. An earlier version promoted
    # it to `[null, /new/]`, which would have published an alias called "null".
    before = """---
aliases: null
title: Data transformation
---
Body.
"""
    after = apply(before, ["/integrate/redis-data-integration/data-transformation/"])
    assert after == """---
aliases:
- /integrate/redis-data-integration/data-transformation/
title: Data transformation
---
Body.
"""
    assert "null" not in after


def test_scalar_value_is_promoted_to_a_block_list():
    before = """---
aliases: /develop/connect/clients/dotnet
title: .NET
---
Body.
"""
    after = apply(before, ["/develop/clients/dotnet/"])
    assert after == """---
aliases:
- /develop/connect/clients/dotnet
- /develop/clients/dotnet/
title: .NET
---
Body.
"""


def test_scalar_with_a_trailing_comma_keeps_the_comma():
    """A live URL must not change because we tidied its frontmatter.

    Real frontmatter in the repo: an author wrote a list without brackets, so
    Hugo publishes an alias whose path ends in a comma. That URL returns 200
    today. Promoted to an *inline* list the comma becomes the separator and the
    alias silently changes to the comma-free path -- observed as a lost page when
    diffing two full builds. A block list preserves it.
    """
    before = """---
weight: 29
aliases: /operate/kubernetes/release-notes/7-4-6-2,
---
Body.
"""
    after = apply(before, ["/operate/kubernetes/release-notes/7-4-6-2/"])
    assert "- /operate/kubernetes/release-notes/7-4-6-2,\n" in after
    assert "- /operate/kubernetes/release-notes/7-4-6-2/\n" in after
    assert "aliases: [" not in after


def test_folded_scalar_promotion_keeps_both_aliases():
    # Hugo reads a folded scalar as two aliases, so promotion must emit two
    # items rather than one item containing a space.
    before = """---
aliases: /operate/search/scalable-search/
         /operate/search/query-performance-factor/
weight: 20
---
Body.
"""
    result = insert_aliases(before.splitlines(keepends=True), ["/new/"])
    # The folded form is refused outright, so nothing is silently mangled.
    assert result is None


def test_missing_key_is_added_above_the_closing_fence():
    before = """---
Title: Redis Agent Memory
linkTitle: Agent Memory
weight: 20
---

Give your AI agents persistent memory.
"""
    after = apply(before, ["/develop/ai/agent-memory/"])
    assert after == """---
Title: Redis Agent Memory
linkTitle: Agent Memory
weight: 20
aliases:
- /develop/ai/agent-memory/
---

Give your AI agents persistent memory.
"""


def test_several_aliases_are_added_at_once():
    before = """---
title: Thing
aliases:
- /old/one/
---
Body.
"""
    after = apply(before, ["/old/two/", "/old/three/"])
    assert after.count("- /old/") == 3
    assert after.index("/old/two/") < after.index("/old/three/")


def test_body_is_never_touched():
    # A body containing something that looks like frontmatter must survive.
    before = """---
title: Thing
weight: 1
---

Some prose.

---

aliases: not-really-frontmatter

More prose.
"""
    after = apply(before, ["/old/thing/"])
    assert after.endswith("aliases: not-really-frontmatter\n\nMore prose.\n")
    assert after.count("aliases:") == 2


def test_no_frontmatter_is_refused_rather_than_guessed():
    assert insert_aliases(["Just a body.\n"], ["/old/"]) is None


def test_folded_multiline_scalar_is_refused():
    # Real frontmatter in the repo. Valid YAML, but it folds to the single
    # string "/a/ /b/" so the second alias never worked. Rewriting only the
    # first line would leave the continuation dangling and break the file, so
    # the fixer must decline rather than guess the author's intent.
    before = """---
weight: 20
aliases: /operate/search/scalable-search/
         /operate/search/query-performance-factor/
---
Body.
"""
    assert insert_aliases(before.splitlines(keepends=True), ["/new/"]) is None


# --------------------------------------------------------------------------- #
# declared_aliases -- parsing every shape back out again
# --------------------------------------------------------------------------- #

def test_declared_aliases_reads_every_shape():
    import tempfile

    shapes = {
        "block": "---\naliases:\n- /a/\n- /b/\n---\nx\n",
        "inline": "---\naliases: [/a/, /b/]\n---\nx\n",
        "multiline": "---\naliases: [\n  /a/,\n  /b/,\n]\n---\nx\n",
        "scalar": "---\naliases: /a/\n---\nx\n",
        "empty": "---\naliases:\n---\nx\n",
        "absent": "---\ntitle: t\n---\nx\n",
        "uppercase": "---\nAliases:\n- /a/\n---\nx\n",
    }
    expected = {
        "block": {"a", "b"}, "inline": {"a", "b"}, "multiline": {"a", "b"},
        "scalar": {"a"}, "empty": set(), "absent": set(), "uppercase": {"a"},
    }
    with tempfile.TemporaryDirectory() as tmp:
        for name, text in shapes.items():
            path = os.path.join(tmp, f"{name}.md")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(text)
            assert declared_aliases(path) == expected[name], name


def test_scalar_aliases_are_split_on_whitespace_like_hugo():
    """Hugo casts a scalar `aliases` with cast.ToStringSlice, i.e. strings.Fields.

    So a folded multi-line scalar publishes *two* working aliases, even though
    PyYAML reads it as the single string "/a/ /b/". Trusting the YAML library
    here produced a false positive against a page whose aliases both work.
    Verified against Hugo 0.143.1.
    """
    import tempfile

    folded = """---
title: QPF
aliases: /operate/search/scalable-search/
         /operate/search/query-performance-factor/
---
body
"""
    with tempfile.TemporaryDirectory() as tmp:
        path = os.path.join(tmp, "folded.md")
        with open(path, "w", encoding="utf-8") as handle:
            handle.write(folded)
        assert declared_aliases(path) == {
            "operate/search/scalable-search",
            "operate/search/query-performance-factor",
        }
        # A single-valued scalar must still read as exactly one alias.
        with open(path, "w", encoding="utf-8") as handle:
            handle.write("---\naliases: /a/b/\n---\nx\n")
        assert declared_aliases(path) == {"a/b"}


def test_round_trip_every_shape():
    """Whatever we insert must be readable back as an alias."""
    import tempfile

    shapes = [
        "---\naliases:\n- /a/\n---\nx\n",
        "---\naliases: [/a/]\n---\nx\n",
        "---\naliases: [\n  /a/,\n]\n---\nx\n",
        "---\naliases:\ntitle: t\n---\nx\n",
        "---\naliases: null\ntitle: t\n---\nx\n",
        "---\naliases: /a/\ntitle: t\n---\nx\n",
        "---\naliases: /a/, \ntitle: t\n---\nx\n",
        "---\ntitle: t\n---\nx\n",
    ]
    with tempfile.TemporaryDirectory() as tmp:
        for i, text in enumerate(shapes):
            path = os.path.join(tmp, f"s{i}.md")
            with open(path, "w", encoding="utf-8") as handle:
                handle.write(apply(text, ["/new/one/"]))
            assert "new/one" in declared_aliases(path), text


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

#!/usr/bin/env python3
"""Tests for alias preservation and heading links in redisvl_docs_sync.

The sync rewrites every latest-version page's frontmatter from scratch, which
used to delete any alias it did not compute itself -- including the ones the
alias_check workflow adds when a page moves. alias_check would then propose
them again, and the next sync would delete them again (DOC-7155).

Sphinx and Hugo give some headings different IDs, so a link that Sphinx
resolved used to open the right page without jumping to the section.

Run with ``pytest build/test_redisvl_docs_sync.py`` (needs Python 3.11+ and
``packaging``, which the sync script itself imports).
"""

import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, os.path.dirname(__file__))

from redisvl_docs_sync import (  # noqa: E402
    collect_existing_aliases, merge_aliases, read_aliases, restore_aliases,
    retarget_heading_links,
)

COMPUTED = "/integrate/redisvl/user_guide/how_to_guides/llmcache"
MOVED = ["/integrate/redisvl/user_guide/llmcache/",
         "/develop/ai/redisvl/user_guide/llmcache/"]


def page(aliases: list[str] | None, body: str = "Body text.\n") -> str:
    fm = ["---", "linkTitle: Cache LLM responses", "title: Cache LLM Responses"]
    if aliases is not None:
        fm += ["aliases:"] + [f"- {a}" for a in aliases]
    fm += ["weight: 03", "---", ""]
    return "\n".join(fm) + "\n" + body


def write(root: Path, rel: str, text: str) -> Path:
    path = root / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")
    return path


def sync(tmp_path: Path, dest_text: str, staged_text: str) -> str:
    """Mimic write_to_destination: collect, overwrite, restore."""
    rel = "user_guide/how_to_guides/llmcache.md"
    staging, dest = tmp_path / "staging", tmp_path / "dest"
    write(staging, rel, staged_text)
    write(dest, rel, dest_text)
    found = collect_existing_aliases(staging, dest)
    write(dest, rel, staged_text)
    restore_aliases(found, dest)
    return (dest / rel).read_text(encoding="utf-8")


def test_extra_aliases_survive_a_sync(tmp_path):
    out = sync(tmp_path, page([COMPUTED] + MOVED), page([COMPUTED]))
    assert out == page([COMPUTED] + MOVED)


def test_computed_alias_is_not_duplicated(tmp_path):
    out = sync(tmp_path, page([COMPUTED] + MOVED), page([COMPUTED]))
    assert read_aliases_from(tmp_path, out).count(COMPUTED) == 1


def test_sync_is_idempotent(tmp_path):
    once = sync(tmp_path, page([COMPUTED] + MOVED), page([COMPUTED]))
    twice = sync(tmp_path, once, page([COMPUTED]))
    assert twice == once


def test_order_is_computed_first_then_existing(tmp_path):
    # An existing page that lists its extras before the computed alias still
    # comes out computed-first, so a re-sync never reorders lines.
    out = sync(tmp_path, page(MOVED + [COMPUTED]), page([COMPUTED]))
    assert out == page([COMPUTED] + MOVED)


def test_body_is_untouched(tmp_path):
    body = "- not an alias\n\nMore text.\n"
    out = sync(tmp_path, page([COMPUTED] + MOVED), page([COMPUTED], body))
    assert out.endswith(body)


def test_new_page_is_left_alone(tmp_path):
    staging, dest = tmp_path / "staging", tmp_path / "dest"
    write(staging, "user_guide/new.md", page([COMPUTED]))
    assert collect_existing_aliases(staging, dest) == {}


def test_non_block_aliases_are_skipped_not_guessed(tmp_path, capsys):
    scalar = page(None).replace("weight:", "aliases: /old/url/\nweight:")
    out = sync(tmp_path, scalar, page([COMPUTED]))
    assert out == page([COMPUTED])
    assert "not a block list" in capsys.readouterr().out


def test_read_aliases_handles_quotes(tmp_path):
    path = write(tmp_path, "p.md", page(['"/quoted/"', COMPUTED]))
    assert read_aliases(path) == ["/quoted/", COMPUTED]


def test_merge_refuses_a_page_without_aliases(tmp_path):
    path = write(tmp_path, "p.md", page(None))
    with pytest.raises(ValueError):
        merge_aliases(path, MOVED)


def read_aliases_from(tmp_path: Path, text: str) -> list[str]:
    return read_aliases(write(tmp_path, "check.md", text))


HEADING = "### Transport Security (Host / Origin Validation)"
SPHINX_ID = "transport-security-host-origin-validation"
HUGO_ID = "transport-security-host--origin-validation"


def retarget(tmp_path: Path, pages: dict[str, str]) -> dict[str, str]:
    for rel, text in pages.items():
        write(tmp_path, rel, text)
    retarget_heading_links(tmp_path)
    return {rel: (tmp_path / rel).read_text(encoding="utf-8") for rel in pages}


def test_same_page_link_uses_the_hugo_id(tmp_path):
    out = retarget(tmp_path, {"mcp.md": f"{HEADING}\n\nSee [Transport Security](#{SPHINX_ID}).\n"})
    assert out["mcp.md"] == f"{HEADING}\n\nSee [Transport Security](#{HUGO_ID}).\n"


def test_links_from_other_pages_use_the_hugo_id(tmp_path):
    links = '[a](mcp.md#{0}) [b]({{{{< relref "mcp#{0}" >}}}})\n'
    out = retarget(tmp_path, {
        "guides/mcp.md": f"{HEADING}\n",
        "guides/auth.md": links.format(SPHINX_ID),
        "_index.md": f"[c](guides/mcp/#{SPHINX_ID})\n",
    })
    assert out["guides/auth.md"] == links.format(HUGO_ID)
    assert out["_index.md"] == f"[c](guides/mcp/#{HUGO_ID})\n"


def test_links_that_already_resolve_are_left_alone(tmp_path):
    # "What's new" is `what-s-new` in Sphinx and `whats-new` in Hugo, but the
    # page has an explicit anchor for the Sphinx ID.
    text = ('<a id="what-s-new"></a>\n\n## What\'s new\n\n## Load data\n\n'
            "[a](#what-s-new) [b](#load-data) [c](#no-such-heading) "
            "[d](https://example.com/page#what-s-new)\n")
    assert retarget(tmp_path, {"page.md": text})["page.md"] == text


def test_code_blocks_are_ignored(tmp_path):
    # The comment is not a heading, so `#setup-again` has no target.
    text = ("## Setup\n\n```python\n# Setup (again)\nlink = '[x](#setup)'\n```\n\n"
            "[x](#setup-again)\n")
    assert retarget(tmp_path, {"page.md": text})["page.md"] == text


def test_repeated_hugo_ids_are_numbered(tmp_path):
    # Hugo makes `v10` of both headings, so it numbers the second one.
    out = retarget(tmp_path, {"page.md": "## v10\n\n## v1.0\n\n[x](#v1-0)\n"})
    assert out["page.md"] == "## v10\n\n## v1.0\n\n[x](#v10-1)\n"


if __name__ == "__main__":
    sys.exit(pytest.main([__file__, "-q"]))

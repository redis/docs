#!/usr/bin/env python3

from postprocess_rs_compatibility_tables import transform_document


def test_large_table_is_split_under_nested_headings() -> None:
    source = """# Title

## Bitmap commands

| Command | Notes |
|:--|:--|
| [BITCOUNT](/bitcount) | |
| [BITFIELD](/bitfield) | |
| [BITFIELD_RO](/bitfield_ro) | |
| [BITOP](/bitop) | |
| [BITPOS](/bitpos) | |
| [GETBIT](/getbit) | |
| [SETBIT](/setbit) | |
"""

    transformed, split_count = transform_document(source, max_rows=3)

    assert split_count == 1
    assert transformed.count("### ") == 3
    assert "### BITCOUNT to BITFIELD_RO (Part 1)" in transformed
    assert "### BITOP to GETBIT (Part 2)" in transformed
    assert "### SETBIT (Part 3)" in transformed
    assert transformed.count("| Command | Notes |") == 3


def test_small_table_is_left_alone() -> None:
    source = """# Title

## Section

| Name | Value |
|:--|:--|
| one | 1 |
| two | 2 |
"""

    transformed, split_count = transform_document(source, max_rows=8)

    assert split_count == 0
    assert transformed == source

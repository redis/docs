#!/usr/bin/env python3
"""
Split oversized Markdown tables in built Redis Software compatibility docs.

This post-processing step targets built `.html.md` pages under:
  public/operate/rs/**/references/compatibility/commands/*.html.md

It preserves the original H2 sections for human-readable organization, then
adds synthetic subheadings before smaller repeated-header table chunks so the
RAG chunker can split on heading boundaries instead of inside tables.
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from html import unescape
from pathlib import Path
from typing import Iterable


TARGET_GLOBS = (
    "operate/rs/references/compatibility/commands/**/index.html.md",
    "operate/rs/7.4/references/compatibility/commands/**/index.html.md",
    "operate/rs/7.8/references/compatibility/commands/**/index.html.md",
    "operate/rs/7.22/references/compatibility/commands/**/index.html.md",
)

HEADING_RE = re.compile(r"^(#{1,6})\s+(.*)$")
TABLE_SEPARATOR_RE = re.compile(r"^\|(?:\s*:?-{3,}:?\s*\|)+\s*$")
LINK_RE = re.compile(r"\[([^\]]+)\]\([^)]+\)")
TAG_RE = re.compile(r"<[^>]+>")


@dataclass
class TableChunk:
    heading: str
    header: str
    separator: str
    rows: list[str]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Split large tables in built RS compatibility Markdown output."
    )
    parser.add_argument(
        "--public-root",
        default="public",
        help="Path to the built site root containing .html.md files.",
    )
    parser.add_argument(
        "--max-rows",
        type=int,
        default=4,
        help="Maximum number of body rows allowed per table chunk.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Report what would change without writing files.",
    )
    return parser.parse_args()


def find_target_files(public_root: Path) -> list[Path]:
    files: list[Path] = []
    for pattern in TARGET_GLOBS:
        files.extend(public_root.glob(pattern))
    return sorted(set(files))


def extract_command_name(row: str) -> str:
    cells = [cell.strip() for cell in row.strip().strip("|").split("|")]
    if not cells:
        return ""

    first_cell = cells[0]
    first_cell = LINK_RE.sub(r"\1", first_cell)
    first_cell = TAG_RE.sub("", first_cell)
    first_cell = unescape(first_cell)
    first_cell = re.sub(r"`+", "", first_cell)
    first_cell = re.sub(r"\s+", " ", first_cell).strip()
    return first_cell


def make_chunk_heading(rows: list[str], part_number: int, total_parts: int) -> str:
    first_name = extract_command_name(rows[0])
    last_name = extract_command_name(rows[-1])

    if first_name and last_name:
        if first_name == last_name:
            label = first_name
        else:
            label = f"{first_name} to {last_name}"
    else:
        start_row = ((part_number - 1) * len(rows)) + 1
        end_row = start_row + len(rows) - 1
        label = f"Rows {start_row}-{end_row}"

    if total_parts == 1:
        return label
    return f"{label} (Part {part_number})"


def split_table(
    header: str, separator: str, rows: list[str], max_rows: int
) -> list[TableChunk]:
    total_parts = (len(rows) + max_rows - 1) // max_rows
    chunks: list[TableChunk] = []

    for index in range(0, len(rows), max_rows):
        part_rows = rows[index:index + max_rows]
        part_number = (index // max_rows) + 1
        chunks.append(
            TableChunk(
                heading=make_chunk_heading(part_rows, part_number, total_parts),
                header=header,
                separator=separator,
                rows=part_rows,
            )
        )

    return chunks


def transform_document(text: str, max_rows: int) -> tuple[str, int]:
    lines = text.splitlines()
    output: list[str] = []
    i = 0
    current_heading_level = 1
    splits = 0

    while i < len(lines):
        heading_match = HEADING_RE.match(lines[i])
        if heading_match:
            current_heading_level = len(heading_match.group(1))
            output.append(lines[i])
            i += 1
            continue

        is_table = (
            i + 2 < len(lines)
            and lines[i].startswith("|")
            and TABLE_SEPARATOR_RE.match(lines[i + 1]) is not None
        )
        if not is_table:
            output.append(lines[i])
            i += 1
            continue

        header = lines[i]
        separator = lines[i + 1]
        rows: list[str] = []
        j = i + 2
        while j < len(lines) and lines[j].startswith("|"):
            rows.append(lines[j])
            j += 1

        if len(rows) <= max_rows:
            output.extend([header, separator, *rows])
            i = j
            continue

        nested_level = min(current_heading_level + 1, 6)
        prefix = "#" * nested_level
        chunks = split_table(header, separator, rows, max_rows)
        for chunk in chunks:
            output.append(f"{prefix} {chunk.heading}")
            output.append("")
            output.append(chunk.header)
            output.append(chunk.separator)
            output.extend(chunk.rows)
            output.append("")

        # Trim one trailing blank line; the main loop preserves surrounding spacing.
        if output and output[-1] == "":
            output.pop()

        splits += 1
        i = j

    transformed = "\n".join(output)
    if text.endswith("\n"):
        transformed += "\n"
    return transformed, splits


def process_files(files: Iterable[Path], max_rows: int, dry_run: bool) -> tuple[int, int]:
    changed_files = 0
    tables_split = 0

    for path in files:
        original = path.read_text(encoding="utf-8")
        transformed, file_splits = transform_document(original, max_rows)
        if file_splits == 0 or transformed == original:
            continue

        changed_files += 1
        tables_split += file_splits
        if not dry_run:
            path.write_text(transformed, encoding="utf-8")

        print(f"{'Would update' if dry_run else 'Updated'} {path} ({file_splits} table(s) split)")

    return changed_files, tables_split


def main() -> int:
    args = parse_args()
    public_root = Path(args.public_root)
    files = find_target_files(public_root)

    if not files:
        print(f"No target files found under {public_root}")
        return 1

    changed_files, tables_split = process_files(files, args.max_rows, args.dry_run)
    print(
        f"{'Would change' if args.dry_run else 'Changed'} "
        f"{changed_files} file(s); split {tables_split} oversized table(s)."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

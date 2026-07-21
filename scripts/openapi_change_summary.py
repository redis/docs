#!/usr/bin/env python3
"""Describe important changes between two OpenAPI JSON files."""

import argparse
import json
import sys
from pathlib import Path
from typing import Any


HTTP_METHODS = {"delete", "get", "head", "options", "patch", "post", "put", "trace"}


def load_document(path: Path) -> dict[str, Any]:
    """Load an OpenAPI document from a JSON file."""
    with path.open(encoding="utf-8") as source:
        document = json.load(source)
    if not isinstance(document, dict):
        raise ValueError(f"{path} must contain a JSON object")
    return document


def operations(document: dict[str, Any]) -> set[str]:
    """Return the HTTP method and path for each OpenAPI operation."""
    result: set[str] = set()
    paths = document.get("paths", {})
    if not isinstance(paths, dict):
        return result

    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            continue
        for method, operation in path_item.items():
            if method.lower() in HTTP_METHODS and isinstance(operation, dict):
                result.add(f"{method.upper()} {path}")
    return result


def schemas(document: dict[str, Any]) -> set[str]:
    """Return the names of schemas in an OpenAPI document."""
    components = document.get("components", {})
    if not isinstance(components, dict):
        return set()
    schema_values = components.get("schemas", {})
    if not isinstance(schema_values, dict):
        return set()
    return set(schema_values)


def markdown_list(title: str, values: set[str]) -> list[str]:
    """Render a short Markdown section."""
    lines = [f"### {title} ({len(values)})", ""]
    if not values:
        return [*lines, "None."]
    return [*lines, *(f"- `{value}`" for value in sorted(values))]


def metadata_value(value: Any) -> str:
    """Render source metadata on one deterministic line."""
    if value is None:
        return "Not present."
    encoded = json.dumps(value, sort_keys=True, separators=(",", ":"))
    return f"`{encoded.replace('`', '&#96;')}`"


def build_summary(before: dict[str, Any], after: dict[str, Any]) -> str:
    """Build a concise Markdown summary of public API changes."""
    before_operations = operations(before)
    after_operations = operations(after)
    before_schemas = schemas(before)
    after_schemas = schemas(after)
    before_sources = before.get("x-openapi-sources")
    after_sources = after.get("x-openapi-sources")

    sections = [
        "## OpenAPI change summary",
        "",
        *markdown_list("Added operations", after_operations - before_operations),
        "",
        *markdown_list("Removed operations", before_operations - after_operations),
        "",
        *markdown_list("Added schemas", after_schemas - before_schemas),
        "",
        *markdown_list("Removed schemas", before_schemas - after_schemas),
        "",
        "### Source metadata",
        "",
    ]

    if before_sources == after_sources:
        sections.append("No change.")
    else:
        sections.extend(
            [
                f"- Before: {metadata_value(before_sources)}",
                f"- After: {metadata_value(after_sources)}",
            ]
        )
    return "\n".join(sections) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("current_file", type=Path)
    parser.add_argument("new_file", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()

    try:
        summary = build_summary(
            load_document(args.current_file),
            load_document(args.new_file),
        )
        if args.output:
            args.output.write_text(summary, encoding="utf-8")
        else:
            print(summary, end="")
    except (OSError, json.JSONDecodeError, ValueError) as error:
        print(f"Could not compare OpenAPI files: {error}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

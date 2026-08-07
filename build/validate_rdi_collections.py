#!/usr/bin/env python3
"""Validate data/rdi-reference/collections.json against config.json.

Every property path listed in a collection must resolve to a node in the
schema. Use this as a CI check (or run by hand) to catch broken
collections when the schema changes.

Exit code is non-zero if any path is unresolvable, so the script slots
straight into a Makefile target or pre-commit hook.

Usage:
    python3 build/validate_rdi_collections.py
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SCHEMA = REPO_ROOT / "data" / "rdi-reference" / "config.json"
COLLECTIONS = REPO_ROOT / "data" / "rdi-reference" / "collections.json"


def collect_paths(node: dict, path: str = "") -> list[str]:
    """Walk the schema the same way the Hugo render-tree partial does.

    Steps through `oneOf` (first branch), `patternProperties` (single
    wildcard key), and `additionalProperties` (treated as an inline
    wrapper) so the path strings match what the rendered page emits.
    """
    out: list[str] = []
    if not isinstance(node, dict):
        return out

    inner = node
    if "oneOf" in inner:
        inner = inner["oneOf"][0]
    if "patternProperties" in inner:
        inner = next(iter(inner["patternProperties"].values()))
    if (
        "additionalProperties" in inner
        and isinstance(inner["additionalProperties"], dict)
        and "properties" not in inner
        and "patternProperties" not in inner
    ):
        inner = inner["additionalProperties"]
    if "oneOf" in inner:
        inner = inner["oneOf"][0]

    for name, child in (inner.get("properties") or {}).items():
        child_path = f"{path}.{name}" if path else name
        out.append(child_path)
        out.extend(collect_paths(child, child_path))
    return out


def main() -> int:
    with SCHEMA.open() as f:
        schema = json.load(f)
    with COLLECTIONS.open() as f:
        collections = json.load(f)

    valid = set(collect_paths(schema))

    errors: list[str] = []
    for entry in collections:
        cid = entry.get("id", "<missing id>")
        for path in entry.get("properties", []):
            if path not in valid:
                errors.append(f"  [{cid}] unknown path: {path}")

    if errors:
        print("collections.json references paths that do not exist in config.json:")
        print("\n".join(errors))
        print(f"\n{len(errors)} broken path(s) across {len(collections)} collection(s).")
        return 1

    total = sum(len(c.get("properties", [])) for c in collections)
    print(f"OK: {total} paths across {len(collections)} collection(s) all resolve.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

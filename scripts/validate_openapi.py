#!/usr/bin/env python3
"""Check a self-contained OpenAPI file before the docs site uses it."""

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any


HTTP_METHODS = {"delete", "get", "head", "options", "patch", "post", "put", "trace"}
RDI_TAG = "Subscriptions - Pro - Data Integration"
RDI_SECURITY_KEYS = {"x-api-key", "x-api-secret-key"}
RDI_SOURCE_RULES = {
    "rdi-core": {
        "repository": "RedisLabs/redis-data-integration",
        "artifact_kind": "release",
        "version_field": "release_tag",
    },
    "cloud-rdi": {
        "repository": "redislabsdev/cloud-rdi-service",
        "artifact_kind": "actions",
        "version_field": "run_id",
    },
}


def resolve_local_reference(document: dict[str, Any], reference: str) -> bool:
    """Return whether a local JSON reference exists."""
    current: Any = document
    for raw_part in reference[2:].split("/"):
        part = raw_part.replace("~1", "/").replace("~0", "~")
        if not isinstance(current, dict) or part not in current:
            return False
        current = current[part]
    return True


def walk(value: Any, document: dict[str, Any], location: str, errors: list[str]) -> None:
    """Check references and values that must not be published."""
    if isinstance(value, dict):
        for key, child in value.items():
            child_location = f"{location}.{key}"
            if key == "$ref" and isinstance(child, str):
                if not child.startswith("#/"):
                    errors.append(f"{child_location} uses external reference {child!r}.")
                elif not resolve_local_reference(document, child):
                    errors.append(f"{child_location} points to missing reference {child!r}.")
            walk(child, document, child_location, errors)
    elif isinstance(value, list):
        for index, child in enumerate(value):
            walk(child, document, f"{location}[{index}]", errors)
    elif isinstance(value, str) and "file://" in value:
        errors.append(f"{location} contains a local file URL.")


def validate_rdi_sources(document: dict[str, Any], errors: list[str]) -> None:
    """Check the source details for the combined RDI OpenAPI file."""
    sources = document.get("x-openapi-sources")
    if not isinstance(sources, dict):
        errors.append("x-openapi-sources must contain rdi-core and cloud-rdi objects.")
        return

    for source_name, rules in RDI_SOURCE_RULES.items():
        source = sources.get(source_name)
        if not isinstance(source, dict):
            errors.append(f"x-openapi-sources.{source_name} must contain an object.")
            continue

        expected_repository = rules["repository"]
        if source.get("repository") != expected_repository:
            errors.append(
                f"x-openapi-sources.{source_name}.repository must be "
                f"{expected_repository!r}."
            )

        expected_kind = rules["artifact_kind"]
        if source.get("artifact_kind") != expected_kind:
            errors.append(
                f"x-openapi-sources.{source_name}.artifact_kind must be "
                f"{expected_kind!r}."
            )

        artifact_name = source.get("artifact_name")
        if not isinstance(artifact_name, str) or not artifact_name:
            errors.append(
                f"x-openapi-sources.{source_name}.artifact_name must be a non-empty string."
            )

        commit_sha = source.get("commit_sha")
        if not isinstance(commit_sha, str) or not re.fullmatch(r"[0-9a-f]{40}", commit_sha):
            errors.append(
                f"x-openapi-sources.{source_name}.commit_sha must be a lowercase full commit SHA."
            )

        sha256 = source.get("sha256")
        if not isinstance(sha256, str) or not re.fullmatch(r"[0-9a-f]{64}", sha256):
            errors.append(
                f"x-openapi-sources.{source_name}.sha256 must be a lowercase SHA-256 checksum."
            )

        version_field = rules["version_field"]
        version = source.get(version_field)
        if source_name == "cloud-rdi":
            valid_version = (
                isinstance(version, int)
                and not isinstance(version, bool)
                and version > 0
            )
        else:
            valid_version = (
                isinstance(version, str)
                and bool(version)
                and not version.startswith("0.0.")
            )
        if not valid_version:
            errors.append(
                f"x-openapi-sources.{source_name}.{version_field} is missing or invalid."
            )


def validate(document: Any, require_rdi: bool = False) -> list[str]:
    """Return clear validation errors for an OpenAPI document."""
    if not isinstance(document, dict):
        return ["The OpenAPI file must contain a JSON object."]

    errors: list[str] = []
    openapi_version = document.get("openapi")
    if not isinstance(openapi_version, str) or not openapi_version.startswith("3."):
        errors.append("The file must use OpenAPI 3.")

    info = document.get("info")
    if not isinstance(info, dict) or not isinstance(info.get("title"), str):
        errors.append("The API title is missing.")

    paths = document.get("paths")
    if not isinstance(paths, dict) or not paths:
        errors.append("The OpenAPI file must contain at least one path.")
        paths = {}

    operation_ids: dict[str, str] = {}
    rdi_operations = 0
    for path, path_item in paths.items():
        if not isinstance(path_item, dict):
            errors.append(f"Path {path!r} must contain an object.")
            continue
        for method, operation in path_item.items():
            if method.lower() not in HTTP_METHODS or not isinstance(operation, dict):
                continue
            location = f"{method.upper()} {path}"
            operation_id = operation.get("operationId")
            if not isinstance(operation_id, str) or not operation_id:
                errors.append(f"{location} does not have an operationId.")
            elif operation_id in operation_ids:
                errors.append(
                    f"operationId {operation_id!r} is used by both "
                    f"{operation_ids[operation_id]} and {location}."
                )
            else:
                operation_ids[operation_id] = location

            if RDI_TAG in operation.get("tags", []):
                rdi_operations += 1
                security = operation.get("security")
                has_rdi_pair = (
                    isinstance(security, list)
                    and len(security) == 1
                    and isinstance(security[0], dict)
                    and set(security[0]) == RDI_SECURITY_KEYS
                )
                if not has_rdi_pair:
                    errors.append(
                        f"{location} must require only x-api-key and "
                        "x-api-secret-key together."
                    )

    if require_rdi and rdi_operations == 0:
        errors.append(f"No operations use the {RDI_TAG!r} tag.")
    if require_rdi:
        validate_rdi_sources(document, errors)

    walk(document, document, "$", errors)
    return errors


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("openapi_file", type=Path)
    parser.add_argument(
        "--require-rdi",
        action="store_true",
        help="Require at least one Redis Cloud RDI operation.",
    )
    args = parser.parse_args()

    try:
        with args.openapi_file.open(encoding="utf-8") as source:
            document = json.load(source)
    except (OSError, json.JSONDecodeError) as error:
        print(f"OpenAPI validation failed: {error}", file=sys.stderr)
        return 1

    errors = validate(document, require_rdi=args.require_rdi)
    if errors:
        print("OpenAPI validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"OpenAPI validation passed for {args.openapi_file}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

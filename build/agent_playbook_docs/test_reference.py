"""Check the public contract and documentation links without a running service."""

import json
from pathlib import Path
import re

from openapi_spec_validator import validate

from check_sdk_source import check
from examples import downloads


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "content/develop/ai/context-engine/agent-playbook"


def test_public_openapi_is_valid():
    validate(json.loads((DOCS / "api-reference/openapi.json").read_text()))


def test_relrefs_resolve():
    for path in DOCS.rglob("*.md"):
        source = path.read_text()
        for target in re.findall(r'\{\{< relref "([^"]+)" >\}\}', source):
            page = ROOT / "content" / target.split("#", 1)[0].lstrip("/")
            assert any(candidate.exists() for candidate in [
                page.with_suffix(".md"), page / "_index.md", page / "index.md",
            ]), (path, target)


def test_source_lock():
    check()


def test_downloads_match_displayed_examples():
    for path, source in downloads().items():
        assert path.read_text() == source, f"Refresh {path} with examples.py --refresh-downloads"

"""Check the public contract and documentation links without a running service."""

import json
from pathlib import Path
import re
from xml.etree import ElementTree

from openapi_spec_validator import validate

from check_sdk_source import check
from examples import ALL_CLIENTS, CLIENTS, GUIDES, bundle, calls, processed, source_path, step


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


def test_tce_sources_cover_rendered_steps():
    for page in (*GUIDES, "agent-integration"):
        for attrs in calls(page):
            files = bundle(attrs["set"])
            clients = attrs["lang_filter"].split(",")
            assert set(clients).issubset(ALL_CLIENTS.values())
            for suffix, client in ALL_CLIENTS.items():
                if client in clients:
                    assert step(files[suffix], attrs["step"])
                    source, _ = processed(files[suffix])
                    assert "STEP_START" not in source and "EXAMPLE:" not in source


def test_typescript_is_not_published_in_playbook_examples():
    for page in (*GUIDES, "agent-integration"):
        for attrs in calls(page):
            assert "TypeScript (Iris)" not in attrs["lang_filter"].split(",")
    for path in DOCS.glob("*.md"):
        source = path.read_text()
        assert not re.search(r"```(?:typescript|javascript)|\.mts\b|npx tsx|npm install", source), path
    quickstart = (DOCS / "quickstart.md").read_text()
    assert "https://www.npmjs.com/package/@redis-iris/agent-playbook" in quickstart


def test_proposal_diagram_qualifies_default_retention_windows():
    diagram = ElementTree.parse(
        ROOT / "static/images/ai/context-engine/agent-playbook-proposals.svg"
    )
    labels = [node.text for node in diagram.iter("{http://www.w3.org/2000/svg}text")]
    assert labels.count("30 DAYS BY DEFAULT") == 2
    assert not any("60 DAYS" in label for label in labels)


def test_optional_cleanup_is_separate_from_full_program_copies():
    for page in ("quickstart", "faqs", "skills"):
        for suffix in CLIENTS:
            source, _ = processed(source_path(page, suffix))
            assert not re.search(r"delete_(faq|skill)\(|delete(Faq|Skill)\(|-X DELETE", source)
            assert not re.search(r"withdraw_(faq|skill)\(|withdraw(Faq|Skill)\(|/publication.*DELETE", source)

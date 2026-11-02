"""Check the public contract and documentation links without a running service."""

import json
from pathlib import Path
import re
from urllib.parse import unquote
from xml.etree import ElementTree

from openapi_spec_validator import validate

from check_sdk_source import check
from examples import ALL_CLIENTS, CLIENTS, GUIDES, bundle, calls, processed, source_path, step


ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "content/develop/ai/context-engine/agent-playbooks"
OPERATOR_DOCS = ROOT / "content/operate/iris/agent-playbook"
SHARED_SETUP = ROOT / "content/develop/ai/context-engine/sdk-and-cli.md"


def test_public_openapi_is_valid():
    validate(json.loads((DOCS / "api-reference/openapi.json").read_text()))


def heading_ids(source):
    source = re.sub(r"(?ms)^```.*?^```[^\n]*$", "", source)
    result = set()
    for heading in re.findall(r"^#{1,6}\s+(.+)$", source, re.M):
        explicit = re.search(r"\{#([^}]+)\}", heading)
        if explicit:
            result.add(explicit[1])
        else:
            heading = re.sub(r"[^\w\s-]", "", heading.lower())
            result.add(re.sub(r"\s+", "-", heading.strip()))
    return result


def test_documentation_links_anchors_and_images_resolve():
    pages = [*DOCS.glob("*.md"), *OPERATOR_DOCS.glob("*.md"), SHARED_SETUP]
    schemas = json.loads((DOCS / "api-reference/openapi.json").read_text())["components"]["schemas"]
    for path in pages:
        source = path.read_text()
        targets = re.findall(r'\{\{< relref "([^"]+)" >\}\}', source)
        targets += re.findall(r'!?\[[^\]]*\]\(([^)\s]+)\)', source)
        targets += re.findall(r'\{\{< tile-card[^>]+url="([^"]+)"', source)
        for target in targets:
            if target.startswith("/images/"):
                assert (ROOT / "static" / target.split("#", 1)[0].lstrip("/")).is_file(), (path, target)
                continue
            if not target.startswith(("/content/", "/develop/", "/operate/", "#")):
                continue
            route, _, anchor = target.partition("#")
            if not route:
                page = path
            else:
                relative = route.lstrip("/") if route.startswith("/content/") else "content/" + route.lstrip("/")
                base = ROOT / relative
                page = next((candidate for candidate in [base, base.with_suffix(".md"), base / "_index.md", base / "index.md"]
                             if candidate.is_file()), None)
            assert page is not None, (path, target)
            if anchor.startswith("schema/"):
                assert anchor.removeprefix("schema/") in schemas, (path, target)
            elif anchor:
                assert unquote(anchor) in heading_ids(page.read_text()), (path, target)


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


def test_playbook_examples_use_only_the_documented_clients():
    for page in (*GUIDES, "agent-integration"):
        for attrs in calls(page):
            assert "TypeScript (Iris)" not in attrs["lang_filter"].split(",")
    for path in DOCS.glob("*.md"):
        source = path.read_text()
        assert not re.search(r"```(?:typescript|javascript)|\.mts\b|npx tsx|npm install", source), path
    assert not list((ROOT / "local_examples/iris/playbooks").rglob("*.mts"))


def test_quickstart_headings_work_with_toc_selectors():
    source = (DOCS / "quickstart.md").read_text()
    assert not re.search(r"^#{2,6}\s+\d", source, re.MULTILINE)


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

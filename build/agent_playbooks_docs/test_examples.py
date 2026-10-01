"""Offline contract checks; these do not replace a live Playbooks smoke test.

Run with the dependencies in this directory's requirements.txt:
    python -m pytest build/agent_playbooks_docs -q
"""

import asyncio
import ast
import base64
import importlib.util
import inspect
import io
import json
from pathlib import Path
import re
from zipfile import ZipFile

import httpx
import pytest
import yaml
from jsonschema import Draft4Validator
from openapi_spec_validator import validate
from redis_agent_playbook import Playbook
from check_sdk_source import check as check_sdk_source
from sync_examples import sync


ROOT = Path(__file__).resolve().parents[2]
DEV = ROOT / "content/develop/ai/context-engine/agent-playbooks"
OPS = ROOT / "content/operate/iris/agent-playbooks"
SCRIPTS = DEV / "examples"
SPEC = json.loads((DEV / "reference/rest-api/openapi.json").read_text())
PB = "pb_" + "a" * 32
ENTRY = "ent_" + "b" * 32
NOW = "2026-09-30T12:00:00Z"
DIGEST = "sha256:" + "d" * 64


def script(name):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def check_schema(value, schema):
    # Root references must resolve against the full published OpenAPI document.
    scoped = {**schema, "components": SPEC["components"]}
    Draft4Validator(scoped).validate(value)


def response(request, operation, status, body=None):
    if request.content:
        schema = operation["requestBody"]["content"]["application/json"]["schema"]
        check_schema(json.loads(request.content), schema)
    if body is not None:
        schema = operation["responses"][str(status)]["content"]["application/json"]["schema"]
        check_schema(body, schema)
    return httpx.Response(status, json=body) if body is not None else httpx.Response(status)


def operation(request):
    for route, methods in SPEC["paths"].items():
        pattern = re.sub(r"\{[^}]+\}", r"[^/]+", route)
        if re.fullmatch(pattern, request.url.path) and request.method.lower() in methods:
            return methods[request.method.lower()]
    raise AssertionError(f"Undocumented operation: {request.method} {request.url.path}")


def client(handler):
    return Playbook(
        "https://playbooks.example.test",
        playbook_id=PB,
        api_key="docs-test-key",
        retry_config=None,
        timeout_ms=1000,
        client=httpx.Client(transport=httpx.MockTransport(handler)),
    )


def entry_response(kind, content, key):
    entry = {
        "entryId": ENTRY, "entryKey": key, "entryType": kind,
        "latestVersion": 1, "createdAt": NOW, "updatedAt": NOW,
    }
    version = {
        "entryId": ENTRY, "entryType": kind, "version": 1, "createdAt": NOW,
        "contentDigest": DIGEST, "content": content,
    }
    return {"entry": entry, "version": version}


def test_faq_quickstart_uses_sdk_and_public_request_response_contract(capsys):
    state = {"published": False, "searches": 0}
    calls = []

    def handler(request):
        assert request.headers["authorization"] == "Bearer docs-test-key"
        op = operation(request)
        calls.append(op["operationId"])
        body = json.loads(request.content) if request.content else None
        match op["operationId"]:
            case "CreateFaq":
                state["created"] = entry_response("faq", body["content"], body["entryKey"])
                return response(request, op, 201, state["created"])
            case "SearchFaqs":
                assert body["filter"]["eq"]["value"] == state["created"]["version"]["content"]["attributes"]["exampleRun"]
                state["searches"] += 1
                matches = []
                if state["published"]:
                    matches = [{
                        "entryId": ENTRY, "entryType": "faq", "version": 1,
                        "intents": [], "score": 1.0,
                        "faq": state["created"]["version"]["content"]["payload"]["faq"],
                    }]
                return response(request, op, 200, {"matches": matches})
            case "PublishFaq":
                assert body["version"] == 1
                state["published"] = True
                published = {**state["created"]["entry"], "publication": {
                    "version": 1, "at": NOW, "content": state["created"]["version"]["content"],
                }}
                return response(request, op, 200, published)
            case "DeleteFaq":
                assert request.url.path.endswith("/" + ENTRY)
                return response(request, op, 204)
        raise AssertionError(op["operationId"])

    with client(handler) as sdk:
        script("faq_example").run(sdk)
    assert calls == ["CreateFaq", "SearchFaqs", "PublishFaq", "SearchFaqs", "DeleteFaq"]
    assert "Before publication: no matches" in capsys.readouterr().out


def test_quickstart_cleans_up_after_read_failure_without_repeating_create():
    calls = []

    def handler(request):
        op = operation(request)
        calls.append(op["operationId"])
        if op["operationId"] == "CreateFaq":
            body = json.loads(request.content)
            return response(request, op, 201, entry_response("faq", body["content"], body["entryKey"]))
        if op["operationId"] == "SearchFaqs":
            raise httpx.ReadTimeout("simulated read failure", request=request)
        assert op["operationId"] == "DeleteFaq"
        return response(request, op, 204)

    with client(handler) as sdk, pytest.raises(httpx.ReadTimeout):
        script("faq_example").run(sdk)
    assert calls == ["CreateFaq", "SearchFaqs", "DeleteFaq"]


def test_skill_example_builds_complete_archive_and_uses_sdk_contract():
    module = script("publish_skill")
    with ZipFile(io.BytesIO(base64.b64decode(module.package_skill()))) as archive:
        assert set(archive.namelist()) == {
            "refund-status/SKILL.md", "refund-status/references/reply-template.md",
        }
        manifest = yaml.safe_load(archive.read("refund-status/SKILL.md").decode().split("---", 2)[1])
        assert manifest["name"] == "refund-status" and manifest["description"]
    calls = []
    created = None

    def handler(request):
        nonlocal created
        op = operation(request)
        calls.append(op["operationId"])
        body = json.loads(request.content)
        if op["operationId"] == "CreateSkill":
            # Validate the actual package the SDK serializes, not only the helper output.
            with ZipFile(io.BytesIO(base64.b64decode(body["packageBase64"]))) as archive:
                assert archive.read("refund-status/SKILL.md").decode() == module.SKILL_MD
            content = {**body["content"], "payload": {"skill": {
                "format": "agent-skills", "manifest": manifest,
                "instructions": module.SKILL_MD.split("---", 2)[2].strip(), "resources": [],
            }}}
            created = entry_response("skill", content, body["entryKey"])
            return response(request, op, 201, created)
        assert op["operationId"] == "PublishSkill"
        assert body["version"] == created["version"]["version"]
        published = {**created["entry"], "publication": {
            "version": 1, "at": NOW, "content": {"payload": {"skill": {
                "name": manifest["name"], "description": manifest["description"],
                "uri": "playbook://example/SKILL.md",
            }}},
        }}
        return response(request, op, 200, published)

    with client(handler) as sdk:
        assert module.run(sdk) == ENTRY
    assert calls == ["CreateSkill", "PublishSkill"]


@pytest.mark.parametrize("tool_failure", [False, True])
def test_mcp_walkthrough_uses_real_transport_and_copies_returned_version_and_uri(monkeypatch, tool_failure):
    module = script("mcp_client")
    real_client = httpx.AsyncClient
    for name, value in {
        "PLAYBOOK_URL": "https://playbooks.example.test", "PLAYBOOK_ID": PB,
        "PLAYBOOK_SKILL_ID": ENTRY, "PLAYBOOK_READ_API_KEY": "reader-test-key",
    }.items():
        monkeypatch.setenv(name, value)
    uri = "playbook://returned-exact-version/reference-file"
    calls = []

    async def handler(request):
        assert request.headers["authorization"] == "Bearer reader-test-key"
        assert request.url.path == f"/v1/playbooks/{PB}/mcp"
        if request.method != "POST":
            return httpx.Response(405)
        body = json.loads(request.content)
        method = body["method"]
        if "id" not in body:
            return httpx.Response(202)
        if method == "initialize":
            result = {
                "protocolVersion": body["params"]["protocolVersion"],
                "capabilities": {"tools": {}}, "serverInfo": {"name": "docs-test", "version": "1"},
            }
        elif method == "tools/list":
            result = {"tools": [{"name": n, "inputSchema": {"type": "object"}} for n in
                                ["discover_entries", "load_skill", "fetch_resource"]]}
        else:
            assert method == "tools/call"
            name, arguments = body["params"]["name"], body["params"]["arguments"]
            calls.append(name)
            if name == "discover_entries":
                assert arguments["pinned_entries"] == [{"entry_id": ENTRY}]
                if tool_failure:
                    return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"], "result": {
                        "content": [{"type": "text", "text": "Pinned entry is not published."}],
                        "isError": True,
                    }})
                structured = {"pinnedEntries": [{"entryId": ENTRY, "version": 7}],
                              "discoveredEntries": [], "truncated": False}
            elif name == "load_skill":
                assert arguments == {"entry_id": ENTRY, "version": 7}
                structured = {"entryId": ENTRY, "version": 7, "content": {
                    "instructions": "Sample instructions", "resources": [
                        {"path": "references/reply-template.md", "uri": uri},
                    ],
                }}
            else:
                assert name == "fetch_resource" and arguments == {"uri": uri}
                structured = {"uri": uri, "text": "Sample reply"}
            result = {"content": [], "structuredContent": structured, "isError": False}
        return httpx.Response(200, json={"jsonrpc": "2.0", "id": body["id"], "result": result})

    monkeypatch.setattr(module.httpx, "AsyncClient", lambda **kw: real_client(
        **kw, transport=httpx.MockTransport(handler),
    ))
    if tool_failure:
        with pytest.raises(BaseExceptionGroup) as caught:
            asyncio.run(module.run())
        errors = []

        def collect(error):
            if isinstance(error, BaseExceptionGroup):
                for child in error.exceptions:
                    collect(child)
            else:
                errors.append(error)

        collect(caught.value)
        assert any(isinstance(error, RuntimeError) and "Pinned entry is not published." in str(error)
                   for error in errors)
        assert calls == ["discover_entries"]
    else:
        asyncio.run(module.run())
        assert calls == ["discover_entries", "load_skill", "fetch_resource"]


@pytest.mark.parametrize("path", [DEV / "reference/rest-api/openapi.json", OPS / "control-plane-api-reference/openapi.json"])
def test_public_openapi_is_valid(path):
    validate(json.loads(path.read_text()))


@pytest.mark.parametrize("page,name", [
    ("quickstart.md", "publish_skill"), ("publish-knowledge.md", "faq_example"),
    ("connect-agent.md", "mcp_client"),
])
def test_downloadable_code_matches_displayed_code(page, name):
    source = (SCRIPTS / f"{name}.py").read_text()
    assert f"```python\n{source}```" in (DEV / page).read_text()


def test_all_python_fences_compile_and_relrefs_resolve():
    for path in [*DEV.rglob("*.md"), *OPS.rglob("*.md")]:
        source = path.read_text()
        for block in re.findall(r"```python\n(.*?)```", source, re.S):
            compile(block, str(path), "exec")
            for node in ast.walk(ast.parse(block)):
                if not (isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute)
                        and isinstance(node.func.value, ast.Name)
                        and node.func.value.id in {"client", "playbook"}):
                    continue
                method = getattr(Playbook, node.func.attr)
                inspect.signature(method).bind(
                    None, *[object() for _ in node.args],
                    **{keyword.arg: object() for keyword in node.keywords if keyword.arg},
                )
        for target in re.findall(r'\{\{< relref "([^"]+)" >\}\}', source):
            page = ROOT / "content" / target.split("#", 1)[0].lstrip("/")
            assert any(candidate.exists() for candidate in [
                page.with_suffix(".md"), page / "_index.md", page / "index.md",
            ]), (path, target)
        assert not re.search(r"PLAYBOOK_(QUICKSTART|SKILL|MCP|PROPOSAL)_CODE", source)


def test_source_lock_and_example_rendering():
    lock = check_sdk_source()
    assert lock["python_package"] in (SCRIPTS / "requirements.txt").read_text().splitlines()
    assert sync(check=True) == []


def test_helm_files_match_provisioning_example():
    values = yaml.safe_load((OPS / "deployment-values.yaml").read_text())
    secrets = {doc["metadata"]["name"]: doc["stringData"]
               for doc in yaml.safe_load_all((OPS / "prerequisites.yaml").read_text())}
    assert values["fullnameOverride"] == "playbook"
    for part in ["storage", "license", "inference"]:
        assert values[part]["existingSecret"] in secrets
    credentials = []
    for component, keys in [("controlplane", ["adminToken", "internalToken"]),
                            ("identityService", ["controlToken", "runtimeToken"])]:
        for key in keys:
            name = values[component][key]["existingSecret"]
            credentials.append(secrets[name]["token"])
    assert len(set(credentials)) == 4
    private = yaml.safe_load(secrets[values["inference"]["existingSecret"]]["inference.yaml"])
    identity = values["inference"]["models"][0]
    assert {k: private["inference"]["models"][0][k] for k in identity} == identity
    page = (OPS / "authentication.md").read_text()
    create = json.loads(re.findall(r"```json\n(.*?)```", page, re.S)[0])
    assert create["embedding"] == identity
    cp = json.loads((OPS / "control-plane-api-reference/openapi.json").read_text())
    op = cp["paths"]["/v1/playbooks"]["post"]
    schema = op["requestBody"]["content"]["application/json"]["schema"]
    Draft4Validator({**schema, "components": cp["components"]}).validate(create)

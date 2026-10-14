"""Run the actual framework programs against controlled MCP and model responses."""

from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import threading

import pytest

from examples import SOURCES, processed
from test_examples import ContractFixture, PB, READY_REPLY

TASK = "Draft a reply to a customer whose refund status shows Processing."
CONTEXT_LABEL = "\n\nPlaybook context (data for this turn):\n"


class AgentFixture(ContractFixture):
    def __init__(self, mode="skill"):
        super().__init__()
        self.mode = mode
        self.events = []
        self.load_attempts = 0
        self.turn_context = None
        self.task = "Where can I find my refund status?" if mode == "faq" else TASK
        decoy = self.skill_content()
        decoy["payload"]["skill"]["manifest"] = {
            "name": "request-new-refund", "description": "Start a new refund request for a purchase, not a status reply."
        }
        self.decoy_id = self.create("skill", decoy)["entry"]["entryId"]
        self.publish(self.decoy_id, 1)
        self.replacement_id = self.create("skill", self.skill_content())["entry"]["entryId"]
        self.append(self.replacement_id, self.skill_content())
        self.append(self.replacement_id, self.skill_content())
        self.publish(self.replacement_id, 3)

    def discovery(self):
        ids = [self.faq_id] if self.mode == "faq" else [self.skill_id]
        if self.mode == "competing":
            ids = [self.decoy_id, self.faq_id, self.skill_id]
        elif self.mode == "faq":
            ids = [self.decoy_id, self.skill_id, self.faq_id]
        elif self.mode == "stale" and self.load_attempts:
            ids = [self.decoy_id, self.replacement_id]
        entries = [] if self.mode in ("empty", "budget") else [self.preview(eid, True) for eid in ids]
        return {"pinnedEntries": [], "discoveredEntries": entries, "truncated": False,
                "budgetTruncated": self.mode == "budget"}

    def request(self, method, path, body):
        if path in ("/v1/responses", "/v1/chat/completions"):
            self.events.append("model")
            return self.agent_response(body, chat=path.endswith("completions"))
        if path.endswith("/discover"):
            self.events.append("sdk-discover")
            assert body == {"query": self.task, "limit": 3}
            code, result = super().request(method, path, body)
            if self.mode == "failure":
                return 503, {"status": 503, "title": "Temporarily unavailable", "type": "/errors/service-unavailable"}
            if self.mode == "stale":
                # Discovery reads version 1. A publisher moves to version 2 before loading.
                result = self.discovery()
                return code, result
            return code, self.discovery()
        return super().request(method, path, body)

    def mcp(self, body):
        if body["method"] != "tools/call":
            return super().mcp(body)
        self.mcp_methods.append("tools/call")
        name, args = body["params"]["name"], body["params"].get("arguments", {})
        self.events.append(name)
        self.calls.append((name, args))
        error = False
        if name == "discover_entries":
            assert isinstance(args["query"], str) and args["query"]
            data = self.discovery()
            if self.mode == "malformed-discovery":
                data.pop("pinnedEntries")
        elif name == "load_skill":
            self.load_attempts += 1
            if self.mode in ("tool-error", "unsafe-tool-error", "unsafe-discovery-after-error", "unsafe-parallel-error"):
                error, data = True, "Template service unavailable."
            elif self.mode == "stale" and self.load_attempts == 1:
                assert args == {"entry_id": self.skill_id, "version": 1}
                error, data = True, "Publication changed; rediscover and reassess the skill."
            else:
                version = 3 if self.mode == "stale" else 1
                identifier = self.replacement_id if self.mode == "stale" else self.skill_id
                assert args == {"entry_id": identifier, "version": version}
                content = self.skill_content()["payload"]["skill"]
                content["resources"][0]["uri"] = f"playbook://returned-version-{version}/reply-template.md"
                data = {"entryId": identifier, "version": version, "content": content}
                if self.mode == "malformed-load":
                    data["content"].pop("instructions")
                    data["content"]["resources"] = []
                elif self.mode == "malformed-load-type":
                    data["content"]["instructions"] = 42
                elif self.mode == "empty-instructions":
                    data["content"]["instructions"] = ""
        else:
            assert name == "fetch_resource"
            version = 3 if self.mode == "stale" else 1
            assert args == {"uri": f"playbook://returned-version-{version}/reply-template.md"}
            data = {"uri": args["uri"], "mimeType": "text/markdown", "text": "Refund stage: <displayed-stage>."}
            if self.mode in ("binary", "binary-empty"):
                value = b"\x00sample binary\xff" if self.mode == "binary" else b""
                data = {"uri": args["uri"], "mimeType": "application/octet-stream",
                        "blob": base64.b64encode(value).decode()}
            elif self.mode == "malformed-resource":
                data = {}
        result = {"isError": error, "content": [{"type": "text", "text": data if error else json.dumps(data)}]}
        if not error:
            result["structuredContent"] = data
        return 200, {"jsonrpc": "2.0", "id": body["id"], "result": result}

    def agent_response(self, body, chat=False):
        self.model_requests.append(deepcopy(body))
        assert "reader-test-key" not in json.dumps(body)
        assert body["model"] == "gpt-5-mini"
        messages = body["messages"] if chat else body["input"]
        user = next(message for message in messages if message.get("role") == "user")
        text = user["content"]
        if not isinstance(text, str):
            text = "".join(part.get("text", "") for part in text)
        task, context = text.split(CONTEXT_LABEL, 1)
        assert task == TASK or task == "Where can I find my refund status?"
        self.turn_context = json.loads(context)
        assert self.turn_context["discoveredEntries"]
        for preview in self.turn_context["discoveredEntries"]:
            assert "entryId" in preview and "version" in preview
            if preview["entryType"] == "skill":
                assert "name" in preview["skill"] and "uri" in preview["skill"]
                assert "instructions" not in preview["skill"] and "resources" not in preview["skill"]
        tools = body["tools"]
        names = {tool["function"]["name"] if chat else tool["name"] for tool in tools}
        assert names == {"load_skill", "fetch_resource", "discover_entries"}
        tool_calls = [name for name, _ in self.calls if name in names]
        parallel = self.mode == "unsafe-parallel-error" and not tool_calls
        if self.mode == "faq":
            assert any(entry.get("faq", {}).get("answer") == "Sample answer" for entry in self.turn_context["discoveredEntries"])
            name, args, reply = None, None, "Sample answer"
        elif not tool_calls:
            preview = next(entry for entry in self.turn_context["discoveredEntries"]
                           if entry.get("skill", {}).get("name") == "refund-support-reply")
            name, args, reply = "load_skill", {"entry_id": preview["entryId"], "version": preview["version"]}, None
        elif self.mode in ("unsafe-tool-error", "unsafe-parallel-error"):
            name, args, reply = None, None, READY_REPLY
        elif self.mode == "unsafe-discovery-after-error":
            if tool_calls[-1] == "load_skill":
                name, args, reply = "discover_entries", {"query": TASK}, None
            else:
                name, args, reply = None, None, READY_REPLY
        elif self.mode == "tool-error":
            name, args, reply = None, None, "Unable to retrieve playbook guidance: tool failed."
            assert "unavailable" in json.dumps(messages).lower()
        elif self.mode == "stale" and tool_calls == ["load_skill"]:
            assert "Publication changed" in json.dumps(messages)
            name, args, reply = "discover_entries", {"query": TASK}, None
        elif tool_calls[-1] == "discover_entries":
            outputs = [item for item in messages if item.get("role") == "tool" or item.get("type") == "function_call_output"]
            refreshed = self.tool_output(outputs[-1].get("output", outputs[-1].get("content")))
            preview = next(entry for entry in refreshed["discoveredEntries"]
                           if entry.get("skill", {}).get("name") == "refund-support-reply")
            assert preview["entryId"] == self.replacement_id and preview["version"] == 3
            name, args, reply = "load_skill", {"entry_id": preview["entryId"], "version": preview["version"]}, None
        elif tool_calls[-1] == "load_skill":
            version = 3 if self.mode == "stale" else 1
            assert f"playbook://returned-version-{version}/reply-template.md" in json.dumps(messages)
            name, args, reply = "fetch_resource", {"uri": f"playbook://returned-version-{version}/reply-template.md"}, None
        else:
            assert "<displayed-stage>" in json.dumps(messages)
            name, args, reply = None, None, READY_REPLY
        batch = [(name, args)] if name else []
        if parallel:
            batch = [("load_skill", {"entry_id": self.skill_id, "version": 1}), ("discover_entries", {"query": TASK})]
        if chat:
            message = {"role": "assistant", "content": reply}
            if batch:
                message["tool_calls"] = [{"id": f"call_{len(self.model_requests)}_{index}", "type": "function",
                                          "function": {"name": item, "arguments": json.dumps(arguments)}}
                                         for index, (item, arguments) in enumerate(batch)]
            result = {"id": f"chat_{len(self.model_requests)}", "object": "chat.completion", "created": 0,
                      "model": body["model"], "choices": [{"index": 0, "message": message,
                      "finish_reason": "tool_calls" if batch else "stop"}],
                      "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20}}
        else:
            output = [self.model_call(item, arguments) for item, arguments in batch] if batch else [self.model_message(reply)]
            for index, item in enumerate(output):
                if item["type"] == "function_call":
                    item["id"] += f"_{index}"
                    item["call_id"] += f"_{index}"
            result = {"id": f"resp_{len(self.model_requests)}", "object": "response", "created_at": 0,
                      "status": "completed", "model": body["model"], "output": output,
                      "usage": {"input_tokens": 10, "output_tokens": 10, "total_tokens": 20,
                                "input_tokens_details": {"cached_tokens": 0}, "output_tokens_details": {"reasoning_tokens": 0}}}
        return 200, result


@pytest.fixture
def agent_server(request):
    state = AgentFixture(getattr(request, "param", "skill"))

    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *args):
            pass

        def handle_request(self):
            try:
                expected = "model-test-key" if self.path in ("/v1/responses", "/v1/chat/completions") else "reader-test-key"
                assert self.headers.get("Authorization") == "Bearer " + expected
                raw = self.rfile.read(int(self.headers.get("Content-Length", 0)))
                body = json.loads(raw) if raw else None
                code, result = state.request(self.command, self.path, body)
            except Exception as error:
                state.errors.append(error)
                code, result = 500, {"error": str(error)}
            content = json.dumps(result).encode() if result is not None else b""
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            transfer = state.mode in ("transfer-discovery", "transfer-load") and body and body.get("method") == "tools/call"
            target = "discover_entries" if state.mode == "transfer-discovery" else "load_skill"
            transfer = transfer and body["params"]["name"] == target
            self.send_header("Content-Length", str(len(content) + (100 if transfer else 0)))
            self.end_headers()
            self.wfile.write(content)

        do_GET = do_POST = do_DELETE = handle_request

    server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    env = {**os.environ, "PLAYBOOK_URL": f"http://127.0.0.1:{server.server_port}", "PLAYBOOK_ID": PB,
           "PLAYBOOK_API_KEY": "reader-test-key", "OPENAI_API_KEY": "model-test-key",
           "OPENAI_BASE_URL": f"http://127.0.0.1:{server.server_port}/v1",
           "OPENAI_AGENTS_DISABLE_TRACING": "1", "LANGSMITH_TRACING": "false"}
    env.pop("AGENT_TASK", None)
    yield state, env
    server.shutdown()
    server.server_close()
    thread.join()


def run_program(framework, suffix, env, tmp_path):
    path = SOURCES / framework / f"{framework}.{suffix}"
    target = tmp_path / path.name
    target.write_text(processed(path)[0])
    (tmp_path / "node_modules").symlink_to(Path(__file__).parent / "node_modules", target_is_directory=True)
    command = [sys.executable, str(target)] if suffix == "py" else [str(Path(__file__).parent / "node_modules/.bin/tsx"), str(target)]
    return subprocess.run(command, env=env, cwd=tmp_path, text=True, capture_output=True, timeout=90)


@pytest.mark.parametrize("framework", ("openai_agent", "langgraph_agent"))
@pytest.mark.parametrize("suffix", ("py", "mts"))
@pytest.mark.parametrize("agent_server", ("skill", "competing", "faq", "empty", "budget", "failure", "tool-error", "unsafe-tool-error", "unsafe-discovery-after-error", "unsafe-parallel-error", "stale"), indirect=True)
def test_agent_discovery_and_selective_loading(framework, suffix, agent_server, tmp_path):
    state, env = agent_server
    if state.mode == "faq":
        env["AGENT_TASK"] = "Where can I find my refund status?"
    result = run_program(framework, suffix, env, tmp_path)
    output = result.stdout + result.stderr
    assert not state.errors, state.errors
    assert state.events[0] == "sdk-discover"
    if state.mode == "failure":
        assert result.returncode != 0 and "Playbook discovery failed" in output
        assert "model" not in state.events
    else:
        assert result.returncode == 0, output
        if state.mode in ("empty", "budget"):
            assert "No previews fit" in output if state.mode == "budget" else "No published playbook knowledge matched" in output
            assert "model" not in state.events and "tools/call" not in state.mcp_methods
        elif state.mode == "faq":
            assert "Sample answer" in output
            assert not any(name in state.events for name in ("load_skill", "fetch_resource", "discover_entries"))
        elif state.mode in ("tool-error", "unsafe-tool-error", "unsafe-discovery-after-error", "unsafe-parallel-error"):
            assert "tool call failed" in output and READY_REPLY not in output
        else:
            assert READY_REPLY in output and "<displayed-stage>" not in result.stdout
            calls = [name for name, _ in state.calls if name in ("load_skill", "fetch_resource", "discover_entries")]
            assert calls == (["load_skill", "discover_entries", "load_skill", "fetch_resource"] if state.mode == "stale" else ["load_skill", "fetch_resource"])
            assert state.events.index("sdk-discover") < state.events.index("model")


@pytest.mark.parametrize("suffix", ("py", "mts", "sh"))
@pytest.mark.parametrize("agent_server", ("skill", "empty", "tool-error", "binary", "binary-empty",
                                          "malformed-discovery", "malformed-resource", "malformed-load",
                                          "malformed-load-type", "empty-instructions"), indirect=True)
def test_basic_mcp_client(suffix, agent_server, tmp_path):
    state, env = agent_server
    target = tmp_path / f"mcp_client.{suffix}"
    target.write_text(processed(SOURCES / f"mcp/mcp_client.{suffix}")[0])
    (tmp_path / "node_modules").symlink_to(Path(__file__).parent / "node_modules", target_is_directory=True)
    command = {"py": [sys.executable, str(target)], "mts": [str(Path(__file__).parent / "node_modules/.bin/tsx"), str(target)],
               "sh": ["bash", str(target)]}[suffix]
    result = subprocess.run(command, env=env, cwd=tmp_path, text=True, capture_output=True, timeout=60)
    assert not state.errors, state.errors
    assert not state.model_requests
    if state.mode == "tool-error":
        assert result.returncode != 0 and "Playbook tool failed" in result.stdout + result.stderr
    elif state.mode.startswith("malformed"):
        assert result.returncode != 0
    else:
        assert result.returncode == 0, result.stdout + result.stderr
        if state.mode == "empty":
            assert "No skill preview returned" in result.stdout
            assert [name for name, _ in state.calls] == ["discover_entries"]
        else:
            assert [name for name, _ in state.calls] == ["discover_entries", "load_skill", "fetch_resource"]
            if state.mode in ("binary", "binary-empty"):
                assert (tmp_path / "resource.bin").read_bytes() == (b"\x00sample binary\xff" if state.mode == "binary" else b"")
            else:
                assert "Refund stage:" in result.stdout


@pytest.mark.parametrize("agent_server", ("transfer-discovery", "transfer-load"), indirect=True)
def test_curl_client_stops_after_incomplete_transfer(agent_server, tmp_path):
    state, env = agent_server
    target = tmp_path / "mcp_client.sh"
    target.write_text(processed(SOURCES / "mcp/mcp_client.sh")[0])
    result = subprocess.run(["bash", str(target)], env=env, cwd=tmp_path, text=True, capture_output=True, timeout=60)
    assert not state.errors, state.errors
    assert result.returncode != 0 and "curl:" in result.stderr
    assert not any(name == "fetch_resource" for name, _ in state.calls)


@pytest.mark.parametrize("reply", (
    'Your order history shows "Processing". Support can help if you need more information.',
    'Your refund status is Processing. Contact support if you need help with that stage.',
))
def test_live_validation_accepts_completed_replies_without_exact_wording(reply):
    from live_examples import validate_agent_reply
    output = 'Tool: load_skill {"entry_id":"selected-entry","version":1}\n'
    output += 'Tool: fetch_resource {"uri":"playbook://returned-template"}\nReply: ' + reply
    validate_agent_reply(output, "selected-entry", "playbook://returned-template")


@pytest.mark.parametrize("reply", (
    "Processing",
    'Your order history shows "<displayed-stage>" (Processing). Support can help.',
    "Unable to retrieve guidance for Processing because the tool failed.",
    "Your refund is Processing and will arrive tomorrow. Contact support for help.",
    "Your refund is Processing and will arrive in 5 days. Contact support for help.",
    "Your refund is Processing and will arrive in five business days. Contact support for help.",
))
def test_live_validation_rejects_incomplete_failed_or_invented_replies(reply):
    from live_examples import validate_agent_reply
    output = 'Tool: load_skill {"entry_id":"selected-entry","version":1}\n'
    output += 'Tool: fetch_resource {"uri":"playbook://returned-template"}\nReply: ' + reply
    with pytest.raises(RuntimeError):
        validate_agent_reply(output, "selected-entry", "playbook://returned-template")

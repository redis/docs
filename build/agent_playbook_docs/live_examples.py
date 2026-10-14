"""Run displayed TCE steps and full-program copies against a disposable local Playbooks stack.

Provision one playbook per case through the control plane and obtain scoped keys
from Identity Service. The stack must allow the selected embedding model.
Agent framework cases use a real model when OPENAI_API_KEY is set. MCP client
cases connect from the application runtime without a model call.
"""

import argparse
import base64
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from urllib.error import HTTPError
from urllib.request import Request, urlopen
from uuid import uuid4

from redis_agent_playbook import Playbook

from examples import AGENT_GUIDES, GUIDES, agent_scripts, full_examples, scripts, skill_package, standalone_python

HERE = Path(__file__).resolve().parent


def request(method, url, token, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json",
    })
    with urlopen(req, timeout=60) as response:
        data = response.read()
    return json.loads(data) if data else None


def create_key(ids_url, control_token, playbook_id, actions, tenant_id=None, key_ids=None):
    for attempt in range(10):
        try:
            result = request("POST", ids_url + "/v1/api-keys", control_token, {
                "name": "docs-validation-" + uuid4().hex[:12],
                "grants": [{**({"tenant": tenant_id} if tenant_id else {}), "product": "playbook", "resourceType": "playbook",
                            "resourceId": playbook_id, "actions": actions}],
            })
            if key_ids is not None:
                key_ids.append(result["keyId"])
            return result["token"]
        except HTTPError as error:
            if error.code not in (404, 409, 503) or attempt == 9:
                raise
            time.sleep(1)


def cleanup(args, playbook_id, key_ids):
    failures = []
    targets = [(args.ids_url + "/v1/api-keys/" + key_id, args.control_token)
               for key_id in key_ids]
    targets.append((args.cp_url + "/v1/playbooks/" + playbook_id, args.admin_token))
    for url, token in targets:
        try:
            request("DELETE", url, token)
        except Exception as error:
            failures.append(f"{url}: {error}")
    return failures


def seed(client, directory, kind):
    if kind == "faq":
        draft = client.create_faq(content={
            "attributes": {"locale": "en-US", "topic": "refund"},
            "payload": {"faq": {
                "question": "How do I check the status of a refund?",
                "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
            }},
        })
        client.publish_faq(faq_id=draft.entry.entry_id, version=draft.version.version)
    else:
        package = base64.b64encode((directory / "refund-support-reply.zip").read_bytes()).decode()
        draft = client.create_skill(package_base64=package, content={
            "attributes": {"locale": "en-US", "topic": "refund"},
        })
        client.publish_skill(skill_id=draft.entry.entry_id, version=draft.version.version)
    return draft.entry.entry_id


def cases():
    result = {}
    for guide in GUIDES:
        for suffix, source in scripts(guide).items():
            result[f"{guide}.{suffix}"] = (guide, suffix, source)
    for path, source in full_examples().items():
        if path.name != "prepare_skill.sh":
            result[f"{path.stem}_copy{path.suffix}"] = (path.stem, path.suffix[1:], source)
    result["async_search.py"] = ("async_search", "py", standalone_python("quickstart", "Use Python asynchronously"))
    for (guide, suffix), source in agent_scripts().items():
        result[f"{guide}.{suffix}"] = (guide, suffix, source)
    return result


def validate_agent_reply(output, skill_id, template_uri):
    calls = [(name, json.loads(arguments)) for name, arguments in
             re.findall(r"^Tool: (\w+) (\{.*\})$", output, re.M)]
    if ("load_skill", {"entry_id": skill_id, "version": 1}) not in calls:
        raise RuntimeError("Agent did not load the discovered sample skill/version")
    if ("fetch_resource", {"uri": template_uri}) not in calls:
        raise RuntimeError("Agent did not fetch the returned template URI")
    if "Reply:" not in output:
        raise RuntimeError("Agent produced no final reply")
    reply = output.split("Reply:", 1)[1].strip()
    if "Processing" not in reply or len(reply) < 40:
        raise RuntimeError("Final reply did not preserve the reported stage in a completed reply")
    if re.search(r"<[^>]+>|\[(?:displayed[-_ ]stage|stage)\]", reply, re.I):
        raise RuntimeError("Final reply retains a template placeholder")
    if re.search(r"\d|\b(?:tomorrow|next week|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b", reply, re.I):
        raise RuntimeError("Final reply invents timing or numeric details absent from the sample")
    if re.search(r"\b(?:in|within|by|after)\b.{0,32}\b(?:days?|weeks?|months?|hours?|minutes?)\b", reply, re.I):
        raise RuntimeError("Final reply promises a duration absent from the sample")
    if re.search(r"\b(?:unable|unavailable|failed|error)\b", reply, re.I):
        raise RuntimeError("Agent reported a failure instead of completing the sample reply")


def run_case(name, case, args, log_dir):
    guide, suffix, source = case
    created = request("POST", args.cp_url + "/v1/playbooks", args.admin_token, {
        "name": "docs-validation-" + uuid4().hex[:12],
        "embedding": {"provider": args.embedding_provider, "model": args.embedding_model,
                      "dimensions": args.embedding_dimensions},
    })
    playbook_id = created["playbookId"]
    author_key = reader_key = ""
    key_ids = []
    try:
        author_key = create_key(args.ids_url, args.control_token, playbook_id, ["read", "write", "publish", "propose"], args.tenant_id, key_ids)
        with tempfile.TemporaryDirectory(prefix="playbook-live-") as directory:
            directory = Path(directory)
            (directory / "node_modules").symlink_to(HERE / "node_modules", target_is_directory=True)
            preparation = subprocess.run(["bash", "-euc", skill_package()], cwd=directory,
                                         text=True, capture_output=True, timeout=30)
            if preparation.returncode:
                raise RuntimeError("Skill package preparation failed")
            env = {**os.environ, "PLAYBOOK_URL": args.dp_url, "PLAYBOOK_ID": playbook_id,
                   "PLAYBOOK_API_KEY": author_key, "OPENAI_AGENTS_DISABLE_TRACING": "1"}
            with Playbook(args.dp_url, playbook_id=playbook_id, api_key=author_key, retry_config=None) as client:
                if guide in ("retrieval", "limits", "async_search", *AGENT_GUIDES):
                    env["PLAYBOOK_FAQ_ID"] = seed(client, directory, "faq")
                if guide in ("retrieval", "mcp", *AGENT_GUIDES):
                    env["PLAYBOOK_SKILL_ID"] = seed(client, directory, "skill")
                if guide in AGENT_GUIDES:
                    sample = client.get_skill_version(skill_id=env["PLAYBOOK_SKILL_ID"], version=1)
                    template_uri = next(resource.uri for resource in sample.content.payload.skill.resources
                                        if resource.path == "references/reply-template.md")
                if guide in ("retrieval", "limits", "async_search", "mcp", *AGENT_GUIDES):
                    reader_key = create_key(args.ids_url, args.control_token, playbook_id, ["read"], args.tenant_id, key_ids)
                    env["PLAYBOOK_API_KEY"] = reader_key
                # A file named mcp.py shadows the installed MCP package.
                path = directory / ("mcp_client.py" if name == "mcp.py" else name)
                path.write_text(source)
                command = {
                    "py": [sys.executable, str(path)],
                    "mts": [str(HERE / "node_modules/.bin/tsx"), str(path)],
                    "sh": ["bash", str(path)],
                }[suffix]
                completed = subprocess.run(command, env=env, cwd=directory, text=True,
                                           capture_output=True, timeout=180)
                output = completed.stdout + completed.stderr
                for secret in (author_key, reader_key, os.environ.get("OPENAI_API_KEY")):
                    if secret:
                        output = output.replace(secret, "<redacted>")
                (log_dir / (name + ".log")).write_text(output)
                if completed.returncode:
                    raise RuntimeError(f"Exit {completed.returncode}; see {name}.log")
                if name.startswith("quickstart_copy"):
                    entries = client.list_faqs().faqs
                    if not any(entry.latest_version == 2 and entry.publication.version == 2 for entry in entries if entry.publication):
                        raise RuntimeError("Quickstart copy did not retain its updated publication")
                if name.startswith("skills_copy"):
                    if not any(entry.publication for entry in client.list_skills().skills):
                        raise RuntimeError("Skill copy did not retain a publication")
                if guide in AGENT_GUIDES:
                    validate_agent_reply(completed.stdout, env["PLAYBOOK_SKILL_ID"], template_uri)
    finally:
        original_error = sys.exc_info()[0] is not None
        failures = cleanup(args, playbook_id, key_ids)
        if failures:
            details = "Cleanup failures: " + "; ".join(failures)
            if original_error:
                print(details, file=sys.stderr)
            else:
                raise RuntimeError(details)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cp-url", default="http://127.0.0.1:9200")
    parser.add_argument("--dp-url", default="http://127.0.0.1:9201")
    parser.add_argument("--ids-url", default="http://127.0.0.1:9202")
    parser.add_argument("--admin-token", default=os.environ.get("PLAYBOOK_ADMIN_TOKEN", "local-admin"))
    parser.add_argument("--control-token", default=os.environ.get("PLAYBOOK_IDS_CONTROL_TOKEN", "local-control"))
    parser.add_argument("--embedding-provider", default="noop")
    parser.add_argument("--embedding-model", default="playbook-local")
    parser.add_argument("--embedding-dimensions", type=int, default=384)
    parser.add_argument("--case", action="append", choices=cases())
    parser.add_argument("--tenant-id", default=os.environ.get("TENANT_ID"), help="Deployment tenant for strict Identity Service grants")
    parser.add_argument("--log-dir", type=Path, required=True)
    args = parser.parse_args()
    args.log_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for name, case in cases().items():
        if args.case and name not in args.case:
            continue
        if case[0] in AGENT_GUIDES and not os.environ.get("OPENAI_API_KEY"):
            results.append({"case": name, "status": "skipped", "reason": "OPENAI_API_KEY is unset"})
            continue
        try:
            run_case(name, case, args, args.log_dir)
            result = {"case": name, "status": "passed"}
        except Exception as error:
            result = {"case": name, "status": "failed", "reason": str(error)}
        results.append(result)
        print(json.dumps(result), flush=True)
    (args.log_dir / "results.json").write_text(json.dumps(results, indent=2) + "\n")
    return int(any(result["status"] == "failed" for result in results))


if __name__ == "__main__":
    raise SystemExit(main())

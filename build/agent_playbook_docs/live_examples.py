"""Run displayed examples and downloads against a disposable local Playbooks stack.

Provision one playbook per case through the control plane and obtain scoped keys
from Identity Service. The stack must allow the selected embedding model.
MCP agent cases use a real model when OPENAI_API_KEY is set. Hosted MCP additionally
requires --hosted-url pointing to this stack through a public HTTPS endpoint.
"""

import argparse
import base64
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import time
from urllib.error import HTTPError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
from uuid import uuid4

from redis_agent_playbook import Playbook

from examples import GUIDES, downloads, scripts, skill_package, standalone_python

HERE = Path(__file__).resolve().parent


def request(method, url, token, body=None):
    data = None if body is None else json.dumps(body).encode()
    req = Request(url, data=data, method=method, headers={
        "Authorization": f"Bearer {token}", "Content-Type": "application/json",
    })
    with urlopen(req, timeout=60) as response:
        data = response.read()
    return json.loads(data) if data else None


def create_key(ids_url, control_token, playbook_id, actions):
    for attempt in range(10):
        try:
            result = request("POST", ids_url + "/v1/api-keys", control_token, {
                "name": "docs-validation-" + uuid4().hex[:12],
                "grants": [{"product": "playbook", "resourceType": "playbook",
                            "resourceId": playbook_id, "actions": actions}],
            })
            return result["token"]
        except HTTPError as error:
            if error.code not in (404, 409, 503) or attempt == 9:
                raise
            time.sleep(1)


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
    for path, source in downloads().items():
        if path.name != "prepare_skill.sh":
            result[f"{path.stem}_download{path.suffix}"] = (path.stem, path.suffix[1:], source)
    result["async_search.py"] = ("async_search", "py", standalone_python("quickstart", "Use Python asynchronously"))
    return result


def run_case(name, case, args, log_dir):
    guide, suffix, source = case
    created = request("POST", args.cp_url + "/v1/playbooks", args.admin_token, {
        "name": "docs-validation-" + uuid4().hex[:12],
        "embedding": {"provider": args.embedding_provider, "model": args.embedding_model,
                      "dimensions": args.embedding_dimensions},
    })
    playbook_id = created["playbookId"]
    author_key = reader_key = ""
    try:
        author_key = create_key(args.ids_url, args.control_token, playbook_id, ["read", "write", "publish", "propose"])
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
                if guide in ("retrieval", "limits", "async_search"):
                    env["PLAYBOOK_FAQ_ID"] = seed(client, directory, "faq")
                if guide in ("retrieval", "mcp"):
                    env["PLAYBOOK_SKILL_ID"] = seed(client, directory, "skill")
                if guide in ("retrieval", "limits", "async_search", "mcp"):
                    reader_key = create_key(args.ids_url, args.control_token, playbook_id, ["read"])
                    env["PLAYBOOK_API_KEY"] = reader_key
                if guide == "mcp" and suffix == "sh":
                    env["PLAYBOOK_URL"] = args.hosted_url.rstrip("/")
                # A file named mcp.py shadows the installed MCP package.
                path = directory / ("mcp_example.py" if name == "mcp.py" else name)
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
                if name.startswith("quickstart_download"):
                    entries = client.list_faqs().faqs
                    if not any(entry.latest_version == 2 and entry.publication.version == 2 for entry in entries if entry.publication):
                        raise RuntimeError("Quickstart download did not retain its updated publication")
                if name.startswith("skills_download"):
                    if not any(entry.publication for entry in client.list_skills().skills):
                        raise RuntimeError("Skill download did not retain a publication")
                if guide == "mcp" and ("Processing" not in completed.stdout or "load_skill" not in completed.stdout or "fetch_resource" not in completed.stdout):
                    raise RuntimeError("Agent did not load the skill/template and preserve the refund stage")
    finally:
        request("DELETE", args.cp_url + "/v1/playbooks/" + playbook_id, args.admin_token)


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
    parser.add_argument("--hosted-url", help="Public HTTPS base URL forwarding to the local data plane")
    parser.add_argument("--case", action="append", choices=cases())
    parser.add_argument("--log-dir", type=Path, required=True)
    args = parser.parse_args()
    if args.hosted_url and urlsplit(args.hosted_url).scheme != "https":
        parser.error("--hosted-url must use HTTPS")
    args.log_dir.mkdir(parents=True, exist_ok=True)
    results = []
    for name, case in cases().items():
        if args.case and name not in args.case:
            continue
        if name == "mcp.sh" and not args.hosted_url:
            results.append({"case": name, "status": "skipped", "reason": "--hosted-url is unset"})
            continue
        if case[0] == "mcp" and not os.environ.get("OPENAI_API_KEY"):
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

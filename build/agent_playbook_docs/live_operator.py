"""Validate the operator handoff using disposable resources on an explicit test stack.

Credentials come from PLAYBOOK_ADMIN_TOKEN, PLAYBOOK_IDS_CONTROL_TOKEN and,
for extraction, MEMORY_ADMIN_TOKEN. Never point this at a production deployment.
The extraction case requires an already configured worker and Agent Memory.
"""

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import time
from urllib.error import HTTPError
from uuid import uuid4

from redis_agent_memory import AgentMemory, AgentMemoryService
from redis_agent_playbook import AgentPlaybooksService, Playbook
from redis_agent_playbook.errors import PlaybookError

from live_examples import create_key, request


PLAYBOOKS = "/iris/v1/agent-playbooks/playbooks"


def expect_status(status, operation):
    try:
        operation()
    except (PlaybookError, HTTPError) as error:
        assert getattr(error, "status_code", getattr(error, "code", None)) == status
    else:
        raise AssertionError(f"Expected HTTP {status}")


def validate(args, record):
    admin = os.environ["PLAYBOOK_ADMIN_TOKEN"]
    identity = os.environ["PLAYBOOK_IDS_CONTROL_TOKEN"]
    key_ids = []
    playbook_id = store_id = binding_id = None
    control = AgentPlaybooksService(server_url=args.cp_url, token=admin, retry_config=None)
    memory_control = None
    clients = []
    try:
        created = control.create_playbook(
            name="docs-ga-operator-" + uuid4().hex[:12],
            embedding={"provider": args.embedding_provider, "model": args.embedding_model,
                       "dimensions": args.embedding_dimensions},
        )
        playbook_id = created.playbook_id
        assert control.get_playbook(playbook_id=playbook_id).state == "READY"
        record("provision-and-readiness")
        author_key = create_key(args.ids_url, identity, playbook_id,
                                ["write", "publish", "propose"], args.tenant_id, key_ids)
        reader_key = create_key(args.ids_url, identity, playbook_id, ["read"], args.tenant_id, key_ids)
        old_reader_id = key_ids[-1]
        writer_key = create_key(args.ids_url, identity, playbook_id, ["write"], args.tenant_id, key_ids)

        def connect(key):
            client = Playbook(server_url=args.dp_url, playbook_id=playbook_id,
                              api_key=key, retry_config=None)
            clients.append(client)
            return client

        author, reader, writer = (connect(key) for key in (author_key, reader_key, writer_key))
        assert reader.get_playbook_health().status == "READY"
        content = {"payload": {"faq": {"question": "Where is my refund?",
                    "answer": "Open the order in your order history and select Refund status."}}}
        draft = author.create_faq(content=content)
        entry_id = draft.entry.entry_id
        expect_status(403, lambda: reader.create_faq(content=content))
        expect_status(403, lambda: writer.publish_faq(faq_id=entry_id, version=1))
        author.publish_faq(faq_id=entry_id, version=1)
        result = reader.search_faqs(query="Where is my refund?", min_score=0)
        assert any(item.entry_id == entry_id and item.version == 1 for item in result.items)
        record("authoring-key-reader-key-and-publication-grants")

        stats = reader.get_playbook_stats()
        assert stats.faqs.total.available and stats.faqs.total.value == 1
        assert stats.skills.total.available and stats.skills.total.value == 0
        record("reader-inventory-counts")

        replacement = create_key(args.ids_url, identity, playbook_id, ["read"], args.tenant_id, key_ids)
        reader = connect(replacement)
        assert reader.get_playbook_health().status == "READY"
        request("DELETE", args.ids_url + "/v1/api-keys/" + old_reader_id, identity)
        # Revocation is separate from publication. Data-plane auth can be cached.
        assert author.get_faq(faq_id=entry_id).publication.version == 1
        record("replacement-key-and-revocation-with-publication-retained")

        control.update_playbook(playbook_id=playbook_id, state="SUSPENDED")
        expect_status(423, lambda: author.search_faqs(query="Where is my refund?"))
        control.update_playbook(playbook_id=playbook_id, state="READY")
        assert author.get_playbook_health().status == "READY"
        record("suspended-service-and-restored-readiness")

        if not args.memory_cp_url:
            record("memory-extraction", "skipped", "Agent Memory endpoints were not supplied")
            return
        memory_control = AgentMemoryService(server_url=args.memory_cp_url,
                                            token=os.environ["MEMORY_ADMIN_TOKEN"], retry_config=None)
        store = memory_control.create_store(name="docs-ga-source-" + uuid4().hex[:12],
                                            database={"database_id": "1"})
        store_id = store.store_id
        memory_key = request("POST", args.ids_url + "/v1/api-keys", identity, {
            "name": "docs-ga-memory-" + uuid4().hex[:12],
            "grants": [{"tenant": args.tenant_id, "product": "memory", "resourceType": "mem-store",
                        "resourceId": store_id, "actions": ["read", "write"]}],
        })
        key_ids.append(memory_key["keyId"])
        memory = AgentMemory(args.memory_dp_url, store_id=store_id, api_key=memory_key["token"], retry_config=None)
        clients.append(memory)
        conversation = memory.create_session(actor_id="docs-test-user", role="USER",
            created_at=datetime.now(timezone.utc), content=[{"text": "How do I reset my Copper Orchard account password?"}])
        memory.add_session_event(session_id=conversation.event.session_id, actor_id="docs-test-agent", role="ASSISTANT",
            created_at=datetime.now(timezone.utc), content=[{"text":
                "Open Copper Orchard account settings, select Security, then Reset password. "
                "Follow the reset link sent to your registered email. Never send your password to support."}])
        binding = control.create_extraction_binding(playbook_id=playbook_id,
            source={"kind": "REDIS_AGENT_MEMORY", "store_id": store_id},
            job={"kind": "FAQ", "idle_window_seconds": 60})
        binding_id = binding.binding_id
        assert binding.state == "READY" and not binding.enabled
        active = control.update_extraction_binding(playbook_id=playbook_id, binding_id=binding_id,
            expected_revision=binding.revision, enabled=True)
        assert active.enabled
        record("source-recording-and-extraction-activation")
        deadline = time.monotonic() + args.extraction_timeout
        proposals = []
        while time.monotonic() < deadline:
            proposals = author.list_proposals(view="INBOX").items
            if proposals:
                break
            time.sleep(5)
        assert proposals, "No proposal appeared before the extraction observation deadline"
        candidate = author.get_proposal(proposal_id=proposals[0].proposal_id)
        assert candidate.state == "OPEN" and candidate.source is not None
        assert reader.get_playbook_stats().faqs.total.value == 1
        assert all(item.entry_id == entry_id for item in author.search_faqs(query="Copper Orchard password reset", min_score=0).items)
        record("idle-conversation-becomes-an-unpublished-faq-proposal")
        current = control.get_extraction_binding(playbook_id=playbook_id, binding_id=binding_id)
        paused = control.update_extraction_binding(playbook_id=playbook_id, binding_id=binding_id,
            expected_revision=current.revision, enabled=False)
        assert not paused.enabled and paused.source.store_id == store_id
        record("pause-retains-source-and-settings")
    finally:
        failures = []
        if binding_id:
            try:
                control.delete_extraction_binding(playbook_id=playbook_id, binding_id=binding_id)
                deadline = time.monotonic() + 30
                while time.monotonic() < deadline:
                    try:
                        control.get_extraction_binding(playbook_id=playbook_id, binding_id=binding_id)
                    except Exception as error:
                        if getattr(error, "status_code", None) == 404:
                            break
                        raise
                    time.sleep(1)
            except Exception as error:
                failures.append(type(error).__name__)
        for key_id in key_ids:
            try:
                request("DELETE", args.ids_url + "/v1/api-keys/" + key_id, identity)
            except HTTPError as error:
                if error.code != 404:
                    failures.append("key-revocation")
            except Exception:
                failures.append("key-revocation")
        if playbook_id:
            try:
                control.delete_playbook(playbook_id=playbook_id)
            except Exception:
                failures.append("playbook-cleanup")
        if store_id:
            try:
                memory_control.delete_store(store_id=store_id)
            except Exception:
                failures.append("source-store-cleanup")
        for client in clients:
            client.__exit__(None, None, None)
        control.__exit__(None, None, None)
        if memory_control:
            memory_control.__exit__(None, None, None)
        record("cleanup", "failed" if failures else "passed", ", ".join(failures) or None)
        if failures:
            raise RuntimeError("Operator validation cleanup was incomplete")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("cp-url", "dp-url", "ids-url", "tenant-id"):
        parser.add_argument("--" + name, required=True)
    parser.add_argument("--memory-cp-url")
    parser.add_argument("--memory-dp-url")
    parser.add_argument("--embedding-provider", default="openai")
    parser.add_argument("--embedding-model", default="text-embedding-3-small")
    parser.add_argument("--embedding-dimensions", type=int, default=1536)
    parser.add_argument("--extraction-timeout", type=int, default=240)
    parser.add_argument("--log-dir", type=Path, required=True)
    args = parser.parse_args()
    if bool(args.memory_cp_url) != bool(args.memory_dp_url):
        parser.error("Supply both Agent Memory endpoints")
    results = []

    def record(case, status="passed", reason=None):
        result = {"case": case, "status": status}
        if reason:
            result["reason"] = reason
        results.append(result)
        print(json.dumps(result), flush=True)

    try:
        validate(args, record)
    except Exception as error:
        record("operator-journey", "failed", type(error).__name__ + ": " + str(error))
    args.log_dir.mkdir(parents=True, exist_ok=True)
    (args.log_dir / "results.json").write_text(json.dumps(results, indent=2) + "\n")
    return int(any(item["status"] == "failed" for item in results))


if __name__ == "__main__":
    raise SystemExit(main())

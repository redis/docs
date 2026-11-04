# EXAMPLE: iris_playbook_proposals
# HIDE_START
import os
from redis_agent_playbook import models
from redis_iris.agent_playbooks import AgentPlaybooks

playbook = AgentPlaybooks.from_env()
print(playbook.client.get_playbook_health())
# HIDE_END

# STEP_START playbook-proposal-inbox
cursor = None
while True:
    page = playbook.client.list_proposals(
        view="INBOX", sort_by="updatedAt", sort_order="DESC", limit=50, cursor=cursor
    )
    for item in page.items:
        print(item.proposal_id, item.state, item.evidence_count, item.action)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

# STEP_START playbook-proposal-search
related = playbook.client.search_proposals(
    query="Contact support about a missing refund",
    min_score=0.7,
    action_type="ADD",
    entry_kind="FAQ",
    limit=5,
)
for match in related.items:
    print(match.proposal.proposal_id, match.score, match.proposal.action)
# STEP_END

# STEP_START playbook-proposal-create
action = {
    "add": {
        "target": {"new_entry": {}},
        "candidate": {
            "content": {
                "intents": ["Contact support about a missing refund"],
                "attributes": {"locale": "en-US", "topic": "refund"},
                "payload": {
                    "faq": {
                        "question": "What should I send support about a missing refund?",
                        "answer": "Send your order number and the date you requested the refund.",
                    }
                },
            }
        },
    }
}
proposal = playbook.client.create_proposal(
    action=action,
    source={
        "kind": "document",
        "reference": {"documentId": "sample-refund-policy"},
    },
)
proposal_id = proposal.proposal_id
print(proposal_id, proposal.revision)
# STEP_END

# STEP_START playbook-proposal-evidence
from datetime import datetime, timezone
from uuid import uuid4

evidence_id = "evd_" + uuid4().hex
observed_at = datetime.now(timezone.utc)
evidence = playbook.client.submit_proposal_evidence(
    proposal_id=proposal_id,
    evidence_id=evidence_id,
    observed_at=observed_at,
    producer={"name": "docs-example", "prompt_version": "refund-review-v1"},
    source={
        "kind": "document",
        "reference": {"documentId": "sample-refund-policy"},
        "content": {
            "excerpt": (
                "For refund inquiries, collect the order number and request date. "
                "Do not request full card details."
            )
        },
    },
)
print(evidence.disposition)
# STEP_END

# STEP_START playbook-proposal-read
reviewed = playbook.client.get_proposal(proposal_id=proposal_id)
print(reviewed.model_dump_json(by_alias=True, indent=2))
# STEP_END

# STEP_START playbook-proposal-replace
revised_action = reviewed.action.model_dump(exclude_unset=True)
revised_action["add"]["candidate"]["content"]["payload"]["faq"]["answer"] += (
    " Do not send full card details."
)
revised = playbook.client.replace_proposal(
    proposal_id=proposal_id,
    action=revised_action,
    expected_revision=reviewed.revision,
)
print(revised.revision, revised.action)
# STEP_END

# STEP_START playbook-proposal-trash
playbook.client.dismiss_proposal(
    proposal_id=proposal_id,
    expected_revision=revised.revision,
)
playbook.client.restore_proposal(proposal_id=proposal_id)
# To purge a trashed proposal instead of restoring it:
# playbook.client.purge_proposal(proposal_id=proposal_id)
# STEP_END

# STEP_START playbook-proposal-final-review
final_review = playbook.client.get_proposal(proposal_id=proposal_id)
print(final_review.action, final_review.evidence)
# STEP_END

# STEP_START playbook-proposal-accept
from redis_agent_playbook import models

accepted = playbook.client.accept_proposal(
    proposal_id=proposal_id,
    expected_revision=final_review.revision,
)
if not isinstance(accepted.result, models.VersionCreated):
    raise ValueError("Review the unrecognized acceptance result before publishing")
receipt = accepted.result.version_created
accepted_version = playbook.client.get_faq_version(
    faq_id=receipt.entry_id,
    version=receipt.version,
)
print(receipt.entry_id, receipt.version, accepted_version.content)
# STEP_END

# STEP_START playbook-proposal-publish
playbook.client.publish_faq(faq_id=receipt.entry_id, version=receipt.version)
# STEP_END

# STEP_START playbook-proposal-history
cursor = None
while True:
    page = playbook.client.list_proposals(
        view="TRASH", sort_by="updatedAt", sort_order="DESC", limit=50, cursor=cursor
    )
    for item in page.items:
        print(item.proposal_id, item.state, item.evidence_count, item.action)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

# STEP_START playbook-proposal-skill-create
import base64
from pathlib import Path

skill_proposal = playbook.client.create_proposal(action={
    "add": {
        "target": {"new_entry": {}},
        "candidate": {"content": {
            "attributes": {"locale": "en-US", "topic": "refund"},
            "payload": {"skill_package": {
                "package_base64": base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii"),
            }},
        }},
    },
})
skill_proposal_id = skill_proposal.proposal_id
print(skill_proposal_id, skill_proposal.revision)
# STEP_END

# STEP_START playbook-proposal-skill-review
import hashlib

skill_review = playbook.client.get_proposal(proposal_id=skill_proposal_id)
candidate = skill_review.action.add.candidate.content.payload.skill
print(candidate.manifest, candidate.instructions)
resource = next(r for r in candidate.resources if r.path == "references/reply-template.md")
resource_response = playbook.client.get_proposal_resource(
    proposal_id=skill_proposal_id,
    resource_id=resource.resource_id,
    expected_revision=skill_review.revision,
)
try:
    template_bytes = resource_response.result.read()
finally:
    resource_response.result.close()
if "sha256:" + hashlib.sha256(template_bytes).hexdigest() != resource.digest:
    raise ValueError("Proposal resource digest does not match the reviewed descriptor")
print(template_bytes.decode("utf-8"))
# STEP_END

# STEP_START playbook-proposal-skill-accept
accepted_skill = playbook.client.accept_proposal(
    proposal_id=skill_proposal_id, expected_revision=skill_review.revision,
)
if not isinstance(accepted_skill.result, models.VersionCreated):
    raise ValueError("Review the unrecognized acceptance result before publishing")
skill_receipt = accepted_skill.result.version_created
if skill_receipt.entry_kind != "SKILL":
    raise ValueError("Expected a skill receipt")
skill_version = playbook.client.get_skill_version(
    skill_id=skill_receipt.entry_id, version=skill_receipt.version,
)
print(skill_receipt.entry_id, skill_receipt.version, skill_version.content)
# STEP_END

# STEP_START playbook-proposal-skill-publish
playbook.client.publish_skill(skill_id=skill_receipt.entry_id, version=skill_receipt.version)
# STEP_END

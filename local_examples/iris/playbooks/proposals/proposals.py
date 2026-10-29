# EXAMPLE: iris_playbook_proposals
# HIDE_START
import os
from redis_agent_playbook import models
from redis_iris.agent_playbooks import AgentPlaybooks, AgentPlaybooksSettings

playbook = AgentPlaybooks(
    AgentPlaybooksSettings(
        url=os.environ["PLAYBOOK_URL"],
        playbook_id=os.environ["PLAYBOOK_ID"],
        api_key=os.environ["PLAYBOOK_API_KEY"],
    )
)
print(playbook.client.get_playbook_health())
# HIDE_END

# STEP_START playbook-proposal-inbox
cursor = None
while True:
    page = playbook.client.list_proposals(
        view="inbox", sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor
    )
    if cursor is None:
        print("Total inbox proposals:", page.total if page.total is not None else "unknown")
    for item in page.proposals:
        print(item.proposal_id, item.status, item.evidence_count, item.action)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

# STEP_START playbook-proposal-search
related = playbook.client.search_proposals(
    query="Contact support about a missing refund",
    minimum_score=0.7,
    action_type="add",
    entry_type="faq",
    limit=5,
)
for match in related.matches:
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
        "type": "document",
        "reference": {"documentId": "sample-refund-policy"},
    },
)
proposal_id = proposal.proposal_id
print(proposal_id, proposal.proposal_revision)
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
        "type": "document",
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
    expected_proposal_revision=reviewed.proposal_revision,
)
print(revised.proposal_revision, revised.action)
# STEP_END

# STEP_START playbook-proposal-trash
playbook.client.dismiss_proposal(
    proposal_id=proposal_id,
    expected_proposal_revision=revised.proposal_revision,
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
    expected_proposal_revision=final_review.proposal_revision,
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
        view="trash", sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor
    )
    if cursor is None:
        print("Total trash proposals:", page.total if page.total is not None else "unknown")
    for item in page.proposals:
        print(item.proposal_id, item.status, item.evidence_count, item.action)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

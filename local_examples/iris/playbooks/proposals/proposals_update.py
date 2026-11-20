# EXAMPLE: iris_playbook_proposals_update
# STEP_START playbook-update-submit
from hashlib import sha256
import os
from pathlib import Path

from redis_agent_playbook import Playbook, models

playbook = Playbook(
    server_url=os.environ["IRIS_AGENT_PLAYBOOKS_URL"],
    playbook_id=os.environ["IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID"],
    api_key=os.environ["IRIS_AGENT_PLAYBOOKS_API_KEY"],
)
entry_id = os.environ["PLAYBOOK_ENTRY_ID"]
basis = int(os.environ["PLAYBOOK_BASED_ON_VERSION"])


def action_for(filename):
    content = models.ProposalInputContent.model_validate_json(Path(filename).read_bytes())
    return {
        "update": {
            "target": {"existing_entry": {"entry_id": entry_id, "based_on_version": basis}},
            "candidate": {"content": content},
        }
    }


proposal = playbook.create_proposal(action=action_for("proposal-content.json"))
print(proposal.proposal_id, proposal.revision)
# STEP_END

# STEP_START playbook-update-review
reviewed = playbook.get_proposal(proposal_id=proposal.proposal_id)
print(reviewed.action)
revised = playbook.replace_proposal(
    proposal_id=reviewed.proposal_id,
    expected_revision=reviewed.revision,
    action=action_for("proposal-content-reviewed.json"),
)
print(revised.action, revised.revision)
if not isinstance(revised.action, models.ProposalActionUpdate):
    raise ValueError("Expected an UPDATE proposal")
payload = revised.action.update.candidate.content.payload
if isinstance(payload, models.ProposalPayloadSkill):
    resource = next(r for r in payload.skill.resources if r.path == "references/reply-template.md")
    response = playbook.get_proposal_resource(
        proposal_id=revised.proposal_id, resource_id=resource.resource_id,
        expected_revision=revised.revision,
    )
    try:
        contents = response.result.read()
    finally:
        response.result.close()
    if "sha256:" + sha256(contents).hexdigest() != resource.digest:
        raise ValueError("Proposal file digest mismatch")
    print(contents.decode("utf-8"))
# STEP_END

# STEP_START playbook-update-accept
accepted = playbook.accept_proposal(
    proposal_id=revised.proposal_id, expected_revision=revised.revision,
)
if not isinstance(accepted.result, models.VersionCreated):
    raise ValueError("Expected an acceptance receipt for a version")
receipt = accepted.result.version_created
if receipt.entry_kind == "FAQ":
    version = playbook.get_faq_version(faq_id=receipt.entry_id, version=receipt.version)
elif receipt.entry_kind == "SKILL":
    version = playbook.get_skill_version(skill_id=receipt.entry_id, version=receipt.version)
else:
    raise ValueError(f"Unknown entry kind: {receipt.entry_kind}")
print(receipt.entry_id, receipt.version, version.content)
# STEP_END

# STEP_START playbook-update-publish
if receipt.entry_kind == "FAQ":
    playbook.publish_faq(faq_id=receipt.entry_id, version=receipt.version)
else:
    playbook.publish_skill(skill_id=receipt.entry_id, version=receipt.version)
# STEP_END

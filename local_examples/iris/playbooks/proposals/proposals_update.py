# EXAMPLE: iris_playbook_proposals_update
# STEP_START playbook-update-submit
from base64 import b64decode
import os
from pathlib import Path

from redis_iris import Iris
from redis_iris.agent_playbooks import models

playbook = Iris.from_env().agent_playbooks()
entry_id = os.environ["PLAYBOOK_ENTRY_ID"]
basis = int(os.environ["PLAYBOOK_BASED_ON_VERSION"])
content = models.ProposalInputContent.model_validate_json(Path("proposal-content.json").read_bytes())
options = {
    "entry_id": entry_id,
    "based_on_version": basis,
    "intents": content.intents or (),
    "attributes": content.attributes,
    "metadata": content.metadata,
}
payload = content.payload
if isinstance(payload, models.ProposalInputPayloadFaq):
    proposal = playbook.propose_faq(
        question=payload.faq.question, answer=payload.faq.answer, **options,
    )
else:
    proposal = playbook.propose_skill(
        package=b64decode(payload.skill_package.package_base64, validate=True), **options,
    )
print(proposal.proposal_id, proposal.revision)
# STEP_END

# STEP_START playbook-update-review
from hashlib import sha256

client = playbook.client
reviewed = client.get_proposal(proposal_id=proposal.proposal_id)
print(reviewed.action)
revised_content = models.ProposalInputContent.model_validate_json(
    Path("proposal-content-reviewed.json").read_bytes()
)
revised = client.replace_proposal(
    proposal_id=reviewed.proposal_id,
    expected_revision=reviewed.revision,
    action={
        "update": {
            "target": {"existing_entry": {"entry_id": entry_id, "based_on_version": basis}},
            "candidate": {"content": revised_content},
        }
    },
)
print(revised.action, revised.revision)
if not isinstance(revised.action, models.ProposalActionUpdate):
    raise ValueError("Expected an UPDATE proposal")
payload = revised.action.update.candidate.content.payload
if isinstance(payload, models.ProposalPayloadSkill):
    resource = next(r for r in payload.skill.resources if r.path == "references/reply-template.md")
    response = client.get_proposal_resource(
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
accepted = client.accept_proposal(
    proposal_id=revised.proposal_id, expected_revision=revised.revision,
)
if not isinstance(accepted.result, models.VersionCreated):
    raise ValueError("Expected an acceptance receipt for a version")
receipt = accepted.result.version_created
if receipt.entry_kind == "FAQ":
    version = client.get_faq_version(faq_id=receipt.entry_id, version=receipt.version)
elif receipt.entry_kind == "SKILL":
    version = client.get_skill_version(skill_id=receipt.entry_id, version=receipt.version)
else:
    raise ValueError(f"Unknown entry kind: {receipt.entry_kind}")
print(receipt.entry_id, receipt.version, version.content)
# STEP_END

# STEP_START playbook-update-publish
if receipt.entry_kind == "FAQ":
    client.publish_faq(faq_id=receipt.entry_id, version=receipt.version)
else:
    client.publish_skill(skill_id=receipt.entry_id, version=receipt.version)
# STEP_END

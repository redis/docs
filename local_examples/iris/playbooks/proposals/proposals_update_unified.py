# EXAMPLE: iris_playbook_proposals_update_unified
# STEP_START playbook-update-unified-submit
import os
from pathlib import Path

from redis_iris import Iris

playbook = Iris.from_env().agent_playbooks()
entry_id = os.environ["PLAYBOOK_ENTRY_ID"]
basis = int(os.environ["PLAYBOOK_BASED_ON_VERSION"])
entry_type = os.environ["PLAYBOOK_ENTRY_TYPE"]

if entry_type == "faq":
    proposal = playbook.propose_faq(
        entry_id=entry_id,
        based_on_version=basis,
        question="What should I send support about a missing refund?",
        answer="Send your order number and the date you requested the refund.",
        intents=["Check when to contact support about a refund"],
        attributes={"topic": "refund"},
    )
elif entry_type == "skill":
    proposal = playbook.propose_skill(
        entry_id=entry_id,
        based_on_version=basis,
        package=Path("refund-support-reply.zip").read_bytes(),
        attributes={"topic": "refund"},
    )
else:
    raise ValueError("Set PLAYBOOK_ENTRY_TYPE to faq or skill")

print(proposal.proposal_id, proposal.revision)
# STEP_END

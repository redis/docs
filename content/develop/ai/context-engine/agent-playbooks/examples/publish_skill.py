"""Build a small Skill archive, create an entry, and publish its first version."""

import base64
import io
import os
from uuid import uuid4
from zipfile import ZIP_DEFLATED, ZipFile

from redis_agent_playbook import Playbook


SKILL_MD = """---
name: refund-status
description: Explain how a customer can find the status of an existing refund.
---

# Check refund status

Use this skill when a customer asks about a refund they already requested.

1. Explain that the customer can check the refund in their order history.
2. Read references/reply-template.md when you need an example reply.
3. If the customer cannot find the refund, suggest contacting support.

Do not claim that a refund has been issued or give a bank posting date.
"""

REPLY_TEMPLATE = """You can check your refund status in your order history.
If the refund is missing, contact support with your order reference.
"""


def package_skill():
    buffer = io.BytesIO()
    with ZipFile(buffer, "w", compression=ZIP_DEFLATED) as archive:
        archive.writestr("refund-status/SKILL.md", SKILL_MD)
        archive.writestr("refund-status/references/reply-template.md", REPLY_TEMPLATE)
    return base64.b64encode(buffer.getvalue()).decode("ascii")


def run(playbook):
    created = playbook.create_skill(
        entry_key=f"refund-status-skill-{uuid4().hex}",
        package_base64=package_skill(),
        content={
            "intents": ["Where is my refund?", "Check an existing refund"],
            "attributes": {"locale": "en-US", "topic": "refund"},
        },
    )
    skill_id = created.entry.entry_id
    print(f"Created Skill: {skill_id}")
    playbook.publish_skill(skill_id=skill_id, version=created.version.version)
    print(f"Published version: {created.version.version}")
    print(f"export PLAYBOOK_SKILL_ID='{skill_id}'")
    print("This example leaves the Skill published for the MCP walkthrough.")
    return skill_id


if __name__ == "__main__":
    with Playbook(
        os.environ["PLAYBOOK_URL"],
        playbook_id=os.environ["PLAYBOOK_ID"],
        api_key=os.environ["PLAYBOOK_API_KEY"],
        retry_config=None,
        timeout_ms=10000,
    ) as client:
        run(client)

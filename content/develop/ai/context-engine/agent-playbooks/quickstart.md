---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Package and publish a skill that explains how to check a refund.
hideListLinks: true
linktitle: Publish your first skill
title: Publish your first skill
weight: 10
---

Publish a skill that explains how a customer can check a refund. It includes instructions and a reply template, and stays published for the [agent connection walkthrough]({{< relref "/develop/ai/context-engine/agent-playbooks/connect-agent" >}}).

## Before you begin

[Deploy with Helm]({{< relref "/operate/iris/agent-playbooks" >}}) and [create a playbook and keys]({{< relref "/operate/iris/agent-playbooks/authentication" >}}), or get these values from your administrator:

- The data-plane base URL: the endpoint that serves application requests.
- The ID of a playbook in the `ready` state.
- An application programming interface (API) key with `write` and `publish` permissions for that playbook.

You also need Python 3.10 or later. Use a development playbook for the examples.

## Install the client

1. Create a virtual environment:

   ```sh
   python3 -m venv .venv
   ```

1. Activate it on macOS or Linux:

   ```sh
   . .venv/bin/activate
   ```

1. Install the Python software development kit (SDK):

   ```sh
   python -m pip install 'redis-agent-playbook==0.1.0a2'
   ```

1. Keep the connection values from the access setup. If an administrator supplied them instead, set them now:

   ```sh
   export PLAYBOOK_URL='<your-data-plane-base-url>'
   export PLAYBOOK_ID='<your-playbook-id>'
   export PLAYBOOK_API_KEY='<your-author-and-publisher-key>'
   ```

Use a base URL such as `http://127.0.0.1:9201` for the Helm guide's local port-forward, or your HTTPS endpoint for remote access. Do not append `/v1/playbooks`.

## Package and publish the skill

The script creates this ZIP archive in memory:

```text
refund-status/
  SKILL.md
  references/
    reply-template.md
```

`SKILL.md` contains the skill's name, description, and instructions. The root directory matches the name in its frontmatter. The service reads the archive and stores its files; it does not execute them.


Save the following as `publish_skill.py`, or [download the script]({{< relref "/develop/ai/context-engine/agent-playbooks/examples/" >}}publish_skill.py).

```python
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
```

Run the script:

```sh
python publish_skill.py
```

It prints the entry ID, published version, and an `export PLAYBOOK_SKILL_ID=...` command. Run that export in the same shell. Each run creates a new entry; keep its ID so you can remove it later.

Creation produces an unpublished version. `publish_skill` makes that exact version available to agents. If publication fails, the printed entry ID identifies the draft to inspect or delete.

## Retrieve the published skill

Continue with [Connect an agent]({{< relref "/develop/ai/context-engine/agent-playbooks/connect-agent" >}}) to discover the skill, load its instructions, and fetch the reply template. After that walkthrough, [delete the sample entry]({{< relref "/develop/ai/context-engine/agent-playbooks/publish-knowledge#delete-the-example" >}}).

For authentication or service errors, use the [error reference]({{< relref "/develop/ai/context-engine/agent-playbooks/reference#handle-errors" >}}).

---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Add answers, update skill versions, and control what agents can retrieve.
hideListLinks: true
linktitle: Manage knowledge
title: Manage published knowledge
weight: 30
---

Create and review content before publishing it. Versions share an entry ID. Publishing selects the version agents retrieve.

Use the client setup from [Publish your first skill]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}). Creating, appending, and deleting require `write`; publishing and withdrawing require `publish`.

## Update a skill

Edit the instructions or reference text in the downloaded `publish_skill.py`. Keep that file in the same directory, set `PLAYBOOK_SKILL_ID` to your existing entry's ID, and save this as `append_skill.py`:

```python
import os
from redis_agent_playbook import Playbook
from publish_skill import package_skill

with Playbook(
    os.environ["PLAYBOOK_URL"],
    playbook_id=os.environ["PLAYBOOK_ID"],
    api_key=os.environ["PLAYBOOK_API_KEY"],
    retry_config=None,
    timeout_ms=10000,
) as client:
    appended = client.append_skill_version(
        skill_id=os.environ["PLAYBOOK_SKILL_ID"],
        package_base64=package_skill(),
        content={
            "intents": ["Check an existing refund"],
            "attributes": {"locale": "en-US", "topic": "refund"},
        },
    )
    print("Unpublished version:", appended.version.version)
```

Run `python append_skill.py` to update the existing entry. Rerunning `publish_skill.py` creates another entry. Appending supplies a complete version; the previous publication stays available until you publish another version.

## Publish a reviewed version

Set the version you reviewed, then send the publication request with your publisher key:

```sh
export PLAYBOOK_SKILL_VERSION='<reviewed-version-number>'
curl --fail-with-body --silent --show-error \
  --request PUT \
  --header "Authorization: Bearer $PLAYBOOK_API_KEY" \
  --header 'Content-Type: application/json' \
  --data "{\"version\": $PLAYBOOK_SKILL_VERSION}" \
  "$PLAYBOOK_URL/v1/playbooks/$PLAYBOOK_ID/skills/$PLAYBOOK_SKILL_ID/publication"
```

The response identifies the current publication. Publish an earlier version to roll back. Publication is last-write-wins, so coordinate concurrent publishers. An agent with an older discovery result may need to discover again after a publication change.

## Withdraw an entry

Withdraw a skill to stop serving it while retaining its versions:

```sh
curl --fail-with-body --silent --show-error \
  --request DELETE \
  --header "Authorization: Bearer $PLAYBOOK_API_KEY" \
  "$PLAYBOOK_URL/v1/playbooks/$PLAYBOOK_ID/skills/$PLAYBOOK_SKILL_ID/publication"
```

For an FAQ, use the corresponding `/faqs/{faqId}/publication` endpoint.

## Delete the example

After the agent walkthrough, delete the sample skill with your author key:

```sh
curl --fail-with-body --silent --show-error \
  --request DELETE \
  --header "Authorization: Bearer $PLAYBOOK_API_KEY" \
  "$PLAYBOOK_URL/v1/playbooks/$PLAYBOOK_ID/skills/$PLAYBOOK_SKILL_ID"
```

A successful deletion returns `204` with no body. It permanently removes that entry and its versions.

## Add an answer

Use a frequently asked question (FAQ) entry for a question with an approved answer. Set `content.payload.faq.question` and `answer`, then publish the returned version.

Save this as `faq_example.py`, or [download it]({{< relref "/develop/ai/context-engine/agent-playbooks/examples/" >}}faq_example.py). It uses the same environment variables and Python client as the skill quickstart.

```python
"""Create, publish, search, and remove one FAQ in an existing Playbook."""

import os
import time
from uuid import uuid4

from redis_agent_playbook import Playbook


def run(playbook):
    run_id = uuid4().hex
    question = "How can I check the status of my refund?"
    answer = "Check the refund status in your order history."
    scope = {"eq": {"name": "exampleRun", "value": run_id}}
    created = playbook.create_faq(
        entry_key=f"refund-status-{run_id}",
        content={
            "intents": [question, "Where is my refund?"],
            "attributes": {"exampleRun": run_id, "locale": "en-US"},
            "payload": {"faq": {"question": question, "answer": answer}},
        },
    )
    faq_id = created.entry.entry_id
    print(f"Created FAQ: {faq_id}")

    try:
        assert created.entry.publication is None
        before = playbook.search_faqs(
            query=question, filter_=scope, minimum_score=0.0, limit=1,
        )
        assert not before.matches, "An unpublished FAQ must not be searchable."
        print("Before publication: no matches")

        playbook.publish_faq(faq_id=faq_id, version=created.version.version)
        deadline = time.monotonic() + 30
        while True:
            result = playbook.search_faqs(
                query=question, filter_=scope, minimum_score=0.0, limit=1,
            )
            if result.matches:
                match = result.matches[0]
                assert match.entry_id == faq_id
                assert match.version == created.version.version
                assert match.faq is not None and match.faq.answer == answer
                print(f"After publication: {match.faq.answer}")
                break
            if time.monotonic() >= deadline:
                raise TimeoutError("Published FAQ was not searchable within 30 seconds.")
            time.sleep(1)
    finally:
        # Delete only the entry this invocation created, including its versions.
        playbook.delete_faq(faq_id=faq_id)
        print(f"Deleted example FAQ: {faq_id}")


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

Run `python faq_example.py`. It verifies that the entry is absent from search before publication, retrieves the published answer, and deletes only the entry it created. Its unique attribute filter isolates the example from other entries. The zero score threshold tests publication behavior; choose production thresholds with [retrieval evaluation]({{< relref "/develop/ai/context-engine/agent-playbooks/discovery" >}}).

## Collect suggestions

The [proposal API]({{< relref "/develop/ai/context-engine/agent-playbooks/reference/rest-api" >}}) accepts suggestions for new FAQs. A caller with `propose` can submit a candidate and evidence; a reviewer with `write` can accept a reviewed revision. Acceptance creates an unpublished FAQ. Publishing it still requires `publish`.

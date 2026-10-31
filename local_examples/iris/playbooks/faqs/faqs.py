# EXAMPLE: iris_playbook_faqs
# HIDE_START
import os

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

# STEP_START playbook-faq-create
faq_content = {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {
        "faq": {
            "question": "How do I check the status of a refund?",
            "answer": (
                "Open the order in your order history and select Refund status. "
                "If no refund is listed, contact support with your order number."
            ),
        }
    },
}

draft = playbook.client.create_faq(content=faq_content, entry_key="refund-status")
faq_id = draft.entry.entry_id
version = draft.version.version
print(faq_id, version, draft.entry.publication)
# STEP_END

# STEP_START playbook-faq-publish
stored = playbook.client.get_faq_version(faq_id=faq_id, version=version)
print(stored.content)
# STEP_END

# STEP_START playbook-faq-publication
playbook.client.publish_faq(faq_id=faq_id, version=version)
# STEP_END

# STEP_START playbook-faq-search
results = playbook.client.search_faqs(
    query="Where can I see how my refund is progressing?",
    filter_={"eq": {"name": "locale", "value": "en-US"}},
    limit=5,
)
for match in results.items:
    if match.faq is not None:
        print(match.entry_id, match.version, match.score, match.faq.answer)
# STEP_END

# STEP_START playbook-faq-update
from copy import deepcopy

updated_content = deepcopy(faq_content)
updated_content["payload"]["faq"]["answer"] += (
    " Support can check the current stage but cannot guarantee a bank posting date."
)
updated = playbook.client.append_faq_version(faq_id=faq_id, content=updated_content)
print("Review this version:", updated.version.version, updated.version.content)
# STEP_END

# STEP_START playbook-faq-republish
playbook.client.publish_faq(faq_id=faq_id, version=updated.version.version)
# STEP_END

# STEP_START playbook-faq-rollback
playbook.client.publish_faq(faq_id=faq_id, version=version)
# STEP_END

# STEP_START playbook-faq-list
cursor = None
while True:
    page = playbook.client.list_faqs(sort_by="updatedAt", sort_order="DESC", limit=50, cursor=cursor)
    for entry in page.items:
        print(entry.entry_id, entry.latest_version, entry.publication)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

# STEP_START playbook-faq-history
cursor = None
while True:
    page = playbook.client.list_faq_versions(faq_id=faq_id, limit=50, cursor=cursor)
    for item in page.items:
        print(item.version, item.content_digest, item.content)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

# STEP_START playbook-faq-lookup
from redis_agent_playbook.models import Found

lookup = playbook.client.lookup_entries(
    references=[
        {"entry_id": faq_id},
        {"entry_key": "refund-status"},
    ]
)
print("Version limit:", lookup.max_versions)
for result in lookup.items:
    if isinstance(result, Found):
        state = result.found.entry
        print(state.entry_id, state.version_count, state.latest, state.publication)
    else:
        print("Missing:", result.missing.reference)
# STEP_END

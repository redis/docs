# EXAMPLE: iris_playbook_quickstart
# STEP_START playbook-connect
import os
from redis_agent_playbook import Playbook

playbook = Playbook(
    os.environ["PLAYBOOK_URL"],
    playbook_id=os.environ["PLAYBOOK_ID"],
    api_key=os.environ["PLAYBOOK_API_KEY"],
    retry_config=None,
)
print(playbook.get_playbook_health())
# STEP_END

# STEP_START playbook-quickstart-create
faq_content = {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {
        "faq": {
            "question": "How do I check the status of a refund?",
            "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
        }
    },
}
draft = playbook.create_faq(content=faq_content)
faq_id = draft.entry.entry_id
version = draft.version.version
print(faq_id, version, draft.entry.publication)
# STEP_END

# STEP_START playbook-quickstart-publish
stored = playbook.get_faq_version(faq_id=faq_id, version=version)
print(stored.content)
# STEP_END

# STEP_START playbook-quickstart-publication
playbook.publish_faq(faq_id=faq_id, version=version)
# STEP_END

# STEP_START playbook-quickstart-search
results = playbook.search_faqs(
    query="Where can I see how my refund is progressing?",
    filter_={"eq": {"name": "locale", "value": "en-US"}},
    limit=5,
)
for match in results.matches:
    if match.faq is not None:
        print(match.entry_id, match.version, match.score, match.faq.answer)
# STEP_END

# STEP_START playbook-quickstart-discover
discovery = playbook.discover_entries(
    query="Help a customer find their refund status",
    filter_={"eq": {"name": "topic", "value": "refund"}},
)
print(discovery.model_dump_json(by_alias=True, indent=2))
# STEP_END

# STEP_START playbook-quickstart-update
from copy import deepcopy

updated_content = deepcopy(faq_content)
updated_content["payload"]["faq"]["answer"] += (
    " Support can check the current stage but cannot guarantee a bank posting date."
)
updated = playbook.append_faq_version(faq_id=faq_id, content=updated_content)
print("Review this version:", updated.version.version, updated.version.content)
# STEP_END

# STEP_START playbook-quickstart-republish
playbook.publish_faq(faq_id=faq_id, version=updated.version.version)
updated_results = playbook.search_faqs(
    query="Where can I see how my refund is progressing?",
    filter_={"eq": {"name": "locale", "value": "en-US"}},
    limit=5,
)
for match in updated_results.matches:
    if match.entry_id == faq_id and match.faq is not None:
        print("Published answer:", match.version, match.faq.answer)
# STEP_END

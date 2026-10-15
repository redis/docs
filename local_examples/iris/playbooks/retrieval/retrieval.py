# EXAMPLE: iris_playbook_retrieval
# HIDE_START
import os
from redis_agent_playbook import Playbook

playbook = Playbook(
    os.environ["PLAYBOOK_URL"],
    playbook_id=os.environ["PLAYBOOK_ID"],
    api_key=os.environ["PLAYBOOK_API_KEY"],
    retry_config=None,
)
print(playbook.get_playbook_health())
# HIDE_END

# STEP_START playbook-retrieval-discover
discovery = playbook.discover_entries(
    query="Draft a reply for a customer whose refund shows Processing", limit=5
)
print(discovery.model_dump_json(by_alias=True, indent=2))
# STEP_END

# STEP_START playbook-retrieval-pin
skill_id = os.environ["PLAYBOOK_SKILL_ID"]
pinned = playbook.discover_entries(
    query="Draft a reply for a customer whose refund shows Processing",
    pinned_entries=[{"entry_id": skill_id}],
)
selected_preview = pinned.pinned_entries[0]
print(selected_preview.entry_id, selected_preview.version)
# STEP_END

# STEP_START playbook-retrieval-budget
print("Result limit reached:", pinned.truncated)
print("Preview budget reached:", pinned.budget_truncated or False)
# STEP_END

# STEP_START playbook-retrieval-load
selected = playbook.get_skill_version(
    skill_id=selected_preview.entry_id, version=selected_preview.version
)
skill = selected.content.payload.skill
if skill is None:
    raise ValueError("Expected a skill")
print(skill.instructions)
resource = next((r for r in skill.resources if r.path == "references/reply-template.md"), None)
if resource is None:
    raise ValueError("Reply template is missing")
response = playbook.get_skill_resource(
    skill_id=selected.entry_id,
    version=selected.version,
    resource_id=resource.resource_id,
)
try:
    print(response.result.read().decode("utf-8"))
finally:
    response.result.close()
# STEP_END

# STEP_START playbook-retrieval-search
faq_results = playbook.search_faqs(query="Where is my refund?", limit=5)
skill_results = playbook.search_skills(query="Draft a reply about a reported refund stage", limit=5)
print(faq_results.model_dump_json(by_alias=True, indent=2))
print(skill_results.model_dump_json(by_alias=True, indent=2))
# STEP_END

# STEP_START playbook-retrieval-threshold
tuned = playbook.search_faqs(query="Where is my refund?", minimum_score=0.75, limit=3)
print(tuned.matches)
# STEP_END

# STEP_START playbook-retrieval-filter
filtered = playbook.search_faqs(
    query="Where is my refund?",
    filter_={
        "and_": [
            {"eq": {"name": "locale", "value": "en-US"}},
            {"eq": {"name": "topic", "value": "refund"}},
        ]
    },
)
print(filtered.model_dump_json(by_alias=True, indent=2))
# STEP_END

# EXAMPLE: iris_playbook_skills
# HIDE_START
import os

from redis_iris.agent_playbook import AgentPlaybook, AgentPlaybookSettings

playbook = AgentPlaybook(
    AgentPlaybookSettings(
        url=os.environ["PLAYBOOK_URL"],
        playbook_id=os.environ["PLAYBOOK_ID"],
        api_key=os.environ["PLAYBOOK_API_KEY"],
    )
)
print(playbook.client.get_playbook_health())
# HIDE_END

# STEP_START playbook-skill-create
import base64
from pathlib import Path

package_base64 = base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii")
skill_context = {
    "intents": ["Draft a refund support reply", "Choose a refund reply template"],
    "attributes": {"locale": "en-US", "topic": "refund"},
}
skill_draft = playbook.client.create_skill(package_base64=package_base64, content=skill_context)
skill_id = skill_draft.entry.entry_id
skill_version = skill_draft.version.version
print(skill_id, skill_version)
# STEP_END

# STEP_START playbook-skill-review
stored_skill = playbook.client.get_skill_version(skill_id=skill_id, version=skill_version)
print(stored_skill.content)
# STEP_END

# STEP_START playbook-skill-publish
playbook.client.publish_skill(skill_id=skill_id, version=skill_version)
# STEP_END

# STEP_START playbook-skill-append
from copy import deepcopy

updated_context = deepcopy(skill_context)
updated_context["attributes"]["channel"] = "chat"
replacement = base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii")
skill_update = playbook.client.append_skill_version(
    skill_id=skill_id,
    package_base64=replacement,
    content=updated_context,
)
print("Review before publishing:", skill_update.version)
# STEP_END

# STEP_START playbook-skill-load
skill = playbook.skill(skill_id, version=skill_version)
print(skill.instructions)
resource = next((r for r in skill.resources if r.path == "references/reply-template.md"), None)
if resource is None:
    raise ValueError("Reply template is missing")
response = playbook.skill_resource(
    skill_id, resource.resource_id, version=skill_version
)
print(response.text)
# STEP_END

# STEP_START playbook-skill-list
cursor = None
while True:
    page = playbook.client.list_skills(sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor)
    if cursor is None:
        print("Total skills:", page.total if page.total is not None else "unknown")
    for entry in page.skills:
        print(entry.entry_id, entry.latest_version, entry.publication)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

# STEP_START playbook-skill-state
entry = playbook.client.get_skill(skill_id=skill_id)
print(entry.latest_version, entry.publication)
# STEP_END

# STEP_START playbook-skill-history
cursor = None
while True:
    page = playbook.client.list_skill_versions(skill_id=skill_id, limit=50, cursor=cursor)
    for item in page.versions:
        print(item.version, item.content_digest, item.content)
    cursor = page.next_cursor
    if cursor is None:
        break
# STEP_END

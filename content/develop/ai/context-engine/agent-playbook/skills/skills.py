# Generated from skills.md; edit the page, then run examples.py --refresh-downloads.
import os
from redis_agent_playbook import Playbook

playbook = Playbook(
    os.environ["PLAYBOOK_URL"],
    playbook_id=os.environ["PLAYBOOK_ID"],
    api_key=os.environ["PLAYBOOK_API_KEY"],
    retry_config=None,
)
print(playbook.get_playbook_health())

import base64
from pathlib import Path

package_base64 = base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii")
skill_context = {
    "intents": ["Draft a refund support reply", "Choose a refund reply template"],
    "attributes": {"locale": "en-US", "topic": "refund"},
}
skill_draft = playbook.create_skill(package_base64=package_base64, content=skill_context)
skill_id = skill_draft.entry.entry_id
skill_version = skill_draft.version.version
print(skill_id, skill_version)

stored_skill = playbook.get_skill_version(skill_id=skill_id, version=skill_version)
print(stored_skill.content)

playbook.publish_skill(skill_id=skill_id, version=skill_version)

from copy import deepcopy

updated_context = deepcopy(skill_context)
updated_context["attributes"]["channel"] = "chat"
replacement = base64.b64encode(Path("refund-support-reply.zip").read_bytes()).decode("ascii")
skill_update = playbook.append_skill_version(
    skill_id=skill_id, package_base64=replacement, content=updated_context,
)
print("Review before publishing:", skill_update.version)

selected = playbook.get_skill_version(skill_id=skill_id, version=skill_version)
skill = selected.content.payload.skill
if skill is None:
    raise ValueError("Expected a skill")
print(skill.instructions)
resource = next((r for r in skill.resources if r.path == "references/reply-template.md"), None)
if resource is None:
    raise ValueError("Reply template is missing")
response = playbook.get_skill_resource(
    skill_id=selected.entry_id, version=selected.version, resource_id=resource.resource_id,
)
try:
    print(response.result.read().decode("utf-8"))
finally:
    response.result.close()

cursor = None
while True:
    page = playbook.list_skills(sort_by="updatedAt", sort_order="desc", limit=50, cursor=cursor)
    if cursor is None:
        print("Total skills:", page.total if page.total is not None else "unknown")
    for entry in page.skills:
        print(entry.entry_id, entry.latest_version, entry.publication)
    cursor = page.next_cursor
    if cursor is None:
        break

entry = playbook.get_skill(skill_id=skill_id)
print(entry.latest_version, entry.publication)

cursor = None
while True:
    page = playbook.list_skill_versions(skill_id=skill_id, limit=50, cursor=cursor)
    for item in page.versions:
        print(item.version, item.content_digest, item.content)
    cursor = page.next_cursor
    if cursor is None:
        break

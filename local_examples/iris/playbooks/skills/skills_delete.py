# EXAMPLE: iris_playbook_skills_delete
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
skill_id = os.environ["PLAYBOOK_SKILL_ID"]
# HIDE_END

# STEP_START playbook-skill-delete
playbook.delete_skill(skill_id=skill_id)
# STEP_END

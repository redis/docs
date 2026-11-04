# EXAMPLE: iris_playbook_skills_delete
# HIDE_START
import os

from redis_iris.agent_playbooks import AgentPlaybooks

playbook = AgentPlaybooks.from_env()
print(playbook.client.get_playbook_health())
skill_id = os.environ["PLAYBOOK_SKILL_ID"]
# HIDE_END

# STEP_START playbook-skill-delete
playbook.client.delete_skill(skill_id=skill_id)
# STEP_END

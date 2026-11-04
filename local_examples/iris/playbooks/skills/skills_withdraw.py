# EXAMPLE: iris_playbook_skills_withdraw
# HIDE_START
import os

from redis_iris import Iris

playbook = Iris.from_env().agent_playbooks()
print(playbook.client.get_playbook_health())
skill_id = os.environ["PLAYBOOK_SKILL_ID"]
# HIDE_END

# STEP_START playbook-skill-withdraw
playbook.client.withdraw_skill(skill_id=skill_id)
# STEP_END

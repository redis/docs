# EXAMPLE: iris_playbook_skills_withdraw
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
skill_id = os.environ["PLAYBOOK_SKILL_ID"]
# HIDE_END

# STEP_START playbook-skill-withdraw
playbook.client.withdraw_skill(skill_id=skill_id)
# STEP_END

# EXAMPLE: iris_playbook_quickstart_delete
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
faq_id = os.environ["PLAYBOOK_FAQ_ID"]
# HIDE_END

# STEP_START playbook-quickstart-delete
playbook.client.delete_faq(faq_id=faq_id)
# STEP_END

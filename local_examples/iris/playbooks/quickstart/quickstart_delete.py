# EXAMPLE: iris_playbook_quickstart_delete
# HIDE_START
import os

from redis_iris.agent_playbooks import AgentPlaybooks

playbook = AgentPlaybooks.from_env()
print(playbook.client.get_playbook_health())
faq_id = os.environ["PLAYBOOK_FAQ_ID"]
# HIDE_END

# STEP_START playbook-quickstart-delete
playbook.client.delete_faq(faq_id=faq_id)
# STEP_END

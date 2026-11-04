# EXAMPLE: iris_playbook_faqs_withdraw
# HIDE_START
import os

from redis_iris import Iris

playbook = Iris.from_env().agent_playbooks()
print(playbook.client.get_playbook_health())
faq_id = os.environ["PLAYBOOK_FAQ_ID"]
# HIDE_END

# STEP_START playbook-faq-withdraw
playbook.client.withdraw_faq(faq_id=faq_id)
# STEP_END

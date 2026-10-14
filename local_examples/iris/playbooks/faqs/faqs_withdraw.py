# EXAMPLE: iris_playbook_faqs_withdraw
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
faq_id = os.environ["PLAYBOOK_FAQ_ID"]
# HIDE_END

# STEP_START playbook-faq-withdraw
playbook.withdraw_faq(faq_id=faq_id)
# STEP_END

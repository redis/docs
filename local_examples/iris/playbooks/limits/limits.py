# EXAMPLE: iris_playbook_limits
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
# HIDE_END

# STEP_START playbook-error-type
import json
from redis_agent_playbook.errors import PlaybookError

try:
    entry = playbook.get_faq(faq_id=os.environ["PLAYBOOK_FAQ_ID"])
    print(entry)
except PlaybookError as error:
    try:
        problem = json.loads(error.body)
    except ValueError:
        problem = {}
    print("Request failed:", error.status_code, problem.get("type", "unknown"))
    raise
# STEP_END

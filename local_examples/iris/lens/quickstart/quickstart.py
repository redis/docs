# EXAMPLE: iris_lens_quickstart
# STEP_START trace_turn
import uuid

from openai import OpenAI
from redis_iris import lens

lens.init()
client = OpenAI()

session_id = f"quickstart-{uuid.uuid4().hex[:8]}"

with lens.turn(session_id, user_id="user-1042") as turn:
    response = client.responses.create(
        model="gpt-4.1-mini",
        input="Where can I see my refund status?",
    )
    print(response.output_text)
    turn.set_outcome("completed")

turn_id = turn.trace_id
print(f"Session: {session_id}")
print(f"Turn: {turn_id}")
# STEP_END

# STEP_START find_turn
import os
import time

from redis_agent_lens import Lens, errors

with Lens(
    server_url=os.environ["LENS_URL"],
    instance_id=os.environ["LENS_INSTANCE_ID"],
) as client:
    for _ in range(30):
        try:
            detail = client.get_turn(turn_id=turn_id)
            break
        except errors.NotFoundErrorResponseContent:
            time.sleep(2)
    else:
        raise RuntimeError("The turn isn't readable. Check the iris.lens warnings for an export error.")

print(f"Outcome: {detail.outcome.value}")
print(f"Tokens: {detail.tokens.total}")
# STEP_END

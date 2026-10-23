# EXAMPLE: iris_lens_quickstart
# STEP_START trace_turn
import os
import uuid

from redis_iris import lens

question = "Where can I see my refund status?"
memories = [
    ("mem-1", 0.91, "The customer prefers email updates."),
    ("mem-2", 0.84, "The customer's refund was issued on May 2."),
    ("mem-3", 0.42, "The customer asked about gift wrapping in March."),
]

session_id = f"quickstart-{uuid.uuid4().hex[:8]}"

with lens.turn(session_id, user_id="user-1042") as turn:
    with lens.memory_recall(query=question, store_id="quickstart-store") as recall:
        recall.results(memories)

    with lens.prompt_assembly() as prompt:
        prompt.fetched(memories)
        prompt.used(memories[:2])

    answer = "Your refund was issued on May 2. You'll get an email when it posts."
    turn.set_outcome("completed")

turn_id = turn.trace_id
print(f"Session: {session_id}")
print(f"Turn: {turn_id}")
# STEP_END

# STEP_START flush
if not lens.shutdown(timeout_millis=10_000):
    raise RuntimeError("Lens did not finish exporting the turn")
# STEP_END

# STEP_START find_turn
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
        raise RuntimeError("The turn isn't readable yet. Try again in a minute.")

print(f"Outcome: {detail.outcome.value}")
for entry in detail.manifest.entries:
    print(f"{entry.source}: fetched {entry.fetched_count}, used {entry.used_count}")
# STEP_END

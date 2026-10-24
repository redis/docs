# EXAMPLE: iris_lens_own_loop
# STEP_START own_loop_turn
from redis_iris import lens


def call_model(message, context):
    # Your model call goes here.
    return "Your refund was issued on May 2."


def handle(session_id, user_id, message):
    with lens.turn(session_id, user_id=user_id) as turn:
        try:
            answer = call_model(message, context=[])
        except Exception:
            turn.set_outcome("failed")
            raise
        turn.set_outcome("completed")
    return answer


print(handle("session-1", "user-1042", "Where can I see my refund status?"))
# STEP_END

lens.shutdown()

# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
from redis_iris import IntentRouter

router = IntentRouter.from_env()
# HIDE_END

# STEP_START intents-delete
for name in ("track_order", "refund"):
    router.remove(name)
# STEP_END

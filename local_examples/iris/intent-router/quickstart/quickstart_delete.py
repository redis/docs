# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
from redis_iris.intent_router import IntentRouter

router = IntentRouter.from_env()
# HIDE_END

# STEP_START intents-delete
for name in ("track_order", "refund"):
    router.client.delete_intent(intent_name=name)
# STEP_END

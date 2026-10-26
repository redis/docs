# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
import os

from redis_iris.intent_router import IntentRouter, IntentRouterSettings

router = IntentRouter(
    IntentRouterSettings(
        url=os.environ["INTENT_ROUTER_URL"],
        router_id=os.environ["ROUTER_ID"],
        api_key=os.environ["INTENT_ROUTER_API_KEY"],
    )
)
# HIDE_END

# STEP_START intents-delete
for name in ("track_order", "refund"):
    router.client.delete_intent(intent_name=name)
# STEP_END

# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
import os

from redis_iris.intent_router import IntentRouter, IntentRouterSettings

router = IntentRouter(
    IntentRouterSettings(
        url=os.environ["INTENT_ROUTER_URL"],
        router_id=os.environ["ROUTER_ID"],
        api_key=os.environ["INTENT_ROUTER_API_KEY"],
    )
)
print(router.client.get_router_health())
# STEP_END

# STEP_START intents-create
router.client.upsert_intent(
    intent_name="track_order",
    description="The customer wants to know where an order is.",
    target={"type": "tool", "ref": "orders.track", "args": {"region": "eu"}},
    examples=["where is my order", "track my package", "has my parcel shipped"],
)
router.client.upsert_intent(
    intent_name="refund",
    examples=["i want a refund", "refund my purchase", "i would like my money back"],
)
# STEP_END

# STEP_START match-query
for query in ("where is my order please", "i would like my money back", "zzz qqq"):
    matches = router.client.match(query=query).items
    if matches:
        print(query, "->", matches[0].name, round(matches[0].score, 2), matches[0].target)
    else:
        print(query, "-> no match")
# STEP_END

# STEP_START examples-add
router.client.add_examples(
    intent_name="track_order", examples=["when will my delivery arrive"]
)
# STEP_END

# STEP_START intent-update
updated = router.client.update_intent(intent_name="track_order", min_score=0.8)
print(updated.revision, updated.min_score)
# STEP_END

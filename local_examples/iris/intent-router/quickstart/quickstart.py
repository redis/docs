# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
from redis_iris.intent_router import IntentRouter

router = IntentRouter.from_env()
print(router.client.get_router_health())
# STEP_END

# STEP_START intents-create
for intent in (
    router.client.upsert_intent(
        intent_name="track_order",
        description="The customer wants to know where an order is.",
        target={"type": "tool", "ref": "orders.track", "args": {"region": "eu"}},
        examples=["where is my order", "track my package", "has my parcel shipped"],
    ),
    router.client.upsert_intent(
        intent_name="refund",
        examples=["i want a refund", "refund my purchase", "i would like my money back"],
    ),
):
    print(intent.name, intent.example_count, intent.revision)
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
added = router.client.add_examples(
    intent_name="track_order", examples=["when will my delivery arrive"]
)
for example in added.items:
    print(example.example_id, example.text)
# STEP_END

# STEP_START intent-update
updated = router.client.update_intent(intent_name="track_order", min_score=0.8)
print(updated.name, updated.min_score, updated.revision)
# STEP_END

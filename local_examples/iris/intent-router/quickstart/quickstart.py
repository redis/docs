# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
from redis_iris import IntentRouter
from redis_iris.intent_router import Target

router = IntentRouter.from_env()
health = router.health()
print(health.ok, [(check.name, check.ok, check.message) for check in health.checks])
# STEP_END

# STEP_START intents-create
for intent in (
    router.define(
        "track_order",
        description="The customer wants to know where an order is.",
        target=Target("tool", "orders.track", {"region": "eu"}),
        examples=["where is my order", "track my package", "has my parcel shipped"],
    ),
    router.define(
        "refund",
        examples=["i want a refund", "refund my purchase", "i would like my money back"],
    ),
):
    print(intent.name, intent.example_count, intent.revision)
# STEP_END

# STEP_START match-query
for query in ("where is my order please", "i would like my money back", "zzz qqq"):
    best = router.match(query).best
    if best:
        print(query, "->", best.name, round(best.score, 2), best.target)
    else:
        print(query, "-> no match")
# STEP_END

# STEP_START examples-add
for example in router.add_examples("track_order", ["when will my delivery arrive"]):
    print(example.example_id, example.text)
# STEP_END

# STEP_START intent-update
updated = router.update("track_order", min_score=0.8)
print(updated.name, updated.min_score, updated.revision)
# STEP_END

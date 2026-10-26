# EXAMPLE: iris_intent_router_match
# HIDE_START
from redis_iris.intent_router import IntentRouter

router = IntentRouter.from_env()
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
# HIDE_END

# STEP_START match-options
result = router.client.match(query="where is my order please", limit=3, min_score=0.6)
for item in result.items:
    print(item.name, item.score, item.target)
# STEP_END

# STEP_START match-dispatch
def route(query: str) -> str:
    items = router.client.match(query=query).items
    if not items:
        return "no intent is close enough: use a default path"
    top = items[0]
    if top.target is None:
        return f"none {top.name}"
    return f"{top.target.type} {top.target.ref}"


print(route("where is my order please"))
# STEP_END

# STEP_START match-tune
for item in router.client.match(query="i need help", min_score=0).items:
    print(item.name, round(item.score, 2))
# STEP_END

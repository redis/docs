# EXAMPLE: iris_intent_router_match
# HIDE_START
from redis_iris.intent_router import IntentRouter, Target

router = IntentRouter.from_env()
router.define(
    "track_order",
    description="The customer wants to know where an order is.",
    target=Target("tool", "orders.track", {"region": "eu"}),
    examples=["where is my order", "track my package", "has my parcel shipped"],
)
router.define(
    "refund",
    examples=["i want a refund", "refund my purchase", "i would like my money back"],
)
# HIDE_END

# STEP_START match-options
for item in router.match("where is my order please", limit=3, min_score=0.6):
    print(item.name, item.score, item.target)
# STEP_END

# STEP_START match-dispatch
def route(query: str) -> str:
    top = router.match(query).best
    if top is None:
        return "no intent is close enough: use a default path"
    if top.target is None:
        return f"none {top.name}"
    return f"{top.target.type} {top.target.ref}"


print(route("where is my order please"))
# STEP_END

# STEP_START match-tune
for item in router.match("i need help", min_score=0):
    print(item.name, round(item.score, 2))
# STEP_END

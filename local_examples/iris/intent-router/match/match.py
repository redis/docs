# EXAMPLE: iris_intent_router_match
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


def call_tool(ref, **args):
    print("calling", ref, args)
# HIDE_END

# STEP_START match-options
result = router.client.match(query="where is my order please", limit=3, min_score=0.6)
for item in result.items:
    print(item.name, item.score, item.target)
# STEP_END

# STEP_START match-dispatch
def route(query: str):
    items = router.client.match(query=query).items
    if not items:
        return None  # no intent is close enough: use a default path
    top = items[0]
    if top.target is not None and top.target.type == "tool":
        return call_tool(top.target.ref, **(top.target.args or {}))
    return top.name
# STEP_END

# STEP_START match-tune
for item in router.client.match(query="i need help", min_score=0).items:
    print(item.name, round(item.score, 2))
# STEP_END

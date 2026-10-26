# EXAMPLE: iris_intent_router_intents
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

# STEP_START intent-upsert
intent = router.client.upsert_intent(
    intent_name="refund",
    description="The customer wants their money back.",
    target={"type": "agent", "ref": "billing-agent"},
    min_score=0.75,
    metadata={"owner": "support"},
    examples=["i want a refund", "refund my purchase"],
)
print(intent.name, intent.example_count, intent.revision)
# STEP_END

# STEP_START intents-bulk
router.client.add_intents(
    intents=[
        {"name": "track_order", "examples": ["where is my order", "track my package"]},
        {"name": "cancel_order", "examples": ["cancel my order", "i changed my mind"]},
    ]
)
# STEP_END

# STEP_START intents-list
page = router.client.list_intents(limit=50)
for item in page.items:
    print(item.name, item.example_count)
while page.next_cursor:
    page = router.client.list_intents(limit=50, cursor=page.next_cursor)
    for item in page.items:
        print(item.name, item.example_count)
# STEP_END

# STEP_START intent-patch
router.client.update_intent(
    intent_name="refund",
    min_score=None,
    target={"type": "agent", "ref": "refunds-agent"},
)
# STEP_END

# STEP_START intent-conditional
current = router.client.get_intent(intent_name="refund")
router.client.upsert_intent(
    intent_name="refund",
    examples=["i want a refund", "refund my purchase", "send my money back"],
    expected_revision=current.revision,
)
# STEP_END

# STEP_START examples-add
added = router.client.add_examples(
    intent_name="refund", examples=["send my money back", "i was charged twice"]
)
for example in added.items:
    print(example.example_id, example.text)
# STEP_END

# STEP_START examples-list
examples = router.client.list_examples(intent_name="refund", limit=50)
for example in examples.items:
    print(example.example_id, example.text)
# STEP_END

# STEP_START example-delete
router.client.delete_example(
    intent_name="refund", example_id=examples.items[0].example_id
)
# STEP_END

# STEP_START intent-delete
router.client.delete_intent(intent_name="cancel_order")
# STEP_END

# STEP_START router-clear
router.client.clear(scope="INTENTS")
# STEP_END

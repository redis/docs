# EXAMPLE: iris_intent_router_intents
# HIDE_START
from redis_iris.intent_router import IntentRouter

router = IntentRouter.from_env()
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
result = router.client.add_intents(
    intents=[
        {"name": "track_order", "examples": ["where is my order", "track my package"]},
        {"name": "cancel_order", "examples": ["cancel my order", "i changed my mind"]},
    ]
)
for item in result.items:
    print(item.name, item.example_count)
# STEP_END

# STEP_START intents-list
page = router.client.list_intents(limit=50)
for item in page.items:
    print(item.name, item.example_count)
print("next cursor:", page.next_cursor)
# STEP_END

# STEP_START intent-patch
patched = router.client.update_intent(
    intent_name="refund",
    min_score=None,
    target={"type": "agent", "ref": "refunds-agent"},
)
print(patched.name, patched.target, patched.min_score, patched.revision)
# STEP_END

# STEP_START intent-conditional
current = router.client.get_intent(intent_name="refund")
changed = router.client.update_intent(
    intent_name="refund",
    description="The customer wants a refund or a chargeback reversed.",
    expected_revision=current.revision,
)
print(changed.name, changed.revision)
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

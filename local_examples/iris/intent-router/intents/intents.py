# EXAMPLE: iris_intent_router_intents
# HIDE_START
from redis_iris.intent_router import IntentRouter, Target

router = IntentRouter.from_env()
# HIDE_END

# STEP_START intent-upsert
intent = router.define(
    "refund",
    description="The customer wants their money back.",
    target=Target("agent", "billing-agent"),
    min_score=0.75,
    metadata={"owner": "support"},
    examples=["i want a refund", "refund my purchase"],
)
print(intent.name, intent.example_count, intent.revision)
# STEP_END

# STEP_START intents-bulk
added = router.define_many(
    [
        {"name": "track_order", "examples": ["where is my order", "track my package"]},
        {"name": "cancel_order", "examples": ["cancel my order", "i changed my mind"]},
    ]
)
for item in added:
    print(item.name, item.example_count)
# STEP_END

# STEP_START intents-list
for item in router.intents():
    print(item.name, item.example_count)
# STEP_END

# STEP_START intent-patch
patched = router.update(
    "refund",
    min_score=None,
    target=Target("agent", "refunds-agent"),
)
print(patched.name, patched.target, patched.min_score, patched.revision)
# STEP_END

# STEP_START intent-conditional
current = router.intent("refund")
changed = router.update(
    "refund",
    description="The customer wants a refund or a chargeback reversed.",
    expected_revision=current.revision,
)
print(changed.name, changed.revision)
# STEP_END

# STEP_START examples-add
for example in router.add_examples("refund", ["send my money back", "i was charged twice"]):
    print(example.example_id, example.text)
# STEP_END

# STEP_START examples-list
examples = router.examples("refund")
for example in examples:
    print(example.example_id, example.text)
# STEP_END

# STEP_START example-delete
router.remove_example("refund", examples[0].example_id)
# STEP_END

# STEP_START intent-delete
router.remove("cancel_order")
# STEP_END

# STEP_START router-clear
router.clear()
# STEP_END

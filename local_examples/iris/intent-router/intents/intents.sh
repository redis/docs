# EXAMPLE: iris_intent_router_intents
# HIDE_START
set -euo pipefail
ROUTER_API="${INTENT_ROUTER_URL%/}/iris/v2/intent/routers/$ROUTER_ID"
# HIDE_END

# STEP_START intent-upsert
curl --fail-with-body --silent --show-error \
  -X PUT "$ROUTER_API/intents/refund" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "description": "The customer wants their money back.",
    "target": {"type": "agent", "ref": "billing-agent"},
    "minScore": 0.75,
    "metadata": {"owner": "support"},
    "examples": ["i want a refund", "refund my purchase"]
  }' | jq '{name, exampleCount, revision}'
# STEP_END

# STEP_START intents-bulk
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/intents" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"intents": [
    {"name": "track_order", "examples": ["where is my order", "track my package"]},
    {"name": "cancel_order", "examples": ["cancel my order", "i changed my mind"]}
  ]}' | jq '.items[] | {name, exampleCount}'
# STEP_END

# STEP_START intents-list
curl --fail-with-body --silent --show-error \
  "$ROUTER_API/intents?limit=50" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" | jq '{items: [.items[] | {name, exampleCount}], nextCursor}'
# STEP_END

# STEP_START intent-patch
curl --fail-with-body --silent --show-error \
  -X PATCH "$ROUTER_API/intents/refund" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"minScore": null, "target": {"type": "agent", "ref": "refunds-agent"}}' \
  | jq '{name, target, minScore, revision}'
# STEP_END

# STEP_START intent-conditional
REVISION=$(curl --fail-with-body --silent --show-error \
  "$ROUTER_API/intents/refund" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" | jq -er .revision)
curl --fail-with-body --silent --show-error \
  -X PUT "$ROUTER_API/intents/refund" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg rev "$REVISION" '{
    examples: ["i want a refund", "refund my purchase", "send my money back"],
    expectedRevision: $rev
  }')" | jq '{name, revision}'
# STEP_END

# STEP_START examples-add
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/intents/refund/examples" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"examples": ["send my money back", "i was charged twice"]}' | jq '.items[] | {exampleId, text}'
# STEP_END

# STEP_START examples-list
curl --fail-with-body --silent --show-error \
  "$ROUTER_API/intents/refund/examples?limit=50" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" > examples.json
jq '.items[] | {exampleId, text}' examples.json
# STEP_END

# STEP_START example-delete
EXAMPLE_ID=$(jq -er '.items[0].exampleId' examples.json)
curl --fail-with-body --silent --show-error \
  -X DELETE "$ROUTER_API/intents/refund/examples/$EXAMPLE_ID" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY"
# STEP_END

# STEP_START intent-delete
curl --fail-with-body --silent --show-error \
  -X DELETE "$ROUTER_API/intents/cancel_order" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY"
# STEP_END

# STEP_START router-clear
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/clear" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"scope": "INTENTS"}'
# STEP_END

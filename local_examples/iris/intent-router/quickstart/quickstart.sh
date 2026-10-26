# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
set -euo pipefail
ROUTER_API="${INTENT_ROUTER_URL%/}/iris/v2/intent/routers/$ROUTER_ID"
curl --fail-with-body --silent --show-error \
  "$ROUTER_API/health" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" | jq .
# STEP_END

# STEP_START intents-create
curl --fail-with-body --silent --show-error \
  -X PUT "$ROUTER_API/intents/track_order" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "description": "The customer wants to know where an order is.",
    "target": {"type": "tool", "ref": "orders.track", "args": {"region": "eu"}},
    "examples": ["where is my order", "track my package", "has my parcel shipped"]
  }' | jq '{name, exampleCount, revision}'
curl --fail-with-body --silent --show-error \
  -X PUT "$ROUTER_API/intents/refund" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"examples": ["i want a refund", "refund my purchase", "i would like my money back"]}' \
  | jq '{name, exampleCount, revision}'
# STEP_END

# STEP_START match-query
for query in "where is my order please" "i would like my money back" "zzz qqq"; do
  curl --fail-with-body --silent --show-error \
    -X POST "$ROUTER_API/match" \
    -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
    -H 'Content-Type: application/json' \
    --data "$(jq -n --arg query "$query" '{query: $query}')" \
    | jq -c --arg query "$query" '{query: $query, items: [.items[] | {name, score, target}]}'
done
# STEP_END

# STEP_START examples-add
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/intents/track_order/examples" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"examples": ["when will my delivery arrive"]}' | jq .
# STEP_END

# STEP_START intent-update
curl --fail-with-body --silent --show-error \
  -X PATCH "$ROUTER_API/intents/track_order" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"minScore": 0.8}' | jq '{name, minScore, revision}'
# STEP_END

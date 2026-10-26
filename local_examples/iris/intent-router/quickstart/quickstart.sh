# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
set -euo pipefail
ROUTER_API="${IRIS_INTENT_ROUTER_URL%/}/iris/v2/intent/routers/$IRIS_INTENT_ROUTER_ID"
curl --fail-with-body --silent --show-error \
  "$ROUTER_API/health" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" | jq .
# STEP_END

# STEP_START intents-create
curl --fail-with-body --silent --show-error \
  -X PUT "$ROUTER_API/intents/track_order" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "description": "The customer wants to know where an order is.",
    "target": {"type": "tool", "ref": "orders.track", "args": {"region": "eu"}},
    "examples": ["where is my order", "track my package", "has my parcel shipped"]
  }' | jq -c '{name, exampleCount, revision}'
curl --fail-with-body --silent --show-error \
  -X PUT "$ROUTER_API/intents/refund" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"examples": ["i want a refund", "refund my purchase", "i would like my money back"]}' \
  | jq -c '{name, exampleCount, revision}'
# STEP_END

# STEP_START match-query
for query in "where is my order please" "i would like my money back" "zzz qqq"; do
  curl --fail-with-body --silent --show-error \
    -X POST "$ROUTER_API/match" \
    -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
    -H 'Content-Type: application/json' \
    --data "$(jq -n --arg query "$query" '{query: $query}')" \
    | jq -r --arg query "$query" 'if (.items | length) > 0
        then "\($query) -> \(.items[0].name) \(.items[0].score * 100 | round / 100) \(.items[0].target | tojson)"
        else "\($query) -> no match" end'
done
# STEP_END

# STEP_START examples-add
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/intents/track_order/examples" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"examples": ["when will my delivery arrive"]}' | jq -c '.items[] | {exampleId, text}'
# STEP_END

# STEP_START intent-update
curl --fail-with-body --silent --show-error \
  -X PATCH "$ROUTER_API/intents/track_order" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"minScore": 0.8}' | jq -c '{name, minScore, revision}'
# STEP_END

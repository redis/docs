# EXAMPLE: iris_intent_router_match
# HIDE_START
set -euo pipefail
SEED_API="${IRIS_INTENT_ROUTER_URL%/}/iris/v2/intent/routers/$IRIS_INTENT_ROUTER_ID"
curl --fail-with-body --silent --show-error -o /dev/null \
  -X PUT "$SEED_API/intents/track_order" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{
    "description": "The customer wants to know where an order is.",
    "target": {"type": "tool", "ref": "orders.track", "args": {"region": "eu"}},
    "examples": ["where is my order", "track my package", "has my parcel shipped"]
  }'
curl --fail-with-body --silent --show-error -o /dev/null \
  -X PUT "$SEED_API/intents/refund" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"examples": ["i want a refund", "refund my purchase", "i would like my money back"]}'
# HIDE_END

# STEP_START match-options
ROUTER_API="${IRIS_INTENT_ROUTER_URL%/}/iris/v2/intent/routers/$IRIS_INTENT_ROUTER_ID"
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/match" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query": "where is my order please", "limit": 3, "minScore": 0.6}' \
  | jq -c '.items[] | {name, score, target}'
# STEP_END

# STEP_START match-dispatch
QUERY="where is my order please"
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/match" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg query "$QUERY" '{query: $query}')" > match.json
if [ "$(jq '.items | length' match.json)" -eq 0 ]; then
  echo "no intent is close enough: use a default path"
else
  jq -r '.items[0] | if .target then "\(.target.type) \(.target.ref)" else "none \(.name)" end' match.json
fi
# STEP_END

# STEP_START match-tune
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/match" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query": "i need help", "minScore": 0}' | jq -c '.items[] | {name, score}'
# STEP_END

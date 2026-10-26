# EXAMPLE: iris_intent_router_match
# HIDE_START
set -euo pipefail
ROUTER_API="${INTENT_ROUTER_URL%/}/iris/v2/intent/routers/$ROUTER_ID"
# HIDE_END

# STEP_START match-options
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/match" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query": "where is my order please", "limit": 3, "minScore": 0.6}' | jq .
# STEP_END

# STEP_START match-dispatch
QUERY="where is my order please"
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/match" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg query "$QUERY" '{query: $query}')" > match.json
if [ "$(jq '.items | length' match.json)" -eq 0 ]; then
  echo "no intent is close enough: use a default path"
else
  jq -r '.items[0] | "\(.target.type // "none") \(.target.ref // .name)"' match.json
fi
# STEP_END

# STEP_START match-tune
curl --fail-with-body --silent --show-error \
  -X POST "$ROUTER_API/match" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query": "i need help", "minScore": 0}' | jq -c '.items[] | {name, score}'
# STEP_END

# EXAMPLE: iris_intent_router_match
# HIDE_START
set -euo pipefail
export IRIS_INTENT_ROUTER_URL="$INTENT_ROUTER_URL"
export IRIS_INTENT_ROUTER_ID="$ROUTER_ID"
export IRIS_INTENT_ROUTER_API_KEY="$INTENT_ROUTER_API_KEY"
# HIDE_END

# STEP_START match-options
iris intent-router match "where is my order please" --limit 3 --min-score 0.6
# STEP_END

# STEP_START match-dispatch
iris --json intent-router match "where is my order please" > match.json
if [ "$(jq '.items | length' match.json)" -eq 0 ]; then
  echo "no intent is close enough: use a default path"
else
  jq -r '.items[0] | "\(.target.type // "none") \(.target.ref // .name)"' match.json
fi
# STEP_END

# STEP_START match-tune
iris intent-router match "i need help" --min-score 0
# STEP_END

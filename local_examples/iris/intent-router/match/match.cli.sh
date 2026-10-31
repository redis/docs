# EXAMPLE: iris_intent_router_match
# HIDE_START
set -euo pipefail
iris intent-router intents add track_order \
  --description "The customer wants to know where an order is." \
  --target '{"type": "tool", "ref": "orders.track", "args": {"region": "eu"}}' \
  --example "where is my order" --example "track my package" --example "has my parcel shipped" \
  > /dev/null
iris intent-router intents add refund \
  --example "i want a refund" --example "refund my purchase" --example "i would like my money back" \
  > /dev/null
# HIDE_END

# STEP_START match-options
iris intent-router match "where is my order please" --limit 3 --min-score 0.6
# STEP_END

# STEP_START match-dispatch
iris --json intent-router match "where is my order please" > match.json
if [ "$(jq '.items | length' match.json)" -eq 0 ]; then
  echo "no intent is close enough: use a default path"
else
  jq -r '.items[0] | if .target then "\(.target.type) \(.target.ref)" else "none \(.name)" end' match.json
fi
# STEP_END

# STEP_START match-tune
iris intent-router match "i need help" --min-score 0
# STEP_END

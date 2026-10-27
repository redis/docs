# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
set -euo pipefail
iris intent-router health
# STEP_END

# STEP_START intents-create
iris intent-router intents put track_order \
  --description "The customer wants to know where an order is." \
  --target '{"type": "tool", "ref": "orders.track", "args": {"region": "eu"}}' \
  --example "where is my order" --example "track my package" \
  --example "has my parcel shipped"
iris intent-router intents put refund \
  --example "i want a refund" --example "refund my purchase" \
  --example "i would like my money back"
# STEP_END

# STEP_START match-query
for query in "where is my order please" "i would like my money back" "zzz qqq"; do
  iris intent-router match "$query"
done
# STEP_END

# STEP_START examples-add
iris intent-router examples add track_order "when will my delivery arrive"
# STEP_END

# STEP_START intent-update
iris intent-router intents patch track_order --min-score 0.8
# STEP_END

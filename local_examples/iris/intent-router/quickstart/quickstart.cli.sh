# EXAMPLE: iris_intent_router_quickstart
# STEP_START router-connect
set -euo pipefail
iris intent-router health
# STEP_END

# STEP_START intents-create
cat > track_order.json <<'JSON'
{
  "description": "The customer wants to know where an order is.",
  "target": {"type": "tool", "ref": "orders.track", "args": {"region": "eu"}},
  "examples": ["where is my order", "track my package", "has my parcel shipped"]
}
JSON
cat > refund.json <<'JSON'
{"examples": ["i want a refund", "refund my purchase", "i would like my money back"]}
JSON
iris intent-router intents upsert track_order --file track_order.json
iris intent-router intents upsert refund --file refund.json
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
iris intent-router intents update track_order --min-score 0.8
# STEP_END

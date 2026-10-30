# EXAMPLE: iris_intent_router_intents
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START intent-upsert
iris intent-router intents add refund \
  --description "The customer wants their money back." \
  --target '{"type": "agent", "ref": "billing-agent"}' \
  --min-score 0.75 --metadata owner=support \
  --example "i want a refund" --example "refund my purchase"
# STEP_END

# STEP_START intents-bulk
cat > intents.json <<'JSON'
{"intents": [
  {"name": "track_order", "examples": ["where is my order", "track my package"]},
  {"name": "cancel_order", "examples": ["cancel my order", "i changed my mind"]}
]}
JSON
iris intent-router intents add --file intents.json
# STEP_END

# STEP_START intents-list
iris intent-router intents list --limit 50
# STEP_END

# STEP_START intent-patch
iris intent-router intents update refund \
  --target '{"type": "agent", "ref": "refunds-agent"}'
# STEP_END

# STEP_START intent-conditional
REVISION=$(iris --json intent-router intents show refund | jq -er .revision)
iris intent-router intents update refund \
  --description "The customer wants a refund or a chargeback reversed." \
  --expected-revision "$REVISION"
# STEP_END

# STEP_START examples-add
iris intent-router examples add refund "send my money back" "i was charged twice"
# STEP_END

# STEP_START examples-list
iris --json intent-router examples list refund --limit 50 > examples.json
jq -c '.items[] | {exampleId, text}' examples.json
# STEP_END

# STEP_START example-delete
EXAMPLE_ID=$(jq -er '.items[0].exampleId' examples.json)
iris intent-router examples delete refund "$EXAMPLE_ID" --yes
# STEP_END

# STEP_START intent-delete
iris intent-router intents delete cancel_order --yes
# STEP_END

# STEP_START router-clear
iris intent-router clear --scope intents --yes
# STEP_END

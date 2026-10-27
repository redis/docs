# EXAMPLE: iris_intent_router_service
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START models-list
iris --json intent-router service models --purpose embedding > models.json
jq -c '.items[] | {provider, model, dimensions, authorization}' models.json
# STEP_END

# STEP_START router-create
ROUTER_ID=$(iris --json intent-router service create support-router \
  --description "Routes support requests to tools and agents." \
  --template agent --min-score 0.7 \
  --provider "$(jq -er '.items[0].provider' models.json)" \
  --model "$(jq -er '.items[0].model' models.json)" \
  --dimensions "$(jq -er '.items[0].dimensions' models.json)" \
  --wait --write-env .env | jq -er .routerId)
# STEP_END

# STEP_START router-wait
iris --json intent-router service show "$ROUTER_ID" \
  | jq -c '{routerId, state, failureReason}'
# STEP_END

# STEP_START router-list
iris intent-router service list
# STEP_END

# STEP_START router-update
REVISION=$(iris --json intent-router service show "$ROUTER_ID" | jq -er .revision)
iris intent-router service update "$ROUTER_ID" --min-score 0.75 \
  --expected-revision "$REVISION"
# STEP_END

# STEP_START router-suspend
iris intent-router service update "$ROUTER_ID" --state SUSPENDED
iris intent-router service update "$ROUTER_ID" --state READY
# STEP_END

# STEP_START router-delete
iris intent-router service delete "$ROUTER_ID" --yes
# STEP_END

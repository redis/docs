# EXAMPLE: iris_intent_router_service
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START models-list
iris --json intent-router service models --purpose embedding > models.json
jq -c '.items[] | {provider, model, dimensions, authorization}' models.json
# STEP_END

# STEP_START router-create
iris intent-router service create --name support-router \
  --description "Routes support requests to tools and agents." \
  --template agent --min-score 0.7 \
  --provider "$(jq -er '.items[0].provider' models.json)" \
  --model "$(jq -er '.items[0].model' models.json)" \
  --dimensions "$(jq -er '.items[0].dimensions' models.json)" \
  --wait | tee router.env
ROUTER_ID=$(sed -n 's/^IRIS_INTENT_ROUTER_ID=//p' router.env)
# STEP_END

# STEP_START router-wait
iris --json intent-router service show "$ROUTER_ID" > router.json
jq -c '{routerId, state, failureReason}' router.json
jq -e '.state == "READY"' router.json > /dev/null
# STEP_END

# STEP_START router-list
iris intent-router service list
# STEP_END

# STEP_START router-update
iris intent-router service update "$ROUTER_ID" --min-score 0.75 \
  --expected-revision "$(jq -er .revision router.json)"
# STEP_END

# STEP_START router-suspend
iris intent-router service update "$ROUTER_ID" --state suspended
iris intent-router service update "$ROUTER_ID" --state ready
# STEP_END

# STEP_START router-delete
iris intent-router service delete "$ROUTER_ID" --yes
# STEP_END

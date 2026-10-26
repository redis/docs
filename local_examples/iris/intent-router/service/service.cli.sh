# EXAMPLE: iris_intent_router_service
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START models-list
iris --json intent-router service models list --purpose EMBEDDING > models.json
jq '.items[] | {provider, model, dimensions}' models.json
# STEP_END

# STEP_START router-create
iris --json intent-router service routers create support-router \
  --description "Routes support requests to tools and agents." \
  --template AGENT --min-score 0.7 \
  --embedding-provider "$(jq -er '.items[0].provider' models.json)" \
  --embedding-model "$(jq -er '.items[0].model' models.json)" \
  --dimensions "$(jq -er '.items[0].dimensions' models.json)" > router.json
ROUTER_ID=$(jq -er .routerId router.json)
jq '{routerId, state, revision}' router.json
# STEP_END

# STEP_START router-wait
iris intent-router service routers wait "$ROUTER_ID"
# STEP_END

# STEP_START router-list
iris intent-router service routers list
# STEP_END

# STEP_START router-update
iris intent-router service routers update "$ROUTER_ID" --min-score 0.75
# STEP_END

# STEP_START router-suspend
iris intent-router service routers suspend "$ROUTER_ID"
iris intent-router service routers resume "$ROUTER_ID"
# STEP_END

# STEP_START router-delete
iris intent-router service routers delete "$ROUTER_ID" --yes
# STEP_END

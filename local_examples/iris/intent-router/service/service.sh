# EXAMPLE: iris_intent_router_service
# HIDE_START
set -euo pipefail
SERVICE_API="${IRIS_INTENT_ROUTER_SERVICE_URL%/}/iris/v2/intent"
# HIDE_END

# STEP_START models-list
curl --fail-with-body --silent --show-error \
  "$SERVICE_API/models?purpose=EMBEDDING" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN" > models.json
jq '.items[] | {provider, model, dimensions, authorization}' models.json
# STEP_END

# STEP_START router-create
curl --fail-with-body --silent --show-error \
  -X POST "$SERVICE_API/routers" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{
    name: "support-router",
    description: "Routes support requests to tools and agents.",
    template: "AGENT",
    minScore: 0.7,
    vectorSpace: (.items[0] | {provider, model, dimensions})
  }' models.json)" > router.json
ROUTER_ID=$(jq -er .routerId router.json)
jq '{routerId, state, revision}' router.json
# STEP_END

# STEP_START router-wait
until [ "$(curl --fail-with-body --silent --show-error \
  "$SERVICE_API/routers/$ROUTER_ID" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN" | tee router.json | jq -r .state)" != "PROVISIONING" ]; do
  sleep 1
done
jq '{routerId, state, failureReason}' router.json
# STEP_END

# STEP_START router-list
curl --fail-with-body --silent --show-error \
  "$SERVICE_API/routers" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN" \
  | jq '.items[] | {routerId, name, state}'
# STEP_END

# STEP_START router-update
curl --fail-with-body --silent --show-error \
  -X PATCH "$SERVICE_API/routers/$ROUTER_ID" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --arg rev "$(jq -er .revision router.json)" '{minScore: 0.75, expectedRevision: $rev}')" \
  | jq '{routerId, minScore, revision}'
# STEP_END

# STEP_START router-suspend
for state in SUSPENDED READY; do
  curl --fail-with-body --silent --show-error \
    -X PATCH "$SERVICE_API/routers/$ROUTER_ID" \
    -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN" \
    -H 'Content-Type: application/json' \
    --data "$(jq -n --arg state "$state" '{state: $state}')" | jq '{routerId, state}'
done
# STEP_END

# STEP_START router-delete
curl --fail-with-body --silent --show-error \
  -X DELETE "$SERVICE_API/routers/$ROUTER_ID" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_SERVICE_TOKEN"
# STEP_END

# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START intents-delete
ROUTER_API="${IRIS_INTENT_ROUTER_URL%/}/iris/data/v1/intent/routers/$IRIS_INTENT_ROUTER_ID"
for name in track_order refund; do
  curl --fail-with-body --silent --show-error \
    -X DELETE "$ROUTER_API/intents/$name" \
    -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY"
done
# STEP_END

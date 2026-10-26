# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
set -euo pipefail
export IRIS_INTENT_ROUTER_URL="$INTENT_ROUTER_URL"
export IRIS_INTENT_ROUTER_ID="$ROUTER_ID"
export IRIS_INTENT_ROUTER_API_KEY="$INTENT_ROUTER_API_KEY"
# HIDE_END

# STEP_START intents-delete
iris intent-router intents delete track_order refund --yes
# STEP_END

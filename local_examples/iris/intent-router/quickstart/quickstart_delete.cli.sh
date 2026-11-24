# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START intents-delete
for name in track_order refund; do
  iris intent-router intents delete "$name" --yes
done
# STEP_END

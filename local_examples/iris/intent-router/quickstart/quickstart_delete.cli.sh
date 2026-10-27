# EXAMPLE: iris_intent_router_quickstart_delete
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START intents-delete
iris intent-router intents delete track_order --yes
iris intent-router intents delete refund --yes
# STEP_END

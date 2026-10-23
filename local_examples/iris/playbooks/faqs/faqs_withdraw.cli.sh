# EXAMPLE: iris_playbook_faqs_withdraw
# HIDE_START
set -euo pipefail
export IRIS_AGENT_PLAYBOOK_URL="$PLAYBOOK_URL"
export IRIS_AGENT_PLAYBOOK_ID="$PLAYBOOK_ID"
export IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY"
# HIDE_END

# STEP_START playbook-faq-withdraw
iris agent-playbook faqs withdraw "$PLAYBOOK_FAQ_ID"
# STEP_END

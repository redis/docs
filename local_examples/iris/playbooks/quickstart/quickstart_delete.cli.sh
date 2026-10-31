# EXAMPLE: iris_playbook_quickstart_delete
# HIDE_START
set -euo pipefail
export IRIS_AGENT_PLAYBOOKS_URL="$PLAYBOOK_URL"
export IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID="$PLAYBOOK_ID"
export IRIS_AGENT_PLAYBOOKS_CONTENT_API_KEY="$PLAYBOOK_API_KEY"
# HIDE_END

# STEP_START playbook-quickstart-delete
iris agent-playbooks faqs delete "$PLAYBOOK_FAQ_ID" --yes
# STEP_END

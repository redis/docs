# EXAMPLE: iris_playbook_quickstart_delete
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START playbook-quickstart-delete
iris agent-playbooks faqs delete "$PLAYBOOK_FAQ_ID" --yes
# STEP_END

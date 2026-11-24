# EXAMPLE: iris_playbook_faqs_delete
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START playbook-faq-delete
iris agent-playbooks faqs delete "$PLAYBOOK_FAQ_ID" --yes
# STEP_END

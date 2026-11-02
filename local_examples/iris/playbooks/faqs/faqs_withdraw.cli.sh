# EXAMPLE: iris_playbook_faqs_withdraw
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START playbook-faq-withdraw
iris agent-playbooks faqs withdraw "$PLAYBOOK_FAQ_ID"
# STEP_END

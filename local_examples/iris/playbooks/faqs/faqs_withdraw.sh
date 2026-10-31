# EXAMPLE: iris_playbook_faqs_withdraw
set -euo pipefail

# HIDE_START
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
FAQ_ID="${PLAYBOOK_FAQ_ID:?Set PLAYBOOK_FAQ_ID to the printed entry identifier}"
# HIDE_END

# STEP_START playbook-faq-withdraw
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# STEP_END

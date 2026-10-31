# EXAMPLE: iris_playbook_skills_withdraw
set -euo pipefail

# HIDE_START
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/iris/data/v1/agent-playbooks/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
SKILL_ID="${PLAYBOOK_SKILL_ID:?Set PLAYBOOK_SKILL_ID to the printed entry identifier}"
# HIDE_END

# STEP_START playbook-skill-withdraw
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/skills/$SKILL_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
# STEP_END

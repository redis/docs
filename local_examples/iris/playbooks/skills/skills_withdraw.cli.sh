# EXAMPLE: iris_playbook_skills_withdraw
# HIDE_START
set -euo pipefail
playbook_cli() {
  IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY" \
    iris --json --no-input agent-playbook \
    --url "$PLAYBOOK_URL" --playbook-id "$PLAYBOOK_ID" "$@"
}
# HIDE_END

# STEP_START playbook-skill-withdraw
playbook_cli skills withdraw "$PLAYBOOK_SKILL_ID"
# STEP_END

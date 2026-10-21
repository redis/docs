# EXAMPLE: iris_playbook_skills_delete
# HIDE_START
set -euo pipefail
playbook_cli() {
  IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY" \
    iris --json --no-input agent-playbook \
    --url "$PLAYBOOK_URL" --playbook-id "$PLAYBOOK_ID" "$@"
}
# HIDE_END

# STEP_START playbook-skill-delete
playbook_cli skills delete "$PLAYBOOK_SKILL_ID" --yes
# STEP_END

# EXAMPLE: iris_playbook_skills_delete
# HIDE_START
set -euo pipefail
export IRIS_AGENT_PLAYBOOK_URL="$PLAYBOOK_URL"
export IRIS_AGENT_PLAYBOOK_ID="$PLAYBOOK_ID"
export IRIS_AGENT_PLAYBOOK_CONTENT_API_KEY="$PLAYBOOK_API_KEY"
# HIDE_END

# STEP_START playbook-skill-delete
iris agent-playbook skills delete "$PLAYBOOK_SKILL_ID" --yes
# STEP_END

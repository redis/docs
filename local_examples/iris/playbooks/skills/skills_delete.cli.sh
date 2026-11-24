# EXAMPLE: iris_playbook_skills_delete
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START playbook-skill-delete
iris agent-playbooks skills delete "$PLAYBOOK_SKILL_ID" --yes
# STEP_END

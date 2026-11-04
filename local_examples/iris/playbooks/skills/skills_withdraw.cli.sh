# EXAMPLE: iris_playbook_skills_withdraw
# HIDE_START
set -euo pipefail
# HIDE_END

# STEP_START playbook-skill-withdraw
iris agent-playbooks skills withdraw "$PLAYBOOK_SKILL_ID"
# STEP_END

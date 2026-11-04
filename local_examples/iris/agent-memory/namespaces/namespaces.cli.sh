# EXAMPLE: iris_agent_memory_namespaces
# STEP_START namespace-shared-recall
set -euo pipefail

iris agent-memory memories search \
  "What travel requirements has the team discussed?" \
  --owner quickstart-user --shared example-team-travel --prompt
# STEP_END

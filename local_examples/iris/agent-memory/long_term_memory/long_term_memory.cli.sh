# EXAMPLE: iris_agent_memory_long_term_memory
# STEP_START ltm-search
set -euo pipefail

iris agent-memory memories search \
  "What dietary requirements and food preferences does the user have?" \
  --owner quickstart-user --limit 5
# STEP_END

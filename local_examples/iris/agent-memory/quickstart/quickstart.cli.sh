# EXAMPLE: iris_agent_memory_quickstart
# STEP_START agent-memory-quickstart-transcript
set -euo pipefail

iris agent-memory sessions show travel-planning-session
# STEP_END

# STEP_START agent-memory-quickstart-recall
iris agent-memory memories search \
  "What dietary requirements and food preferences does the user have?" \
  --owner quickstart-user --prompt
# STEP_END

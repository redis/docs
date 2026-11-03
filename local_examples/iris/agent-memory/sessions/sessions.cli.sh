# EXAMPLE: iris_agent_memory_sessions
set -euo pipefail

# STEP_START agent-memory-sessions-retrieve
iris agent-memory sessions show travel-planning-session
# STEP_END

# STEP_START agent-memory-sessions-list-owner
iris agent-memory sessions list --owner quickstart-user
# STEP_END

# STEP_START agent-memory-sessions-summary
iris agent-memory sessions show travel-planning-session
# STEP_END

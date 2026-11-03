# EXAMPLE: iris_agent_memory_quickstart_delete
# STEP_START agent-memory-quickstart-delete
from redis_iris.agent_memory import AgentMemory

memory = AgentMemory.from_env()
forgotten = memory.forget("quickstart-user")
print(f"Deleted {forgotten.sessions} sessions and {forgotten.memories} memories")
# STEP_END

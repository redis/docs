# EXAMPLE: iris_agent_memory_quickstart_delete
# STEP_START agent-memory-quickstart-delete
from redis_iris import Iris

memory = Iris.from_env().agent_memory()
forgotten = memory.forget("quickstart-user")
print(f"Deleted {forgotten.sessions} sessions and {forgotten.memories} memories")
# STEP_END

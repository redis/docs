# EXAMPLE: iris_agent_memory_long_term_memory_update
# HIDE_START
from redis_iris.agent_memory import AgentMemory

OWNER_ID = "quickstart-user"
MEMORY_ID = "example-seat-preference"
memory = AgentMemory.from_env()
memory.client.bulk_create_long_term_memories(memories=[{
    "memory_id": MEMORY_ID,
    "text": "The user prefers a window seat.",
    "owner_id": OWNER_ID,
    "topics": ["travel"],
}])
# HIDE_END

# STEP_START ltm-get
current = memory.client.get_long_term_memory(memory_id=MEMORY_ID)
print(current.text, current.topics, current.updated_at)
# STEP_END

# STEP_START ltm-patch
updated = memory.client.update_long_term_memory(
    memory_id=MEMORY_ID,
    text="The user prefers an aisle seat on long flights.",
    topics=["travel", "flights"],
)
print(updated.text, updated.topics, updated.updated_at)
# STEP_END

# HIDE_START
memory.delete([MEMORY_ID])
# HIDE_END

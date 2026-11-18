# EXAMPLE: iris_agent_memory_long_term_memory_update
# HIDE_START
from uuid import uuid4

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
print(current.text, current.topics, current.updated_at, current.revision)
# STEP_END

# STEP_START ltm-patch
patch_key = str(uuid4())
updated = memory.client.update_long_term_memory(
    memory_id=MEMORY_ID,
    text="The user prefers an aisle seat on long flights.",
    topics=["travel", "flights"],
    expected_revision=current.revision,
    idempotency_key=patch_key,
)
print(updated.text, updated.topics, updated.updated_at)
# STEP_END

# STEP_START ltm-put
replace_key = str(uuid4())
replaced = memory.client.upsert_long_term_memory(
    memory_id=MEMORY_ID,
    text="The user prefers an aisle seat.",
    owner_id=OWNER_ID,
    topics=["travel"],
    expected_revision=updated.revision,
    idempotency_key=replace_key,
)
print(replaced.created)
# STEP_END

# STEP_START ltm-stale-revision
from redis_agent_memory.errors import AgentMemoryError

try:
    memory.client.update_long_term_memory(
        memory_id=MEMORY_ID,
        text="The user prefers a window seat on short flights.",
        expected_revision=current.revision,
        idempotency_key=str(uuid4()),
    )
except AgentMemoryError as error:
    if error.status_code != 412:
        raise
    latest = memory.client.get_long_term_memory(memory_id=MEMORY_ID)
    print("Review the current record before reapplying the change:", latest.text)
# STEP_END

# HIDE_START
memory.delete([MEMORY_ID])
# HIDE_END

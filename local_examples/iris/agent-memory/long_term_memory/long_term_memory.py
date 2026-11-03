# EXAMPLE: iris_agent_memory_long_term_memory
# HIDE_START
from redis_iris.agent_memory import AgentMemory

OWNER_ID = "quickstart-user"
memory = AgentMemory.from_env()
# HIDE_END

# STEP_START ltm-create
seeded = [
    memory.remember("The user is vegetarian.", owner=OWNER_ID, topics=["food"]),
    memory.remember("The user prefers spicy food.", owner=OWNER_ID, topics=["food"]),
    memory.remember("The user prefers a window seat.", owner=OWNER_ID, topics=["travel"]),
]
for created in seeded:
    print("Stored", created.id, created.text)
# STEP_END

# STEP_START ltm-search
known = memory.recall(
    "What dietary requirements and food preferences does the user have?",
    owner=OWNER_ID,
    limit=5,
)
print(known.as_prompt())
# STEP_END

# STEP_START ltm-filter
recent = memory.client.search_long_term_memory(request={
    "filter_": {"owner_id": {"eq": OWNER_ID}},
    "sort_by": "updatedAt",
    "sort_order": "DESC",
    "limit": 10,
})
for record in recent.items:
    print(record.updated_at, record.memory_id, record.text)
# STEP_END

# STEP_START ltm-delete
memory.delete(created.id for created in seeded)
print("Deleted", len(seeded), "memories")
# STEP_END

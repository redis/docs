# EXAMPLE: iris_agent_memory_list_sessions
# HIDE_START
from redis_iris.agent_memory import AgentMemory, models

OWNER_ID = "quickstart-user"

memory = AgentMemory.from_env()
# HIDE_END

# STEP_START agent-memory-list-session-ids
for session_id in memory.sessions(OWNER_ID):
    print(session_id)
# STEP_END

# STEP_START agent-memory-list-sessions-sorted
cursor = None
while True:
    page = memory.client.list_sessions(
        owner_id=OWNER_ID,
        sort_by=models.SessionListSortBy.UPDATED_AT,
        sort_order=models.SessionListSortOrder.DESC,
        limit=20,
        cursor=cursor,
    )
    for session in page.items:
        print(session.session_id, session.updated_at, session.namespace_id)
    cursor = page.next_cursor
    if not cursor:
        break
# STEP_END

# EXAMPLE: iris_agent_memory_ingestion_webhooks
# HIDE_START
import uuid

from redis_iris import Iris

OWNER_ID = "quickstart-user"
memory = Iris.from_env().agent_memory()
# HIDE_END

# STEP_START ingestion-webhooks-test-create
suffix = uuid.uuid4().hex[:12]
request = {
    "idempotency_key": f"example-hook-request-{suffix}",
    "memories": [
        {
            "memory_id": f"example-hook-test-{suffix}",
            "owner_id": OWNER_ID,
            "text": "[reject] synthetic webhook test",
        }
    ],
}
first = memory.client.bulk_create_long_term_memories(**request)
print("Created:", first.created)
for error in first.errors or []:
    print("Not created:", error.memory_id, error.status, error.detail)

retry = memory.client.bulk_create_long_term_memories(**request)
print("Identical retry returns the same result:", retry.created == first.created)
# STEP_END

# STEP_START ingestion-webhooks-status
cursor = None
first_event_id = None
while True:
    page = memory.client.list_ingestion_hook_statuses(limit=20, cursor=cursor)
    for event in page.items:
        print(event.event_id, event.path, event.state, event.apply_state)
        first_event_id = first_event_id or event.event_id
    cursor = page.next_cursor
    if not cursor:
        break

if first_event_id:
    detail = memory.client.get_ingestion_hook_status(event_id=first_event_id)
    print(detail.status.model_dump_json(by_alias=True, exclude_none=True))
# STEP_END

# HIDE_START
memory.delete(first.created)
# HIDE_END

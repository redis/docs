# EXAMPLE: iris_agent_memory_namespaces_delete
# HIDE_START
from redis_iris.agent_memory import AgentMemory, models

OWNER_ID = "quickstart-user"

memory = AgentMemory.from_env()
# HIDE_END

# STEP_START namespace-delete
forgotten = memory.forget(OWNER_ID)
print(f"Deleted {forgotten.sessions} sessions and {forgotten.memories} memories")


def delete_tree(namespace_id):
    # Only an empty leaf can be deleted, so remove children first.
    for child in memory.client.list_namespaces(parent_id=namespace_id).items:
        delete_tree(child.namespace_id)
    memory.client.delete_namespace(namespace_id=namespace_id)


personal = memory.client.list_namespaces(
    scope=models.NamespaceScope.PERSONAL, owner_id=OWNER_ID,
)
shared, cursor = [], None
while True:
    page = memory.client.list_namespaces(
        scope=models.NamespaceScope.SHARED, limit=200, cursor=cursor,
    )
    shared += page.items
    cursor = page.next_cursor
    if not cursor:
        break

for root in [*personal.items, *shared]:
    if root.name in ("example-travel", "example-team-travel"):
        delete_tree(root.namespace_id)
        print("Deleted", root.path)
# STEP_END

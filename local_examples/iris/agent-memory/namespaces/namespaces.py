# EXAMPLE: iris_agent_memory_namespaces
# HIDE_START
from redis_iris.agent_memory import AgentMemory, models

OWNER_ID = "quickstart-user"

memory = AgentMemory.from_env()
print(memory.client.store_health().status.value)
# HIDE_END

# STEP_START namespace-personal-create
created = memory.client.create_namespace(request={
    "name": "example-travel",
    "scope": models.NamespaceScope.PERSONAL,
    "owner_id": OWNER_ID,
})
namespace_id = created.namespace.namespace_id
print("Personal namespace:", namespace_id)
# STEP_END

# STEP_START namespace-personal-session
conversation = memory.conversation(
    owner=OWNER_ID,
    session_id="example-travel-namespace-session",
    namespace_id=namespace_id,
)
conversation.user("I am visiting Tokyo and Kyoto next month.")
# STEP_END

# STEP_START namespace-shared-create
shared_namespace_id = memory.shared_namespace("example-team-travel")
print("Shared namespace:", shared_namespace_id)
# STEP_END

# STEP_START namespace-shared-remember
memory.remember(
    "The team books refundable rail passes for every Japan trip.",
    owner=OWNER_ID,
    namespace_id=shared_namespace_id,
)
# STEP_END

# STEP_START namespace-shared-recall
known = memory.recall(
    "What travel requirements has the team discussed?",
    owner=OWNER_ID,
    shared=[shared_namespace_id],
)
print(known.as_prompt())
# STEP_END

# STEP_START namespace-place-patch
hotel = memory.remember(
    "The user is staying at a hotel near Gion in Kyoto.",
    owner=OWNER_ID,
    memory_id="example-kyoto-hotel",
)
updated = memory.client.update_long_term_memory(
    memory_id=hotel.id, namespace_id=namespace_id,
)
print(updated.memory_id, "is in", updated.namespace_id)
# STEP_END

# STEP_START namespace-place-move
arrival = memory.remember(
    "The user lands in Tokyo on a Friday evening.",
    owner=OWNER_ID,
    memory_id="example-tokyo-arrival",
)
moved = memory.client.move_long_term_memories(
    memory_ids=[arrival.id], namespace_id=namespace_id,
)
print("Moved:", moved.moved)
for error in moved.errors or []:
    print("Not moved:", error.memory_id, error.status, error.title)
# STEP_END

# STEP_START namespace-place-search
results = memory.client.search_long_term_memory(request={
    "query": "Where is the user staying?",
    "filter_": {
        "owner_id": {"eq": OWNER_ID},
        "namespace_id": {"in": [namespace_id]},
    },
    "limit": 5,
})
for record in results.items:
    print(record.memory_id, record.namespace_id, record.text)
# STEP_END

# STEP_START namespace-child-create
child = memory.client.create_namespace(request={
    "name": "japan",
    "parent_id": namespace_id,
})
print(child.namespace.path, child.namespace.namespace_id)
# STEP_END

# STEP_START namespace-path-create
leaf = memory.client.create_namespace(request={
    "path": "example-travel/kyoto",
    "scope": models.NamespaceScope.PERSONAL,
    "owner_id": OWNER_ID,
})
print(leaf.namespace.path, leaf.namespace.namespace_id)
# STEP_END

# STEP_START namespace-list-children
children = memory.client.list_namespaces(parent_id=namespace_id)
for item in children.items:
    print(item.path, item.namespace_id, item.state)
# STEP_END

# STEP_START namespace-sort
namespaces = memory.client.list_namespaces(
    scope=models.NamespaceScope.SHARED,
    sort_by=models.NamespaceSortBy.NAME,
    sort_order=models.NamespaceSortOrder.ASC,
    limit=20,
)
for item in namespaces.items:
    print(item.name, item.namespace_id)
print("Next cursor:", namespaces.next_cursor)
# STEP_END

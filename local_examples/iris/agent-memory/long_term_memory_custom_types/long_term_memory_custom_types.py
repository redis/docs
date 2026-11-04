# EXAMPLE: iris_agent_memory_long_term_memory_custom_types
# HIDE_START
import time

from redis_iris import Iris

OWNER_ID = "quickstart-user"
memory = Iris.from_env().agent_memory()
# HIDE_END

# STEP_START custom-memory-event
conversation = memory.conversation(owner=OWNER_ID, session_id="example-trip-preference-session")
saved = conversation.user("I am visiting Tokyo and Kyoto next month. I am vegetarian.")
print("Saved event", saved.event_id)
# STEP_END

# STEP_START custom-memory-search
search = {
    "query": "What are the requirements for the user's trip?",
    "filter_": {
        "owner_id": {"eq": OWNER_ID},
        "memory_type": {"eq": "trip_preference"},
    },
    "limit": 5,
}
for _ in range(30):  # extraction runs in the background
    custom_results = memory.client.search_long_term_memory(request=search)
    if custom_results.items:
        break
    time.sleep(10)
for record in custom_results.items:
    print(record.memory_id, record.memory_type, record.attributes)
# STEP_END

# STEP_START custom-memory-fields
dietary_requirements = set()
if not custom_results.items:
    print("No matching trip preferences yet. Retry after a short wait.")
for record in custom_results.items:
    attributes = record.attributes or {}
    requirements = attributes.get("dietary_requirements", [])
    if isinstance(requirements, list):
        dietary_requirements.update(
            value for value in requirements if isinstance(value, str)
        )
print("Restaurant requirements:", sorted(dietary_requirements))
# STEP_END

# STEP_START custom-memory-direct
direct_result = memory.client.bulk_create_long_term_memories(memories=[{
    "memory_id": "example-trip-form-1",
    "text": "The user plans to visit Tokyo and Kyoto next month and requires vegetarian food.",
    "owner_id": OWNER_ID,
    "memory_type": "trip_preference",
    "attributes": {
        "destinations": ["Tokyo", "Kyoto"],
        "travel_period": "next month",
        "dietary_requirements": ["vegetarian"],
        "food_preferences": ["spicy food"],
    },
}])
print("Created:", direct_result.created)
for error in direct_result.errors or []:
    print("Not created:", error)
# STEP_END


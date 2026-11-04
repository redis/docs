# EXAMPLE: iris_agent_memory_namespace_routing
# HIDE_START
from redis_iris import Iris

OWNER_ID = "quickstart-user"

memory = Iris.from_env().agent_memory()
# HIDE_END

# STEP_START namespace-routing-destination
travel_namespace_id = memory.shared_namespace("example-team-travel")
print("Destination:", travel_namespace_id)
# STEP_END

# STEP_START namespace-routing-get
current = memory.client.get_namespace_routing().policy
print(current.model_dump_json(by_alias=True, indent=2))
# STEP_END

# STEP_START namespace-routing-put
travel_rule = {
    "id": "example-travel",
    "enabled": True,
    "action": "ACCEPT",
    "destination_namespace_id": travel_namespace_id,
    "strategies": [{
        "kind": "MATCHER_SPEC",
        "matcher": {"kind": "REGEX", "regex": {"pattern": "(?i)travel"}},
    }],
}
# PUT replaces the whole policy, so keep the rules that are already there.
kept = [rule for rule in current.rules or [] if rule.id != travel_rule["id"]]
saved = memory.client.put_namespace_routing(
    policy={"enabled": True, "rules": [*kept, travel_rule]},
)
print(saved.policy.model_dump_json(by_alias=True, indent=2))
# STEP_END

# STEP_START namespace-routing-source
source_namespace_id = memory.shared_namespace("example-routing-source")
note = memory.remember(
    "Travel policy allows train tickets.",
    owner=OWNER_ID,
    namespace_id=source_namespace_id,
    memory_id="example-routing-travel",
)
# STEP_END

# STEP_START namespace-routing-move
moved = memory.client.move_long_term_memories(memory_ids=[note.id])
print("Moved:", moved.moved)
for error in moved.errors or []:
    print("Not moved:", error.memory_id, error.status, error.title, error.detail)
# STEP_END

# STEP_START namespace-routing-explicit
moved = memory.client.move_long_term_memories(
    memory_ids=[note.id], namespace_id=travel_namespace_id,
)
print("Moved:", moved.moved)
for error in moved.errors or []:
    print("Not moved:", error.memory_id, error.status, error.title, error.detail)
# STEP_END

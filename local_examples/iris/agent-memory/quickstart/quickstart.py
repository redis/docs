# EXAMPLE: iris_agent_memory_quickstart
# STEP_START agent-memory-connect
import time

from redis_iris.agent_memory import AgentMemory

OWNER_ID = "quickstart-user"
SESSION_ID = "travel-planning-session"

memory = AgentMemory.from_env()
health = memory.client.store_health()
print(health.status.value)
for name, feature in health.features.items():
    print(f"  {name}: {feature.status.value}")
# STEP_END

# STEP_START agent-memory-quickstart-save
conversation = memory.conversation(owner=OWNER_ID, session_id=SESSION_ID)
saved = conversation.user(
    "I am visiting Tokyo and Kyoto next month. I am vegetarian and prefer spicy food."
)
print("Saved event", saved.event_id)
# STEP_END

# STEP_START agent-memory-quickstart-transcript
transcript = conversation.transcript()
print("Owner:", transcript.owner)
for event in transcript.events:
    print(event.role, event.actor_id, event.text)
# STEP_END

# STEP_START agent-memory-quickstart-recall
question = "What dietary requirements and food preferences does the user have?"
for _ in range(30):  # extraction runs in the background
    known = memory.recall(question, owner=OWNER_ID)
    if known:
        break
    time.sleep(10)
print(known.as_prompt())
# STEP_END

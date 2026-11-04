# EXAMPLE: iris_agent_memory_sessions
# HIDE_START
import time

from redis_iris import Iris
from redis_iris.agent_memory import models

OWNER_ID = "quickstart-user"
SESSION_ID = "travel-planning-session"

memory = Iris.from_env().agent_memory(assistant_id="travel-agent")
# HIDE_END

# STEP_START agent-memory-sessions-add
conversation = memory.conversation(owner=OWNER_ID, session_id=SESSION_ID)
saved = conversation.user("I am vegetarian.")
print("Saved event", saved.event_id, "in", saved.session_id)
# STEP_END

# STEP_START agent-memory-sessions-retrieve
transcript = conversation.transcript()
if transcript.owner != OWNER_ID:
    raise PermissionError("This session belongs to another user.")
print("Summary:", transcript.summary)
for event in transcript.events:
    print(event.role, event.actor_id, event.text)
# STEP_END

# STEP_START agent-memory-sessions-list-owner
for session_id in memory.sessions(OWNER_ID):
    print(session_id)
# STEP_END

# STEP_START agent-memory-sessions-list-namespace
created = memory.client.create_namespace(
    request={
        "name": "example-travel",
        "scope": models.NamespaceScope.PERSONAL,
        "owner_id": OWNER_ID,
    }
)
NAMESPACE_ID = created.namespace.namespace_id

trip = memory.conversation(
    owner=OWNER_ID, session_id="example-kyoto-trip", namespace_id=NAMESPACE_ID
)
trip.user("Plan two days in Kyoto.")

page = memory.client.list_sessions(namespace_id=NAMESPACE_ID)
for session in page.items:
    print(session.session_id, session.owner_id, session.namespace_id)
# STEP_END

# STEP_START agent-memory-sessions-list-namespace-owner
page = memory.client.list_sessions(namespace_id=NAMESPACE_ID, owner_id=OWNER_ID)
for session in page.items:
    print(session.session_id, session.updated_at)
# STEP_END

# STEP_START agent-memory-sessions-list-all
page = memory.client.list_sessions(include_all=True, limit=20)
for session in page.items:
    print(session.session_id, session.owner_id)
print("Next page:", page.next_cursor)
# STEP_END

# STEP_START agent-memory-sessions-add-turns
turns = [
    ("assistant", "What dates are you traveling?"),
    ("user", "I arrive on October 10 and leave on October 18."),
    ("assistant", "Would you like formal or casual restaurants?"),
    ("user", "Mostly casual places near public transit."),
    ("assistant", "Do you have a preferred budget?"),
    ("user", "About 40 euros per person."),
]
for role, text in turns:
    add = conversation.user if role == "user" else conversation.assistant
    add(text)
# STEP_END

# STEP_START agent-memory-sessions-summary
for _ in range(12):  # summarization runs in the background
    compacted = conversation.transcript()
    if compacted.summary:
        break
    time.sleep(10)
print("Summary:", compacted.summary)
print("Summarized up to event:", compacted.summarized_up_to)
for role, text in compacted.turns:
    print(role, text)
# STEP_END

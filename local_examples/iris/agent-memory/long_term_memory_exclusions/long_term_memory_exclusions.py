# EXAMPLE: iris_agent_memory_long_term_memory_exclusions
# HIDE_START
import time

from redis_iris import Iris

OWNER_ID = "quickstart-user"
SESSION_ID = "travel-planning-session"
memory = Iris.from_env().agent_memory()
# HIDE_END

# STEP_START exclusion-event
conversation = memory.conversation(owner=OWNER_ID, session_id=SESSION_ID)
saved = conversation.user(
    "I booked Hotel Sakura in Tokyo. For this example, "
    "the fictional booking confirmation code is DEMO-7QX9."
)
print("Saved event", saved.event_id)
# STEP_END

# STEP_START exclusion-search
question = "Where is the user staying in Tokyo?"
for _ in range(30):  # extraction runs in the background
    known = memory.recall(question, owner=OWNER_ID)
    if any("Sakura" in found.text for found in known):
        break
    time.sleep(10)
print(known.as_prompt())
# STEP_END

# EXAMPLE: agent_memory_sdk

# STEP_START connect_health_check
import os

from redis_agent_memory import AgentMemory

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"


def check_health():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        health = agent_memory.health()
        print("Service health:")
        print(health.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    check_health()
# STEP_END

# STEP_START add_session_event
import os
from datetime import datetime, timezone

from redis_agent_memory import AgentMemory, models

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = "quickstart-user"


def build_conversation_context():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        event = agent_memory.add_session_event(
            session_id=SESSION_ID,
            actor_id=USER_ID,
            role=models.MessageRole.USER,
            content=[models.Text(
                text=(
                    "I am visiting Tokyo and Kyoto next month. "
                    "I am vegetarian and prefer spicy food."
                ),
            )],
            created_at=datetime.now(timezone.utc),
        )
        print("Created event:")
        print(event.model_dump_json(by_alias=True, indent=2))

        session = agent_memory.get_session_memory(
            session_id=SESSION_ID,
        )
        print("Session memory:")
        print(session.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    build_conversation_context()
# STEP_END

# STEP_START search_long_term_memory_basic
import os

from redis_agent_memory import AgentMemory

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
USER_ID = "quickstart-user"


def recall_extracted_memory():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        results = agent_memory.search_long_term_memory(
            request={
                "text": "What dietary requirements and food preferences does the user have?",
                "filter_": {
                    "owner_id": {
                        "eq": USER_ID,
                    }
                },
                "limit": 5,
            },
        )
        print("Automatically extracted memories:")
        print(results.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    recall_extracted_memory()
# STEP_END

# STEP_START add_conversation_turns
import os
from datetime import datetime, timezone

from redis_agent_memory import AgentMemory, models

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = "quickstart-user"


def add_conversation_turns():
    turns = [
        (models.MessageRole.ASSISTANT, "What dates are you traveling?"),
        (models.MessageRole.USER, "I arrive on October 10 and leave on October 18."),
        (models.MessageRole.ASSISTANT, "Would you like formal or casual restaurants?"),
        (models.MessageRole.USER, "Mostly casual places near public transit."),
        (models.MessageRole.ASSISTANT, "Do you have a preferred budget?"),
        (models.MessageRole.USER, "About 40 euros per person."),
    ]

    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        for role, text in turns:
            agent_memory.add_session_event(
                session_id=SESSION_ID,
                actor_id=USER_ID if role == models.MessageRole.USER else "travel-agent",
                role=role,
                content=[models.Text(text=text)],
                created_at=datetime.now(timezone.utc),
            )


if __name__ == "__main__":
    add_conversation_turns()
# STEP_END

# STEP_START retrieve_session_summary
import os

from redis_agent_memory import AgentMemory

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"


def retrieve_session_summary():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        compacted_session = agent_memory.get_session_memory(
            session_id=SESSION_ID,
        )
        print("Compacted session memory:")
        print(compacted_session.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    retrieve_session_summary()
# STEP_END

# STEP_START search_long_term_memory_custom_type
import os

from redis_agent_memory import AgentMemory

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
USER_ID = "quickstart-user"


def search_custom_memory_type():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        custom_results = agent_memory.search_long_term_memory(
            request={
                "text": "What are the requirements for the user's trip?",
                "filter_": {
                    "owner_id": {"eq": USER_ID},
                    "memory_type": {"eq": "trip_preference"},
                },
                "limit": 5,
            },
        )
        print("Trip preference memories:")
        print(custom_results.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    search_custom_memory_type()
# STEP_END

# STEP_START add_session_event_sensitive
import os
from datetime import datetime, timezone

from redis_agent_memory import AgentMemory, models

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = "quickstart-user"


def add_sensitive_event():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        sensitive_event = agent_memory.add_session_event(
            session_id=SESSION_ID,
            actor_id=USER_ID,
            role=models.MessageRole.USER,
            content=[models.Text(
                text=(
                    "I booked Hotel Sakura in Tokyo. For this example, "
                    "the fictional booking confirmation code is DEMO-7QX9."
                ),
            )],
            created_at=datetime.now(timezone.utc),
        )
        print("Event with excluded information:")
        print(sensitive_event.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    add_sensitive_event()
# STEP_END

# STEP_START search_long_term_memory_exclusion
import os

from redis_agent_memory import AgentMemory

ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
USER_ID = "quickstart-user"


def search_with_exclusion():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        exclusion_results = agent_memory.search_long_term_memory(
            request={
                "text": "Where is the user staying in Tokyo?",
                "filter_": {
                    "owner_id": {"eq": USER_ID},
                },
                "limit": 5,
            },
        )
        print("Memories after semantic exclusion:")
        print(exclusion_results.model_dump_json(by_alias=True, indent=2))


if __name__ == "__main__":
    search_with_exclusion()
# STEP_END

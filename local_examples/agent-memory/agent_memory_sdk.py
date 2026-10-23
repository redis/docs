# EXAMPLE: agent_memory_sdk

# STEP_START connect_health_check
import os
from datetime import datetime, timezone

import httpx
from redis_agent_memory import AgentMemory, models


ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = os.environ.get("OWNER_ID", "quickstart-user")


def show(label, response):
    print(f"{label}:")
    print(response.model_dump_json(by_alias=True, indent=2))


def main():
    with httpx.Client(headers={
        "X-Iris-User-Token": os.environ["USER_TOKEN"],
    } if os.environ.get("USER_TOKEN") else {}) as transport, AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
        client=transport,
    ) as agent_memory:
        health = agent_memory.store_health()
        show("Store health", health)


if __name__ == "__main__":
    main()
# STEP_END

# STEP_START add_session_event
import os
from datetime import datetime, timezone

import httpx
from redis_agent_memory import AgentMemory, models


ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = os.environ.get("OWNER_ID", "quickstart-user")


def show(label, response):
    print(f"{label}:")
    print(response.model_dump_json(by_alias=True, indent=2))


def main():
    with httpx.Client(headers={
        "X-Iris-User-Token": os.environ["USER_TOKEN"],
    } if os.environ.get("USER_TOKEN") else {}) as transport, AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
        client=transport,
    ) as agent_memory:
        health = agent_memory.store_health()
        show("Store health", health)

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
        show("Created event", event)

        session = agent_memory.get_session_memory(
            session_id=SESSION_ID,
        )
        show("Session memory", session)


if __name__ == "__main__":
    main()
# STEP_END

# STEP_START search_long_term_memory_basic
import os
from datetime import datetime, timezone

import httpx
from redis_agent_memory import AgentMemory, models


ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = os.environ.get("OWNER_ID", "quickstart-user")


def show(label, response):
    print(f"{label}:")
    print(response.model_dump_json(by_alias=True, indent=2))


def main():
    with httpx.Client(headers={
        "X-Iris-User-Token": os.environ["USER_TOKEN"],
    } if os.environ.get("USER_TOKEN") else {}) as transport, AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
        client=transport,
    ) as agent_memory:
        health = agent_memory.store_health()
        show("Store health", health)

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
        show("Automatically extracted memories", results)


if __name__ == "__main__":
    main()
# STEP_END

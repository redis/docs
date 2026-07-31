---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect to Redis Cloud Agent Memory with the Python SDK and make session-memory and long-term-memory requests.
hideListLinks: true
linktitle: Python SDK quickstart
title: Redis Agent Memory Python SDK quickstart
weight: 7
---

Use this quickstart to connect to a Redis Cloud Agent Memory service with the Python SDK. You will add and retrieve a session event, create two long-term memories, and search them by meaning.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

You also need Python 3.10 or later.

## Create an Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Save the connection values

1. Open the Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Copy the API key that Redis Cloud displayed when you created the service. If you no longer have the key, [generate a new API key]({{< relref "/operate/rc/context-engine/agent-memory/view-service#replace-service-api-key" >}}).
1. Export the API key in your shell:

    ```sh
    export API_KEY='<API_KEY>'
    ```

Keep the API key out of source control, application logs, and other unsecured locations.

## Install the SDK

Install the `redis-agent-memory` package:

```sh
python -m pip install redis-agent-memory
```

## Create the client and check the service health

Replace `<ENDPOINT>` and `<STORE_ID>` with the values you copied from Redis Cloud. The endpoint must include `https://`.

The client uses these values and the API key from your environment to authenticate each request. Call `health` before writing any memory to verify that the service is reachable and the API key is accepted:

```python
import os
from datetime import datetime, timezone

from redis_agent_memory import AgentMemory, models


ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "quickstart-session"
USER_ID = "quickstart-user"
MEMORY_ID = "quickstart-preference"


def show(label, response):
    print(f"{label}:")
    print(response.model_dump_json(by_alias=True, indent=2))


def main():
    with AgentMemory(
        ENDPOINT,
        store_id=STORE_ID,
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        health = agent_memory.health()
        show("Service health", health)


if __name__ == "__main__":
    main()
```

The health response describes the status of the Agent Memory service. The first store request in the next step validates the Store ID. The context manager closes the SDK client after the requests finish.

## Add a session event

Add a user message to session memory. If the session doesn't exist, Agent Memory creates it when it stores the event.

Add this code after the call to `health`:

```python
        event = agent_memory.add_session_event(
            session_id=SESSION_ID,
            actor_id=USER_ID,
            role=models.MessageRole.USER,
            content=[{"text": "I prefer vegetarian restaurants."}],
            created_at=datetime.now(timezone.utc),
        )
        show("Created event", event)
```

The response contains the stored event and its server-generated event ID.

## Retrieve the session

Retrieve the session to reconstruct its conversation history. Add this code after the call to `add_session_event`:

```python
        session = agent_memory.get_session_memory(
            session_id=SESSION_ID,
        )
        show("Session memory", session)
```

The response contains the session and its stored events, including the event added in the previous step.

## Create long-term memories

Create two long-term memories directly. This lets the quickstart demonstrate semantic ranking without waiting for Agent Memory to extract memories from session events. Add this code after the session retrieval:

```python
        created = agent_memory.bulk_create_long_term_memories(
            memories=[
                {
                    "id": f"{MEMORY_ID}-0",
                    "text": "The user prefers cozy restaurants.",
                    "memory_type": "semantic",
                    "session_id": SESSION_ID,
                    "owner_id": USER_ID,
                },
                {
                    "id": f"{MEMORY_ID}-1",
                    "text": "The user prefers spicy food.",
                    "memory_type": "semantic",
                    "session_id": SESSION_ID,
                    "owner_id": USER_ID,
                },
            ],
        )
        show("Created memories", created)
```

The response has a `created` array containing the IDs of the two long-term memories.

## Search long-term memory

Search by meaning and filter the results to memories associated with the example user. Add this code after the bulk create request:

```python
        results = agent_memory.search_long_term_memory(
            request={
            "text": "What kind of meal does the user prefer?",
                "filter_": {
                    "owner_id": {
                        "eq": USER_ID,
                    }
                },
                "limit": 1,
            },
        )
        show("Search results", results)
```

The response has an `items` array containing the highest-ranked matching memory. The memory about spicy food should be the strongest match for this query.

The Python SDK uses snake case for method arguments and request fields. The serialized API requests and responses use camel case.

## Run the quickstart

Create `quickstart.py` from the complete example in the next section, then run it once:

```sh
python quickstart.py
```

The session, user, and memory IDs are example identifiers. The example uses the same user identifier for the event's `actorId` and the long-term memory's `ownerId`.

The example derives two fixed memory IDs from `MEMORY_ID`. Delete the existing memories or change `MEMORY_ID` before running the program again.

## Complete example

```python
import os
from datetime import datetime, timezone

from redis_agent_memory import AgentMemory, models


ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "quickstart-session"
USER_ID = "quickstart-user"
MEMORY_ID = "quickstart-preference"


def show(label, response):
    print(f"{label}:")
    print(response.model_dump_json(by_alias=True, indent=2))


with AgentMemory(
    ENDPOINT,
    store_id=STORE_ID,
    api_key=os.environ["API_KEY"],
) as agent_memory:
    health = agent_memory.health()
    show("Service health", health)

    event = agent_memory.add_session_event(
        session_id=SESSION_ID,
        actor_id=USER_ID,
        role=models.MessageRole.USER,
        content=[{"text": "I prefer vegetarian restaurants."}],
        created_at=datetime.now(timezone.utc),
    )
    show("Created event", event)

    session = agent_memory.get_session_memory(
        session_id=SESSION_ID,
    )
    show("Session memory", session)

    created = agent_memory.bulk_create_long_term_memories(
        memories=[
            {
                "id": f"{MEMORY_ID}-0",
                "text": "The user prefers cozy restaurants.",
                "memory_type": "semantic",
                "session_id": SESSION_ID,
                "owner_id": USER_ID,
            },
            {
                "id": f"{MEMORY_ID}-1",
                "text": "The user prefers spicy food.",
                "memory_type": "semantic",
                "session_id": SESSION_ID,
                "owner_id": USER_ID,
            },
        ],
    )
    show("Created memories", created)

    results = agent_memory.search_long_term_memory(
        request={
            "text": "What kind of meal does the user prefer?",
            "filter_": {
                "owner_id": {
                    "eq": USER_ID,
                }
            },
            "limit": 1,
        },
    )
    show("Search results", results)
```

## Next steps

- Review the [Python SDK package and reference](https://pypi.org/project/redis-agent-memory/).
- Review the [Agent Memory API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).
- Try the [TypeScript SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}}).

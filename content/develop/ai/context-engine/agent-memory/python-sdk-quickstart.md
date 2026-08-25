---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Explore session memory, automatic extraction, summarization, custom memory types, and sensitive-data exclusions with the Redis Agent Memory Python SDK.
hideListLinks: true
linktitle: Python SDK quickstart
title: Redis Agent Memory Python SDK quickstart
weight: 6
---

Use this quickstart to follow a travel planning conversation through Redis Agent Memory. You will retrieve the conversation from session memory, recall information extracted in the background, inspect an automatically generated session summary, extract structured travel information, and guide extraction away from sensitive data.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

You also need Python 3.10 or later.

## Create a Redis Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Save the connection values

1. Open the Redis Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Export the API key in your shell:

    ```sh
    export API_KEY='<API_KEY>'
    ```

Keep the API key out of source control, application logs, and other unsecured locations.

## Install the SDK

```sh
python -m pip install redis-agent-memory
```

## Create the client and check the service health

Create `quickstart.py` with the following code. Replace `<ENDPOINT>` and `<STORE_ID>` with the values from Redis Cloud. The endpoint must include `https://`.

```python
import os
from datetime import datetime, timezone

from redis_agent_memory import AgentMemory, models


ENDPOINT = "<ENDPOINT>"
STORE_ID = "<STORE_ID>"
SESSION_ID = "travel-planning-session"
USER_ID = "quickstart-user"


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

Run the file:

```sh
python quickstart.py
```

A healthy response confirms that the client can reach Redis Agent Memory and authenticate with the API key. The first store request validates the Store ID.

## 1. Build conversation context with session memory

Session memory stores a conversation as an ordered sequence of events. Add the following code after the health check, inside the `with` block:

```python
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
```

Run the file again. The session response contains the stored message, its role, actor, and timestamps. An application can retrieve this session before the next agent turn and add the events to the model's context.

{{< note >}}
**What to expect:** The `events` array contains the travel message. Redis Agent Memory adds an `eventId` and `systemTimestamp`, showing that the application can recover the complete event later using only the session ID.
{{< /note >}}

After the event is stored, comment out the call to `add_session_event` before subsequent runs to avoid adding the same message again.

## 2. Recall automatically extracted information

Redis Agent Memory processes session events in the background and creates long term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service. You do not need to call a memory creation method.

Wait at least one minute, then add this search after the session retrieval:

```python
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
```

Run the file. The `items` array should contain memories derived from the conversation, such as the vegetarian requirement or preference for spicy food. Extraction is asynchronous, so run the search again if the array is empty.

{{< note >}}
**What to expect:** Results similar to `User is a vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.
{{< /note >}}

The extracted memory remains searchable after the session expires, subject to the long term memory TTL. You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}).

The Python SDK uses snake case for method arguments and request fields. Serialized API requests and responses use camel case.

## 3. Keep long conversations concise with automatic summarization

Automatic summarization condenses older events and retains the most recent events in full. The retrieved session then contains a `summary` object and the recent `events` array, so the application can provide useful history without filling the model's context window with every original message.

You enabled automatic summarization when you created the service. When the session reaches six events, Redis Agent Memory summarizes the older events and retains the two most recent events in full.

### Add conversation turns

Add this code after the first session event to continue the conversation past the configured threshold:

```python
        turns = [
            (models.MessageRole.ASSISTANT, "What dates are you traveling?"),
            (models.MessageRole.USER, "I arrive on October 10 and leave on October 18."),
            (models.MessageRole.ASSISTANT, "Would you like formal or casual restaurants?"),
            (models.MessageRole.USER, "Mostly casual places near public transit."),
            (models.MessageRole.ASSISTANT, "Do you have a preferred budget?"),
            (models.MessageRole.USER, "About 40 euros per person."),
        ]

        for role, text in turns:
            agent_memory.add_session_event(
                session_id=SESSION_ID,
                actor_id=USER_ID if role == models.MessageRole.USER else "travel-agent",
                role=role,
                content=[models.Text(text=text)],
                created_at=datetime.now(timezone.utc),
            )
```

Run the code once, then comment out the loop to avoid adding the same turns again. Summarization runs in the background.

### Retrieve the summarized session

After a short wait, retrieve the session again:

```python
        compacted_session = agent_memory.get_session_memory(
            session_id=SESSION_ID,
        )
        show("Compacted session memory", compacted_session)
```

Run the retrieval again after a short wait if `summary` is not present. Compare `summary.text` with the recent events. The summary should preserve earlier trip decisions while recent turns remain available in full.

{{< note >}}
**What to expect:** A `summary` object that preserves details such as Tokyo, Kyoto, the travel dates, and food preferences. `summarizedUpToEventId` identifies the last event covered by the summary, while `events` contains the newer turns that remain in full. The exact summary text can vary.
{{< /note >}}

See [automatic summarization configuration]({{< relref "/operate/iris/agent-memory/create-service#automatic-summarization" >}}) for details.

## 4. Extract business specific data with a custom memory type

Built in memories preserve generally useful information. Custom memory types let an application extract structured information for its business domain. You configured `trip_preference` when you created the service, so it processed the same travel planning event independently.

Search for the structured memory:

```python
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
        show("Trip preference memories", custom_results)
```

The result uses `trip_preference` as its `memoryType` and contains travel information extracted from the conversation. The exact text and returned fields depend on the conversation, extraction model, and client.

{{< note >}}
**What to expect:** A result with `memoryType` set to `trip_preference` that combines the destinations, travel period, and dietary preferences. This shows that the custom type processed the same conversation independently from the built-in memory types.
{{< /note >}}

See [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) for configuration requirements and limits.

## 5. Guide extraction away from sensitive data

The semantic exclusion prompt tells Redis Agent Memory which information should not be kept in long-term memory. Add an event containing a fictional booking code and information that is safe to retain:

```python
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
        show("Event with excluded information", sensitive_event)
```

Run the code once, then comment out the call to `add_session_event`. Wait at least one minute and search for the safe hotel information:

```python
        exclusion_results = agent_memory.search_long_term_memory(
            request={
                "text": "Where is the user staying in Tokyo?",
                "filter_": {
                    "owner_id": {"eq": USER_ID},
                },
                "limit": 5,
            },
        )
        show("Memories after semantic exclusion", exclusion_results)
```

Inspect the returned memories. They can retain the hotel name, but should not contain `DEMO-7QX9` because the exclusion prompt covers booking confirmation codes.

{{< note >}}
**What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code. If the code appears, refine the exclusion prompt and test again. Exclusions remain advisory.
{{< /note >}}

{{< warning >}}
Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.
{{< /warning >}}

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) for configuration details.

## Next steps

* Review the [Python SDK package and reference](https://pypi.org/project/redis-agent-memory/).
* Try the [TypeScript SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart" >}}) or [REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}).
* Learn when to [create long term memories directly]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#create-long-term-memories" >}}).

---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Store and retrieve a conversation, then recall long-term memory with Python, TypeScript, or curl.
hideListLinks: true
linktitle: Quickstart
title: Redis Agent Memory quickstart
weight: 5
aliases:
- /develop/ai/context-engine/agent-memory/python-sdk-quickstart/
- /develop/ai/context-engine/agent-memory/typescript-sdk-quickstart/
- /develop/ai/context-engine/agent-memory/rest-api-quickstart/
- /develop/ai/context-engine/agent-memory/api-examples/
- /operate/rc/context-engine/agent-memory/use-agent-memory/
---

Store a travel-planning message, retrieve the conversation, and recall a preference extracted into long-term memory. Choose Python, TypeScript, or curl for each example.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

Choose Python, TypeScript, or curl for the examples and use it throughout this page.

{{< multitabs id="prerequisites" tab1="Python" tab2="TypeScript" tab3="curl" >}}

You also need Python 3.10 or later.

-tab-sep-

You also need Node.js and npm.

-tab-sep-

You also need a shell with `curl` and `jq` installed.

{{< /multitabs >}}

## Create a Redis Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Save the connection values

1. Open the Redis Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Export the values for your chosen client in your shell:

{{< multitabs id="connection-values" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```sh
export API_KEY='<API_KEY>'
```

-tab-sep-

```sh
export API_KEY='<API_KEY>'
```

-tab-sep-

```sh
export AGENT_MEMORY_URL='<ENDPOINT>'
export STORE_ID='<STORE_ID>'
export API_KEY='<API_KEY>'
export SESSION_ID='travel-planning-session'
export OWNER_ID='quickstart-user'
```

{{< /multitabs >}}

The endpoint must include `https://`. Keep the API key out of source control, application logs, and other unsecured locations.

## Install the SDK

{{< multitabs id="installation" tab1="Python" tab2="TypeScript" tab3="curl" >}}

Create and activate a virtual environment with [uv](https://docs.astral.sh/uv/):

```sh
uv venv
source .venv/bin/activate
uv pip install "redis-agent-memory==0.4.0"
```

-tab-sep-

```sh
mkdir agent-memory-quickstart
cd agent-memory-quickstart
npm init -y
npm install @redis-iris/agent-memory@0.3.0
npm install --save-dev tsx
```

-tab-sep-

Use `curl` and `jq` directly. No SDK installation is required.

{{< /multitabs >}}

<a id="check-the-service-health"></a>

## Create the client and check the service health

{{< multitabs id="health" tab1="Python" tab2="TypeScript" tab3="curl" >}}

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

-tab-sep-

Create `quickstart.ts` with the following code. Replace `<ENDPOINT>` and `<STORE_ID>` with the values from Redis Cloud. The endpoint must include `https://`.

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("Set the API_KEY environment variable.");
}

const serverURL = "<ENDPOINT>";
const storeId = "<STORE_ID>";
const sessionId = "travel-planning-session";
const userId = "quickstart-user";

const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

async function run() {
  const health = await agentMemory.health();
  console.log("Service health:");
  console.dir(health, { depth: null });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

Run the file:

```sh
npx tsx quickstart.ts
```

-tab-sep-

Verify that the service is available:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/health" | jq
```

{{< /multitabs >}}

A healthy response confirms that the client can reach Redis Agent Memory and authenticate with the API key. The first store request validates the Store ID.

For Python, add subsequent snippets inside the `with` block in `main`. For TypeScript, add them inside `run`. After each step, run `python quickstart.py` or `npx tsx quickstart.ts`. With curl, run each command in the same shell. Run writes once; comment out completed writes and their output statements before rerunning an SDK file.

## 1. Build conversation context with session memory

Session memory stores a conversation as an ordered sequence of events. Add a user message after the health check, then retrieve the session:

{{< multitabs id="session-events" tab1="Python" tab2="TypeScript" tab3="curl" >}}

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

-tab-sep-

```typescript
  const event = await agentMemory.addSessionEvent({
    sessionId,
    actorId: userId,
    role: "USER",
    content: [{
      text: "I am visiting Tokyo and Kyoto next month. I am vegetarian and prefer spicy food.",
    }],
    createdAt: new Date(),
  });
  console.log("Created event:");
  console.dir(event, { depth: null });

  const session = await agentMemory.getSessionMemory(sessionId);
  console.log("Session memory:");
  console.dir(session, { depth: null });
```

-tab-sep-

```sh
export EVENT_CREATED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"

curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/events" <<JSON | jq
{
  "sessionId": "$SESSION_ID",
  "actorId": "$OWNER_ID",
  "role": "USER",
  "content": [
    {
      "text": "I am visiting Tokyo and Kyoto next month. I am vegetarian and prefer spicy food."
    }
  ],
  "createdAt": "$EVENT_CREATED_AT"
}
JSON
```

Retrieve the session:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/$SESSION_ID" | jq
```

{{< /multitabs >}}

Run the example. The session response contains the stored message, its role, actor, and timestamps. An application can retrieve this session before the next agent turn and add the events to the model's context.

> [!NOTE]
> **What to expect:** The `events` array contains the travel message. Redis Agent Memory adds an `eventId` and `systemTimestamp`, showing that the application can recover the complete event later using only the session ID.

Run the event write once. In the SDK files, comment out event creation and its output statements before subsequent runs. Keep the session retrieval.


## 2. Recall automatically extracted information

Redis Agent Memory processes session events in the background and creates long-term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service.

Wait at least one minute, then add this search after the session retrieval:

{{< multitabs id="memory-search" tab1="Python" tab2="TypeScript" tab3="curl" >}}

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

-tab-sep-

```typescript
  const results = await agentMemory.searchLongTermMemory({
    text: "What dietary requirements and food preferences does the user have?",
    filter: {
      ownerId: {
        eq: userId,
      },
    },
    limit: 5,
  });
  console.log("Automatically extracted memories:");
  console.dir(results, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "What dietary requirements and food preferences does the user have?",
  "filter": {
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 5
}
JSON
```

{{< /multitabs >}}

Run the search. The `items` array should contain memories derived from the conversation, such as the vegetarian requirement or preference for spicy food. Extraction is asynchronous, so run the search again if the array is empty.

> [!NOTE]
> **What to expect:** Results similar to `User is a vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.

The extracted memory remains searchable after the session expires, subject to the long-term memory time to live (TTL). You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}).

## Next steps

Follow the [developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}) to use memory in an agent’s request cycle. For specific features, see [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}), [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}), and [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}).

---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect to Redis Agent Memory on Redis Cloud with the TypeScript SDK and make session-memory and long-term-memory requests.
hideListLinks: true
linktitle: TypeScript SDK quickstart
title: Redis Agent Memory TypeScript SDK quickstart
weight: 7
---

Use this quickstart to connect to a Redis Agent Memory service on Redis Cloud with the TypeScript SDK. You will add and retrieve a session event, create two long-term memories, and search them.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

You also need Node.js and npm.

## Create a Redis Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Save the connection values

1. Open the Redis Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Copy the API key that Redis Cloud displayed when you created the service. If you no longer have the key, [generate a new API key]({{< relref "/operate/iris/agent-memory/view-service#replace-service-api-key" >}}).
1. Export the API key in your shell:

    ```sh
    export API_KEY='<API_KEY>'
    ```

Keep the API key out of source control, application logs, and other unsecured locations.

## Install the SDK

Create a project and install the Redis Agent Memory SDK:

```sh
mkdir agent-memory-quickstart
cd agent-memory-quickstart
npm init -y
npm install @redis-iris/agent-memory
npm install --save-dev tsx
```

## Create the client and check the service health

In the code sample, replace `<ENDPOINT>` and `<STORE_ID>` with the values you copied from the service's **Configuration** tab. The endpoint must include `https://`.

The session, user, and memory IDs are example identifiers defined in the code. This quickstart uses the same user identifier for the event's `actorId` and the long-term memory's `ownerId`.

Create a file named `quickstart.ts` and initialize an `AgentMemory` client. The client uses the endpoint, Store ID, and API key to send requests to your Redis Agent Memory service.

Call `health` before writing any memory to verify that the service is reachable and accepts the API key:

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("Set the API_KEY environment variable.");
}

const serverURL = "<ENDPOINT>";
const storeId = "<STORE_ID>";
const sessionId = "quickstart-session";
const userId = "quickstart-user";
const memoryId = "quickstart-preference";

const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

async function run() {
  const health = await agentMemory.health();
  console.log("Health check:");
  console.dir(health, { depth: null });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

A successful health check confirms that the service is reachable and accepts the API key. The first store request validates the Store ID.

## Add a session event

A session contains an ordered sequence of events. Add the following code inside `run`, after the health check, to add a user message to the example session:

```typescript
  const event = await agentMemory.addSessionEvent({
    sessionId,
    actorId: userId,
    role: "USER",
    content: [{ text: "I prefer vegetarian restaurants." }],
    createdAt: new Date(),
  });
  console.log("Created event:");
  console.dir(event, { depth: null });
```

A successful request returns the stored event, including its generated event ID and system timestamp. If the session does not exist, Redis Agent Memory creates it when the event is added.

## Retrieve the session

Retrieve the session to access its stored events. Add this code to `run` after the call to `addSessionEvent`:

```typescript
  const session = await agentMemory.getSessionMemory(
    sessionId,
  );
  console.log("Session memory:");
  console.dir(session, { depth: null });
```

The response contains the session and the events currently stored for it.

## Create long-term memories

Long-term memories can be extracted from session events or written directly. This quickstart writes two memories directly so you can search them immediately and see semantic ranking in the results. Add this code after the session retrieval:

```typescript
  const created = await agentMemory.bulkCreateLongTermMemories({
    memories: [
      {
        id: `${memoryId}-0`,
        text: "The user prefers cozy restaurants.",
        memoryType: "semantic",
        sessionId,
        ownerId: userId,
      },
      {
        id: `${memoryId}-1`,
        text: "The user prefers spicy food.",
        memoryType: "semantic",
        sessionId,
        ownerId: userId,
      },
    ],
  });
  console.log("Created memories:");
  console.dir(created, { depth: null });
```

The response contains a `created` array with the ID of each long-term memory created by the request.

## Search long-term memory

Search uses the meaning of the query to rank relevant long-term memories. The owner filter restricts the results to memories associated with the example user, and `limit: 1` returns only the strongest match. Add this code after the bulk create request:

```typescript
  const results = await agentMemory.searchLongTermMemory({
    text: "What kind of meal does the user prefer?",
    filter: {
      ownerId: {
        eq: userId,
      },
    },
    limit: 1,
  });
  console.log("Search results:");
  console.dir(results, { depth: null });
```

The response contains an `items` array with the matching long-term memories. The memory about spicy food should be the strongest semantic match for this query.

## Run the quickstart

Run the completed file once:

```sh
npx tsx quickstart.ts
```

The program prints:

- The health check response.
- The session event and its generated event ID.
- The session and its stored events.
- A `created` array containing the two long-term memory IDs.
- An `items` array containing the strongest match for the semantic search. The result should be the memory about spicy food.

The example derives two fixed memory IDs from `memoryId`. Delete the existing memories or change `memoryId` before running the program again.

## Complete example

Your completed `quickstart.ts` file should contain:

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";

const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("Set the API_KEY environment variable.");
}

const serverURL = "<ENDPOINT>";
const storeId = "<STORE_ID>";
const sessionId = "quickstart-session";
const userId = "quickstart-user";
const memoryId = "quickstart-preference";

const agentMemory = new AgentMemory({
  serverURL,
  storeId,
  apiKey,
});

async function run() {
  const health = await agentMemory.health();
  console.log("Health check:");
  console.dir(health, { depth: null });

  const event = await agentMemory.addSessionEvent({
    sessionId,
    actorId: userId,
    role: "USER",
    content: [{ text: "I prefer vegetarian restaurants." }],
    createdAt: new Date(),
  });
  console.log("Created event:");
  console.dir(event, { depth: null });

  const session = await agentMemory.getSessionMemory(
    sessionId,
  );
  console.log("Session memory:");
  console.dir(session, { depth: null });

  const created = await agentMemory.bulkCreateLongTermMemories({
    memories: [
      {
        id: `${memoryId}-0`,
        text: "The user prefers cozy restaurants.",
        memoryType: "semantic",
        sessionId,
        ownerId: userId,
      },
      {
        id: `${memoryId}-1`,
        text: "The user prefers spicy food.",
        memoryType: "semantic",
        sessionId,
        ownerId: userId,
      },
    ],
  });
  console.log("Created memories:");
  console.dir(created, { depth: null });

  const results = await agentMemory.searchLongTermMemory({
    text: "What kind of meal does the user prefer?",
    filter: {
      ownerId: {
        eq: userId,
      },
    },
    limit: 1,
  });
  console.log("Search results:");
  console.dir(results, { depth: null });
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

## Next steps

- Review the [TypeScript SDK package and reference](https://www.npmjs.com/package/@redis-iris/agent-memory).
- Review the [Redis Agent Memory API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).
- Try the [Python SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}}).

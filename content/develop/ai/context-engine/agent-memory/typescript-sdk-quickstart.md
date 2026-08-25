---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Explore session memory, automatic extraction, summarization, custom memory types, and sensitive-data exclusions with the Redis Agent Memory TypeScript SDK.
hideListLinks: true
linktitle: TypeScript SDK quickstart
title: Redis Agent Memory TypeScript SDK quickstart
weight: 7
---

Use this quickstart to follow a travel planning conversation through Redis Agent Memory. You will retrieve the conversation from session memory, recall information extracted in the background, inspect an automatically generated session summary, extract structured travel information, and guide extraction away from sensitive data.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

You also need Node.js and npm.

## Create a Redis Agent Memory service

1. Sign in to the [Redis Cloud console](https://cloud.redis.io/).
1. Select **Agent Memory** from the navigation menu.
1. If Redis Cloud displays the public preview terms, review and accept them.
1. Select **Create custom service**.
1. Enter a service name, select an eligible database, and select its `default` user.
1. Under **Memory configuration**, enter these values:

    | Setting | Value | What it controls |
    |:--------|:------|:-----------------|
    | **Short-term TTL** | `1` day | How long session memory is retained. |
    | **Long-term TTL** | `365` days | How long long-term memories are retained. |
    | **Extraction cadence** | `1` minute | How often session events are processed for extraction. One minute is for this quickstart; use a longer production interval unless you need rapid extraction. |
    | **Automatic summarization** | Enabled | Whether older session events are condensed into a summary. |
    | **Summarize after (messages)** | `6` | The event count that triggers summarization. Six is for this quickstart; use a higher production threshold. |
    | **Keep most recent (messages)** | `2` | How many recent events remain in full. Two is for this quickstart; retain more in production when recent turns are needed. |

1. Under **Memory types & extraction**, select **Add type** and configure this custom memory type:

    | Setting | Value | What it controls |
    |:--------|:------|:-----------------|
    | **Name** | `trip_preference` | The identifier stored in `memoryType` and used in search filters. |
    | **Description** | `Structured requirements for a planned trip` | The purpose of the custom memory type. |
    | **Extraction prompt** | `Extract trip requirements only when the user states a destination or travel plan. Preserve explicit dietary requirements and food preferences.` | When to create the memory and which information to capture. |
    | **Enabled** | Enabled | Whether new memories of this type are extracted. |

1. Add these custom fields:

    | Field | Type | Description |
    |:------|:-----|:------------|
    | `destinations` | `list[str]` | Cities or countries the user plans to visit. |
    | `travel_period` | `str` | When the user plans to travel. |
    | `dietary_requirements` | `list[str]` | Dietary requirements that affect recommendations. |
    | `food_preferences` | `list[str]` | Cuisines, flavors, or dining preferences stated by the user. |

1. Under **Sensitive-data exclusions**, enable **Semantic exclusions** and enter this exclusion prompt:

    ```text
    Do not keep passwords, access tokens, recovery codes, payment card information, or booking confirmation codes in long-term memory.
    ```

1. Select **Create**.
1. Copy the Redis Agent Memory API key and store it securely.

{{< warning >}}
Redis Cloud displays the Redis Agent Memory API key only once. If you lose it, [generate a new API key]({{< relref "/operate/iris/agent-memory/view-service#replace-service-api-key" >}}).
{{< /warning >}}

These settings keep the background stages short enough to observe during the quickstart. For screenshots and configuration details, see [create a Redis Agent Memory service]({{< relref "/operate/iris/agent-memory/create-service" >}}).

{{< warning >}}
Sensitive-data exclusions guide the extraction model but do not guarantee exclusion. Sensitive session content still reaches the model provider. Exclusions do not apply when an application creates long-term memories directly.
{{< /warning >}}

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
mkdir agent-memory-quickstart
cd agent-memory-quickstart
npm init -y
npm install @redis-iris/agent-memory
npm install --save-dev tsx
```

## Create the client and check the service health

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

A healthy response confirms that the client can reach Redis Agent Memory and authenticate with the API key. The first store request validates the Store ID.

## 1. Build conversation context with session memory

Session memory stores a conversation as an ordered sequence of events. Add the following code after the health check, inside `run`:

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

Run the file again. The session response contains the stored message, its role, actor, and timestamps. An application can retrieve this session before the next agent turn and add the events to the model's context.

{{% note %}}
**What to expect:** The `events` array contains the travel message. Redis Agent Memory adds an `eventId` and `systemTimestamp`, showing that the application can recover the complete event later using only the session ID.
{{% /note %}}

After the event is stored, comment out the call to `addSessionEvent` before subsequent runs to avoid adding the same message again.

## 2. Recall automatically extracted information

Redis Agent Memory processes session events in the background and creates long term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service. You do not need to call a memory creation method.

Wait at least one minute, then add this search after the session retrieval:

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

Run the file. The `items` array should contain memories derived from the conversation, such as the vegetarian requirement or preference for spicy food. Extraction is asynchronous, so run the search again if the array is empty.

{{% note %}}
**What to expect:** Results similar to `User is a vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.
{{% /note %}}

The extracted memory remains searchable after the session expires, subject to the long term memory TTL. You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}).

## 3. Keep long conversations concise with automatic summarization

Automatic summarization condenses older events and retains the most recent events in full. The retrieved session then contains a `summary` object and the recent `events` array, so the application can provide useful history without filling the model's context window with every original message.

You enabled automatic summarization when you created the service. When the session reaches six events, Redis Agent Memory summarizes the older events and retains the two most recent events in full.

### Add conversation turns

Add this code after the first session event to continue the conversation past the configured threshold:

```typescript
  const turns = [
    { role: "ASSISTANT", actorId: "travel-agent", text: "What dates are you traveling?" },
    { role: "USER", actorId: userId, text: "I arrive on October 10 and leave on October 18." },
    { role: "ASSISTANT", actorId: "travel-agent", text: "Would you like formal or casual restaurants?" },
    { role: "USER", actorId: userId, text: "Mostly casual places near public transit." },
    { role: "ASSISTANT", actorId: "travel-agent", text: "Do you have a preferred budget?" },
    { role: "USER", actorId: userId, text: "About 40 euros per person." },
  ] as const;

  for (const turn of turns) {
    await agentMemory.addSessionEvent({
      sessionId,
      actorId: turn.actorId,
      role: turn.role,
      content: [{ text: turn.text }],
      createdAt: new Date(),
    });
  }
```

Run the code once, then comment out the loop to avoid adding the same turns again. Summarization runs in the background.

### Retrieve the summarized session

After a short wait, retrieve the session again:

```typescript
  const compactedSession = await agentMemory.getSessionMemory(sessionId);
  console.log("Compacted session memory:");
  console.dir(compactedSession, { depth: null });
```

Run the retrieval again after a short wait if `summary` is not present. Compare `summary.text` with the recent events. The summary should preserve earlier trip decisions while recent turns remain available in full.

{{% note %}}
**What to expect:** A `summary` object that preserves details such as Tokyo, Kyoto, the travel dates, and food preferences. `summarizedUpToEventId` identifies the last event covered by the summary, while `events` contains the newer turns that remain in full. The exact summary text can vary.
{{% /note %}}

See [automatic summarization configuration]({{< relref "/operate/iris/agent-memory/create-service#automatic-summarization" >}}) for details.

## 4. Extract business specific data with a custom memory type

Built in memories preserve generally useful information. Custom memory types let an application extract structured information for its business domain. You configured `trip_preference` when you created the service, so it processed the same travel planning event independently.

Search for the structured memory:

```typescript
  const customResults = await agentMemory.searchLongTermMemory({
    text: "What are the requirements for the user's trip?",
    filter: {
      ownerId: { eq: userId },
      memoryType: { eq: "trip_preference" },
    },
    limit: 5,
  });
  console.log("Trip preference memories:");
  console.dir(customResults, { depth: null });
```

The result uses `trip_preference` as its `memoryType` and contains travel information extracted from the conversation. The exact text and returned fields depend on the conversation, extraction model, and client.

{{% note %}}
**What to expect:** A result with `memoryType` set to `trip_preference` that combines the destinations, travel period, and dietary preferences. This shows that the custom type processed the same conversation independently from the built-in memory types.
{{% /note %}}

See [custom memory types]({{< relref "/operate/iris/agent-memory/create-service#custom-memory-types" >}}) for configuration requirements and limits.

## 5. Guide extraction away from sensitive data

The semantic exclusion prompt tells Redis Agent Memory which information should not be kept in long-term memory. Add an event containing a fictional booking code and information that is safe to retain:

```typescript
  const sensitiveEvent = await agentMemory.addSessionEvent({
    sessionId,
    actorId: userId,
    role: "USER",
    content: [{
      text: "I booked Hotel Sakura in Tokyo. For this example, the fictional booking confirmation code is DEMO-7QX9.",
    }],
    createdAt: new Date(),
  });
  console.log("Event with excluded information:");
  console.dir(sensitiveEvent, { depth: null });
```

Run the code once, then comment out the call to `addSessionEvent`. Wait at least one minute and search for the safe hotel information:

```typescript
  const exclusionResults = await agentMemory.searchLongTermMemory({
    text: "Where is the user staying in Tokyo?",
    filter: {
      ownerId: { eq: userId },
    },
    limit: 5,
  });
  console.log("Memories after semantic exclusion:");
  console.dir(exclusionResults, { depth: null });
```

Inspect the returned memories. They can retain the hotel name, but should not contain `DEMO-7QX9` because the exclusion prompt covers booking confirmation codes.

{{% note %}}
**What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code. If the code appears, refine the exclusion prompt and test again. Exclusions remain advisory.
{{% /note %}}

{{< warning >}}
Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.
{{< /warning >}}

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) for configuration details.

## Next steps

* Review the [TypeScript SDK package and reference](https://www.npmjs.com/package/@redis-iris/agent-memory).
* Try the [Python SDK quickstart]({{< relref "/develop/ai/context-engine/agent-memory/python-sdk-quickstart" >}}) or [REST API quickstart]({{< relref "/develop/ai/context-engine/agent-memory/rest-api-quickstart" >}}).
* Learn when to [create long term memories directly]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#create-long-term-memories" >}}).

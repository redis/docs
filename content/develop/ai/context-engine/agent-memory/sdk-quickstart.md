---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Explore session memory, automatic extraction, summarization, custom memory types, and sensitive-data exclusions with the Redis Agent Memory Python and TypeScript SDKs.
hideListLinks: true
linktitle: SDK quickstart
title: Redis Agent Memory SDK quickstart
weight: 6
aliases:
- /develop/ai/context-engine/agent-memory/python-sdk-quickstart/
- /develop/ai/context-engine/agent-memory/typescript-sdk-quickstart/
---

Use this quickstart to follow a travel planning conversation through Redis Agent Memory. You will retrieve the conversation from session memory, recall information extracted in the background, inspect an automatically generated session summary, extract structured travel information, and guide extraction away from sensitive data.

## Before you begin

To complete this quickstart, you need:

{{< embed-md "rc-agent-memory-quickstart-prerequisites.md" >}}

You also need Python 3.10 or later, or Node.js and npm.

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

{{< multitabs id="agent-memory-install"
    tab1="Python"
    tab2="TypeScript" >}}

```sh
python -m pip install redis-agent-memory
```

-tab-sep-

```sh
mkdir agent-memory-quickstart
cd agent-memory-quickstart
npm init -y
npm install @redis-iris/agent-memory
npm install --save-dev tsx
```

{{< /multitabs >}}

## Create the client and check the service health

Create `quickstart.py` or `quickstart.ts` with the following code. Replace `<ENDPOINT>` and `<STORE_ID>` with the values from Redis Cloud. The endpoint must include `https://`.

{{< clients-example set="agent_memory_sdk" step="connect_health_check" footer="hide" description="Construct the client and check that Redis Agent Memory is reachable" difficulty="beginner" >}}{{< /clients-example >}}

Run the file:

```sh
python quickstart.py
```

or:

```sh
npx tsx quickstart.ts
```

A healthy response confirms that the client can reach Redis Agent Memory and authenticate with the API key. The first store request validates the Store ID.

## 1. Build conversation context with session memory

Session memory stores a conversation as an ordered sequence of events.

{{< clients-example set="agent_memory_sdk" step="add_session_event" footer="hide" description="Add a session event, then retrieve the session" difficulty="beginner" >}}{{< /clients-example >}}

Run the example. The session response contains the stored message, its role, actor, and timestamps. An application can retrieve this session before the next agent turn and add the events to the model's context.

> [!NOTE]
> **What to expect:** The `events` array contains the travel message. Redis Agent Memory adds an `eventId` and `systemTimestamp`, showing that the application can recover the complete event later using only the session ID.

Run this example only once. Running it again adds the same message a second time.

## 2. Recall automatically extracted information

Redis Agent Memory processes session events in the background and creates long term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service. You do not need to call a memory creation method.

Wait at least one minute after completing the previous step, then run this search:

{{< clients-example set="agent_memory_sdk" step="search_long_term_memory_basic" footer="hide" description="Search long-term memory for automatically extracted information" difficulty="beginner" >}}{{< /clients-example >}}

The `items` array should contain memories derived from the conversation, such as the vegetarian requirement or preference for spicy food. Extraction is asynchronous, so run the search again if the array is empty.

> [!NOTE]
> **What to expect:** Results similar to `User is a vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.

The extracted memory remains searchable after the session expires, subject to the long term memory TTL. You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration](/content/operate/iris/agent-memory/create-service.md#memory-configuration).

The Python SDK uses snake case for method arguments and request fields. The TypeScript SDK uses camel case. Serialized API requests and responses always use camel case.

## 3. Keep long conversations concise with automatic summarization

Automatic summarization condenses older events and retains the most recent events in full. The retrieved session then contains a `summary` object and the recent `events` array, so the application can provide useful history without filling the model's context window with every original message.

You enabled automatic summarization when you created the service. When the session reaches six events, Redis Agent Memory summarizes the older events and retains the two most recent events in full.

### Add conversation turns

Continue the conversation past the configured threshold:

{{< clients-example set="agent_memory_sdk" step="add_conversation_turns" footer="hide" description="Add several more session events to trigger summarization" difficulty="beginner" >}}{{< /clients-example >}}

Run this example only once. Summarization runs in the background.

### Retrieve the summarized session

After a short wait, retrieve the session again:

{{< clients-example set="agent_memory_sdk" step="retrieve_session_summary" footer="hide" description="Retrieve the session after it has been summarized" difficulty="beginner" >}}{{< /clients-example >}}

Run the retrieval again after a short wait if `summary` is not present. Compare `summary.text` with the recent events. The summary should preserve earlier trip decisions while recent turns remain available in full.

> [!NOTE]
> **What to expect:** A `summary` object that preserves details such as Tokyo, Kyoto, the travel dates, and food preferences. `summarizedUpToEventId` identifies the last event covered by the summary, while `events` contains the newer turns that remain in full. The exact summary text can vary.

See [automatic summarization configuration](/content/operate/iris/agent-memory/create-service.md#automatic-summarization) for details.

## 4. Extract business specific data with a custom memory type

Built in memories preserve generally useful information. Custom memory types let an application extract structured information for its business domain. You configured `trip_preference` when you created the service, so it processed the same travel planning event independently.

Search for the structured memory:

{{< clients-example set="agent_memory_sdk" step="search_long_term_memory_custom_type" footer="hide" description="Search long-term memory filtered to a custom memory type" difficulty="intermediate" >}}{{< /clients-example >}}

The result uses `trip_preference` as its `memoryType` and contains travel information extracted from the conversation. The exact text and returned fields depend on the conversation, extraction model, and client.

> [!NOTE]
> **What to expect:** A result with `memoryType` set to `trip_preference` that combines the destinations, travel period, and dietary preferences. This shows that the custom type processed the same conversation independently from the built-in memory types.

See [custom memory types](/content/operate/iris/agent-memory/create-service.md#custom-memory-types) for configuration requirements and limits.

## 5. Guide extraction away from sensitive data

The semantic exclusion prompt tells Redis Agent Memory which information should not be kept in long-term memory. Add an event containing a fictional booking code and information that is safe to retain:

{{< clients-example set="agent_memory_sdk" step="add_session_event_sensitive" footer="hide" description="Add a session event containing a fictional sensitive booking code" difficulty="intermediate" >}}{{< /clients-example >}}

Run this example only once. Wait at least one minute, then search for the safe hotel information:

{{< clients-example set="agent_memory_sdk" step="search_long_term_memory_exclusion" footer="hide" description="Search long-term memory to confirm the sensitive value was excluded" difficulty="intermediate" >}}{{< /clients-example >}}

Inspect the returned memories. They can retain the hotel name, but should not contain `DEMO-7QX9` because the exclusion prompt covers booking confirmation codes.

> [!NOTE]
> **What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code. If the code appears, refine the exclusion prompt and test again. Exclusions remain advisory.

&nbsp;

> [!WARNING]
> Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.

See [sensitive-data exclusions](/content/operate/iris/agent-memory/create-service.md#sensitive-data-exclusions) for configuration details.

## Next steps

* Review the [Python SDK package and reference](https://pypi.org/project/redis-agent-memory/) or the [TypeScript SDK package and reference](https://www.npmjs.com/package/@redis-iris/agent-memory).
* Try the [REST API quickstart](/content/develop/ai/context-engine/agent-memory/rest-api-quickstart.md).
* Learn when to [create long term memories directly](/content/develop/ai/context-engine/agent-memory/developer-guide.md#create-long-term-memories).

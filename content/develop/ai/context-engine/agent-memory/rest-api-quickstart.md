---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Explore session memory, automatic extraction, summarization, custom memory types, and sensitive-data exclusions with the Redis Agent Memory REST API.
hideListLinks: true
linktitle: REST quickstart
title: Redis Agent Memory REST API quickstart
weight: 8
aliases:
- /operate/rc/context-engine/agent-memory/use-agent-memory/
- /develop/ai/context-engine/agent-memory/api-examples/
---

Use this quickstart to follow a travel planning conversation through Redis Agent Memory. You will retrieve the conversation from session memory, recall information extracted in the background, inspect an automatically generated session summary, extract structured travel information, and guide extraction away from sensitive data.

## Before you begin

To complete this quickstart, you need:

* A Redis Cloud account that can create Redis Agent Memory services.
* An eligible Redis Cloud database, or permission to create one.
* A shell with `curl` and `jq` installed.

## Create a Redis Agent Memory service

{{< embed-md "rc-agent-memory-quickstart-create-service.md" >}}

## Save the connection values

1. Open the Redis Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Export the values in your shell:

    ```sh
    export AGENT_MEMORY_URL='<ENDPOINT>'
    export STORE_ID='<STORE_ID>'
    export API_KEY='<API_KEY>'
    export SESSION_ID='travel-planning-session'
    export OWNER_ID='quickstart-user'
    ```

`AGENT_MEMORY_URL` must include `https://`. Keep the API key out of source control, application logs, and other unsecured locations.

## Check the service health

Verify that the service is available:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/health" | jq
```

## Create a namespace

Create a personal namespace for the user's travel memories. Run this request once and keep the returned ID in your shell:

```sh
NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg owner "$OWNER_ID" \
    '{name: "travel", scope: "PERSONAL", ownerId: $owner}')" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/namespaces" | jq -er '.namespace.namespaceId')
export NAMESPACE_ID
printf '%s\n' "$NAMESPACE_ID"
```

Continue only after the request succeeds and prints a namespace ID. Save that ID for later runs. Creating the same namespace again returns `409 Conflict`; use the existing namespace ID instead. If you lose the ID, list personal roots with `GET /v1/stores/{storeId}/namespaces?scope=PERSONAL&ownerId=<owner-id>`.

Use a fresh `SESSION_ID` if you already ran this quickstart without a namespace. The session events will reference this namespace, and memories extracted from the session will use it.

## 1. Build conversation context with session memory

Session memory stores a conversation as an ordered sequence of events. Add a user message that contains details the travel agent will need later:

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
  "namespaceRef": {"namespaceId": "$NAMESPACE_ID"},
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

The `events` array contains the stored message, its role, actor, and timestamps. An application can retrieve this session before the next agent turn and add the events to the model's context.

> [!NOTE]
> **What to expect:** The `events` array contains the travel message. Redis Agent Memory adds an `eventId` and `systemTimestamp`, showing that the application can recover the complete event later using only the session ID.

## 2. Recall automatically extracted information

Redis Agent Memory processes session events in the background and creates long term memories for information that may be useful in later conversations. You configured the extraction cadence to one minute when you created the service. You do not need to submit a separate memory creation request.

Wait at least one minute, then search for the user's dietary requirements:

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
    "namespaceRef": {"eq": "$NAMESPACE_ID"},
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 5
}
JSON
```

The `items` array should contain memories derived from the conversation, such as the vegetarian requirement or preference for spicy food. Extraction is asynchronous, so run the search again if the array is empty.

> [!NOTE]
> **What to expect:** Results similar to `User is a vegetarian` and `User prefers spicy food`. Your application did not create these memories directly. Redis Agent Memory derived them from the session event. The exact text and memory types can vary.

The extracted memory remains searchable after the session expires, subject to the long term memory TTL. You can change the extraction cadence and both TTLs in the [Redis Agent Memory service configuration](/content/operate/iris/agent-memory/create-service.md#memory-configuration).

## 3. Keep long conversations concise with automatic summarization

Automatic summarization condenses older events and retains the most recent events in full. The retrieved session then contains a `summary` object and the recent `events` array, so the application can provide useful history without filling the model's context window with every original message.

You enabled automatic summarization when you created the service. When the session reaches six events, Redis Agent Memory summarizes the older events and retains the two most recent events in full.

### Add conversation turns

Add enough user and assistant events to reach the configured threshold. Use the request from the first step and change `role`, `actorId`, `content`, and `createdAt` for each event. The Python and TypeScript quickstarts use six additional turns about travel dates, restaurant style, and budget.

Summarization runs in the background after the session reaches the threshold.

### Retrieve the summarized session

After a short wait, retrieve the session again:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/$SESSION_ID" | jq
```

Repeat the retrieval after a short wait if `summary` is not present. Compare `summary.text` with the recent events. The summary should preserve earlier decisions about the trip while recent turns remain available in full.

> [!NOTE]
> **What to expect:** A `summary` object that preserves details such as Tokyo, Kyoto, the travel dates, and food preferences. `summarizedUpToEventId` identifies the last event covered by the summary, while `events` contains the newer turns that remain in full. The exact summary text can vary.

See [automatic summarization configuration](/content/operate/iris/agent-memory/create-service.md#automatic-summarization) for details.

## 4. Extract business specific data with a custom memory type

Built in memories preserve generally useful information. Custom memory types let an application extract structured information for its business domain. You configured `trip_preference` when you created the service, so it processed the same travel planning event independently.

Search for the structured memory:

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "What are the requirements for the user's trip?",
  "filter": {
    "namespaceRef": {"eq": "$NAMESPACE_ID"},
    "ownerId": {
      "eq": "$OWNER_ID"
    },
    "memoryType": {
      "eq": "trip_preference"
    }
  },
  "limit": 5
}
JSON
```

The `items` array contains records with `memoryType` set to `trip_preference`. Custom fields are inside each record's `attributes` object. For example, a result can include this excerpt:

```json
{
  "memoryType": "trip_preference",
  "attributes": {
    "destinations": ["Tokyo", "Kyoto"],
    "travel_period": "next month",
    "dietary_requirements": ["vegetarian"],
    "food_preferences": ["spicy food"]
  }
}
```

The values depend on the conversation and extraction model. An application can use `dietary_requirements` to constrain restaurant recommendations, while `food_preferences` helps rank suitable choices. Check that each field is present and has the expected type before using it.

To inspect the structured fields, run the search with this `jq` filter in place of the final `jq` command:

```sh
jq 'if (.items | length) == 0 then
      {status: "No matching trip preferences yet. Retry after a short wait."}
    else
      .items[] | {id, attributes}
    end'
```

If results remain empty, check that the type is enabled and that the owner and namespace IDs match the stored records. An empty result does not mean the user has no dietary requirements.

### Create a custom memory directly

If your application already has structured trip data, write it directly using the registered `trip_preference` type. This optional example represents data from a form and uses the same namespace:

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory" <<JSON | jq
{
  "memories": [{
    "id": "trip-form-1",
    "text": "The user plans to visit Tokyo and Kyoto next month and requires vegetarian food.",
    "ownerId": "$OWNER_ID",
    "memoryType": "trip_preference",
    "namespaceRef": {"namespaceId": "$NAMESPACE_ID"},
    "attributes": {
      "destinations": ["Tokyo", "Kyoto"],
      "travel_period": "next month",
      "dietary_requirements": ["vegetarian"],
      "food_preferences": ["spicy food"]
    }
  }]
}
JSON
```

Inspect the bulk response for per-record errors. Run the custom-memory search again to retrieve the record. Direct creation does not wait for background extraction and does not apply the extraction prompt or sensitive-data exclusions. Run this write once; the memory ID identifies the record within the store.

See [custom memory types](/content/operate/iris/agent-memory/create-service.md#custom-memory-types) for configuration requirements and limits.

## 5. Guide extraction away from sensitive data

The semantic exclusion prompt tells Redis Agent Memory which information should not be kept in long-term memory. Add an event containing a fictional booking code and information that is safe to retain:

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
  "namespaceRef": {"namespaceId": "$NAMESPACE_ID"},
  "actorId": "$OWNER_ID",
  "role": "USER",
  "content": [
    {
      "text": "I booked Hotel Sakura in Tokyo. For this example, the fictional booking confirmation code is DEMO-7QX9."
    }
  ],
  "createdAt": "$EVENT_CREATED_AT"
}
JSON
```

Wait at least one minute and search for the safe hotel information:

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "Where is the user staying in Tokyo?",
  "filter": {
    "namespaceRef": {"eq": "$NAMESPACE_ID"},
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 5
}
JSON
```

Inspect the returned memories. They can retain the hotel name, but should not contain `DEMO-7QX9` because the exclusion prompt covers booking confirmation codes.

> [!NOTE]
> **What to expect:** A memory similar to `User booked Hotel Sakura in Tokyo` without the fictional confirmation code. If the code appears, refine the exclusion prompt and test again. Exclusions remain advisory.

> [!WARNING]
> Semantic exclusions are advisory and do not guarantee that sensitive information is excluded. Session content still reaches the extraction model provider. Do not use real sensitive data in this exercise. Exclusions do not apply to directly created long-term memories.

See [sensitive-data exclusions](/content/operate/iris/agent-memory/create-service.md#sensitive-data-exclusions) for configuration details.

## Next steps

* Learn how to [organize memories with namespaces]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#organize-memories-with-namespaces" >}}).

* Follow the [Python SDK quickstart](/content/develop/ai/context-engine/agent-memory/python-sdk-quickstart.md) or [TypeScript SDK quickstart](/content/develop/ai/context-engine/agent-memory/typescript-sdk-quickstart.md).
* Learn when to [create long term memories directly](/content/develop/ai/context-engine/agent-memory/developer-guide.md#create-long-term-memories).
* Use the [Redis Agent Memory API reference](/content/develop/ai/context-engine/agent-memory/api-reference.md) for endpoint and schema details.

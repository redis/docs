---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect to Redis Agent Memory with the REST API and make session-memory and long-term-memory requests.
hideListLinks: true
linktitle: REST quickstart
title: Redis Agent Memory REST API quickstart
weight: 8
aliases:
- /operate/rc/context-engine/agent-memory/use-agent-memory/
- /develop/ai/context-engine/agent-memory/api-examples/
---

Use this quickstart to connect to a Redis Agent Memory service on Redis Cloud with the REST API. You will add and retrieve a session event, create two long-term memories, and search them by meaning.

## Before you begin

To complete this quickstart, you need:

* A Redis Agent Memory service on Redis Cloud. If you don't have one, [create a Redis Agent Memory service]({{< relref "/operate/rc/context-engine/agent-memory/create-service" >}}).
* The API key for the service.
* A shell with `curl` and `jq` installed.

## Save the connection values

1. Open the Redis Agent Memory service in the Redis Cloud console.
1. On the **Configuration** tab, copy the **Endpoint** and **Store ID**.
1. Export the connection values in your shell. Replace each placeholder with the value from Redis Cloud:

    ```sh
    export AGENT_MEMORY_URL='<ENDPOINT>'
    export STORE_ID='<STORE_ID>'
    export API_KEY='<API_KEY>'
    ```
   
1. Define identifiers for the resources created in this quickstart:

    ```sh
    export SESSION_ID='quickstart-session'
    export OWNER_ID='quickstart-user'
    export MEMORY_ID='quickstart-preference'
    ```
   
`AGENT_MEMORY_URL` must contain the complete endpoint shown in Redis Cloud, including `https://`.

Send `API_KEY` as a bearer token in the `Authorization` header. Keep API keys out of source control, application logs, and other unsecured locations.

`SESSION_ID`, `OWNER_ID`, and `MEMORY_ID` are example identifiers used throughout this quickstart. You can replace them with identifiers from your application.

## Add a session event

Set the event timestamp to the current Coordinated Universal Time (UTC):

```sh
export EVENT_CREATED_AT="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
```

Add a user event to session memory:

```sh
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
      "text": "I prefer vegetarian restaurants."
    }
  ],
  "createdAt": "$EVENT_CREATED_AT"
}
JSON
```

A successful request returns `201 Created`. The response contains the stored event and its server-generated event ID.

For request and response details, see [`AddSessionEvent`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference/#tag/Session-Memory/operation/AddSessionEvent" >}}).

## Retrieve the session

Retrieve the session event that you added:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/$SESSION_ID" | jq
```

A successful request returns `200 OK`. The response contains the session ID, owner ID, and stored events.

For request and response details, see [`GetSessionMemory`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/session-memory/operation/GetSessionMemory" >}}).

## Understand automatic extraction

Redis Agent Memory processes session events asynchronously and extracts relevant information into long-term memory. By default, extraction runs on a five-minute cadence, so extracted memories might not appear immediately.

The next step creates a long-term memory directly. This approach lets you verify long-term-memory search without waiting for automatic extraction.

## Create a long-term memory

Create two long-term memories for the same owner and session:

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory" <<JSON | jq
{
  "memories": [
    {
      "id": "$MEMORY_ID-0",
      "text": "The user prefers cozy restaurants.",
      "memoryType": "semantic",
      "sessionId": "$SESSION_ID",
      "ownerId": "$OWNER_ID"
    },
    {
      "id": "$MEMORY_ID-1",
      "text": "The user prefers spicy food.",
      "memoryType": "semantic",
      "sessionId": "$SESSION_ID",
      "ownerId": "$OWNER_ID"
    }
  ]
}
JSON
```

A successful request returns `201 Created`. The `created` array contains the IDs of both long-term memories.

For request and response details, see [`BulkCreateLongTermMemories`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference/#tag/Long-Term-Memory/operation/BulkCreateLongTermMemories" >}}).

## Search long-term memory

Search for the long-term memory by meaning and owner:

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data @- \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" <<JSON | jq
{
  "text": "What kind of meal does the user prefer?",
  "filter": {
    "ownerId": {
      "eq": "$OWNER_ID"
    }
  },
  "limit": 1
}
JSON
```

A successful request returns `200 OK`. The `items` array contains the strongest semantic match. For this query, the memory about spicy food should rank above the memory about cozy restaurants.

For request and response details, see [`SearchLongTermMemory`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference/#tag/Long-Term-Memory/operation/SearchLongTermMemory" >}}).

## Next steps

- Review the [Redis Cloud service setup guide]({{< relref "/operate/rc/context-engine/agent-memory/create-service" >}}) for service configuration options.
- Use the [Redis Agent Memory API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}) for endpoint and schema details.
- [View and manage the service]({{< relref "/operate/rc/context-engine/agent-memory/view-service" >}}) to update configuration, manage API keys, review metrics, flush memories, or delete the service.

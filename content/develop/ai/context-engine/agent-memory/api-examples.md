---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Learn to use the Redis Agent Memory API for agent memory and semantic memory search.
hideListLinks: true
linktitle: API and SDK examples
title: Use the Redis Agent Memory API and SDK
weight: 10
---

Use the [Agent Memory API]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}) from your client app to store and retrieve agent memory information.

You can use any standard REST client or library to access the API. If your app is written in Python, you can also use the [Agent Memory Software Development Kit](https://pypi.org/project/redis-agent-memory/) (SDK) to access the API.

## Authentication

To access the Agent Memory API, you need:

- Agent Memory API endpoint
- an Agent Memory API user key
- a Store ID

When you call the API, you need to pass the Agent Memory API key in the `Authorization` header as a Bearer token and the store ID as the `storeId` path parameter.

For example:

```sh
curl -s -X GET "https://$HOST/v1/stores/$STORE_ID/session-memory" \
    -H "accept: application/json" \
    -H "Authorization: Bearer $API_KEY" 
```

This example expects several variables to be set in the shell:

- **$HOST** - the Agent Memory API endpoint
- **$STORE_ID** - the Store ID of your Agent Memory service
- **$API_KEY** - The Agent Memory API token

## Examples

### Add session event

Use [`POST /v1/stores/{storeId}/session-memory/events`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/session-memory/operation/AddSessionEvent" >}}) to add an event to a session in short-term memory. If a session doesn't exist yet, it will be created.

```json
POST /v1/stores/{storeId}/session-memory/events
{
    "sessionId": "abcd-efgh",
    "actorId": "user-name",
    "role": "USER",
    "content": [
        {
            "text": "I'm planning a trip to Japan next month."
        }
    ],
    "createdAt": "2026-05-02T18:15:06Z",
    "metadata": {
        "browser": "Chrome",
        "source": "web-chat"
      }
}
```

Use this endpoint to store conversations between your users and your AI agent. You can use the `metadata` object to store additional metadata for your application.

The Agent Memory model will automatically promote relevant short-term memories to long-term memory.

### Add Long-term memories

You may want to add one or more long-term memories to add specific preference information.

Use [`POST /v1/stores/{storeId}/long-term-memory/`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/long-term-memory/operation/BulkCreateLongTermMemories" >}}) to add one or more long-term memories to long-term memory storage.

```json
POST /v1/stores/{storeId}/long-term-memory
{
    "memories": [
        {
            "id": "cofIXpuMmg",
            "text": "The user prefers vegetarian food.",
            "memoryType": "episodic",
            "sessionId": "abcd-efgh",
            "ownerId": "user-name",
        }
    ]
}
```

### Search Long-term memories

Use [`POST /v1/stores/{storeId}/long-term-memory/search`]({{< relref "/develop/ai/context-engine/agent-memory/api-reference#tag/long-term-memory/operation/SearchLongTermMemory" >}}) to search for long-term memories.

```json
POST /v1/stores/{storeId}/long-term-memory/search
{
    "text": "user preferences",
    "similarityThreshold": 0.48725898820184166,
    "filter": {
        "sessionId": {
            "eq": "abcd-efgh"
        },
        "ownerId": {
            "in": [
                "user1",
                "user2"
            ]
        }
    },
    "filterOp": "any"
}
```

In the `filter` object of the request body, you can filter the search by any of the following values:

| Filter | Data type | Definition | Supported operators | 
|--------|----------|------------|---------------------|
| `sessionId` | string | The session ID the memory comes from. | `eq`, `ne`, `in`, `all` |
| `ownerId` | string | The owner ID of the memory. | `eq`, `ne`, `in`, `all` |
| `namespace` | string | The namespace of the memory. | `eq`, `ne`, `in`, `all` |
| `topics` | string | The topics of the memory. | `eq`, `ne`, `in`, `all` |
| `memoryType` | string | The type of memory (`semantic`, `episodic`, `message`). | `eq`, `ne`, `in`, `all` |
| `createdAt` | string (ISO 8601) | The timestamp when the memory was created. | `eq`, `gt`, `lt`, `gte`, `lte` |

For all values, you must set only one of these operators:

| Operator | Definition |
|----------|---------------------|
| `eq` | Returns memories with the value equal to the provided value. |
| `ne` | Returns memories where the value is not the provided value. |
| `in` | Returns memories where the value is one of a list of provided values. |
| `all` | Returns memories where the value matches all of the provided values. |
| `gt` | Returns memories where the value is greater than the provided value. |
| `lt` | Returns memories where the value is less than the provided value. |
| `gte` | Returns memories where the value is greater than or equal to the provided value. |
| `lte` | Returns memories where the value is less than or equal to the provided value. | 
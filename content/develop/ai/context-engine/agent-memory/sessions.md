---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Add and retrieve conversation events, configure retention, and summarize older messages.
hideListLinks: true
linktitle: Sessions
title: Sessions
weight: 10
---

Use a stable `sessionId` to store a conversation as an ordered sequence of events. Add an event for each user, assistant, or system message that your application needs to retain.

## Add session events

Each stored event can include:

| Field | Purpose |
|:------|:--------|
| `eventId` | Server-generated identifier for the event. |
| `sessionId` | Session that contains the event. |
| `actorId` | User, agent, or other actor that produced the event. |
| `role` | Role of the message in the conversation. |
| `content` | Message content, including its text. |
| `createdAt` | Time the event occurred in the application. |
| `systemTimestamp` | Time Redis Agent Memory stored the event. |
| `metadata` | Optional application-specific information associated with the event. |

## Retrieve conversation context

Before an agent turn, retrieve the session by `sessionId` and provide the relevant events to the agent. Use these events as conversation context for the model.

## List sessions

Use `GET /v1/stores/{storeId}/session-memory` to find session IDs by owner or namespace. Reuse the curl connection values from the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart#save-the-connection-values" >}}).

To list sessions in one namespace, set `NAMESPACE_ID` to the stable ID returned when you [create a namespace]({{< relref "/develop/ai/context-engine/agent-memory/namespaces#create-a-personal-namespace" >}}):

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory?namespaceRef=$NAMESPACE_ID" | jq
```

`namespaceRef` matches the namespace ID exactly, including case. It excludes descendant namespaces, sessions with only a deprecated `namespace` label, and sessions without a namespace resource.

Add `filterOwnerId` to return sessions that match both the namespace and the owner:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory?namespaceRef=$NAMESPACE_ID&filterOwnerId=$OWNER_ID" | jq
```

You can also use `filterOwnerId` alone. To list all sessions, omit both filters and set `includeAll=true`:

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory?includeAll=true" | jq
```

Do not combine `includeAll=true` with either filter. A request without a filter must set `includeAll=true`.

The response contains session IDs in `items` and the number of matching sessions in `total`. If the response includes `nextPageToken`, pass it as `pageToken` with the same filters to fetch the next page. See the [List Sessions API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/ListSessions) for pagination limits.

## Configure session retention

The session-memory time to live (TTL) controls how long sessions remain available. Configure it according to the retention requirements of your application. When a session expires, its events are no longer available through session-memory retrieval.

See [memory configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}) to configure the session-memory TTL in Redis Cloud.

## Configure automatic summarization

Automatic summarization limits the amount of conversation history that must be added to a model's context window. Configure:

* **Summarize after:** The number of messages a session can contain before older messages are summarized.
* **Keep most recent:** The number of recent messages that remain available in full.

For example, with **Summarize after** set to 20 and **Keep most recent** set to 10, Redis Agent Memory summarizes the older 10 messages when the session reaches 20 messages and retains the 10 most recent messages in full.

See [automatic summarization]({{< relref "/operate/iris/agent-memory/create-service#automatic-summarization" >}}) to enable summarization and configure both thresholds in Redis Cloud.

For an example that combines session events with long-term recall, follow the [developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}). For complete schemas, see the [session-memory application programming interface (API) reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/GetSessionMemory).

To group a session and its extracted memories, use an optional [namespace]({{< relref "/develop/ai/context-engine/agent-memory/namespaces#place-and-retrieve-memories" >}}).

## Try automatic summarization

Complete the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) first. Reuse its client, connection values, and user and session identifiers. Add Python snippets inside the `with` block and TypeScript snippets inside `run`. Run curl commands in the same shell. Run each write once; comment out completed writes and their output statements before rerunning an SDK file.

Automatic summarization condenses older events and retains the most recent events in full. The retrieved session then contains a `summary` object and the recent `events` array, so the application can provide useful history without filling the model's context window with every original message.

In the service configuration, enable automatic summarization. Set **Summarize after** to `6` and **Keep most recent** to `2` for this example. When the session reaches six events, Redis Agent Memory summarizes the older events and retains the two most recent events in full.


### Add conversation turns

Add these events to the session from the quickstart to continue the conversation past the configured threshold:

{{< multitabs id="conversation-turns" tab1="Python" tab2="TypeScript" tab3="curl" >}}

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

-tab-sep-

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

-tab-sep-

Add enough user and assistant events to reach the configured threshold. Use the session-event request from the quickstart and change `role`, `actorId`, `content`, and `createdAt` for each event. Add these six turns once, using `travel-agent` as the assistant actor and `$OWNER_ID` as the user actor:

| Role | Content |
|:---|:---|
| `ASSISTANT` | What dates are you traveling? |
| `USER` | I arrive on October 10 and leave on October 18. |
| `ASSISTANT` | Would you like formal or casual restaurants? |
| `USER` | Mostly casual places near public transit. |
| `ASSISTANT` | Do you have a preferred budget? |
| `USER` | About 40 euros per person. |

Summarization runs in the background after the session reaches the threshold.

{{< /multitabs >}}

Run these writes once. In the SDK files, comment out the loop before subsequent runs. Summarization runs in the background.


### Retrieve the summarized session

After a short wait, retrieve the session again:

{{< multitabs id="session-summary" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        compacted_session = agent_memory.get_session_memory(
            session_id=SESSION_ID,
        )
        show("Compacted session memory", compacted_session)
```

-tab-sep-

```typescript
  const compactedSession = await agentMemory.getSessionMemory(sessionId);
  console.log("Compacted session memory:");
  console.dir(compactedSession, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/$SESSION_ID" | jq
```

{{< /multitabs >}}

Run the retrieval again after a short wait if `summary` is not present. Compare `summary.text` with the recent events. The summary should preserve earlier trip decisions while recent turns remain available in full.

> [!NOTE]
> **What to expect:** A `summary` object that preserves details such as Tokyo, Kyoto, the travel dates, and food preferences. `summarizedUpToEventId` identifies the last event covered by the summary, while `events` contains the newer turns that remain in full. The exact summary text can vary.

See [automatic summarization configuration]({{< relref "/operate/iris/agent-memory/create-service#automatic-summarization" >}}) for details.

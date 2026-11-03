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

Session memory holds a conversation's transcript. Your application saves each message as an event, then retrieves the transcript when the user sends the next message. This gives the agent the history it needs to continue the conversation.

For example, a travel assistant can retrieve the cities a user mentioned earlier in the chat instead of asking again. Each chat has a session ID (`sessionId`) that ties its events together. The same ID lets your application retrieve the conversation later.

This page covers adding events, retrieving a conversation, and finding session IDs by owner or namespace. It also explains two settings that control the history: retention determines how long a session stays available, and summarization condenses older messages so they take less space in the model's context window.

## Add session events

A session event represents one message from a user, assistant, or system. To append one, send `POST /iris/data/v1/agent-memory/stores/{storeId}/sessions/{sessionId}/events`, which creates the session if it does not exist. In Python, `memory.conversation(owner=..., session_id=...)` returns a conversation whose `user` and `assistant` methods append events. To start a session with a server-generated ID, send its first event to `POST /iris/data/v1/agent-memory/stores/{storeId}/sessions` instead. In Python, omit `session_id` and the SDK generates one; read it from `conversation.session_id`.

Redis Agent Memory adds the event ID and storage timestamp. The event fields are:

| Field | Who supplies it | Purpose |
|:------|:----------------|:--------|
| `eventId` | Server-generated. | Identifies the event. |
| `sessionId` | Client-supplied in the path, or server-generated when you create a session without one. | Identifies the session that contains the event. |
| `actorId` | Required from the client. | Identifies the user, agent, or other actor that produced the event. |
| `role` | Required from the client. | Role of the message in the conversation. |
| `content` | Required from the client. | Message content, including its text. |
| `createdAt` | Required from the client. | Time the event occurred in the application. |
| `systemTimestamp` | Server-generated. | Time Redis Agent Memory stored the event. |
| `metadata` | Optional from the client. | Application-specific information associated with the event. |

1. Set the first event's `actorId` to the signed-in user's account ID from your application. Use the same ID each time this user returns. The server uses it as the session owner. Later events can identify other actors, such as the assistant. In Python, `conversation.user` sends the `owner` as `actorId`, and `conversation.assistant` sends the `assistant_id` passed to `AgentMemory.from_env()`.
1. Supply a `sessionId`, or omit it to let the server create one. Save the returned `event.sessionId` for later requests. See [Identify users and conversations]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#identify-users-and-conversations" >}}) for examples.
1. Set the message's `role`, `content`, and `createdAt` timestamp.
1. Send the request.

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-add" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Send each new message once, using the same session ID throughout the conversation.

The session's `ownerId` comes from the first event's `actorId` and is returned when you retrieve the session. In on-prem deployments with [server-side ownership enforcement](/content/operate/iris/agent-memory/self-managed/authentication.md#server-side-ownership-enforcement), the first event's `actorId` must match the authenticated user ID.

## Retrieve conversation context

When the next message arrives, retrieve the session by its ID before calling the model:

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-retrieve" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The `events` array contains the retained conversation messages. If older events have been summarized, the response also includes `summary.text`. Pass both to the model with the current user message; in Python, `transcript.as_messages()` returns them as chat messages. See [Build context for each agent turn]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide#build-context-for-each-agent-turn" >}}) for an example.

Your application must check that the current user can access this session before using it. The request selects a session by ID; it does not include an owner filter. Compare the returned `ownerId` (`transcript.owner` in Python) with the authenticated user, as the example does.

## List sessions

To let a user reopen an earlier conversation, list their sessions and retrieve the selected session by ID. Use `GET /iris/data/v1/agent-memory/stores/{storeId}/sessions`, `memory.sessions(owner)` or `memory.client.list_sessions` in Python, or `iris agent-memory sessions list`. These rows do not contain events or generated summary text. See [List and sort sessions](/content/develop/ai/context-engine/agent-memory/sessions/list-sessions.md) for SDK examples and pagination.

Filter the list by owner or namespace.

For a user's personal conversations, set `ownerId` to that user's authenticated ID. A namespace-only query is suitable for shared conversations only after your application checks access to that namespace. Reserve `includeAll=true` for callers your application authorizes to list the whole store. See [Authorize every memory request](/content/develop/ai/context-engine/agent-memory/developer-guide.md#authorize-every-memory-request).

To list one user's session IDs:

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-list-owner" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

To list sessions in one namespace, filter by its stable ID. This example creates a personal namespace, starts a session in it, and lists that namespace's sessions. In an application, [create the namespace]({{< relref "/develop/ai/context-engine/agent-memory/namespaces#create-a-personal-namespace" >}}) once and save its ID.

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-list-namespace" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

`namespaceId` matches the namespace ID exactly, including case. It excludes descendant namespaces, sessions with only the older `namespace` string label, and sessions without a namespace resource.

Add `ownerId` to return sessions that match both the namespace and the owner:

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-list-namespace-owner" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

To list all sessions, omit both filters and set `includeAll=true`:

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-list-all" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Do not combine `includeAll=true` with either filter. A request without a filter must set `includeAll=true`.

The response contains session rows in `items` and no total count. If the response includes `nextCursor`, pass it as `cursor` with the same filters to fetch the next page. See the [List Sessions API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/ListSessions) for pagination limits.

## Configure session retention

The session-memory time to live (TTL) controls how long sessions remain available. Choose a duration that lets users resume conversations for as long as your application needs. When a session expires, its events are no longer available through session-memory retrieval.

In the Redis Cloud console, open your service's **Configuration** tab and select **Edit**. Set **Short-term TTL** under **Memory configuration**.

See [memory configuration]({{< relref "/operate/iris/agent-memory/create-service#memory-configuration" >}}) to configure the session-memory TTL in Redis Cloud.

## Configure automatic summarization

As a conversation grows, its messages take more space in the model's context window. Automatic summarization replaces older messages with a shorter summary while keeping recent messages in full.

In the Redis Cloud console, open your service's **Configuration** tab and select **Edit**. Under **Memory configuration**, enable **Automatic summarization** and set:

* **Summarize after:** The number of messages a session can contain before older messages are summarized.
* **Keep most recent:** The number of recent messages that remain available in full.

For example, with **Summarize after** set to 20 and **Keep most recent** set to 10, Redis Agent Memory summarizes the older 10 messages when the session reaches 20 messages and retains the 10 most recent messages in full.

See [automatic summarization]({{< relref "/operate/iris/agent-memory/create-service#automatic-summarization" >}}) to enable summarization and configure both thresholds in Redis Cloud.

For an example that combines session events with long-term recall, follow the [developer guide]({{< relref "/develop/ai/context-engine/agent-memory/developer-guide" >}}). For complete schemas, see the [session-memory application programming interface (API) reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/GetSessionMemory).

To group a session and its extracted memories, use an optional [namespace]({{< relref "/develop/ai/context-engine/agent-memory/namespaces#place-and-retrieve-memories" >}}).

## Try automatic summarization

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

Follow [Configure automatic summarization](#configure-automatic-summarization). Set **Summarize after** to `6` and **Keep most recent** to `2` for this example. The retrieved session will contain a `summary` object and the two most recent events in `events`.


### Add conversation turns

Add these events to the session from the quickstart to continue the conversation past the configured threshold:

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-add-turns" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Run these writes once. Summarization runs in the background.


### Retrieve the summarized session

Retrieve the session again. The Python and cURL examples check every 10 seconds, for up to two minutes, until a summary appears:

{{< clients-example set="iris_agent_memory_sessions" step="agent-memory-sessions-summary" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

If `summary` is still missing, run the retrieval again. Compare `summary.text` with the recent events. The summary should preserve earlier trip decisions while recent turns remain available in full.

> [!NOTE]
> **What to expect:** A `summary` object that preserves details such as Tokyo, Kyoto, the travel dates, and food preferences. `summarizedUpToEventId` identifies the last event covered by the summary, while `events` contains the newer turns that remain in full. The exact summary text can vary.

---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect an application to Redis Agent Memory and work with session memory and long-term memory through Python, TypeScript, or REST.
hideListLinks: true
linktitle: Developer guide
title: Redis Agent Memory developer guide
weight: 6
---

Your application brings two kinds of memory to a conversation: the messages exchanged so far and information worth remembering from earlier conversations. Redis Agent Memory stores both. Your application retrieves them, passes them to the model, and saves each new turn.

This guide uses a travel assistant to show where those requests belong in your application. Complete the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) first to create a service and send your first requests. For how the two kinds of memory work, see the [overview]({{< relref "/develop/ai/context-engine/agent-memory/overview" >}}).

## Configure the application

Every client needs the service endpoint, Store ID, and application programming interface (API) key. The endpoint tells the client where to connect. The Store ID selects the memory store, and the key authenticates the request.

1. In the Redis Cloud console, open your Agent Memory service and select **Configuration**.
1. Copy the **Endpoint** and **Store ID** into your application's configuration.
1. Load the API key you saved during service creation from a secret store or environment variable. Keep it out of source control and browser code.
1. Create the client as shown in [Create the client and check the service health]({{< relref "/develop/ai/context-engine/agent-memory/quickstart#create-the-client-and-check-the-service-health" >}}). Use the Python software development kit (SDK) for Python applications, the TypeScript SDK for JavaScript or TypeScript, or the REST API for other languages.

## Identify users and conversations

Redis Agent Memory uses IDs to keep conversations and owners distinct. Choose them in your application, then reuse them in memory requests. For a travel assistant:

| Identifier | Application choice |
|:-----------|:-------------------|
| `sessionId` | Generate a universally unique identifier (UUID) when the user starts a new chat and save it with the chat record. Reuse it for every turn in that chat. A new chat gets a new ID. |
| `actorId` | Use the signed-in user's account ID for user messages and an agent ID, such as `travel-agent`, for assistant messages. |
| `ownerId` | Use the same account ID when creating and searching that user's long-term memories. Reuse it across chats so the assistant can recall earlier preferences. |

For example, the quickstart uses `quickstart-user` for the user's actor and owner IDs, and `travel-planning-session` for one conversation. These fixed values let you repeat the example. In an application, use IDs from your account and chat records. IDs must follow the format in the [API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).

Before retrieving a chat, check in your application's account data that the signed-in user can access it. Set the memory search's owner filter from that authenticated account. For example, a request from `user-42` must not be able to select `user-99` as its owner. A search filter limits results; it does not check who signed in.

## Build context for each agent turn

Suppose a user returns to the travel assistant and asks, "Where should I eat in Kyoto?" The current conversation may contain their travel dates. Long-term memory may contain their vegetarian diet from an earlier chat. The model needs both to give a useful answer.

1. Retrieve session memory with the conversation's `sessionId`.
1. Search long-term memory using the user's request and an `ownerId` filter.
1. Build the model context from the session summary, recent events, relevant search results, and the current user message.
1. Call the model to produce the assistant's response.
1. Store the new user and assistant messages as session events, with their roles and actor IDs.

The following Python example prepares that context. It uses the client, `SESSION_ID`, and `USER_ID` from the quickstart. Add it inside the `with` block in `main`, after the health check, and run `python quickstart.py`. It reads existing memory and prints the context without adding an event.

```python
        import json

        question = "Where should I eat in Kyoto?"
        session = agent_memory.get_session_memory(session_id=SESSION_ID)
        memories = agent_memory.search_long_term_memory(
            request={
                "text": question,
                "filter_": {"owner_id": {"eq": USER_ID}},
                "limit": 5,
            },
        )

        context = {
            "session_summary": session.summary.text if session.summary else None,
            "recent_events": [
                event.model_dump(mode="json", by_alias=True)
                for event in session.events
            ],
            "relevant_memories": [memory.text for memory in memories.items],
            "current_message": question,
        }
        print(json.dumps(context, indent=2))
```

Pass this information to your model through your application's existing model call. Keep conversation roles and treat recalled memories as context, not as instructions. For a complete application example, use the [AI agent builder]({{< relref "/develop/ai/agent-builder" >}}) and select **Redis Iris Conversational Assistant**.

After the model responds, use the [session-event request]({{< relref "/develop/ai/context-engine/agent-memory/quickstart#1-build-conversation-context-with-session-memory" >}}) to save each new message. Save the question with role `USER` and the user's actor ID. Save the answer with role `ASSISTANT` and actor ID `travel-agent`. Both use the same session ID.

In this sequence, the question appears once in `current_message` because it has not been saved yet. If you save it before retrieving the session, it will already be in `recent_events`; omit `current_message` in that case.

The context must fit the model's input limit. Count tokens with your model provider's tokenizer and leave room for the answer. The example limits recall to five memories. If the prompt is still too large, use fewer results or enable [session summarization]({{< relref "/develop/ai/context-engine/agent-memory/sessions#configure-automatic-summarization" >}}). When summarization is enabled, session retrieval returns the summary and recent events separately; the example includes both.

## Handle long-term recall

Extraction runs in the background. Saving "I am vegetarian" as a session event makes the message available in session memory, but an extracted preference may not be searchable yet. The context example includes the session events, so the model can use that statement on the next turn without waiting for extraction.

When a search returns no matches, `items` is an empty array. In the example, `relevant_memories` becomes `[]`; the session history and current question remain available. If you expect a memory but it does not appear:

1. Open the service's **Configuration** tab in Redis Cloud and check **Extraction cadence** under **Memory configuration**. Wait at least that interval after adding the event, then search again.
1. If you expect a custom memory type, check that it is enabled under **Memory types & extraction**. Check that its extraction prompt covers the information in the event.
1. Compare the request's `ownerId`, `memoryType`, and namespace filters with the IDs and type used for the memory. Start with the owner filter alone to check whether an added filter excludes it.

See [View and edit service configuration]({{< relref "/operate/iris/agent-memory/view-service#configuration-tab" >}}) for the settings. Extraction uses a model, so it may not create a memory for every statement.

A failed request is different from a successful search with no matches. Handle the returned error before you use the result:

| Failure | Application response |
|:--------|:---------------------|
| Authentication error | Check the configured API key. Retrying with the same invalid key will not help. |
| Invalid request | Read the error details and correct the field or filter before retrying. |
| Search timeout | If the assistant can answer from the current conversation, continue without recalled memories. Otherwise, tell the user that memory is unavailable and ask them to retry. |
| Event-write timeout | Retrieve the session and check whether the event was stored before sending it again. Compare its actor, timestamp, and content. Repeating a write can create a duplicate. |

### Create long-term memories

Create memories directly when your application already has information to store, such as a preference submitted through a form. Set the owner and a stable record ID, and check the bulk response for per-record errors. Direct creation does not apply automatic extraction or sensitive-data exclusions.

See [Long-term memory]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory" >}}) for creation methods, search fields, retention, and extraction controls.

## Define custom memory types

If your application needs structured values, define a custom memory type. For example, `trip_preference` can capture `destinations`, `travel_period`, `dietary_requirements`, and `food_preferences`.

Enable the type and supply extraction instructions. Search with the `memoryType` and `ownerId` filters, then read each result's `attributes`. Check for missing fields before using them to choose restaurants.

See [Custom memory types]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory#custom-memory-types" >}}) to define fields, handle extraction results, and create records directly.

## Organize memories with namespaces

Namespaces are optional. Add them when your application needs to group conversations and memories by user, project, or team.

For example, create a personal `travel` namespace and save its `namespaceId`. Use that ID in `namespaceRef` when starting a session or creating long-term memories. You will also use this ID to search for memories in that namespace. Names and paths can change when you rename a namespace, but its ID stays the same.

See [Namespaces]({{< relref "/develop/ai/context-engine/agent-memory/namespaces" >}}) for hierarchy, placement, search filters, and management.

## Exclude sensitive data from automatic extraction

Sensitive-data exclusions keep specified information out of long-term memory during automatic extraction. A store's exclusions policy combines three mechanisms that you enable independently:

* **Built-in detectors:** Validated patterns for common identifiers, such as payment card numbers, email addresses, phone numbers, Internet Protocol (IP) addresses, and US Social Security numbers. Select the ones a store should apply.
* **Custom detectors:** Regular expressions you write yourself, for identifiers specific to your domain such as tenant IDs or internal reference numbers.
* **Semantic exclusions:** A plain-language exclusion prompt describing what must not be kept, such as passwords, access tokens, recovery codes, payment card information, or booking confirmation codes. Use it for concepts a pattern cannot express.

Every detector chooses what happens to a memory it matches: redact the matched text and keep the rest, or drop the memory. When a memory matches several detectors that choose different actions, the memory is dropped.

Exclusions apply to automatic extraction from session events. They do not apply when an application creates long-term memories directly, and session memory itself is never altered.

> [!WARNING]
> Detector matches are deterministic, but semantic exclusions are advisory and do not guarantee exclusion. Sensitive session content still reaches the extraction model provider. Use appropriate controls before sending sensitive information to Redis Agent Memory or the model provider.

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) to configure the feature in Redis Cloud.

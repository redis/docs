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

<a id="connect-to-a-redis-agent-memory-service"></a>

## Configure the application

Every client needs the service endpoint, Store ID, and application programming interface (API) key. The endpoint tells the client where to connect. The Store ID selects the memory store, and the key authenticates the request.

1. In the Redis Cloud console, open your Agent Memory service and select **Configuration**.
1. Copy the **Endpoint** and **Store ID** into your application's configuration.
1. Load the API key you saved during service creation from a secret store or environment variable. Keep it out of source control and browser code.
1. Create the client as shown in [Create the client and check the service health]({{< relref "/develop/ai/context-engine/agent-memory/quickstart#create-the-client-and-check-the-service-health" >}}). Use the Python software development kit (SDK) for Python applications, the TypeScript SDK for JavaScript or TypeScript, or the REST API for other languages.

### Manage a service with the Control Plane SDK

For store and extractor administration, see [Manage a service with the Control Plane SDK](/content/operate/iris/agent-memory/self-managed/api-examples.md#manage-a-service-with-the-control-plane-sdk). Keep operator credentials separate from application credentials.

## Identify users and conversations

Use one stable account ID for the current user across conversations. Get it from your application's authenticated identity, such as its login session or a verified identity-provider claim. An external identity provider is not required when your backend handles user authentication and authorization. Do not generate a new user ID for each chat or trust an owner ID supplied by a browser.

Some IDs come from your application; others come from Redis Agent Memory:

| Identifier | Who supplies it | How to use it |
|:-----------|:----------------|:--------------|
| `sessionId` | Your application, or the server if you omit it when adding the first event. | Save the returned `event.sessionId` and reuse it for later turns. A new chat needs a new ID. |
| `actorId` | Your application, on every session event. | Use the current user's stable ID on the first event. Later messages can use an assistant ID, such as `travel-agent`. |
| Session `ownerId` | The server copies it from the first event's `actorId`. | There is no separate `ownerId` input on a session-event request. Later actors do not change the session owner. |
| Long-term memory `ownerId` | Your application for direct creation; extraction inherits the session owner. | Use the current user's stable ID for personal memories and owner filters. |
| `eventId` | The server. | Save it from the event response if you need to refer to that event. |
| Long-term memory `id` | Your application for direct creation; the server during extraction. | Supply a stable record ID when creating a memory directly. |
| `namespaceId` | The server when it creates a namespace. | Save it and use it in `namespaceRef`. Supply the user's `ownerId` when creating a personal namespace. |
| Event `createdAt` | Your application. | Send when the message occurred; it is a required event input. |
| Event `systemTimestamp` | The server. | Records when the event was stored. |
| Memory `createdAt` and `updatedAt` | The server. | Use the returned timestamps when displaying or sorting memories. |

For example, the quickstart uses `quickstart-user` as the user's ID and `travel-planning-session` for one conversation. Replace the user ID with your authenticated account ID in an application. IDs must follow the format in the [API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}).

For on-prem deployments, see [Server-side ownership enforcement](/content/operate/iris/agent-memory/self-managed/authentication.md#server-side-ownership-enforcement) for identity requirements and configuration.

### Authorize every memory request

Your application must decide which memories the user can access. Put these checks in trusted backend code before sending a request to Redis Agent Memory. Store access alone does not restrict a caller to one user's memories. Cloud store credentials also require these application checks; a Redis Cloud account user is not your application's end user.

* For personal searches, set the `ownerId` filter from the authenticated user's ID. For session listing, use `filterOwnerId`. A request from `user-42` must not be able to select `user-99` as its owner.
* For shared memories, check which shared namespaces that user can access, then restrict the query to those namespace IDs. Do not add a personal owner filter to that shared query: it would hide shared memories written by other users.
* For requests that retrieve or change a record by ID, check that the record belongs to the user or to a shared namespace they can access. These endpoints do not all accept an owner filter; a session or memory ID is not proof of permission.

Use the authenticated user on every request to choose the owner filter or the permitted shared namespaces. Search filters limit results; they do not authenticate the user. For examples, see [Namespaces](/content/develop/ai/context-engine/agent-memory/namespaces/_index.md).

Keep mandatory owner restrictions separate from optional search conditions. Combining an owner and another filter with `filterOp: "any"` matches either condition; it does not require the owner to match. `includeAll` on a list request is also a selection option, not permission to enumerate a store.

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

### Handle typed errors and partial results

| What you see | What it means | What to do |
|:-------------|:--------------|:-----------|
| Empty `items` | No memories match yet. | Continue with session context. |
| Invalid request | A field or filter is invalid. | Correct it using the error details. |
| `401` | The credential is invalid or expired. | Correct the key or refresh the user's token. |
| `403` or a hidden personal-record `404` | Store grants, or on-prem ownership enforcement, prevent the request. | Check grants and authenticated identity. An owner filter cannot grant access. |
| `409` | A resource conflicts, such as an archived destination or stale revision. | Correct the destination or read the current revision before retrying. |
| `423` | The resource is suspended. | Restore its availability. |
| `424` | A dependency failed. | Inspect the typed error and problem type. |
| `429` or retryable `5xx` | The request is throttled or temporarily unavailable. | Use bounded backoff and honor retry timing. |
| Search timeout | Recall did not complete. | Use session context if it is enough to answer. Otherwise, report memory unavailability. |
| Event-write timeout | The write may already have succeeded. | Retrieve the session before retrying; repeated writes can add duplicate events. |
| Successful bulk response with `errors` | Some records failed; others may already be changed. | Inspect every item before deciding what to retry. |

Before retrying a write, follow its idempotency or recovery contract.

The operation's response contract determines its `424` exception class. For example, search uses `MemoryFailedDependencyErrorResponseContent`, while store health uses `FailedDependencyErrorResponseContent`. Both can report unavailable resources or database memory exhaustion; the memory response also covers model credentials and quota failures. Inspect the problem type as well as the class. Python exceptions are in `redis_agent_memory.errors`, with problem fields under `error.data`. TypeScript exceptions are in `@redis-iris/agent-memory/models/errors`.

This complete program checks store health before recall and handles either operation's dependency error separately from an empty `items` array:

```python
import asyncio
import os

from redis_agent_memory import AgentMemory, errors


async def main():
    headers = {"X-Iris-User-Token": os.environ["USER_TOKEN"]} if os.environ.get("USER_TOKEN") else {}
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"], store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as memory:
        try:
            await memory.store_health_async(http_headers=headers)
            result = await memory.search_long_term_memory_async(
                request={"filter_": {"owner_id": {"eq": os.environ["OWNER_ID"]}}, "limit": 5},
                http_headers=headers,
            )
        except errors.MemoryFailedDependencyErrorResponseContent as error:
            print("Memory dependency unavailable:", error.data.title)
            return
        except errors.FailedDependencyErrorResponseContent as error:
            print("Service dependency unavailable:", error.data.title)
            return
        print([item.text for item in result.items])


asyncio.run(main())
```

The ingestion-hook `503` retry error and `422` stopped error also have distinct types and recovery rules. See [webhook failures](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md#handle-failures-and-inspect-status). To check the store, use `store_health` (Python) or `storeHealth` (TypeScript).

## Create long-term memories

Create memories directly when your application already has information to store, such as a preference submitted through a form. Set the owner and a stable record ID. Creating an eligible record with the same ID again replaces it; access checks and protection for document-managed records still apply. Check the bulk response for per-record errors. Direct creation does not apply automatic extraction or sensitive-data exclusions.

See [Long-term memory]({{< relref "/develop/ai/context-engine/agent-memory/long-term-memory" >}}) for creation methods, search fields, retention, and extraction controls.

For unstructured documents, use [MemoryETL](/content/develop/ai/context-engine/agent-memory/memory-etl.md) to configure an extractor, submit a revision, and track its outputs. Source links let you trace extracted memories back to document or session inputs.

For a reusable summary of selected long-term memories, use [Summary Views](/content/develop/ai/context-engine/agent-memory/summary-views.md). Read their result status, freshness, and coverage before adding generated text or structured data to the model context.

Use [ingestion webhooks](/content/develop/ai/context-engine/agent-memory/ingestion-webhooks.md) when an application policy must review input or generated changes before they are saved. Configure the receiver, selected paths, signing keys, and retry handling before enabling the policy.

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

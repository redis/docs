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

Use session memory and long-term memory in your agent's request cycle. Complete the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) first to verify the connection and make your first requests. For the memory model, see [Concepts]({{< relref "/develop/ai/context-engine/agent-memory/concepts" >}}).

## Configure the application

Keep the service endpoint, Store ID, and application programming interface (API) key in application configuration. Load the key from a secret store or environment variable. The quickstart shows client initialization for Python, TypeScript, and curl.

Choose identifiers your application can reuse:

| Identifier | Application choice |
|:-----------|:-------------------|
| `sessionId` | Use one ID for a conversation. Reuse it on later turns and use a new ID for a new conversation. |
| `actorId` | Identify who produced each event, such as the user or assistant. |
| `ownerId` | Use a stable user or entity ID when creating and searching long-term memories. |

Resolve the user and their allowed sessions in your application before making memory requests. Build recall filters from that identity. Search filters do not replace application access checks.

## Build context for each agent turn

For example, a user returns to a travel agent and asks for restaurants in Kyoto. The application needs the current conversation and any relevant preferences from earlier conversations.

1. Retrieve session memory with the conversation's `sessionId`.
1. Search long-term memory using the user's request and an `ownerId` filter.
1. Build the model context from the session summary, recent events, relevant search results, and the current user message.
1. Call the model to produce the assistant's response.
1. Store the new user and assistant messages as session events, with their roles and actor IDs.

Include the current user message once. If your application stores it before retrieval, avoid adding a second copy to the model context. Store the assistant message after it has been generated.

Select relevant memories and recent conversation history that fit your model's context window. Use the session summary when automatic summarization is enabled. See [Sessions]({{< relref "/develop/ai/context-engine/agent-memory/sessions" >}}) for event fields, retention, and summarization.

## Handle long-term recall

Automatic extraction runs in the background. A successful event write does not mean that a long-term memory is ready to search. Use the current message and session history to answer the current turn; allow later turns to recall extracted information.

An empty search result means that no memories matched the request. It can also occur while extraction is pending. Continue with the available conversation context. If expected memories remain absent, check the extraction settings and search filters.

Treat a failed request separately from an empty result. Decide whether your application can answer with reduced context or needs to ask the user to retry. Check the API response before retrying: correct authentication and request errors first. Before retrying a write after a timeout, check whether it succeeded to avoid duplicate events or records.

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

Sensitive-data exclusions keep specified information out of long-term memory during automatic extraction. Enable the controls your store needs:

* **Built-in detectors:** Validated patterns for common identifiers, such as payment card numbers, email addresses, phone numbers, Internet Protocol (IP) addresses, and US Social Security numbers. Select the ones a store should apply.
* **Custom detectors:** Regular expressions you write yourself, for identifiers specific to your domain such as tenant IDs or internal reference numbers.
* **Semantic exclusions:** A plain-language exclusion prompt describing what must not be kept, such as passwords, access tokens, recovery codes, payment card information, or booking confirmation codes. Use it for concepts a pattern cannot express.

For each detector, choose an action: redact the matched text and keep the rest, or drop the memory. When a memory matches several detectors that choose different actions, the memory is dropped.

Exclusions apply to automatic extraction from session events. They do not apply when an application creates long-term memories directly, and session memory itself is never altered.

> [!WARNING]
> Detector matches are deterministic, but semantic exclusions are advisory and do not guarantee exclusion. Sensitive session content still reaches the extraction model provider. Use appropriate controls before sending sensitive information to Redis Agent Memory or the model provider.

See [sensitive-data exclusions]({{< relref "/operate/iris/agent-memory/create-service#sensitive-data-exclusions" >}}) to configure the feature in Redis Cloud.

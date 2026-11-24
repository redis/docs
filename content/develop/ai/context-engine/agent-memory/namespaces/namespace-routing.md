---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Configure shared namespace routing and admission rules for long-term memories.
hideListLinks: true
linktitle: Namespace routing
title: Namespace routing
weight: 14
aliases:
- /develop/ai/context-engine/agent-memory/namespace-routing/
---

Namespace routing selects a shared namespace for an eligible memory. Admission rules check whether a memory can enter a destination. Use routing to organize shared memories by content, and admission rules to reject content that does not belong in a namespace.

The policy applies to one store. It targets existing shared namespace resources, using their stable `namespaceId` values. It does not create namespaces or change access permissions. Namespace routing is available in Redis Cloud and enabled in self-managed deployments. Configure a policy to use it for a store. For self-managed process settings, see [Configure namespace routing](/content/operate/iris/agent-memory/self-managed/configuration.md#enable-namespace-routing).

## Understand placement and admission

| Request | Behavior |
|:--------|:---------|
| Create a memory with `namespaceId` | Use that destination after admission checks. The service never chooses another destination. |
| Create a memory without `namespaceId` | Create it without a namespace. Automatic routing does not place it in a shared namespace. |
| Move a memory with `namespaceId` | Use that destination after admission checks. This applies to a bulk move and to a single `PATCH` of `namespaceId`. |
| Move a memory without `namespaceId` | Evaluate automatic routing only if the memory is already in a shared namespace. |
| Update a memory | Check the merged record against admission at its current destination. An update never chooses another destination. |

An automatic move keeps the current placement and returns a per-item error if routing is disabled, no destination qualifies, or the memory is personal or has no namespace. Inspect both `moved` and `errors` in a move response. Bulk creation also reports failures per record in `errors`. An explicit move to an archived namespace returns `409 Conflict`.

## Configure a policy

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

The policy routes memories to an existing shared namespace. [Create a shared namespace](/content/develop/ai/context-engine/agent-memory/namespaces/_index.md#create-a-shared-namespace) for the destination and keep its ID:

{{< clients-example set="iris_agent_memory_namespace_routing" step="namespace-routing-destination" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Read the current policy before changing it:

{{< clients-example set="iris_agent_memory_namespace_routing" step="namespace-routing-get" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

This example accepts text containing `travel` into the destination namespace, ignoring case. **PUT replaces the entire policy.** The policy applies to every application that uses the store, so the example keeps the existing rules and replaces only a rule with the same ID. Replacing the policy requires a user credential with an admin role (`suite_admin` or `product_admin`). Agent API keys get `403 Forbidden`, even with full permissions:

{{< clients-example set="iris_agent_memory_namespace_routing" step="namespace-routing-put" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

## How rules are evaluated

In this example, `example-travel` is an accept rule with one strategy, a regex matcher.

An enabled `ACCEPT` rule selects a candidate destination. Accept rules run in list order. Every enabled `REJECT` rule for that destination applies, including rules later in the list. A matching reject vetoes the candidate. Automatic routing then tries another candidate; explicit placement fails rather than choosing another namespace.

Strategies within a rule run in list order; the first match fires the rule. An accept rule with no strategies always matches. A reject rule with no strategies never matches. Use `MATCHER_SPEC` with a `REGEX` matcher for text patterns, or `LLM_PROMPT` with `llmPrompt` for a model-evaluated instruction. Each strategy must contain only the block for its declared `kind`.

A store without a saved policy returns an empty, disabled policy. Regular expressions use RE2 syntax. Lookaround, backreferences, invalid expressions, and patterns that can match empty text are not supported. A policy supports up to 32 rules and 8 strategies per rule. See [`PutNamespaceRouting`](/content/develop/ai/context-engine/agent-memory/api-reference.md#operation/PutNamespaceRouting) for validation and error responses.

## Move memories with the policy

To evaluate the policy for an existing shared memory, omit the destination from the move request. First create a test memory in another shared namespace:

{{< clients-example set="iris_agent_memory_namespace_routing" step="namespace-routing-source" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Then move it without a destination:

{{< clients-example set="iris_agent_memory_namespace_routing" step="namespace-routing-move" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The example memory must already belong to a shared namespace and contain matching text. If routing is disabled or no rule matches, the memory stays where it is and the response reports a per-item error:

```json
{
  "moved": [],
  "errors": [
    {
      "memoryId": "example-routing-travel",
      "status": 400,
      "title": "Namespace Routing Did Not Match",
      "detail": "namespace routing matched no destination",
      "type": "/errors/invalid-data"
    }
  ]
}
```

The request accepts 1–100 IDs. To choose a destination explicitly, pass `namespaceId`. Explicit placement still runs admission checks:

{{< clients-example set="iris_agent_memory_namespace_routing" step="namespace-routing-explicit" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

To place a single memory, you can also send `PATCH /iris/data/v1/agent-memory/stores/{storeId}/memories/{memoryId}` with only `namespaceId`. The same admission checks apply, and a namespace-only update keeps the memory's current expiration (TTL). See [Place and retrieve memories](/content/develop/ai/context-engine/agent-memory/namespaces/_index.md#place-and-retrieve-memories).

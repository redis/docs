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
---

Namespace routing selects a shared namespace for an eligible memory. Admission rules check whether a memory can enter a destination. Use routing to organize shared memories by content, and admission rules to reject content that does not belong in a namespace.

The policy applies to one store. It targets existing shared namespace resources, using their stable `namespaceId` values. It does not create namespaces or change access permissions. Your service must support namespace routing and have it enabled. The beta software development kits (SDKs) expose these operations in Python `0.5.0b1` and TypeScript `0.4.0-beta.1`; installing an SDK does not enable routing on the service.

## Understand placement and admission

| Request | Behavior |
|:--------|:---------|
| Create a memory with `namespaceRef` | Use that destination after admission checks. The service never chooses another destination. |
| Create a memory without `namespace` or `namespaceRef` | Create it without a namespace. Automatic routing does not place it in a shared namespace. |
| Move a memory with `namespaceRef` | Use that destination after admission checks. |
| Move a memory without `namespaceRef` | Evaluate automatic routing only if the memory is already in a shared namespace. |
| Update a memory | Check the merged record against admission at its current destination. An update never chooses another destination. |

An automatic move keeps the current placement and returns a per-item error if routing is disabled, no destination qualifies, or the memory is personal or has no namespace. Inspect both `moved` and `errors` in a move response. Bulk creation also reports failures per record in `errors`. An explicit move to an archived namespace returns `409 Conflict`.

An enabled `accept` rule selects a candidate destination. Accept rules run in list order. Every enabled `reject` rule for that destination applies, including rules later in the list. A matching reject vetoes the candidate. Automatic routing then tries another candidate; explicit placement fails rather than choosing another namespace.

Strategies within a rule run in list order; the first match fires the rule. An accept rule with no strategies always matches. A reject rule with no strategies never matches. Use `matcher_spec` with a `regex` matcher for text patterns, or `llm_prompt` with `llmPrompt` for a model-evaluated instruction. Each strategy must contain only the block for its declared `kind`.

## Configure a policy

Create a shared namespace with `CreateNamespace`, and save its returned ID as `SHARED_NAMESPACE_ID`. Use `scope: "SHARED"` and omit `ownerId`. Install the beta SDK for your language, then set `AGENT_MEMORY_URL`, `STORE_ID`, and `API_KEY` as described in the [developer guide](/content/develop/ai/context-engine/agent-memory/developer-guide.md#connect-to-a-redis-agent-memory-service).

This example accepts text containing `travel` into that namespace. The regular expression is case-insensitive. **PUT replaces the entire policy**, so read the current policy first and retain any rules you still need.

{{< multitabs id="namespace-routing-policy" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import os

from redis_agent_memory import AgentMemory


async def main():
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"],
        store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        current = await agent_memory.get_namespace_routing_async()
        print(current.model_dump_json(by_alias=True, indent=2))
        result = await agent_memory.put_namespace_routing_async(policy={
            "enabled": True,
            "rules": [{
                "id": "travel",
                "enabled": True,
                "action": "accept",
                "destination": {"namespace_id": os.environ["SHARED_NAMESPACE_ID"]},
                "strategies": [{
                    "kind": "matcher_spec",
                    "matcher": {"kind": "regex", "regex": {"pattern": "(?i)travel"}},
                }],
            }],
        })
        print(result.model_dump_json(by_alias=True, indent=2))


asyncio.run(main())
```

-tab-sep-

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_URL, STORE_ID, API_KEY, SHARED_NAMESPACE_ID } = process.env;
  if (!AGENT_MEMORY_URL || !STORE_ID || !API_KEY || !SHARED_NAMESPACE_ID) {
    throw new Error("Set AGENT_MEMORY_URL, STORE_ID, API_KEY, and SHARED_NAMESPACE_ID.");
  }
  const agentMemory = new AgentMemory({
    serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY,
  });
  console.dir(await agentMemory.getNamespaceRouting(), { depth: null });
  const result = await agentMemory.putNamespaceRouting({
    policy: {
      enabled: true,
      rules: [{
        id: "travel", enabled: true, action: "accept",
        destination: { namespaceId: SHARED_NAMESPACE_ID },
        strategies: [{
          kind: "matcher_spec",
          matcher: { kind: "regex", regex: { pattern: "(?i)travel" } },
        }],
      }],
    },
  });
  console.dir(result, { depth: null });
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --header "Authorization: Bearer $API_KEY" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/namespace-routing" | jq

curl --fail-with-body --silent --show-error \
  --request PUT \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg ns "$SHARED_NAMESPACE_ID" \
    '{policy: {enabled: true, rules: [{id: "travel", enabled: true,
      action: "accept", destination: {namespaceId: $ns}, strategies: [{
        kind: "matcher_spec", matcher: {kind: "regex", regex: {pattern: "(?i)travel"}}
      }]}]}}')" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/namespace-routing" | jq
```

{{< /multitabs >}}

A store without a saved policy returns an empty, disabled policy. Regular expressions use RE2 syntax. Lookaround, backreferences, invalid expressions, and patterns that can match empty text are not supported. A policy supports up to 32 rules and 8 strategies per rule. See [`PutNamespaceRouting`](/content/develop/ai/context-engine/agent-memory/api-reference.md#operation/PutNamespaceRouting) for validation and error responses.

## Move memories with the policy

To evaluate the policy for an existing shared memory, omit the destination from `MoveLongTermMemories`. Use IDs returned by a previous create or search request:

{{< multitabs id="namespace-routing-move" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        moved = await agent_memory.move_long_term_memories_async(
            memory_ids=[os.environ["MEMORY_ID"]],
        )
        print(moved.model_dump_json(by_alias=True, indent=2))
```

-tab-sep-

```typescript
  const memoryId = process.env.MEMORY_ID;
  if (!memoryId) throw new Error("Set MEMORY_ID to an existing shared memory ID.");
  const moved = await agentMemory.moveLongTermMemories({ memoryIds: [memoryId] });
  console.dir(moved, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg id "$MEMORY_ID" '{memoryIds: [$id]}')" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/move" | jq
```

{{< /multitabs >}}

Add the SDK snippet inside the client block or `main` function from [Configure a policy](/content/develop/ai/context-engine/agent-memory/namespace-routing.md#configure-a-policy). Set `MEMORY_ID` before running it. The example memory must already belong to a shared namespace and contain matching text. The request accepts 1–100 IDs. To choose a destination explicitly, also pass `namespace_ref={"namespace_id": "<namespace-id>"}` in Python or `namespaceRef: { namespaceId: "<namespace-id>" }` in TypeScript or the request body. Explicit placement still runs admission checks.

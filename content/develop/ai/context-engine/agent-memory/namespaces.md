---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Group session memory and long-term memory with optional namespaces.
hideListLinks: true
linktitle: Namespaces
title: Namespaces
weight: 13
---

Namespaces are optional. Use them to group memories for a project, team, or user. For example, a travel agent can keep a user's trip memories in a personal `travel` namespace.

Create the namespace before writing to it. The response contains a server-generated `namespaceId`. Save this ID and use it in `namespaceRef` on session events and long-term memory writes. You will also use this ID to search for memories in that namespace. Names and paths can change when you rename a namespace, but its ID stays the same.

## Create a namespace hierarchy

Choose a root scope when you create a namespace:

| Scope | Creation fields | Example use |
|:------|:----------------|:------------|
| `PERSONAL` | `name`, `scope`, and `ownerId` | A user's travel plans. |
| `SHARED` | `name` and `scope`, without `ownerId` | Information used across a team. |

Create a child with `name` and `parentId`. You can also create a hierarchy with `path`, such as `travel/japan`, and the root scope. Supply `ownerId` for a personal path. Missing path segments are created as needed. Do not combine `path` with `name` or `parentId`.

Names and paths are case-sensitive. The path does not encode scope. Use the returned ID to distinguish namespaces that have the same path under different owners or scopes.

For runnable examples, see [Create a personal namespace]({{< relref "/develop/ai/context-engine/agent-memory/namespaces#create-a-personal-namespace" >}}) or [Create a shared namespace]({{< relref "/develop/ai/context-engine/agent-memory/namespaces#create-a-shared-namespace" >}}).

## Place and retrieve memories

Pass `namespaceRef: {"namespaceId": "<namespace-id>"}` when you start a session. Memories extracted from the session use that namespace. Use a new session ID when adding a namespace to the quickstart example.

For direct long-term memory creation, set `namespaceRef` on each record. To move existing records, use `MoveLongTermMemories` with their IDs and the destination `namespaceRef`. Check both `moved` and `errors` in the response before treating a batch as complete.

Search with `filter.namespaceRef.eq` for one namespace or `filter.namespaceRef.in` for several IDs. These filters match exact namespace IDs; they do not expand a parent into its descendants. List the children and include their IDs when you need to search several levels of a hierarchy. Keep the `ownerId` filter when recalling one user's memories. Namespace scope and search filters do not replace your application's access checks.

## Manage namespaces

| Operation | Behavior |
|:----------|:---------|
| List | List roots, or pass `parentId` to list direct children. Follow `nextPageToken` for additional pages. |
| Get | Retrieve the current name, path, scope, and state by ID. |
| Rename | Update `name`; continue using the same ID for placement and retrieval. |
| Archive | Set `state` to `ARCHIVED` to stop new children and placements. The update application programming interface (API) does not offer an unarchive transition. |
| Delete | Delete an empty leaf namespace. A namespace with children or memory placements returns `409 Conflict`. |

Creating a namespace at an occupied location returns `409 Conflict`, including when the existing namespace is archived. Save and reuse the returned ID instead of creating the same namespace on each agent turn. For request fields and error responses, see the [namespace API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/CreateNamespace).

## Create a personal namespace

Complete the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}) first. Reuse its client, connection values, and user and session identifiers. Add Python snippets inside the `with` block and TypeScript snippets inside `run`. Run curl commands in the same shell. Run each write once; comment out completed writes and their output statements before rerunning an SDK file.

Namespaces are optional. This example uses a personal namespace to group the trip memories.

{{< multitabs id="namespace" tab1="Python" tab2="TypeScript" tab3="curl" >}}

Add this code inside the `with` block. It creates a personal namespace for the user's travel memories when `NAMESPACE_ID` is not set:

```python
        namespace_id = os.environ.get("NAMESPACE_ID")
        if not namespace_id:
            created_namespace = agent_memory.create_namespace(request={
                "name": "travel",
                "scope": models.NamespaceScope.PERSONAL,
                "owner_id": USER_ID,
            })
            namespace_id = created_namespace.namespace.namespace_id
            print(f'export NAMESPACE_ID="{namespace_id}"')
        namespace_ref = {"namespace_id": namespace_id}
```

Run the file once, then run the printed `export` command in your shell before running the file again. Later runs reuse that ID. Creating the same namespace again returns `409 Conflict`. If you lose the ID, use `list_namespaces` with `scope="PERSONAL"` and `owner_id=USER_ID` to find it.

Use a fresh `SESSION_ID` if you already ran this quickstart without a namespace. For new session events, add `namespace_ref=namespace_ref` in Python, `namespaceRef` in TypeScript, or `"namespaceRef": {"namespaceId": "$NAMESPACE_ID"}` in curl. Extracted memories use the session namespace.

-tab-sep-

Add this code inside `run`. It creates a personal namespace for the user's travel memories when `NAMESPACE_ID` is not set:

```typescript
  let namespaceId = process.env.NAMESPACE_ID;
  if (!namespaceId) {
    const createdNamespace = await agentMemory.createNamespace({
      name: "travel",
      scope: "PERSONAL",
      ownerId: userId,
    });
    namespaceId = createdNamespace.namespace.namespaceId;
    console.log(`export NAMESPACE_ID="${namespaceId}"`);
  }
  const namespaceRef = { namespaceId };
```

Run the file once, then run the printed `export` command in your shell before running the file again. Later runs reuse that ID. Creating the same namespace again returns `409 Conflict`. If you lose the ID, use `listNamespaces` with `scope: "PERSONAL"` and `ownerId: userId` to find it.

Use a fresh `sessionId` if you already ran this quickstart without a namespace. For new session events, add `namespace_ref=namespace_ref` in Python, `namespaceRef` in TypeScript, or `"namespaceRef": {"namespaceId": "$NAMESPACE_ID"}` in curl. Extracted memories use the session namespace.

-tab-sep-

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

Use a fresh `SESSION_ID` if you already ran this quickstart without a namespace. For new session events, add `namespace_ref=namespace_ref` in Python, `namespaceRef` in TypeScript, or `"namespaceRef": {"namespaceId": "$NAMESPACE_ID"}` in curl. Extracted memories use the session namespace.

{{< /multitabs >}}

## Create a shared namespace

A shared namespace groups memories that an application uses across users or agents. For example, a travel-planning team can use a shared `team-travel` namespace for information that everyone on the team needs. The namespace has `SHARED` scope and no namespace owner. Individual long-term memories still have their own `ownerId` values.

Applications use the same namespace ID when starting sessions or creating long-term memories for the team. Each conversation keeps its own session ID. Memories extracted from those sessions use the shared namespace, so a later search can recall information from several conversations and owners.

Your application decides who can contribute to and retrieve the team's memories. Check the user's access before writing or searching. `SHARED` scope describes how memories are grouped; it does not grant users permission to access them.

Use the client and connection values from the [quickstart]({{< relref "/develop/ai/context-engine/agent-memory/quickstart" >}}). Create the namespace with `scope` set to `SHARED` and omit `ownerId`:

{{< multitabs id="shared-namespace" tab1="Python" tab2="TypeScript" tab3="curl" >}}

Add this code inside the `with` block:

```python
        shared_namespace_id = os.environ.get("SHARED_NAMESPACE_ID")
        if not shared_namespace_id:
            shared_namespace = agent_memory.create_namespace(request={
                "name": "team-travel",
                "scope": models.NamespaceScope.SHARED,
            })
            shared_namespace_id = shared_namespace.namespace.namespace_id
            print(f'export SHARED_NAMESPACE_ID="{shared_namespace_id}"')
        shared_namespace_ref = {"namespace_id": shared_namespace_id}
```

Run the file once, then run the printed `export` command in your shell. Later runs reuse the namespace ID.

-tab-sep-

Add this code inside `run`:

```typescript
  let sharedNamespaceId = process.env.SHARED_NAMESPACE_ID;
  if (!sharedNamespaceId) {
    const sharedNamespace = await agentMemory.createNamespace({
      name: "team-travel",
      scope: "SHARED",
    });
    sharedNamespaceId = sharedNamespace.namespace.namespaceId;
    console.log(`export SHARED_NAMESPACE_ID="${sharedNamespaceId}"`);
  }
  const sharedNamespaceRef = { namespaceId: sharedNamespaceId };
```

Run the file once, then run the printed `export` command in your shell. Later runs reuse the namespace ID.

-tab-sep-

Run this request once and save the returned ID:

```sh
SHARED_NAMESPACE_ID=$(curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data '{"name":"team-travel","scope":"SHARED"}' \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/namespaces" | jq -er '.namespace.namespaceId')
export SHARED_NAMESPACE_ID
printf '%s\n' "$SHARED_NAMESPACE_ID"
```

Continue after the request succeeds and prints a namespace ID. Reuse that ID for later requests.

{{< /multitabs >}}

Creating the same root again returns `409 Conflict`. If you lose the ID, list root namespaces with `scope=SHARED` and find `team-travel`.

To add a conversation to this namespace, use a new session ID and set its first event's namespace reference to the shared ID. Use `namespace_ref=shared_namespace_ref` in Python, `namespaceRef: sharedNamespaceRef` in TypeScript, or `"namespaceRef": {"namespaceId": "$SHARED_NAMESPACE_ID"}` in curl. For direct long-term memory creation, set the reference on each record. Creating the namespace does not move existing memories into it.

### Recall shared memories

After writing memories to the shared namespace, search with its namespace ID. The examples omit the owner filter so results can include memories associated with different owners in that namespace. Add an `ownerId` filter when you need only one owner's memories. An empty namespace returns no memories.

{{< multitabs id="shared-memory-search" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
        shared_results = agent_memory.search_long_term_memory(request={
            "text": "What travel requirements has the team discussed?",
            "filter_": {"namespace_ref": {"eq": shared_namespace_id}},
            "limit": 5,
        })
        show("Shared travel memories", shared_results)
```

-tab-sep-

```typescript
  const sharedResults = await agentMemory.searchLongTermMemory({
    text: "What travel requirements has the team discussed?",
    filter: { namespaceRef: { eq: sharedNamespaceId } },
    limit: 5,
  });
  console.dir(sharedResults, { depth: null });
```

-tab-sep-

```sh
curl --fail-with-body --silent --show-error \
  --request POST \
  --header "Authorization: Bearer $API_KEY" \
  --header 'Content-Type: application/json' \
  --data "$(jq -n --arg ns "$SHARED_NAMESPACE_ID" \
    '{text: "What travel requirements has the team discussed?", filter: {namespaceRef: {eq: $ns}}, limit: 5}')" \
  "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search" | jq
```

{{< /multitabs >}}

The namespace filter selects that exact namespace. To search its children too, list them and include their IDs with `filter.namespaceRef.in`.

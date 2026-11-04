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

Namespaces are optional. Use them to group memories for a project, team, or user. For example, a travel agent can keep a user's trip memories in a personal `example-travel` namespace.

Create the namespace before writing to it. The response contains a server-generated `namespaceId`. Save this ID and use it as `namespaceId` on session events and long-term memory writes. You will also use this ID to search for memories in that namespace. Names and paths can change when you rename a namespace, but its ID stays the same.

## Create a personal namespace

{{< embed-md "agent-memory-continue-from-quickstart.md" >}}

This example uses a personal namespace to group the trip memories. It creates a personal namespace for the user's travel memories and keeps the returned ID:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-personal-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Save the ID and reuse it on later runs. Creating the same namespace again returns `409 Conflict`. If you lose the ID, list personal roots with `scope=PERSONAL` and `ownerId` set to the user ID, then find the namespace by name.

Start a new session with this namespace. Extracted memories inherit it:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-personal-session" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

## Create a shared namespace

A shared namespace groups memories that an application uses across users or agents. For example, a travel-planning team can use a shared `example-team-travel` namespace for information that everyone on the team needs. The namespace has `SHARED` scope and no namespace owner. Individual long-term memories still have their own `ownerId` values.

Applications use the same namespace ID when starting sessions or creating long-term memories for the team. Each conversation keeps its own session ID. Memories extracted from those sessions use the shared namespace, so a later search can recall information from several conversations and owners.

Your application decides who can contribute to and retrieve the team's memories. Check the user's access before writing or searching. `SHARED` scope describes how memories are grouped; it does not grant users permission to access them.

Create the namespace with `scope` set to `SHARED` and no `ownerId`. In Python, `memory.shared_namespace()` returns the ID of the shared namespace with that name, and creates the namespace only if it does not exist. The cURL request creates the namespace directly:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-shared-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Creating the same root again returns `409 Conflict`. If you lose the ID, list root namespaces with `scope=SHARED` and find `example-team-travel`, or call `memory.shared_namespace()` again.

To add a conversation to this namespace, use a new session ID and set its first event's namespace ID to the shared ID. Use `memory.conversation(..., namespace_id=shared_namespace_id)` in Python, or set `"namespaceId"` on the first event in cURL. For direct long-term memory creation, set the namespace ID on each record. Creating the namespace does not move existing memories into it.

This example creates one team memory in the shared namespace:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-shared-remember" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

### Recall shared memories

After writing memories to the shared namespace, search with its namespace ID. An empty namespace returns no memories.

`memory.recall()` searches the owner's memories and then each namespace in `shared`. The shared searches have no owner filter, so results can include memories associated with different owners in that namespace. The CLI `--shared` option takes the namespace name. The cURL request searches only the shared namespace. Add an `ownerId` filter when you need only one owner's memories.

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-shared-recall" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The namespace filter selects that exact namespace. To search its children too, list them and include their IDs with `filter.namespaceId.in`.

## Place and retrieve memories

Pass `"namespaceId": "<namespace-id>"` on the first event when you start a session. The first event fixes the session namespace. Later events cannot add or change it. Memories extracted from the session use that namespace, so use a new session ID when adding a namespace to the quickstart example.

For direct long-term memory creation, set `namespaceId` on each record. To move one existing memory, send `PATCH /iris/data/v1/agent-memory/stores/{storeId}/memories/{memoryId}` with only `namespaceId` (`memory.client.update_long_term_memory()` in Python). A namespace-only update keeps the memory's current expiration (TTL):

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-place-patch" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

To move several memories in one request, use `POST /iris/data/v1/agent-memory/stores/{storeId}/memories/move` (`memory.client.move_long_term_memories()` in Python) with their IDs and the destination `namespaceId`. Both requests run admission checks at the destination. Check both `moved` and `errors` in a bulk move response before treating the batch as complete:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-place-move" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Search with `filter.namespaceId.eq` for one namespace or `filter.namespaceId.in` for several IDs. These filters match exact namespace IDs; they do not expand a parent into its descendants. List the children and include their IDs when you need to search several levels of a hierarchy. Keep the `ownerId` filter when recalling one user's memories:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-place-search" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Your application must check that the current user can access each namespace before querying it. In on-prem deployments with ownership enforcement enabled, personal namespace access follows the root owner's authenticated user ID. Shared namespaces are accessible to callers with the required store permission. If a shared namespace is only for one team, enforce that rule in your application or use separate stores and grants. See [Authorize every memory request](/content/develop/ai/context-engine/agent-memory/developer-guide.md#authorize-every-memory-request).

## Create a namespace hierarchy

Choose a root scope when you create a namespace:

| Scope | Creation fields | Example use |
|:------|:----------------|:------------|
| `PERSONAL` | `name`, `scope`, and `ownerId` | A user's travel plans. |
| `SHARED` | `name` and `scope`, without `ownerId` | Information used across a team. |

Create a child with `name` and `parentId`. You can also create a hierarchy with `path`, such as `example-travel/kyoto`, and the root scope. Supply `ownerId` for a personal path. Missing path segments are created as needed. Do not combine `path` with `name` or `parentId`.

This example creates a child of the personal namespace:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-child-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

This example creates a personal path. It reuses the existing `example-travel` root and creates the missing `kyoto` segment:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-path-create" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Names and paths are case-sensitive. The path does not encode scope. Use the returned ID to distinguish namespaces that have the same path under different owners or scopes.

List direct children with `parentId`:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-list-children" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

## Manage namespaces

| Operation | Behavior |
|:----------|:---------|
| List | List roots, or pass `parentId` to list direct children. Sort by `id`, `name`, `createdAt`, or `updatedAt` with `sortBy`; `sortOrder` accepts `ASC` or `DESC`. Defaults are `id` and `ASC`. Follow `nextCursor` with the same filters and sort options. |
| Get | Retrieve the current name, path, scope, and state by ID. |
| Rename | Update `name`; continue using the same ID for placement and retrieval. |
| Archive | Set `state` to `ARCHIVED` to stop new children and placements. You cannot unarchive a namespace. |
| Delete | Delete an empty leaf namespace. A namespace with children or memory placements returns `409 Conflict`. |

Creating a namespace at an occupied location returns `409 Conflict`, including when the existing namespace is archived. Save and reuse the returned ID instead of creating the same namespace on each agent turn. For request fields and error responses, see the [namespace API reference]({{< relref "/develop/ai/context-engine/agent-memory/api-reference" >}}#operation/CreateNamespace).

## Sort namespaces

This example lists shared roots by name:

{{< clients-example set="iris_agent_memory_namespaces" step="namespace-sort" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Name sorting uses the display name with Redis text collation, rather than the hierarchy path. Equal sort values use namespace ID ascending as a tie-breaker.

## Route and admit shared memories

An explicit namespace destination must pass its admission rules. Direct creation without a namespace stays unassigned. To route an existing shared memory, omit `namespaceId` from a move request. Personal and unassigned memories are not candidates for automatic routing. See [Namespace routing](/content/develop/ai/context-engine/agent-memory/namespaces/namespace-routing.md) for policy setup, examples, and per-item errors.

## Delete the example namespaces

Only an empty leaf namespace can be deleted. This example deletes the example user's session data and long-term memories, then deletes each example namespace after its children. Wait until extraction for the example session finishes first; a namespace that still has memory placements returns `409 Conflict`.

{{< clients-example set="iris_agent_memory_namespaces_delete" step="namespace-delete" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

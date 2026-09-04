---
Title: Self-managed LangCache
alwaysopen: false
categories:
- docs
- operate
- iris
description: Deploy, configure, secure, and operate LangCache on a self-managed Kubernetes cluster.
linkTitle: Self-managed
weight: 40
hideListLinks: true
---

LangCache is a semantic caching service that stores LLM responses for fast,
cheaper retrieval. Applications send prompts to LangCache, which returns a
cached response for a semantically similar prior prompt or calls out to your
embedding provider and stores a new entry when there is no match.

This guide covers deployment, configuration, security, and operations for
self-managed LangCache.

The [LangCache API]({{< relref "/develop/ai/context-engine/langcache/api-reference" >}})
is the shared Data Plane API for Redis Cloud and self-managed deployments. The
[Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}})
documents the self-managed admin endpoints for caches.

{{< note >}}
Self-managed LangCache is available as a private preview. You need a license
key to deploy it. Contact your Redis representative or
[contact sales](https://redis.io/contact/).
{{< /note >}}

## What you are deploying

One `helm install` of the `langcache` chart always creates the Data Plane and
the Control Plane, plus either a bundled or an external Identity Service.
There is no lighter-weight "Data Plane only" install for self-managed
LangCache — every cache is created and managed through the Control Plane, and
every Data Plane request is authenticated by the Identity Service.

| Component | Purpose | Default service |
| --- | --- | --- |
| LangCache Data Plane | Cache-scoped runtime API for set, search, flush, and conversational search. | `langcache:9000` |
| LangCache Control Plane | Admin API for creating and managing caches. | `langcache-controlplane:9100` |
| Identity Service | Issues and validates the agent keys the Data Plane requires. Bundled by the chart (default) or an external instance your suite already runs. | `langcache-identity-service:9200` (bundled mode) |
| Cache Redis | Holds cache entries and RediSearch vector indexes. Registered by ID in the Control Plane's database registry — the Data Plane has no database registry of its own. | Customer-provided |
| Metadata Redis | Holds Control Plane cache records. Can be the same Redis instance as Cache Redis, in a separate keyspace. | Customer-provided |

### How the components work together

1. Platform admins use the Control Plane to create and manage caches,
   selecting a Cache Redis target by `databaseId` from the Control Plane's
   own database registry.
1. The Control Plane writes cache records to Metadata Redis, including the
   resolved Redis URLs for that cache, and synchronously provisions the
   RediSearch vector index in Cache Redis.
1. Platform admins mint agent keys through the Identity Service, granting
   `lc-cache:<cache-id>` permissions.
1. Agents and applications call the Data Plane with a cache ID and an agent
   key.
1. The Data Plane introspects the key against the Identity Service, reads
   the cache's metadata (including its Redis URLs) from Metadata Redis, and
   reads or writes entries in Cache Redis.

### API surfaces

All Data Plane APIs are scoped to a cache. A cache is the logical isolation
boundary for cached entries.

| API surface | Endpoint prefix | Purpose |
| --- | --- | --- |
| Cache entries | `/v1/caches/{cacheId}/entries` | Set, search, delete, and flush cached entries. |
| Conversational search | `/v1/caches/{cacheId}/conversations/search` | Search using conversation history context. |
| Cache health | `/v1/caches/{cacheId}/health` | Cache-scoped health status. |
| Control Plane | `/v1/caches`, `/v1/embedding-providers` | Self-managed administration for caches. |
| Identity Service | `/v1/api-keys` | Mint, list, update, revoke, and rotate agent keys and their cache grants. |

Start with [prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}}),
then follow [Deploy self-managed LangCache]({{< relref "/operate/iris/langcache/self-managed/deploy" >}}).

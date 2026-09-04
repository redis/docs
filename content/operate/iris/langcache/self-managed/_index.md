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
key and access to the container images and Helm chart. Contact your Redis
representative or [contact sales](https://redis.io/contact/).
{{< /note >}}

## What you are deploying

A standard self-managed LangCache deployment contains:

| Component | Purpose | Default service |
| --- | --- | --- |
| LangCache Data Plane (static caches) | Cache-scoped runtime API for set, search, flush, and conversational search. | `langcache:8080` |
| LangCache Data Plane (Control Plane managed caches) | The same runtime API, served by the on-prem-hardened binary that only supports Control Plane managed caches and agent-key auth. | `langcache:9000` |
| LangCache Control Plane | Optional admin API for creating and managing caches. | `langcache-controlplane:9100` |
| Identity Service | Shared suite service that issues and validates LangCache agent keys for Control Plane managed caches. | `iris-identity-service:9200` |
| Cache Redis | Holds cache entries and RediSearch vector indexes. | Customer-provided |
| Metadata Redis | Holds Control Plane cache records and, when agent-key auth is used, key/grant records. | Required for Control Plane managed caches |

Static caches and Control Plane managed caches use different Data Plane
binaries and default ports; see
[Plan a deployment]({{< relref "/operate/iris/langcache/self-managed/plan-deployment" >}}).

### How the components work together

The Data Plane handles runtime cache requests. The optional Control Plane
handles cache administration.

| Flow | Caller | Service | Backing Redis |
| --- | --- | --- | --- |
| Cache administration | Platform admin | LangCache Control Plane | Metadata Redis, Cache Redis (to provision the index) |
| Agent-key issuance and grants | Platform admin | Identity Service | Metadata Redis |
| Runtime cache requests | Agent, app, or gateway | LangCache Data Plane | Cache Redis |

1. Platform admins use the Control Plane to create and manage caches.
1. The Control Plane writes cache records to Metadata Redis and synchronously
   provisions the RediSearch vector index in Cache Redis.
1. When agent-key auth is used, platform admins mint keys and grants through
   the Identity Service.
1. Agents and applications call the Data Plane with a cache ID.
1. The Data Plane resolves cache metadata (static config or, for Control Plane
   managed caches, Metadata Redis) and reads or writes entries in Cache Redis.

### API surfaces

All Data Plane APIs are scoped to a cache. A cache is the logical isolation
boundary for cached entries.

| API surface | Endpoint prefix | Purpose |
| --- | --- | --- |
| Cache entries | `/v1/caches/{cacheId}/entries` | Set, search, delete, and flush cached entries. |
| Conversational search | `/v1/caches/{cacheId}/conversations/search` | Search using conversation history context. |
| Cache health | `/v1/caches/{cacheId}/health` | Cache-scoped health status. |
| Control Plane | `/v1/caches`, `/v1/embedding-providers` | Self-managed administration for caches. |

## Deployment modes

Start with [Plan a deployment]({{< relref "/operate/iris/langcache/self-managed/plan-deployment" >}})
to choose between static caches and Control Plane managed caches.

| If you need to | Go to |
| --- | --- |
| Review software, Redis, network, Secret, image, and sizing requirements | [Prerequisites]({{< relref "/operate/iris/langcache/self-managed/prerequisites" >}}) |
| Prepare `dataplane.config.yaml` for either deployment mode | [Data Plane configuration]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration" >}}) |
| Deploy a first-install or single-cache setup without the Control Plane | [Deploy with static caches]({{< relref "/operate/iris/langcache/self-managed/deploy-static" >}}) |
| Deploy runtime cache administration | [Deploy with Control Plane managed caches]({{< relref "/operate/iris/langcache/self-managed/deploy-control-plane" >}}) |

Do not combine static `metadata.caches` with Control Plane managed cache
metadata in the same Data Plane process. Static caches do not use Metadata
Redis. Control Plane managed caches use `metadata.loader: live` and require
Metadata Redis.

{{< warning >}}
Do not expose an auth-disabled Data Plane to untrusted callers. Static caches
default to no Data Plane authentication; any caller that can reach the API can
read or write cached entries for configured caches. Use that mode only when
Kubernetes NetworkPolicy, private service exposure, ingress/gateway policy,
service mesh, or equivalent controls restrict access to trusted components.
{{< /warning >}}

## Availability and packaging

Self-managed LangCache is newer than self-managed Redis Agent Memory (RAM) and
its packaging is still catching up:

- The published `langcache` Helm chart currently deploys only the Data Plane.
  It does not yet have a `controlplane.enabled` toggle like the RAM chart.
  [Deploy with Control Plane managed caches]({{< relref "/operate/iris/langcache/self-managed/deploy-control-plane" >}})
  shows how to run the Control Plane as a plain Kubernetes Deployment using the
  Control Plane container image until chart support ships.
- Control Plane managed caches with agent-key Data Plane authentication depend
  on the shared Identity Service, the same suite component RAM's chart
  installs as `redis-agent-memory-identity-service`. LangCache's chart does
  not template it yet either; see
  [Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}).
- There is currently no public Docker Hub or Helm repository for LangCache
  self-managed artifacts. Get the chart and images from your Redis
  representative.

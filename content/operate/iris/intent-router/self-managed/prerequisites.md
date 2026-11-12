---
Title: Self-managed Intent Router prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check the software, Redis databases, embedding provider, network access, and Secrets you need before you deploy Redis Intent Router.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

Self-managed Intent Router runs in the `redis-iris` suite and depends on Redis databases, an embedding provider, and Secrets that you set up first. The suite doesn't create the databases or the provider connection for you. This page lists what Intent Router needs on top of the [suite prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites), before you [deploy it](/content/operate/iris/intent-router/self-managed/deploy.md). It ends with the values that stop an install when they're wrong.

## What you need

- The [suite prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites): the cluster, Helm, the suite license, and the Identity Service the suite installs.
- Two physically separate Redis deployments: one for Router records and one for intents and examples. The services reject aliased endpoints.
- An embedding provider. The `noop` provider is for development only.
- `jq` and `curl`, for the administration examples.

## Redis databases

The suite creates no Redis databases. Create them first.

| Database | Holds | Requirements |
| --- | --- | --- |
| Metadata Redis | Router records, and the mailbox the planes coordinate through. | Persistence. Needs no Search. |
| Data-plane Redis | Intents, examples, and one vector index for each Router. | The Search and Query engine (RediSearch 2.4.3 or later): a Redis 8 build that includes it, such as the official `redis:8` image, or a database with the module loaded. |

Without Search, the data plane's `vectorSearch` readiness check fails and a new Router is `FAILED` with a reason that says so. Where the platform allows it, set `search-on-timeout` to `FAIL` on the data-plane Redis. The default, `RETURN`, lets a search that hits the server timeout return partial results.

### Size memory

The data plane builds one Hierarchical Navigable Small World (HNSW) vector index for each Router. Each index takes about the number of examples times the embedding dimensions times 4 bytes for the vectors, plus the graph. For example, 100,000 examples at 1,536 dimensions take about 600 megabytes (MB) of vectors. Size the data-plane Redis for the examples you expect, and plan for growth.

### Customer databases

By default every Router keeps its data in the data-plane Redis. To let Routers live in a customer's own Redis, register those databases in the configuration. See [Customer databases](/content/operate/iris/intent-router/self-managed/configuration.md#customer-databases).

## Embedding provider

A deployment offers one embedding model, and every Router embeds its examples and queries with it. The data plane needs a connection to the model's provider. A Router's model is fixed when it is created, so choose the model before you create Routers. See [Embedding models](/content/operate/iris/intent-router/self-managed/configuration.md#embedding-models).

The `noop` provider needs no connection, but it matches by shared words, not meaning. The chart refuses it unless you set `intent.inference.allowLocalModels: true`.

## Network access

| From | To | Why |
| --- | --- | --- |
| Operators | Control plane `9400` | Router administration. |
| Applications | Data plane `9401` | Authoring and matching. |
| Operators | Identity Service `9200` | Agent-key administration. |
| Identity Service | Control plane `9400` | Grant validation. |
| Data plane | Identity Service `9200` | Agent-key introspection. |
| Data plane | Embedding provider | Embedding examples and queries. |
| Control plane, data plane | Metadata Redis and data-plane Redis | Storage and the mailbox. |

The suite package includes `redis-iris/charts/redis-intent-router/networkpolicy.reference.yaml`, a default-deny starting point. Get it with `helm pull redis-ai/redis-iris --version 1.0.0 --untar`. Replace every `<placeholder>` before you apply it. The suite labels the Intent Router pods `app.kubernetes.io/name: intent` and the Identity Service pods `identityService`, so change the file's `redis-intent-router` and `iris-identity-service` selectors to match.

## Credentials and Secrets

Create the storage Secret that holds the Redis URLs, and an inference Secret when you use a provider other than `noop`. The suite generates the admin token (`iris-intent-admin-token`), the internal token, and the data plane's Identity Service credential, and registers them with its Identity Service. See [Service Secrets and Redis databases](/content/operate/iris/self-managed/_index.md#service-secrets-and-redis-databases) and [Authentication and authorization](/content/operate/iris/intent-router/self-managed/authentication.md#credentials).

## Images

The suite pins the two images, `redislabs/iris-intent-router-control` and `redislabs/iris-intent-router-data`, to `1.0.0`. To install from a private registry, mirror both images, then set `intent.controlplane.image.repository`, `intent.dataplane.image.repository`, and `global.imagePullSecrets`.

## Helm values to review

Rendering fails with a named message when:

- `intent.storage.existingSecret` is missing.
- `intent.inference.models` doesn't list exactly one model, or lists `noop` without `intent.inference.allowLocalModels: true`.
- `intent.inference.existingSecret` is missing for a provider other than `noop`.
- `intent.dataplane.startupBudget` isn't a duration, or is longer than the liveness probe allows.
- A value differs from the one the suite derives, such as the tenant or the Identity Service connection.

See [Configuration](/content/operate/iris/intent-router/self-managed/configuration.md).

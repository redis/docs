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

Self-managed Intent Router runs on your Kubernetes cluster and depends on Redis databases, an embedding provider, and Secrets that you set up first. The chart doesn't create the databases or the provider connection for you. This page lists what you need before you [deploy the chart](/content/operate/iris/intent-router/self-managed/deploy.md): the software, the Redis databases and how to size them, the embedding provider, network access, credentials, and image tags. It ends with the Helm values that stop an install when they're wrong.

## What you need

- A Kubernetes cluster and a namespace for the release.
- Two physically separate Redis deployments: one for Router records and one for intents and examples. The services reject aliased endpoints.
- An Identity Service release, installed separately, that knows the `intent` product.
- An embedding provider. The `noop` provider is for development only.
- A license, delivered by Redis.
- Image tags for the control-plane and data-plane images.

## Required software

| Software | Requirement |
| --- | --- |
| Kubernetes | A cluster that can run the chart's Deployments, Services, and Secrets. |
| Helm | Helm 3. |
| `kubectl` | Configured for the cluster and namespace. |
| `jq` and `curl` | For the administration examples. |

## Redis databases

The chart creates no Redis databases. Create them first.

| Database | Holds | Requirements |
| --- | --- | --- |
| Metadata Redis | Router records, and the mailbox the planes coordinate through. | Persistence. Needs no Search. |
| Data-plane Redis | Intents, examples, and one vector index for each Router. | The Search and Query engine (RediSearch 2.4.3 or later): a Redis 8 build that includes it, such as the official `redis:8` image, or a database with the module loaded. |
| Identity Service metadata | Agent-key records. Configured on the Identity Service release, not in this chart. | Persistence. It can share the metadata Redis deployment, with its own least-privileged Redis user. |

Without Search, the data plane's `vectorSearch` readiness check fails and a new Router is `FAILED` with a reason that says so. Where the platform allows it, set `search-on-timeout` to `FAIL` on the data-plane Redis. The default, `RETURN`, lets a search that hits the server timeout return partial results.

### Size memory

The data plane builds one Hierarchical Navigable Small World (HNSW) vector index for each Router. Each index takes about the number of examples times the embedding dimensions times 4 bytes for the vectors, plus the graph. For example, 100,000 examples at 1,536 dimensions take about 600 megabytes (MB) of vectors. Size the data-plane Redis for the examples you expect, and plan for growth.

### Customer databases

By default every Router keeps its data in the data-plane Redis. To let Routers live in a customer's own Redis, register those databases in the configuration. See [Customer databases](/content/operate/iris/intent-router/self-managed/configuration.md#customer-databases).

## Embedding provider

A deployment offers one embedding model, and every Router embeds its examples and queries with it. The data plane needs a connection to the model's provider. A Router's model is fixed when it is created, so choose the model before you create Routers. See [Embedding models](/content/operate/iris/intent-router/self-managed/configuration.md#embedding-models).

The `noop` provider needs no connection, but it matches by shared words, not meaning. The chart refuses it unless you set `inference.allowLocalModels=true`.

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
| Identity Service | Identity Service metadata Redis | Agent-key records. |

The chart ships `networkpolicy.reference.yaml`, a default-deny starting point. Replace every `<placeholder>` before you apply it.

## Credentials and Secrets

Create these Secrets before you install: the storage Secret that holds the Redis URLs, the license Secret, the data plane's Identity Service credential, and an inference Secret when you use a provider other than `noop`. The chart can generate the control-plane admin and internal tokens, or you can supply them. It never generates the data plane's Identity Service credential: you create it and register it on the Identity Service release. See [Authentication and authorization](/content/operate/iris/intent-router/self-managed/authentication.md#credentials).

## Release artifacts and image tags

The chart requires an explicit `tag` for each image. Rendering fails with a named message when one is missing. Use the image tags from the release manifest for the chart version you install.

## Helm values to review

Rendering fails with a named message when:

- `tenantId`, `storage.existingSecret`, `license.existingSecret`, `dataplane.identityServiceBaseURL`, `identityService.credential.existingSecret`, or an image tag is missing.
- `inference.models` doesn't list exactly one model, or lists `noop` without `inference.allowLocalModels=true`.
- `inference.existingSecret` is missing for a provider other than `noop`.
- Two of the admin token, the internal token, and the Identity Service credential reference the same Secret key.
- `dataplane.identityServiceBaseURL` isn't `https://` and `identityService.allowInsecureTransport` isn't `true`.

See [Configuration](/content/operate/iris/intent-router/self-managed/configuration.md).

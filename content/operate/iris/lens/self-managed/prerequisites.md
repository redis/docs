---
Title: Self-managed Lens prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check the software, Redis databases, Identity Service, network access, and Secrets you need before you deploy Lens.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

Self-managed Lens runs on your Kubernetes cluster as part of the `redis-iris` suite, which also installs the Identity Service. Lens depends on Redis databases and a storage Secret that you set up first. This page lists what Lens needs beyond the [suite prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites), before you [deploy it](/content/operate/iris/lens/self-managed/deploy.md).

## What you need

| Requirement | Detail |
| --- | --- |
| Kubernetes | Kubernetes 1.28 or later, and a namespace for the release. |
| Helm | Helm 3.10 or later. Helm 4 isn't supported. |
| `kubectl`, `curl`, and `jq` | For the install and administration examples. |
| Identity Service | Installed by the suite, as `iris-identity-service`. |
| Redis databases | A records database, a content database, and a metadata Redis, as described in [Redis databases](#redis-databases). |
| Container images | Docker Hub: `redislabs/iris-lens-data` (data plane and worker) and `redislabs/iris-lens-control` (control plane). |
| Helm chart | `redis-iris` chart `1.0.0` in the Redis AI Helm repository, `https://helm.redis.io/ai`. |
| License key | The suite license. Contact your Redis representative or [contact sales](https://redis.io/contact/). |

## Redis databases

Lens stores its data in four roles. Map them onto your databases like this:

| Role | Holds | Requirements |
| --- | --- | --- |
| `streams` | Received steps, before the worker assembles them into turns. | A RAM database, not Redis Flex, with `maxmemory-policy noeviction`. |
| `index` | Turns, sessions, and their search indexes. | A RAM database, not Redis Flex, with the Redis Search and Redis JSON modules. Usually the same database as `streams`. |
| `content` | Captured prompts, responses, and tool payloads. | Redis Flex or RAM. It can be the same database as `streams` and `index`. |
| `metadata` | The Lens instance record. | A separate small Redis. Don't put it on a database that holds telemetry. |

Together, `streams` and `index` make up the records database. A Redis Flex records database fails index creation at startup with an error that says so. The Identity Service keeps its own metadata, separate from the Lens `metadata` role.

Nothing trims the `streams` role yet, and it must not evict keys, so its memory grows while ingest is on. Size the records database for the traffic you expect and watch it, as described in [Watch the records database](/content/operate/iris/lens/self-managed/operations.md#watch-the-records-database).

## Network access

| From | To | Why |
| --- | --- | --- |
| Agents | Data plane `9000` | Send turns. |
| Lens UI and read clients | Data plane `9000` | Read sessions and turns. |
| Operators | Control plane `9300` | Read and change the instance's retention. |
| Operators | Identity Service `9200` | Mint and revoke API keys. |
| Identity Service | Control plane `9300` | Validate key grants. |
| Data plane | Identity Service `9200` | Check API keys. |
| Data plane, worker, control plane | Redis databases | Storage. |
| Data plane and control plane | Your identity provider's JSON Web Key Set (JWKS) URL | Only when you turn on [operator sign-in](/content/operate/iris/lens/self-managed/authentication.md#operator-sign-in). |

The worker needs no Identity Service access. The suite creates no Lens Ingress: to reach Lens from outside the cluster, publish the data plane through your own Transport Layer Security (TLS) ingress, as described in [Expose the data plane](/content/operate/iris/lens/self-managed/deploy.md#expose-the-data-plane).

The suite renders no NetworkPolicy objects. The `redis-lens` subchart package includes `networkpolicy.reference.yaml`, a default-deny starting point for these flows. Replace every `<placeholder>` before you apply it.

## Secrets

Lens needs one Secret of its own, the storage Secret, with one configuration file per process. See [Storage Secret](/content/operate/iris/lens/self-managed/configuration.md#storage-secret), and [Deploy](/content/operate/iris/lens/self-managed/deploy.md#1-create-the-lens-secrets) for the command. The license and the Identity Service metadata are [shared suite Secrets](/content/operate/iris/self-managed/_index.md#2-create-the-shared-secrets). The suite generates the admin token, internal token, and runtime credential. See [Credentials](/content/operate/iris/lens/self-managed/authentication.md#credentials).

## Helm values that stop an install

Rendering fails with a named message when:

- `lens.storage.existingSecret` is missing.
- `lens.dataplane.image.tag` or `lens.controlplane.image.tag` is empty.
- `lens.instance.id` isn't `default`.
- A value the suite sets, such as `lens.tenantId`, differs from the one it derives. See [Add the Lens values](/content/operate/iris/lens/self-managed/deploy.md#2-add-the-lens-values).

A storage file that omits a role passes rendering, because Helm can't read the Secret. The pod then fails at startup and names the missing key, for example `create Lens streams Redis client from storage.streams.urls: redis url list is empty`.

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

Self-managed Lens runs on your Kubernetes cluster and depends on Redis databases, an Identity Service release, and Secrets that you set up first. The chart creates none of them. This page lists what you need before you [deploy the chart](/content/operate/iris/lens/self-managed/deploy.md).

## What you need

| Requirement | Detail |
| --- | --- |
| Kubernetes | A cluster and a namespace for the release. |
| Helm | Helm 3. |
| `kubectl`, `curl`, and `jq` | For the install and administration examples. |
| Identity Service | The `iris-identity-service` chart, `1.2.0` or later, installed as its own release. |
| Redis databases | A records database, a content database, and a metadata Redis, as described in [Redis databases](#redis-databases). |
| Container images | Docker Hub: `redislabs/iris-lens-data` (data plane and worker) and `redislabs/iris-lens-control` (control plane). |
| Helm chart | `redis-lens` chart `0.2.1` in the Redis AI Helm repository, `https://helm.redis.io/ai`. |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |

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

The worker needs no Identity Service access. The chart creates no Ingress: to reach Lens from outside the cluster, publish the data plane through your own Transport Layer Security (TLS) ingress, as described in [Expose the data plane](/content/operate/iris/lens/self-managed/deploy.md#expose-the-data-plane).

The chart renders no NetworkPolicy objects. Its package includes `networkpolicy.reference.yaml`, a default-deny starting point for these flows. Replace every `<placeholder>` before you apply it.

## Secrets

Create these Secrets before you install Lens. [Deploy](/content/operate/iris/lens/self-managed/deploy.md#2-create-secrets) shows the commands.

| Secret | Holds | Mounted by |
| --- | --- | --- |
| Storage | One configuration file per process with the Redis URLs. See [Storage Secret](/content/operate/iris/lens/self-managed/configuration.md#storage-secret). | Lens |
| License | The Lens license, under the key `license`. | Lens |
| Data-plane runtime credential | A random token the data plane presents to the Identity Service. | Lens and the Identity Service |
| Control-plane internal token | A random token the Identity Service presents to the control plane. | Lens and the Identity Service |
| Identity Service metadata | The Identity Service's metadata Redis URL. | The Identity Service |
| Identity Service control token | The token operators use to mint API keys. | The Identity Service |

The chart generates the control-plane admin token for you. See [Credentials](/content/operate/iris/lens/self-managed/authentication.md#credentials).

## Helm values that stop an install

Rendering fails with a named message when:

- `tenantId`, `storage.existingSecret`, or `license.existingSecret` is missing.
- `dataplane.image.tag` or `controlplane.image.tag` is empty.
- `dataplane.identityServiceBaseURL` or `identityService.credential.existingSecret` is missing.
- `dataplane.identityServiceBaseURL` isn't `https://` and `identityService.allowInsecureTransport` isn't `true`.
- Two of the admin token, internal token, and runtime credential reference the same Secret key.
- `instance.id` doesn't match `^[A-Za-z0-9._:-]{1,128}$`.

A storage file that omits a role passes rendering, because Helm can't read the Secret. The pod then fails at startup and names the missing key, for example `create Lens streams Redis client from storage.streams.urls: redis url list is empty`.

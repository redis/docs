---
Title: Self-managed Redis Agent Memory prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review software, Redis, network, Secret, image, and sizing prerequisites for self-managed Redis Agent Memory.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/prerequisites/
- /develop/ai/context-engine/agent-memory/self-managed/plan-deployment/
- /operate/iris/agent-memory/self-managed/plan-deployment/
---

Agent Memory installs as the `memory` service of the `redis-iris` Helm chart `1.0`, from the
Redis AI Helm repository `https://helm.redis.io/ai`. The suite deploys the Agent Memory Data Plane,
workers, and Control Plane, with the Identity Service and the Iris console. Start with the
[suite prerequisites](/content/operate/iris/self-managed/_index.md#prerequisites). This page adds
what Agent Memory needs.

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Helm chart | `redis-ai/redis-iris` `1.0` |
| Container images | Docker Hub: `redislabs/agent-memory` and `redislabs/agent-memory-control-plane`, tagged with the chart version, plus the Identity Service and console images the suite installs |
| Redis databases | You provide Store Redis, Job Redis, and Metadata Redis |
| License key | One suite license. Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Provider credentials | You provide embedding provider credentials and, when worker features are enabled, promotion or summarization LLM credentials |

## Redis databases

The suite chart does not deploy Redis databases. Provision them yourself and pass their URLs in
the overlay Secret that `memory.secrets.secretName` names.
The Data Plane and the Control Plane both read the overlay, so they use the same
Metadata Redis and Store Redis.

Store Redis must support Search and JSON capabilities because Redis Agent Memory
creates JSON and vector search indexes for memory data. Job Redis and Metadata
Redis do not need those capabilities when they are deployed as separate Redis
databases.

Store Redis must run Redis 7.2.0 through 8.4.x. Job Redis and Metadata Redis must run
Redis 6.2 or later.

{{< table-scrollable >}}
| Redis database | Required | Key in the overlay Secret | Purpose |
| --- | --- | --- | --- |
| Store Redis | Always | `databases."1".urls` | Session memory JSON, long-term memory hashes, RediSearch indexes, vectors, and TTL-managed data. |
| Metadata Redis | Always | `metadata.urls`, and optionally `metadata.namespace` (default `iris:memory`) | Store records. |
| Job Redis | Always | `background_jobs.redis.urls` and, when execution idempotency is enabled, `background_jobs.idempotency.urls` | Background work, retry state, delayed jobs, and execution markers. The two settings can use the same Redis. |
{{< /table-scrollable >}}

The Identity Service keeps agent-key records in its own Metadata Redis, which it reads from the
Secret in `identityService.metadata.existingSecret`. The Data Plane checks agent keys by calling the Identity Service.

For a lab deployment, the Redis roles can point to the same Redis endpoint if it has the required
modules and capacity. For production, separate Store Redis, Job Redis, and Metadata Redis when
possible so memory data, background work, and control metadata can be scaled, backed up, and
operated independently.

For Job Redis, use a non-evicting policy such as `noeviction` or
`volatile-ttl`.

### Metadata Redis durability

Metadata Redis is small compared with Store Redis, but it is operationally
critical. Use persistent storage, Redis authentication, network isolation, and
TLS where required.

Avoid eviction of metadata keys. Losing Metadata Redis removes Control
Plane store records, and losing the Identity Service Metadata Redis removes agent-key records.

## Network access

- **Connected install:** the cluster must be able to pull images from `docker.io` and reach
  `https://helm.redis.io/ai`.
- **Air-gapped install:** mirror the images into an internal registry, as described in
  [Air-gapped and private registry installs](#air-gapped-and-private-registry-installs).
- **Runtime access:** Redis Agent Memory pods must reach the Redis databases and any
  embedding or LLM provider endpoints used by the deployment.
- **Identity Service:** the Data Plane calls `iris-identity-service:9200`, and the Identity Service
  calls the Control Plane on port `9100` to validate grants. Allow both paths if you restrict traffic.
- **Data Plane exposure:** use NetworkPolicy, ingress, gateway, service mesh,
  private load balancer, or equivalent controls to restrict API access.

## Credentials and Secrets

Create these Secrets before you install. [Deploy](/content/operate/iris/agent-memory/self-managed/deploy.md#1-create-the-agent-memory-secrets)
and [Create the shared Secrets](/content/operate/iris/self-managed/_index.md#2-create-the-shared-secrets) show each one.

| Secret | Values key | Holds |
| --- | --- | --- |
| Suite license | `global.iris.license.existingSecret` | The suite license key. |
| Overlay | `memory.secrets.secretName` | Redis URLs and provider credentials, in the key `overlay.yaml`. |
| Identity Service metadata | `identityService.metadata.existingSecret` | The Identity Service's Metadata Redis URL. |
| Cluster CA | `memory.tls.caCertSecret` | The cluster CA, so workers can verify the ServiceAccount issuer. |

The suite generates Memory's runtime credential, Control Plane internal token, and admin token
(`iris-memory-admin-token`). See [Credentials](/content/operate/iris/self-managed/_index.md#credentials).

## Air-gapped and private registry installs

Mirror these Agent Memory images into your internal registry, along with the images of the
other components the suite installs. Each Redis image tag is the chart version:

| Image | Needed |
| --- | --- |
| `redislabs/agent-memory` | Always (Data Plane and workers) |
| `redislabs/agent-memory-control-plane` | Always |
| `redislabs/iris-identity-service` | Always |
| `curlimages/curl:8.17.0` | The suite preflight (`preflight.image`) |
| `python:3.13-alpine` | `helm test iris` (`tests.suiteVerify.image`) |
| `ghcr.io/jpedrosouza/asynqdash:1.2.0` | Optional, with `memory.controlplane.queueMonitor` |

```bash
skopeo copy --all docker://redislabs/agent-memory:<chart-version> \
  docker://registry.example.com/redislabs/agent-memory:<chart-version>
```

Repeat for each image. `--all` copies every platform. `docker pull` and `docker push` copy only your workstation's, so nodes of the other platform can't pull the image. If the registry requires authentication, create an image pull Secret:

```bash
kubectl -n <namespace-name> create secret docker-registry iris-registry \
  --docker-server=registry.example.com \
  --docker-username=<username> \
  --docker-password=<password>
```

Add the registry settings to `iris-values.yaml`:

```yaml
global:
  imagePullSecrets:
    - name: iris-registry
identityService:
  image:
    repository: registry.example.com/redislabs/iris-identity-service
memory:
  image:
    repository: registry.example.com/redislabs/agent-memory
  controlplane:
    image:
      repository: registry.example.com/redislabs/agent-memory-control-plane
  airgap:
    enabled: true
```

`memory.airgap.enabled: true` checks Memory's own image repositories only. Confirm that every
configured repository is reachable from the cluster. Omit the pull Secret if the registry
doesn't require authentication.

## System requirements

The suite's replica defaults are in [Availability](/content/operate/iris/self-managed/_index.md#availability).
During a rolling update, Kubernetes runs old and new pods at the same time, so a small two-node
test cluster can run out of CPU during install or upgrade. Use at least three nodes, or enough CPU
headroom for the rolling-update overlap.

For a constrained lab cluster, reduce Memory's replicas explicitly:

```yaml
memory:
  server:
    replicaCount: 1
    autoscaling:
      enabled: false
  worker:
    replicaCount: 1
    autoscaling:
      enabled: false
```

Do not use reduced replica counts as the production HA recommendation.

## Helm values to review

These keys go under `memory:` in `iris-values.yaml`. The values the suite sets itself are listed in
[Add the Agent Memory values](/content/operate/iris/agent-memory/self-managed/deploy.md#2-add-the-agent-memory-values).

{{< table-scrollable >}}
| Area | Values | Use when |
| --- | --- | --- |
| Image | `image.repository`, `image.tag` | Selecting a private registry or mirrored image. |
| Air-gapped installs | `airgap.enabled` | Validating a disconnected or private-registry install. |
| Chart-rendered configuration | `shared`, `memory`, `controlplane.configData` | Setting the Data Plane and Control Plane configuration from Helm values. |
| Credentials overlay | `secrets.*` | Naming the overlay Secret and its key, or layering more overlay Secrets. |
| API server capacity | `server.resources`, `server.autoscaling.*` | Tuning request capacity or memory footprint. |
| Worker capacity | `worker.resources`, `worker.autoscaling.*` | Tuning background job throughput. |
| Scheduling | `server.nodeSelector`, `worker.nodeSelector`, `server.affinity`, `worker.affinity`, `server.tolerations`, `worker.tolerations` | Controlling pod placement. |
| Networking | `service.type`, `ingress.*` | Exposing Redis Agent Memory outside the cluster. The Ingress sets no controller annotations by default and routes paths without rewriting, so it works on any controller, such as ingress-nginx or Traefik. Set `ingress.className` (default `nginx`) to your controller's class. |
| Service account | `serviceAccount.*` | Matching customer namespace security policy. |
| Private certificate authority (CA) | `tls.caCertSecret` | Trusting a private CA for outbound connections, such as the cluster CA for [worker identity](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform). |
| Control Plane | `controlplane.image.*`, `controlplane.configData`, `controlplane.adminToken.*` | Mirroring the Control Plane image, setting its configuration, or bringing your own admin token. |
{{< /table-scrollable >}}

Do not use floating image tags in production.

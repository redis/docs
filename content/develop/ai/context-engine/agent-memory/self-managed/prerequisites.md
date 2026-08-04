---
Title: Self-managed Agent Memory prerequisites
alwaysopen: false
categories:
- docs
- develop
- ai
description: Review software, Redis, network, Secret, image, and sizing prerequisites for self-managed Redis Agent Memory.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

Redis Agent Memory is distributed as container images on Docker Hub plus a Helm
chart in the Redis AI Helm repository. The chart deploys the Agent Memory Data
Plane, Agent Memory workers, and optionally the Agent Memory Control Plane.

You provide the Redis databases, provider credentials, Kubernetes exposure, and
license material used by the deployment.

{{< note >}}
This guide is for system administrators deploying Agent Memory on a self-managed
Kubernetes cluster.
{{< /note >}}

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Container images | Docker Hub: `redislabs/agent-memory` and, when the Control Plane is enabled, `redislabs/agent-memory-control-plane` |
| Helm chart | `redis-agent-memory` chart in the Redis AI Helm repository, or a chart package provided by Redis |
| Redis databases | You provide Store Redis, Job Redis, and Metadata Redis as needed by the deployment mode |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Provider credentials | You provide embedding provider credentials and, when worker features are enabled, promotion or summarization LLM credentials |

## Required software

| Software | Minimum version | Purpose |
| -------- | --------------- | ------- |
| Kubernetes | 1.19+ | Orchestration |
| kubectl | 1.19+ | Kubernetes CLI |
| Helm | 3.x | Package manager |

## Redis databases

The Helm chart does not deploy Redis databases. Provision the Redis databases
outside the Agent Memory chart and pass their URLs in
`memory-dataplane.config.yaml` and, when the Control Plane is enabled,
`controlplane-onprem.config.yaml`.

Store Redis must support Search and JSON capabilities because Agent Memory
creates JSON and vector search indexes for memory data. Job Redis and Metadata
Redis do not need those capabilities when they are deployed as separate Redis
databases.

### Static stores

Use static stores for a first install or a private single-store deployment.
Stores are declared directly in `memory-dataplane.config.yaml`. The Control
Plane and Metadata Redis are not used.

{{< table-scrollable >}}
| Redis database | Required when | Configure in `memory-dataplane.config.yaml` | Purpose |
| --- | --- | --- | --- |
| Store Redis | Always | `metadata.stores.<store-id>.urls` | Session memory JSON, long-term memory hashes, RediSearch indexes, vectors, and TTL-managed data. |
| Job Redis | Worker/background jobs enabled | `background_jobs.redis.urls` | Background work, retry state, delayed jobs, and idempotency markers. |
{{< /table-scrollable >}}

### Control Plane managed stores

Use Control Plane managed stores when operators need to create stores or agent
keys at runtime. The Data Plane and Control Plane must point to the same
Metadata Redis namespace and Store Redis.

{{< table-scrollable >}}
| Redis database | Required when | Configure in `memory-dataplane.config.yaml` | Configure in `controlplane-onprem.config.yaml` | Purpose |
| --- | --- | --- | --- | --- |
| Store Redis | Always | `metadata.live.store_db.urls` | `store_db.urls` | Memory data for Control Plane managed stores. |
| Metadata Redis | Always | `metadata.live.urls` and `metadata.live.namespace` | `metadata.urls` and `metadata.namespace` | Store records, agent-key records, and grant metadata. |
| Job Redis | Worker/background jobs enabled | `background_jobs.redis.urls` | Not used by Control Plane | Background work, retry state, delayed jobs, and idempotency markers. |
{{< /table-scrollable >}}

Do not combine static `metadata.stores` with Control Plane managed store
metadata for the same Data Plane. Static stores do not use Metadata Redis.
Control Plane managed stores require Metadata Redis and are required for
agent-key authentication.

For a lab deployment, the Redis roles required by your chosen mode can point to
the same Redis endpoint if it has the required modules and capacity. For
production, separate Store Redis, Job Redis, and Metadata Redis when possible so
memory data, background work, and control metadata can be scaled, backed up, and
operated independently.

For Job Redis, use a non-evicting policy such as `noeviction` or
`volatile-ttl`.

### Metadata Redis durability

Metadata Redis is small compared with Store Redis, but it is operationally
critical. Use persistent storage, Redis authentication, network isolation, and
TLS where required.

In FIPS-oriented deployments, Redis URLs covered by the posture must use
`rediss://`. Avoid eviction of metadata keys; losing metadata removes Control
Plane store records and agent-key records.

## Network access

- **Connected install:** the cluster must be able to pull images from
  `docker.io` and reach the Redis AI Helm repository.
- **Air-gapped install:** mirror the images into an internal registry and use a
  chart package or locally downloaded chart.
- **Runtime access:** Agent Memory pods must reach the Redis databases and any
  embedding or LLM provider endpoints used by the deployment.
- **Data Plane exposure:** use NetworkPolicy, ingress, gateway, service mesh,
  private load balancer, or equivalent controls to restrict API access.

## Credentials and Secrets

The chart consumes configuration and license material from Kubernetes Secrets:

| Secret | Required when | Default key |
| --- | --- | --- |
| Agent Memory license Secret | Always | `license` |
| Agent Memory Data Plane config Secret | Always | `memory-dataplane.config.yaml` |
| Control Plane config Secret | Control Plane enabled | `controlplane-onprem.config.yaml` |
| Control Plane admin-token Secret | Control Plane enabled | `token` |

The config file is mounted as a Secret because it commonly contains provider API
keys and Redis URLs may include credentials.

## Release artifacts and image tags

Agent Memory self-managed image tags use the release SemVer value, for example:

```yaml
image:
  repository: redislabs/agent-memory
  tag: "<ram-version>"
```

Use the image tag listed for the release on Docker Hub or provided by Redis.

Use the chart version supplied by Redis for the release. The published chart is
`redis-ai/redis-agent-memory` from `https://helm.redis.io/ai`.

Standard customer installs use the public Docker Hub images published by the
Agent Memory self-managed release: `docker.io/redislabs/agent-memory:<ram-version>`
and, when the Control Plane is enabled,
`docker.io/redislabs/agent-memory-control-plane:<ram-version>`.

## Air-gapped and private registry installs

Mirror the published images into your internal registry:

```bash
docker pull redislabs/agent-memory:<ram-version>
docker tag redislabs/agent-memory:<ram-version> \
  registry.example.com/redislabs/agent-memory:<ram-version>
docker push registry.example.com/redislabs/agent-memory:<ram-version>

docker pull redislabs/agent-memory-control-plane:<ram-version>
docker tag redislabs/agent-memory-control-plane:<ram-version> \
  registry.example.com/redislabs/agent-memory-control-plane:<ram-version>
docker push registry.example.com/redislabs/agent-memory-control-plane:<ram-version>
```

If the registry requires authentication, create an image pull Secret:

```bash
kubectl -n <namespace-name> create secret docker-registry ram-registry \
  --docker-server=registry.example.com \
  --docker-username=<username> \
  --docker-password=<password>
```

Add the registry settings to `ram-values.yaml`:

```yaml
image:
  repository: registry.example.com/redislabs/agent-memory
  tag: "<ram-version>"

controlplane:
  image:
    repository: registry.example.com/redislabs/agent-memory-control-plane
    tag: "<ram-version>"

imagePullSecrets:
  - name: ram-registry
```

Omit `imagePullSecrets` if the internal registry does not require
authentication.

For air-gapped deployments, also set:

```yaml
airgap:
  enabled: true
```

## System requirements

Default chart values:

| Component | Default | Purpose |
| --------- | ------- | ------- |
| Agent Memory server | 2 replicas with autoscaling enabled and a minimum of 2 | Data Plane API traffic |
| Agent Memory worker | 2 replicas with autoscaling enabled and a minimum of 2 | Background promotion, summarization, and forgetting jobs |
| Agent Memory Control Plane | 1 replica when `controlplane.enabled=true` | Admin API for stores and agent keys |

During a rolling update, Kubernetes may temporarily run old and new pods at the
same time. A small two-node test cluster can run out of CPU during install or
upgrade.

For realistic validation, use at least three nodes or enough CPU headroom for
the maximum rolling-update overlap.

For a constrained lab cluster, reduce replicas and autoscaling explicitly:

```yaml
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

The walkthroughs use `redis-agent-memory` as the Helm release name. The
generated service and deployment names in the verification steps assume that
release name.

{{< table-scrollable >}}
| Area | Values | Use when |
| --- | --- | --- |
| Image | `image.repository`, `image.tag`, `imagePullSecrets` | Selecting a release, private registry, or mirrored image. |
| Air-gapped installs | `airgap.enabled` | Validating a disconnected or private-registry install. |
| API server capacity | `server.resources`, `server.autoscaling.*` | Tuning request capacity or memory footprint. |
| Worker capacity | `worker.resources`, `worker.autoscaling.*` | Tuning background job throughput. |
| Scheduling | `server.nodeSelector`, `worker.nodeSelector`, `server.affinity`, `worker.affinity`, `server.tolerations`, `worker.tolerations` | Controlling pod placement. |
| Networking | `service.type`, `ingress.*` | Exposing Agent Memory outside the cluster. |
| Naming | `fullnameOverride` | Running more than one Agent Memory release in a namespace. |
| Service account | `serviceAccount.*` | Matching customer namespace security policy. |
| Worker authentication | `workerAuth.enabled`, `worker.serviceAccount.*`, `worker.serviceAccount.token.*` | Giving Agent Memory workers a Kubernetes projected service-account token for authenticated Data Plane callbacks. |
| Secret rollouts | `license.existingSecretChecksum`, `config.existingSecretChecksum`, `controlplane.config.existingSecretChecksum` | Rolling pods after externally managed Secret changes. |
| Control Plane | `controlplane.enabled`, `controlplane.image.*`, `controlplane.config.existingSecret`, `controlplane.adminToken.*` | Enabling the optional admin API for stores and agent keys. |
{{< /table-scrollable >}}

Do not use floating image tags in production.

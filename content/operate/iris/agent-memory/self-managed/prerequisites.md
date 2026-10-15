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

Redis Agent Memory is distributed as container images on Docker Hub plus a Helm
chart in the Redis AI Helm repository. The chart deploys the Redis Agent Memory Data
Plane, Redis Agent Memory workers, the Redis Agent Memory Control Plane, and the Identity Service.

You provide the Redis databases, provider credentials, Kubernetes exposure, and
license material used by the deployment.

> [!NOTE]
> This guide is for system administrators deploying Redis Agent Memory on a self-managed
> Kubernetes cluster.

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Container images | Docker Hub: `redislabs/agent-memory`, `redislabs/agent-memory-control-plane`, and `redislabs/iris-identity-service` |
| Helm chart | `redis-agent-memory` chart in the Redis AI Helm repository, or a chart package provided by Redis |
| Redis databases | You provide Store Redis, Job Redis, and Metadata Redis |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Provider credentials | You provide embedding provider credentials and, when worker features are enabled, promotion or summarization LLM credentials |

## Required software

| Software | Minimum version | Purpose |
| -------- | --------------- | ------- |
| Kubernetes | 1.23+ | Orchestration |
| kubectl | 1.23+ | Kubernetes CLI |
| Helm | 3.x | Package manager |

## Redis databases

The Helm chart does not deploy Redis databases. Provision the Redis databases
outside the Redis Agent Memory chart and pass their URLs in the overlay Secret.
The Data Plane and the Control Plane both read the overlay, so they use the same
Metadata Redis and Store Redis.

Store Redis must support Search and JSON capabilities because Redis Agent Memory
creates JSON and vector search indexes for memory data. Job Redis and Metadata
Redis do not need those capabilities when they are deployed as separate Redis
databases.

{{< table-scrollable >}}
| Redis database | Required | Key in the overlay Secret | Purpose |
| --- | --- | --- | --- |
| Store Redis | Always | `databases."1".urls` | Session memory JSON, long-term memory hashes, RediSearch indexes, vectors, and TTL-managed data. |
| Metadata Redis | Always | `metadata.urls`, and optionally `metadata.namespace` (default `iris:memory`) | Store records. |
| Job Redis | Always | `background_jobs.redis.urls` | Background work, retry state, delayed jobs, and idempotency markers. |
{{< /table-scrollable >}}

The Identity Service reads its Metadata Redis from `metadata.urls` in its own metadata Secret and
keeps agent-key records there. The Data Plane checks agent keys by calling the Identity Service.

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

In FIPS-oriented deployments, Redis URLs covered by the posture must use
`rediss://`. Avoid eviction of metadata keys. Losing Metadata Redis removes Control
Plane store records, and losing the Identity Service Metadata Redis removes agent-key records.

## Network access

- **Connected install:** the cluster must be able to pull images from
  `docker.io` and reach the Redis AI Helm repository.
- **Air-gapped install:** mirror the images into an internal registry and use a
  chart package or locally downloaded chart.
- **Runtime access:** Redis Agent Memory pods must reach the Redis databases and any
  embedding or LLM provider endpoints used by the deployment.
- **Data Plane exposure:** use NetworkPolicy, ingress, gateway, service mesh,
  private load balancer, or equivalent controls to restrict API access.

## Credentials and Secrets

The chart renders the configuration from Helm values (`config.render: true`). Credentials stay out
of the values: you put them in an overlay Secret. You create three Secrets:

| Secret | Default key | Holds |
| --- | --- | --- |
| License Secret | `license` | The Redis Agent Memory license key. |
| Overlay Secret | `overlay.yaml` | Redis URLs and provider credentials. |
| Identity Service metadata Secret | `metadata.yaml` | The Identity Service's Metadata Redis URL. |

The chart generates four more Secrets for the tokens and service credentials listed in
[Credentials](/content/operate/iris/agent-memory/self-managed/authentication.md#credentials).

To supply a complete configuration file in your own Secret instead, see
[Bring-your-own (BYO) configuration](/content/operate/iris/agent-memory/self-managed/configuration.md#bring-your-own-byo-configuration).

## Release artifacts and image tags

Chart `1.0.0` requires `image.tag` and `controlplane.image.tag` at install or upgrade time; set
each to the Redis Agent Memory version you deploy. The bundled Identity Service needs no tag of
its own: it runs the image version the pinned `iris-identity-service` chart carries. Set
`identityService.image.*` only to mirror the image or pin another tag.

Use the chart version supplied by Redis for the release. The published chart is
`redis-ai/redis-agent-memory` from `https://helm.redis.io/ai`.

Standard customer installs use the public Docker Hub images published by the
Redis Agent Memory self-managed release: `docker.io/redislabs/agent-memory:<ram-version>` and
`docker.io/redislabs/agent-memory-control-plane:<ram-version>`, plus
`docker.io/redislabs/iris-identity-service` at the version the pinned chart carries.

## Air-gapped and private registry installs

Mirror these images into your internal registry:

| Image | Needed |
| --- | --- |
| `redislabs/agent-memory:<ram-version>` | Always (Data Plane and workers) |
| `redislabs/agent-memory-control-plane:<ram-version>` | Always |
| `redislabs/iris-identity-service:<ids-version>` | With the bundled Identity Service (the default); skip only with `identityService.enabled=false` |
| `replicated/troubleshoot:0.131.0` | Support-bundle health checks, on by default (`supportPackage.*`) |
| `hibiken/asynqmon:0.7.2` | Optional, with `controlplane.queueMonitor` |
| `python:3.13-alpine` | Optional, with `tests.smoke` |

`<ids-version>` is the `appVersion` of the `iris-identity-service` chart the Redis Agent Memory
chart pins. Read it with
`helm show chart redis-ai/redis-agent-memory --version <chart-version>` and
`helm show chart redis-ai/iris-identity-service --version <pinned-version>`.

```bash
docker pull redislabs/agent-memory:<ram-version>
docker tag redislabs/agent-memory:<ram-version> \
  registry.example.com/redislabs/agent-memory:<ram-version>
docker push registry.example.com/redislabs/agent-memory:<ram-version>

docker pull redislabs/agent-memory-control-plane:<ram-version>
docker tag redislabs/agent-memory-control-plane:<ram-version> \
  registry.example.com/redislabs/agent-memory-control-plane:<ram-version>
docker push registry.example.com/redislabs/agent-memory-control-plane:<ram-version>

docker pull redislabs/iris-identity-service:<ids-version>
docker tag redislabs/iris-identity-service:<ids-version> \
  registry.example.com/redislabs/iris-identity-service:<ids-version>
docker push registry.example.com/redislabs/iris-identity-service:<ids-version>
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

controlplane:
  image:
    repository: registry.example.com/redislabs/agent-memory-control-plane

identityService:
  image:
    repository: registry.example.com/redislabs/iris-identity-service

global:
  imagePullSecrets:
    - name: ram-registry
```

Use `global.imagePullSecrets`, which the chart and the bundled Identity Service both read; the
local `imagePullSecrets` reaches only the Redis Agent Memory pods, and the chart refuses it when
the Identity Service image is mirrored. Omit pull Secrets if the internal registry does not
require authentication.

For air-gapped deployments, also set:

```yaml
airgap:
  enabled: true
```

With `airgap.enabled: true`, the chart fails if a repository still points at Docker Hub. For the
Identity Service, the error is:

```text
airgap.enabled=true requires identityService.image.repository to point to a mirrored registry reachable from the cluster
```

## System requirements

Default chart values:

| Component | Default | Purpose |
| --------- | ------- | ------- |
| Redis Agent Memory server | 2 replicas with autoscaling enabled and a minimum of 2 | Data Plane API traffic |
| Redis Agent Memory worker | 2 replicas with autoscaling enabled and a minimum of 2 | Background promotion, summarization, and forgetting jobs |
| Redis Agent Memory Control Plane | 1 replica | Admin API for stores |
| Identity Service | 1 replica; requests `100m` CPU and `128Mi` memory, limits `500m` CPU and `512Mi` memory | Agent-key minting, rotation, revocation, and checks |

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

The walkthroughs use `redis-agent-memory` as the Helm release name. Resource names are fixed to
`redis-agent-memory*` by `fullnameOverride`, whatever the release name, so install one release per
namespace.

{{< table-scrollable >}}
| Area | Values | Use when |
| --- | --- | --- |
| Image | `image.repository`, `image.tag`, `imagePullSecrets` | Selecting a release, private registry, or mirrored image. |
| Air-gapped installs | `airgap.enabled` | Validating a disconnected or private-registry install. |
| Chart-rendered configuration | `config.render`, `shared`, `memory`, `controlplane.configData` | Setting the Data Plane and Control Plane configuration from Helm values. |
| Credentials overlay | `secrets.*` | Naming the overlay Secret and its key, or layering more overlay Secrets. |
| API server capacity | `server.resources`, `server.autoscaling.*` | Tuning request capacity or memory footprint. |
| Worker capacity | `worker.resources`, `worker.autoscaling.*` | Tuning background job throughput. |
| Scheduling | `server.nodeSelector`, `worker.nodeSelector`, `server.affinity`, `worker.affinity`, `server.tolerations`, `worker.tolerations` | Controlling pod placement. |
| Networking | `service.type`, `ingress.*` | Exposing Redis Agent Memory outside the cluster. |
| Naming | `fullnameOverride` | Keeping resource names at `redis-agent-memory*`. |
| Service account | `serviceAccount.*` | Matching customer namespace security policy. |
| Worker authentication | `workerAuth.*`, `worker.serviceAccount.*`, `worker.serviceAccount.token.*` | Giving Redis Agent Memory workers a Kubernetes projected service-account token for authenticated Data Plane callbacks. |
| Private certificate authority (CA) | `tls.caCertSecret` | Trusting a private CA for outbound connections, such as the cluster CA for [worker identity](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform). |
| Secret rollouts | `license.existingSecretChecksum`, `config.existingSecretChecksum`, `controlplane.config.existingSecretChecksum` | Rolling pods after externally managed Secret changes. |
| Control Plane | `controlplane.image.*`, `controlplane.configData`, `controlplane.adminToken.*` | Mirroring the Control Plane image, setting its configuration, or bringing your own admin token. |
| Control Plane internal token | `controlplane.internalToken.*` | Bringing your own token for Identity Service checks against the Control Plane. |
| Identity Service (bundled) | `identityService.*` | The published `iris-identity-service` subchart's contract: naming its metadata Secret, mirroring its image, bringing your own control token (`identityService.control.*`), or adding service configuration (`identityService.configData`). |
| External Identity Service | `identityService.enabled=false`, `dataplane.identityServiceBaseURL`, `externalIdentityService.*` | Installing no Identity Service objects and pointing the Data Plane at one you run elsewhere. |
| Umbrella fallbacks | `global.*` | Sharing `security.profile`, `imagePullSecrets`, and `tls.caCertSecret` with the bundled Identity Service; the chart's own `security.profile`, `imagePullSecrets`, and `tls.caCertSecret` do not reach it. |
| Security profile | `global.security.profile` | Selecting the [FIPS-oriented posture](/content/operate/iris/agent-memory/self-managed/operations.md#fips-oriented-posture) for Redis Agent Memory and the bundled Identity Service. |
| Support bundles | `supportPackage.*` | Configuring support-bundle collection and its health checks. |
| Preflight checks | `preflight.*` | Rendering the preflight checks spec as a ConfigMap. |
| Helm tests | `tests.*` | Running [chart tests](/content/operate/iris/agent-memory/self-managed/operations.md#chart-tests) with `helm test`. |
{{< /table-scrollable >}}

Do not use floating image tags in production.

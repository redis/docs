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
Plane, Redis Agent Memory workers, and the Redis Agent Memory Control Plane. Install Identity
Service separately with the `iris-identity-service` chart `0.10.2` before connecting Memory chart `0.10.2`.

You provide the Redis databases, provider credentials, Kubernetes exposure, and
license material used by the deployment.

> [!NOTE]
> This guide is for system administrators deploying Redis Agent Memory on a self-managed
> Kubernetes cluster.

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Container images | Docker Hub: `redislabs/agent-memory`, `redislabs/agent-memory-control-plane`, and `redislabs/iris-identity-service` |
| Helm charts | `redis-agent-memory` `0.10.2` and `iris-identity-service` `0.10.2` in the Redis AI Helm repository |
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
| Job Redis | Always | `background_jobs.redis.urls` and, when execution idempotency is enabled, `background_jobs.idempotency.urls` | Background work, retry state, delayed jobs, and execution markers. The two settings can use the same Redis. |
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
`rediss://`. The Identity Service and Control Plane also need `https://`
endpoints that your hosting environment provides. See
[FIPS-oriented posture](/content/operate/iris/agent-memory/self-managed/operations.md#fips-oriented-posture). Avoid eviction of metadata keys. Losing Metadata Redis removes Control
Plane store records, and losing the Identity Service Metadata Redis removes agent-key records.

## Network access

- **Connected install:** the cluster must be able to pull images from
  `docker.io` and reach the Redis AI Helm repository.
- **Air-gapped install:** mirror the images into an internal registry and use a
  chart package or locally downloaded chart.
- **Runtime access:** Redis Agent Memory pods must reach the Redis databases and any
  embedding or LLM provider endpoints used by the deployment.
- **Identity Service:** the Data Plane must reach its runtime endpoint. Identity Service must
  reach the Memory Control Plane's grant validator and its own Metadata Redis. Provide TLS
  endpoints and trust for both service hops; see [Deploy](/content/operate/iris/agent-memory/self-managed/deploy.md).
- **Data Plane exposure:** use NetworkPolicy, ingress, gateway, service mesh,
  private load balancer, or equivalent controls to restrict API access.

## Credentials and Secrets

When `config.render: true` is set, as in the walkthrough, the chart renders configuration from
Helm values. This option defaults to `false`. Credentials stay in an overlay Secret. Create the following Secrets for the
[two-release installation](/content/operate/iris/agent-memory/self-managed/deploy.md#2-create-secrets):

| Secret | Default key | Holds |
| --- | --- | --- |
| License Secret | `license` | The Redis Agent Memory license key. |
| Overlay Secret | `overlay.yaml` | Redis URLs and provider credentials. |
| Identity Service metadata Secret | `metadata.yaml` | The Identity Service's Metadata Redis URL. |

Also create `memory-dp-credential` and `memory-internal-token`, shared by both releases,
and `ids-control-token`, read only by Identity Service. The walkthrough supplies a `ram-ca`
certificate bundle for service trust. Memory generates its Control Plane admin token unless
you provide one. See [Credentials](/content/operate/iris/agent-memory/self-managed/authentication.md#credentials).

To supply a complete configuration file in your own Secret instead, see
[Bring-your-own (BYO) configuration](/content/operate/iris/agent-memory/self-managed/configuration.md#bring-your-own-byo-configuration).

## Release artifacts and image tags

The published Memory chart `0.10.2` defaults `image.tag` and `controlplane.image.tag` to `0.10.2`.
Identity Service chart `0.10.2` defaults its image to its own application version, `0.10.2`.
Set tags explicitly when pinning images or using a mirror. The releases have independent versions.

Both charts are published at `https://helm.redis.io/ai` as `redis-ai/redis-agent-memory`
and `redis-ai/iris-identity-service`. Their standard images are
`redislabs/agent-memory:0.10.2`, `redislabs/agent-memory-control-plane:0.10.2`, and
`redislabs/iris-identity-service:0.10.2`.

## Air-gapped and private registry installs

Mirror these images into your internal registry:

| Image | Needed |
| --- | --- |
| `redislabs/agent-memory:<ram-version>` | Always (Data Plane and workers) |
| `redislabs/agent-memory-control-plane:<ram-version>` | Always |
| `redislabs/iris-identity-service:<ids-version>` | On the separate Identity Service release, required for default agent-key authentication |
| `replicated/troubleshoot:0.131.0` | Support-bundle health checks, on by default (`supportPackage.*`) |
| `hibiken/asynqmon:0.7.2` | Optional, with `controlplane.queueMonitor` |
| `python:3.13-alpine` | Optional, with `tests.smoke` |
| `curlimages/curl:8.17.0` | Optional, for `helm test` on the Identity Service release (`tests.image` in `values-ids.yaml`) |

For this release, `<ram-version>` is `0.10.2` and `<ids-version>` is `0.10.2`.
Inspect each package with `helm show chart redis-ai/redis-agent-memory --version 0.10.2`
and `helm show chart redis-ai/iris-identity-service --version 0.10.2`. Memory does not pin
or install the Identity Service chart.

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

global:
  imagePullSecrets:
    - name: ram-registry
```

Configure the separate Identity Service release in `values-ids.yaml`:

```yaml
image:
  repository: registry.example.com/redislabs/iris-identity-service
  tag: "0.10.2"
tests:
  image: registry.example.com/curlimages/curl:8.17.0
global:
  imagePullSecrets:
    - name: ram-registry
```

Each release reads its own `imagePullSecrets`, falling back to `global.imagePullSecrets`.
Values passed to Memory do not configure Identity Service. Omit pull Secrets if the registry
does not require authentication.

For air-gapped deployments, also set:

```yaml
airgap:
  enabled: true
```

Memory's `airgap.enabled: true` checks Memory's own image repositories. It does not validate
the separate Identity Service release. Mirror that release's image and chart dependencies
separately, and confirm that every configured repository is reachable from the cluster.

## System requirements

Default values for Memory and the separate Identity Service chart:

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
| Identity Service connection | `dataplane.identityServiceBaseURL`, `identityService.credential.*`, `identityService.allowInsecureTransport` | Connecting to the separately installed runtime endpoint. The credential Secret is registered on that release. |
| Identity Service configuration | Separate `values-ids.yaml`: `metadata`, `control`, `runtime`, `productValidation`, `subjectGrants` | Configuring the Identity Service release, not Memory. |
| Shared fallbacks | `global.security.profile`, `global.imagePullSecrets`, `global.tls.caCertSecret` | Providing fallback values within each release. Pass shared values to both releases; local values take precedence. |
| Security profile | `security.profile` or `global.security.profile` | Selecting the [FIPS-oriented posture](/content/operate/iris/agent-memory/self-managed/operations.md#fips-oriented-posture); configure it separately on each release. |
| Support bundles | `supportPackage.*` | Configuring support-bundle collection and its health checks. |
| Preflight checks | `preflight.*` | Rendering the preflight checks spec as a ConfigMap. |
| Helm tests | `tests.*` | Running [chart tests](/content/operate/iris/agent-memory/self-managed/operations.md#chart-tests) with `helm test`. |
{{< /table-scrollable >}}

Do not use floating image tags in production.

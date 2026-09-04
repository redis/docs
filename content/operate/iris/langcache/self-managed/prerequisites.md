---
Title: Self-managed LangCache prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review software, Redis, network, Secret, image, and sizing prerequisites for self-managed LangCache.
linkTitle: Prerequisites
weight: 20
hideListLinks: true
---

LangCache self-managed is distributed as container images plus a Helm chart.
The published `langcache` chart deploys the LangCache Data Plane. The Control
Plane and, for Control Plane managed caches, the shared Identity Service are
distributed as container images that you deploy alongside the chart; see
[Deploy with Control Plane managed caches]({{< relref "/operate/iris/langcache/self-managed/deploy-control-plane" >}}).

You provide the Redis databases, embedding provider credentials, Kubernetes
exposure, and license material used by the deployment.

{{< note >}}
This guide is for system administrators deploying LangCache on a self-managed
Kubernetes cluster.
{{< /note >}}

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Container images | LangCache Data Plane image, and, when the Control Plane is used, the LangCache Control Plane image. Provided by your Redis representative. |
| Helm chart | `langcache` chart, provided by your Redis representative. |
| Identity Service image | `redislabs/iris-identity-service` on Docker Hub, needed only for Control Plane managed caches with agent-key Data Plane authentication. |
| Redis databases | You provide Cache Redis and, for Control Plane managed caches, Metadata Redis. |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Provider credentials | You provide embedding provider credentials (currently an OpenAI-compatible provider). |

{{< note >}}
LangCache self-managed does not yet have a public Docker Hub or Helm
repository the way self-managed Redis Agent Memory does. Get the chart
package and image references from your Redis representative and mirror them
into your own registry if needed.
{{< /note >}}

## Required software

| Software | Minimum version | Purpose |
| -------- | --------------- | ------- |
| Kubernetes | 1.19+ | Orchestration |
| kubectl | 1.19+ | Kubernetes CLI |
| Helm | 3.x | Package manager for the Data Plane chart |

## Redis databases

The Helm chart does not deploy Redis databases. Provision the Redis databases
outside the LangCache chart and pass their URLs in `dataplane.config.yaml`
and, when the Control Plane is used, `controlplane-onprem.config.yaml`.

Cache Redis must support RediSearch with vector search, because LangCache
creates a RediSearch vector index per cache. Metadata Redis does not need that
capability.

### Static caches

Use static caches for a first install or a private single-cache deployment.
Caches are declared directly in `dataplane.config.yaml`. The Control Plane
and Metadata Redis are not used.

{{< table-scrollable >}}
| Redis database | Required when | Configure in `dataplane.config.yaml` | Purpose |
| --- | --- | --- | --- |
| Cache Redis | Always | `metadata.caches[].urls` | Cache entry hashes and RediSearch vector indexes. |
{{< /table-scrollable >}}

### Control Plane managed caches

Use Control Plane managed caches when operators need to create or manage
caches at runtime. The Data Plane and Control Plane must resolve the same
`databaseId` to the same Cache Redis target and point at the same Metadata
Redis.

{{< table-scrollable >}}
| Redis database | Required when | Configure in `dataplane.config.yaml` | Configure in `controlplane-onprem.config.yaml` | Purpose |
| --- | --- | --- | --- | --- |
| Cache Redis | Always | `databases.<id>.urls` | `databases.<id>.urls` | Cache entries for Control Plane managed caches. Both processes must define the same `<id>`. |
| Metadata Redis | Always | `metadata.urls` | `metadata.urls` | Cache records and, for agent-key auth, key/grant records managed by the Identity Service. |
{{< /table-scrollable >}}

For a lab deployment, Cache Redis and Metadata Redis can point to the same
Redis endpoint if it has the required modules and capacity. For production,
separate them so cache data and control metadata can be scaled, backed up,
and operated independently.

### Metadata Redis durability

Metadata Redis is small compared with Cache Redis, but it is operationally
critical. Use persistent storage, Redis authentication, network isolation,
and TLS where required. Avoid eviction of metadata keys; losing metadata
removes Control Plane cache records.

## Network access

- **Connected install:** the cluster must be able to pull the LangCache
  images and, for Control Plane managed caches, the `iris-identity-service`
  image.
- **Air-gapped install:** mirror the images into an internal registry.
- **Runtime access:** LangCache pods must reach the Redis databases and the
  embedding provider endpoint used by the deployment.
- **Data Plane exposure:** use NetworkPolicy, ingress, gateway, service mesh,
  private load balancer, or equivalent controls to restrict API access.

## Credentials and Secrets

The published `langcache` chart takes the Data Plane's `dataplane.config.yaml`
inline as a Helm value; the chart renders it into a ConfigMap, not a Secret.
Because that config can contain embedding provider API keys and Redis URLs
with credentials, treat the values file itself as sensitive. If your
security policy requires Secret-backed storage for it instead, mount a
Secret through the chart's generic `volumes`/`volumeMounts` values; see
[Data Plane configuration]({{< relref "/operate/iris/langcache/self-managed/data-plane-configuration#config-storage" >}}).

The license file and, for Control Plane managed caches, the Identity Service
introspection credential are not wired into the chart's values at all today;
mount them yourself as Secrets the same way. The Control Plane (deployed as
a plain manifest until it's chart-packaged) uses real Kubernetes Secrets
throughout:

| Secret | Required when | Default key |
| --- | --- | --- |
| LangCache license Secret | Control Plane managed caches | `license` |
| Control Plane config Secret | Control Plane used | `controlplane-onprem.config.yaml` |
| Control Plane admin-token Secret | Control Plane used | `token` |
| Identity Service introspection-token Secret | Agent-key Data Plane auth used | `token` |

## System requirements

Default chart values for the published `langcache` chart:

| Component | Default | Purpose |
| --------- | ------- | ------- |
| LangCache Data Plane | 1 replica, autoscaling disabled | Data Plane API traffic |

For production, review `replicaCount` and `autoscaling` and size explicitly
for the expected request volume; the chart's defaults are intended for a
first install, not a production HA recommendation.

## Helm values to review

The walkthroughs use `langcache` as the Helm release name. The generated
service and deployment names in the verification steps assume that release
name.

{{< table-scrollable >}}
| Area | Values | Use when |
| --- | --- | --- |
| Image | `image.repository`, `image.tag`, `imagePullSecrets` | Selecting a release or private registry image. |
| Config | `config` (inline `dataplane.config.yaml` content) | Configuring caches, embeddings, and auth. Renders into a ConfigMap; treat the values file as sensitive. |
| Capacity | `resources`, `autoscaling.*` | Tuning request capacity or memory footprint. |
| Scheduling | `nodeSelector`, `affinity`, `tolerations` | Controlling pod placement. |
| Networking | `service.type`, `ingress.*` | Exposing LangCache outside the cluster. |
| Naming | `fullnameOverride` | Running more than one LangCache release in a namespace. |
| Service account | `serviceAccount.*` | Matching customer namespace security policy. |
| Cache-index provisioning | `initProvisioner.enabled`, `initProvisioner.config` | Running the `provision-cache-index` init container against static caches before the Data Plane starts. |
{{< /table-scrollable >}}

Do not use floating image tags in production.

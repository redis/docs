---
Title: Self-managed LangCache prerequisites
alwaysopen: false
categories:
- docs
- operate
- iris
description: Review software, Redis, network, Secret, image, and sizing prerequisites for self-managed LangCache.
linkTitle: Prerequisites
weight: 10
hideListLinks: true
---

LangCache self-managed is distributed as container images on Docker Hub plus
the `langcache` Helm chart. One `helm install` of the chart deploys the
LangCache Data Plane, the LangCache Control Plane, and (by default) a
bundled Identity Service.

You provide the Redis databases, embedding provider credentials, Kubernetes
exposure, and license material used by the deployment.

{{< note >}}
This guide is for system administrators deploying LangCache on a self-managed
Kubernetes cluster.
{{< /note >}}

## What you need

| Item | Where it comes from |
| ---- | ------------------- |
| Container images | `redislabs/iris-langcache-data`, `redislabs/iris-langcache-control`, and (bundled Identity Service) `redislabs/iris-identity-service` on Docker Hub |
| Helm chart | `langcache` chart, synced to the Redis Enterprise Helm chart repository. Contact your Redis representative for the exact repository coordinates and chart version, or for a chart package. |
| Redis databases | You provide Metadata Redis and one or more Cache Redis databases |
| License key | Contact your Redis representative or [contact sales](https://redis.io/contact/). |
| Provider credentials | You provide embedding provider credentials (currently an OpenAI-compatible provider) |

## Required software

| Software | Minimum version | Purpose |
| -------- | --------------- | ------- |
| Kubernetes | 1.23+ | Orchestration; the chart renders an `autoscaling/v2` HorizontalPodAutoscaler |
| kubectl | 1.23+ | Kubernetes CLI |
| Helm | 3.x | Package manager |

## Redis databases

The Helm chart does not deploy Redis databases. Provision them outside the
chart and register them through the Control Plane's and Data Plane's config
overlays (see [Configuration]({{< relref "/operate/iris/langcache/self-managed/configuration" >}})).

Cache Redis must support RediSearch with vector search, because LangCache
creates a RediSearch vector index per cache. Metadata Redis does not need
that capability.

{{< table-scrollable >}}
| Redis database | Required | Registered in | Purpose |
| --- | --- | --- | --- |
| Metadata Redis | Always | Both the Data Plane's and Control Plane's config overlays (same URLs, same keyspace) | Cache records written by the Control Plane, read by the Data Plane. |
| Cache Redis (one or more) | Always | The Control Plane's config overlay only, as a `databases` registry entry keyed by a logical `databaseId` | Cache entry hashes and RediSearch vector indexes. The Data Plane has no database registry of its own — it resolves each cache's Redis URLs from the metadata the Control Plane already persisted at cache-creation time. |
| Identity Service metadata Redis (bundled mode only) | When `identityService.mode: bundled` | The bundled Identity Service's own config overlay | Agent-key and grant records. Can be the same Redis instance as Metadata Redis, in a separate namespace. |
{{< /table-scrollable >}}

For a lab deployment, these Redis roles can point at the same Redis endpoint
if it has the required modules and capacity. For production, separate them
so cache data and control metadata can be scaled, backed up, and operated
independently.

### Metadata Redis durability

Metadata Redis is small compared with Cache Redis, but it is operationally
critical. Use persistent storage, Redis authentication, network isolation,
and TLS where required. Avoid eviction of metadata keys; losing metadata
removes Control Plane cache records.

## Network access

- **Connected install:** the cluster must be able to pull the LangCache and
  Identity Service images from Docker Hub (or your mirrored registry) and
  reach the Helm chart repository.
- **Air-gapped install:** mirror the images into an internal registry and
  use a locally available chart package.
- **Runtime access:** LangCache pods must reach the Redis databases and the
  embedding provider endpoint used by the deployment. The Data Plane must
  also reach the Identity Service (bundled or external); the Control Plane
  must reach Metadata Redis and every registered Cache Redis database.
- **Data Plane exposure:** use NetworkPolicy, ingress, gateway, service mesh,
  private load balancer, or equivalent controls to restrict API access.

## Credentials and Secrets

The chart never puts Redis URLs, the database registry, or the embedding
credential in `values.yaml` or a rendered ConfigMap. Each of the Data Plane,
Control Plane, and (bundled) Identity Service reads its own pre-created
overlay Secret, deep-merged over its rendered base config at runtime. See
[Configuration]({{< relref "/operate/iris/langcache/self-managed/configuration" >}})
for the overlay content each component expects.

| Secret | Required when | Default key |
| --- | --- | --- |
| LangCache license Secret | Always | `license` |
| Data Plane config overlay Secret | Always | `overlay.yaml` |
| Control Plane config overlay Secret | Always | `overlay.yaml` |
| Identity Service metadata Secret | `identityService.mode: bundled` | `metadata.yaml` |
| Control Plane admin token | Auto-generated by default, or bring your own | `token` |
| Control Plane internal (grant-validation) token | Auto-generated by default, or bring your own | `token` |
| Identity Service control token (bundled mode) | Auto-generated by default, or bring your own | `token` |
| Data Plane's Identity Service runtime credential (external mode) | `identityService.mode: external` | `token`, minted by the suite-level Identity Service owner |

## Release artifacts and image tags

LangCache self-managed image tags use the release SemVer value, for example:

```yaml
dataplane:
  image:
    repository: redislabs/iris-langcache-data
    tag: "<langcache-version>"
controlplane:
  image:
    repository: redislabs/iris-langcache-control
    tag: "<langcache-version>"
identityService:
  bundled:
    image:
      repository: redislabs/iris-identity-service
      tag: "<langcache-version>"
```

Use the image tags listed for the release on Docker Hub or provided by
Redis. Do not use floating image tags in production.

## Air-gapped and private registry installs

Mirror the published images into your internal registry:

```bash
for image in iris-langcache-data iris-langcache-control iris-identity-service; do
  docker pull redislabs/$image:<langcache-version>
  docker tag redislabs/$image:<langcache-version> \
    registry.example.com/redislabs/$image:<langcache-version>
  docker push registry.example.com/redislabs/$image:<langcache-version>
done
```

If the registry requires authentication, create an image pull Secret and
reference it from `imagePullSecrets` in your values file:

```bash
kubectl -n <namespace-name> create secret docker-registry langcache-registry \
  --docker-server=registry.example.com \
  --docker-username=<username> \
  --docker-password=<password>
```

```yaml
imagePullSecrets:
  - name: langcache-registry
```

## System requirements

Default chart values:

| Component | Default | Purpose |
| --------- | ------- | ------- |
| LangCache Data Plane | 2 replicas with autoscaling enabled (2–10) | Data Plane API traffic |
| LangCache Control Plane | 1 replica, no autoscaling | Admin API for caches |
| Identity Service (bundled mode) | 1 replica | Agent-key issuance and introspection |

During a rolling update, Kubernetes may temporarily run old and new pods at
the same time. A small test cluster can run out of CPU during install or
upgrade; size for the maximum rolling-update overlap, or reduce replicas
explicitly for a lab install.

## Helm values to review

The walkthroughs in this guide assume the chart's default
`fullnameOverride: langcache`, which fixes the rendered resource names to
`langcache` (Data Plane), `langcache-controlplane`, and
`langcache-identity-service` (bundled mode). If you change it, update the
release-derived names in the verification commands throughout this guide.

{{< table-scrollable >}}
| Area | Values | Use when |
| --- | --- | --- |
| Images | `dataplane.image.*`, `controlplane.image.*`, `identityService.bundled.image.*`, `imagePullSecrets` | Selecting a release or private registry image. |
| Data Plane capacity | `dataplane.resources`, `dataplane.autoscaling.*` | Tuning request capacity or memory footprint. |
| Networking | `dataplane.service.*`, `dataplane.ingress.*` | Exposing LangCache outside the cluster. |
| Security posture | `security.profile` | Opting into the FIPS-oriented posture. |
| Identity Service mode | `identityService.mode` (`bundled` or `external`) | Choosing whether this release runs its own Identity Service or joins one the suite already runs. |
| Config overlays | `dataplane.secrets.*`, `controlplane.secrets.*`, `identityService.bundled.metadata.*` | Pointing the chart at your pre-created overlay Secrets. |
| Rotation | `*.existingSecretChecksum` fields throughout | Rolling pods after an externally managed Secret changes. |
{{< /table-scrollable >}}

---
Title: Configure self-managed Lens
alwaysopen: false
categories:
- docs
- operate
- iris
description: Set the Helm values, storage Secret, retention, ingest, Identity Service connection, and TLS trust for Lens.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

You configure self-managed Lens with a Helm values file and the Secrets it references. The values file sets your tenant, instance, retention, and the Identity Service connection. The Secrets hold what shouldn't be in a values file: Redis URLs, tokens, and the license.

## Helm values

This values file is the starting point for [Deploy](/content/operate/iris/lens/self-managed/deploy.md). It assumes an Identity Service release named `ids` in the same namespace. Save it as `lens-values.yaml`:

```yaml
tenantId: default

instance:
  id: default

ingest:
  enabled: true

storage:
  existingSecret: lens-storage

license:
  existingSecret: lens-license

dataplane:
  # The Identity Service release's Service. In-cluster, it speaks plain HTTP.
  identityServiceBaseURL: http://ids-iris-identity-service:9200

identityService:
  allowInsecureTransport: true
  credential:
    existingSecret: lens-dp-credential

controlplane:
  internalToken:
    existingSecret: lens-internal-token

tests:
  enabled: true
```

| Value | Default | Purpose |
| --- | --- | --- |
| `tenantId` | `""` | Required. The tenant the instance belongs to. Must equal the Identity Service's `runtime.apiKeyTenant.singleTenantID`. |
| `instance.id` | `default` | The one Lens instance this installation serves. Developers use it as their instance ID. |
| `instance.retention.streamTrim` | `24h` | Recorded on the instance. See [Retention](#retention). |
| `instance.retention.contentTTL` | `168h` | How long Lens keeps captured content. |
| `instance.retention.indexRetention` | `720h` | How long Lens keeps turn structure, timing, scores, and outcomes. |
| `ingest.enabled` | `false` | Accept turns. See [Ingest](#ingest). |
| `ingest.region` | `onprem` | Scopes the stream keys. Use one value per installation. |
| `storage.existingSecret` | `""` | Required. The [storage Secret](#storage-secret). |
| `storage.keyPrefix` | `iris:lens` | The prefix of every key Lens writes. |
| `license.existingSecret` | `""` | Required. The license Secret, with the key `license`. |
| `dataplane.image.repository`, `dataplane.image.tag` | `redislabs/iris-lens-data` | The data-plane and worker image. |
| `controlplane.image.repository`, `controlplane.image.tag` | `redislabs/iris-lens-control` | The control-plane image. |
| `dataplane.identityServiceBaseURL` | `""` | Required. The Identity Service release's URL. Must be `https://` unless `identityService.allowInsecureTransport=true`. |
| `identityService.allowInsecureTransport` | `false` | Accept an `http://` Identity Service URL, such as the in-cluster Service. |
| `identityService.credential.existingSecret` | `""` | Required. The data plane's runtime credential, key `token`. |
| `controlplane.internalToken.existingSecret` | `""` | The control plane's internal token, key `token`. Set it, because the Identity Service release must mount the same Secret. |
| `controlplane.adminToken.existingSecret` | `""` | Supply your own admin token. Empty, the chart generates one. |
| `dataplane.server.replicaCount`, `dataplane.worker.replicaCount`, `controlplane.replicaCount` | `1` | Replicas for each workload. |
| `tls.caCertSecret` | `""` | A certificate authority (CA) bundle every workload trusts. See [TLS trust](#tls-trust). |
| `security.profile` | `""` | `fips` runs the Federal Information Processing Standards (FIPS) profile. |
| `imagePullSecrets` | `[]` | Pull Secrets for a private registry. |
| `tests.enabled` | `false` | Add `helm test` readiness checks. |

To pull images from a mirror, set each `repository` to your registry and each `tag` to the chart's version.

<!-- TODO: confirm the published chart stamps both image tags with its version, so the install needs no tag values. The repository chart leaves them empty and requires them. -->

Every Secret value also has an `existingSecretChecksum`. Set it when you change the Secret's content, so the pods roll. See [Rotate credentials](/content/operate/iris/lens/self-managed/authentication.md#rotate-credentials).

## Storage Secret

The storage Secret holds one configuration file per process. Each key is a file name:

| Key | Process | Holds |
| --- | --- | --- |
| `lens-dataplane-storage.yaml` | Data plane and worker | `storage.streams`, `storage.index`, `storage.content`, and `storage.metadata` URLs. |
| `lens-controlplane-storage.yaml` | Control plane | `storage.metadata` URLs, and optional `dram.urls`. |

Save the data-plane file as `lens-dataplane-storage.yaml`. Here `streams` and `index` share the records database:

```yaml
storage:
  streams:
    urls:
      - rediss://<records-user>:<records-password>@<records-host>:<records-port>
  index:
    urls:
      - rediss://<records-user>:<records-password>@<records-host>:<records-port>
  content:
    urls:
      - rediss://<content-user>:<content-password>@<content-host>:<content-port>
  metadata:
    urls:
      - rediss://<metadata-user>:<metadata-password>@<metadata-host>:<metadata-port>
```

Save the control-plane file as `lens-controlplane-storage.yaml`:

```yaml
storage:
  metadata:
    urls:
      - rediss://<metadata-user>:<metadata-password>@<metadata-host>:<metadata-port>
# Optional. The control plane checks the records database for Redis Search,
# Redis JSON, and noeviction at startup and on each retention change.
dram:
  urls:
    - rediss://<records-user>:<records-password>@<records-host>:<records-port>
```

Use the same `metadata` URL in both files. See [Redis databases](/content/operate/iris/lens/self-managed/prerequisites.md#redis-databases) for what each role needs.

## Retention

Lens keeps turn structure, timing, scores, and outcomes for `instance.retention.indexRetention`, and captured content for `instance.retention.contentTTL`. The read API offers time ranges that fit these windows. The windows must satisfy `streamTrim` < `contentTTL` ≤ `indexRetention`.

The control plane records these values on the instance at its first start. The data plane stamps each content expiry from `contentTTL` as rendered by Helm. To change retention after install, see [Change retention](/content/operate/iris/lens/self-managed/operations.md#change-retention).

Nothing trims the span streams yet, whatever `streamTrim` is set to.

## Ingest

With `ingest.enabled=false`, the default, the data plane answers `POST /iris/data/v1beta1/lens/v1/traces` with `503`, and the read API still works. Set `ingest.enabled=true` when you're ready for agents to send turns, and watch the records database's memory from then on.

## TLS trust

No Lens workload terminates TLS. To use an `https://` Identity Service URL, put a TLS-terminating proxy, gateway, or service mesh in front of the Identity Service.

When a certificate, for the Identity Service or a `rediss://` database, is signed by a private CA, create a Secret that holds the CA bundle and set `tls.caCertSecret` to its name. Every workload mounts it at `/etc/ssl/custom` and trusts it in addition to the image's system CAs. Set `tls.caCertSecretChecksum` to roll the workloads when the bundle changes.

## Identity Service in another namespace

The Identity Service release can run in another namespace. Then:

1. Set `dataplane.identityServiceBaseURL` to its fully qualified Service, such as `http://ids-iris-identity-service.<identity-service-namespace>.svc:9200`.
1. Set the Identity Service's `productValidation.products.lens.baseURL` to `http://lens-redis-lens-controlplane.<namespace-name>.svc:9300`.
1. Create the runtime credential and internal token Secrets with the same values in both namespaces. A pod mounts Secrets only from its own namespace.
1. Allow the Identity Service pods to reach the control plane on port `9300`, and the data plane to reach the Identity Service.

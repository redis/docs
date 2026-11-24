---
Title: Configure self-managed Lens
alwaysopen: false
categories:
- docs
- operate
- iris
description: Set the Helm values, storage Secret, retention, ingest, and TLS trust for Lens.
linkTitle: Configuration
weight: 30
hideListLinks: true
---

You configure self-managed Lens with its values under the `lens:` key of the suite's `iris-values.yaml`, and the storage Secret those values reference. The suite sets the tenant, license, credentials, and Identity Service connection from `global.iris`. See [Add the Lens values](/content/operate/iris/lens/self-managed/deploy.md#2-add-the-lens-values) for the values it sets.

## Helm values

Add these values to `iris-values.yaml`. The chart's `examples/lens.yaml` sets only `storage.existingSecret`:

```yaml
lens:
  ingest:
    enabled: true
  storage:
    existingSecret: lens-storage
```

| Value | Default | Purpose |
| --- | --- | --- |
| `lens.instance.retention.streamTrim` | `24h` | Recorded on the instance. See [Retention](#retention). |
| `lens.instance.retention.contentTTL` | `168h` | How long Lens keeps captured content. |
| `lens.instance.retention.indexRetention` | `720h` | How long Lens keeps turn structure, timing, scores, and outcomes. |
| `lens.ingest.enabled` | `false` | Accept turns. See [Ingest](#ingest). |
| `lens.ingest.region` | `onprem` | Scopes the stream keys. Use one value per installation. |
| `lens.storage.existingSecret` | `""` | Required. The [storage Secret](#storage-secret). |
| `lens.storage.keyPrefix` | `iris:lens` | The prefix of every key Lens writes. |
| `lens.dataplane.image.repository`, `lens.dataplane.image.tag` | `redislabs/iris-lens-data`, the chart version | The data-plane and worker image. |
| `lens.controlplane.image.repository`, `lens.controlplane.image.tag` | `redislabs/iris-lens-control`, the chart version | The control-plane image. |
| `lens.controlplane.adminToken.existingSecret` | `""` | Supply your own admin token. Empty, the suite generates `iris-lens-admin-token`. |
| `lens.dataplane.server.replicaCount`, `lens.dataplane.worker.replicaCount`, `lens.controlplane.replicaCount` | `2`, `1`, `1` | Replicas for each workload. |
| `lens.imagePullSecrets` | `[]` | Pull Secrets for a private registry. Empty, Lens uses `global.imagePullSecrets`. |

To pull images from a mirror, set each `repository` to your registry. Keep each `tag` at the chart's version.

When you change the storage Secret's content, set `lens.storage.existingSecretChecksum`, so the pods roll.

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

No Lens workload terminates TLS.

When a `rediss://` database's certificate is signed by a private certificate authority (CA), create a Secret that holds the CA bundle and set `global.tls.caCertSecret` to its name. Every workload mounts it at `/etc/ssl/custom` and trusts it in addition to the image's system CAs. Set `lens.tls.caCertSecretChecksum` to roll the workloads when the bundle changes.

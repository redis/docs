---
Title: Enrich database metrics with tags
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Expose Redis Enterprise database tags as metric labels so you can filter
  dashboards and alerts by attributes such as environment, team, or application.
linkTitle: Enrich metrics with tags
weight: 20
---

Database tags are key-value attributes that you attach to your databases. You can expose selected tag keys as metric labels. Your monitoring stack can then filter and group metrics by those attributes. For example, you can build dashboards scoped to a team or environment and route alerts with context already attached.

Tag-derived metrics are controlled in two places:

- **Cluster (REC):** An administrator uses [`spec.metricsConfig`](#configure-the-cluster) on the Redis Enterprise cluster (REC) to turn tag-derived metrics on or off and choose which tag keys are eligible.
- **Database (REDB / REAADB):** Application teams set tag values on individual databases with [`spec.tags`](#tag-a-database) (REDB) or [`spec.globalConfigurations.tags`](#tag-an-active-active-database) (REAADB).

A tag becomes a metric label only when both of these are true:

- The tag key is in the cluster's allowlist.
- The tag is set with a value on the database.

Keys that aren't in the allowlist never appear as labels, even if they're set on a database.

## How it works

1. On the REC, set `metricsConfig.exposeDatabaseTags` to `true`. In `metricsConfig.metricsTagKeysExposed`, list the tag keys you want available for metrics.
2. On each database, set the tag values with `spec.tags` (REDB) or `spec.globalConfigurations.tags` (REAADB).
3. The operator syncs the cluster configuration and the database tags to Redis Enterprise. Only keys in the allowlist that are present on a database appear as metric labels.

The REC defines the metrics configuration. The operator overwrites any changes made directly through the Redis Enterprise REST API.

## Configure the cluster

Add `metricsConfig` to the REC `spec` to turn tag-derived metrics on and choose which tag keys are eligible:

```YAML
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseCluster
metadata:
  name: rec
spec:
  nodes: 3
  metricsConfig:
    exposeDatabaseTags: true
    metricsTagKeysExposed:
      - env
      - team
```

In this example, only the `env` and `team` tag keys can appear as metric labels. A tag such as `app` is not exposed even if it is set on a database, because it is not in the allowlist.

`metricsConfig` supports the following fields. All fields are optional. The operator applies the listed default when a field is unset.

| Field | Type | Default | Description |
|---|---|---|---|
| `exposeDatabaseTags` | boolean | `false` | Enables or disables tag-derived metrics for the cluster. When `true`, the tag keys listed in `metricsTagKeysExposed` can be used as metric labels. When `false`, no database tag keys are exposed as labels, even if they are listed. |
| `metricsTagKeysExposed` | array of strings | `[]` | Allowlist of database tag keys eligible to be exposed as metric labels. Keys not listed here are never exposed, even if present on a database. |
| `maxRequestsInFlight` | integer | `2` | Maximum number of concurrent metrics scrape requests. Set to `0` to disable the limit. |
| `keyDistributionEnabled` | boolean | `false` | When `true`, export Prometheus histogram metrics for key size and key item distributions. |
| `keySizeBuckets` | string | `""` | Comma-separated bucket boundaries for key size distribution histograms, for example `"128M,512M"`. |
| `keyItemsBuckets` | string | `""` | Comma-separated bucket boundaries for key item distribution histograms, for example `"1M,8M"`. |
| `localStorageMaxSizeMb` | integer | `1024` | Maximum size, in MB, for local metrics storage. |
| `localStorageRetentionDays` | integer | `8` | Number of days to retain local metrics data. |

Tag key allowlist entries (`metricsTagKeysExposed`) must follow these rules:

- Keys are lowercased on the cluster.
- Each key must be 1–64 characters and cannot be whitespace only.
- Keys may contain ASCII letters, digits, spaces, and the characters `-`, `_`, `.`, `+`, `@`, and `:`.
- Duplicate keys are rejected. The operator rejects the resource if the same key appears more than once, ignoring case.
- A maximum of 50 keys is allowed.

<!-- REVIEWER QUESTION: are these allowlist key rules correct for 8.2.0? The "lowercased" and "may contain
     spaces, -, ., +, @, :" bullets above come from the v8.2.0-8 CRD field comment, but the metrics discussion
     indicates the cluster tightened validation to the Prometheus label regex [a-zA-Z_][a-zA-Z0-9_]* (no
     hyphens/spaces/dots, and lowercasing removed, so mixed case is allowed). If the regex form is right, these two
     bullets need rewriting.

     REVIEWER QUESTION: for keySizeBuckets / keyItemsBuckets, what are the valid units/suffixes (does "128M" mean
     megabytes and "1M" mean one million items?) and must the boundaries be in ascending order? -->

## Tag a database

Set tags on a Redis Enterprise database (REDB) with `spec.tags`, a set of key-value pairs:

```YAML
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseDatabase
metadata:
  name: orders-cache
spec:
  memorySize: 1GB
  tags:
    env: prod
    team: payments
    app: orders-service
```

The operator merges these tags into the database's tags on the cluster. With the cluster configuration shown above, only `env` and `team` can appear as metric labels. The `app` tag is stored on the database but not exposed in metrics.

`spec.tags` is optional. For details on how tags are merged, updated, and removed, see [Managed tags and deletion behavior](#managed-tags-and-deletion-behavior).

## Tag an Active-Active database

For an Active-Active database (REAADB), set tags under `spec.globalConfigurations.tags`, also a set of key-value pairs:

```YAML
apiVersion: app.redislabs.com/v1alpha1
kind: RedisEnterpriseActiveActiveDatabase
metadata:
  name: orders-aa
spec:
  globalConfigurations:
    tags:
      env: prod
      team: payments
```

The operator applies these tags to the Active-Active database's default configuration and to every participating cluster's instance. The cluster-level allowlist still applies. Configure `metricsConfig` on each participating REC to add the tag keys you want exposed to the allowlist.

## Managed tags and deletion behavior

The operator tracks the tag keys it manages for each database. This lets it apply changes, including deletions, without disturbing tags set outside Kubernetes.

- **External tags are preserved.** Tags that exist on the database but were never declared in `spec.tags` (or `spec.globalConfigurations.tags`) are left in place.
- **The custom resource wins on collision.** If a key exists both on the database and in the custom resource, the operator applies the value from the custom resource.
- **`status.managedTags` records what the operator owns.** After a successful sync, the operator records the tag keys it applied in `status.managedTags`. This record lets it tell a key you removed apart from a key it never managed.
- **Removing a key deletes it.** If you remove a key that was recorded in `status.managedTags`, the operator removes that tag from the database on the next reconciliation. Keys that were never in `status.managedTags`, such as tags set only through the Redis Enterprise REST API, aren't deleted.
- **Reserved keys are rejected.** Keys the operator reserves for its own internal use cannot be set in the spec. For REDB, these are `managed_by`, `redb_name`, `redb_namespace`, `db_service_port`, and `oss_cluster_access`. For REAADB, they also include `redb_resource`, `redb_resource_name`, `global_configurations_spec`, `replication_endpoint_port`, `rerc_name`, and the operator's internal secret-tracking keys (`redis.io/db-sec-name`, `redis.io/db-sec-latest`, `redis.io/certs-latest`, `redis.io/bu-sec-name`, and `redis.io/bu-sec-latest`). The admission controller rejects a custom resource that uses one.

{{< note >}}
When you upgrade to a release with this feature, `status.managedTags` starts empty for databases that already existed. The operator does not drop existing tags. It reapplies only the keys currently in the spec, so the upgrade has no effect on databases that never used tags.
{{< /note >}}

## View tagged metrics in Prometheus

<!-- REVIEWER QUESTIONS for this section (needed before it can be written):

     Endpoint: are exposed tags (and the key-distribution histogram metrics) available on the /v2 metrics endpoint
     only, or also on the legacy v1 / port-8070 stream? The discussion points to /v2. If it's /v2-only, the
     connect-prometheus-operator cross-link below is the v1 path and is wrong for this feature.

     Label model: confirm that exposed tags appear on a single db_tags metric queried via PromQL joins, not as a
     label on every DB metric. Please provide the exact db_tags metric name, its label set, and a canonical PromQL
     join example. Label names must match the Prometheus regex [a-zA-Z_][a-zA-Z0-9_]*. -->

For instructions on connecting Prometheus to Redis Enterprise for Kubernetes, see [Export metrics to Prometheus]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}}).

## Limitations

- **Allowlist size.** The cluster allows at most 50 tag keys in `metricsTagKeysExposed`. The operator doesn't cap the list itself; the cluster enforces the limit. Keep the allowlist small: each exposed key adds a label dimension to the affected metrics, which increases cardinality in your monitoring stack.
- **When changes take effect.** Changes to `metricsConfig`, `spec.tags`, and `spec.globalConfigurations.tags` apply on the operator's next reconciliation of the resource. No pod or cluster restart is required. Exposed tag labels appear in metrics on the next scrape after the cluster applies the change.

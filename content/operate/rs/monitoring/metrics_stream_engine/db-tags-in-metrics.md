---
Title: Database tags in metrics
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Expose Redis Software database tag keys as labels in v2 metrics, then join them onto database metrics in your observability tools.
group: observability
linkTitle: Database tags in metrics
summary: Learn how to expose Redis Software database tags in v2 metrics and use them to enrich database metrics.
type: integration
weight: 50
tocEmbedHeaders: true
---

## Overview

You can [expose](#enable-database-tags-in-metrics) selected [database tags]({{<relref "/operate/rs/databases/configure/db-tags">}}) as labels in the [v2 metrics]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v2">}}) scraping endpoint through a dedicated `db_tags` metric. Then [join `db_tags` onto your database metrics](#use-database-tags-in-observability-platforms) at query time, or enrich them in your observability pipeline, to group, filter, and alert on metrics by ownership, environment, service, tier, or any other metadata you store as tags.

## Enable database tags in metrics

Database tag exposure is controlled by two fields in the cluster's [metrics configuration]({{<relref "/operate/rs/monitoring/metrics_stream_engine/metrics-configuration">}}):

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `expose_db_tags` | boolean | `false` | When `true`, enables export of database tags through the `db_tags` metric. |
| `metrics_tag_keys_exposed` | list of strings | `[]` | The database tag keys that are eligible to be exported as labels. Can contain at most 50 keys. |

To expose database tags in metrics:

1. Set `expose_db_tags` to `true`.

1. Add the tag keys you want to expose to `metrics_tag_keys_exposed`. Only tags whose keys appear in this list are considered for export.

Example configuration:

```json
{
  "expose_db_tags": true,
  "metrics_tag_keys_exposed": ["env", "team", "tier"]
}
```

{{<warning>}}
`metrics_tag_keys_exposed` is replaced in full whenever you update it. To add a key while keeping the current ones, send the complete list. For example, to add `tier` to `["env", "team"]`, send `["env", "team", "tier"]`; sending only `["tier"]` removes `env` and `team`.
{{</warning>}}

## Exported metric

When `expose_db_tags` is enabled and a database has at least one tag whose key is listed in `metrics_tag_keys_exposed`, Redis Software emits a `db_tags` sample for that database:

```prometheus
db_tags{cluster="my-cluster", db="42", env="prod", team="core"} 1
```

Key points:

- `db_tags` is an information metric. Its value is always `1`; the labels carry the information.
- There is one `db_tags` series per database, identified by the fixed `cluster` and `db` labels.
- Each exposed tag becomes an additional label on the series.

### Emission rules

Redis Software emits `db_tags` per database according to these rules:

- `db_tags` is emitted only after you [enable database tags in metrics](#enable-database-tags-in-metrics).
- Only tags that follow the [tag validation rules]({{<relref "/operate/rs/databases/configure/db-tags#tag-validation-rules">}}) can be exported. [System tags]({{<relref "/operate/rs/databases/configure/db-tags#system-tags">}}) and [legacy tags]({{<relref "/operate/rs/databases/configure/db-tags#backward-compatibility-for-existing-tags">}}) that do not meet the rules are not eligible.
- Matching between a database's tag keys and the keys in `metrics_tag_keys_exposed` is exact and case-sensitive.
- If a database has no tag whose key is listed in `metrics_tag_keys_exposed`, no `db_tags` sample is emitted for that database.

## Use database tags in observability platforms

Because tags are exported through the separate `db_tags` metric, you combine them with other database metrics by matching on the shared `cluster` and `db` labels. Match on both labels in every platform so each database is uniquely identified: database IDs can repeat across clusters.

The examples below use the sample tags `env`, `team`, and `tier`, and the [`redis_server_used_memory`]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v2">}}) metric.

### Prometheus and Grafana

#### Dashboards

PromQL joins the labels from `db_tags` onto another database metric with a many-to-one vector match using the `on` and `group_left` operators. The same PromQL works in Prometheus and in Grafana panels that use a Prometheus data source.

```promql
sum by (env, team) (
  redis_server_used_memory
    * on (cluster, db) group_left(env, team)
      db_tags
)
```

To restrict the result to specific tag values, filter on the `db_tags` side of the match:

```promql
sum by (team) (
  redis_server_used_memory
    * on (cluster, db) group_left(env, team)
      db_tags{env="prod"}
)
```

#### Alerts

You can alert on tag-enriched metrics with the same join expression. The following is a Prometheus alerting rule that alerts on total memory by environment:

```yaml
groups:
  - name: redis-db-tags
    rules:
      - alert: HighRedisMemoryByEnvironment
        expr: |
          sum by (env) (
            redis_server_used_memory
              * on (cluster, db) group_left(env)
                db_tags{env="prod"}
          ) > THRESHOLD
        for: 5m
```

Replace `THRESHOLD` with a value appropriate for your deployment.

### Datadog

The Datadog OpenMetrics check can copy labels between collected metrics with the [`share_labels`](https://docs.datadoghq.com/integrations/openmetrics/) option. In your OpenMetrics instance configuration, share the `db_tags` labels with the metrics that match on `cluster` and `db`.

Transformation (OpenMetrics instance configuration):

```yaml
share_labels:
  db_tags:
    match:
      - cluster
      - db
```

Query the enriched metric in Datadog:

```text
sum:rdse.redis_server_used_memory{*} by {env,team}
```

### New Relic

The New Relic [Prometheus OpenMetrics integration](https://docs.newrelic.com/docs/infrastructure/prometheus-integrations/install-configure-openmetrics/configure-prometheus-openmetrics-integrations/) can copy labels between metrics scraped from the same endpoint with the [`copy_attributes`](https://docs.newrelic.com/docs/infrastructure/prometheus-integrations/install-configure-openmetrics/add-rename-or-copy-prometheus-attributes/) transformation. Copy the `db_tags` labels onto the Redis database metrics, matching on `cluster` and `db`. The `to_metrics` prefix selects the target metrics, so adjust `redis_` to match the Redis metric names in your environment.

Transformation (Prometheus OpenMetrics integration config):

```yaml
transformations:
  - copy_attributes:
      - from_metric: "db_tags"
        to_metrics:
          - "redis_"
        match_by:
          - cluster
          - db
```

Query the metric in New Relic:

```sql
FROM Metric
SELECT sum(redis_server_used_memory)
FACET env, team
```

### Dynatrace

Dynatrace has no built-in transformation to combine metrics. Use a custom transformation to attach the `db_tags` labels to your database metrics before ingestion.

The transformation attaches the `db_tags` labels to each database metric, matching on `cluster` and `db`:

```text
For each db_tags sample:
  record the exposed tag labels, keyed by (cluster, db)

For each database metric with (cluster, db):
  look up the recorded tag labels for (cluster, db)
  add the env, team, and tier labels
```

Query the metric in Dynatrace with DQL, using the metric and dimension names as they appear in your environment:

```text
timeseries avg(redis_server_used_memory), by:{env, team}
```

## Cardinality and performance considerations

Redis Software exports tags through one dedicated `db_tags` metric per database instead of adding tag labels to every database metric (which would multiply the number of series by your tag labels), so the performance overhead on the Redis cluster and the metric footprint are already small. However, the tags you expose can still negatively affect performance and cardinality, e.g. Selecting many tag keys, using high-cardinality tag values, or frequently changing tag values. Consider the following when choosing which tags to expose:
- Start with a small set of stable, low-cardinality tags such as `env`, `team`, `service`, or `tier`.
- Avoid user IDs, request IDs, timestamps, build numbers, and other frequently changing or high-cardinality values.

## Security considerations

Tags that you expose in metrics are sent to external monitoring tools. Do not use secrets, credentials, personal data, or confidential business data as tag keys or values.

## Troubleshooting and FAQ

### Why aren't my tags exposed to metrics?

Check if your tags adhere to the [emission rules](#emission-rules).

### Why do I see increased cardinality?

The tag labels you expose create additional time series in your monitoring backend. To keep cardinality under control, see [Cardinality and performance considerations](#cardinality-and-performance-considerations).

### Why aren't database tags added directly to every database metric?

To keep the performance overhead and metrics footprint small. See [Cardinality and performance considerations](#cardinality-and-performance-considerations).

### Can I expose all my tags?

You can list multiple tag keys in `metrics_tag_keys_exposed`, up to a limit of 50, but you should expose only the tags you need for dashboards, alerts, routing, or ownership. Exposing unnecessary or high-cardinality tags increases monitoring costs and query load.

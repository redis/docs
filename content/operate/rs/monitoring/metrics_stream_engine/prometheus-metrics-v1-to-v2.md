---
Title: Transition from Prometheus v1 to Prometheus v2
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Transition from v1 metrics to v2 PromQL equivalents.
group: observability
linkTitle: Transition from Prometheus v1 to v2
summary: Transition from v1 metrics to v2 PromQL equivalents.
type: integration
weight: 49
tocEmbedHeaders: true
---

You can integrate Redis Software with Prometheus and tools such as [Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise">}}), [Datadog]({{<relref "/integrate/datadog-with-redis-enterprise">}}), [Dynatrace]({{<relref "/integrate/dynatrace-with-redis-enterprise">}}), or [New Relic]({{<relref "/integrate/new-relic-with-redis-enterprise">}}) to create dashboards for important metrics.

As of Redis Software version 7.8.2, [PromQL (Prometheus Query Language)](https://prometheus.io/docs/prometheus/latest/querying/basics/) metrics are available. V1 metrics are deprecated but still available.

To transition from v1 metrics to v2 metrics, you need to change the `metrics_path` in your Prometheus configuration file from `/` to `/v2` to use the new scraping endpoint.

Here's an example of the updated scraping configuration in `prometheus.yml`:

```yaml
scrape_configs:
  # Scrape Redis Software
  - job_name: redis-enterprise
    scrape_interval: 30s
    scrape_timeout: 30s
    metrics_path: /v2
    scheme: https
    tls_config:
      insecure_skip_verify: true
    static_configs:
      - targets: ["<cluster_name>:8070"]
```

{{< note >}}
**Use a single scrape target.** The v2 endpoint is cluster-wide. Every node aggregates metrics from all nodes and returns the same complete result, so one target is enough. If you list one target per node, Prometheus stores every series once per target and multiplies each `sum()`-based dashboard panel by the number of targets. This produces no error. Prometheus reports every target as up and Grafana renders normally. Use your cluster FQDN as the single target so metrics remain available if a node goes down.
{{< /note >}}

The reason for a single target changed in v2. On v1, only the cluster master served the metrics endpoint and other nodes returned a redirect, so the protocol effectively forced one target. On v2, every node returns the full cluster view and no redirects are involved. If your v1 configuration listed multiple node targets, reduce it to one.

If you prefer a per-node scrape topology, scrape `/v2/node`, which returns only that node's own metrics. Aggregation adds the `cluster` and `node` labels, so `/v2/node` responses omit them. Add `relabel_configs` to supply those labels before using `/v2/node` with the Redis Software Grafana dashboards.

You can scrape both v1 and v2 endpoints simultaneously during the transition period to prepare dashboards and ensure a smooth transition.

You can use the following tables to transition from v1 metrics to equivalent v2 PromQL. For a list of all available v2 metrics, see [Prometheus metrics v2]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v2">}}).

{{<embed-md "rs-prometheus-metrics-transition-plan.md">}}

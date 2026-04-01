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
url: '/operate/rs/7.22/references/metrics/prometheus-metrics-v1-to-v2/'
---

You can [integrate Redis Enterprise Software with Prometheus and Grafana]({{<relref "/operate/rs/7.22/monitoring/prometheus_and_grafana">}}) to create dashboards for important metrics.

As of Redis Enterprise Software version 7.8.2, [PromQL (Prometheus Query Language)](https://prometheus.io/docs/prometheus/latest/querying/basics/) metrics are available. V1 metrics are deprecated but still available.

To transition from v1 metrics to v2 metrics, you need to change the `metrics_path` in your Prometheus configuration file from `/` to `/v2` to use the new scraping endpoint.

Here's an example of the updated scraping configuration in `prometheus.yml`:

```yaml
scrape_configs:
  # Scrape Redis Enterprise
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

It is possible to scrape both v1 and v2 endpoints simultaneously during the transition period to prepare dashboards and ensure a smooth transition.

You can use the following tables to transition from v1 metrics to equivalent v2 PromQL. For a list of all available v2 metrics, see [Prometheus metrics v2]({{<relref "/operate/rs/7.22/references/metrics/prometheus-metrics-v2">}}).

{{<embed-md "rs-prometheus-metrics-transition-plan.md">}}

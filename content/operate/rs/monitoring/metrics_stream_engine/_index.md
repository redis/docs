---
Title: Monitoring v2
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: The new metrics engine for monitoring Redis Enterprise Software.
hideListLinks: true
linkTitle: Monitoring v2
weight: 60
tocEmbedHeaders: true
---

The new metrics stream engine is generally available as of [Redis Enterprise Software version 8.0]({{<relref "/operate/rs/release-notes/rs-8-0-releases">}}).

The new metrics stream engine:

- Exposes the v2 Prometheus scraping endpoint at `https://<IP>:8070/v2`.

- Exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

- Enables real-time monitoring, including full monitoring during maintenance operations, which provides full visibility into performance during events such as shards' failovers and scaling operations.

## Integrate with external monitoring tools

To integrate Redis Enterprise metrics into your monitoring environment, see the following integration guides:

- [Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise">}})

- [Datadog]({{<relref "/integrate/datadog-with-redis-enterprise">}})

- [Dynatrace]({{<relref "/integrate/dynatrace-with-redis-enterprise">}})

- [New Relic]({{<relref "/integrate/new-relic-with-redis-enterprise">}})

For a detailed tutorial to deploy a complete monitoring stack with Prometheus and Grafana, see [Redis Software Observability with Prometheus and Grafana](https://redis.io/learn/operate/observability/redis-software-prometheus-and-grafana).

Filter [Libraries and tools]({{<relref "/integrate">}}) by "observability" for additional tools and guides.

## Prometheus metrics v2

For a list of all available v2 metrics, see [Prometheus metrics v2]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v2">}}).

The v2 scraping endpoint also exposes metrics for `node_exporter` version 1.8.1. For more information, see the [Prometheus node_exporter GitHub repository](https://github.com/prometheus/node_exporter).

## Transition from Prometheus v1 to Prometheus v2

If you are already using the existing scraping endpoint for integration, do the following to transition from v1 metrics to v2 metrics:

1. Change the `metrics_path` in your Prometheus configuration file from `/` to `/v2` to use the new scraping endpoint.

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

1. Use the metrics tables in [this guide]({{<relref "/operate/rs/monitoring/metrics_stream_engine/prometheus-metrics-v1-to-v2">}}) to transition from v1 metrics to equivalent v2 PromQL.

It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.

{{<embed-md "rs-monitoring-best-practices.md">}}
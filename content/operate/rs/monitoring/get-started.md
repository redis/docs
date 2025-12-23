---
LinkTitle: Get started
Title: Get started with monitoring Redis Enterprise Software
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Collect and visualize Redis Enterprise Software metrics.
group: observability
summary: Collect and visualize your Redis Enterprise Software metrics.
type: integration
weight: 5
tocEmbedHeaders: true
aliases: /operate/rs/monitoring/prometheus_and_grafana/
---

You can use Prometheus and compatible integrations to collect and visualize your Redis Enterprise Software metrics.

Metrics are exposed at the cluster, node, database, shard, and proxy levels.

- [Prometheus](https://prometheus.io/) is an open source systems monitoring and alerting toolkit that aggregates metrics from different sources.

You can use Prometheus integrations to:
- Collect and display metrics not available in the admin console

- Set up automatic alerts for node or cluster events

- Display Redis Enterprise Software metrics alongside data from other systems

In each cluster, the `metrics_exporter` process exposes Prometheus metrics on port 8070.

## Prometheus integrations

You can integrate Redis Enterprise Software with Prometheus and one of the following tools to collect and visualize your deployment's metrics:

- [Grafana]({{<relref "/integrate/prometheus-with-redis-enterprise">}})

- [Datadog]({{<relref "/integrate/datadog-with-redis-enterprise">}})

- [Dynatrace]({{<relref "/integrate/dynatrace-with-redis-enterprise">}})

- [New Relic]({{<relref "/integrate/new-relic-with-redis-enterprise">}})

{{<embed-md "rs-monitoring-best-practices.md">}}

## Prometheus quick start

To get started with Prometheus:

1. Create a directory called `prometheus` on your local machine.

1. Within that directory, create a configuration file called `prometheus.yml`.

1. Add the following contents to the configuration file and replace `<cluster_name>` with your Redis Enterprise Software cluster's FQDN:

    {{< multitabs id="prometheus-config-yml" 
tab1="v2 (metrics stream engine)"
tab2="v1" >}}

```yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Attach these labels to any time series or alerts when communicating with
# external systems (federation, remote storage, Alertmanager).
  external_labels:
    monitor: "prometheus-stack-monitor"

# Load and evaluate rules in this file every 'evaluation_interval' seconds.
#rule_files:
# - "first.rules"
# - "second.rules"

scrape_configs:
# scrape Prometheus itself
  - job_name: prometheus
    scrape_interval: 10s
    scrape_timeout: 5s
    static_configs:
      - targets: ["localhost:9090"]

# scrape Redis Enterprise Software
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

-tab-sep-

```yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

# Attach these labels to any time series or alerts when communicating with
# external systems (federation, remote storage, Alertmanager).
  external_labels:
    monitor: "prometheus-stack-monitor"

# Load and evaluate rules in this file every 'evaluation_interval' seconds.
#rule_files:
# - "first.rules"
# - "second.rules"

scrape_configs:
# scrape Prometheus itself
  - job_name: prometheus
    scrape_interval: 10s
    scrape_timeout: 5s
    static_configs:
      - targets: ["localhost:9090"]

# scrape Redis Enterprise Software
  - job_name: redis-enterprise
    scrape_interval: 30s
    scrape_timeout: 30s
    metrics_path: /
    scheme: https
    tls_config:
      insecure_skip_verify: true
    static_configs:
      - targets: ["<cluster_name>:8070"]
```
    {{< /multitabs >}}

1. Set up your Prometheus server.

    {{< note >}}
We recommend running Prometheus in Docker only for development and testing.
    {{< /note >}}

    To set up Prometheus on Docker:

    1. Create a _docker-compose.yml_ file:

        ```yml
        version: '3'
        services:
            prometheus-server:
                image: prom/prometheus
                ports:
                    - 9090:9090
                volumes:
                    - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
        ```

    1. To start the containers, run:

        ```sh
        $ docker compose up -d
        ```

    1. To check that all of the containers are up, run: 
    
        ```sh
        docker ps
        ```

    1. In your browser, sign in to Prometheus at `http://localhost:9090` to make sure the server is running.

    1. Select **Status** and then **Targets** to check that Prometheus is collecting data from your Redis Enterprise Software cluster.

        {{<image filename="images/rs/prometheus-target.png" alt="The Redis Enterprise Software target showing that Prometheus is connected to the Redis Enterprise Software Cluster.">}}

        If Prometheus is connected to the cluster, you can type **node_up** in the Expression field on the Prometheus home page to see the cluster metrics.

1. Integrate Redis Enterprise Software and your Prometheus server with one of the [compatible tools](#prometheus-integrations). For help, see the integration guide and official documentation for your chosen tool.

1. Add dashboards for cluster, database, node, and shard metrics.

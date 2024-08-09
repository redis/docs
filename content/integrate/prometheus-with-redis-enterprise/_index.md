---
LinkTitle: Prometheus & Grafana with Redis Enterprise
Title: Prometheus and Grafana with Redis Enterprise
alwaysopen: false
categories:
- docs
- integrate
- rs
description: Use Prometheus and Grafana to collect and visualize Redis Cloud metrics.
group: observability
summary: You can use Prometheus and Grafana to collect and visualize your Redis Enterprise
  Software metrics.
type: integration
weight: 5
---

You can use Prometheus and Grafana to collect and visualize your Redis Enterprise Software metrics.

Metrics are exposed at the cluster, node, database, shard, and proxy levels.


- [Prometheus](https://prometheus.io/) is an open source systems monitoring and alerting toolkit that aggregates metrics from different sources.
- [Grafana](https://grafana.com/) is an open source metrics visualization tool that processes Prometheus data.

You can use Prometheus and Grafana to:
- Collect and display metrics not available in the [admin console]({{< relref "/operate/rs/references/metrics" >}})

- Set up automatic alerts for node or cluster events

- Display Redis Enterprise Software metrics alongside data from other systems

{{<image filename="images/rs/grafana-prometheus.png" alt="Graphic showing how Prometheus and Grafana collect and display data from a Redis Enterprise Cluster. Prometheus collects metrics from the Redis Enterprise cluster, and Grafana queries those metrics for visualization.">}}

In each cluster, the metrics_exporter process exposes Prometheus metrics on port 8070.

## Quick start

To get started with Prometheus and Grafana:

1. Create a directory called 'prometheus' on your local machine.

1. Within that directory, create a configuration file called `prometheus.yml`.
1. Add the following contents to the configuration file and replace `<cluster_name>` with your Redis Enterprise cluster's FQDN:

    {{< note >}}

We recommend running Prometheus in Docker only for development and testing.

    {{< /note >}}

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

    # scrape Redis Enterprise
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

1. Set up your Prometheus and Grafana servers.
    To set up Prometheus and Grafana on Docker:
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

            grafana-ui:
                image: grafana/grafana
                ports:
                    - 3000:3000
                environment:
                    - GF_SECURITY_ADMIN_PASSWORD=secret
                links:
                    - prometheus-server:prometheus
        ```

    1. To start the containers, run:

        ```sh
        $ docker compose up -d
        ```

    1. To check that all of the containers are up, run: `docker ps`
    1. In your browser, sign in to Prometheus at http://localhost:9090 to make sure the server is running.
    1. Select **Status** and then **Targets** to check that Prometheus is collecting data from your Redis Enterprise cluster.

        {{<image filename="images/rs/prometheus-target.png" alt="The Redis Enterprise target showing that Prometheus is connected to the Redis Enterprise Cluster.">}}

        If Prometheus is connected to the cluster, you can type **node_up** in the Expression field on the Prometheus home page to see the cluster metrics.

1. Configure the Grafana datasource:
    1. Sign in to Grafana. If you installed Grafana locally, go to http://localhost:3000 and sign in with:

        - Username: admin
        - Password: secret

    1. In the Grafana configuration menu, select **Data Sources**.

    1. Select **Add data source**.

    1. Select **Prometheus** from the list of data source types.

        {{<image filename="images/rs/prometheus-datasource.png" alt="The Prometheus data source in the list of data sources on Grafana.">}}

    1. Enter the Prometheus configuration information:

        - Name: `redis-enterprise`
        - URL: `http://<your prometheus server name>:9090`

        {{<image filename="images/rs/prometheus-connection.png" alt="The Prometheus connection form in Grafana.">}}

    {{< note >}}

- If the network port is not accessible to the Grafana server, select the **Browser** option from the Access menu.
- In a testing environment, you can select **Skip TLS verification**.

    {{< /note >}}

1. Add dashboards for cluster, database, node, and shard metrics.
    To add preconfigured dashboards:
    1. In the Grafana dashboards menu, select **Manage**.
    1. Click **Import**.
    1. Upload one or more [Grafana dashboards](#grafana-dashboards-for-redis-enterprise).

### Grafana dashboards for Redis Enterprise

Redis publishes four preconfigured dashboards for Redis Enterprise and Grafana:

* The [cluster status dashboard](https://grafana.com/grafana/dashboards/18405-cluster-status-dashboard/) provides an overview of your Redis Enterprise clusters.
* The [database status dashboard](https://grafana.com/grafana/dashboards/18408-database-status-dashboard/) displays specific database metrics, including latency, memory usage, ops/second, and key count.
* The [node metrics dashboard](https://github.com/redis-field-engineering/redis-enterprise-observability/blob/main/grafana/dashboards/grafana_v9-11/software/basic/redis-software-node-dashboard_v9-11.json) provides metrics for each of the nodes hosting your cluster.
* The [shard metrics dashboard](https://github.com/redis-field-engineering/redis-enterprise-observability/blob/main/grafana/dashboards/grafana_v9-11/software/basic/redis-software-shard-dashboard_v9-11.json) displays metrics for the individual Redis processes running on your cluster nodes
* The [Active-Active dashboard](https://github.com/redis-field-engineering/redis-enterprise-observability/blob/main/grafana/dashboards/grafana_v9-11/software/basic/redis-software-active-active-dashboard_v9-11.json) displays metrics specific to [Active-Active databases]({{< relref "/operate/rs/databases/active-active" >}}).

These dashboards are open source. For additional dashboard options, or to file an issue, see the [Redis Enterprise observability Github repository](https://github.com/redis-field-engineering/redis-enterprise-observability/tree/main/grafana).

For more information about configuring Grafana dashboards, see the [Grafana documentation](https://grafana.com/docs/).


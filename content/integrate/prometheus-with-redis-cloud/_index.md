---
LinkTitle: Prometheus & Grafana with Redis Cloud
Title: Prometheus and Grafana with Redis Cloud
alwaysopen: false
categories:
- docs
- integrate
- rc
description: Use Prometheus and Grafana to collect and visualize Redis Cloud metrics.
group: observability
summary: You can use Prometheus and Grafana to collect and visualize your Redis Cloud
  metrics.
type: integration
weight: 6
aliases:
    - /operate/rc/cloud-integrations/prometheus-integration
---

You can use Prometheus and Grafana to collect and visualize your Redis Cloud metrics.

- [Prometheus](https://prometheus.io/) is an open source systems monitoring and alerting toolkit that can scrape metrics from different sources.
- [Grafana](https://grafana.com/) is an open source metrics visualization tool that can process Prometheus data.

Redis Cloud exposes its metrics through a Prometheus endpoint. You can configure your Prometheus server to scrape metrics from your Redis Cloud subscription on port 8070.

The Redis Cloud Prometheus endpoint is exposed on Redis Cloud's internal network. To access this network, enable [VPC peering]({{< relref "/operate/rc/security/vpc-peering" >}}) or [Private Service Connect]({{< relref "/operate/rc/security/private-service-connect" >}}). Both options are only available with Redis Cloud Pro. You cannot use Prometheus and Grafana with Redis Cloud Essentials.

For more information on how Prometheus communicates with Redis Enterprise clusters, see [Prometheus integration with Redis Enterprise Software]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}}).

## Quick start

You can quickly set up Prometheus and Grafana for testing using the Prometheus and Grafana Docker images. 

### Prerequisites

1. Create a [Redis Cloud Pro database]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}). 

1. Set up [VPC peering]({{< relref "/operate/rc/security/vpc-peering" >}}).

1. Extract the Prometheus endpoint from the private endpoint to your database. The private endpoint is in the [Redis Cloud console](https://app.redislabs.com/) under the [Configuration tab]({{< relref "/operate/rc/databases/view-edit-database#configuration-tab" >}}) of your database. The Prometheus endpoint is on port 8070 of the internal server.

    For example, if your private endpoint is:

    ```sh
    redis-12345.internal.<cluster_address>:12345
    ```

    The Prometheus endpoint is:

    ```sh
    internal.<cluster_address>:8070
    ``` 

1. Create an instance to run Prometheus and Grafana on the same cloud provider as your Redis Cloud subscription (for example, Amazon Web Services or Google Cloud). This instance must:
    - Exist in the same region as your Redis Cloud subscription.
    - Connect to the VPC subnet that is peered with your Redis Cloud subscription.
    - Allow outbound connections to port 8070, so that Prometheus can scrape the Redis Cloud server for data.
    - Allow inbound connections to port 9090 for Prometheus and port 3000 for Grafana.

### Set up Prometheus

To get started with custom monitoring with Prometheus on Docker:

1. Create a directory on the Prometheus instance called `prometheus` and create a `prometheus.yml` file in that directory.

1. Add the following contents to `prometheus.yml`. Replace `<prometheus_endpoint>` with the Prometheus endpoint.

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

        # scrape Redis Cloud
        - job_name: redis-cloud
        scrape_interval: 30s
        scrape_timeout: 30s
        metrics_path: /
        scheme: https
        static_configs:
          - targets: ["<prometheus_endpoint>:8070"]
    ```

1. Create a `docker-compose.yml` file with instructions to set up the Prometheus and Grafana Docker images.

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

1. To check that all the containers are up, run: `docker ps`
1. In your browser, sign in to Prometheus at `http://localhost:9090` to make sure the server is running.
1. Select **Status** and then **Targets** to check that Prometheus is collecting data from the Redis Cloud cluster.

    {{<image filename="images/rs/prometheus-target.png" alt="The Redis Enterprise target showing that Prometheus is connected to the Redis Enterprise Cluster.">}}

    If Prometheus is connected to the cluster, you can type **node_up** in the Expression field on the Prometheus home page to see the cluster metrics.

See [Prometheus Metrics]({{< relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-definitions" >}}) for a list of metrics that Prometheus collects from Redis Enterprise clusters.

### Set up Grafana

Once the Prometheus and Grafana Docker containers are running, and Prometheus is connected to your Redis Cloud subscription, you can set up your Grafana dashboards.

1. Sign in to Grafana. If you installed Grafana with Docker, go to `http://localhost:3000` and sign in with:

    - Username: `admin`
    - Password: `secret`

1. In the Grafana configuration menu, select **Data Sources**.

1. Select **Add data source**.

1. Select **Prometheus** from the list of data source types.

    {{<image filename="images/rs/prometheus-datasource.png" alt="The Prometheus data source in the list of data sources on Grafana.">}}

1. Enter the Prometheus configuration information:

    - Name: `redis-cloud`
    - URL: `http://prometheus-server:9090`
    - Access: `Server`

    {{<image filename="images/rc/prometheus-connection.png" alt="The Prometheus connection form in Grafana.">}}

    {{< note >}}

- If the network port is not accessible to the Grafana server, select the **Browser** option from the Access menu.
- In a testing environment, you can select **Skip TLS verification**.

    {{< /note >}}

1. Add dashboards for your subscription and database metrics.
    To add preconfigured dashboards:
    1. In the Grafana dashboards menu, select **Manage**.
    1. Select **Import**.
    1. Add the [subscription status](https://grafana.com/grafana/dashboards/18406-subscription-status-dashboard/) and [database status](https://grafana.com/grafana/dashboards/18407-database-status-dashboard/) dashboards.

### Grafana dashboards for Redis Cloud

Redis publishes preconfigured dashboards for Redis Cloud and Grafana:

* The [subscription status dashboard](https://grafana.com/grafana/dashboards/18406-subscription-status-dashboard/) provides an overview of your Redis Cloud subscriptions.
* The [database status dashboard](https://grafana.com/grafana/dashboards/18407-database-status-dashboard/) displays specific database metrics, including latency, memory usage, ops/second, and key count.
* The [Active-Active dashboard](https://github.com/redis-field-engineering/redis-enterprise-observability/blob/main/grafana/dashboards/grafana_v9-11/cloud/basic/redis-cloud-active-active-dashboard_v9-11.json) displays metrics specific to [Active-Active databases]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}).

These dashboards are open source. For additional dashboard options, or to file an issue, see the [Redis Enterprise observability Github repository](https://github.com/redis-field-engineering/redis-enterprise-observability/tree/main/grafana).

For more information about configuring Grafana dashboards, see the [Grafana documentation](https://grafana.com/docs/).

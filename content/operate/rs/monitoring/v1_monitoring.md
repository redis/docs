---
Title: Metrics and alerts for monitoring v1
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Monitor Redis Enterprise Software clusters and databases using internal monitoring systems and external monitoring tools.
hideListLinks: true
linkTitle: Monitoring v1
weight: 50
---

Current Monitoring System (Deprecated)

- Internal Metrics Storage
    - Metrics are internally aggregated, calculated, and stored for up to one year.
    - This historical data is used for generating trends and performance insights over time.

- [Statistics APIs]({{<relref "/operate/rs/references/rest-api/objects/statistics">}})
    - A set of RESTful APIs that expose metrics collected at regular intervals from clusters, nodes, databases, shards, and endpoints.
    - These APIs allow customers to retrieve performance and usage statistics directly from the internal storage layer.

- Cluster Manager Metrics and Alerts
    - The Cluster Manager UI includes dedicated metrics pages that display pre-aggregated metrics.
    - Cluster alerts are triggered based on thresholds applied to these stored metrics.
      
- v1 Prometheus Scraping Endpoint
    - Redis Enterprise exposes a legacy /prometheus_metrics endpoint to integrate with external observability platforms like [Prometheus and Grafana]({{<relref "/operate/rs/monitoring/prometheus_and_grafana">}}).
    - This endpoint fetches data from the internal storage, providing basic monitoring integration.

- Deprecation notice:
    - The internal monitoring system, while functional, has several limitations that affect scalability and accuracy:
      
        - Limited Granularity: Metrics are aggregated before storage, resulting in a loss of fine-grained insights.
        - Stale Data: Stored metrics may lag behind real-time system states, reducing the effectiveness of alerting.
        - Scalability Constraints: Internal storage and processing introduce performance overhead and are not optimized for large-scale observability pipelines.
        - Limited Extensibility: The system is tightly coupled with internal components, making it difficult to integrate with modern monitoring ecosystems.
     
Transition to Metrics Stream Engine

To address these challenges, Redis Enterprise is transitioning to a new observability foundation: the Metrics Stream Engine.

This modern monitoring stack introduces:

- Real-Time Metrics: Data is exposed directly from the engine without intermediate storage, ensuring high fidelity and low-latency insights.

- Scalable Architecture: Designed for cloud-native observability, with a lightweight Prometheus collectors.

- Deeper Visibility: Exposes new types of metrics such as key size distribution, server overall latency histograms, and system internals with per-endpoint resolution.

We recommend all customers migrate to the Metrics Stream Engine for enhanced accuracy, scalability, and future-proof observability.

## Cluster manager metrics

You can see the metrics of the cluster in:

- **Cluster > Metrics**
- **Node > Metrics** for each node
- **Database > Metrics** for each database, including the shards for that database

The scale selector at the top of the page allows you to set the X-axis (time) scale of the graph.

To choose which metrics to display in the two large graphs at the top of the page:

1. Hover over the graph you want to show in a large graph.
1. Click on the right or left arrow to choose which side to show the graph.

We recommend that you show two similar metrics in the top graphs so you can compare them side-by-side.

See the following topics for metrics definitions:
- [Database operations]({{< relref "/operate/rs/references/metrics/database-operations" >}}) for database metrics
- [Resource usage]({{< relref "/operate/rs/references/metrics/resource-usage" >}}) for resource and database usage metrics
- [Auto Tiering]({{< relref "/operate/rs/references/metrics/auto-tiering" >}}) for additional metrics for [Auto Tiering ]({{< relref "/operate/rs/databases/auto-tiering" >}}) databases

## Cluster alerts

In **Cluster > Alert Settings**, you can enable alerts for node or cluster events, such as high memory usage or throughput.

Configured alerts are shown:

- As a notification on the status icon ( {{< image filename="/images/rs/icons/icon_warning.png#no-click" alt="Warning" width="18px" class="inline" >}} ) for the node and cluster
- In the **log**
- In email notifications, if you configure [email alerts](#send-alerts-by-email)

{{< note >}}
If you enable alerts for "Node joined" or "Node removed" actions,
you must also enable "Receive email alerts" so that the notifications are sent.
{{< /note >}}

To enable alerts for a cluster:

1. In **Cluster > Alert Settings**, click **Edit**. 
1. Select the alerts that you want to show for the cluster and click **Save**.

## Database alerts

For each database, you can enable alerts for database events, such as high memory usage or throughput.

Configured alerts are shown:

- As a notification on the status icon ( {{< image filename="/images/rs/icons/icon_warning.png#no-click" alt="Warning" width="18px" class="inline" >}} ) for the database
- In the **log**
- In emails, if you configure [email alerts](#send-alerts-by-email)

To enable alerts for a database:

1. In **Configuration** for the database, click **Edit**.
1. Select the **Alerts** section to open it.
1. Select the alerts that you want to show for the database and click **Save**.

## Send alerts by email

To send cluster and database alerts by email:

1. In **Cluster > Alert Settings**, click **Edit**.
1. Select **Set an email** to configure the [email server settings]({{< relref "/operate/rs/clusters/configure/cluster-settings#configuring-email-server-settings" >}}).
1. In **Configuration** for the database, click **Edit**.
1. Select the **Alerts** section to open it.
1. Select **Receive email alerts** and click **Save**.
1. In **Access Control**, select the [database and cluster alerts]({{< relref "/operate/rs/security/access-control/manage-users" >}}) that you want each user to receive.

---
Title: Monitoring with metrics and alerts
alwaysopen: false
categories:
- docs
- operate
- rs
- kubernetes
description: Use the metrics that measure the performance of your Redis Enterprise Software clusters, nodes, databases, and shards to track the performance of your databases.
hideListLinks: true
linkTitle: Monitoring
weight: 96
---
You can use the metrics that measure the performance of your Redis Enterprise Software clusters, nodes, databases, and shards
to monitor the performance of your databases.
In the Redis Enterprise Cluster Manager UI, you can view metrics, configure alerts, and send notifications based on alert parameters. You can also access metrics and configure alerts through the REST API.

Redis Enterprise version 7.8.2 introduces a preview of the new metrics stream engine that exposes the v2  Prometheus scraping endpoint at `https://<IP>:8070/v2`.
This new engine exports all time-series metrics to external monitoring tools such as Grafana, DataDog, NewRelic, and Dynatrace using Prometheus.

The new engine enables real-time monitoring, including full monitoring during maintenance operations, providing full visibility into performance during events such as shards' failovers and scaling operations.

If you are already using the existing scraping endpoint for integration, follow [this guide]({{<relref "/integrate/prometheus-with-redis-enterprise/prometheus-metrics-v1-to-v2">}}) to transition and try the new engine. It is possible to scrape both existing and new endpoints simultaneously, allowing advanced dashboard preparation and a smooth transition.

To integrate Redis Enterprise metrics into your monitoring environment, see the integration guides for [Prometheus and Grafana]({{< relref "/integrate/prometheus-with-redis-enterprise/" >}}) or [Uptrace]({{< relref "/integrate/uptrace-with-redis-enterprise/" >}}).

Make sure you read the [definition of each metric]({{< relref "/operate/rs/references/metrics/" >}})
so that you understand exactly what it represents.

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

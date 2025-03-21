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

The current approach to monitoring Redis Enterprise Software includes:

- Internal monitoring systems:

    - [Statistics APIs]({{<relref "/operate/rs/references/rest-api/objects/statistics">}}), which collect various statistics at regular time intervals for clusters, nodes, databases, shards, and endpoints.

    - Cluster manager metrics and alerts.

- The v1 Prometheus scraping endpoint to integrate with external monitoring tools such as [Prometheus and Grafana]({{<relref "/operate/rs/monitoring/prometheus_and_grafana">}}).

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

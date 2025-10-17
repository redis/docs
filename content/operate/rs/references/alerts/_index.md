---
Title: Alerts
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Documents the alerts that are tracked with Redis Enterprise Software.
hideListLinks: true
linkTitle: Alerts
weight: $weight
---

Cluster alerts are triggered based on thresholds applied to these stored metrics.

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
1. Select **Set an email** to configure the [email server settings]({{< relref "/operate/rs/clusters/configure/cluster-settings#configure-email-server-settings" >}}).
1. In **Configuration** for the database, click **Edit**.
1. Select the **Alerts** section to open it.
1. Select **Receive email alerts** and click **Save**.
1. In **Access Control**, select the [database and cluster alerts]({{< relref "/operate/rs/security/access-control/manage-users" >}}) that you want each user to receive.

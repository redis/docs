---
Title: Cluster settings
alwaysopen: false
categories:
- docs
- operate
- rs
description: You can view and set various cluster settings such as cluster name, email
  service, time zone, and license.
linktitle: Cluster settings
toc: 'true'
weight: 10
url: '/operate/rs/7.22/clusters/configure/cluster-settings/'
---
You can view and set various cluster settings, such as cluster name, email service, time zone, and license, on the **Cluster > Configuration** page.

## General configuration tab

### Upload cluster license key

After purchasing a cluster license and if your account has the "Admin" role,
you can upload the cluster license key, either during initial
cluster creation or at any time afterward. The license key defines various
cluster settings, such as the maximum number of shards you can have in
the cluster. For more detailed information see [Cluster license
keys]({{< relref "/operate/rs/7.22/clusters/configure/license-keys.md" >}}).

### View max number of allowed shards

The maximum number of allowed shards, which is determined by the cluster license
key, appears in the **Max number of shards** field in the **License** section.

### View cluster name

The cluster name appears in the **Cluster name** field in the **License** section. This gives a
common name that your team or Redis support can refer to. It is
especially helpful if you have multiple clusters.

### Set time zone

You can change the **Time zone** field to ensure the date, time fields, and log entries in the Cluster Manager UI are shown in your preferred time zone. This setting doesn't affect other system logs or services.

## Alert settings tab

The **Alert Settings** tab lets you configure alerts that are relevant to the entire cluster, such as alerts for cluster utilization, nodes, node utilization, security, and database utilization.

You can also configure email server settings and [send alerts by email]({{< relref "/operate/rs/7.22/monitoring/v1_monitoring#send-alerts-by-email" >}}) to relevant users.

### Configure email server settings

To enable email alerts:

1. Enter your email
server details in the **Email server settings** section.

1. Select a connection security method:

    - TLS/SSL 

    - STARTTLS
    
    - None

1. Send a test email to verify your email server settings.

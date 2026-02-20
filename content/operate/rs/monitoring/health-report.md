---
Title: Consolidated health report
alwaysopen: false
categories:
- docs
- operate
- rs
description: View the consolidated health report to get a read-only snapshot of a Redis Software cluster's current system health.
linkTitle: Consolidated health report
weight: 78
tocEmbedHeaders: true
---

The consolidated health report is a read-only, consolidated snapshot of a cluster's current system health, including:

- License and certificate status

- Nodes and services health

- Node memory breakdown, including free and provisioned memory

- Running actions status

- Active alerts

- Basic database status and version

- High availability health

The consolidated health report consolidates cluster and database health information that was previously scattered across multiple APIs and CLI commands, such as [`rladmin status extra all`]({{<relref "/operate/rs/references/cli-utilities/rladmin/status">}}) and [`crdb-cli crdb health-report`]({{<relref "/operate/rs/references/cli-utilities/crdb-cli/crdb/health-report">}}) and required SSH access to view.

As of Redis Software version 8.0.14, you can access the cluster and database health reports using the [Cluster manager UI](#view-health-overview) or [REST API requests](#health-rest-api-requests).

## View health overview {#view-health-overview}

You can access the cluster and database health reports using the **Overview** screen in the Cluster Manager UI.

You can view node health

{{<image filename="images/rs/screenshots/overview/health-report-overview.png" alt="The health report screen.">}}

### Cluster info

The **Cluster Info** section provides basic cluster details, including:

- Overall cluster status

- Redis Software cluster version

- License usage and expiration date

### Cluster storage

The **Cluster Storage** section provides memory usage details, including used memory, free memory, and total memory for RAM, flash, persistent storage, and ephemeral storage on the cluster.

### Nodes

The **Nodes** section shows the status of nodes in the cluster and indicates which node is the leader or primary node.

### Databases

In the **Databases** section, you can check each database's status and Redis version. You can click the number listed by each field to display the relevant database names and click on the database links to view database details.

{{<image filename="images/rs/screenshots/overview/db-status-hover.png" alt="Active database names and links are displayed.">}}

### Certificates

The **Certificates** section shows whether the cluster's certificates are still valid. If a certificate appears as no longer valid, you can click the **Certificates** link to update the certificate.

{{<image filename="images/rs/screenshots/overview/cert-expires-soon.png" alt="The certificates section shows an alert that the SSO service certificate expires soon.">}}

### Actions

In the **Actions** section, you can view currently running actions.

{{<image filename="images/rs/screenshots/overview/running-actions.png" alt="The Actions section shows a database upgrade is in progress.">}}

### Alerts and services

If a configured alert threshold is reached or a running service stops, an alert will appear in the **Alerts & Services** section.

{{<image filename="images/rs/screenshots/overview/active-alerts.png" alt="Active alerts are displayed ephemeral and persistent storage have reached 90% capacity.">}}

## View node health {#view-node-health}

On the **Nodes** screen of the Cluster Manager UI, you can click on a node to go to its **Node configuration** tab and view node health details.

{{<image filename="images/rs/screenshots/nodes/node-config-screen.png" alt="Node configuration screen.">}}

### Verify nodes

You can check if nodes are functioning properly using one of the following methods:

{{< multitabs id="verify-nodes"
    tab1="Verify all nodes"
    tab2="Verify specific node" >}}

On the **Nodes** screen, click **Verify all nodes**.

-tab-sep-

1. On the **Nodes** screen, find the node you want verify in the list and click the **More actions** button (**&vellip;**).
    
1. Select **Verify node** from the list.

<img src="../../../../images/rs/screenshots/nodes/primary-node-more-actions-8-0.png" alt="Click the more actions button for a node to access node actions.">

{{< /multitabs >}}

### Node storage

The **Node storage** section of the **Node configuration** tab provides memory usage details, including used memory, free memory, and total memory for RAM, flash, persistent storage, and ephemeral storage on the node.

### Services

In the **Services** section **Node configuration** tab, you can view the list of services running on the node and the most recent status of each.

{{<image filename="images/rs/screenshots/nodes/node-stopped-service.png" alt="The services section shows most services running and one stopped service.">}}

### Shards

When viewing a node's configuration, you can click the **Shards** tab to view a list of database shards running on the node and related details such as each shard's ID, current status, role, and slot range.

{{<image filename="images/rs/screenshots/nodes/node-shards.png" alt="A list of database shards on the node.">}}

## Health report REST API requests {#health-rest-api-requests}

### Cluster health report requests

[Cluster health report]({{<relref "/operate/rs/references/rest-api/api-reference/#tag/Cluster/operation/cluster_cluster_health_report">}}) REST API requests provide overall health information for a cluster:

```sh
GET https://<host>:<port>/v4/cluster/health
```

### Database health report requests

[Database health report]({{<relref "/operate/rs/references/rest-api/api-reference/#tag/Database/operation/cluster_database_health_report">}}) REST API requests provide detailed health information for a specific database:

```sh
GET https://<host>:<port>/v4/bdb/<database_id>/health
```

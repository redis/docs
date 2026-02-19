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

As of Redis Software version 8.0.14, you can access the cluster and database health reports using the [Cluster manager UI](#view-health-cm-ui) or [REST API requests](#health-rest-api-requests).

## View health reports in the Cluster Manager UI {#view-health-cm-ui}

You can access the cluster and database health reports using the **Overview** screen in the Cluster Manager UI.

{{<image filename="images/rs/screenshots/overview/health-report-overview.png" alt="The health report screen.">}}

### Cluster info

The **Cluster Info** section provides basic cluster details, including:

- Overall cluster status

- Redis Software cluster version

- License usage and expiration date

### Cluster storage

The **Cluster Storage** section provides memory usage details, including used memory, free memory, and total memory for RAM, flash, persistent storage, and ephemeral storage.

### Nodes

The **Nodes** section shows the status of nodes in the cluster and indicates which node is the leader or primary node.

### Databases

In the **Databases** section, you can check each database's status and Redis version. You can point to the number listed by each field to display the relevant database names and click on the database links to view database details.

{{<image filename="images/rs/screenshots/overview/db-status-hover.png" alt="Active database names and links are displayed.">}}

### Certificates

The **Certificates** section shows whether the cluster's certificates are still valid. If a certificate appears as no longer valid, you can click the **Certificates** link to update the certificate.

### Actions

In the **Actions** section, you can view currently running actions.

### Alerts and services

If a configured alert threshold is reached, an alert will appear in the **Alerts & Services** section.

{{<image filename="images/rs/screenshots/overview/active-alerts.png" alt="Active alerts are displayed ephemeral and persistent storage have reached 90% capacity.">}}

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

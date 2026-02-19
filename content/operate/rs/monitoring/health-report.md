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

{{<image filename="images/rs/screenshots/overview/health-report-overview.png" alt="The health report.">}}

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

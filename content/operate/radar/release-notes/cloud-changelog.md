---
title: Redis Radar on Redis Cloud
alwaysopen: false
categories:
- docs
- operate
- radar
description: What changed in each Redis Radar release on Redis Cloud.
linkTitle: Cloud Changelog
weight: 10
---

This page lists what changed in each Redis Radar release on Redis Cloud. Redis Cloud rolls out these releases automatically, so there's nothing for you to install or upgrade. If you run Radar on your own infrastructure instead, see the [Self-managed releases]({{< relref "/operate/radar/release-notes#self-managed-releases" >}}), which you install and upgrade yourself.

To get started with Redis Cloud's hosted Radar, see [Redis Radar on Redis Cloud]({{< relref "/operate/rc/radar" >}}).

## 2026.11.1

Radar adds high-availability status to the **Databases** list and agent health to **Settings > Agents**, and fixes gaps in agent and Redis Cloud collection.

### Enhancements

- **High-availability status.** The **Databases** list now shows the high-availability status of each Redis Software database, and a **High availability** summary card counts the databases without it.
- **Agent health.** **Settings > Agents** now shows warnings for each agent and the collection status of each of its sources.
- **Dependencies.** Updated Go to 1.26.10 to fix CVE-2026-111943 (GO-2026-6809), and updated other dependencies.

### Resolved issues

- **Edited managed-agent sources.** A managed agent no longer stops collecting after you edit one of its sources. If you edited a source before this release, save it again.
- **Managed agents with no sources.** A managed agent with no sources no longer fails its heartbeat.
- **Agent source failures.** A failed source no longer marks the other sources of its agent as failed.
- **Interrupted collections.** Redis Open Source and Redis Cloud connections no longer stop collecting when a worker stops during a collection.
- **Redis Cloud collection timeouts.** Redis Cloud collections no longer fail after 1 minute.
- **Removed cluster resources.** Nodes, shards, alerts, and database health no longer stay in Radar after a Redis Software cluster stops reporting them.
- **Active-Active summary through an agent.** Redis Software clusters connected through an agent now show their Active-Active summary.
- **Redis Open Source through an agent.** Redis Open Source sources connected through an agent now show their connection and databases.
- **Redis Cloud endpoints.** Radar now collects from a Redis Open Source connection that points to a Redis Cloud database endpoint.

## 2026.10.1

Radar adds readable alert descriptions and a complete usage export, and fixes stale indicators and gaps in Redis Cloud discovery.

### Enhancements

- **Alert descriptions.** Redis Software alerts now include a readable description and, where the cluster reports one, the measured value.
- **Complete usage export.** The **Usage** CSV export now includes the retained raw usage fields and nested data. The export redacts sensitive data and protects against spreadsheet formulas.
- **Managed-agent audit records.** Radar now records audit events for managed-agent activation decisions, source changes, assignment updates, and failed administrative requests.
- **Database queries.** Radar skips health reads that aren't needed by Active-Active.
- **Dependencies.** Updated backend, frontend, and build dependencies.

### Resolved issues

- **Freshness reporting.** Cluster and Overview freshness now follows each source's collection interval. Amazon ElastiCache freshness metrics stay consistent across worker replicas.
- **Redis Cloud discovery.** Fixed a pagination issue that could make a Redis Cloud Pro subscription with databases appear empty.
- **Redis Cloud API retries.** Radar retries a Redis Cloud API read once when it fails with a transient error.
- **Health collection.** A slow Redis Software alert request no longer interrupts health collection.
- **Redis Cloud connection fields.** The Redis Cloud connection fields are now labeled **API account key** and **API user key**.
- **Telemetry settings.** The nonfunctional Telemetry settings are removed.
- **Navigation.** Existing `/overview` launch URLs now redirect to the dashboard.

## 2026.9.2

Redis Radar becomes available in Redis Cloud: sign in with your existing Redis Cloud credentials, with nothing to install, and get one fleet-wide view of every Redis cluster you run.

### Features

- **Fleet visibility.** Connect and monitor **Redis Software**, **Redis Cloud**, **Redis Open Source**, **Amazon ElastiCache**, and **Google Memorystore** clusters from a single view. ElastiCache and Memorystore connections are off by default; an administrator turns them on. Amazon ElastiCache connections authenticate through an IAM role, and Google Memorystore connections through impersonation, rather than long-lived credentials. See [Connect clusters]({{< relref "/operate/radar/connect" >}}).
- **Views.** Five dedicated views: **Overview**, **Clusters**, **Databases**, **Usage**, and **Alerts**. See [Monitor clusters and databases]({{< relref "/operate/radar/monitor" >}}).
- **Cross-cluster database list.** A cross-cluster **Databases** list, so you can find a database without knowing which cluster it lives on, including Active-Active replication health.
- **Usage tracking.** Memory, ops/sec, and shard consumption against licensed limits for Redis Software.
- **Alerts.** Aggregated from every connected Redis Software cluster and node, ordered by severity, with rules that stay owned by the cluster.
- **License tracking.** Fleet-wide **license** tracking: expiration date, days remaining, and shard usage broken out by total, RAM, and Flex shards, with CSV export.
- **Certificate tracking.** Fleet-wide **certificate** tracking by type, with expiration dates and a shared Valid/Expiring/Expired status model. See [Licenses and certificates]({{< relref "/operate/radar/licenses-and-certificates" >}}).

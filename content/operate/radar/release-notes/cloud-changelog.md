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

## 2026.09.XX

Redis Radar becomes available in Redis Cloud. Sign in with your existing Redis Cloud credentials; there's nothing to install. Radar gives you one fleet-wide view of every Redis cluster you run.

### Highlights

#### Fleet visibility

- Connect and monitor **Redis Software**, **Redis Cloud**, **Redis Open Source**, **Amazon ElastiCache**, and **Google Memorystore** clusters from a single view. ElastiCache and Memorystore connections are off by default; an administrator turns them on. Amazon ElastiCache connections authenticate through an IAM role, and Google Memorystore connections through impersonation, rather than long-lived credentials. See [Connect clusters]({{< relref "/operate/radar/connect" >}}).
- Five dedicated views: **Overview**, **Clusters**, **Databases**, **Usage**, and **Alerts**. See [Monitor clusters and databases]({{< relref "/operate/radar/monitor" >}}).
- A cross-cluster **Databases** list, so you can find a database without knowing which cluster it lives on, including Active-Active replication health.
- **Usage** tracking for Redis Software: memory, ops/sec, and shard consumption against licensed limits.
- **Alerts** aggregated from every connected Redis Software cluster and node, ordered by severity, with rules that stay owned by the cluster.

#### Licenses and certificates

- Fleet-wide **license** tracking: expiration date, days remaining, and shard usage broken out by total, RAM, and Flex shards, with CSV export.
- Fleet-wide **certificate** tracking by type, with expiration dates and a shared Valid/Expiring/Expired status model.
See [Licenses and certificates]({{< relref "/operate/radar/licenses-and-certificates" >}}).


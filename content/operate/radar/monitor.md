---
title: Monitor clusters and databases
alwaysopen: false
categories:
- docs
- operate
- radar
description: Read fleet health, capacity, usage, and alerts across every cluster Radar collects from.
linkTitle: Monitor
weight: 30
---

The views on this page are read-only. You cannot start, stop, resize, or reconfigure anything from them: you read what your clusters reported, then act on the cluster itself.

Radar has five views, each answering a different question:

| View | Answers |
|---|---|
| [Overview](#overview) | Is anything wrong anywhere? |
| [Clusters](#clusters) | Which cluster, and what does it look like? |
| [Databases](#databases) | Which database, across every cluster? |
| [Usage](#usage) | How much are you consuming against your limits? |
| [Alerts](#alerts) | What is your fleet complaining about? |

## How current the data is

Radar shows the result of the last successful collection, not live state. This applies to every number on every screen.

Each list carries a **Last Seen** column, and the Overview has a data freshness card, so the age of what you are reading is always on screen next to the value.

Different data refreshes at different rates, which is why Usage can look staler than health:

| Data | Default interval |
|---|---|
| Health | 5 minutes |
| Active-Active replication | 5 minutes |
| Running actions | 5 minutes |
| Usage | 1 hour |

Your administrator can change these intervals. Collecting more often costs more requests against every cluster in the fleet, so the defaults are deliberately conservative.

If a cluster's Last Seen value stops advancing, treat that as a Radar connectivity problem rather than a healthy cluster. Radar keeps showing the last good data it has.

On a Redis Cloud database's detail view, **Force refresh** collects that database again instead of waiting for the next scheduled collection. Use it after changing something on the cluster, to confirm Radar has caught up.

## When a value reads N/A

**N/A** means Radar has no value for that metric, not that the value is zero. Radar also hides the utilization meter, because a `0` would read as an idle fleet.

This affects memory and ops/sec. Older Redis Software versions do not expose the per-database statistics behind those figures, so a fleet of Redis Software 7.2 or 7.4 clusters can show N/A where a newer fleet shows a number.

Shard counts are the exception: they always show a number, because zero shards is a real answer rather than a missing one.

## Overview

The **Overview** answers one question for a fleet too large to check by hand: is anything wrong anywhere?

- **Fleet health.** Cluster and database health side by side, so a problem that affects one database in one cluster is still visible at the top level.
- **Capacity and memory pressure.** Available capacity across the fleet, and which clusters are under memory pressure.
- **Redis deployments and version distribution.** What you are running and how many versions you are spread across. Version sprawl is usually invisible until you look at a fleet-wide count.
- **Hosts.** Host inventory behind the fleet.
- **Licenses and certificates.** Anything expiring, summarized. See [Licenses and certificates]({{< relref "/operate/radar/licenses-and-certificates" >}}).
- **Alerts.** The most severe alerts currently raised. See [Alerts](#alerts).
- **Running actions.** Operations in progress on your clusters.
- **Data freshness.** How current the rest of the dashboard is.

## Clusters

The **Clusters** list is one row per cluster, whichever deployment type it came from:

| Column | Shows |
|---|---|
| Name | Your display name for the cluster. |
| Type | Deployment type: Redis Software, Redis Cloud, or Redis Open Source. |
| Account ID | The account the cluster belongs to, for cloud connections. |
| Region | Where it runs. |
| Status | Current health. |
| License | License state. |
| Plan | The subscription plan, for cloud connections. |
| Memory | Memory in use. |
| Hosts | Number of hosts. |
| Databases | Number of databases. |
| Version | Redis version. |
| Last Seen | When Radar last collected from it. |

Sort by Version to find upgrade candidates, or by Last Seen to find clusters Radar has lost contact with.

Select any cluster to open its detail view, which carries that cluster's nodes, databases, and configuration.

## Databases

The **Databases** list crosses cluster boundaries, so you can find a database without knowing which cluster it lives on:

| Column | Shows |
|---|---|
| Name | Database name. |
| Cluster / Resource | Where it lives. |
| Type | Deployment type. |
| Status | Current health. |
| HA Status | High-availability state, including Active-Active replication health. |
| Version | Redis version. |
| Memory | Memory in use. |
| Last Seen | When Radar last collected from it. |

Select a database to open its detail view.

### Active-Active databases

Radar identifies Active-Active databases and reports their replication health as the cluster reports it, so a replication problem between regions shows up in the same list as everything else. Radar passes through the health values the cluster supplies rather than reinterpreting them.

## Usage

The **Usage** view is about consumption against what you are entitled to, rather than health:

| Column | Shows |
|---|---|
| Cluster | The cluster. |
| Memory (Used / Provisioned) | Memory consumed against memory provisioned. |
| Ops/Sec | Throughput. |
| Shards (Used / Limit) | Shards in use against the licensed shard limit. |

Each cluster also has a usage report for looking at one cluster in detail.

Remember that usage refreshes hourly by default, so a number here can be up to an hour behind the health figures on the Overview.

Memory and Ops/Sec are the two columns that can read N/A. See [When a value reads N/A](#when-a-value-reads-na).

## Alerts

The **Alerts** view collects the alerts your clusters are already raising and puts them in one list, ordered by severity: critical, warning, then informational. Filter by severity to narrow the list.

Radar reads alerts from each cluster's own alert endpoints, at the cluster, node, and database level. **The alert rules live on the cluster, not in Radar.** To change what raises an alert, change it on the cluster; Radar reflects the change at its next collection.

Selecting an alert takes you to the cluster it came from.

## Next steps

- [Licenses and certificates]({{< relref "/operate/radar/licenses-and-certificates" >}})
- [Connect clusters]({{< relref "/operate/radar/connect" >}})

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

Radar has five views, each answering a different question:

| View | Answers |
|---|---|
| [Overview](#overview) | Is anything wrong anywhere? |
| [Clusters](#clusters) | What does a specific cluster look like? |
| [Databases](#databases) | Where is a specific database? |
| [Usage](#usage) | How much are you consuming against your limits? |
| [Alerts](#alerts) | What is your fleet complaining about? |

All the views are read-only. You cannot start, stop, resize, or reconfigure anything from them: you read what your clusters report via Radar, but you must access the cluster itself to take action.

## How current the data is

Radar shows the result of the last successful collection, not live state. This applies to every number on every screen.

The Clusters, Databases, and Alerts lists carry a **Last Seen** column, so the age of what you are reading is on screen next to the value.

Different data refreshes at different rates, which is why Usage can look staler than health. Radar aims to collect the Usage report about once an hour, and everything else every 5 to 15 minutes. Collection runs through a queue, so these are targets rather than guarantees, and some cluster versions collect faster.

If a cluster's Last Seen value stops advancing, collection has stopped succeeding. Do not read it as a healthy cluster. The cause can be anywhere between Radar and the cluster, including the cluster being down. Radar keeps showing the last good data it has, so check the cluster itself.

On a Redis Cloud database's detail view, **Force refresh** collects that database again instead of waiting for the next scheduled collection. Use it after changing something on the cluster, to confirm Radar has caught up.

## When a value reads N/A

**N/A** means Radar has no value for that metric, not that the value is zero. Radar also hides the utilization meter, because a `0` would read as an idle fleet.

This affects memory and ops/sec. Older Redis Software versions do not expose the per-database statistics behind those figures, so a fleet of Redis Software 7.2 or 7.4 clusters can show N/A where a newer fleet shows a number.

Shard counts always show a number, because zero shards is a real answer rather than a missing one.

## Overview

The **Overview** answers one question for a fleet too large to check by hand: is anything wrong anywhere?

- **Fleet health.** Cluster and database health side by side, so a problem that affects one database in one cluster is still visible at the top level.
- **Redis deployments and version distribution.** What you are running and how many versions you are spread across. Version sprawl is usually invisible until you look at a fleet-wide count.
- **Hosts.** Host inventory behind the fleet, so you can see what's backing your clusters without opening each one.
- **Licenses and certificates.** Anything expiring, summarized. See [Licenses and certificates]({{< relref "/operate/radar/licenses-and-certificates" >}}).
- **Alerts.** The most severe alerts currently raised. See [Alerts](#alerts).
- **Running actions.** Operations in progress on your clusters, so you know before you start something that might conflict.

{{<image filename="images/radar/overview.png" alt="The Radar Overview page, showing fleet status, inventory, database health, and alerts">}}

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

Sort by Name or Memory; the other columns are display-only.

{{<image filename="images/radar/clusters.png" alt="The Radar Clusters page, listing clusters with their type, status, memory, and database counts">}}

Select any cluster to open its detail view, which carries that cluster's nodes, databases, and configuration.

For Redis Software clusters, select a row's **More options** menu and choose **Open cluster UI** to jump straight to that cluster's own management console in a new tab.

{{<image filename="images/radar/cluster-detail-enterprise.png" alt="A cluster detail view for a Redis Software cluster, showing its overview, nodes, databases, and alerts">}}

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

{{<image filename="images/radar/databases.png" alt="The Radar Databases page, listing databases across clusters with their type, status, and version">}}

Select a database to open its detail view.

{{<image filename="images/radar/database-detail-enterprise.png" alt="A database detail view for a Redis Software database">}}

### Active-Active databases

Radar identifies Active-Active databases and reports their replication health as the cluster reports it, so a replication problem between regions shows up in the same list as everything else. Radar passes through the health values the cluster supplies rather than reinterpreting them.

## Usage

The **Usage** view is about consumption against what you are entitled to, rather than health. It covers Redis Software clusters only; databases from other Redis deployments do not appear here.

| Column | Shows |
|---|---|
| Cluster | The cluster. |
| Memory (Used / Provisioned) | Memory consumed against memory provisioned. |
| Ops/Sec | Throughput. |
| Shards (Used / Limit) | Shards in use against the licensed shard limit. |

Each cluster also has a usage report for looking at one cluster in detail.

Usage is collected about once an hour, so a number here can be up to an hour behind the health figures on the Overview.

Memory and Ops/Sec are the two columns that can read N/A. See [When a value reads N/A](#when-a-value-reads-na).

## Alerts

The **Alerts** view collects the alerts your clusters are already raising and puts them in one list, ordered by severity: critical, warning, then informational. It covers Redis Software clusters and nodes only; alerts from other Redis deployments do not appear here. Filter by severity to narrow the list.

Radar reads alerts from each cluster's own alert endpoints, at the cluster and node level. **The alert rules live on the cluster, not in Radar.** To change what raises an alert, change it on the cluster; Radar reflects the change at its next collection.

Selecting an alert takes you to the cluster it came from.

{{<image filename="images/radar/alerts.png" alt="The Radar Alerts page, listing alerts by severity, category, and affected resource">}}

## Download a support package

Download a diagnostics package from a Redis Software cluster to attach to a Redis Support ticket. Only administrators can do this. See [Manage access]({{< relref "/operate/radar/manage-access" >}}).

Download it from the cluster's detail view, or from the **Support** page if you'd rather pick the cluster from a list.

The download runs in your browser, so it takes as long as the cluster needs to prepare the package — several minutes for a large cluster. It keeps going while you navigate elsewhere in Radar, but closing or reloading the tab cancels it.

## Next steps

- [Licenses and certificates]({{< relref "/operate/radar/licenses-and-certificates" >}})
- [Connect clusters]({{< relref "/operate/radar/connect" >}})

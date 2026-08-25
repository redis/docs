---
title: Redis Radar
alwaysopen: false
categories:
- docs
- operate
- radar
description: Monitor the status of every Redis cluster you run from one place.
linkTitle: Redis Radar
hideListLinks: true
weight: 55
---

Redis Radar shows you the status of every Redis cluster you run, in one place.

Teams that run dozens or hundreds of clusters usually track them in a spreadsheet that goes out of date the moment someone adds a cluster. Radar replaces that spreadsheet: it connects to each cluster, collects its state, and presents one fleet-wide view across Redis Software, Redis Cloud, Redis Open Source, Amazon ElastiCache, and Google Memorystore.

Radar is a visibility tool. It reports what your clusters are doing, and adding a cluster to Radar does not change how that cluster runs.

## Who Radar is for

Radar is for the people responsible for a fleet rather than a single database:

- Platform engineers who run Redis for other teams.
- Operators accountable for fleet health.
- Teams running a mix of self-managed and cloud Redis.

If you operate one cluster, you do not need Radar. The value starts when you have more clusters than you can track by hand.

## What Radar shows you

- **Fleet inventory.** Every cluster Radar knows about, with its deployment type, version, and when Radar last reached it.
- **Health and status.** Which clusters are reachable, which are degraded, and which need attention.
- **Capacity and usage.** Memory and resource consumption across the fleet, so you can see pressure before it becomes an incident.
- **Cluster detail.** Drill into one cluster for its databases, nodes, and configuration.

## How Radar collects data

Radar reads each cluster's own management interface using credentials you supply, normalizes what it finds, and stores it. A **connector** handles each source type, which is how one fleet view spans products with very different APIs.

Two consequences:

- **Radar needs credentials for every cluster you want to see.** Getting that access in place is most of the setup work. See [Connect clusters]({{< relref "/operate/radar/connect" >}}).
- **For self-managed clusters, Radar shows the last successful state collection rather than live state.** Radar collects the state of Redis Software and Redis Open Source clusters on an interval, so a value is only as fresh as the last time Radar reached that cluster. Radar shows that age alongside the data.

## Next steps

Start with [Install Radar]({{< relref "/operate/radar/install" >}}) to deploy Radar on your own infrastructure, then [Connect clusters]({{< relref "/operate/radar/connect" >}}) to add your first cluster. Once clusters are connected, see [Monitor clusters and databases]({{< relref "/operate/radar/monitor" >}}) for what Radar shows you.


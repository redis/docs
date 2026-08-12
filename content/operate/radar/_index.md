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

Teams that run dozens or hundreds of clusters usually track them in a spreadsheet. Nobody trusts the spreadsheet, and it is out of date the moment someone adds a cluster. Radar replaces it. Radar connects to each cluster, collects its state on a schedule, and presents one fleet-wide view across Redis Software, Redis Cloud, and Redis Open Source.

Radar is a visibility tool. It reports what your clusters are doing; you continue to manage each cluster in its own console. Adding a cluster to Radar does not change how you operate it.

## Who Radar is for

Radar is for the people responsible for a fleet rather than a single database:

- Platform engineers who run Redis for other teams.
- Operators accountable for fleet health.
- Teams running a mix of self-managed and cloud Redis.

If you operate one cluster, you do not need Radar. The value starts when you have more clusters than you can hold in your head.

## What Radar shows you

- **Fleet inventory.** Every cluster Radar knows about, with its deployment type, version, and when Radar last reached it.
- **Health and status.** Which clusters are reachable, which are degraded, and which need attention.
- **Capacity and usage.** Memory and resource consumption across the fleet, so you can see pressure before it becomes an incident.
- **Cluster detail.** Drill into one cluster for its databases, nodes, and configuration.

## How Radar collects data

Radar pulls; your clusters do not push. On a schedule, Radar reads each cluster's own management API using credentials you supply, normalizes what it finds, and stores it. A **connector** handles each source type, which is how one fleet view spans products whose APIs have nothing in common.

Two consequences worth knowing:

- **Radar shows the last successful collection, not live state.** A value is as fresh as the last time Radar reached that cluster, which Radar displays alongside the data.
- **Radar needs credentials for every cluster you want to see.** Getting that access in place is most of the setup work.

## Redis Radar and MCM

Both names refer to the same product. **Redis Radar** is the product name. **MCM**, short for Multi Cluster Manager, is the internal name, and it persists in the parts of the product that are hard to rename: the `mcm` package, the `mcm-api` and `mcm-worker` services, configuration paths, and log entries.

## Next steps

Start with [Install Radar]({{< relref "/operate/radar/install" >}}) to deploy Radar on your own infrastructure, then Connect clusters to add your first cluster.

<!-- TODO(DOC-6912): restore the relref to /operate/radar/connect here and in the "How Radar collects data" section once connect.md exists. Removed only because relref fails the build on missing targets. -->


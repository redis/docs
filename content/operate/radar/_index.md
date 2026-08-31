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
weight: 47
---

Redis Radar shows the status of every Redis cluster in your fleet, in one place. Instead of checking the status of your clusters individually, get a complete view of them all with Redis Radar.

Radar connects to each cluster, collects its state, and presents one fleet-wide view across Redis Software, Redis Cloud, Redis Open Source, Amazon ElastiCache, and Google Memorystore. 

Radar is primarily a visibility tool. Connecting a cluster to Radar does not change how that cluster runs on its own; the exception is a small set of actions you can trigger explicitly from Radar, such as updating a Redis Software cluster's license.

## How you run Radar

Radar itself runs two ways:

- **[Redis Cloud]({{< relref "/operate/rc/radar" >}}).** Sign in with your existing Redis Cloud credentials. Redis Cloud hosts and manages the Radar deployment for you.
- **[Self-managed]({{< relref "/operate/radar/install" >}}).** Install Radar on your own infrastructure with a Helm chart, an RPM, or Docker Compose.

## What Radar shows you

- **Fleet inventory.** Every cluster Radar knows about, with its deployment type, version, and when Radar last reached it.
- **Health and status.** Which clusters are reachable, which are degraded, and which need attention.
- **Capacity and usage.** Memory and resource consumption across the fleet, so you can see pressure before it becomes an incident.
- **Cluster detail.** Drill into one cluster for its databases, nodes, and configuration.

## How Radar collects data

Radar reads each cluster's own management interface using credentials you supply, normalizes what it finds, and stores it. A **connector** handles each source type, which is how one fleet view spans products with very different APIs.

This approach has two significant consequences:

- **Radar needs credentials for every cluster you want to see.** Getting that access in place is most of the setup work. See [Connect clusters]({{< relref "/operate/radar/connect" >}}).
- **For self-managed clusters, Radar shows the last successful state collection rather than live state.** Radar collects the state of Redis Software and Redis Open Source clusters on an interval, so a value is only as fresh as the last time Radar reached that cluster. Radar shows that age alongside the data.

## Next steps

Sign in on [Redis Cloud]({{< relref "/operate/rc/radar" >}}), or [install Radar]({{< relref "/operate/radar/install" >}}) yourself.


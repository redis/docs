---
Title: Move from Redis Open Source to Redis Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Plan a move from a self-managed Redis Open Source deployment to Redis Software, including how configuration works differently and how to migrate your data.
linkTitle: Move from Redis Open Source
weight: 33
---

Redis Software builds on Redis Open Source, so your data, commands, and client libraries work the same way. What changes is how you deploy and configure Redis: instead of running a single server from a `redis.conf` file, you run a cluster of nodes that hosts managed databases.

This guide explains those differences and walks through planning a move from a self-managed Redis Open Source deployment to Redis Software.

For the exhaustive list of supported commands, configuration settings, and RESP versions, see [Redis Open Source compatibility]({{< relref "/operate/rs/references/compatibility" >}}).

## How Redis Software differs from Redis Open Source

In Redis Open Source, you run one Redis server process per instance and configure it directly, typically through a `redis.conf` file or [`CONFIG SET`]({{< relref "/commands/config-set" >}}) at runtime.

Redis Software introduces two layers on top of that model:

- A **cluster** of nodes that provides high availability, scaling, and a management layer.
- **Databases** that run on the cluster. Each database is a managed object with its own settings, endpoints, and access controls. A single cluster can host many databases.

Because of this model, you don't edit a configuration file to tune a database. You set cluster-level options during cluster setup and database-level options when you create or update each database.

## Configuration model: from redis.conf to Redis Software

Redis Software splits configuration across two levels:

| Level | What it controls | How you set it |
|:------|:-----------------|:---------------|
| Cluster | Node roles, networking, security, and cluster-wide policies | During [cluster setup]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}), then through the Cluster Manager UI, [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}), or the [REST API]({{< relref "/operate/rs/references/rest-api" >}}) |
| Database | Memory limit, persistence, replication, clustering, eviction, and supported Redis Open Source settings | When you [create a database]({{< relref "/operate/rs/databases/create" >}}), then through the Cluster Manager UI, `rladmin`, or the REST API |

Key differences from a `redis.conf` workflow:

- **No per-database configuration file.** You manage database settings through the Cluster Manager UI, `rladmin`, or the REST API, not a file you edit on disk.
- **Only a subset of Redis Open Source settings applies.** Redis Software supports a subset of Redis Open Source configuration settings. Using [`CONFIG GET`]({{< relref "/commands/config-get" >}}) or [`CONFIG SET`]({{< relref "/commands/config-set" >}}) with an unsupported setting returns an error. See [Compatibility with Redis Open Source configuration settings]({{< relref "/operate/rs/references/compatibility/config-settings" >}}) for the full list.
- **Some settings move to database-level controls.** A few settings that you'd set with `CONFIG SET` in Redis Open Source are instead set per database with `rladmin tune db` or the REST API.

## Plan your migration

Use this checklist to plan a move from Redis Open Source to Redis Software:

1. **Inventory your current configuration.** List the `redis.conf` settings and runtime `CONFIG` values your deployment relies on.
2. **Check compatibility.** Confirm that the [commands]({{< relref "/operate/rs/references/compatibility/commands" >}}), [configuration settings]({{< relref "/operate/rs/references/compatibility/config-settings" >}}), and [RESP version]({{< relref "/operate/rs/references/compatibility/resp" >}}) your application uses are supported.
3. **Choose a database topology.** Decide whether each database is a standard database or an [Active-Active database]({{< relref "/operate/rs/databases/active-active" >}}) for geo-distributed writes.
4. **Size your deployment.** Review [hardware requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}) and [supported platforms]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/supported-platforms" >}}) for the cluster.
5. **Plan your data migration.** Decide whether to sync from a running source with Replica Of or import from a file. See [Migrate your data](#migrate-your-data).

## Installation and configuration flow

Moving to Redis Software follows this sequence. Reviewing it before you install helps you plan the whole flow, not just the software install.

1. [Plan your deployment]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment" >}}) — choose platforms, size hardware, and plan networking.
2. [Prepare to install]({{< relref "/operate/rs/installing-upgrading/install/prepare-install" >}}) — meet OS and system requirements on each node.
3. [Install Redis Software]({{< relref "/operate/rs/installing-upgrading/install" >}}) on each node.
4. [Set up the cluster]({{< relref "/operate/rs/clusters/new-cluster-setup" >}}) — create a new cluster on the first node and join the remaining nodes.
5. [Create a database]({{< relref "/operate/rs/databases/create" >}}) and configure its settings.
6. Connect your clients to the new database endpoint.

If you plan to deploy on Kubernetes, the flow maps to the same concepts through [Redis Software for Kubernetes]({{< relref "/operate/kubernetes" >}}): you declare the cluster and databases as custom resources, and the operator provisions them. Planning the configuration model up front matters most for Kubernetes deployments, where you define these objects declaratively rather than through the Cluster Manager UI.

## Migrate your data

Redis Software offers two ways to move your existing data into a new database:

- **Sync from a running source with Replica Of.** [Replica Of]({{< relref "/operate/rs/databases/import-export/replica-of" >}}) (also called Active-Passive) synchronizes a Redis Software database with one or more source databases, including a Redis Open Source database that's external to the cluster. Point the replica at your source's `redis://` endpoint, wait for the initial sync to finish, then cut your applications over to the new database. Use this path to migrate a running deployment with minimal downtime.
- **Import from a file.** If you have an RDB or backup file, [import it]({{< relref "/operate/rs/databases/import-export/import-data" >}}) into the new database.

{{< warning >}}
Importing data erases all existing content in the target database. Replica Of also overwrites the destination database during synchronization, so use an empty destination.
{{< /warning >}}

## Next steps

- [Redis Open Source compatibility]({{< relref "/operate/rs/references/compatibility" >}}) — the full compatibility reference.
- [Create a database]({{< relref "/operate/rs/databases/create" >}}) — create and configure your first database.
- [Redis Software quickstart]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}) — try Redis Software before you plan a full deployment.

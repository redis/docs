---
Title: Manage databases
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
linktitle: Databases
weight: 20
---

Databases are the heart of any Redis Cloud deployment.

Here's how to perform a variety of tasks:

## Common database tasks

- [Create a database]({{< relref "/operate/rc/databases/create-database" >}})

    - [Create an Essentials database]({{< relref "/operate/rc/databases/create-database/create-essentials-database" >}})
    - [Create a Pro database with a new subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}})
    - [Create a Pro database in an existing subscription]({{< relref "/operate/rc/databases/create-database/create-pro-database-existing" >}})
    - [Create an Active-Active database]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}})

- [View and edit databases]({{< relref "/operate/rc/databases/view-edit-database" >}})

- [Delete database]({{< relref "/operate/rc/databases/delete-database" >}})

If you're new to Redis Cloud, see the [Quick Start]({{< relref "/operate/rc/rc-quickstart" >}}).

## Additional tasks

- [Monitor database performance]({{< relref "/operate/rc/databases/monitor-performance" >}})

- [Import data into databases]({{< relref "/operate/rc/databases/import-data" >}})

- [Back up databases]({{< relref "/operate/rc/databases/back-up-data" >}})

- [Secure database access]({{< relref "/operate/rc/security/network-data-security/" >}})

- [Flush database data]({{< relref "/operate/rc/databases/flush-data" >}})

## Configuration details

These topics provide background details that can help you tailor your databases to better fit your needs.

- [Clustering Redis databases]({{< relref "/operate/rc/databases/configuration/clustering" >}}): Redis Cloud uses clustering to manage very large databases (25 GB and larger). Learn how to manage clustering and how to use hashing policies to manage the process.

- [Data eviction policies]({{< relref "/operate/rc/databases/configuration/data-eviction-policies" >}}): Data eviction policies control what happens when new data exceeds the memory limits of a database. Learn the available policies and how to control them.

- [Data persistence]({{< relref "/operate/rc/databases/configuration/data-persistence" >}}): Data persistence enables recovery in the event of memory loss or other catastrophic failure. Learn which options are available and how to apply specific settings to individual databases.

- [High availability and replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}): Replication allows for automatic failover and greater fault tolerance. It can prevent data loss in the event of a hardware or zone failure.  Learn which options are available for Redis Cloud subscriptions.

- [Advanced Capabilities]({{< relref "/operate/rc/databases/configuration/advanced-capabilities" >}}): Advanced capabilities extend Redis database functionality by adding new data types and options. Learn about the advanced capability options that are available for your database.

## Compatibility

Redis Cloud does not support certain commands. Instead of using these commands, Redis Cloud automatically handles features like replication and lets you [manage your database]({{< relref "/operate/rc/databases" >}}) from the [Redis Cloud console](https://cloud.redis.io/) or [Redis Cloud REST API]({{< relref "/operate/rc/api" >}}).

For more details, see:

- [Redis Cloud compatibility]({{< relref "/operate/rc/compatibility" >}})

- [Command compatibility]({{< relref "/operate/rs/references/compatibility/commands" >}})

- [Configuration compatibility]({{< relref "/operate/rs/references/compatibility/config-settings" >}})

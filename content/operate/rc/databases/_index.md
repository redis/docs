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

- [Create a database](/content/operate/rc/databases/create-database/_index.md)

    - [Create an Essentials database](/content/operate/rc/databases/create-database/create-essentials-database.md)
    - [Create a Pro database with a new subscription](/content/operate/rc/databases/create-database/create-pro-database-new.md)
    - [Create a Pro database in an existing subscription](/content/operate/rc/databases/create-database/create-pro-database-existing.md)
    - [Create an Active-Active database](/content/operate/rc/databases/active-active/create-active-active-database.md)

- [View and edit databases](/content/operate/rc/databases/view-edit-database.md)

- [Delete database](/content/operate/rc/databases/delete-database.md)

If you're new to Redis Cloud, see the [Quick Start](/content/operate/rc/rc-quickstart.md).

## Additional tasks

- [Monitor database performance](/content/operate/rc/databases/monitor-performance.md) 

- [Import data into databases](/content/operate/rc/databases/import-data.md) 

- [Back up databases](/content/operate/rc/databases/back-up-data.md)

- [Secure database access](/content/operate/rc/security/database-security/_index.md)

## Configuration details

These topics provide background details that can help you tailor your databases to better fit your needs.

- [Clustering Redis databases](/content/operate/rc/databases/configuration/clustering.md): Redis Cloud uses clustering to manage very large databases (25 GB and larger). Learn how to manage clustering and how to use hashing policies to manage the process.

- [Data eviction policies](/content/operate/rc/databases/configuration/data-eviction-policies.md): Data eviction policies control what happens when new data exceeds the memory limits of a database. Learn the available policies and how to control them.

- [Data persistence](/content/operate/rc/databases/configuration/data-persistence.md): Data persistence enables recovery in the event of memory loss or other catastrophic failure. Learn which options are available and how to apply specific settings to individual databases.

- [High availability and replication](/content/operate/rc/databases/configuration/high-availability.md): Replication allows for automatic failover and greater fault tolerance. It can prevent data loss in the event of a hardware or zone failure.  Learn which options are available for Redis Cloud subscriptions.

- [Advanced Capabilities](/content/operate/rc/databases/configuration/advanced-capabilities.md): Advanced capabilities extend Redis database functionality by adding new data types and options. Learn about the advanced capability options that are available for your database.

## Compatibility

Redis Cloud does not support certain commands. Instead of using these commands, Redis Cloud automatically handles features like replication and lets you [manage your database](/content/operate/rc/databases/_index.md) from the [Redis Cloud console](https://cloud.redis.io/) or [Redis Cloud REST API](/content/operate/rc/api/_index.md).

For more details, see:

- [Redis Cloud compatibility](/content/operate/rc/compatibility.md)

- [Command compatibility](/content/operate/rs/references/compatibility/commands/_index.md)

- [Configuration compatibility](/content/operate/rs/references/compatibility/config-settings.md)

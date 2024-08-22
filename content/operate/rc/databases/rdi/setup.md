---
Title: Prepare source database
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
weight: 1
---

## Create new data pipeline

1. Log in to Redis Cloud.
1. (Create a new database){{<relref "/operate/rc/databases/create-database/create-pro-database-existing/">}}.
1. Once your database is created and running, navigate to the **Data pipeline** tab.
1. Select **Create data pipeline**.
1. Select your database type (currently, only **TBD** is supported).
1. If you know the size of your source database, enter it into the **Source dataset size** field.

## Prepare source database

Before using the pipeline you must first prepare your source database to use
the Debezium connector for change data capture (CDC).

See [Prepare source databases]({{<relref "/integrate/redis-data-integration/ingest/data-pipelines/prepare-dbs/">}}) to find steps for your database type.

See the [RDI architecture overview]({{< relref "/integrate/redis-data-integration/ingest/architecture#overview" >}}) for more information about CDC.

## Set up AWS secret

## Connect to Private Link


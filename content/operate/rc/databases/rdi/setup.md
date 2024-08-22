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

## Source database credentials

## Setup connectivity

To expose your source database to Redis, you need to [edit your AWS PrivateLink VPC permissions](https://docs.aws.amazon.com/vpc/latest/privatelink/configure-endpoint-service.html#add-remove-permissions).

1. Open your [Amazon VPC console]() and navigate to **Endpoint services**.
1. Copy the Amazon Resource Name (ARN) provided in **Setup connectivity** box.
1. Navigate to **Allow principals** tab.
1. Add the Redis Cloud ARN and choose **Allow principals**.

For more details on AWS PrivateLink, see [Share your services through AWS PrivateLink](https://docs.aws.amazon.com/vpc/latest/privatelink/privatelink-share-your-services.html).

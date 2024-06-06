---
Title: Quickstart
linkTitle: Quickstart
description: Get started with a simple ingest pipeline example
weight: 1
alwaysopen: false
categories: ["redis-di"]
aliases:
---

In this tutorial you will learn how to install RDI and set up a pipeline to ingest live data from a [PostgreSQL](https://www.postgresql.org/) database into a Redis database.

## Prerequisites

- A Redis Enterprise database that will serve as the pipeline target. The dataset we will ingest is quite small in size, so a single shard database should be enough.
- [Redis Insight]({{< relref "/develop/connect/insight/" >}})
  to edit your pipeline
- A virtual machine (VM) with one of the following operating systems:  
  - Ubuntu 20.04 or 22.04
  - RHEL 8 or 9

## Overview

The following diagram shows the structure of the pipeline we will create (see
the [architecture overview]({{< relref "/integrate/redis-data-integration/ingest/architecture#overview" >}}) to learn how the pipeline works):

{{< image filename="images/rdi/ingest/ingest-qsg.png" >}}

Here, the RDI *collector* tracks changes in PostgreSQL and writes them to streams in the 
RDI database in Redis. The *stream processor* then reads data records from the RDI
database streams, processes them, and writes them to the target.

### Install PostgreSQL

We provide a [Docker](https://www.docker.com/) image for an example PostgreSQL
database that we will use for the tutorial. Follow the
[instructions on our Github page](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres/tree/main)
to download the image and start serving the database. The database, which is
called `chinook`, has the [schema and data](https://www.kaggle.com/datasets/samaxtech/chinook-music-store-data?select=schema_diagram.png) for an imaginary online music store
and is already set up for the RDI collector to use.

### Install RDI

Install RDI using the instructions in the
[installation guide]({{< relref "/integrate/redis-data-integration/ingest/installation" >}})

RDI will create the pipeline template for your chosen source database type at
`/opt/rdi/config`. You will need this pathname later when you prepare the pipeline for deployment
(see [Prepare the pipeline](#prepare-the-pipeline) below).

At the end of the installation, RDI CLI will prompt you to set the access secrets
for both the source PostgreSQL database and the Redis RDI database. RDI needs these to
run the pipeline. If you provide admin credentials for your Redis Enterprise cluster here then RDI CLI will
create the RDI database for you automatically. Otherwise, you should create this
database yourself with the Redis Enterprise management console. A single-shard
database with 125MB of RAM will work fine for this tutorial but you can also add a
replica if you want (this will double the RAM requirements to 250MB).

### Prepare the pipeline

During the installation, RDI placed the pipeline templates at `/opt/rdi/config`.
If you go to that folder and run the `ll` command, you will see the pipeline
configuration file, `config.yaml`, and the `jobs` folder (see the page about
[Pipelines]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/data-pipelines" >}}) for more information). Use Redis Insight to open
the `config.yaml` file and then edit the following settings:

- Set the `host` to `localhost` and the `port` to 5432.
- Under `tables`, specify the `Track` table from the source database.
- Add the details of your target database to the `target` section.

At this point, the pipeline is ready to deploy.

### Deploy the pipeline

You can use Redis Insight to deploy the pipeline by adding a connection to the RDI API
endpoint (which has the same IP address as your RDI VM and uses port 8083) and then clicking the **Deploy** button. You can also deploy it with the following command:

```bash
redis-di deploy --dir <path to pipeline folder>
```

where the path is the one you supplied earlier during the installation. RDI first
validates your pipeline and then deploys it if the configuration is correct.

Once the pipeline is running, you can use Redis Insight to view the data flow using the
pipeline metrics. You can also connect to your target database to see the keys that RDI has written there.

### View RDI's reponse to data changes

Once the pipeline has loaded a *snapshot* of all the existing data from the source,
it enters *change data capture (CDC)* mode (see the
[architecture overview]({{< relref "/integrate/redis-data-integration/ingest/architecture#overview" >}})
and the
[ingest pipeline lifecycle]({{< relref "/integrate/redis-data-integration/ingest/data-pipelines/data-pipelines#ingest-pipeline-lifecycle" >}})
for more information
).

To see the RDI pipeline working in CDC mode:
 
- Create a simulated load on the source database
  (see [Generating load on the database](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres?tab=readme-ov-file#generating-load-on-the-database)
  to learn how to do this).
- Run
  [`redis-di status --live`]({{< relref "/integrate/redis-data-integration/ingest/reference/cli/redis-di-status" >}})
  to see the flow of records.
- User [Redis Insight]({{< relref "/develop/connect/insight" >}}) to look at the data in the target database.

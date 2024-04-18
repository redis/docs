---
Title: Ingest quickstart
linkTitle: Ingest
description: Get started creating an ingest pipeline
weight: 30
alwaysopen: false
categories: ["redis-di"]
aliases:
---
In this guide you will learn how to install RDI and set up a pipeline to ingest live data from PostgreSQL database into a Redis database.

## Prerequisites

- Redis Enterprise database that will serve as the pipeline target. The dataset we will ingest is only [need number] mb in size. So a single shard database should suffice.
- Redis Insight [link] - to help you editing your pipeline
- VM with one of the following operating systems:  
  - Ubuntu 20.04 or 22.04
  - RHEL 8 or 9

## Pipeline topology

{{< image filename="images/rdi/ingest/ingest-qsg.png" >}}

The pipeline you will create with this guide will look like this:

- RDI CLI will be used to install RDI and create the pipeline. 
- RDI Collector tracks changes in PostgreSQL and writes them to streams in RDI database.
- RDI Stream Processor reads the data records from RDI database streams, process them and writes them to the target.

### Install PostgreSQL

- Follow the [instructions](https://github.com/Redislabs-Solution-Architects/rdi-quickstart-postgres/tree/main) to get a PostgreSQL container running
- Note that this PostgreSQL is already set for RDI CDC collector
- The PostgreSQL database to use is named `chinook` - it has the [schema and data](https://www.kaggle.com/datasets/samaxtech/chinook-music-store-data?select=schema_diagram.png) of an online music store.

### Install RDI

- Open a shell terminal
- Set the RDI version `export RDI_VERSION=<RDI version>`
- Download RDI CLI:

#### Ubuntu 20.04

``` bash
sudo curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/bin/ubuntu-20.04/redis-di -o /usr/local/bin/redis-di
```

#### Ubuntu 18.04

``` bash
sudo curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/bin/ubuntu-18.04/redis-di -o /usr/local/bin/redis-di
```

#### RHEL 8

``` bash
sudo curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/bin/rhel-8.9/redis-di -o /usr/local/bin/redis-di
```

#### RHEL 7

``` bash
sudo curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/bin/rhel-7.9/redis-di -o /usr/local/bin/redis-di
```

> Note: Non-root users should download to a directory with write permission and run redis-di directly from it.


- Download and untar the RDI installation. It will create a subfolder rdi/<version number>
  
``` bash 
curl https://qa-onprem.s3.amazonaws.com/redis-di/$RDI_VERSION/rdi-installation-$RDI_VERSION.tar.gz -O
tar -xvf rdi-installation-$RDI_VERSION.tar.gz
```

- Install RDI

``` bash
sudo chmod +x /usr/local/bin/redis-di
cd rdi_install/$RDI_VERSION
sudo redis-di install
```

- If you provide the Redis Enterprise admin credentials RDI CLI will create the RDI database for you. 
- Alternatively, please go to Redis Enterprise Management Console and create the RDI database (Single shard with 125 mb, or with replica 250mb)
- By the end of the installation process RDI CLI will instruct you to set secrets for the source (postgreSQL database) and Redis target database. Please set these secrets so RDI can use them for running the pipeline.

### Prepare Pipeline

- During the installation RDI asked you where to place the pipeline templates
- Go to that directory and run the `ll` command.
- You can see the RDI pipeline configuration file: config.yaml and the jobs folder.
- Edit `config.yaml` using Redis Insight:
- Fill the host (loclhost) and port (5432) for postgreSQL source
- Under tables specify the `Track` table
- In the target section put your target database details 
- That’s it you are ready to deploy your pipeline

### Deploying you pipeline

You can deploy your pipeline from Redis Insight by adding a connection to the RDI API endpoint (the IP of your machine:8083) and then clicking the deploy button.
Alternatively just run `redis-di deploy` pointing to your config.yaml location
RDI will validate your pipeline and deploy it.

If you are using Redis Insight you can now look at the metrics of your pipeline to see the data flow. Then you can connect to your target database to see the keys that RDI wrote to your Redis database.

### Testing RDI handling of data changes

In order to see RDI pipeline working in cdc mode, open `pgadmin` and run the following lines
[snippet connecting to chinook]
[SQL of insert into Track table]



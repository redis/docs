---
Title: Redis Data Integration ingest architecture
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: null
group: di
headerRange: '[2]'
linkTitle: Architecture
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

## Overview

RDI runs the data pipeline processing outside of the Redis Enterprise cluster, using a Redis database for data streams and storing configuration and state.

## Concepts & terms

- Source database - The disk based database from where RDI will get the data to stream to Redis.
- Target database - The Redis database to which RDI will write data.
- Dataset - The definition of the data which will be synced between the source and Redis. It is typically defined in terms of database schema and database tables. It can go into advanced filtering based on columns and filters.
- Initial cache loading - A phase where all the existing data in the source database or a user defined subset is being captured and sent to the cache as a baseline. This process takes minutes to hours depending on the size of the data.
- Change streaming - A phase that starts automatically after the initial cache loading finish. In this stage the CDC collector will stream into RDI all the changes occurring on top of the baseline and RDI will apply them to the cache.
- CDC collector - A CDC (Change Data Capture) is a type of software that can track changes to a database and replicate the changes to another database or stream. RDI uses Debezium,  an open source platform for change data capture. The Collector gathers baseline data snapshot and changes on this baseline and writes them into RDI data streams in RDI Redis database.
- Stream Processor(s) - The Stream Processor reads from RDI data streams, run pipeline defaults and user defined jobs and apply results to the target database.
- Pipeline - The combination of Collector configuration and Stream Processor configuration that allows RDI to run data extraction, streaming, transformation and writing to target.
Data Transformation Jobs - an optional set of YAML files defining data transformations and filtering per source’s table.

There are 2 topologies for RDI runtime:

- RDI runs on user-provided VMs (2 VMs for high availability)
- RDI runs on the user-provided Kubernetes cluster.

### RDI Ingest data flow

- RDI Collector connects to the source database and creates a snapshot of the data set. It starts writing the record to streams on the RDI database.
- RDI Stream Processors read the records from the stream, transform the data as defined in the pipeline and write the data to the target Redis database.
- The RDI Collector starts tracking changes on the source database dataset. Whenever changes occur, the Collector writes them to the streams.
- RDI Stream Processors read the streams, process the records while keeping the order per stream (corresponding to a source table records) and write them to the target Redis database.

{{< image filename="images/rdi/ingest/ingest-dataflow.png" >}}

### Supported Sources

RDI supports the following database sources using [Debezium Server](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) connectors:

| Database                    | Versions               |Comments|
| --------------------------- | ---------------------- |--------|
| Oracle                      | 12c, 19c, 21c          ||
| MariaDB                     | >= 10.5                ||
| MongoDB                     | 4.2, 4.4, 5.0, 6.0     | Driver: 4.7  |
| MySQL                       | 5.7, 8.0.x             ||
| Percona XtraDB              | 5.7, 8.0.x             ||
| Postgres                    | 10, 11, 12, 13, 14, 15 ||
| SQL Server                  | 2017, 2019             ||
| Cassandra                   | >= 3.0                 ||
| Datastax Cassandra          | >= 6.8.0               ||
| Google Cloud SQL MySQL      | 8.0                    ||
| Google Cloud SQL Postgres   | 15                     ||
| Google Cloud SQL SQL Server | 2019                   ||
| Google Cloud AlloyDB for PostgreSQL | ||

### RDI Management & Control Plane

There are three main categories of scenarios in which users interact with RDI:

1. Installing & administrating RDI
2. Pipeline preparation
3. Deploying & managing pipeline lifecycle

Users performs this interactions via two tools:

- RDI installation, administration and pipeline management are done via RDI CLI.
- Pipeline preparation is done via Redis Insight dedicated RDI editor.

RDI control plane is composed of additional components:

- Rest API with which is used by both CLI and Redis Insight.
- The RDI Operator that is in charge of managing pipeline lifecycle, orchestrating the Collector and the Stream Processors
- RDI metrics exporter providing a prometheus endpoint for scraping the RDI metrics

{{< image filename="images/rdi/ingest/ingest-control-plane.png" >}}

## RDI Topologies

RDI Runs outside of the Redis Enterprise cluster. There are two ways to deploy RDI:

1. On user provided VMs, where one VM is active and the other one is a stand-by VM for hot failure.
2. Inside the user provided Kubernetes namespace where RDI components run as several Kubernetes deployments.

### RDI on VMs

- With this topology RDI Collector and Stream Processor are only active on one of the two VMs at each moment in time.
- The operators use an algorithm to check which one is the leader and based on that set the local RDI to active or standby
- The RDI pipeline configuration and state are stored in the RDI Redis database.
- Secrets must be available to both VMs.

{{< image filename="images/rdi/ingest/ingest-active-passive-vms.png" >}}

### RDI on Kubernetes

- RDI is installed on a user-provided Kbuenretes cluster. Inside a namespace.
- RDI Operator requires a service account with permissions to create & manipulate pods on the RDI namespace.
- RDI is deployed as K8s deployments for the control plane components (API, Operator and metrics exporter)
- When a user provides a pipeline configuration through the RDI CLI the operator creates and configures the Collector and Stream Processor deployments.
- RDI deployments are stateless. The pipeline configuration, the pipeline state and data are all stored in the RDI Redis database.

### Secrets & security considerations

- All RDI network connections are encrypted using TLS or mTLS.
- Credentials for the different connections are saved as secrets. User can select how these secrets are provided.
- RDI does store any data outside of Redis Enterprise.





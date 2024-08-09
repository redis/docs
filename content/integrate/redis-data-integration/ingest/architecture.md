---
Title: Ingest architecture
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Discover the main components of RDI ingest
group: di
headerRange: '[2]'
linkTitle: Architecture
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 3
---

## Overview

RDI implements a [change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC) pattern that tracks changes to the data in a
non-Redis *source* database and makes corresponding changes to a Redis
*target* database. You can use the target as a cache to improve performance
because it will typically handle read queries much faster than the source.

To use RDI, you define a *dataset* that specifies which data items
you want to capture from the source and how you want to
represent them in the target. For example, if the source is a
relational database then you specify which table columns you want
to capture but you don't need to store them in an equivalent table
structure in the target. This means you can choose whatever target
representation is most suitable for your app. To convert from the
source to the target representation, RDI applies *transformations*
to the data after capture.

RDI synchronizes the dataset between the source and target using
a *data pipeline* that implements several processing steps
in sequence:

1.  A *CDC collector* captures changes to the source database. RDI
    currently uses an open source collector called
    [Debezium](https://debezium.io/) for this step.

1.  The collector records the captured changes using Redis streams
    in the RDI database.

1.  A *stream processor* reads data from the streams and applies
    any transformations that you have defined (if you don't need
    any custom transformations then it uses defaults).
    It then writes the data to the target database for your app to use.

Note that the RDI control processes run on dedicated virtual machines (VMs)
outside the Redis
Enterprise cluster where the target database is kept. However, RDI keeps
its state and configuration data and also the change data streams in a Redis database on the same cluster as the target. The following diagram shows the pipeline steps and the path the data takes on its way from the source to the target:

{{< image filename="images/rdi/ingest/ingest-dataflow.png" >}}

When you first start RDI, the target database is empty and so all
of the data in the source database is essentially "change" data.
RDI collects this data in a phase called *initial cache loading*,
which can take minutes or hours to finish, depending on the size
of the source data. Once the initial cache loading is complete,
there is a *snapshot* dataset in the target that will gradually
change when new data gets captured from the source. At this point,
RDI automatically enters a second phase called *change streaming*, where
changes in the data are captured as they happen. Changes are usually
added to the target within a few seconds after capture.

## Backpressure mechanism

Sometimes, data records can get added to the streams faster than RDI can
process them. This can happen if the target is slowed or disconnected
or simply if the source quickly generates a lot of change data.
If this continues, then the streams will eventually occupy all the
available memory. When RDI detects this situation, it applies a
*backpressure* mechanism to slow or stop the flow of incoming data.
Change data is held at the source until RDI clears the backlog and has
enough free memory to resume streaming.

{{<note>}}The Debezium log sometimes reports that RDI has run out
of memory (usually while creating the initial snapshot). This is not
an error, just an informative message to note that RDI has applied
the backpressure mechanism.
{{</note>}}

### Supported sources

RDI supports the following database sources using [Debezium Server](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) connectors:

| Database                    | Versions               |
| --------------------------- | ---------------------- |
| Oracle                      | 12c, 19c, 21c          |
| MariaDB                     | >= 10.5                |
| MySQL                       | 5.7, 8.0.x             |
| Postgres                    | 10, 11, 12, 13, 14, 15 |
| SQL Server                  | 2017, 2019             |
| Google Cloud SQL MySQL      | 8.0                    |
| Google Cloud SQL Postgres   | 15                     |
| Google Cloud SQL SQL Server | 2019                   |
| Google Cloud AlloyDB for PostgreSQL | |

## How RDI is deployed

RDI is designed with two *planes* that provide its services.
The *control plane* contains the processes that keep RDI active.
It includes:

- An *operator* process that schedules the CDC collector and the
stream processor to implement the two phases of the pipeline
lifecycle (initial cache loading and change streaming)
- A [Prometheus](https://prometheus.io/)
endpoint to supply metrics about RDI
- A REST API to control the VM.

The *management plane* provides tools that let you interact
with the control plane. Use the CLI tool to install and administer RDI
and to deploy and manage a pipeline. Use the pipeline editor
(included in Redis Insight) to design or edit a pipeline. The
diagram below shows the components of the control and management
planes and the connections betweeen them:

{{< image filename="images/rdi/ingest/ingest-control-plane.png" >}}

The following sections describe the VM configurations you can use to
deploy RDI.

### RDI on your own VMs

For this deployment, you must provide two VMs. The
collector and stream processor are active on one VM while the other is a standby to provide high availability. The operators run on both VMs and use an algorithm to decide which is the active one (the "leader").
Both the active VM and the standby
need access to the authentication secrets that RDI uses to encrypt network
traffic. The diagram below shows this configuration:

{{< image filename="images/rdi/ingest/ingest-active-passive-vms.png" >}}

### RDI on Kubernetes

You can run RDI in a namespace on your own Kubernetes cluster with
a separate deployment for each of the control plane
components (REST API, operator, and metrics exporter). The operator
creates and configures deployments for the collector and stream processor
when you start a pipeline from the CLI tool. This means that you must
provide the operator with a service account that has permissions to create and manipulate pods in the namespace. 

### Secrets and security considerations

RDI encrypts all network connections with
[TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) or
[mTLS](https://en.wikipedia.org/wiki/Mutual_authentication#mTLS).
The credentials for the connections are saved as secrets and you
can choose how to provide these secrets to RDI. Note that RDI stores
all state and configuration data inside the Redis Enterprise cluster
and does not store any other data on your RDI VMs or anywhere else
outside the cluster.

---
Title: Data pipelines
aliases:
- /integrate/redis-data-integration/ingest/data-pipelines/
- /integrate/redis-data-integration/data-pipelines/data-pipelines/
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn how to configure RDI for data capture and transformation.
group: di
hideListLinks: false
linkTitle: Data pipelines
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 40
---

RDI uses *pipelines* to implement
[change data capture](https://en.wikipedia.org/wiki/Change_data_capture) (CDC). (See the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for an introduction to pipelines.)
The sections below explain how pipelines work and give an overview of how to configure and
deploy them.

## How a pipeline works

An RDI pipeline captures change data records from the source database, and transforms them
into Redis data structures. It writes each of these new structures to a Redis target
database under its own key. 

By default, RDI transforms the source data into
[hashes]({{< relref "/develop/data-types/hashes" >}}) or
[JSON objects]({{< relref "/develop/data-types/json" >}}) for the target with a
standard data mapping and a standard format for the key.
However, you can also provide your own custom transformation [jobs](#job-files)
for each source table, using your own data mapping and key pattern. You specify these
jobs declaratively with YAML configuration files that require no coding.

Data transformation involves two stages:

1.  The data ingested during CDC is automatically transformed to an intermediate JSON
    change event format.
1.  RDI passes this JSON change event data to your custom transformation for further
    processing.

The diagram below shows the flow of data through the pipeline:

{{< image filename="/images/rdi/ingest/RDIPipeDataflow.webp" >}}

You can provide a job file for each source table that needs a custom
transformation. You can also add a *default job file* for any tables that don't have their own.
You must specify the full name of the source table in the job file (or the special
name "*" in the default job) and you
can also include filtering logic to skip data that matches a particular condition.
As part of the transformation, you can specify any of the following data types
to store the data in Redis:

- [JSON]({{< relref "/develop/data-types/json" >}})
- [Hashes]({{< relref "/develop/data-types/hashes" >}})
- [Sets]({{< relref "/develop/data-types/sets" >}})
- [Streams]({{< relref "/develop/data-types/streams" >}})
- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
- [Strings]({{< relref "/develop/data-types/strings" >}})

### Pipeline lifecycle

After you deploy a pipeline, it goes through the following phases:

1. *Deploy* - when you deploy the pipeline, RDI first validates it before use.
Then, the [operator]({{< relref "/integrate/redis-data-integration/architecture#how-rdi-is-deployed">}}) creates and configures the collector and stream processor that will run the pipeline.
1. *Snapshot* - The collector starts the pipeline by creating a snapshot of the full
dataset. This involves reading all the relevant source data, transforming it and then
writing it into the Redis target. This phase typically takes minutes to
hours if you have a lot of data.
1. *CDC* - Once the snapshot is complete, the collector starts listening for updates to
the source data. Whenever a change is committed to the source, the collector captures
it and adds it to the target through the pipeline. This phase continues indefinitely
unless you change the pipeline configuration. 
1. *Update* - If you update the pipeline configuration, the operator applies it
to the collector and the stream processor. Note that the changes only affect newly-captured
data unless you reset the pipeline completely. Once RDI has accepted the updates, the
pipeline returns to the CDC phase with the new configuration.
1. *Reset* - There are circumstances where you might want to rebuild the dataset
completely. For example, you might want to apply a new transformation to all the source
data or refresh the dataset if RDI is disconnected from the
source for a long time. In situations like these, you can *reset* the pipeline back
to the snapshot phase. When this is complete, the pipeline continues with CDC as usual. 

## Using a pipeline

Follow the steps described in the sections below to prepare and run an RDI pipeline.

### 1. Prepare the source database

Before using the pipeline you must first prepare your source database to use
the Debezium connector for *change data capture (CDC)*. See the
[architecture overview]({{< relref "/integrate/redis-data-integration/architecture#overview" >}})
for more information about CDC.
Each database type has a different set of preparation steps. You can
find the preparation guides for the databases that RDI supports in the
[Prepare source databases]({{< relref "/integrate/redis-data-integration/data-pipelines/prepare-dbs" >}})
section.

###  2. Configure the pipeline

RDI uses a set of [YAML](https://en.wikipedia.org/wiki/YAML)
files to configure each pipeline. The folder structure of the
configuration is shown below:

```hierarchy {type="filesystem"}
"(root)":
    "config.yaml":
        _meta:
            description: "\"config.yaml\" is the main pipeline configuration file."
    "jobs":
        _meta:
            description: "The 'jobs' folder containing optional job files."
        "default-job.yaml":
            _meta:
                description: "A default job."
        "job1.yaml":
          _meta:
                description: "Each job file must have a unique name."
        "...":
            _meta:
                ellipsis: true
                description: "Other job files, if required."
```

The main configuration for the pipeline is in the `config.yaml` file.
This specifies the connection details for the source database (such
as host, username, and password) and also the queries that RDI will use
to extract the required data. You should place job files in the `Jobs`
folder if you want to specify your own data transformations.

See
[Pipeline configuration file]({{< relref "/integrate/redis-data-integration/data-pipelines/pipeline-config" >}})
for a full description of the `config.yaml` file and some example configurations.

### 3. Create job files (optional)

You can use one or more job files to configure which fields from the source tables
you want to use, and which data structure you want to write to the target. You
can also optionally specify a transformation to apply to the data before writing it
to the target. See the
[Job files]({{< relref "/integrate/redis-data-integration/data-pipelines/transform-examples" >}})
section for full details of the file format and examples of common tasks for job files.

### 4. Deploy the pipeline

When your configuration is ready, you must deploy it to start using the pipeline. See
[Deploy a pipeline]({{< relref "/integrate/redis-data-integration/data-pipelines/deploy" >}})
to learn how to do this.

## Pipeline features

RDI pipelines include several built-in features that keep your data accurate and
the system stable, even when components fail or change data arrives faster than
RDI can process it. The sections below describe the most important ones.

### At-least-once delivery guarantee

RDI guarantees *at-least-once delivery* to the target. This means that
a given change will never be lost, but it might be added to the target
more than once. Apart from a slight performance overhead, adding a
change multiple times is harmless because the multiple writes
are [*idempotent*](https://en.wikipedia.org/wiki/Idempotence) (that is
to say that all writes after the first one make no change to the
overall state).

### Checkpointing

RDI uses Redis streams to store the sequence of change events
captured from the source. The events are then retrieved in order
from the streams, processed, and written to the target. The stream
processor uses a *checkpoint* mechanism to keep track of the last
event in the sequence that it has successfully processed and stored. If the processor fails
for any reason, it can restart from the last checkpoint and
re-process any events that might not have been written to the target.
This ensures that all changes are eventually recorded, even in the
face of failures.

### Backpressure mechanism

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

## More information

See the other pages in this section for more information and examples:

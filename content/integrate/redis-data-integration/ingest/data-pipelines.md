---
Title: Data Pipelines
linkTitle: Ingest
description: ingest pipelines
weight: 30
alwaysopen: false
categories: ["redis-di"]
aliases:
---

This section covers RDI pipelines. RDI pipelines are streaming pipelines of data changes.
Ingest pipeline - Streams data changes from one of the supported source databases to Redis 
Write behind pipeline - Stream data changes from Redis database to one of the supported targets


### Pipeline Concepts

#### Pipeline Overview  

A pipeline in RDI is made of the configurations of 4 entities:

- Sources - tracks and ships data changes from the source(s).
- Transformation Job - that describes the data mapping and manipulation for a particular collection of entries (Source Table for Ingest pipeline or Redis key pattern  for a write-behind pipeline)
- Targets - The target(s) to which pipeline processed data is written (Redis in case of Ingest or another supported target in case of write-behind)
- Processors - The configuration of the Stream Processor engine - specifies how many processors will be used during the pipeline full sync phase.
- Jobs - Optional set of files defining data transformations and mapping between source and target.

The Sources, Targets and Processors sections are defined in the main configuration file of the pipeline the `config.yaml` file

#### Pipeline files structure

{{< image filename="images/rdi/ingest/ingest-pipeline-files.png" >}}


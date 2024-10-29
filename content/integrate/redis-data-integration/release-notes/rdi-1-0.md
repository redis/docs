---
Title: Redis Data Integration release notes 1.0 (June 2024)
alwaysopen: false
aliases: /integrate/redis-data-integration/ingest/release-notes/rdi-1-0/
categories:
- docs
- operate
- rs
description: Changes to the processing mode. Simple installation. Silent installation. Pipeline orchestration. Logging. Monitoring. High availability mechanism.
linkTitle: 1.0 (June 2024)
toc: 'true'
weight: 1000
---

This is the first General Availability version of Redis Data Integration (RDI).

RDI’s mission is to help Redis customers sync Redis Enterprise with live data from their slow disk-based databases to:

- Meet the required speed and scale of read queries and provide an excellent and predictable user experience.
- Save resources and time when building pipelines and coding data transformations.
- Reduce the total cost of ownership by saving money on expensive database read replicas.

RDI keeps the Redis cache up to date with changes in the primary database, using a
[_Change Data Capture (CDC)_](https://en.wikipedia.org/wiki/Change_data_capture) mechanism.
It also lets you _transform_ the data from relational tables into convenient
and fast data structures that match your app's requirements. You specify the
transformations using a configuration system, so no coding is required.

## Headlines

- Changes to the processing mode: The preview versions of RDI processed data inside the Redis Enterprise database using the shard CPU. The GA version moves the processing of data outside the cluster. RDI is now deployed on VMs or on Kubernetes (K8s).
- Simple installation: RDI ships with all of its dependencies. A simple interactive installer provides a streamlined process that takes a few minutes.
- Silent installation: RDI can be installed by software using a script and an input file.
- Pipeline orchestration: The preview versions of RDI required you to manually install and configure the Debezium server. In this version, we add support for source database configuration to the pipeline configuration and orchestration of all pipeline components including the Debezium server (RDI Collector).
- Logging: All RDI component logs are now shipped to a central folder and get rotated by RDI's logging mechanism.
- Monitoring: RDI comes with two Prometheus exporters, one For Debezium Server and one for RDI's pipeline data processing.
- High availability mechanism: The preview versions of RDI used an external clustering dependency to provide active-passive deployment of the Debezium server. The GA version has a Redis-based built-in fail-over mechanism between an active VM and a passive VM. Kubernetes deployments rely on K8s probes that are included in RDI components.

## Limitations

- RDI can write data to a Redis Active-Active database. However, it doesn't support writing data to two or more Active-Active replicas. Writing data from RDI to several Active-Active replicas could easily harm data integrity as RDI is not synchronous with the source database commits.
- RDI write-behind (which is currently in preview) should not be used on the same data set that RDI ingest is writing to Redis. This would either cause an infinite loop or would harm the data integrity, since both ingest and write-behind are asynchronous, eventually-consistent processes.
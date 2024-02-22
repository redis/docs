---
Title: Use multiple Debezium connectors
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Install multiple Debezium Servers on the same host
group: di
linkTitle: Use multiple Debezium connectors
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 80
---

Some use cases require ingesting data from several different data sources.
Ingesting data from more than one Debezium Connector to the same RDI installation is supported.
The following diagram depicts this topology.

{{< image filename="/images/rdi/redis-di-multi-debezium.png" >}}

## Create the topology

- For each source database, a separate Debezium Server installation is needed; [see below](#installing-multiple-debezium-servers-on-the-same-host).
- Each Debezium Server will require its own `application.properties` file.
- Each Debezium Server will require a different logical name so it can create separate sets of data streams and offset keys in the RDI database. To do so specify a unique name in the `debezium.source.topic.prefix` connector property.
- If more than one Debezium Server is running on the same host, each one requires a different HTTP port. Set the port using the `quarkus.http.port` property.
- Ensure your RDI database has enough memory for all the streams that will ingest data. Use the following formula:

  ```
  <number of captured tables> * <batch size> * <max row size> * 4
  ```

This formula uses

- The number of tracked source tables as the indicator for the number of streams.
- The batch size multiplied by maximum source database row size as the amount of data that will reside in each stream. This amount of memory is multiplied by 4 to account for overhead from Debezium JSON schemas and other control plane data.

### Installing multiple Debezium Servers on the same host

In some cases, you may wish to have more than one Debezium Server installed on the same host. This is possible but it requires some consideration:

- Ensure there are enough CPU cores and sufficient RAM for all the required processing (especially during the initial sync).
- Each Debezium Server must have a separate `config` folder with the correct `application.properties` file. Make sure you do not start the Debezium Server pointing to the wrong `config` folder.
- Make sure each container running a Debezium Server is started with a different name.

## Caveats

- Resetting of one of the sources back to initial snapshot mode is not yet supported.
- Batch size and other RDI engine configuration properties are for all sources.
- There is no support for data meshing from different sources into a single Redis Hash or JSON key.

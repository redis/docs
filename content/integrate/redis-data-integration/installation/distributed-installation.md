---
Title: Installation topologies
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Learn about RDI topologies and configurations
group: di
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: '1'
---

This document explains the different topologies and configurations you can have with Redis Data Integration (RDI).

## Running the CLI on a separate host

This should be the best practice. The CLI is used by the RDI administrator.

In production, it is recommended that you install the CLI on a different host to the cluster or the Debezium Server.

This scenario requires:

- Copying the `application.properties` file to the host where the Debezium Server is running.
- Running the docker command while changing the volume argument (-v) appropriately.

> This guide uses Docker to illustrate the required command. If you are using Podman, simply replace `docker` with `podman` below.

```bash
docker run -d --rm --name debezium -v <ABSOLUTE_PATH_TO_APPLICATION_PROPERTIES>:/debezium/conf debezium/server
```

See [README](debezium-server-deployment.md#oracle) for specific instructions when using Oracle as the source database.

## Running Debezium Server remotely to the source database

While it is technically okay to run the [Debezium Server](https://debezium.io/documentation/reference/stable/operations/debezium-server.html) on the same host as the source database, it is not always the best practice.

- The database host needs all its resources to process queries.
- The database owners are not allowed to install a database client for an application on the database host. However, this scenario is fully supported and only requires a small update to the `application.properites` file:

```properties
debezium.source.database.hostname=<NAME_OR_IP_ADDRESS_OF_SOURCE_DB_HOST>
```

## Running Debezium Server remotely to RDI

In many cases, you wouldn't want to run the Debezium Server on the same host(s) as the Redis Cluster node(s). In this case ensure you edit the sink section of `application.properties`.

```properties
debezium.sink.redis.address=<REDIS_DI_DB_ENDPOINT>:<REDIS_DI_DB_PORT>
```

## RDI and target Redis databases on different clusters

This can be done when you want a separation of concerns or you do not wish to install/enable modules on the target cluster. In this scenario the `config.yaml` file needs to be edited with the following changes:

```yaml
connections:
  # Redis target DB connection details
  target:
    host: <REDIS_TARGET_DB_HOST>
    port: <REDIS_TARGET_DB_PORT>
    password: <REDIS_TARGET_DB_PASSWORD>
```

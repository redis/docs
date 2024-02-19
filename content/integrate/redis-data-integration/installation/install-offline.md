---
Title: Offline install
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: How to install Redis Data Integration without an active Internet connection
group: di
summary: Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: '1'
---

## Download

### RDI offline package

#### Ubuntu20.04

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-offline-ubuntu20.04-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-offline.tar.gz
```

#### Ubuntu18.04

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-offline-ubuntu18.04-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-offline.tar.gz
```

#### RHEL8

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-offline-rhel8-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-offline.tar.gz
```

#### RHEL7

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/{{<param rdi_cli_latest>}}/redis-di-offline-rhel7-{{<param rdi_cli_latest>}}.tar.gz -O /tmp/redis-di-offline.tar.gz
```

### Debezium Container Image

```bash
wget https://qa-onprem.s3.amazonaws.com/redis-di/debezium/debezium_server_{{<param rdi_debezium_server_version>}}_offline.tar.gz
```

## Install RedisGears and its dependencies

If your Redis Enterprise Cluster version is {{<param rdi_rlec_min_version>}} or higher, you can install RedisGears using the RDI CLI:

- Download RedisGears bundled with Python plugin:

  #### Ubuntu 20.04

  ```bash
  curl -s --tlsv1.3 https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-ubuntu20.04-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
  ```

  #### Ubuntu 18.04

  ```bash
  curl -s --tlsv1.3 https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-ubuntu18.04-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
  ```

  #### RHEL 8

  ```bash
  curl -s https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-rhel8-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
  ```

  #### RHEL 7

  ```bash
  curl -s https://redismodules.s3.amazonaws.com/redisgears/redisgears.Linux-rhel7-x86_64.{{<param rdi_redis_gears_version>}}-withdeps.zip -o /tmp/redis-gears.zip
  ```

- Run the `create` command in interactive mode:

  ```bash
  redis-di create
  ```

  The RDI CLI will prompt you to specify the location of the RedisGears zip file, which is located at `/tmp/redis-gears.zip` unless you modified the curl command above.

  The RDI CLI will ask for your cluster host, port, user name, and password, and it will attempt to install RedisGears before continuing with the creation of the RDI database.

## Install RDI CLI

On the workstation where the RDI CLI is to be installed, follow these steps:

- Unpack the downloaded `redis-di-offline.tar.gz` into the `/tmp` directory:

  ```bash
  tar xvf /tmp/redis-di-offline.tar.gz
  ```

- Unpack `redis-di.tar.gz` into the `/usr/local/bin/` directory:

  ```bash
  sudo tar xvf /tmp/redis-di-offline/redis-di-cli/redis-di.tar.gz -C /usr/local/bin/
  ```

  > Note: Non-root users should unpack to a directory with write permission and run `redis-di` directly from it.

## Create RDI BDB

```bash
redis-di create --silent --cluster-host <CLUSTER_HOST> --cluster-user <CLUSTER_USER> --cluster-password <CLUSTER_PASSWORD> --rdi-port <RDI_PORT> --rdi-password <RDI_PASSWORD>
```

Note: You can omit the `--rdi-port` argument and the BDB will be created on the next available port (starting with 12001).

## Load the Debezium image

- Copy the downloaded `debezium_server_{{<param rdi_debezium_server_version>}}_offline.tar.gz` into `/tmp`.
- Load the image:
  ```bash
  docker load < /tmp/debezium_server_{{<param rdi_debezium_server_version>}}_offline.tar.gz
  ```
- Tag the image as `latest`:
  ```bash
  docker tag debezium/server:{{<param rdi_debezium_server_version>}}_offline debezium/server:{{<param rdi_debezium_server_version>}}
  docker tag debezium/server:{{<param rdi_debezium_server_version>}}_offline debezium/server:latest
  ```

## Finalize the installation

Continue the installation as described [here](../ingest-qsg.md#scaffold-configuration-files).

---
Title: redis-di create
linkTitle: redis-di create
description: Creates the RDI Database instance
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Creates the RDI Database instance

## Usage

```
Usage: redis-di create [OPTIONS]
```

## Options

- `log_level`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `silent`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--silent`

  Silent install. Do not prompt to enter missing parameters

- `cluster_host` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `--cluster-host`

  Host/IP of Redis Enterprise Cluster (service name in case of k8s)

- `cluster_api_port` (REQUIRED):

  - Type: <IntRange 1<=x<=65535>
  - Default: `9443`
  - Usage: `--cluster-api-port`

  API Port of Redis Enterprise Cluster

- `cluster_user` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `--cluster-user`

  Redis Enterprise Cluster username with either DB Member, Cluster Member or Cluster Admin roles

- `cluster_password`:

  - Type: STRING
  - Default: `none`
  - Usage: `--cluster-password`

  Redis Enterprise Cluster Password

- `rdi_port`:

  - Type: <IntRange 1<=x<=65535>
  - Default: `none`
  - Usage: `--rdi-port`

  Port for the new RDI Database

- `rdi_password`:

  - Type: STRING
  - Default: ``
  - Usage: `--rdi-password`

  Password for the new RDI Database (alphanumeric characters with zero or more of the following: ! & # $ ^ < > -)

- `rdi_memory`:

  - Type: <IntRange x>=30>
  - Default: `100`
  - Usage: `--rdi-memory`

  Memory for RDI Database (in MB)

- `rdi_shards`:

  - Type: <IntRange x>=1>
  - Default: `1`
  - Usage: `--rdi-shards`

  Number of database server-side shards

- `replication`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--replication`

  In-memory database replication

- `with_redisgears`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--with-redisgears`

  Include RedisGears module in the RDI database

- `with_rejson`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--with-rejson`

  Include ReJSON in the RDI Database

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di create [OPTIONS]

  Creates the RDI Database instance

Options:
  -l, --log-level [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --silent                        Silent install. Do not prompt to enter
                                  missing parameters
  --cluster-host TEXT             Host/IP of Redis Enterprise Cluster (service
                                  name in case of k8s)  [required]
  --cluster-api-port INTEGER RANGE
                                  API Port of Redis Enterprise Cluster
                                  [default: 9443; 1<=x<=65535; required]
  --cluster-user TEXT             Redis Enterprise Cluster username with
                                  either DB Member, Cluster Member or Cluster
                                  Admin roles  [required]
  --cluster-password TEXT         Redis Enterprise Cluster Password
  --rdi-port INTEGER RANGE        Port for the new RDI Database  [1<=x<=65535]
  --rdi-password TEXT             Password for the new RDI Database
                                  (alphanumeric characters with zero or more
                                  of the following: ! & # $ ^ < > -)
  --rdi-memory INTEGER RANGE      Memory for RDI Database (in MB)  [x>=30]
  --rdi-shards INTEGER RANGE      Number of database server-side shards
                                  [x>=1]
  --replication                   In-memory database replication
  --help                          Show this message and exit.
```

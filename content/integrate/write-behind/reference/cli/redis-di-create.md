---
Title: redis-di create
aliases: null
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Creates the Write-behind Database instance
group: di
linkTitle: redis-di create
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

## Usage

```
Usage: redis-di create [OPTIONS]
```

## Options

- `loglevel`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--loglevel
-log-level`

- `silent`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--silent`

  Silent install. Do not prompt to enter missing parameters

- `no_configure`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--no-configure`

  Do not install Write-behind Engine to the Write-behind Database

- `cluster_host` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `--cluster-host`

  Host/IP of Redis Enterprise Cluster (service name in case of k8s)

- `cluster_api_port` (REQUIRED):

  - Type: <IntRange 1000<=x<=65535>
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

  - Type: <IntRange 1000<=x<=65535>
  - Default: `none`
  - Usage: `--rdi-port`

  Port for the new Write-behind Database

- `rdi_password`:

  - Type: STRING
  - Default: ``
  - Usage: `--rdi-password`

  Password for the new Write-behind Database (alphanumeric characters with zero or more of the following: ! & # $ ^ < > -)

- `rdi_memory`:

  - Type: <IntRange x>=30>
  - Default: `100`
  - Usage: `--rdi-memory`

  Memory for Write-behind Database (in MB)

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

- `redisgears_module`:

  - Type: STRING
  - Default: ``
  - Usage: `--redisgears-module`

  RedisGears module file

- `with_rejson`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--with-rejson`

  Include ReJSON in the Write-behind Database

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di create [OPTIONS]

  Creates the Write-behind Database instance

Options:
  -log-level, --loglevel [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --silent                        Silent install. Do not prompt to enter
                                  missing parameters
  --no-configure                  Do not install Write-behind Engine to the Write-behind
                                  Database
  --cluster-host TEXT             Host/IP of Redis Enterprise Cluster (service
                                  name in case of k8s)  [required]
  --cluster-api-port INTEGER RANGE
                                  API Port of Redis Enterprise Cluster
                                  [default: 9443; 1000<=x<=65535; required]
  --cluster-user TEXT             Redis Enterprise Cluster username with
                                  either DB Member, Cluster Member or Cluster
                                  Admin roles  [required]
  --cluster-password TEXT         Redis Enterprise Cluster Password
  --rdi-port INTEGER RANGE        Port for the new Write-behind Database
                                  [1000<=x<=65535]
  --rdi-password TEXT             Password for the new Write-behind Database
                                  (alphanumeric characters with zero or more
                                  of the following: ! & # $ ^ < > -)
  --rdi-memory INTEGER RANGE      Memory for Write-behind Database (in MB)  [x>=30]
  --rdi-shards INTEGER RANGE      Number of database server-side shards
                                  [x>=1]
  --replication                   In-memory database replication
  --redisgears-module TEXT        RedisGears module file
  --help                          Show this message and exit.
```

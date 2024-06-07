---
Title: redis-di install-redisgears
linkTitle: redis-di install-redisgears
description: Installs RedisGears module on Redis cluster
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Installs RedisGears module on Redis cluster

## Usage

```
Usage: redis-di install-redisgears [OPTIONS]
```

## Options

- `log_level`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

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

- `redisgears_module` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `--redisgears-module`

  RedisGears module file

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di install-redisgears [OPTIONS]

  Installs RedisGears module on Redis cluster

Options:
  -l, --log-level [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --cluster-host TEXT             Host/IP of Redis Enterprise Cluster (service
                                  name in case of k8s)  [required]
  --cluster-api-port INTEGER RANGE
                                  API Port of Redis Enterprise Cluster
                                  [default: 9443; 1<=x<=65535; required]
  --cluster-user TEXT             Redis Enterprise Cluster username with
                                  either DB Member, Cluster Member or Cluster
                                  Admin roles  [required]
  --cluster-password TEXT         Redis Enterprise Cluster Password
  --redisgears-module TEXT        RedisGears module file  [required]
  --help                          Show this message and exit.
```

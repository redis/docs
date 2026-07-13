---
Title: redis-di dump-support-package
linkTitle: redis-di dump-support-package
description: Dumps the RDI support package
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Dumps a comprehensive set of RDI forensics data that you can send to Redis support (see
[Dump support package]({{< relref "/integrate/redis-data-integration/troubleshooting#dump-support-package" >}})).
This is an administration command that is available only on VM installations, where `redis-di`
forwards it to the bundled `rdi-admin` tool.

## Usage

```
redis-di dump-support-package [OPTIONS]
```

## Options

| Option | Description |
| :-- | :-- |
| `-l`, `--log-level` | Log level: `TRACE`, `DEBUG`, `INFO`, `WARNING`, `ERROR`, or `CRITICAL` (default `INFO`). |
| `--rdi-namespace` | RDI Kubernetes namespace (default `rdi`). |
| `--rdi-host` | Host or IP of the RDI database (required). |
| `--rdi-port` | Port of the RDI database, `1`–`65535` (required). |
| `--rdi-user` | RDI database username. |
| `--rdi-password` | RDI database password. |
| `--rdi-key` | Private key file to authenticate with. |
| `--rdi-cert` | Client certificate file to authenticate with. |
| `--rdi-cacert` | CA certificate file to verify with. |
| `--rdi-key-password` | Password for unlocking an encrypted private key. |
| `--dir` | Directory where the support file is generated (default `.`). |
| `--dump-rejected` | Dump rejected records. |
| `--log-days` | Number of days to look back for log files (default `2`). |

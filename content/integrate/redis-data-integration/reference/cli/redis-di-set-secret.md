---
Title: redis-di set-secret
linkTitle: redis-di set-secret
description: Creates a secret of a specified key
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

## Usage

```
Usage: redis-di set-secret [OPTIONS] {RDI_REDIS_USERNAME|RDI_REDIS_PASSWORD|RD
                           I_REDIS_CACERT|RDI_REDIS_CERT|RDI_REDIS_KEY|RDI_RED
                           IS_KEY_PASSPHRASE|SOURCE_DB_USERNAME|SOURCE_DB_PASS
                           WORD|SOURCE_DB_CACERT|SOURCE_DB_CERT|SOURCE_DB_KEY|
                           SOURCE_DB_KEY_PASSWORD|TARGET_DB_USERNAME|TARGET_DB
                           _PASSWORD|TARGET_DB_CACERT|TARGET_DB_CERT|TARGET_DB
                           _KEY|TARGET_DB_KEY_PASSWORD|JWT_SECRET_KEY} [VALUE]
```

## Options

- `log_level`:

  - Type: Choice(['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `rdi_namespace`:

  - Type: STRING
  - Default: `rdi`
  - Usage: `--rdi-namespace`

  RDI Kubernetes namespace

- `key` (REQUIRED):

  - Type: Choice(['RDI_REDIS_USERNAME', 'RDI_REDIS_PASSWORD', 'RDI_REDIS_CACERT', 'RDI_REDIS_CERT', 'RDI_REDIS_KEY', 'RDI_REDIS_KEY_PASSPHRASE', 'SOURCE_DB_USERNAME', 'SOURCE_DB_PASSWORD', 'SOURCE_DB_CACERT', 'SOURCE_DB_CERT', 'SOURCE_DB_KEY', 'SOURCE_DB_KEY_PASSWORD', 'TARGET_DB_USERNAME', 'TARGET_DB_PASSWORD', 'TARGET_DB_CACERT', 'TARGET_DB_CERT', 'TARGET_DB_KEY', 'TARGET_DB_KEY_PASSWORD', 'JWT_SECRET_KEY'])
  - Default: `none`
  - Usage: `key`

- `value`:

  - Type: STRING
  - Default: `none`
  - Usage: `value`

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di set-secret [OPTIONS] {RDI_REDIS_USERNAME|RDI_REDIS_PASSWORD|RD
                           I_REDIS_CACERT|RDI_REDIS_CERT|RDI_REDIS_KEY|RDI_RED
                           IS_KEY_PASSPHRASE|SOURCE_DB_USERNAME|SOURCE_DB_PASS
                           WORD|SOURCE_DB_CACERT|SOURCE_DB_CERT|SOURCE_DB_KEY|
                           SOURCE_DB_KEY_PASSWORD|TARGET_DB_USERNAME|TARGET_DB
                           _PASSWORD|TARGET_DB_CACERT|TARGET_DB_CERT|TARGET_DB
                           _KEY|TARGET_DB_KEY_PASSWORD|JWT_SECRET_KEY} [VALUE]

  Creates a secret of a specified key

Options:
  -l, --log-level [TRACE|DEBUG|INFO|WARNING|ERROR|CRITICAL]
                                  [default: INFO]
  --rdi-namespace TEXT            RDI Kubernetes namespace  [default: rdi]
  --help                          Show this message and exit.
```

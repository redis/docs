---
Title: redis-di dump-support-package
aliases: null
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Dumps Write-behind support package
group: di
linkTitle: redis-di dump-support-package
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

## Usage

```
Usage: redis-di dump-support-package [OPTIONS]
```

## Options

- `loglevel`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--loglevel
-log-level`

- `rdi_host` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-host`

  Host/IP of Write-behind Database

- `rdi_port` (REQUIRED):

  - Type: <IntRange 1000<=x<=65535>
  - Default: `none`
  - Usage: `--rdi-port`

  Port of Write-behind Database

- `rdi_password`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-password`

  Write-behind Database Password

- `rdi_key`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-key`

  Private key file to authenticate with

- `rdi_cert`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-cert`

  Client certificate file to authenticate with

- `rdi_cacert`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-cacert`

  CA certificate file to verify with

- `rdi_key_password`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-key-password`

  Password for unlocking an encrypted private key

- `directory`:

  - Type: STRING
  - Default: `.`
  - Usage: `--dir`

  Directory where the support file should be generated

- `dump_rejected`:

  - Type: INT
  - Default: `none`
  - Usage: `--dump-rejected`

  Dumps rejected records

- `trace_timeout`:

  - Type: <IntRange 1<=x<=600>
  - Default: `none`
  - Usage: `--trace-timeout`

  Stops the trace after exceeding this timeout (in seconds)

- `max_change_records`:

  - Type: <IntRange x>=1>
  - Default: `10`
  - Usage: `--max-change-records`

  Maximum traced change records per shard

- `trace_only_rejected`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--trace-only-rejected`

  Trace only rejected change records

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di dump-support-package [OPTIONS]

  Dumps Write-behind support package

Options:
  -log-level, --loglevel [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --rdi-host TEXT                 Host/IP of Write-behind Database  [required]
  --rdi-port INTEGER RANGE        Port of Write-behind Database  [1000<=x<=65535;
                                  required]
  --rdi-password TEXT             Write-behind Database Password
  --rdi-key TEXT                  Private key file to authenticate with
  --rdi-cert TEXT                 Client certificate file to authenticate with
  --rdi-cacert TEXT               CA certificate file to verify with
  --rdi-key-password TEXT         Password for unlocking an encrypted private
                                  key
  --dir TEXT                      Directory where the support file should be
                                  generated  [default: .]
  --dump-rejected INTEGER         Dumps rejected records
  --trace-timeout INTEGER RANGE   Stops the trace after exceeding this timeout
                                  (in seconds)  [1<=x<=600]
  --max-change-records INTEGER RANGE
                                  Maximum traced change records per shard
                                  [x>=1]
  --trace-only-rejected           Trace only rejected change records
  --help                          Show this message and exit.
```

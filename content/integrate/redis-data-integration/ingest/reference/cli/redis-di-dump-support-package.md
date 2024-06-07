---
Title: redis-di dump-support-package
linkTitle: redis-di dump-support-package
description: Dumps RDI support package
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Dumps RDI support package

## Usage

```
Usage: redis-di dump-support-package [OPTIONS]
```

## Options

- `log_level`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `rdi_host` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-host`

  Host/IP of RDI Database

- `rdi_port` (REQUIRED):

  - Type: <IntRange 1<=x<=65535>
  - Default: `none`
  - Usage: `--rdi-port`

  Port of RDI Database

- `rdi_user`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-user`

  RDI Database Username

- `rdi_password`:

  - Type: STRING
  - Default: `none`
  - Usage: `--rdi-password`

  RDI Database Password

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

  Maximum traced change records

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

  Dumps RDI support package

Options:
  -l, --log-level [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --rdi-host TEXT                 Host/IP of RDI Database  [required]
  --rdi-port INTEGER RANGE        Port of RDI Database  [1<=x<=65535;
                                  required]
  --rdi-user TEXT                 RDI Database Username
  --rdi-password TEXT             RDI Database Password
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
                                  Maximum traced change records  [x>=1]
  --trace-only-rejected           Trace only rejected change records
  --help                          Show this message and exit.
```

---
Title: redis-di config-rdi
linkTitle: redis-di config-rdi
description: Configures RDI db connection credentials
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Configures RDI db connection credentials

## Usage

```
Usage: redis-di config-rdi [OPTIONS]
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

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di config-rdi [OPTIONS]

  Configures RDI db connection credentials

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
  --help                          Show this message and exit.
```

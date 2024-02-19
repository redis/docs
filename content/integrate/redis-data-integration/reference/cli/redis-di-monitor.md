---
Title: redis-di monitor
aliases: null
alwaysopen: false
categories:
- docs
- integrate
- rs
- rdi
description: Monitors RDI by collecting metrics and exporting to Prometheus
group: library
summary: Redis OM for Node.js is an object-mapping library for Redis.
type: integration
weight: '9'
---

Monitors RDI by collecting metrics and exporting to Prometheus

## Usage

```
Usage: redis-di monitor [OPTIONS]
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

  Host/IP of RDI Database

- `rdi_port` (REQUIRED):

  - Type: <IntRange 1000<=x<=65535>
  - Default: `none`
  - Usage: `--rdi-port`

  Port of RDI Database

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

- `exporter_port`:

  - Type: <IntRange 1000<=x<=65535>
  - Default: `9121`
  - Usage: `--exporter-port`

  HTTP port to start the exporter on

- `collect_interval`:

  - Type: <IntRange 1<=x<=60>
  - Default: `5`
  - Usage: `--collect-interval`

  Metrics collection interval (seconds)

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di monitor [OPTIONS]

  Monitors RDI by collecting metrics and exporting to Prometheus

Options:
  -log-level, --loglevel [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --rdi-host TEXT                 Host/IP of RDI Database  [required]
  --rdi-port INTEGER RANGE        Port of RDI Database  [1000<=x<=65535;
                                  required]
  --rdi-password TEXT             RDI Database Password
  --rdi-key TEXT                  Private key file to authenticate with
  --rdi-cert TEXT                 Client certificate file to authenticate with
  --rdi-cacert TEXT               CA certificate file to verify with
  --rdi-key-password TEXT         Password for unlocking an encrypted private
                                  key
  --exporter-port INTEGER RANGE   HTTP port to start the exporter on
                                  [1000<=x<=65535]
  --collect-interval INTEGER RANGE
                                  Metrics collection interval (seconds)
                                  [1<=x<=60]
  --help                          Show this message and exit.
```

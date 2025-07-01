---
Title: redis-di install
linkTitle: redis-di install
description: Installs RDI
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

## Usage

```
Usage: redis-di install [OPTIONS]
```

## Options

- `log_level`:

  - Type: Choice(['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
  - Default: `warning`
  - Usage: `--log-level
-l`

- `file`:

  - Type: <click.types.Path object>
  - Default: `none`
  - Usage: `-f
--file`

  Path to a YAML configuration file for silent installation

- `installation_dir`:

  - Type: <click.types.Path object>
  - Default: `none`
  - Usage: `--installation-dir`

  Custom installation directory

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di install [OPTIONS]

  Installs RDI

Options:
  -l, --log-level [TRACE|DEBUG|INFO|WARNING|ERROR|CRITICAL]
                                  [default: WARNING]
  -f, --file FILE                 Path to a YAML configuration file for silent
                                  installation
  --installation-dir DIRECTORY    Custom installation directory
  --help                          Show this message and exit.
```

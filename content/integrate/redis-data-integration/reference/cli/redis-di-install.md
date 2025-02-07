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
* `log_level`: 
  * Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL']) 
  * Default: `warn`
  * Usage: `--log-level
-l`

  


* `file`: 
  * Type: <click.types.Path object at 0x7f99b7e778e0> 
  * Default: `none`
  * Usage: `-f
--file`

  Path to a TOML configuration file for silent installation


* `online`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--online`

  Run installer in online mode

* `installation-dir`:
  * Type: STRING
  * Default: `/var/lib`
  * Usage: `--installation-dir`

  Custom installation directory

* `help`: 
  * Type: BOOL 
  * Default: `false`
  * Usage: `--help`

  Show this message and exit.



## CLI help

```
Usage: redis-di install [OPTIONS]

  Installs RDI

Options:
  -l, --log-level [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: WARN]
  -f, --file FILE                 Path to a TOML configuration file for silent
                                  installation
  --installation-dir              Custom installation directory

  --help                          Show this message and exit.
```

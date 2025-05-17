---
Title: redis-di scaffold
linkTitle: redis-di scaffold
description: Generates configuration files for RDI
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

## Usage

```
Usage: redis-di scaffold [OPTIONS]
```

## Options

- `log_level`:

  - Type: Choice(['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `db_type` (REQUIRED):

  - Type: Choice([<DbType.CASSANDRA: 'cassandra'>, <DbType.MARIADB: 'mariadb'>, <DbType.MONGODB: 'mongodb'>, <DbType.MYSQL: 'mysql'>, <DbType.ORACLE: 'oracle'>, <DbType.POSTGRESQL: 'postgresql'>, <DbType.SQLSERVER: 'sqlserver'>])
  - Default: `none`
  - Usage: `--db-type`

  DB type

  Output to directory or stdout

- `directory`:

  - Type: STRING
  - Default: `none`
  - Usage: `--dir`

  Directory containing RDI configuration

- `preview`:

  - Type: STRING
  - Default: `none`
  - Usage: `--preview`

  Print the content of the scaffolded config file to CLI output

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di scaffold [OPTIONS]

  Generates configuration files for RDI

Options:
  -l, --log-level [TRACE|DEBUG|INFO|WARNING|ERROR|CRITICAL]
                                  [default: INFO]
  --db-type [cassandra|mariadb|mongodb|mysql|oracle|postgresql|sqlserver]
                                  DB type  [required]
  Output formats: [mutually_exclusive, required]
                                  Output to directory or stdout
    --dir TEXT                    Directory containing RDI configuration
    --preview TEXT                Print the content of the scaffolded config
                                  file to CLI output
  --help                          Show this message and exit.
```

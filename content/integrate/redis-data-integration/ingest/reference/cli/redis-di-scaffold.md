---
Title: redis-di scaffold
linkTitle: redis-di scaffold
description: Generates configuration files for RDI
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Generates configuration files for RDI

## Usage

```
Usage: redis-di scaffold [OPTIONS]
```

## Options

- `log_level`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `db_type` (REQUIRED):

  - Type: Choice([<DbType.CASSANDRA: 'cassandra'>, <DbType.DB2: 'db2'>, <DbType.MONGODB: 'mongodb'>, <DbType.MYSQL: 'mysql'>, <DbType.ORACLE: 'oracle'>, <DbType.POSTGRESQL: 'postgresql'>, <DbType.REDIS: 'redis'>, <DbType.SQLSERVER: 'sqlserver'>])
  - Default: `none`
  - Usage: `--db-type`

  DB type

- `strategy`:

  - Type: Choice([<Strategy.INGEST: 'ingest'>, <Strategy.WRITE_BEHIND: 'write_behind'>])
  - Default: `ingest`
  - Usage: `--strategy`

  Strategy

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
  -l, --log-level [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --db-type [cassandra|db2|mongodb|mysql|oracle|postgresql|redis|sqlserver]
                                  DB type  [required]
  --strategy [ingest|write_behind]
                                  Strategy  [default: ingest]
  Output formats: [mutually_exclusive, required]
                                  Output to directory or stdout
    --dir TEXT                    Directory containing RDI configuration
    --preview TEXT                Print the content of the scaffolded config
                                  file to CLI output
  --help                          Show this message and exit.
```

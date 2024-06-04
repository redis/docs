---
Title: redis-di delete-all-contexts
aliases: null
alwaysopen: false
categories:
  - docs
  - integrate
  - rs
  - rdi
description: Deletes all contexts
group: di
linkTitle: redis-di delete-all-contexts
summary:
  Redis Data Integration keeps Redis in sync with the primary database in near
  real time.
type: integration
weight: 10
---

## Usage

```
Usage: redis-di delete-all-contexts [OPTIONS]
```

## Options

- `loglevel`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--loglevel
-log-level`

- `force`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--force
-f`

  Force operation. skips verification prompts

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di delete-all-contexts [OPTIONS]

  Deletes all contexts

Options:
  -log-level, --loglevel [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  -f, --force                     Force operation. skips verification prompts
  --help                          Show this message and exit.
```

---
Title: redis-di set-context
linkTitle: redis-di set-context
description: Sets a context to be the active one
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Sets a context to be the active one

## Usage

```
Usage: redis-di set-context [OPTIONS] CONTEXT_NAME
```

## Options

- `log_level`:

  - Type: Choice(['DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `context_name` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `context-name`

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di set-context [OPTIONS] CONTEXT_NAME

  Sets a context to be the active one

Options:
  -l, --log-level [DEBUG|INFO|WARN|ERROR|CRITICAL]
                                  [default: INFO]
  --help                          Show this message and exit.
```

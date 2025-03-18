---
Title: redis-di delete-context
linkTitle: redis-di delete-context
description: Deletes a context
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

## Usage

```
Usage: redis-di delete-context [OPTIONS] CONTEXT_NAME
```

## Options

- `log_level`:

  - Type: Choice(['TRACE', 'DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL'])
  - Default: `info`
  - Usage: `--log-level
-l`

- `context_name` (REQUIRED):

  - Type: STRING
  - Default: `none`
  - Usage: `context-name`

- `force`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--force
-f`

  Force operation. Skips verification prompts

- `help`:

  - Type: BOOL
  - Default: `false`
  - Usage: `--help`

  Show this message and exit.

## CLI help

```
Usage: redis-di delete-context [OPTIONS] CONTEXT_NAME

  Deletes a context

Options:
  -l, --log-level [TRACE|DEBUG|INFO|WARNING|ERROR|CRITICAL]
                                  [default: INFO]
  -f, --force                     Force operation. Skips verification prompts
  --help                          Show this message and exit.
```

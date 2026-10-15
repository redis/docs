---
Title: redis-di describe-context
linkTitle: redis-di describe-context
description: Describes a context
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Describes a single context from the `~/.redis-di` context file, showing its API connection details.
See the [CLI reference overview](/content/integrate/redis-data-integration/reference/cli/_index.md#contexts)
for more about contexts.

## Usage

```
redis-di describe-context <name> [flags]
```

## Options

This command takes only the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di describe-context prod
```

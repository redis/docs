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
See the [CLI reference overview]({{< relref "/integrate/redis-data-integration/reference/cli#contexts" >}})
for more about contexts.

## Usage

```
redis-di describe-context <name> [flags]
```

## Options

This command takes only the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di describe-context prod
```

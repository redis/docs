---
Title: redis-di use-context
linkTitle: redis-di use-context
description: Sets a context to be the active one
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases:
---

Sets a context in the `~/.redis-di` context file to be the active one, so its connection details are
used by subsequent commands. Create or update a context with
[`set-context`]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di-set-context" >}}).

## Usage

```
redis-di use-context <name> [flags]
```

## Options

This command takes only the
[global options]({{< relref "/integrate/redis-data-integration/reference/cli/redis-di#global-options" >}}).

## Example

```bash
redis-di use-context prod
```

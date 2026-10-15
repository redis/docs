---
Title: redis-di set-setting
linkTitle: redis-di set-setting
description: Sets a setting of the RDI instance
weight: 10
alwaysopen: false
categories: ["redis-di"]
aliases: []
---

Sets a runtime setting of the RDI instance.

## Usage

```
redis-di set-setting <name> <value>
```

The supported setting is `standby_mode`. Set it to `true` to remove the instance from leader
election and allow another instance to take over. The runtime setting overrides
`operator.leaderElection.standbyMode`.

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di set-setting standby_mode true
```

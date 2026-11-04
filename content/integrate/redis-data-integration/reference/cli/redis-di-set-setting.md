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

A setting that you set overrides the corresponding installation value until you delete it with
[`redis-di delete-setting`](/content/integrate/redis-data-integration/reference/cli/redis-di-delete-setting.md).
Changing a setting does not restart the RDI operator or the RDI API. See
[RDI instance settings](/content/integrate/redis-data-integration/reference/instance-settings.md)
for the available settings, their values, and what each one does.

This command also accepts the
[global options](/content/integrate/redis-data-integration/reference/cli/redis-di.md#global-options).

## Example

```bash
redis-di set-setting standby_mode true
```

---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: RESTORE tried to create a key that already exists.
linkTitle: BUSYKEY
title: BUSYKEY error
weight: 17
error:
  prefix: BUSYKEY
  message: BUSYKEY Target key name already exists.
  match:
  - Target key name already exists
---

Redis returns this error when [`RESTORE`](/content/commands/restore.md) would create a key that already exists. `RESTORE` creates a key from a value that [`DUMP`](/content/commands/dump.md) serialized. By default, it doesn't overwrite an existing key.

```
BUSYKEY Target key name already exists.
```

## Example

```
> SET mykey "value"
OK
> RESTORE mykey 0 "<serialized-value>"
(error) BUSYKEY Target key name already exists.
```

## How to fix it

- **To replace the existing key,** add the `REPLACE` option: `RESTORE mykey 0 "<serialized-value>" REPLACE`.
- **To keep the existing key,** restore the value under a different key name.

[`MIGRATE`](/content/commands/migrate.md), which moves keys to another Redis server, also has a `REPLACE` option for keys that already exist on the target server.

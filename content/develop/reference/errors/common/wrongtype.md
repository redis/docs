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
description: A command was used on a key that holds a different data type.
linkTitle: WRONGTYPE
title: WRONGTYPE error
weight: 14
error:
  prefix: WRONGTYPE
  message: WRONGTYPE Operation against a key holding the wrong kind of value
  match:
  - Operation against a key holding the wrong kind of value
  - Existing key has wrong Redis type
  - Key is not a valid HyperLogLog string value
---

Redis returns this error when you run a command on a key that holds a different data type than the command works with. Each key holds one data type, such as a string, a list, or a hash, and each command works with only one of them.

```
WRONGTYPE Operation against a key holding the wrong kind of value
```

Some commands word this error differently. JSON commands return `Existing key has wrong Redis type`. HyperLogLog commands return `WRONGTYPE Key is not a valid HyperLogLog string value.` for a key that holds a string but not a HyperLogLog.

## Example

[`GET`](/content/commands/get.md) works with strings, so it fails on a key that holds a list:

```
> RPUSH mylist "a"
(integer) 1
> GET mylist
(error) WRONGTYPE Operation against a key holding the wrong kind of value
```

## How to fix it

Find out what the key holds with [`TYPE`](/content/commands/type.md):

```
> TYPE mylist
list
```

Then check which of these causes applies:

- **You used a command for a different type.** Use a command for the key's type instead. For example, use [`LRANGE`](/content/commands/lrange.md) to read a list, and [`HGET`](/content/commands/hget.md) to read a field of a hash. See [Data types](/content/develop/data-types/_index.md) for the commands each type supports.
- **Two parts of your app use the same key name for different data.** Give each kind of data its own key prefix, such as `user:` for hashes and `queue:` for lists.
- **The key still holds data from an older version of your app.** If you no longer need the old data, delete the key with [`DEL`](/content/commands/del.md) and write it again.

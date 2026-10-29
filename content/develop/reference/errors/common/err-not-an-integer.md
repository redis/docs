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
description: A command requires a whole number, but the stored value or an argument is not a whole number.
linkTitle: ERR value is not an integer
title: ERR value is not an integer or out of range
weight: 13
error:
  prefix: ERR
  message: ERR value is not an integer or out of range
  match:
  - value is not an integer or out of range
  - increment or decrement would overflow
  - value is not a valid float
---

Redis returns this error when a command needs a whole number but gets something else. The problem can be an argument you passed, or the value stored in the key.

```
ERR value is not an integer or out of range
```

## Example

[`INCR`](/content/commands/incr.md) adds 1 to the number stored in a key, so it fails when the key holds text:

```
> SET counter "abc"
OK
> INCR counter
(error) ERR value is not an integer or out of range
```

An argument that should be a number gives the same error:

```
> EXPIRE counter ten
(error) ERR value is not an integer or out of range
```

## How to fix it

- **The key holds text or a decimal number.** `INCR`, `DECR`, `INCRBY`, and `DECRBY` only work on whole numbers, such as `10` or `-3`. A value such as `1.5` gives this error too. To add to a decimal number, use [`INCRBYFLOAT`](/content/commands/incrbyfloat.md).
- **An argument isn't a whole number.** Arguments such as expiry times and counts must be whole numbers written as digits. Look for units or decimals, such as `10s` or `2.5`.
- **The number is too large.** Redis stores these numbers as signed 64-bit integers, so the largest value is 9223372036854775807. When an increment would go past that, the error is `ERR increment or decrement would overflow`.

Commands that take decimal numbers, such as `INCRBYFLOAT`, give a similar error when the value isn't a number: `ERR value is not a valid float`.

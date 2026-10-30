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
description: A command's options are misspelled, in the wrong place, or can't be used together.
linkTitle: ERR syntax error
title: ERR syntax error
weight: 12
error:
  prefix: ERR
  message: ERR syntax error
  match:
  - syntax error
---

Redis returns this error when it can't make sense of a command's options. The command name is right, but the options don't follow the command's syntax.

```
ERR syntax error
```

## Example

The `NX` and `XX` options of [`SET`](/content/commands/set.md) can't be used together:

```
> SET mykey "value" NX XX
(error) ERR syntax error
```

## How to fix it

The message doesn't say which option is wrong. Compare each option with the syntax on the command's page, and look for these common mistakes:

- **Options that can't be used together,** such as `NX` and `XX` in `SET`.
- **A misspelled option, or one your server doesn't support yet.** The history section of each command page lists the version that added each option.
- **An option in the wrong place.** For example, in [`ZADD`](/content/commands/zadd.md), options such as `NX` go before the score and member. `ZADD myset NX 1 "a"` works, but `ZADD myset 1 "a" NX` gives this error.
- **A value with spaces that isn't quoted.** In `redis-cli`, `SET greeting hello world` sends `world` as an extra option. Put quotes around the value: `SET greeting "hello world"`.

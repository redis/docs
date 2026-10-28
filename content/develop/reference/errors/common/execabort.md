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
description: A transaction was discarded because one of its commands had an error.
linkTitle: EXECABORT
title: EXECABORT error
weight: 15
error:
  prefix: EXECABORT
  message: EXECABORT Transaction discarded because of previous errors.
  match:
  - Transaction discarded because of previous errors
  - Transaction discarded because of
  - ExecAbortError
---

Redis returns this error from [`EXEC`](/content/commands/exec.md) when a command in the transaction couldn't be queued. Redis then discards the whole transaction, so none of its commands run.

```
EXECABORT Transaction discarded because of previous errors.
```

## Example

Between [`MULTI`](/content/commands/multi.md) and `EXEC`, Redis queues each command to run later. A command with an error, such as an unknown command name, is rejected instead of queued. `EXEC` then refuses to run the transaction:

```
> MULTI
OK
> FOO
(error) ERR unknown command 'FOO'
> SET a 1
QUEUED
> EXEC
(error) EXECABORT Transaction discarded because of previous errors.
```

## How to fix it

Look at the reply to each command in the transaction. The command that failed got an error instead of `QUEUED`, and that error tells you what to fix. Common ones are [`ERR unknown command`](/content/develop/reference/errors/common/err-unknown-command.md) and [`ERR wrong number of arguments`](/content/develop/reference/errors/common/err-wrong-number-of-arguments.md).

If Redis refuses the `EXEC` command itself, the message gives the reason after a colon. For example, when the user isn't allowed to run `EXEC`:

```
EXECABORT Transaction discarded because of: NOPERM User <username> has no permissions to run the 'exec' command
```

In redis-py, a transaction pipeline raises the error of the command that failed, rather than `EXECABORT`. For example: `Command # 1 (FOO) of pipeline caused error: unknown command 'FOO'`.

Errors that happen while `EXEC` runs the commands don't discard the transaction. For example, a [`WRONGTYPE`](/content/develop/reference/errors/common/wrongtype.md) error makes only that command fail. The other commands still run, and `EXEC` returns the error in its list of replies. See [Errors inside a transaction](/content/develop/using-commands/transactions.md#errors-inside-a-transaction).

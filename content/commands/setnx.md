---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: value
  name: value
  type: string
arity: 3
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
command_flags:
- write
- denyoom
- fast
complexity: O(1)
deprecated_since: 2.6.12
description: Set the string value of a key only when the key doesn't exist.
doc_flags:
- deprecated
group: string
hidden: false
key_specs:
- OW: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  insert: true
linkTitle: SETNX
replaced_by: '[`SET`]({{< relref "/commands/set" >}}) with the `NX` argument'
since: 1.0.0
summary: Set the string value of a key only when the key doesn't exist.
syntax_fmt: SETNX key value
syntax_str: value
title: SETNX
---
Set `key` to hold string `value` if `key` does not exist.
In that case, it is equal to [`SET`]({{< relref "/commands/set" >}}).
When `key` already holds a value, no operation is performed.
`SETNX` is short for "**SET** if **N**ot e**X**ists".

## Examples

{{% redis-cli %}}
SETNX mykey "Hello"
SETNX mykey "World"
GET mykey
{{% /redis-cli %}}


## Design pattern: Locking with `SETNX`

**Please note that:**

1. The following pattern is discouraged in favor of [the Redlock algorithm]({{< relref "/develop/clients/patterns/distributed-locks" >}}) which is only a bit more complex to implement, but offers better guarantees and is fault tolerant.
2. We document the old pattern anyway because certain existing implementations link to this page as a reference. Moreover it is an interesting example of how Redis commands can be used in order to mount programming primitives.
3. Anyway even assuming a single-instance locking primitive, starting with 2.6.12 it is possible to create a much simpler locking primitive, equivalent to the one discussed here, using the [`SET`]({{< relref "/commands/set" >}}) command to acquire the lock, and a simple Lua script to release the lock. The pattern is documented in the [`SET`]({{< relref "/commands/set" >}}) command page.

That said, `SETNX` can be used, and was historically used, as a locking primitive. For example, to acquire the lock of the key `foo`, the client could try the
following:

```
SETNX lock.foo <current Unix time + lock timeout + 1>
```

If `SETNX` returns `1` the client acquired the lock, setting the `lock.foo` key
to the Unix time at which the lock should no longer be considered valid.
The client will later use `DEL lock.foo` in order to release the lock.

If `SETNX` returns `0` the key is already locked by some other client.
We can either return to the caller if it's a non blocking lock, or enter a loop
retrying to hold the lock until we succeed or some kind of timeout expires.

### Handling deadlocks

In the above locking algorithm there is a problem: what happens if a client
fails, crashes, or is otherwise not able to release the lock?
It's possible to detect this condition because the lock key contains a UNIX
timestamp.
If such a timestamp is equal to the current Unix time the lock is no longer
valid.

When this happens we can't just call [`DEL`]({{< relref "/commands/del" >}}) against the key to remove the lock
and then try to issue a `SETNX`, as there is a race condition here, when
multiple clients detected an expired lock and are trying to release it.

* C1 and C2 read `lock.foo` to check the timestamp, because they both received
  `0` after executing `SETNX`, as the lock is still held by C3 that crashed
  after holding the lock.
* C1 sends `DEL lock.foo`
* C1 sends `SETNX lock.foo` and it succeeds
* C2 sends `DEL lock.foo`
* C2 sends `SETNX lock.foo` and it succeeds
* **ERROR**: both C1 and C2 acquired the lock because of the race condition.

Fortunately, it's possible to avoid this issue using the following algorithm.
Let's see how C4, our sane client, uses the good algorithm:

*   C4 sends `SETNX lock.foo` in order to acquire the lock

*   The crashed client C3 still holds it, so Redis will reply with `0` to C4.

*   C4 sends `GET lock.foo` to check if the lock expired.
    If it is not, it will sleep for some time and retry from the start.

*   Instead, if the lock is expired because the Unix time at `lock.foo` is older
    than the current Unix time, C4 tries to perform:

    ```
    GETSET lock.foo <current Unix timestamp + lock timeout + 1>
    ```

*   Because of the [`GETSET`]({{< relref "/commands/getset" >}}) semantic, C4 can check if the old value stored at
    `key` is still an expired timestamp.
    If it is, the lock was acquired.

*   If another client, for instance C5, was faster than C4 and acquired the lock
    with the [`GETSET`]({{< relref "/commands/getset" >}}) operation, the C4 [`GETSET`]({{< relref "/commands/getset" >}}) operation will return a non
    expired timestamp.
    C4 will simply restart from the first step.
    Note that even if C4 set the key a bit a few seconds in the future this is
    not a problem.

In order to make this locking algorithm more robust, a
client holding a lock should always check the timeout didn't expire before
unlocking the key with [`DEL`]({{< relref "/commands/del" >}}) because client failures can be complex, not just
crashing but also blocking a lot of time against some operations and trying
to issue [`DEL`]({{< relref "/commands/del" >}}) after a lot of time (when the LOCK is already held by another
client).

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="setnx-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the key was not set.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the key was set.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the key was not set.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the key was set.

{{< /multitabs >}}

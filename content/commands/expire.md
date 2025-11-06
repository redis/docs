---
acl_categories:
- '@keyspace'
- '@write'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: seconds
  name: seconds
  type: integer
- arguments:
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  - display_text: gt
    name: gt
    token: GT
    type: pure-token
  - display_text: lt
    name: lt
    token: LT
    type: pure-token
  name: condition
  optional: true
  since: 7.0.0
  type: oneof
arity: -3
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
- fast
complexity: O(1)
description: Sets the expiration time of a key in seconds.
group: generic
hidden: false
history:
- - 7.0.0
  - 'Added options: `NX`, `XX`, `GT` and `LT`.'
key_specs:
- RW: true
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
  update: true
linkTitle: EXPIRE
railroad_diagram: /images/railroad/expire.svg
since: 1.0.0
summary: Sets the expiration time of a key in seconds.
syntax_fmt: EXPIRE key seconds [NX | XX | GT | LT]
syntax_str: seconds [NX | XX | GT | LT]
title: EXPIRE
---
Set a timeout on `key`.
After the timeout has expired, the key will automatically be deleted.
A key with an associated timeout is often said to be _volatile_ in Redis
terminology.

The timeout will only be cleared by commands that delete or overwrite the
contents of the key, including [`DEL`]({{< relref "/commands/del" >}}), [`SET`]({{< relref "/commands/set" >}}), [`GETSET`]({{< relref "/commands/getset" >}}) and all the `*STORE`
commands.
This means that all the operations that conceptually _alter_ the value stored at
the key without replacing it with a new one will leave the timeout untouched.
For instance, incrementing the value of a key with [`INCR`]({{< relref "/commands/incr" >}}), pushing a new value
into a list with [`LPUSH`]({{< relref "/commands/lpush" >}}), or altering the field value of a hash with [`HSET`]({{< relref "/commands/hset" >}}) are
all operations that will leave the timeout untouched.

The timeout can also be cleared, turning the key back into a persistent key,
using the [`PERSIST`]({{< relref "/commands/persist" >}}) command.

If a key is renamed with [`RENAME`]({{< relref "/commands/rename" >}}), the associated time to live is transferred to
the new key name.

If a key is overwritten by [`RENAME`]({{< relref "/commands/rename" >}}), like in the case of an existing key `Key_A`
that is overwritten by a call like `RENAME Key_B Key_A`, it does not matter if
the original `Key_A` had a timeout associated or not, the new key `Key_A` will
inherit all the characteristics of `Key_B`.

Note that calling `EXPIRE`/[`PEXPIRE`]({{< relref "/commands/pexpire" >}}) with a non-positive timeout or
[`EXPIREAT`]({{< relref "/commands/expireat" >}})/[`PEXPIREAT`]({{< relref "/commands/pexpireat" >}}) with a time in the past will result in the key being
[deleted][del] rather than expired (accordingly, the emitted [key event][ntf]
will be `del`, not `expired`).

[del]: /commands/del
[ntf]: /develop/use/keyspace-notifications

## Options

The `EXPIRE` command supports a set of options:

* `NX` -- Set expiry only when the key has no expiry
* `XX` -- Set expiry only when the key has an existing expiry
* `GT` -- Set expiry only when the new expiry is greater than current one
* `LT` -- Set expiry only when the new expiry is less than current one

A non-volatile key is treated as an infinite TTL for the purpose of `GT` and `LT`.
The `GT`, `LT` and `NX` options are mutually exclusive.

## Refreshing expires

It is possible to call `EXPIRE` using as argument a key that already has an
existing expire set.
In this case the time to live of a key is _updated_ to the new value.
There are many useful applications for this, an example is documented in the
_Navigation session_ pattern section below.

## Differences in Redis prior 2.1.3

In Redis versions prior **2.1.3** altering a key with an expire set using a
command altering its value had the effect of removing the key entirely.
This semantics was needed because of limitations in the replication layer that
are now fixed.

`EXPIRE` would return 0 and not alter the timeout for a key with a timeout set.

## Examples

{{< clients-example cmds_generic expire >}}
> SET mykey "Hello"
"OK"
> EXPIRE mykey 10
(integer) 1
> TTL mykey
(integer) 10
> SET mykey "Hello World"
"OK"
> TTL mykey
(integer) -1
> EXPIRE mykey 10 XX
(integer) 0
> TTL mykey
(integer) -1
> EXPIRE mykey 10 NX
(integer) 1
> TTL mykey
(integer) 10
{{< /clients-example >}}

Give these commands a try in the interactive console:

{{% redis-cli %}}
SET mykey "Hello"
EXPIRE mykey 10
TTL mykey
SET mykey "Hello World"
TTL mykey
EXPIRE mykey 10 XX
TTL mykey
EXPIRE mykey 10 NX
TTL mykey
{{% /redis-cli %}}


## Pattern: Navigation session

Imagine you have a web service and you are interested in the latest N pages
_recently_ visited by your users, such that each adjacent page view was not
performed more than 60 seconds after the previous.
Conceptually you may consider this set of page views as a _Navigation session_
of your user, that may contain interesting information about what kind of
products he or she is looking for currently, so that you can recommend related
products.

You can easily model this pattern in Redis using the following strategy: every
time the user does a page view you call the following commands:

```
MULTI
RPUSH pagewviews.user:<userid> http://.....
EXPIRE pagewviews.user:<userid> 60
EXEC
```

If the user will be idle more than 60 seconds, the key will be deleted and only
subsequent page views that have less than 60 seconds of difference will be
recorded.

This pattern is easily modified to use counters using [`INCR`]({{< relref "/commands/incr" >}}) instead of lists
using [`RPUSH`]({{< relref "/commands/rpush" >}}).

## Appendix: Redis expires

### Keys with an expire

Normally Redis keys are created without an associated time to live.
The key will simply live forever, unless it is removed by the user in an
explicit way, for instance using the [`DEL`]({{< relref "/commands/del" >}}) command.

The `EXPIRE` family of commands is able to associate an expire to a given key,
at the cost of some additional memory used by the key.
When a key has an expire set, Redis will make sure to remove the key when the
specified amount of time elapsed.

The key time to live can be updated or entirely removed using the `EXPIRE` and
[`PERSIST`]({{< relref "/commands/persist" >}}) command (or other strictly related commands).

### Expire accuracy

In Redis 2.4 the expire might not be pin-point accurate, and it could be between
zero to one seconds out.

Since Redis 2.6 the expire error is from 0 to 1 milliseconds.

### Expires and persistence

Keys expiring information is stored as absolute Unix timestamps (in milliseconds
in case of Redis version 2.6 or greater).
This means that the time is flowing even when the Redis instance is not active.

For expires to work well, the computer time must be taken stable.
If you move an RDB file from two computers with a big desync in their clocks,
funny things may happen (like all the keys loaded to be expired at loading
time).

Even running instances will always check the computer clock, so for instance if
you set a key with a time to live of 1000 seconds, and then set your computer
time 2000 seconds in the future, the key will be expired immediately, instead of
lasting for 1000 seconds.

### How Redis expires keys

Redis keys are expired in two ways: a passive way and an active way.

A key is passively expired when a client tries to access it and the
key is timed out.

However, this is not enough as there are expired keys that will never be
accessed again.
These keys should be expired anyway, so periodically, Redis tests a few keys at
random amongst the set of keys with an expiration.
All the keys that are already expired are deleted from the keyspace.

### How expires are handled in the replication link and AOF file

In order to obtain a correct behavior without sacrificing consistency, when a
key expires, a [`DEL`]({{< relref "/commands/del" >}}) operation is synthesized in both the AOF file and gains all
the attached replicas nodes.
This way the expiration process is centralized in the master instance, and there
is no chance of consistency errors.

However while the replicas connected to a master will not expire keys
independently (but will wait for the [`DEL`]({{< relref "/commands/del" >}}) coming from the master), they'll
still take the full state of the expires existing in the dataset, so when a
replica is elected to master it will be able to expire the keys independently,
fully acting as a master.

### Redis Query Engine and expiration

Starting with Redis 8, the Redis Query Engine has enhanced behavior when handling expiring keys. For detailed information about how [`FT.SEARCH`]({{< relref "/commands/ft.search" >}}) and [`FT.AGGREGATE`]({{< relref "/commands/ft.aggregate" >}}) commands interact with expiring keys, see [Key and field expiration behavior]({{< relref "/develop/ai/search-and-query/advanced-concepts/expiration" >}}).

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="expire-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the timeout was not set; for example, the key doesn't exist, or the operation was skipped because of the provided arguments.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the timeout was set.

-tab-sep-

One of the following:
* [Integer reply](../../develop/reference/protocol-spec#integers): `0` if the timeout was not set; for example, the key doesn't exist, or the operation was skipped because of the provided arguments.
* [Integer reply](../../develop/reference/protocol-spec#integers): `1` if the timeout was set.

{{< /multitabs >}}

---
acl_categories:
- '@write'
- '@string'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: value
  name: value
  type: string
- arguments:
  - display_text: nx
    name: nx
    token: NX
    type: pure-token
  - display_text: xx
    name: xx
    token: XX
    type: pure-token
  - display_text: ifeq-value
    name: ifeq-value
    since: 8.4.0
    token: IFEQ
    type: string
  - display_text: ifne-value
    name: ifne-value
    since: 8.4.0
    token: IFNE
    type: string
  - display_text: ifdeq-digest
    name: ifdeq-digest
    since: 8.4.0
    token: IFDEQ
    type: integer
  - display_text: ifdne-digest
    name: ifdne-digest
    since: 8.4.0
    token: IFDNE
    type: integer
  name: condition
  optional: true
  since: 2.6.12
  type: oneof
- display_text: get
  name: get
  optional: true
  since: 6.2.0
  token: GET
  type: pure-token
- arguments:
  - display_text: seconds
    name: seconds
    since: 2.6.12
    token: EX
    type: integer
  - display_text: milliseconds
    name: milliseconds
    since: 2.6.12
    token: PX
    type: integer
  - display_text: unix-time-seconds
    name: unix-time-seconds
    since: 6.2.0
    token: EXAT
    type: unix-time
  - display_text: unix-time-milliseconds
    name: unix-time-milliseconds
    since: 6.2.0
    token: PXAT
    type: unix-time
  - display_text: keepttl
    name: keepttl
    since: 6.0.0
    token: KEEPTTL
    type: pure-token
  name: expiration
  optional: true
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
- denyoom
complexity: O(1)
description: Sets the string value of a key, ignoring its type. The key is created
  if it doesn't exist.
group: string
hidden: false
history:
- - 2.6.12
  - Added the `EX`, `PX`, `NX` and `XX` options.
- - 6.0.0
  - Added the `KEEPTTL` option.
- - 6.2.0
  - Added the `GET`, `EXAT` and `PXAT` option.
- - 7.0.0
  - Allowed the `NX` and `GET` options to be used together.
- - 8.4.0
  - Added 'IFEQ', 'IFNE', 'IFDEQ', 'IFDNE' options.
key_specs:
- RW: true
  access: true
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
  notes: RW and ACCESS due to the optional `GET` argument
  update: true
  variable_flags: true
linkTitle: SET
since: 1.0.0
summary: Sets the string value of a key, ignoring its type. The key is created if
  it doesn't exist.
syntax_fmt: "SET key value [NX | XX | IFEQ\_ifeq-value | IFNE\_ifne-value |\n\
  \  IFDEQ\_ifdeq-digest | IFDNE\_ifdne-digest] [GET] [EX\_seconds |\n  PX\_milliseconds\
  \ | EXAT\_unix-time-seconds |\n  PXAT\_unix-time-milliseconds | KEEPTTL]"
syntax_str: "value [NX | XX | IFEQ\_ifeq-value | IFNE\_ifne-value | IFDEQ\_ifdeq-digest\
  \ | IFDNE\_ifdne-digest] [GET] [EX\_seconds | PX\_milliseconds | EXAT\_unix-time-seconds\
  \ | PXAT\_unix-time-milliseconds | KEEPTTL]"
title: SET
---

Set `key` to hold the string `value`.
If `key` already holds a value, it is overwritten, regardless of its type.
Any previous time to live associated with the key is discarded on successful `SET` operation.

## Options

The `SET` command supports a set of options that modify its behavior:

* `EX` *seconds* -- Set the specified expire time, in seconds (a positive integer).
* `PX` *milliseconds* -- Set the specified expire time, in milliseconds (a positive integer).
* `EXAT` *timestamp-seconds* -- Set the specified Unix time at which the key will expire, in seconds (a positive integer).
* `PXAT` *timestamp-milliseconds* -- Set the specified Unix time at which the key will expire, in milliseconds (a positive integer).
* `NX` -- Only set the key if it does not already exist.
* `XX` -- Only set the key if it already exists.
* `IFEQ ifeq-value` -- Set the key’s value and expiration only if its current value is equal to `ifeq-value`. If the key doesn’t exist, it won’t be created.
* `IFNE ifne-value` -- Set the key’s value and expiration only if its current value is not equal to `ifne-value`. If the key doesn’t exist, it will be created.
* `IFDEQ ifeq-digest` -- Set the key’s value and expiration only if the digest of its current value is equal to `ifeq-digest`. If the key doesn’t exist, it won’t be created.
* `IFDNE ifne-digest` -- Set the key’s value and expiration only if the digest of its current value is not equal to `ifne-digest`. If the key doesn’t exist, it will be created.
* `KEEPTTL` -- Retain the time to live associated with the key.
* `GET` -- Return the old string stored at key, or nil if key did not exist. An error is returned and `SET` aborted if the value stored at key is not a string.

Note: Since the `SET` command options can replace [`SETNX`]({{< relref "/commands/setnx" >}}), [`SETEX`]({{< relref "/commands/setex" >}}), [`PSETEX`]({{< relref "/commands/psetex" >}}), [`GETSET`]({{< relref "/commands/getset" >}}), it is possible that in future versions of Redis these commands will be deprecated and finally removed.

## Examples

{{% redis-cli %}}
SET mykey "Hello"
GET mykey

SET anotherkey "will expire in a minute" EX 60
{{% /redis-cli %}}


### Code examples

{{< clients-example set_and_get />}}

## Patterns

**Note:** The following pattern is discouraged in favor of [the Redlock algorithm]({{< relref "/develop/clients/patterns/distributed-locks" >}}) which is only a bit more complex to implement, but offers better guarantees and is fault tolerant.

The command `SET resource-name anystring NX EX max-lock-time` is a simple way to implement a locking system with Redis.

A client can acquire the lock if the above command returns `OK` (or retry after some time if the command returns Nil), and remove the lock just using [`DEL`]({{< relref "/commands/del" >}}).

The lock will be auto-released after the expire time is reached.

It is possible to make this system more robust modifying the unlock schema as follows:

* Instead of setting a fixed string, set a non-guessable large random string, called token.
* Instead of releasing the lock with [`DEL`]({{< relref "/commands/del" >}}), send a script that only removes the key if the value matches.

This avoids that a client will try to release the lock after the expire time deleting the key created by another client that acquired the lock later.

An example of unlock script would be similar to the following:

    if redis.call("get",KEYS[1]) == ARGV[1]
    then
        return redis.call("del",KEYS[1])
    else
        return 0
    end

The script should be called with `EVAL ...script... 1 resource-name token-value`

## Return information

{{< multitabs id="set-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* If `GET` was not specified, one of the following:
  * [Null bulk string reply](../../develop/reference/protocol-spec#bulk-strings) in the following two cases.
    * The key doesn’t exist and `XX/IFEQ/IFDEQ` was specified. The key was not created.
    * The key exists, and `NX` was specified or a specified `IFEQ/IFNE/IFDEQ/IFDNE` condition is false. The key was not set.
  * [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`: The key was set.
* If `GET` was specified, one of the following:
  * [Null bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The key didn't exist before the `SET` operation, whether the key was created of not.
  * [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The previous value of the key, whether the key was set or not.

-tab-sep-

* If `GET` was not specified, one of the following:
  * [Null reply](../../develop/reference/protocol-spec#nulls) in the following two cases.
    * The key doesn’t exist and `XX/IFEQ/IFDEQ` was specified. The key was not created.
    * The key exists, and `NX` was specified or a specified `IFEQ/IFNE/IFDEQ/IFDNE` condition is false. The key was not set.
  * [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`: The key was set.
* If `GET` was specified, one of the following:
  * [Null reply](../../develop/reference/protocol-spec#nulls): The key didn't exist before the `SET` operation, whether the key was created of not.
  * [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): The previous value of the key, whether the key was set or not.

{{< /multitabs >}}

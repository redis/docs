---
acl_categories:
- '@keyspace'
- '@write'
- '@slow'
- '@dangerous'
arguments:
- display_text: host
  name: host
  type: string
- display_text: port
  name: port
  type: integer
- arguments:
  - display_text: key
    key_spec_index: 0
    name: key
    type: key
  - display_text: empty-string
    name: empty-string
    token: ''
    type: pure-token
  name: key-selector
  type: oneof
- display_text: destination-db
  name: destination-db
  type: integer
- display_text: timeout
  name: timeout
  type: integer
- display_text: copy
  name: copy
  optional: true
  since: 3.0.0
  token: COPY
  type: pure-token
- display_text: replace
  name: replace
  optional: true
  since: 3.0.0
  token: REPLACE
  type: pure-token
- arguments:
  - display_text: password
    name: auth
    since: 4.0.7
    token: AUTH
    type: string
  - arguments:
    - display_text: username
      name: username
      type: string
    - display_text: password
      name: password
      type: string
    name: auth2
    since: 6.0.0
    token: AUTH2
    type: block
  name: authentication
  optional: true
  type: oneof
- display_text: key
  key_spec_index: 1
  multiple: true
  name: keys
  optional: true
  since: 3.0.6
  token: KEYS
  type: key
arity: -6
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
- movablekeys
complexity: This command actually executes a DUMP+DEL in the source instance, and
  a RESTORE in the target instance. See the pages of these commands for time complexity.
  Also an O(N) data transfer between the two instances is performed.
description: Atomically transfers a key from one Redis instance to another.
group: generic
hidden: false
hints:
- nondeterministic_output
history:
- - 3.0.0
  - Added the `COPY` and `REPLACE` options.
- - 3.0.6
  - Added the `KEYS` option.
- - 4.0.7
  - Added the `AUTH` option.
- - 6.0.0
  - Added the `AUTH2` option.
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 3
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
- RW: true
  access: true
  begin_search:
    spec:
      keyword: KEYS
      startfrom: -2
    type: keyword
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: -1
      limit: 0
    type: range
  incomplete: true
linkTitle: MIGRATE
railroad_diagram: /images/railroad/migrate.svg
since: 2.6.0
summary: Atomically transfers a key from one Redis instance to another.
syntax_fmt: "MIGRATE host port <key | \"\"> destination-db timeout [COPY] [REPLACE]\n\
  \  [AUTH\_password | AUTH2\_username password] [KEYS\_key [key ...]]"
syntax_str: "port <key | \"\"> destination-db timeout [COPY] [REPLACE] [AUTH\_password\
  \ | AUTH2\_username password] [KEYS\_key [key ...]]"
title: MIGRATE
---
Atomically transfer a key from a source Redis instance to a destination Redis
instance.
On success the key is deleted from the original instance and is guaranteed to
exist in the target instance.

The command is atomic and blocks the two instances for the time required to
transfer the key, at any given time the key will appear to exist in a given
instance or in the other instance, unless a timeout error occurs. In 3.2 and
above, multiple keys can be pipelined in a single call to `MIGRATE` by passing
the empty string ("") as key and adding the `KEYS` clause.

The command internally uses [`DUMP`]({{< relref "/commands/dump" >}}) to generate the serialized version of the key
value, and [`RESTORE`]({{< relref "/commands/restore" >}}) in order to synthesize the key in the target instance.
The source instance acts as a client for the target instance.
If the target instance returns OK to the [`RESTORE`]({{< relref "/commands/restore" >}}) command, the source instance
deletes the key using [`DEL`]({{< relref "/commands/del" >}}).

The timeout specifies the maximum idle time in any moment of the communication
with the destination instance in milliseconds.
This means that the operation does not need to be completed within the specified
amount of milliseconds, but that the transfer should make progresses without
blocking for more than the specified amount of milliseconds.

`MIGRATE` needs to perform I/O operations and to honor the specified timeout.
When there is an I/O error during the transfer or if the timeout is reached the
operation is aborted and the special error - `IOERR` returned.
When this happens the following two cases are possible:

* The key may be on both the instances.
* The key may be only in the source instance.

It is not possible for the key to get lost in the event of a timeout, but the
client calling `MIGRATE`, in the event of a timeout error, should check if the
key is _also_ present in the target instance and act accordingly.

When any other error is returned (starting with `ERR`) `MIGRATE` guarantees that
the key is still only present in the originating instance (unless a key with the
same name was also _already_ present on the target instance).

If there are no keys to migrate in the source instance `NOKEY` is returned.
Because missing keys are possible in normal conditions, from expiry for example,
`NOKEY` isn't an error. 

## Migrating multiple keys with a single command call

Starting with Redis 3.0.6 `MIGRATE` supports a new bulk-migration mode that
uses pipelining in order to migrate multiple keys between instances without
incurring in the round trip time latency and other overheads that there are
when moving each key with a single `MIGRATE` call.

In order to enable this form, the `KEYS` option is used, and the normal *key*
argument is set to an empty string. The actual key names will be provided
after the `KEYS` argument itself, like in the following example:

    MIGRATE 192.168.1.34 6379 "" 0 5000 KEYS key1 key2 key3

When this form is used the `NOKEY` status code is only returned when none
of the keys is present in the instance, otherwise the command is executed, even if
just a single key exists.

## Options

* `COPY` -- Do not remove the key from the local instance.
* `REPLACE` -- Replace existing key on the remote instance.
* `KEYS` -- If the key argument is an empty string, the command will instead migrate all the keys that follow the `KEYS` option (see the above section for more info).
* `AUTH` -- Authenticate with the given password to the remote instance.
* `AUTH2` -- Authenticate with the given username and password pair (Redis 6 or greater ACL auth style).

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="migrate-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` on success.
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `NOKEY` when no keys were found in the source instance.

-tab-sep-

One of the following:
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` on success.
* [Simple string reply](../../develop/reference/protocol-spec#simple-strings): `NOKEY` when no keys were found in the source instance.

{{< /multitabs >}}

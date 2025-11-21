---
acl_categories:
- '@keyspace'
- '@write'
- '@slow'
- '@dangerous'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- display_text: ttl
  name: ttl
  type: integer
- display_text: serialized-value
  name: serialized-value
  type: string
- display_text: replace
  name: replace
  optional: true
  since: 3.0.0
  token: REPLACE
  type: pure-token
- display_text: absttl
  name: absttl
  optional: true
  since: 5.0.0
  token: ABSTTL
  type: pure-token
- display_text: seconds
  name: seconds
  optional: true
  since: 5.0.0
  token: IDLETIME
  type: integer
- display_text: frequency
  name: frequency
  optional: true
  since: 5.0.0
  token: FREQ
  type: integer
arity: -4
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
complexity: O(1) to create the new key and additional O(N*M) to reconstruct the serialized
  value, where N is the number of Redis objects composing the value and M their average
  size. For small string values the time complexity is thus O(1)+O(1*M) where M is
  small, so simply O(1). However for sorted set values the complexity is O(N*M*log(N))
  because inserting values into sorted sets is O(log(N)).
description: Creates a key from the serialized representation of a value.
group: generic
hidden: false
history:
- - 3.0.0
  - Added the `REPLACE` modifier.
- - 5.0.0
  - Added the `ABSTTL` modifier.
- - 5.0.0
  - Added the `IDLETIME` and `FREQ` options.
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
  update: true
linkTitle: RESTORE
since: 2.6.0
summary: Creates a key from the serialized representation of a value.
syntax_fmt: "RESTORE key ttl serialized-value [REPLACE] [ABSTTL]\n  [IDLETIME\_seconds]\
  \ [FREQ\_frequency]"
syntax_str: "ttl serialized-value [REPLACE] [ABSTTL] [IDLETIME\_seconds] [FREQ\_frequency]"
title: RESTORE
---
Create a key associated with a value that is obtained by deserializing the
provided serialized value (obtained via [`DUMP`]({{< relref "/commands/dump" >}})).

If `ttl` is 0 the key is created without any expire, otherwise the specified
expire time (in milliseconds) is set.

If the `ABSTTL` modifier was used, `ttl` should represent an absolute
[Unix timestamp][hewowu] (in milliseconds) in which the key will expire.

[hewowu]: http://en.wikipedia.org/wiki/Unix_time

For eviction purposes, you may use the `IDLETIME` or `FREQ` modifiers. See
[`OBJECT`]({{< relref "/commands/object" >}}) for more information.

`RESTORE` will return a "Target key name is busy" error when `key` already
exists unless you use the `REPLACE` modifier.

`RESTORE` checks the RDB version and data checksum.
If they don't match an error is returned.

## Examples

```
redis> DEL mykey
0
redis> RESTORE mykey 0 "\n\x17\x17\x00\x00\x00\x12\x00\x00\x00\x03\x00\
                        x00\xc0\x01\x00\x04\xc0\x02\x00\x04\xc0\x03\x00\
                        xff\x04\x00u#<\xc0;.\xe9\xdd"
OK
redis> TYPE mykey
list
redis> LRANGE mykey 0 -1
1) "1"
2) "2"
3) "3"
```

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported">&#x274c; Active-Active\*</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Not supported">&#x274c; Active-Active\*</nobr></span> | \*Only supported for module keys. |

## Return information

{{< multitabs id="restore-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK`.

{{< /multitabs >}}

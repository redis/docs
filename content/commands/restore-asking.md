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
- asking
complexity: O(1) to create the new key and additional O(N*M) to reconstruct the serialized
  value, where N is the number of Redis objects composing the value and M their average
  size. For small string values the time complexity is thus O(1)+O(1*M) where M is
  small, so simply O(1). However for sorted set values the complexity is O(N*M*log(N))
  because inserting values into sorted sets is O(log(N)).
description: An internal command for migrating keys in a cluster.
doc_flags:
- syscmd
group: server
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
linkTitle: RESTORE-ASKING
railroad_diagram: /images/railroad/restore-asking.svg
since: 3.0.0
summary: An internal command for migrating keys in a cluster.
syntax_fmt: "RESTORE-ASKING key ttl serialized-value [REPLACE] [ABSTTL]\n  [IDLETIME\_\
  seconds] [FREQ\_frequency]"
syntax_str: "ttl serialized-value [REPLACE] [ABSTTL] [IDLETIME\_seconds] [FREQ\_frequency]"
title: RESTORE-ASKING
---
The `RESTORE-ASKING` command is an internal command.
It is used by a Redis cluster master during slot migration.

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |

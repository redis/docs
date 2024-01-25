---
acl_categories:
- '@keyspace'
- '@write'
- '@slow'
arguments:
- display_text: source
  key_spec_index: 0
  name: source
  type: key
- display_text: destination
  key_spec_index: 1
  name: destination
  type: key
- display_text: destination-db
  name: destination-db
  optional: true
  token: DB
  type: integer
- display_text: replace
  name: replace
  optional: true
  token: REPLACE
  type: pure-token
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
complexity: O(N) worst case for collections, where N is the number of nested items.
  O(1) for string values.
description: Copies the value of a key to a new key.
group: generic
hidden: false
key_specs:
- RO: true
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
- OW: true
  begin_search:
    spec:
      index: 2
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: COPY
since: 6.2.0
summary: Copies the value of a key to a new key.
syntax_fmt: "COPY source destination [DB\_destination-db] [REPLACE]"
syntax_str: "destination [DB\_destination-db] [REPLACE]"
title: COPY
---
This command copies the value stored at the `source` key to the `destination`
key.

By default, the `destination` key is created in the logical database used by the
connection. The `DB` option allows specifying an alternative logical database
index for the destination key.

The command returns zero when the `destination` key already exists. The
`REPLACE` option removes the `destination` key before copying the value to it.

## Examples

```
SET dolly "sheep"
COPY dolly clone
GET clone
```

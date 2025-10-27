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
- arguments:
  - display_text: ifeq-value
    name: ifeq-value
    token: IFEQ
    type: string
  - display_text: ifne-value
    name: ifne-value
    token: IFNE
    type: string
  - display_text: ifdeq-digest
    name: ifdeq-digest
    token: IFDEQ
    type: integer
  - display_text: ifdne-digest
    name: ifdne-digest
    token: IFDNE
    type: integer
  name: condition
  optional: true
  type: oneof
arity: -2
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
complexity: O(1) for IFEQ/IFNE, O(N) for IFDEQ/IFDNE where N is the length of the
  string value.
description: Conditionally removes the specified key based on value or digest comparison.
group: string
hidden: false
key_specs:
- RW: true
  begin_search:
    spec:
      index: 1
    type: index
  delete: true
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
linkTitle: DELEX
since: 8.4.0
summary: Conditionally removes the specified key based on value or digest comparison.
syntax_fmt: "DELEX key [IFEQ\_ifeq-value | IFNE\_ifne-value | IFDEQ\_ifdeq-digest\
  \ |\n  IFDNE\_ifdne-digest]"
syntax_str: "[IFEQ\_ifeq-value | IFNE\_ifne-value | IFDEQ\_ifdeq-digest | IFDNE\_\
  ifdne-digest]"
title: DELEX
---

Conditionally removes the specified key based on value or digest comparison.

## Options

The DELEX command supports a set of options that modify its behavior:

* `IFEQ value` -- Remove the key if the value is equal to the specified value.
* `IFNE value` -- Remove the key if the value is not equal to the specified value.
* `IFDEQ digest` -- Remove the key if the digest is equal to the specified digest.
* `IFDNE digest` -- Remove the key if the digest is not equal to the specified digest.

In 8.4, keys must be of type string.

## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
- [Error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if key exists but holds a value that is not a string and `IFEQ/IFNE/IFDEQ/IFDNE` is specified.
- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): 0 if not deleted (the key does not exist or a specified `IFEQ/IFNE/IFDEQ/IFDNE` condition is false), or 1 if deleted.

-tab-sep-

TODO: Add RESP3 return information

{{< /multitabs >}}


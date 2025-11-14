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
complexity: O(1) for IFEQ/IFNE, O(N) for IFDEQ/IFDNE where N is the length of the string value.
description: Conditionally removes the specified key based on value or hash digest comparison.
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
summary: Conditionally removes the specified key based on value or hash digest comparison.
syntax_fmt: "DELEX key [IFEQ\_ifeq-value | IFNE\_ifne-value | IFDEQ\_ifdeq-digest\
  \ |\n  IFDNE\_ifdne-digest]"
syntax_str: "[IFEQ\_ifeq-value | IFNE\_ifne-value | IFDEQ\_ifdeq-digest | IFDNE\_\
  ifdne-digest]"
title: DELEX
---

Conditionally removes the specified key based on value or hash digest comparison.

## Hash Digest

A hash digest is a fixed-size numerical representation of a string value, computed using the XXH3 hash algorithm. Redis uses this hash digest for efficient comparison operations without needing to compare the full string content. You can retrieve a key's hash digest using the [`DIGEST`]({{< relref "/commands/digest" >}}) command, which returns it as a hexadecimal string that you can use with the `IFDEQ` and `IFDNE` options, and also the [`SET`]({{< relref "/commands/set" >}}) command's `IFDEQ` and `IFDNE` options.

## Options

The DELEX command supports a set of options that modify its behavior.
Only one of the options can be specified.

* `IFEQ ifeq-value` -- Remove the key if the value is equal to the specified value.
* `IFNE ifne-value` -- Remove the key if the value is not equal to the specified value.
* `IFDEQ ifeq-digest` -- Remove the key if its hash digest is equal to the specified hash digest.
* `IFDNE ifne-digest` -- Remove the key if its hash digest is not equal to the specified hash digest.

In 8.4, keys must be of type string when using one of the options above. If no options are specified, the key is removed regardless of its type.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> | <span title="Not supported">&#x274c; Standard</span><br /><span title="Not supported"><nobr>&#x274c; Active-Active</nobr></span> |  |


## Return information

{{< multitabs id="return-info"
    tab1="RESP2"
    tab2="RESP3" >}}

One of the following:
- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): 0 if not deleted (the key does not exist or a specified `IFEQ/IFNE/IFDEQ/IFDNE` condition is false), or 1 if deleted.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key exists but holds a value that is not a string and one of `IFEQ, IFNE, IFDEQ,` or `IFDNE` is specified.

-tab-sep-

One of the following:
- [Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}}): 0 if not deleted (the key does not exist or a specified `IFEQ/IFNE/IFDEQ/IFDNE` condition is false), or 1 if deleted.
- [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if the key exists but holds a value that is not a string and one of `IFEQ, IFNE, IFDEQ,` or `IFDNE` is specified.

{{< /multitabs >}}

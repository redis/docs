---
acl_categories:
- '@keyspace'
- '@read'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
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
- readonly
complexity: O(1)
description: Returns the logarithmic access frequency counter of a Redis object.
group: generic
hidden: false
hints:
- nondeterministic_output
key_specs:
- RO: true
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
linkTitle: OBJECT FREQ
since: 4.0.0
summary: Returns the logarithmic access frequency counter of a Redis object.
syntax_fmt: OBJECT FREQ key
syntax_str: ''
title: OBJECT FREQ
---
This command returns the logarithmic access frequency counter of a Redis object stored at `<key>`.

The command is only available when the `maxmemory-policy` configuration directive is set to one of the LFU policies.

## Return information

{{< multitabs id="object-freq-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
[Integer reply](../../develop/reference/protocol-spec#integers): the counter's value.
[Nil reply](../../develop/reference/protocol-spec#bulk-strings): if _key_ doesn't exist.

-tab-sep-

One of the following:
[Integer reply](../../develop/reference/protocol-spec#integers): the counter's value.
[Null reply](../../develop/reference/protocol-spec#nulls): if _key_ doesn't exist.

{{< /multitabs >}}

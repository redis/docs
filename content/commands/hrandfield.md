---
acl_categories:
- '@read'
- '@hash'
- '@slow'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
- arguments:
  - display_text: count
    name: count
    type: integer
  - display_text: withvalues
    name: withvalues
    optional: true
    token: WITHVALUES
    type: pure-token
  name: options
  optional: true
  type: block
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
- readonly
complexity: O(N) where N is the number of fields returned
description: Returns one or more random fields from a hash.
group: hash
hidden: false
hints:
- nondeterministic_output
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
linkTitle: HRANDFIELD
since: 6.2.0
summary: Returns one or more random fields from a hash.
syntax_fmt: HRANDFIELD key [count [WITHVALUES]]
syntax_str: '[count [WITHVALUES]]'
title: HRANDFIELD
---
When called with just the `key` argument, return a random field from the hash value stored at `key`.

If the provided `count` argument is positive, return an array of **distinct fields**.
The array's length is either `count` or the hash's number of fields ([`HLEN`]({{< relref "/commands/hlen" >}})), whichever is lower.

If called with a negative `count`, the behavior changes and the command is allowed to return the **same field multiple times**.
In this case, the number of returned fields is the absolute value of the specified `count`.

The optional `WITHVALUES` modifier changes the reply so it includes the respective values of the randomly selected hash fields.

## Examples

{{% redis-cli %}}
HSET coin heads obverse tails reverse edge null
HRANDFIELD coin
HRANDFIELD coin
HRANDFIELD coin -5 WITHVALUES
{{% /redis-cli %}}


## Specification of the behavior when count is passed

When the `count` argument is a positive value this command behaves as follows:

* No repeated fields are returned.
* If `count` is bigger than the number of fields in the hash, the command will only return the whole hash without additional fields.
* The order of fields in the reply is not truly random, so it is up to the client to shuffle them if needed.

When the `count` is a negative value, the behavior changes as follows:

* Repeating fields are possible.
* Exactly `count` fields, or an empty array if the hash is empty (non-existing key), are always returned.
* The order of fields in the reply is truly random.

## Return information

{{< multitabs id="hrandfield-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

Any of the following:
* [Nil reply](../../develop/reference/protocol-spec#bulk-strings): if the key doesn't exist
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a single, randomly selected field when the `count` option is not used
* [Array reply](../../develop/reference/protocol-spec#arrays): a list containing `count` fields when the `count` option is used, or an empty array if the key does not exists.
* [Array reply](../../develop/reference/protocol-spec#arrays): a list of fields and their values when `count` and `WITHVALUES` were both used.

-tab-sep-

Any of the following:
* [Null reply](../../develop/reference/protocol-spec#nulls): if the key doesn't exist
* [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings): a single, randomly selected field when the `count` option is not used
* [Array reply](../../develop/reference/protocol-spec#arrays): a list containing `count` fields when the `count` option is used, or an empty array if the key does not exists.
* [Array reply](../../develop/reference/protocol-spec#arrays): a list of fields and their values when `count` and `WITHVALUES` were both used.

{{< /multitabs >}}

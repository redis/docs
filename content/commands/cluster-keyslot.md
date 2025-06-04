---
acl_categories:
- '@slow'
arguments:
- display_text: key
  name: key
  type: string
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
- stale
complexity: O(N) where N is the number of bytes in the key
description: Returns the hash slot for a key.
group: cluster
hidden: false
linkTitle: CLUSTER KEYSLOT
since: 3.0.0
summary: Returns the hash slot for a key.
syntax_fmt: CLUSTER KEYSLOT key
syntax_str: ''
title: CLUSTER KEYSLOT
---
Returns an integer identifying the hash slot the specified key hashes to.
This command is mainly useful for debugging and testing, since it exposes
via an API the underlying Redis implementation of the hashing algorithm.
Example use cases for this command:

1. Client libraries may use Redis in order to test their own hashing algorithm, generating random keys and hashing them with both their local implementation and using Redis `CLUSTER KEYSLOT` command, then checking if the result is the same.
2. Humans may use this command in order to check what is the hash slot, and then the associated Redis Cluster node, responsible for a given key.

## Example

```
> CLUSTER KEYSLOT somekey
(integer) 11058
> CLUSTER KEYSLOT foo{hash_tag}
(integer) 2515
> CLUSTER KEYSLOT bar{hash_tag}
(integer) 2515
```

Note that the command implements the full hashing algorithm, including support for **hash tags**, that is the special property of Redis Cluster key hashing algorithm, of hashing just what is between `{` and `}` if such a pattern is found inside the key name, in order to force multiple keys to be handled by the same node.

## Return information

{{< multitabs id="cluster-keyslot-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): The hash slot number for the specified key

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): The hash slot number for the specified key

{{< /multitabs >}}

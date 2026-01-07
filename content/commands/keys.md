---
acl_categories:
- '@keyspace'
- '@read'
- '@slow'
- '@dangerous'
arguments:
- display_text: pattern
  name: pattern
  type: pattern
arity: 2
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
complexity: O(N) with N being the number of keys in the database, under the assumption
  that the key names in the database and the given pattern have limited length.
description: Returns all key names that match a pattern.
group: generic
hidden: false
hints:
- request_policy:all_shards
- nondeterministic_output_order
linkTitle: KEYS
railroad_diagram: /images/railroad/keys.svg
since: 1.0.0
summary: Returns all key names that match a pattern.
syntax_fmt: KEYS pattern
title: KEYS
---
{{< note >}}
This command is affected by cross-slot operations. See the [multi-key operations]({{< relref "/develop/using-commands/multi-key-operations" >}}) page for more information.
{{< /note >}}


Returns all keys matching `pattern`.

While the time complexity for this operation is O(N), the constant times are
fairly low.
For example, Redis running on an entry level laptop can scan a 1 million key
database in 40 milliseconds.

**Warning**: consider `KEYS` as a command that should only be used in production
environments with extreme care.
It may ruin performance when it is executed against large databases.
This command is intended for debugging and special operations, such as changing
your keyspace layout.
Don't use `KEYS` in your regular application code.
If you're looking for a way to find keys in a subset of your keyspace, consider
using [`SCAN`]({{< relref "/commands/scan" >}}) or [sets]({{< relref "/develop/data-types/sets" >}}).

Supported glob-style patterns:

* `h?llo` matches `hello`, `hallo` and `hxllo`
* `h*llo` matches `hllo` and `heeeello`
* `h[ae]llo` matches `hello` and `hallo,` but not `hillo`
* `h[^e]llo` matches `hallo`, `hbllo`, ... but not `hello`
* `h[a-b]llo` matches `hallo` and `hbllo`

Use `\` to escape special characters if you want to match them verbatim.

When using [Redis Cluster]({{< relref "/operate/oss_and_stack/management/scaling" >}}), the search is optimized for patterns that imply a single slot.
If a pattern can only match keys of one slot,
Redis only iterates over keys in that slot, rather than the whole database,
when searching for keys matching the pattern.
For example, with the pattern `{a}h*llo`, Redis would only try to match it with the keys in slot 15495, which hash tag `{a}` implies.
To use pattern with hash tag, see [Hash tags]({{< relref "operate/oss_and_stack/reference/cluster-spec#hash-tags" >}}) in the Cluster specification for more information.

## Examples

{{% redis-cli %}}
MSET firstname Jack lastname Stuntman age 35
KEYS *name*
KEYS a??
KEYS *
{{% /redis-cli %}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="keys-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of keys matching _pattern_.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): a list of keys matching _pattern_.

{{< /multitabs >}}

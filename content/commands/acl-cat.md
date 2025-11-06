---
acl_categories:
- '@slow'
arguments:
- display_text: category
  name: category
  optional: true
  type: string
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
- noscript
- loading
- stale
complexity: O(1) since the categories and commands are a fixed set.
description: Lists the ACL categories, or the commands inside a category.
group: server
hidden: false
linkTitle: ACL CAT
railroad_diagram: /images/railroad/acl-cat.svg
since: 6.0.0
summary: Lists the ACL categories, or the commands inside a category.
syntax_fmt: ACL CAT [category]
syntax_str: ''
title: ACL CAT
---
The command shows the available ACL categories if called without arguments.
If a category name is given, the command shows all the Redis commands in
the specified category.

ACL categories are very useful in order to create ACL rules that include or
exclude a large set of commands at once, without specifying every single
command. For instance, the following rule will let the user `karin` perform
everything but the most dangerous operations that may affect the server
stability:

    ACL SETUSER karin on +@all -@dangerous

We first add all the commands to the set of commands that `karin` is able
to execute, but then we remove all the dangerous commands.

Checking for all the available categories is as simple as:

```
> ACL CAT
 1) "keyspace"
 2) "read"
 3) "write"
 4) "set"
 5) "sortedset"
 6) "list"
 7) "hash"
 8) "string"
 9) "bitmap"
10) "hyperloglog"
11) "geo"
12) "stream"
13) "pubsub"
14) "admin"
15) "fast"
16) "slow"
17) "blocking"
18) "dangerous"
19) "connection"
20) "transaction"
21) "scripting"
22) "json"
23) "search"
24) "tdigest"
25) "cms"
26) "bloom"
27) "cuckoo"
28) "topk"
29) "timeseries"
```

Then we may want to know what commands are part of a given category:

```
> ACL CAT dangerous
 1) "flushdb"
 2) "acl"
 3) "slowlog"
 4) "debug"
 5) "role"
 6) "keys"
 7) "pfselftest"
 8) "client"
 9) "bgrewriteaof"
10) "replicaof"
11) "monitor"
12) "restore-asking"
13) "latency"
14) "replconf"
15) "pfdebug"
16) "bgsave"
17) "sync"
18) "config"
19) "flushall"
20) "cluster"
21) "info"
22) "lastsave"
23) "slaveof"
24) "swapdb"
25) "module"
26) "restore"
27) "migrate"
28) "save"
29) "shutdown"
30) "psync"
31) "sort"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | Not supported for [scripts]({{<relref "/develop/programmability">}}). |

## Return information

{{< multitabs id="acl-cat-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): an array of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) elements representing ACL categories or commands in a given category.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors): the command returns an error if an invalid category name is given.

-tab-sep-

One of the following:
* [Array reply](../../develop/reference/protocol-spec#arrays): an array of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) elements representing ACL categories or commands in a given category.
* [Simple error reply](../../develop/reference/protocol-spec#simple-errors): the command returns an error if an invalid category name is given.

{{< /multitabs >}}

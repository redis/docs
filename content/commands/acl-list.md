---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
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
- admin
- noscript
- loading
- stale
complexity: O(N). Where N is the number of configured users.
description: Dumps the effective rules in ACL file format.
group: server
hidden: false
linkTitle: ACL LIST
since: 6.0.0
summary: Dumps the effective rules in ACL file format.
syntax_fmt: ACL LIST
syntax_str: ''
title: ACL LIST
---
The command shows the currently active ACL rules in the Redis server. Each
line in the returned array defines a different user, and the format is the
same used in the redis.conf file or the external ACL file, so you can
cut and paste what is returned by the ACL LIST command directly inside a
configuration file if you wish (but make sure to check [`ACL SAVE`]({{< relref "/commands/acl-save" >}})).

## Examples

```
> ACL LIST
1) "user antirez on #9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08 ~objects:* &* +@all -@admin -@dangerous"
2) "user default on nopass ~* &* +@all"
```

{{< note >}}
In some cases, you might see `allchannels` instead of `&*` and `allkeys` instead of `~*` in the output. This is because `allchannels` and `allkeys` are aliases for `&*` and `~*` respectively.
{{< /note>}}

## Return information

{{< multitabs id="acl-list-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): an array of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) elements.

-tab-sep-

[Array reply](../../develop/reference/protocol-spec#arrays): an array of [Bulk string reply](../../develop/reference/protocol-spec#bulk-strings) elements.

{{< /multitabs >}}

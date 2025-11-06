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
complexity: O(1)
description: Persists the effective configuration to file.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
linkTitle: CONFIG REWRITE
railroad_diagram: /images/railroad/config-rewrite.svg
since: 2.8.0
summary: Persists the effective configuration to file.
syntax_fmt: CONFIG REWRITE
syntax_str: ''
title: CONFIG REWRITE
---
The `CONFIG REWRITE` command rewrites the `redis.conf` file the server was started with, applying the minimal changes needed to make it reflect the configuration currently used by the server, which may be different compared to the original one because of the use of the [`CONFIG SET`]({{< relref "/commands/config-set" >}}) command.

The rewrite is performed in a very conservative way:

* Comments and the overall structure of the original redis.conf are preserved as much as possible.
* If an option already exists in the old redis.conf file, it will be rewritten at the same position (line number).
* If an option was not already present, but it is set to its default value, it is not added by the rewrite process.
* If an option was not already present, but it is set to a non-default value, it is appended at the end of the file.
* Non used lines are blanked. For instance if you used to have multiple `save` directives, but the current configuration has fewer or none as you disabled RDB persistence, all the lines will be blanked.

CONFIG REWRITE is also able to rewrite the configuration file from scratch if the original one no longer exists for some reason. However if the server was started without a configuration file at all, the CONFIG REWRITE will just return an error.

## Atomic rewrite process

In order to make sure the redis.conf file is always consistent, that is, on errors or crashes you always end with the old file, or the new one, the rewrite is performed with a single `write(2)` call that has enough content to be at least as big as the old file. Sometimes additional padding in the form of comments is added in order to make sure the resulting file is big enough, and later the file gets truncated to remove the padding at the end.

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> |  |

## Return information

{{< multitabs id="config-rewrite-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` when the configuration was rewritten properly. Otherwise an error is returned.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` when the configuration was rewritten properly. Otherwise an error is returned.

{{< /multitabs >}}

---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- display_text: parameter
  multiple: true
  name: parameter
  type: string
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
- admin
- noscript
- loading
- stale
complexity: O(N) when N is the number of configuration parameters provided
description: Returns the effective values of configuration parameters.
group: server
hidden: false
history:
- - 7.0.0
  - Added the ability to pass multiple pattern parameters in one call
linkTitle: CONFIG GET
railroad_diagram: /images/railroad/config-get.svg
since: 2.0.0
summary: Returns the effective values of configuration parameters.
syntax_fmt: CONFIG GET parameter [parameter ...]
title: CONFIG GET
---
The `CONFIG GET` command is used to read the configuration parameters of a
running Redis server.
Not all the configuration parameters are supported in Redis 2.4, while Redis 2.6
can read the whole configuration of a server using this command.

The symmetric command used to alter the configuration at run time is `CONFIG
SET`.

`CONFIG GET` takes multiple arguments, which are glob-style patterns.
Any configuration parameter matching any of the patterns are reported as a list
of key-value pairs.

You can obtain a list of all the supported configuration parameters by typing
`CONFIG GET *` in an open `redis-cli` prompt.

All the supported parameters have the same meaning of the equivalent
configuration parameter used in the [redis.conf]({{< relref "/operate/oss_and_stack/management/config/" >}}) file. The provided link has links to the `redis.conf` files for Redis version 6.2 and greater. See the [Redis souce code repo](https://github.com/redis/redis) for earlier versions.

## Required arguments

<details open><summary><code>parameter [parameter ...]</code></summary>

One or more configuration parameter names or glob-style patterns to retrieve.

</details>

## Examples

```
redis> config get *max-*-entries* maxmemory
 1) "maxmemory"
 2) "0"
 3) "hash-max-listpack-entries"
 4) "512"
 5) "hash-max-ziplist-entries"
 6) "512"
 7) "set-max-intset-entries"
 8) "512"
 9) "zset-max-listpack-entries"
10) "128"
11) "zset-max-ziplist-entries"
12) "128"
```

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | [Only supports a subset of configuration settings.]({{< relref "/operate/rs/references/compatibility/config-settings" >}}) |

## Return information

{{< multitabs id="config-get-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Array reply](../../develop/reference/protocol-spec#arrays): a list of configuration parameters matching the provided arguments.

-tab-sep-

[Map reply](../../develop/reference/protocol-spec#maps): a list of configuration parameters matching the provided arguments.

{{< /multitabs >}}

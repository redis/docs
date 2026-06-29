---
acl_categories:
- '@admin'
- '@slow'
- '@dangerous'
arguments:
- arguments:
  - display_text: parameter
    name: parameter
    type: string
  - display_text: value
    name: value
    type: string
  multiple: true
  name: data
  type: block
arity: -4
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
description: Sets configuration parameters in-flight.
group: server
hidden: false
hints:
- request_policy:all_nodes
- response_policy:all_succeeded
history:
- - 7.0.0
  - Added the ability to set multiple parameters in one call.
linkTitle: CONFIG SET
railroad_diagram: /images/railroad/config-set.svg
since: 2.0.0
summary: Sets configuration parameters in-flight.
syntax_fmt: CONFIG SET parameter value [parameter value ...]
title: CONFIG SET
---
CONFIG SET reconfigures Redis at runtime without restarting the server. You can use it to change simple configuration parameters or switch between persistence options.

Run [CONFIG GET *]({{< relref "/commands/config-get" >}}) to list the configuration parameters that CONFIG SET supports.

All the configuration parameters set using `CONFIG SET` are immediately loaded
by Redis and will take effect starting with the next command executed.

All the supported parameters have the same meaning of the equivalent
configuration parameter used in the [redis.conf]({{< relref "/operate/oss_and_stack/management/config/" >}}) file. The provided link has links to the `redis.conf` files for Redis version 6.2 and greater. See the [Redis souce code repo](https://github.com/redis/redis) for earlier versions.

It is possible to switch persistence from RDB snapshotting to append-only file
(and the other way around) using the `CONFIG SET` command.
See the [persistence page]({{< relref "/operate/oss_and_stack/management/persistence" >}}) for more information.

```
CONFIG SET appendonly yes
```

Setting the `appendonly` parameter as shown above will start a background process to save the initial append-only file
(obtained from the in memory data set), and will append all the subsequent
commands on the append-only file, thus obtaining exactly the same effect of a
Redis server that started with AOF turned on since the start.

You can have both the AOF enabled with RDB snapshotting if you want, the two
options are not mutually exclusive.

## Required arguments

<details open><summary><code>parameter value [parameter value ...]</code></summary>

One or more configuration parameter-value pairs to set.

</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | <span title="Supported">&#x2705; Standard</span><br /><span title="Supported"><nobr>&#x2705; Active-Active</nobr></span> | [Only supports a subset of configuration settings.]({{< relref "/operate/rs/references/compatibility/config-settings" >}}) |

## Return information

{{< multitabs id="config-set-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` when the configuration was set properly. Otherwise an error is returned.

-tab-sep-

[Simple string reply](../../develop/reference/protocol-spec#simple-strings): `OK` when the configuration was set properly. Otherwise an error is returned.

{{< /multitabs >}}

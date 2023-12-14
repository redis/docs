---
Title: Graph commands
alwaysopen: false
categories:
- docs
- operate
- stack
description: Lists graph commands and provides links to the command reference pages.
linkTitle: Commands
toc: 'false'
weight: 25
---

The following table lists graph commands. See the command links for more information about each command's syntax, arguments, and examples.

| Command | Redis Enterprise Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | Description |
|:--------|:----------------------|:-----------------|:-----------------|:------|
| [GRAPH.CONFIG GET](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.config-get.md) | <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[2](#table-note-2)</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Returns the current value of a [RedisGraph configuration parameter](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/configuration.md#redisgraph-configuration-parameters). |
| [GRAPH.CONFIG SET](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.config-set.md) | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[1](#table-note-1)</sup> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[2](#table-note-2)</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Changes the value of a [RedisGraph configuration parameter](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/configuration.md#redisgraph-configuration-parameters). |
| [GRAPH.DELETE](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.delete.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Removes the graph and its entities. |
| [GRAPH.EXPLAIN](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.explain.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Displays the query execution plan but does not run the query. |
| [GRAPH.LIST](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.list.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Lists all graph keys. |
| [GRAPH.PROFILE](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.profile.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs a query and displays the execution plan with metrics for each operation. |
| [GRAPH.QUERY](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.query.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs a query against a graph. Supports a variety of [clauses](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.query.md#query-structure) and [functions](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.query.md#functions). |
| [GRAPH.RO_QUERY](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.ro_query.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs a read-only query against a graph. |
| [GRAPH.SLOWLOG](https://github.com/RedisGraph/RedisGraph/blob/master/docs/commands/graph.slowlog.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns the slowest 10 queries run against a specific graph. |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>Use [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) or the [REST API]({{< relref "/operate/rs/references/rest-api" >}}) to change RedisGraph configuration for Redis Enterprise Software. See [RedisGraph configuration compatibility with Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph/config" >}}) for more information and examples.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>[Contact support](https://redis.com/company/support/) to view the current RedisGraph configuration values or request configuration changes for Flexible or Annual Redis Cloud subscriptions.
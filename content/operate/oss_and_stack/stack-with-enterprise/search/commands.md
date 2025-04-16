---
Title: Search and query commands
alwaysopen: false
categories:
- docs
- operate
- stack
description: Lists search and query commands and provides links to the command reference
  pages.
linkTitle: Commands
toc: 'false'
weight: 10
---

The following table lists search and query commands. See the command links for more information about each command's syntax, arguments, and examples.

| Command | Redis Enterprise Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | Description |
|:--------|:----------------------|:-----------------|:-----------------|:------|
| [FT.AGGREGATE]({{< relref "commands/ft.aggregate" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs a search query on an index and groups, sorts, transforms, limits, and/or filters the results. |
| [FT.ALIASADD]({{< relref "commands/ft.aliasadd" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds an alias to an index.  |
| [FT.ALIASDEL]({{< relref "commands/ft.aliasdel" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Removes an alias from an index. |
| [FT.ALIASUPDATE]({{< relref "commands/ft.aliasupdate" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds an alias to an index. If the alias already exists for a different index, it updates the alias to point to the specified index instead. |
| [FT.ALTER]({{< relref "commands/ft.alter" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds a new field to an index. |
| [FT.CONFIG GET]({{< relref "commands/ft.config-get" >}}) |  <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[2](#table-note-2)</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Displays configuration options. |
| [FT.CONFIG HELP]({{< relref "commands/ft.config-help" >}}) |   <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Describes configuration options. |
| [FT.CONFIG SET]({{< relref "commands/ft.config-set" >}}) | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[1](#table-note-1)</sup> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[2](#table-note-2)</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Sets configuration options. |
| [FT.CREATE]({{< relref "commands/ft.create" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Creates an index. |
| [FT.CURSOR DEL]({{< relref "commands/ft.cursor-del" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Deletes a cursor. |
| [FT.CURSOR&nbsp;READ]({{< relref "commands/ft.cursor-read/" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Reads the next results from an existing cursor. |
| [FT.DICTADD]({{< relref "commands/ft.dictadd" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds terms to a dictionary. |
| [FT.DICTDEL]({{< relref "commands/ft.dictdel" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Deletes terms from a dictionary. |
| [FT.DICTDUMP]({{< relref "commands/ft.dictdump" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns all terms in the specified dictionary. |
| [FT.DROPINDEX]({{< relref "commands/ft.dropindex" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Deletes an index. |
| [FT.EXPLAIN]({{< relref "commands/ft.explain" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns the execution plan for a complex query as a string. |
| [FT.EXPLAINCLI]({{< relref "commands/ft.explaincli" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns the execution plan for a complex query as an [array]({{< relref "develop/reference/protocol-spec/#arrays" >}}). |
| [FT.INFO]({{< relref "commands/ft.info" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns index information and statistics.  |
| [FT._LIST]({{< relref "commands/ft._list" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Lists all indexes. |
| [FT.PROFILE]({{< relref "commands/ft.profile" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs [FT.SEARCH]({{< relref "commands/ft.search" >}}) or [FT.AGGREGATE]({{< relref "commands/ft.aggregate" >}}) and reports performance information. |
| [FT.SEARCH]({{< relref "commands/ft.search" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Searches an index for a text query and returns matching documents or document IDs. |
| [FT.SPELLCHECK]({{< relref "commands/ft.spellcheck" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Suggests spelling corrections for misspelled terms in a query. |
| [FT.SYNDUMP]({{< relref "commands/ft.syndump" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns a list of synonym terms and their synonym group IDs. |
| [FT.SYNUPDATE]({{< relref "commands/ft.synupdate" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Creates or updates a synonym group with additional terms. |
| [FT.TAGVALS]({{< relref "commands/ft.tagvals" >}}) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns all distinct values indexed in a tag field. |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>Use [`rladmin`]({{< relref "/operate/rs/references/cli-utilities/rladmin" >}}) or the [REST API]({{< relref "/operate/rs/references/rest-api" >}}) to change search and query configuration for Redis Enterprise Software. See [search and query configuration compatibility with Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/config" >}}) for more information and examples.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>[Contact support](https://redis.com/company/support/) to view the current configuration values or request configuration changes for Flexible or Annual Redis Cloud subscriptions.

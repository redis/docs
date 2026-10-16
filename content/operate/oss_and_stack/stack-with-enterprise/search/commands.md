---
Title: Redis Search commands
alwaysopen: false
categories:
- docs
- operate
- stack
description: Lists Redis Search commands and provides links to the command reference
  pages.
linkTitle: Commands
toc: 'false'
weight: 10
---

The following table lists Redis Search commands. See the command links for more information about each command's syntax, arguments, and examples.

| Command | Redis Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | Description |
|:--------|:----------------------|:-----------------|:-----------------|:------|
| [FT.AGGREGATE](/content/commands/ft.aggregate.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs a search query on an index and groups, sorts, transforms, limits, and/or filters the results. |
| [FT.ALIASADD](/content/commands/ft.aliasadd.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds an alias to an index.  |
| [FT.ALIASDEL](/content/commands/ft.aliasdel.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Removes an alias from an index. |
| [FT.ALIASLIST](/content/commands/ft.aliaslist.md) | <span title="Not supported">&#x274c; Not supported</span> | <span title="Not supported">&#x274c; Not supported</span> | <span title="Not supported">&#x274c; Not supported</nobr></span> | List aliases for an index. |
| [FT.ALIASUPDATE](/content/commands/ft.aliasupdate.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds an alias to an index. If the alias already exists for a different index, it updates the alias to point to the specified index instead. |
| [FT.ALTER](/content/commands/ft.alter.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds a new field to an index. |
| [FT.CONFIG GET](/content/commands/ft.config-get.md) |  <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[2](#table-note-2)</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Displays configuration options. |
| [FT.CONFIG HELP](/content/commands/ft.config-help.md) |   <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x274c; Not supported</span> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Describes configuration options. |
| [FT.CONFIG SET](/content/commands/ft.config-set.md) | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[1](#table-note-1)</sup> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>[2](#table-note-2)</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> | Sets configuration options. |
| [FT.CREATE](/content/commands/ft.create.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Creates an index. |
| [FT.CURSOR DEL](/content/commands/ft.cursor-del.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Deletes a cursor. |
| [FT.CURSOR&nbsp;READ](/content/commands/ft.cursor-read.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Reads the next results from an existing cursor. |
| [FT.DICTADD](/content/commands/ft.dictadd.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Adds terms to a dictionary. |
| [FT.DICTDEL](/content/commands/ft.dictdel.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Deletes terms from a dictionary. |
| [FT.DICTDUMP](/content/commands/ft.dictdump.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns all terms in the specified dictionary. |
| [FT.DROPINDEX](/content/commands/ft.dropindex.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Deletes an index. |
| [FT.EXPLAIN](/content/commands/ft.explain.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns the execution plan for a complex query as a string. |
| [FT.EXPLAINCLI](/content/commands/ft.explaincli.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns the execution plan for a complex query as an [array](/content/develop/reference/protocol-spec.md#arrays). |
| [FT.HYBRID](/content/commands/ft.hybrid.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Performs hybrid search combining text search and vector similarity with configurable fusion methods. |
| [FT.INFO](/content/commands/ft.info.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns index information and statistics.  |
| [FT._LIST](/content/commands/ft._list.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Lists all indexes. |
| [FT.PROFILE](/content/commands/ft.profile.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Runs [FT.SEARCH](/content/commands/ft.search.md) or [FT.AGGREGATE](/content/commands/ft.aggregate.md) and reports performance information. |
| [FT.SEARCH](/content/commands/ft.search.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Searches an index for a text query and returns matching documents or document IDs. |
| [FT.SPELLCHECK](/content/commands/ft.spellcheck.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Suggests spelling corrections for misspelled terms in a query. |
| [FT.SYNDUMP](/content/commands/ft.syndump.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns a list of synonym terms and their synonym group IDs. |
| [FT.SYNUPDATE](/content/commands/ft.synupdate.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Creates or updates a synonym group with additional terms. |
| [FT.TAGVALS](/content/commands/ft.tagvals.md) | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> | Returns all distinct values indexed in a tag field. |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>Use [`rladmin`](/content/operate/rs/references/cli-utilities/rladmin/_index.md) or the [REST API](/content/operate/rs/references/rest-api/_index.md) to change Redis Search configuration for Redis Software. See [Redis Search configuration compatibility with Redis Software](/content/operate/oss_and_stack/stack-with-enterprise/search/config.md) for more information and examples.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>[Contact support](https://redis.com/company/support/) to view the current configuration values or request configuration changes for Flexible or Annual Redis Cloud subscriptions.

---
acl_categories:
- '@admin'
- '@search'
arguments:
- name: option
  type: string
- name: value
  type: string
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
complexity: O(1)
deprecated_since: 8.0.0
description: Sets runtime configuration options
doc_flags:
- deprecated
group: search
hidden: false
linkTitle: FT.CONFIG SET
module: Search
railroad_diagram: /images/railroad/ft.config-set.svg
replaced_by: '[`CONFIG SET`](/content/commands/config-set.md)'
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Sets runtime configuration options
syntax_fmt: FT.CONFIG SET option value
title: FT.CONFIG SET
---

Set the value of a RediSearch configuration parameter.

Values set using `FT.CONFIG SET` are not persisted after server restart.

RediSearch configuration parameters are detailed in [Configuration parameters](/content/develop/ai/search-and-query/administration/configuration.md).

> [!NOTE]
> As detailed in the link above, not all RediSearch configuration parameters can be set at runtime.

[Examples](#examples)

## Required arguments

<details open>
<summary><code>option</code></summary> 

is name of the configuration option, or '*' for all. 
</details>

<details open>
<summary><code>value</code></summary> 

is value of the configuration option. 
</details>

## Examples

<details open>
<summary><b>Set runtime configuration options</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> FT.CONFIG SET TIMEOUT 42
OK
{{< / highlight >}}
</details>

## Redis Software and Redis Cloud compatibility

| Redis<br />Software | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>1</sup> | <span title="Not supported"><nobr>&#x26A0;&#xFE0F; Not supported</span><sup>2</sup> | <span title="Not supported"><nobr>&#x274c; Not supported</nobr></span> |  |

1. Use [`rladmin`](/content/operate/rs/references/cli-utilities/rladmin/_index.md) or the [REST API](/content/operate/rs/references/rest-api/_index.md) to change search and query configuration for Redis Software. See [search and query configuration compatibility with Redis Software](/content/operate/oss_and_stack/stack-with-enterprise/search/config.md) for more information and examples.

2. [Contact support](https://redis.com/company/support/) to view the current configuration values or request configuration changes for Flexible or Annual Redis Cloud subscriptions.

## Return information

{{< multitabs id="ft-config-set-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings): `OK` if executed correctly.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: invalid option, invalid value.

-tab-sep-

One of the following:
* [Simple string reply](/content/develop/reference/protocol-spec.md#simple-strings): `OK` if executed correctly.
* [Simple error reply](/content/develop/reference/protocol-spec.md#simple-errors) in these cases: invalid option, invalid value.

{{< /multitabs >}}

## See also

[`FT.CONFIG GET`](/content/commands/ft.config-get.md) | [`FT.CONFIG HELP`](/content/commands/ft.config-help.md) 

## Related topics

[RediSearch](/content/develop/ai/search-and-query/_index.md)

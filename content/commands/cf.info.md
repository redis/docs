---
acl_categories:
- '@cuckoo'
- '@read'
- '@fast'
arguments:
- name: key
  type: key
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
complexity: O(1)
description: Returns information about a Cuckoo Filter
group: cf
hidden: false
linkTitle: CF.INFO
module: Bloom
since: 1.0.0
stack_path: docs/data-types/probabilistic
summary: Returns information about a Cuckoo Filter
syntax_fmt: CF.INFO key
syntax_str: ''
title: CF.INFO
---
Returns information about a cuckoo filter.

## Required arguments

<details open><summary><code>key</code></summary>

is key name for a cuckoo filter.
</details>

## Examples

{{< highlight bash >}}
redis> CF.INFO cf
 1) Size
 2) (integer) 1080
 3) Number of buckets
 4) (integer) 512
 5) Number of filter
 6) (integer) 1
 7) Number of items inserted
 8) (integer) 0
 9) Number of items deleted
10) (integer) 0
11) Bucket size
12) (integer) 2
13) Expansion rate
14) (integer) 1
15) Max iteration
16) (integer) 20
{{< / highlight >}}

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |


## Return information

One of the following:

{{< multitabs id="cf-info-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

* [Array reply]({{< relref "/develop/reference/protocol-spec#arrays" >}}) with argument name ([Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})) and value ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})) pairs.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if invalid arguments are passed, `key` does not exist, or `key` is not of the correct type.

-tab-sep-

* [Map reply]({{< relref "/develop/reference/protocol-spec#maps" >}}) with argument name ([Simple string reply]({{< relref "/develop/reference/protocol-spec#simple-strings" >}})) and value ([Integer reply]({{< relref "/develop/reference/protocol-spec#integers" >}})) pairs.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) if invalid arguments are passed, `key` does not exist, or `key` is not of the correct type.

{{< /multitabs >}}
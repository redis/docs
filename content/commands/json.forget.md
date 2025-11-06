---
acl_categories:
- '@json'
- '@write'
- '@slow'
arguments:
- name: key
  type: key
- name: path
  optional: true
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
complexity: O(N) when path is evaluated to a single value where N is the size of the
  deleted value, O(N) when path is evaluated to multiple values, where N is the size
  of the key
description: Deletes a value
group: json
hidden: false
linkTitle: JSON.FORGET
module: JSON
railroad_diagram: /images/railroad/json.forget.svg
since: 1.0.0
stack_path: docs/data-types/json
summary: Deletes a value
syntax_fmt: JSON.FORGET key [path]
syntax_str: '[path]'
title: JSON.FORGET
---
See [`JSON.DEL`]({{< relref "commands/json.del/" >}}).

## Redis Software and Redis Cloud compatibility

| Redis<br />Enterprise | Redis<br />Cloud | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span><br /> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Supported">&#x2705; Free & Fixed</nobr></span> |  |

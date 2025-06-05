---
Title: Check result object
alwaysopen: false
categories:
- docs
- operate
- rs
description: An object that contains the results of a cluster check
linkTitle: check_result
weight: $weight
url: '/operate/rs/7.8/references/rest-api/objects/check_result/'
---

Cluster check result

| Name | Type/Value | Description |
|------|------------|-------------|
| cluster_test_result | boolean | Indication if any of the tests failed |
| nodes | {{<code>}}
[{
  "node_uid": integer,
  "result": boolean,
  "error": string
}, ...]
{{</code>}} | Nodes results |

---
Title: Node identity object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the node_identity object used with Redis Enterprise Software
  REST API calls.
linkTitle: node_identity
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/bootstrap/node_identity/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| bigstore_driver | 'rocksdb' | Bigstore driver name or none (deprecated, use the [cluster object]({{< relref "/operate/rs/7.22/references/rest-api/objects/cluster" >}})'s `bigstore_driver` instead) |
| bigstore_enabled | boolean (default: false) | If `true`, then flash storage is enabled on this node for [Auto Tiering]({{<relref "/operate/rs/7.22/databases/auto-tiering">}}) databases. Configurable during [bootstrapping]({{<relref "/operate/rs/7.22/references/rest-api/requests/bootstrap#post-bootstrap">}}). After bootstrapping, it is read-only. |
| identity | [identity]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/identity" >}}) object | Node identity |
| limits | [limits]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/limits" >}}) object | Node limits |
| paths | [paths]({{< relref "/operate/rs/7.22/references/rest-api/objects/bootstrap/paths" >}}) object | Storage paths object |

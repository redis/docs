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
| bigstore_driver | 'rocksdb' | Bigstore driver name or none (deprecated, use the [cluster object](/content/operate/rs/7.22/references/rest-api/objects/cluster/_index.md)'s `bigstore_driver` instead) |
| bigstore_enabled | boolean (default: false) | If `true`, then flash storage is enabled on this node for [Auto Tiering](/content/operate/rs/7.22/databases/auto-tiering/_index.md) databases. Configurable during [bootstrapping](/content/operate/rs/7.22/references/rest-api/requests/bootstrap/_index.md#post-bootstrap). After bootstrapping, it is read-only. |
| identity | [identity](/content/operate/rs/7.22/references/rest-api/objects/bootstrap/identity.md) object | Node identity |
| limits | [limits](/content/operate/rs/7.22/references/rest-api/objects/bootstrap/limits.md) object | Node limits |
| paths | [paths](/content/operate/rs/7.22/references/rest-api/objects/bootstrap/paths.md) object | Storage paths object |

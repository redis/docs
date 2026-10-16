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
url: '/operate/rs/7.4/references/rest-api/objects/bootstrap/node_identity/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| bigstore_driver | 'rocksdb' | Bigstore driver name or none (deprecated) |
| bigstore_enabled | boolean | Bigstore enabled or disabled |
| identity | [identity](/content/operate/rs/7.4/references/rest-api/objects/bootstrap/identity.md) object | Node identity |
| limits | [limits](/content/operate/rs/7.4/references/rest-api/objects/bootstrap/limits.md) object | Node limits |
| paths | [paths](/content/operate/rs/7.4/references/rest-api/objects/bootstrap/paths.md) object | Storage paths object |

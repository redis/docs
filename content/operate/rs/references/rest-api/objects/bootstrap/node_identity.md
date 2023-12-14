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
---

| Name | Type/Value | Description |
|------|------------|-------------|
| bigstore_driver | 'ibm-capi-ga1'<br />'ibm-capi-ga2'<br />'ibm-capi-ga4'<br />'speedb'<br />'rocksdb' | Bigstore driver name or none |
| identity | [identity]({{< relref "/operate/rs/references/rest-api/objects/bootstrap/identity" >}}) object | Node identity |
| limits | [limits]({{< relref "/operate/rs/references/rest-api/objects/bootstrap/limits" >}}) object | Node limits |
| paths | [paths]({{< relref "/operate/rs/references/rest-api/objects/bootstrap/paths" >}}) object | Storage paths object |

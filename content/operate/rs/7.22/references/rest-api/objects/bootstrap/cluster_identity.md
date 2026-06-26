---
Title: Cluster identity object
alwaysopen: false
categories:
- docs
- operate
- rs
description: Documents the cluster_identity object used with Redis Enterprise Software
  REST API calls.
linkTitle: cluster_identity
weight: $weight
url: '/operate/rs/7.22/references/rest-api/objects/bootstrap/cluster_identity/'
---

| Name | Type/Value | Description |
|------|------------|-------------|
| name          | string                | Fully qualified cluster name. Limited to 64 characters and must comply with the IETF's RFC 952 standard and section 2.1 of the RFC 1123 standard. |
| nodes         | array of strings       | Array of IP addresses of existing cluster nodes |
| wait_command  | boolean (default:&nbsp;true) | Supports Redis wait command |

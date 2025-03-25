---
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Releases with support for Redis Enterprise Software 7.8.4
hideListLinks: true
linkTitle: 7.8.4 releases
title: Redis Enterprise for Kubernetes 7.8.4 release notes
weight: 47
---

Redis Enterprise for Kubernetes 7.8.6-1 includes bug fixes, enhancements, and support for Redis Enterprise Software version 7.8.6-13 .

## Detailed release notes

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}

## Breaking changes

Customers who use load balancers for Active-Active replication endpoints and rely on the change introduced in RED-113626 (or the workaround described in the ticket) must set the spec.externalReplicationPort field in REAADB after upgrading. Otherwise, replication will fail (RED-149374).

## Known limitations


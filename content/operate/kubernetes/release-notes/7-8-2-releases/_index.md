---
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Releases with support for Redis Enterprise Software 7.8.2
hideListLinks: true
linkTitle: 7.8.2-2
title: Redis Enterprise for Kubernetes 7.8.2-2 release notes
weight: 51
---

Redis Enterprise for Kubernetes 7.8.2-2 is a feature release including support for Redis Software 7.8.2-2.

## Detailed release notes

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}

## Breaking changes

The following changes included in this release affect the upgrade process. Please read carefully before upgrading.

### RHEL9-based images

- Redis Enterprise images are now based on RHEL9.
- Ubuntu images are no longer supported.

This means upgrades to 7.8.2-2 require:

- Cluster version of 7.4.2-2 or later.
- Database version 7.2 or later.
- RHEL9 compatible binaries for any modules you need.

See [Upgrade Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes/upgrade/upgrade-redis-cluster">}}) for detailed steps to upgrade to 7.8.2-2.


---
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Releases with support for Redis Enterprise Software 7.22.2
hideListLinks: true
linkTitle: 7.22.2 releases
title: Redis Enterprise for Kubernetes 7.22.2 release notes
weight: 65
---

Redis Enterprise for Kubernetes 7.22.2 includes bug fixes, enhancements, and support for Redis Enterprise Software. The latest release is 7.22.2-37 with support for Redis Enterprise Software version 7.22.2-79.

## Detailed release notes

{{<table-children columnNames="Version&nbsp;(Release&nbsp;date)&nbsp;,Major changes" columnSources="LinkTitle,Description" enableLinks="LinkTitle">}}


## Known limitations

See [7.22.0 releases]({{<relref "/operate/kubernetes/release-notes/7-22-0-releases/">}}) for information on known limitations.

## RHEL9-based image

As of version 7.8.2-6, Redis Enterprise images are based on Red Hat Enterprise Linux 9 (RHEL9). This means upgrades require:

- [Cluster version of 7.4.2-2 or later](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/).
- Database version 7.2 or later.
- RHEL9 compatible binaries for any modules you need.

For detailed steps, see the relevant upgrade page:

- [OpenShift CLI]({{<relref "/operate/kubernetes/upgrade/openshift-cli">}})
- [OpenShift OperatorHub]({{<relref "/operate/kubernetes/upgrade/upgrade-olm">}})
- [Kubernetes]({{<relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}})

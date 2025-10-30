---
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This is a maintenance release with a new version of Redis Enterprise Software 7.4.6.
linkTitle: 7.4.6-2 (October 2024)
title: Redis Enterprise for Kubernetes 7.4.6-2 (October 2024) release notes
weight: 6
---

## Highlights

This is a maintenance release to support [Redis Enterprise Software version 7.4.6-102]({{<relref "/operate/rs/release-notes/rs-7-4-2-releases/">}}). For version changes, supported distributions, and known limitations, see the [release notes for 7-4-6-2 (July 2024)]({{<relref "/operate/kubernetes/release-notes/7-4-6-releases/7-4-6-2">}}).

## Downloads

- **Redis Enterprise**: `redislabs/redis:7.4.6-102`
- **Operator**: `redislabs/operator:7.4.6-2`
- **Services Rigger**: `redislabs/k8s-controller:7.4.6-2`

### OpenShift images

- **Redis Enterprise**: `registry.connect.redhat.com/redislabs/redis-enterprise:7.4.6-102.rhel8-openshift`
- **Operator**: `registry.connect.redhat.com/redislabs/redis-enterprise-operator:7.4.6-2`
- **Services Rigger**: `registry.connect.redhat.com/redislabs/services-manager:7.4.6-2`

### OLM bundle

**Redis Enterprise operator bundle** : `v7.4.6-2.4`

The OLM version v7.4.6-2.4 replaces the earlier v7.4.6-2.3 release for the same Redis software version, providing only upgrade path fixes.

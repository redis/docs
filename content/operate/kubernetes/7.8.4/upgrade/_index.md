---
Title: Upgrade Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Information about upgrading your Redis Enterprise cluster on Kubernetes.
hideListLinks: true
linkTitle: Upgrade
weight: 15
url: '/operate/kubernetes/7.8.4/upgrade/'
---

The upgrade process includes updating three components:

  1. Upgrade the Redis Enterprise operator
  2. Upgrade the Redis Enterprise cluster (REC)
  3. Upgrade Redis Enterprise databases (REDB)

If you are using OpenShift, see [Upgrade Redis Enterprise with OpenShift CLI](/content/operate/kubernetes/7.8.4/upgrade/openshift-cli.md) or [Upgrade Redis Enterprise with OpenShift OperatorHub](/content/operate/kubernetes/7.8.4/upgrade/upgrade-olm.md).

For all other Kubernetes distributions, see [Upgrade Redis Enterprise for Kubernetes](/content/operate/kubernetes/7.8.4/upgrade/upgrade-redis-cluster.md).

## Upgrade compatibility

When upgrading, both your Kubernetes version and Redis operator version need to be supported at all times.

> [!WARNING]
> If your current Kubernetes distribution is not [supported](/content/operate/kubernetes/7.8.4/reference/_index.md), upgrade to a supported distribution before upgrading. 

## RHEL9-based image

As of version 7.8.2-6, Redis Enterprise images are based on Red Hat Enterprise Linux 9 (RHEL9). This means upgrades require:

- [Cluster version of 7.4.2-2 or later](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/).
- Database version 7.2 or later.
- RHEL9 compatible binaries for any modules you need.

For detailed steps, see the relevant upgrade page:

- [OpenShift CLI](/content/operate/kubernetes/7.8.4/upgrade/openshift-cli.md)
- [OpenShift OperatorHub](/content/operate/kubernetes/7.8.4/upgrade/upgrade-olm.md)
- [Kubernetes](/content/operate/kubernetes/7.8.4/upgrade/upgrade-redis-cluster.md)

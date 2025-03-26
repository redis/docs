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
bannerText: This page applies to version [7.8.2-6 and above](https://redis.io/docs/latest/operate/kubernetes/release-notes/7-8-2-releases). To install older versions, see the [7.4.6 documentation](https://redis.io/docs/latest/operate/kubernetes/7.4.6/).
bannerChildren: true
url: '/operate/kubernetes/7.8.4/kubernetes/upgrade/'
---

The upgrade process includes updating three components:

  1. Upgrade the Redis Enterprise operator
  2. Upgrade the Redis Enterprise cluster (REC)
  3. Upgrade Redis Enterprise databases (REDB)

If you are using OpenShift, see [Upgrade Redis Enterprise with OpenShift CLI]({{<relref "/operate/kubernetes/upgrade/openshift-cli">}}) or [Upgrade Redis Enterprise with OpenShift OperatorHub]({{<relref "/operate/kubernetes/upgrade/upgrade-olm">}}).

For all other Kubernetes distributions, see [Upgrade Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}}).

## Upgrade compatibility

When upgrading, both your Kubernetes version and Redis operator version need to be supported at all times.

{{<warning>}}If your current Kubernetes distribution is not [supported]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions.md">}}), upgrade to a supported distribution before upgrading. {{</warning>}}

## RHEL9-based image

Redis Enterprise images are now based on Red Hat Enterprise Linux 9 (RHEL9). This means upgrades require:

- [Cluster version of 7.4.2-2 or later](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/).
- Database version 7.2 or later.
- RHEL9 compatible binaries for any modules you need.

For detailed steps, see the relevant upgrade page:

- [OpenShift CLI]({{<relref "/operate/kubernetes/upgrade/openshift-cli">}})
- [OpenShift OperatorHub]({{<relref "/operate/kubernetes/upgrade/upgrade-olm">}})
- [Kubernetes]({{<relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}})

---
Title: Upgrade Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Upgrade Redis Enterprise operator, clusters, and databases on Kubernetes.
hideListLinks: false
linkTitle: Upgrade
weight: 15
---

Keep your Redis Enterprise deployment up to date with the latest features, security patches, and bug fixes. The upgrade process involves updating three main components in sequence: the Redis Enterprise operator, Redis Enterprise clusters (REC), and Redis Enterprise databases (REDB).

## Upgrade methods

Choose the appropriate upgrade method for your deployment:

- [Upgrade Redis Enterprise for Kubernetes]({{<relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}}) - Standard upgrade process for most Kubernetes distributions
- [Upgrade with OpenShift CLI]({{<relref "/operate/kubernetes/upgrade/openshift-cli">}}) - OpenShift-specific upgrade using CLI tools
- [Upgrade with OpenShift OperatorHub]({{<relref "/operate/kubernetes/upgrade/upgrade-olm">}}) - Upgrade using OpenShift OperatorHub and OLM
- [Upgrade with Helm]({{<relref "/operate/kubernetes/deployment/helm#upgrade-the-chart">}}) - Helm-specific upgrade instructions for chart-based deployments

## Upgrade process

The upgrade process includes updating three components in order:

1. **Upgrade the Redis Enterprise operator** - Update the operator to the latest version
2. **Upgrade the Redis Enterprise cluster (REC)** - Update cluster nodes and infrastructure
3. **Upgrade Redis Enterprise databases (REDB)** - Update database versions and configurations

## Upgrade compatibility

When upgrading, both your Kubernetes version and Redis operator version need to be supported at all times.

{{<warning>}}If your current Kubernetes distribution is not [supported]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions">}}), upgrade to a supported distribution before upgrading. {{</warning>}}

## RHEL9-based image

Redis Enterprise images are now based on Red Hat Enterprise Linux 9 (RHEL9). This means upgrades require:

- [Cluster version of 7.4.2-2 or later](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/).
- Database version 7.2 or later.
- RHEL9 compatible binaries for any modules you need.

For detailed steps, see the relevant upgrade page:

- [OpenShift CLI]({{<relref "/operate/kubernetes/upgrade/openshift-cli">}})
- [OpenShift OperatorHub]({{<relref "/operate/kubernetes/upgrade/upgrade-olm">}})
- [Kubernetes]({{<relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}})
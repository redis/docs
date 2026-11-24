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

- [Upgrade Redis Enterprise for Kubernetes](/content/operate/kubernetes/upgrade/upgrade-redis-cluster.md) - Standard upgrade process for most Kubernetes distributions
- [Upgrade with OpenShift CLI](/content/operate/kubernetes/upgrade/openshift-cli.md) - OpenShift-specific upgrade using CLI tools
- [Upgrade with OpenShift OperatorHub](/content/operate/kubernetes/upgrade/upgrade-olm.md) - Upgrade using OpenShift OperatorHub and OLM
- [Upgrade with Helm](/content/operate/kubernetes/deployment/helm.md#upgrade-the-chart) - Helm-specific upgrade instructions for chart-based deployments

## Upgrade process

The upgrade process includes updating three components in order:

1. **Upgrade the Redis Enterprise operator** - Update the operator to the latest version
2. **Upgrade the Redis Enterprise cluster (REC)** - Update cluster nodes and infrastructure
3. **Upgrade Redis Enterprise databases (REDB)** - Update database versions and configurations

## Upgrade compatibility

When upgrading, both your Kubernetes version and Redis operator version need to be supported at all times.

> [!WARNING]
> If your current Kubernetes distribution is not [supported](/content/operate/kubernetes/reference/supported_k8s_distributions.md), upgrade to a supported distribution before upgrading. 

## RHEL9-based image

As of version 7.8.2-6, Redis Enterprise images are based on Red Hat Enterprise Linux 9 (RHEL9). This means upgrades require:

- [Cluster version of 7.4.2-2 or later](https://redis.io/docs/latest/operate/kubernetes/7.4.6/upgrade/).
- Database version 7.2 or later.
- RHEL9 compatible binaries for any modules you need.

For detailed steps, see the relevant upgrade page:

- [OpenShift CLI](/content/operate/kubernetes/upgrade/openshift-cli.md)
- [OpenShift OperatorHub](/content/operate/kubernetes/upgrade/upgrade-olm.md)
- [Kubernetes](/content/operate/kubernetes/upgrade/upgrade-redis-cluster.md)
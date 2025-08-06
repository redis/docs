---
Title: Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy and manage Redis Enterprise on Kubernetes with the Redis Enterprise operator.
hideListLinks: true
linkTitle: Redis for Kubernetes
weight: 30
---

Redis Enterprise for Kubernetes brings Redis Enterprise to Kubernetes environments through the Redis Enterprise operator. You can deploy, scale, and manage Redis Enterprise clusters and databases by using native Kubernetes resources and workflows.

Redis Enterprise for Kubernetes provides all the enterprise features of Redis Software:

- Linear scalability with Redis clustering
- High availability with automatic failover
- Active-Active geo-distribution
- Auto Tiering for cost optimization
- Enterprise-grade security and encryption
- 24/7 support

The Redis Enterprise operator simplifies deployment and management by providing custom resource definitions (CRDs) for Redis Enterprise clusters (REC) and databases (REDB). This approach enables GitOps workflows and Kubernetes-native operations.

## Get started

Deploy Redis Enterprise on your Kubernetes cluster and create your first database.

- [Quick start deployment]({{< relref "/operate/kubernetes/deployment/quick-start" >}})
- [Deploy with Helm]({{< relref "/operate/kubernetes/deployment/helm" >}})
- [Deploy on OpenShift]({{< relref "/operate/kubernetes/deployment/openshift" >}})
- [Supported Kubernetes distributions]({{< relref "/operate/kubernetes/reference/supported_k8s_distributions" >}})

## Redis Enterprise clusters (REC)

Create and manage [Redis Enterprise clusters]({{< relref "/operate/kubernetes/re-clusters" >}}) on Kubernetes.

- [Connect to admin console]({{< relref "/operate/kubernetes/re-clusters/connect-to-admin-console" >}})
- [Auto Tiering]({{< relref "/operate/kubernetes/re-clusters/auto-tiering" >}})
- [Multi-namespace deployment]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}})
- [Cluster recovery]({{< relref "/operate/kubernetes/re-clusters/cluster-recovery" >}})
- [REC API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}})

## Redis Enterprise databases (REDB)

Create and manage [Redis Enterprise databases]({{< relref "/operate/kubernetes/re-databases" >}}) using Kubernetes resources.

- [Database controller]({{< relref "/operate/kubernetes/re-databases/db-controller" >}})
- [Create replica databases]({{< relref "/operate/kubernetes/re-databases/replica-redb" >}})
- [REDB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}})

## Active-Active databases

Set up globally distributed [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}) across multiple Kubernetes clusters.

- [Prepare participating clusters]({{< relref "/operate/kubernetes/active-active/prepare-clusters" >}})
- [Create Active-Active database]({{< relref "/operate/kubernetes/active-active/create-reaadb" >}})
- [Global configuration]({{< relref "/operate/kubernetes/active-active/global-config" >}})
- [REAADB API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}})
- [Remote cluster API reference]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api" >}})

## Security

Manage [secure connections]({{< relref "/operate/kubernetes/security" >}}) and access control for your Redis Enterprise deployment.

- [Manage REC credentials]({{< relref "/operate/kubernetes/security/manage-rec-credentials" >}})
- [Manage REC certificates]({{< relref "/operate/kubernetes/security/manage-rec-certificates" >}})
- [Internode encryption]({{< relref "/operate/kubernetes/security/internode-encryption" >}})
- [LDAP authentication]({{< relref "/operate/kubernetes/security/ldap" >}})

## Reference

Use the Kubernetes API and command-line tools to manage your Redis Enterprise deployment.

- [Redis Enterprise cluster API (REC)]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api" >}})
- [Redis Enterprise database API (REDB)]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_database_api" >}})
- [Active-Active database API (REAADB)]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api" >}})
- [Remote cluster API (RERC)]({{< relref "/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api" >}})

## Logs & monitoring

Monitor and troubleshoot your Redis Enterprise deployment.

- [Collect logs]({{< relref "/operate/kubernetes/logs/collect-logs" >}})
- [Connect to Prometheus operator]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}})

## Upgrade

Keep your Redis Enterprise deployment up to date.

- [Upgrade Redis cluster]({{< relref "/operate/kubernetes/upgrade/upgrade-redis-cluster" >}})
- [Upgrade with OpenShift CLI]({{< relref "/operate/kubernetes/upgrade/openshift-cli" >}})
- [Upgrade with OLM]({{< relref "/operate/kubernetes/upgrade/upgrade-olm" >}})

## Release notes

Stay informed about new features, enhancements, and fixes.

- [Release notes]({{< relref "/operate/kubernetes/release-notes" >}})

## Related info

- [Redis Enterprise Software]({{< relref "/operate/rs" >}})
- [Redis Cloud]({{< relref "/operate/rc" >}})
- [Redis Open Source]({{< relref "/operate/oss_and_stack" >}})
- [Glossary]({{< relref "/glossary" >}})
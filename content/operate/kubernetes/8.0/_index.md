---
Title: Redis Enterprise for Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Deploy and manage Redis Enterprise on Kubernetes with the Redis Enterprise operator.
hideListLinks: true
linkTitle: 8.0
weight: 50
bannerText: This documentation applies to versions 8.0.2 through 8.0.10. For documentation on the latest version, see [redis.io/docs/latest/operate/kubernetes/](https://redis.io/docs/latest/operate/kubernetes/).
bannerChildren: true
url: '/operate/kubernetes/8.0/'
---

Redis Enterprise for Kubernetes brings Redis Enterprise to Kubernetes environments through the Redis Enterprise operator. You can deploy, scale, and manage Redis Enterprise clusters and databases by using native Kubernetes resources and workflows.

Redis Enterprise for Kubernetes provides all the enterprise features of Redis Software:

- Linear scalability with Redis clustering
- High availability with automatic failover
- Active-Active geo-distribution
- Redis Flex for cost optimization
- Enterprise-grade security and encryption
- 24/7 support

The Redis Enterprise operator simplifies deployment and management by providing custom resource definitions (CRDs) for Redis Enterprise clusters (REC) and databases (REDB). This approach enables GitOps workflows and Kubernetes-native operations.

## Get started

Deploy Redis Enterprise on your Kubernetes cluster and create your first database.

- [Quick start deployment](/content/operate/kubernetes/8.0/deployment/quick-start.md)
- [Deploy with Helm](/content/operate/kubernetes/8.0/deployment/helm.md)
- [Deploy on OpenShift](/content/operate/kubernetes/8.0/deployment/openshift/_index.md)
- [Supported Kubernetes distributions](/content/operate/kubernetes/8.0/reference/supported_k8s_distributions.md)

## Redis Enterprise clusters (REC)

Create and manage [Redis Enterprise clusters](/content/operate/kubernetes/8.0/re-clusters/_index.md) on Kubernetes.

- [Connect to admin console](/content/operate/kubernetes/8.0/re-clusters/connect-to-admin-console.md)
- [Redis Flex](/content/operate/kubernetes/8.0/flex/_index.md)
- [Multi-namespace deployment](/content/operate/kubernetes/8.0/re-clusters/multi-namespace.md)
- [Cluster recovery](/content/operate/kubernetes/8.0/re-clusters/cluster-recovery.md)
- [REC API reference](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_cluster_api.md)

## Redis Enterprise databases (REDB)

Create and manage [Redis Enterprise databases](/content/operate/kubernetes/8.0/re-databases/_index.md) using Kubernetes resources.

- [Database controller](/content/operate/kubernetes/8.0/re-databases/db-controller.md)
- [Create replica databases](/content/operate/kubernetes/8.0/re-databases/replica-redb.md)
- [REDB API reference](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_database_api.md)

## Active-Active databases

Set up globally distributed [Active-Active databases](/content/operate/kubernetes/8.0/active-active/_index.md) across multiple Kubernetes clusters.

- [Prepare participating clusters](/content/operate/kubernetes/8.0/active-active/prepare-clusters.md)
- [Create Active-Active database](/content/operate/kubernetes/8.0/active-active/create-reaadb.md)
- [Global configuration](/content/operate/kubernetes/8.0/active-active/global-config.md)
- [REAADB API reference](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_active_active_database_api.md)
- [Remote cluster API reference](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_remote_cluster_api.md)

## Security

Manage [secure connections](/content/operate/kubernetes/8.0/security/_index.md) and access control for your Redis Enterprise deployment.

- [Manage REC credentials](/content/operate/kubernetes/8.0/security/manage-rec-credentials.md)
- [Manage REC certificates](/content/operate/kubernetes/8.0/security/manage-rec-certificates.md)
- [Internode encryption](/content/operate/kubernetes/8.0/security/internode-encryption.md)
- [LDAP authentication](/content/operate/kubernetes/8.0/security/ldap.md)

## Reference

Use the Kubernetes API and command-line tools to manage your Redis Enterprise deployment.

- [Redis Enterprise cluster API (REC)](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_cluster_api.md)
- [Redis Enterprise database API (REDB)](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_database_api.md)
- [Active-Active database API (REAADB)](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_active_active_database_api.md)
- [Remote cluster API (RERC)](/content/operate/kubernetes/8.0/reference/api/redis_enterprise_remote_cluster_api.md)

## Logs & monitoring

Monitor and troubleshoot your Redis Enterprise deployment.

- [Collect logs](/content/operate/kubernetes/8.0/logs/collect-logs.md)
- [Connect to Prometheus operator](/content/operate/kubernetes/8.0/re-clusters/connect-prometheus-operator.md)

## Upgrade

Keep your Redis Enterprise deployment up to date.

- [Upgrade Redis cluster](/content/operate/kubernetes/8.0/upgrade/upgrade-redis-cluster.md)
- [Upgrade with OpenShift CLI](/content/operate/kubernetes/8.0/upgrade/openshift-cli.md)
- [Upgrade with OLM](/content/operate/kubernetes/8.0/upgrade/upgrade-olm.md)

## Release notes

Stay informed about new features, enhancements, and fixes.

- [Release notes](/content/operate/kubernetes/release-notes/_index.md)

## Related info

- [Redis Enterprise Software](/content/operate/rs/_index.md)
- [Redis Cloud](/content/operate/rc/_index.md)
- [Redis Open Source](/content/operate/oss_and_stack/_index.md)
- [Glossary](/content/glossary/_index.md)
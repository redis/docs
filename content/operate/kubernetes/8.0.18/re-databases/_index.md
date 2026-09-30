---
Title: Redis Enterprise databases (REDB)
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Create and manage Redis Enterprise databases (REDB) on Kubernetes using the Redis Enterprise operator.
hideListLinks: true
linkTitle: Redis Enterprise databases (REDB)
weight: 31
url: '/operate/kubernetes/8.0.18/re-databases/'
---

A Redis Enterprise database (REDB) is a custom Kubernetes resource that represents a Redis database running on a Redis Enterprise cluster. The Redis Enterprise operator manages REDB resources and handles database creation, configuration, scaling, and lifecycle operations.

REDB resources define database specifications including memory limits, persistence settings, security configurations, networking options, and Redis modules. You can deploy databases on existing Redis Enterprise clusters (REC) and manage them by using standard Kubernetes tools and workflows.

## Database management

Create and manage Redis Enterprise databases on your cluster:

- [Database controller](/content/operate/kubernetes/8.0.18/re-databases/db-controller.md) - Understand how the database controller manages REDB resources and database lifecycle

## Replication and high availability

Set up database replication for high availability and disaster recovery:

- [Create replica databases](/content/operate/kubernetes/8.0.18/re-databases/replica-redb.md) - Configure replica databases for read scaling and disaster recovery scenarios

## Advanced database configurations

Explore advanced database features and configurations:

- [Active-Active databases](/content/operate/kubernetes/8.0.18/active-active/_index.md) - Set up globally distributed Active-Active databases across multiple Kubernetes clusters

## Database connectivity

Connect applications to your Redis Enterprise databases:

- [Database connectivity](/content/operate/kubernetes/8.0.18/networking/database-connectivity.md) - Comprehensive guide to in-cluster and external database access, service discovery, and credentials management.
- [Networking](/content/operate/kubernetes/8.0.18/networking/_index.md) - Configure ingress, routes, and service exposure for database access
- [Security](/content/operate/kubernetes/8.0.18/security/_index.md) - Set up TLS, authentication, and access control for secure database connections

## Monitoring and troubleshooting

Monitor database performance and troubleshoot issues:

- [Logs](/content/operate/kubernetes/8.0.18/logs/_index.md) - Collect and analyze database logs for troubleshooting
- [Connect to Prometheus operator](/content/operate/kubernetes/8.0.18/re-clusters/connect-prometheus-operator.md) - Monitor database metrics with Prometheus

## Related topics

- [Redis Enterprise clusters (REC)](/content/operate/kubernetes/8.0.18/re-clusters/_index.md) - Manage the underlying cluster infrastructure
- [REDB API reference](/content/operate/kubernetes/8.0.18/reference/api/redis_enterprise_database_api.md) - Complete API specification for REDB resources
- [Active-Active database API](/content/operate/kubernetes/8.0.18/reference/api/redis_enterprise_active_active_database_api.md) - API reference for Active-Active databases
- [Remote cluster API](/content/operate/kubernetes/8.0.18/reference/api/redis_enterprise_remote_cluster_api.md) - API reference for remote cluster configurations

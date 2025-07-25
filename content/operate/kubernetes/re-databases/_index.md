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
---

A Redis Enterprise database (REDB) is a custom Kubernetes resource that represents a Redis database running on a Redis Enterprise cluster. The Redis Enterprise operator manages REDB resources and handles database creation, configuration, scaling, and lifecycle operations.

REDB resources define database specifications including memory limits, persistence settings, security configurations, networking options, and Redis modules. You can deploy databases on existing Redis Enterprise clusters (REC) and manage them by using standard Kubernetes tools and workflows.

## Database management

Create and manage Redis Enterprise databases on your cluster:

- [Database controller]({{< relref "/operate/kubernetes/re-databases/db-controller" >}}) - Understand how the database controller manages REDB resources and database lifecycle

## Replication and high availability

Set up database replication for high availability and disaster recovery:

- [Create replica databases]({{< relref "/operate/kubernetes/re-databases/replica-redb" >}}) - Configure replica databases for read scaling and disaster recovery scenarios

## Advanced database configurations

Explore advanced database features and configurations:

- [Active-Active databases]({{< relref "/operate/kubernetes/active-active" >}}) - Set up globally distributed Active-Active databases across multiple Kubernetes clusters

## Database connectivity

Connect applications to your Redis Enterprise databases:

- [Networking]({{< relref "/operate/kubernetes/networking" >}}) - Configure ingress, routes, and service exposure for database access
- [Security]({{< relref "/operate/kubernetes/security" >}}) - Set up TLS, authentication, and access control for secure database connections

## Monitoring and troubleshooting

Monitor database performance and troubleshoot issues:

- [Logs]({{< relref "/operate/kubernetes/logs" >}}) - Collect and analyze database logs for troubleshooting
- [Connect to Prometheus operator]({{< relref "/operate/kubernetes/re-clusters/connect-prometheus-operator" >}}) - Monitor database metrics with Prometheus

## Related topics

- [Redis Enterprise clusters (REC)]({{< relref "/operate/kubernetes/re-clusters" >}}) - Manage the underlying cluster infrastructure
- [REDB API reference]({{< relref "/operate/kubernetes/reference/redis_enterprise_database_api" >}}) - Complete API specification for REDB resources
- [Active-Active database API]({{< relref "/operate/kubernetes/reference/redis_enterprise_active_active_database_api" >}}) - API reference for Active-Active databases
- [Remote cluster API]({{< relref "/operate/kubernetes/reference/redis_enterprise_remote_cluster_api" >}}) - API reference for remote cluster configurations

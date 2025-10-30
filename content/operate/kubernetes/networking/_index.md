---
Title: Networking
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Configure networking and external access for Redis Enterprise clusters and databases on Kubernetes.
hideListLinks: true
linkTitle: Networking
weight: 40
---

Configure networking and external access for your Redis Enterprise deployment on Kubernetes. By default, Kubernetes doesn't allow external access to your Redis databases. Redis Enterprise for Kubernetes provides several methods to route external traffic to your clusters and databases.

## Database connectivity

Connect applications to your Redis Enterprise databases:

- [Database connectivity]({{< relref "/operate/kubernetes/networking/database-connectivity" >}}) - Comprehensive guide to in-cluster and external database access, service discovery, and credentials management.

## External routing methods

Choose the appropriate method for your environment to enable external access:

- [Ingress routing]({{< relref "/operate/kubernetes/networking/ingress" >}}) - Use NGINX or HAProxy ingress controllers with `ingress` API resources
- [Istio ingress routing]({{< relref "/operate/kubernetes/networking/istio-ingress" >}}) - Use Istio service mesh with `Gateway` and `VirtualService` API resources
- [OpenShift routes]({{< relref "/operate/kubernetes/networking/routes" >}}) - Use OpenShift-specific route resources for external traffic

## Automatic ingress configuration

For Active-Active databases, configure automatic ingress creation:

- [REC external routing]({{< relref "/operate/kubernetes/networking/ingressorroutespec" >}}) - Use `ingressOrRouteSpec` field in RedisEnterpriseCluster (REC) for automatic ingress creation

## `ingressOrRouteSpec` for Active-Active databases

Versions 6.4.2 or later of Redis Enterprise for Kubernetes include a feature for ingress configuration. The `ingressOrRouteSpec` field is available in the RedisEnterpriseCluster spec to automatically create an Ingress (or route) for the API service and databases (REAADB) on that REC. See [REC external routing]({{< relref "/operate/kubernetes/networking/ingressorroutespec" >}}) for more details.

This feature only supports automatic Ingress creation for Active-Active databases created and managed with the RedisEnterpriseActiveActiveDatabase (REAADB) custom resource. Use with the standard Redis Enterprise database (REDB) is not currently supported.

## OSS Cluster API limitations

When using [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}), clients must specify the IP addresses of Redis instances to perform operations. Since Pod IP addresses are internal to the Kubernetes cluster and not publicly accessible, **OSS Cluster API can only be used by clients running on pods within the same Kubernetes cluster as the Redis Enterprise pods.** Using OSS Cluster API from outside the Kubernetes cluster is not tested and currently not supported.

For applications that need to access Redis databases from outside the Kubernetes cluster, use standard Redis Enterprise connectivity methods with the external routing options described above (Ingress controllers, load balancers, or OpenShift routes). These methods do not support OSS Cluster API but provide reliable external access to your Redis databases.

## REC domain name

The RedisEnterpriseCluster does not support custom domain names. Domain names for the REC are in the following format: `<rec-name>.<namespace>.svc.cluster.local`.

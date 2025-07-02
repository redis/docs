---
Title: Networking
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: null
hideListLinks: true
linkTitle: Networking
weight: 40
---

Redis Enterprise for Kubernetes supports several ways to route external traffic to your RedisEnterpriseCluster:

- Ingress controllers [HAProxy](https://haproxy-ingress.github.io/) and [NGINX](https://kubernetes.github.io/ingress-nginx/) require an `ingress` API resource.
- [Istio](https://istio.io/latest/docs/setup/getting-started/) requires `Gateway` and `VirtualService` API resources.
- OpenShift uses [routes]({{< relref "/operate/kubernetes/networking/routes" >}}) to route external traffic.
- The RedisEnterpriseActiveActiveDatabase (REAADB) requires any of the above routing methods to be configured in the RedisEnterpriseCluster (REC) with the `ingressOrRouteSpec` field.

## External routing using Redis Enterprise for Kubernetes

Every time a RedisEnterpriseDatabase (REDB), Redis Enterprise Active-Active database (REAADB), or Redis Enterprise cluster (REC) is created, the Redis Enterprise operator automatically creates a [service](https://kubernetes.io/docs/concepts/services-networking/service/) to allow requests to be routed to that resource.

Redis Enterprise supports three [types of services](https://kubernetes.io/docs/concepts/services-networking/service/#publishing-services-service-types) for accessing databases: `ClusterIP`, `headless`, or `LoadBalancer`.

By default, the operator creates a `ClusterIP` type service, which exposes a cluster-internal IP and that can only be accessed from within the K8s cluster. For requests to be routed from outside the K8s cluster, you need an [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) (or [route](https://docs.openshift.com/container-platform/4.12/networking/routes/route-configuration.html) if you are using OpenShift). See [kubernetes.io](https://kubernetes.io/docs/) for more details on [Ingress](https://kubernetes.io/docs/concepts/services-networking/ingress/) and [Ingress controllers](https://kubernetes.io/docs/concepts/services-networking/ingress-controllers/).

- To use NGINX or HAProxy Ingress controllers, see [Ingress routing]({{< relref "/operate/kubernetes/networking/ingress" >}}).
- To use OpenShift routes, see [OpenShift routes]({{< relref "/operate/kubernetes/networking/routes" >}}).
- To use Istio as an Ingress controller, see [Istio Ingress routing]({{< relref "/operate/kubernetes/networking/istio-ingress" >}})

## `ingressOrRouteSpec` for Active-Active databases

Versions 6.4.2 or later of Redis Enterprise for Kubernetes include a feature for ingress configuration. The `ingressOrRouteSpec` field is available in the RedisEnterpriseCluster spec to automatically create an Ingress (or route) for the API service and databases (REAADB) on that REC. See [REC external routing]({{< relref "/operate/kubernetes/networking/ingressorroutespec" >}}) for more details.

This feature only supports automatic Ingress creation for Active-Active databases created and managed with the RedisEnterpriseActiveActiveDatabase (REAADB) custom resource. Use with the standard Redis Enterprise database (REDB) is not currently supported.

## OSS Cluster API limitations

When using [OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}), clients must specify the IP addresses of Redis instances to perform operations. Since Pod IP addresses are internal to the Kubernetes cluster and not publicly accessible, **OSS Cluster API can only be used by clients running on pods within the same Kubernetes cluster as the Redis Enterprise pods.** Using OSS Cluster API from outside the Kubernetes cluster is not tested and currently not supported.

For applications that need to access Redis databases from outside the Kubernetes cluster, use standard Redis Enterprise connectivity methods with the external routing options described above (Ingress controllers, load balancers, or OpenShift routes). These methods do not support OSS Cluster API but provide reliable external access to your Redis databases.

## REC domain name

The RedisEnterpriseCluster does not support custom domain names. Domain names for the REC are in the following format: `<rec-name>.<namespace>.svc.cluster.local`.

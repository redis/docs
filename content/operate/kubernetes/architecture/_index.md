---
Title: Redis Enterprise for Kubernetes architecture
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Overview of the architecture and components of Redis Enterprise for Kubernetes.
hideListLinks: true
linkTitle: Architecture
weight: 1
---

Redis Enterprise for Kubernetes gives you the speed and durability of [Redis Enterprise](https://redis.io/redis-enterprise/advantages/), with the flexibility and ease of use Kubernetes (K8s) provides. Redis Enterprise for Kubernetes uses a the Kubernetes operator pattern and custom controllers to bring the best of Redis Enterprise to Kubernetes platforms.

The image below illustrates the components of a single namespace, three node deployment.

{{< image filename="/images/k8s/k8s-arch-v4.png" >}}

## Operator

An [operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) is a custom extension of the Kubernetes API designed to manage complex, stateful applications and their components. This operator pattern is commonly used by databases and other applications to extend the cluster's behavior without changing its underlying code. Kubernetes.io/docs has a great explanation of the [operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/).

The Redis Enterprise operator uses controllers to manage Redis Enterprise’s custom resources (CRs), ensuring that these resources are continuously monitored and maintained.

The operator is a deployment that runs within a given namespace. These operator pods must run with sufficient privileges to create the Redis Enterprise cluster resources within that namespace.

When the operator is installed, the following resources are created:

- service account under which the operator will run
- set of roles to define the privileges necessary for the operator to perform its tasks
- set of role bindings to authorize the service account for the correct roles (see above)
- CustomResourceDefinition (CRD) for each Redis Enterprise custom resource
- the operator itself (a deployment)

## Namespace

The Redis Enterprise operator is deployed within a namespace. Each namespace can host only one operator and one RedisEnterpriseCluster instance. Namespaces create a logical boundaries between resources, allowing organization and security. Some resources in your deployment are limited to a namespace, while others are cluster-wide.

Redis Enterprise for Kubernetes also supports multi-namespace deployments, meaning databases in other namespaces (that host applications) for custom resources and applies any changes defined in those custom resources.

## Custom resources

Kubernetes custom resources (CRs) are commonly used by databases and other applications to extend the cluster's behavior without changing its underlying code. [Custom resources (CRs)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) extend the Kubernetes API, enabling users to manage Redis databases the Kubernetes way.Custom resources are created and managed using YAML configuration files.

This [declarative configuration approach](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/) allows you to specify the desired state for your resources, and the operator makes the necessary changes to achieve that state. This simplifies installation, upgrades, and scaling both vertically and horizontally.

The operator continuously monitors CRs for changes, automatically reconciling any differences between the desired state you specified in your YAML configuration file and the actual state of your resources. Custom resources can also reside in separate namespaces from the operator managing them, such as in [multi-namespace installations](ADD LINK).

## Custom resource definitions

A custom resource definition (CRD) is a cluster-wide resource that specifies which settings can be configured via custom resource files. Any setting not defined by the CRD is not managed by the operator. Changes to these unmanaged settings can still be made using standard Redis Enterprise Software methods.

For settings managed by the operator, any changes made outside of the CR YAML files (e.g., through the management UI) will be overwritten by the operator. Ensure that all operator-managed settings are updated using the CR YAML files to prevent conflicts.

## RedisEnterpriseCluster REC

A Redis Enterprise cluster is a set of Redis Enterprise nodes pooling resources. Each node is capable of running multiple Redis instances (shards).

{{< image filename="/images/k8s/k8s-node-arch.png">}}

A Redis cluster is created an managed by the RedisEnterpriseCluster (REC) custom resource. Changes to the REC YAML configuration prompt the operator to make changes to the cluster.The REC is required for both standard databases (REDB) and Active-Active databases (REAADB).

See the [RedisEnterpriseCluster (REC) API Reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_cluster_api">}}) for a full list of fields and settings.

## RedisEnterpriseDatabase REDB

A Redis Enterprise database is a logical entity that manages your entire dataset across multiple Redis instances (shards). A Redis instance is a single-threaded database process (commonly referred to as a shard).

Redis databases are created and managed by the RedisEnterpriseDatabase (REDB) custom resource. Changes to the REDB YAML configuration file prompt the operator to make changes to the database. See the [RedisEnterpriseDatabase (REDB) API Reference]({{<relref "/operate/kubernetes/reference/redis_enterprise_database_api">}}) for a full list of fields and settings.

A database can be managed by an operator in the same namespace, or a different namespace. See ["Flexible deployment"]({{<relref "/operate/kubernetes/architecture/deployment-options">}}) options and ["Manage databases in multiple namespaces"]({{<relref "/operate/kubernetes/re-clusters/multi-namespace">}}) for more information.

## Security

Redis Enterprise for Kubernetes allows you to use secrets to manage your cluster credentials, cluster certificates, and client certificates. You can configure LDAP and internode encryption via the RedisEnterpriseCluster spec.

### REC credentials

Redis Enterprise for Kubernetes uses a custom resource called [`RedisEnterpriseCluster`]({{< relref "/operate/kubernetes/reference/redis_enterprise_cluster_api" >}}) to create a Redis Enterprise cluster (REC). During creation it generates random credentials for the operator to use. The credentials are saved in a Kubernetes (K8s) [secret](https://kubernetes.io/docs/concepts/configuration/secret/). The secret name defaults to the name of the cluster.

### REC certificates

By default, Redis Enterprise Software for Kubernetes generates TLS certificates for the cluster during creation. These self-signed certificates are generated on the first node of each Redis Enterprise cluster (REC) and are copied to all other nodes added to the cluster.

## Client certificates

For each client certificate you want to use, you need to create a [Kubernetes secret](ADD LINK) to hold it. You can then reference that secret in your Redis Enterprise database (REDB) custom resource spec.

## Storage

[Persistent storage is mandatory for Redis Enterprise.]({{<relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage/">}}) Redis Enterprise for Kubernetes [requires network-attached storage](https://en.wikipedia.org/wiki/Network-attached_storage).

Redis Enterprise for Kubernetes uses [[PersistentVolumeClaims (PVC)](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) to manage storage resources. The PVC is an abstract representation of the PersistentVolume resources used by your Redis pods. PVCs are created by the Redis Enterprise operator and used by the RedisEnterpriseCluster (REC).

PVCs are created with a specific size and [can be expanded](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) with the following steps, if the underlying [storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) supports it.

### Auto Tiering

Redis Enterprise Software for Kubernetes supports using Auto Tiering (previously known as Redis on Flash), which extends your node memory to use both RAM and flash storage. SSDs (solid state drives) can store infrequently used (warm) values while your keys and frequently used (hot) values are still stored in RAM. This improves performance and lowers costs for large datasets.

NVMe (non-volatile memory express) SSDs are strongly recommended to achieve the best performance.

## Networking

By default, Kubernetes doesn't allow you to access your Redis database from outside your K8s cluster. Redis Enterprise for Kubernetes supports several ways to route external traffic to your RedisEnterpriseCluster:

- Ingress controllers [HAProxy](https://haproxy-ingress.github.io/) and [NGINX](https://kubernetes.github.io/ingress-nginx/) require an `ingress` API resource.
- [Istio](https://istio.io/latest/docs/setup/getting-started/) requires `Gateway` and `VirtualService` API resources.
- OpenShift uses [routes]({{< relref "/operate/kubernetes/networking/routes.md" >}}) to route external traffic.

The RedisEnterpriseActiveActiveDatabase (REAADB) requires one of above routing methods to be configured in the RedisEnterpriseCluster (REC) with the `ingressOrRouteSpec` field.

## Services Rigger

## Active-Active databases

On Kubernetes, Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active/" >}}) databases provide read and write access to the same dataset from different Kubernetes clusters. For more general information about Active-Active, see the [Redis Enterprise Software docs]({{< relref "/operate/rs/databases/active-active/" >}}).

Creating an Active-Active database requires routing [network access]({{< relref "/operate/kubernetes/networking/" >}}) between two Redis Enterprise clusters residing in different Kubernetes clusters. Without the proper access configured for each cluster, syncing between the databases instances will fail.

## RedisEnterpriseRemoteCluster RERC

## RedisEnterpriseActiveActiveDatabase REAADB

## Metrics

To collect  metrics data from your databases and Redis Enterprise cluster (REC), you can connect your [Prometheus](https://prometheus.io/) server to an endpoint exposed on your REC. Redis Enterprise for Kubernetes creates a dedicated service to expose the `prometheus` port (8070) for data collection. A custom resource called `ServiceMonitor` allows the [Prometheus operator](https://github.com/prometheus-operator/prometheus-operator/tree/main/Documentation) to connect to this port and collect data from Redis Enterprise.
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
aliases: [/operate/kubernetes/architecture/operator/]
---

Redis Enterprise for Kubernetes gives you the speed and durability of [Redis Enterprise](https://redis.io/redis-enterprise/advantages/), with the flexibility and ease of [Kubernetes (K8s)](https://kubernetes.io/). Redis Enterprise for Kubernetes uses the Kubernetes operator pattern and custom controllers to bring the best of Redis Enterprise to the Kubernetes platform.

## Lifecycle

Kubernetes is a rapidly evolving platform with a short release cycle (around 4 months). This frequent influx of new features, enhancements and bug fixes means Kubernetes distributions move in and out of support quickly. Redis Enterprise is also a fast-moving product, and is compatible and tested only on distributions listed as [supported distributions.]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions">}})

Each version of Redis Enterprise for Kubernetes is tested to ensure the version of Redis Enterprise works with the [supported Kubernetes distributions]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions">}}) at the time. Both the Kubernetes version and the Redis Enterprise version must be supported for the operator to function correctly. We encourage you to upgrade Redis Enterprise for Kubernetes frequently, not only to get the benefit of enhancements and bug fixes, but to keep your software supported.

Supported platforms are listed in the [release notes]({{<relref "/operate/kubernetes/release-notes">}}) and in the [supported platforms reference.]({{<relref "/operate/kubernetes/reference/supported_k8s_distributions">}})

## Architecture

The image below illustrates the components of a single namespace, three node deployment.

{{< image filename="/images/k8s/k8s-arch-v4.png" >}}

## Operator

An [operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) is a custom extension of the Kubernetes API designed to manage complex, stateful applications and their components. This operator pattern is commonly used by databases and other applications to extend the cluster's behavior without changing its underlying code. Kubernetes.io/docs has a great explanation of the [operator pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/).

The operator is a deployment that runs within a [namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/) and uses [controllers](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#custom-controllers) to manage [custom resources (CRs)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/), ensuring these resources are continuously monitored and maintained.

When the operator is installed, the following resources are created:

- [service account](https://kubernetes.io/docs/concepts/security/service-accounts/) under which the operator will run
- set of [roles](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#role-and-clusterrole) to define the privileges necessary for the operator to perform its tasks
- set of [role bindings](https://kubernetes.io/docs/reference/access-authn-authz/rbac/#rolebinding-and-clusterrolebinding) to authorize the service account
- [CustomResourceDefinition (CRD)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions) for each Redis Enterprise custom resource
- the operator deployment

## Namespace

The Redis Enterprise [operator](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/) is deployed within a [namespace](https://kubernetes.io/docs/concepts/overview/working-with-objects/namespaces/). Each namespace can host only one operator and one [RedisEnterpriseCluster (REC)](#redisenterprisecluster-rec). Namespaces create logical boundaries between resources, allowing organization and security. Some resources are limited to a namespace, while others are cluster-wide.

Redis Enterprise for Kubernetes also supports [multi-namespace deployments]({{<relref "/operate/kubernetes/architecture/deployment-options">}}), meaning the operator can monitor other namespaces (that host applications) for custom resources and apply any changes.

## Custom resources

Kubernetes [custom resources (CRs)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) are commonly used by databases and other applications to extend the cluster's behavior without changing its underlying code. [Custom resources (CRs)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) extend the Kubernetes API, enabling users to manage Redis databases the Kubernetes way. Custom resources are created and managed using YAML configuration files.

This [declarative configuration approach](https://kubernetes.io/docs/tasks/manage-kubernetes-objects/declarative-config/) allows you to specify the desired state for your resources, and the operator makes the necessary changes to achieve that state. This simplifies [installation]({{<relref "/operate/kubernetes/deployment">}}), [upgrades]({{<relref "/operate/kubernetes/upgrade">}}), and [scaling]({{<relref "/operate/kubernetes/recommendations/sizing-on-kubernetes">}}) both vertically and horizontally.

The operator continuously monitors CRs for changes, automatically reconciling any differences between the desired state you specified in your YAML configuration file, and the actual state of your resources. Custom resources can also reside in separate namespaces from the operator managing them, such as in [multi-namespace installations]({{<relref "/operate/kubernetes/re-clusters/multi-namespace">}}).

## Custom resource definitions

A [custom resource definition (CRD)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#customresourcedefinitions) is a cluster-wide resource that specifies which settings can be configured via custom resource files. Any setting not defined by the CRD is not managed by the operator. You can still make changes to these unmanaged settings using standard Redis Enterprise Software methods.

For settings managed by the operator, any changes made outside of the CR YAML files (e.g., through the management UI) will be overwritten by the operator. Ensure that all operator-managed settings are updated using the CR YAML files to prevent conflicts.

## RedisEnterpriseCluster REC

A Redis Enterprise cluster is a set of Redis Enterprise nodes pooling resources. Each node is capable of running multiple Redis instances ([shards]({{<relref "/operate/rs/references/terminology">}})).

{{< image filename="/images/k8s/k8s-node-arch.png">}}

A Redis cluster is created and managed by the [RedisEnterpriseCluster (REC)]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api">}}) [custom resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/). Changes to the REC configuration file prompt the operator to make changes to the cluster. The REC is required for both standard databases ([REDB](#redisenterprisedatabase-redb)) and Active-Active databases ([REAADB](#redisenterpriseactiveactivedatabase-reaadb)).

See the [RedisEnterpriseCluster API Reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api">}}) for a full list of fields and settings.

## RedisEnterpriseDatabase REDB

A Redis Enterprise database is a logical entity that manages your entire dataset across multiple Redis instances. A Redis instance is a single-threaded database process ([commonly referred to as a shard]({{<relref "/operate/rs/references/terminology">}})).

Redis databases are created and managed by the [RedisEnterpriseDatabase (REDB)]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api">}}) [custom resource (CR)](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/). Changes to the REDB YAML configuration file prompt the operator to make changes to the database.

An operator can manage a database in the same namespace, or a different namespace. See ["Flexible deployment"]({{<relref "/operate/kubernetes/architecture/deployment-options">}}) options and ["Manage databases in multiple namespaces"]({{<relref "/operate/kubernetes/re-clusters/multi-namespace">}}) for more information.

See the [RedisEnterpriseDatabase (REDB) API Reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_database_api">}}) for a full list of fields and settings.

## Security

Redis Enterprise for Kubernetes uses [secrets](https://kubernetes.io/docs/concepts/configuration/secret/) to manage your cluster credentials, cluster certificates, and client certificates. You can configure [LDAP]({{<relref "/operate/kubernetes/security/ldap">}}) and [internode encryption]({{<relref "/operate/kubernetes/security/internode-encryption">}}) using the [RedisEnterpriseCluster (REC)](#redisenterprisecluster-rec) spec.

### REC credentials

Redis Enterprise for Kubernetes uses the [RedisEnterpriseCluster (REC)]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api">}}) [custom resource](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/) to create a Redis Enterprise cluster. During creation it generates random credentials for the operator to use. The credentials are saved in a Kubernetes (K8s) [secret](https://kubernetes.io/docs/concepts/configuration/secret/). The secret name defaults to the name of the cluster.

See [Manage REC credentials]({{<relref "/operate/kubernetes/security/manage-rec-credentials">}}) for more details.

### REC certificates

By default, Redis Enterprise Software for Kubernetes generates TLS certificates for the cluster during creation. These self-signed certificates are generated on the first node of each Redis Enterprise cluster (REC) and are copied to all other nodes in the cluster.

See [Manage REC certificates]({{<relref "/operate/kubernetes/security/manage-rec-certificates">}}) for more details.

### Client certificates

For each client certificate you want to use, you need to create a [Kubernetes secret](https://kubernetes.io/docs/concepts/configuration/secret/) to hold it. You can then reference that secret in your [Redis Enterprise database (REDB)](#redisenterprisedatabase-redb) custom resource.

See [Add client certificates]({{<relref "/operate/kubernetes/security/add-client-certificates">}}) for more details.

## Storage

[Persistent storage is mandatory for Redis Enterprise.]({{<relref "operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage">}}) Redis Enterprise for Kubernetes [requires network-attached storage](https://en.wikipedia.org/wiki/Network-attached_storage).

Redis Enterprise for Kubernetes uses [PersistentVolumeClaims (PVC)](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims) to manage storage resources. The PVC is an abstract representation of the [PersistentVolume (PV)](https://kubernetes.io/docs/concepts/storage/persistent-volumes) resources used by your Redis pods. PVCs are created by the Redis Enterprise operator and used by the [RedisEnterpriseCluster (REC)](#redisenterprisecluster-rec).

PVCs are created with a specific size and [can be expanded](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims), if the underlying [storage class](https://kubernetes.io/docs/concepts/storage/storage-classes/) supports it.

### Auto Tiering

Redis Enterprise Software for Kubernetes supports [Auto Tiering]({{<relref "/operate/kubernetes/re-clusters/auto-tiering">}}) (previously known as Redis on Flash), which extends your node memory to use both RAM and flash storage. SSDs (solid state drives) can store infrequently used (warm) values while your keys and frequently used (hot) values are still stored in RAM. This improves performance and lowers costs for large datasets.

NVMe (non-volatile memory express) SSDs are strongly recommended to achieve the best performance.

## Networking

By default, Kubernetes doesn't allow you to access your Redis database from outside your K8s cluster. Redis Enterprise for Kubernetes supports several ways to route external traffic to your [Redis Enterprise cluster (REC)](#redisenterprisecluster-rec):

- Ingress controllers [HAProxy](https://haproxy-ingress.github.io/) and [NGINX](https://kubernetes.github.io/ingress-nginx/) require an `ingress` API resource.
- [Istio](https://istio.io/latest/docs/setup/getting-started/) requires `Gateway` and `VirtualService` API resources.
- OpenShift uses [routes]({{< relref "/operate/kubernetes/networking/routes" >}}) to route external traffic.

The [Active-Active databases](#active-active-databases) require one of above routing methods to be configured in the REC with the [ingressOrRouteSpec field]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specingressorroutespec">}}).

## Services Rigger

The services rigger is responsible for creating and updating services related to database objects. It identifies database objects within the cluster and creates services in accordance with [`redisEnterpriseCluster.Spec.servicesRiggerSpec` setting]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_cluster_api#specservicesriggerspec">}}) to allow access to those databases. By default, each database has two services, a `cluster_ip` Service with the same name as the database and a `headless` Service with the same name as the database suffixed with `-headless`. It also creates other types of Services such as Ingress Services or OpenshiftRoutes (defined in `redisEnterpriseCluster.Spec.ingressOrRouteSpec`) meant to provide access to REAADB objects.

You can view a list of services with the `kubectl get services` command.

Kubernetes is a dynamic environment, with nodes and pods changing as needed. The services rigger monitors the cluster for these changes and updates the database services to ensure reliable communication with the databases.

## Active-Active databases

On Kubernetes, Redis Enterprise [Active-Active]({{< relref "/operate/rs/databases/active-active/" >}}) databases provide read and write access to the same dataset from different Kubernetes clusters. Creating an Active-Active database requires routing [network access]({{< relref "/operate/kubernetes/networking/" >}}) between two Redis Enterprise clusters residing in different Kubernetes clusters. Without the proper access configured for each cluster, syncing between the databases instances will fail.The admission controller is also required for Active-Active databases on Kubernetes, to validate changes to the custom resources.

For more details and installation information, see [Active-Active databases]({{<relref "/operate/kubernetes/active-active/">}}). For more general information about Active-Active, see the [Redis Enterprise Software docs]({{< relref "/operate/rs/databases/active-active/" >}}).

## RedisEnterpriseRemoteCluster RERC

The [RedisEnterpriseRemoteCluster (RERC)]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api">}}) contains details allowing the REC to link to the RedisEnterpriseActiveActiveDatabase (REAADB). The RERC resource is listed in the [REAADB](#redisenterpriseactiveactivedatabase-reaadb) resource to become a participating cluster for the Active-Active database.

See the [RERC API reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_remote_cluster_api">}}) for a full list of fields and settings.

## RedisEnterpriseActiveActiveDatabase REAADB

The RedisEnterpriseActiveActiveDatabase (REAADB) resource creates and manages a database that spans more than one Kubernetes cluster. An REAADB requires [external routing](#networking), at least two [RECs](#redisenterprisecluster-rec), and at least two [RERCs](#redisenterpriseremotecluster-rerc).

See the [REAADB API reference]({{<relref "/operate/kubernetes/reference/api/redis_enterprise_active_active_database_api">}}) for a full list of fields and settings.

## Metrics

To collect  metrics data from your databases and Redis Enterprise cluster (REC), you can [connect your Prometheus]({{<relref "/operate/kubernetes/re-clusters/connect-prometheus-operator">}}) server to an endpoint exposed on your REC. Redis Enterprise for Kubernetes creates a dedicated service to expose the `prometheus` port (8070) for data collection. A custom resource called `ServiceMonitor` allows the [Prometheus operator](https://github.com/prometheus-operator/prometheus-operator/tree/main/Documentation) to connect to this port and collect data from Redis Enterprise.

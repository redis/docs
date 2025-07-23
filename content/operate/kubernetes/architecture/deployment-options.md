---
Title: Flexible deployment options
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: Redis Enterprise for Kubernetes allows you to deploy to multiple namespaces.
  This article describes flexible deployment options you can use to meet your specific
  needs.
linkTitle: Deployment options
aliases: [/operate/kubernetes/deployment/deployment-options/, /operate/kubernetes/7.4.6/deployment/deployment-options/]
---
You can deploy Redis Enterprise for Kubernetes in several different ways depending on your database needs.

Multiple RedisEnterpriseDatabase (REDB) resources can be associated with a single Redis Enterprise cluster resource (REC) even if they reside in different namespaces.

The Redis Enterprise cluster (REC) custom resource must reside in the same namespace as the Redis Enterprise operator.

{{<warning>}} Multi-namespace installations don't support Active-Active databases (REEADB). Only databases created with the REDB resource are supported in multi-namespace deployments at this time.{{</warning>}}

## Single REC and single namespace (one-to-one)

The standard and simplest deployment deploys your Redis Enterprise databases (REDB) in the same namespace as the Redis Enterprise cluster (REC). No additional configuration is required for this, since there is no communication required to cross namespaces. See [Deploy Redis Enterprise for Kubernetes]({{< relref "/operate/kubernetes/deployment/quick-start" >}}).

{{< image filename="/images/k8s/k8s-deploy-one-to-one.png" >}}

## Single REC and multiple namespaces (one-to-many)

Multiple Redis Enterprise databases (REDB) spread across multiple namespaces within the same K8s cluster can be associated with the same Redis Enterprise cluster (REC). See [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) for more information.

{{< image filename="/images/k8s/k8s-deploy-one-to-many.png" >}}

## Multiple RECs and multiple namespaces (many-to-many)

A single Kubernetes cluster can contain multiple Redis Enterprise clusters (REC), as long as they reside in different namespaces. Each namespace can host only one REC and each operator can only manage one REC.

You have the flexibility to create databases in separate namespaces, or in the same namespace as the REC, or combine any of the supported deployment options above. This configuration is geared towards use cases that require multiple Redis Enterprise clusters with greater isolation or different cluster configurations.

See [Manage databases in multiple namespaces]({{< relref "/operate/kubernetes/re-clusters/multi-namespace" >}}) for more information.


{{< image filename="/images/k8s/k8s-deploy-many-to-many-new.png" >}}

## Unsupported deployment patterns

### Cross-cluster operations

Redis Enterprise for Kubernetes does not support operations that cross Kubernetes clusters. Redis Enterprise clusters (REC) work inside a single K8s cluster. Crossing clusters could result in functional and security issues.

{{< image filename="/images/k8s/k8s-deploy-cross-namespaces.png" >}}

### Multiple RECs in one namespace

Redis Enterprise for Kubernetes does not support multiple Redis Enterprise clusters (REC) in the same namespace. Creating more than one REC in the same namespace will result in errors.

{{< image filename="/images/k8s/k8s-deploy-multicluster-antipattern.png" >}}

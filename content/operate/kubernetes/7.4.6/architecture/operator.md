---
Title: Redis Enterprise for Kubernetes operator-based architecture
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section provides a description of the design of Redis Enterprise
  for Kubernetes.
linkTitle: What is an operator?
weight: 30
url: '/operate/kubernetes/7.4.6/architecture/operator/'
---
Redis Enterprise is the fastest, most efficient way to
deploy and maintain a Redis Enterprise cluster in Kubernetes.

## What is an operator?

An operator is a [Kubernetes custom controller](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#custom-controllers) which extends the native K8s API.

Operators were developed to handle sophisticated, stateful applications
that the default K8s controllers aren’t able to handle. While stock
Kubernetes controllers—for example,
[StatefulSets](https://kubernetes.io/docs/concepts/workloads/controllers/statefulset/)—are
ideal for deploying, maintaining and scaling simple stateless
applications, they are not equipped to handle access to stateful
resources, upgrade, resize and backup of more elaborate, clustered
applications such as databases.

## What does an operator do?

In abstract terms, Operators encode human operational knowledge into
software that can reliably manage an application in an extensible,
modular way and do not hinder the basic primitives that comprise the K8s
architecture.

Redis created an operator that deploys and manages the lifecycle of a Redis Enterprise Cluster.

The Redis Enterprise operator acts as a custom controller for the custom
resource RedisEnterpriseCluster, or ‘rec’, which is defined through K8s
CRD ([custom resource definition](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/#custom-resources))
and deployed with a yaml file.

The operator functions include:

- Validating the deployed Cluster spec (for example, requiring the
deployment of an odd number of nodes)
- Implementing a reconciliation loop to monitor all the applicable
resources
- Logging events
- Enabling a simple mechanism for editing the Cluster spec

The Redis Enterprise operator functions as the logic "glue" between the
K8s infrastructure and the Redis Enterprise Cluster.

The operator creates the following resources:

- Service account
- Service account role
- Service account role binding
- Secret – holds the cluster username, password, and license
- Statefulset – holds Redis Enterprise nodes
- The Services Manager deployment – exposes databases and tags nodes
- The Redis UI service
- The service that runs the REST API + Sentinel
- Pod Disruption Budget
- Optionally: a deployment for the Service Broker, including services and a PVC

The following diagram shows the high-level architecture of the Redis
Enterprise operator:

{{< image filename="/images/k8s/k8-high-level-architecture-diagram-of-redis-enterprise.png" >}}

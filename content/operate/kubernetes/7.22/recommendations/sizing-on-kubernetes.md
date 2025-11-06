---
Title: Size and scale a Redis Enterprise cluster deployment on Kubernetes
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section provides information about sizing and scaling Redis Enterprise
  in a Kubernetes deployment.
linkTitle: Sizing and scaling
weight: 50
url: '/operate/kubernetes/7.22/recommendations/sizing-on-kubernetes/'
---
The following article reviews the mechanism and methods available for sizing
and scaling a Redis Enterprise cluster deployment.

For minimum and recommended sizing, always follow the sizing guidelines
detailed in the [Redis Enterprise hardware requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}).

## Sizing and scaling cluster nodes

### Setting the number of cluster nodes

Define the number of cluster nodes in redis-enterprise-cluster.yaml file.

    spec:

        nodes: 3

The number of nodes in the cluster must be an uneven number
equal to or greater than 3. Refer to the article [Highly Available Redis](https://redislabs.com/redis-enterprise/technology/highly-available-redis/)
for a detailed explanation on this topic.

Set the number of cluster nodes during deployment
by editing the redis-enterprise-cluster.yaml file and
applying the file by running:

    kubectl apply -f redis-enterprise-cluster.yaml

### Scaling out

To scale out a Redis Enterprise Cluster deployment, increase the number of nodes
in the spec. For example, to scale the cluster out from 3 nodes to 5 nodes,
edit the redis-enterprise-cluster.yaml file with the following:

    spec:

        nodes: 5

To apply the new cluster configuration run:

    kubectl apply -f redis-enterprise-cluster.yaml

{{<warning>}} Decreasing the number of nodes is not supported.{{</warning>}}

### Sizing compute resources

To set the compute resources required for each node,
use the redisEnterpriseNodeResources spec field.

Under redisEnterpriseNodeResources spec, set the following fields
according to the provided guidelines.

- limits – specifies the maximum compute resources for a Redis node
- requests – specifies the minimum compute resources for a Redis node

For example:

    redisEnterpriseNodeResources:

        limits:

        cpu: "2000m"

        memory: 4Gi

        requests:

        cpu: "2000m"

        memory: 4Gi

The default values, if unspecified, are 2 cores (2000m) and 4GB (4Gi).

Set the compute resources for cluster nodes during deployment
by editing the redis-enterprise-cluster.yaml file and
applying the file by running:

    kubectl apply -f redis-enterprise-cluster.yaml

### Scaling up node compute resources

To scale up nodes in an existing Redis Enterprise Cluster deployment,
adjust the cpu and memory parameters in the spec. For example,
to scale nodes up to the recommended amount of compute resources,
edit the redis-enterprise-cluster.yaml file with the following:

redisEnterpriseNodeResources:

    limits:

        cpu: "8000m"

        memory: 30Gi

    requests

        cpu: "8000m"

        memory: 30Gi

Then, apply the file by running:

    kubectl apply -f redis-enterprise-cluster.yaml

{{< warning >}}
When adjusting compute resources, make sure the ratio of persistent volume size and the new memory size are in accordance to the [Hardware
requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements" >}}). 

Persistent volume claims can be expanded, but not reduced after creation. See [Expand PersistentVolumeClaim (PVC)]({{<relref "/operate/kubernetes/7.22/re-clusters/expand-pvc">}}) for details.
{{< /warning >}}

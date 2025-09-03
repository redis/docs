---
Title: Use persistent volumes in Redis Enterprise clusters
alwaysopen: false
categories:
- docs
- operate
- kubernetes
description: This section covers details about how persistent volumes are sized and
  specified for Redis Enterprise cluster deployments.
linkTitle: Persistent volumes
weight: 40
url: '/operate/kubernetes/7.4.6/recommendations/persistent-volumes/'
---
## Storage types

Redis Enterprise for Kubernetes can only use storage classes supported by block storage. Block storage is mounted at the Kubernetes node level and utilizes EXT4 or XFS file systems. It can be sourced from enterprise-grade SANs or cloud environments such as EBS, Azure Managed Disks, or GCP persistent disks.

{{<warning>}}
NFS, NFS-like, and multi-read-write/shared storage options are not supported. These types of storage are often slow and can cause locking behaviors that are incompatible with the requirements of database storage.
{{</warning>}}

## REC `persistentSpec` field 
To deploy a Redis Enterprise cluster with Redis Enterprise operator the
spec should include a *persistentSpec* section, in the
*redis-enterprise-cluster.yaml* file:

    spec:
      nodes: 3
      persistentSpec:
       enabled: true
       storageClassName: "standard"
       volumeSize: "23Gi” #optional

Persistence storage is a requirement for production deployments.

{{< note >}}
For **production deployments** of Redis Enterprise Cluster on Kubernetes,
the Redis Enterprise Cluster (REC) must be deployed with persistence enabled.
The REC deployment files in the [Kubernetes documentation](https://github.com/RedisLabs/redis-enterprise-k8s-docs) contain this declaration by default.
{{< /note >}}

## Volume size

*volumeSize* is an optional definition. By default, if the definition is
omitted, operator allocates five times (5x) the amount of memory (RAM)
defined for nodes (see example below), which is the recommended
persistent storage size as described in the [Hardware
requirements]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}}) article.

To explicitly specify the persistent storage size, use the *volumeSize*
property as described in the example above.

Persistent volume claims can be expanded, but not reduced after creation. See [Expand PersistentVolumeClaim (PVC)]({{<relref "/operate/kubernetes/7.4.6/re-clusters/expand-pvc">}}) for details.

{{< note >}}
We recommend that you omit the volumeSize definition from the REC declaration
so that the Redis Enterprise Cluster deployment on Kubernetes use the default volume size.
{{< /note >}}

## Storage class name

*storageClassName* determines the Storage Class resource, which is
defined by the Kubernetes cluster administrator, to be used for
persistent storage.

Different Kubernetes distributions and different deployments use
different Storage Class resources.

In order to determine the Storage Class resources available for your K8s
deployment, use the following command:

    kubectl get StorageClass

Typically, AWS provides "gp2” as the Storage Class name while GKE uses "standard.”
Azure provides two Storage Classes: "default" using HDDs, and "managed-premium" using SSDs.

Below is an example of a response to the command.

|                         |                                                         |
| ----------------------- | ------------------------------------------------------- |
| *Name:*                 | *gp2*                                                   |
| *IsDefaultClass:*       | *Yes*                                                   |
| *Annotations:*          | *storageclass.beta.kubernetes.io/is-default-class=true* |
| *Provisioner:*          | *kubernetes.io/aws-ebs*                                 |
| *Parameters:*           | *encrypted=false,kmsKeyId=,type=gp2*                    |
| *AllowVolumeExpansion:* | *\<unset\>*                                             |
| *MountOptions:*         | *\<none\>*                                              |
| *ReclaimPolicy:*        | *Delete*                                                |
| *VolumeBindingMode:*    | *Immediate*                                             |
| *Events:*               | *\<none\>*                                              |

{{< note >}}
storageClassName must be specified for this deployment type.
{{< /note >}}

{{< warning >}}
The storage class cannot be changed after deployment. Trying to change this value after deployment could result in unexpected and potentially damaging behavior.
{{< /warning >}}

Example of the redisEnterpriseNodeResources definition:

    redisEnterpriseNodeResources:
      limits:
        cpu: "4000m”
        memory: 4Gi
      requests:
        cpu: "4000m”
        memory: 4Gi

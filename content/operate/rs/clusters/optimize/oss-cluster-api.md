---
Title: "Redis OSS Cluster API"
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
- kubernetes
description: Use the Redis OSS Cluster API to improve performance and keep applications current with cluster topology changes.
linktitle: "Redis OSS Cluster API"
weight: $weight
---
{{< embed-md "oss-cluster-api-intro.md"  >}}

You can use the Redis OSS Cluster API along with other Redis Enterprise Software high availability
to get high performance with low latency
and let applications stay current with cluster topology changes, including add node, remove node, and node failover.

For more about working with the OSS Cluster API in Redis Enterprise Software, see [Enable OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}). 

To learn how to enable OSS Cluster API in Redis Cloud, see [Clustering Redis databases]({{< relref "/operate/rc/databases/configuration/clustering#cluster-api" >}}).

To enable OSS Cluster API in Kubernetes, see [Enable OSS Cluster API]({{< relref "/operate/kubernetes/networking/cluster-aware-clients#enable-oss-cluster-api" >}}).

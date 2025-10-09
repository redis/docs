---
Title: "Redis OSS Cluster API"
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Use the Redis OSS Cluster API to improve performance and keep applications current with cluster topology changes.
linktitle: "Redis OSS Cluster API"
weight: $weight
---
{{< embed-md "oss-cluster-api-intro.md"  >}}

{{< warning >}}
Kubernetes limitation: OSS Cluster API can only be used by clients running within the same Kubernetes cluster as the Redis Enterprise pods. External clients cannot use OSS Cluster API due to pod IP address accessibility limitations.
{{< /warning >}}

You can use the Redis OSS Cluster API along with other Redis Enterprise Software high availability
to get high performance with low latency
and let applications stay current with cluster topology changes, including add node, remove node, and node failover.

For more about working with the OSS Cluster API in Redis Enterprise Software, see [Enable OSS Cluster API]({{< relref "/operate/rs/databases/configure/oss-cluster-api" >}}). 

To learn how to enable OSS Cluster API in Redis Cloud, see [Clustering Redis databases]({{< relref "/operate/rc/databases/configuration/clustering#cluster-api" >}}).

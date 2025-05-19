---
Title: Dynatrace with Redis Cloud
LinkTitle: Dynatrace with Redis Cloud
categories:
- docs
- integrate
- rs
description: To collect, view, and monitor metrics data from your databases and other
  cluster components, you can connect Dynatrace to your Redis Cloud cluster using
  the Redis Dynatrace Integration.
group: observability
summary: To collect, view, and monitor metrics data from your databases and other
  cluster components, you can connect Dynatrace to your Redis Cloud cluster using
  the Redis Dynatrace Integration.
type: integration
weight: 7
---


[Dynatrace](https://www.dynatrace.com/) is used by organizations of all sizes and across a wide range of industries to 
enable digital transformation and cloud migration, drive collaboration among development, operations, security and 
business teams, accelerate time to market for applications, reduce time to problem resolution, secure applications and 
infrastructure, understand user behavior, and track key business metrics.

The Redis Dynatrace Integration for Redis Cloud uses Prometheus remote write functionality to connect Prometheus data 
sources to Dynatrace. This integration enables Redis Cloud users to export metrics to Dynatrace for analysis, 
and includes Redis-designed dashboards for use in monitoring Redis Cloud clusters.

This integration makes it possible to:
- Collect and display metrics not available in the admin console
- Set up automatic alerts for node or cluster events
- Display these metrics alongside data from other systems

{{< image filename="/images/rc/redis-cloud-dynatrace.png" >}}
## Install Redis' Dynatrace Integration for Redis Cloud

The Dynatrace Integration is based on a feature of the Prometheus data source. Prometheus can forward metrics on to 
another destination using remote writes. This will require a Prometheus installation inside the same datacenter as the 
Redis Cloud deployment.

If you have not already created a VPC between the Redis Cloud cluster and the network in which the machine hosting 
Prometheus lives you should do so now. Please visit [VPC Peering](https://redis.io/docs/latest/operate/rc/security/network-security/connect-private-endpoint/vpc-peering/) 
and follow the instructions for the cloud platform of your choice.



## View metrics

The Redis Cloud Integration for Dynatrace contains pre-defined dashboards to aid in monitoring your Redis Enterprise deployment.

The following dashboards are currently available:

- Cluster: top-level statistics indicating the general health of the cluster
- Database: performance metrics at the database level
- Shard: low-level details of an individual shard
- Active-Active: replication and performance for geo-replicated clusters
- Proxy: network and command information regarding the proxy
- Proxy Threads: processor usage information regarding the proxy's component threads 

## Monitor metrics

Dynatrace dashboards can be filtered using the text area. For example, when viewing a cluster dashboard it is possible 
filter the display to show data for only one cluster by typing 'cluster' in the text area and waiting for the system to
retrieve the relevant data before choosing one of the options in the 'cluster' section.

Certain types of data do not know the name of the database from which they were drawn. The dashboard should have a list 
of database names and ids; use the id value when filtering input to the dashboard. 




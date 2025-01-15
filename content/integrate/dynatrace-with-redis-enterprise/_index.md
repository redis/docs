---
LinkTitle: Dynatrace with Redis Enterprise
Title: Dynatrace with Redis Enterprise
alwaysopen: false
categories:
- docs
- integrate
- rs
description: To collect, view, and monitor metrics data from your databases and other
  cluster components, you can connect Dynatrace to your Redis Enterprise cluster using
  the Redis Dynatrace Integration.
group: observability
summary: To collect, view, and monitor metrics data from your databases and other
  cluster components, you can connect Dynatrace to your Redis Enterprise cluster using
  the Redis Dynatrace Integration.
type: integration
weight: 7
---


[Dynatrace](https://www.dynatrace.com/) is used by organizations of all sizes and across a wide range of industries to 
enable digital transformation and cloud migration, drive collaboration among development, operations, security and 
business teams, accelerate time to market for applications, reduce time to problem resolution, secure applications and 
infrastructure, understand user behavior, and track key business metrics.

The Dynatrace Integration for Redis Enterprise uses Prometheus remote write functionality to connect Prometheus data 
sources to Dynatrace. This integration enables Redis Enterprise users to export metrics to Dynatrace for analysis, 
and includes Redis-designed dashboards for use in monitoring Redis Enterprise clusters.

This integration makes it possible to:
- Collect and display metrics not available in the admin console
- Set up automatic alerts for node or cluster events
- Display these metrics alongside data from other systems

{{< image filename="/images/rs/redis-enterprise-dynatrace.png" >}}
## Install Redis' Dynatrace Integration for Redis Enterprise

At the present time the Dynatrace integration is not signed by Dynatrace, meaning that it will be necessary to download 
the source configuration and dashboards and assemble them and sign them cryptologically with a certificate that you have 
created. The instructions for this procedure can be found on the Dynatrace 
[site](https://docs.dynatrace.com/docs/extend-dynatrace/extensions20/sign-extension). Please note that the instructions 
would have you place the dashboards next to the src folder; this is incorrect, the dashboards should be located inside 
the src folder.

## View metrics

The Redis Enterprise Integration for Dynatrace contains pre-defined dashboards to aid in monitoring your Redis Enterprise deployment.

The following dashboards are currently available:

- Cluster: top-level statistics indicating the general health of the cluster
- Database: performance metrics at the database level
- Node: machine performance statistics
- Shard: low-level details of an individual shard
- Active-Active: replication and performance for geo-replicated clusters
- Proxy: network and command information regarding the proxy
- Proxy Threads: processor usage information regarding the proxy's component threads 


## Monitor metrics

Dynatrace dashboards can be filtered using the text area. For example, when viewing a cluster dashboard it is possible to
filter the display to show data for only one cluster by typing 'cluster' in the text area and waiting for the system to
retrieve the relevant data before choosing one of the options in the 'cluster' section.

Certain types of data do not know the name of the database from which they were drawn. The dashboard should have a list 
of database names and ids; use the id value when filtering input to the dashboard. 



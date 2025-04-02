---
Title: Durability and high availability
alwaysopen: false
categories:
- docs
- operate
- rs
description: Overview of Redis Enterprise durability features such as replication,
  clustering, and rack-zone awareness.
hideListLinks: true
linktitle: Durability and availability
weight: 60
url: '/operate/rs/7.4/databases/durability-ha/'
---
Redis Enterprise Software comes with several features that make your data more durable and accessible. The following features can help protect your data in cases of failures or outages and help keep your data available when you need it.

## Replication

When you [replicate your database]({{<relref "/operate/rs/7.4/databases/durability-ha/replication">}}), each database instance (shard) is copied one or more times. Your database will have one primary shard and one or more replica shards. When a primary shard fails, Redis Enterprise automatically promotes a replica shard to primary. 

## Clustering

[Clustering]({{<relref "/operate/rs/7.4/databases/durability-ha/clustering">}}) (or sharding) breaks your database into individual instances (shards) and spreads them across several nodes. Clustering lets you add resources to your cluster to scale your database and prevents node failures from causing availability loss.

## Database persistence

[Database persistence]({{<relref "/operate/rs/7.4/databases/configure/database-persistence">}}) gives your database durability against process or server failures by saving data to disk at set intervals.

## Active-Active geo-distributed replication

[Active-Active Redis Enterprise databases]({{<relref "/operate/rs/7.4/databases/active-active">}}) distribute your replicated data across multiple nodes and availability zones. This increases the durability of your database by reducing the likelihood of data or availability loss. It also reduces data access latency.

## Rack-zone awareness

[Rack-zone awareness]({{<relref "/operate/rs/7.4/clusters/configure/rack-zone-awareness">}}) maps each node in your Redis Enterprise cluster to a physical rack or logical zone. The cluster uses this information to distribute primary shards and their replica shards in different racks or zones. This ensures data availability if a rack or zone fails.

## Discovery service

The [discovery service]({{<relref "/operate/rs/7.4/databases/durability-ha/discovery-service">}}) provides an IP-based connection management service used when connecting to Redis Enterprise Software databases. It lets your application discover which node hosts the database endpoint. The discovery service API complies with the [Redis Sentinel API]({{< relref "/operate/oss_and_stack/management/sentinel" >}}#sentinel-api).

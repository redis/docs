---
Title: Configure cluster DNS
alwaysopen: false
categories:
- docs
- operate
- rs
description: Configure DNS to communicate between nodes in your cluster.
linkTitle: Configure cluster DNS
weight: $weight
url: '/operate/rs/7.8/networking/cluster-dns/'
---

By default, Redis Enterprise Software deployments use DNS to communicate between nodes.  You can also use the [Discovery Service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}}), which uses IP addresses to connect and complies with the [Redis Sentinel API]({{< relref "/operate/oss_and_stack/management/sentinel" >}}) supported by Redis Community Edition.

Each node in a Redis Enterprise cluster includes a small DNS server to manage internal functions, such as high availability, automatic failover, automatic migration, and so on.
Nodes should only run the DNS server included with the software.  Running additional DNS servers can lead to unexpected behavior.

## Cluster name and connection management

Whether you're administering Redis Enterprise Software or accessing databases, there are two ways to connect:

- URL-based connections - URL-based connections use DNS to resolve the fully qualified cluster domain name (FQDN).  This means that DNS records might need to be updated when topology changes, such as adding (or removing) nodes from the cluster.  

    Because apps and other client connections rely on the URL (rather than the address), they do not need to be modified when topology changes.  

- IP-based connections - IP-based connections do not require DNS setup, as they rely on the underlying TCP/IP addresses.  As long as topology changes do not change the address of the cluster nodes, no configuration changes are needed, DNS or otherwise.  

    However, changes to IP addresses (or changes to IP address access) impact all connections to the node, including apps and clients.  IP address changes can therefore be unpredictable or time-consuming.

## URL-based connections

The fully qualified domain name (FQDN) is the unique cluster identifier that enables clients to connect to the different components of Redis Enterprise Software.
The FQDN is a crucial component of the high-availability mechanism because it's used internally to enable and implement automatic and transparent failover of nodes, databases, shards, and endpoints.

{{< note >}}
Setting the cluster's FQDN is a one-time operation, one that cannot be changed after being set.
{{< /note >}}

The FQDN must always comply with the IETF's [RFC 952](https://datatracker.ietf.org/doc/html/rfc952) standard
and section 2.1 of the [RFC 1123](https://datatracker.ietf.org/doc/html/rfc1123) standard.

## Identify the cluster

To identify the cluster, either use DNS to define a fully qualified domain name or use the IP addresses of each node.  

### Define domain using DNS

Use DNS if you:

- have your own domain
- want to integrate the cluster into that domain
- can access and update the DNS records for that domain

1. Make sure that the cluster and at least one node (preferably all nodes) in the cluster
    are correctly configured in the DNS with the appropriate NS entries.

    For example:

    - Your domain is: `mydomain.com`
    - You would like to name the Redis Enterprise Software cluster `mycluster`
    - You have three nodes in the cluster:
        - node1 (IP address 1.1.1.1)
        - node2 (2.2.2.2)
        - node3 (3.3.3.3)

1. In the FQDN field, enter the value `mycluster.mydomain.com`
    and add the following records in the DNS table for `mydomain.com`:

    ``` sh
    mycluster.mydomain.com        NS  node1.mycluster.mydomain.com
                                      node2.mycluster.mydomain.com
                                      node3.mycluster.mydomain.com 
    
    node1.mycluster.mydomain.com  A   1.1.1.1
    
    node2.mycluster.mydomain.com  A   2.2.2.2
    
    node3.mycluster.mydomain.com  A   3.3.3.3
    ```

### Zero-configuration using mDNS {#zeroconfiguration-using-mdns-development-option-only}

Development and test environments can use [Multicast DNS](https://en.wikipedia.org/wiki/Multicast_DNS) (mDNS), a zero-configuration service designed for small networks.  Production environments should _not_ use mDNS.

mDNS is a standard protocol that provides DNS-like name resolution and service discovery capabilities
to machines on local networks with minimal to no configuration.

Before adopting mDNS, verify that it's supported by each client you wish to use to connect to your Redis databases.  Also make sure that your network infrastructure permits mDNS/multi-casting between clients and cluster nodes.

Configuring the cluster to support mDNS requires you to assign the cluster a `.local` name.

For example, if you want to name the Redis Enterprise Software cluster `rediscluster`, specify the FQDN name as `rediscluster.local`.

When using the DNS or mDNS option, failover can be done transparently and the DNS is updated automatically to point to the IP address of the new primary node.

## IP-based connections

When you use the IP-based connection option, the FQDN does not need to have any special format
because clients use IP addresses instead of hostnames to access the databases so you are free to choose whatever name you want.
Using the IP-based connection option does not require any DNS configuration either.

To administer the cluster you do need to know the IP address of at least one of the nodes in the cluster.
Once you have the IP address, you can simply connect to port number 8443 (for example: <https://10.0.0.12:8443>).
However, as the topology of the cluster changes and node with the given IP address is removed,
you need to remember the IP address of another node participating in this cluster to connect to the Cluster Manager UI and manage the cluster.

Applications connecting to Redis Software databases have the same constraints.
When using the IP-based connection method, you can use the [Discovery Service]({{< relref "/operate/rs/databases/durability-ha/discovery-service.md" >}})
to discover the database endpoint for a given database name as long as you have an IP address for at least one of the nodes in the cluster.
The API used for discovery service is compliant with the Redis Sentinel API.

To test your connection, try pinging the service.  For help, see [Connect to your database]({{< relref "/operate/rs/databases/connect/test-client-connectivity" >}}).


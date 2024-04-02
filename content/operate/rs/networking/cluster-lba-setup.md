---
Title: Set up cluster behind a load balancer
alwaysopen: false
categories:
- docs
- operate
- rs
description: Set up a cluster using a load balancer instead of DNS to direct traffic to cluster nodes.
linkTitle: Cluster load balancer setup
weight: $weight
---
When you want to setup a Redis Enterprise cluster in an environment that doesn't allow DNS, you can use a load balancer (LB) to direct traffic to the cluster nodes.

## DNS role for databases

Normally, Redis Enterprise uses DNS to provide dynamic database endpoints.
A DNS name such as `redis-12345.clustername.domain` gives clients access to the database resource:

- If multiple proxies are in use, the DNS name resolves to multiple IP addresses so that clients can load balance.
- On failover or topology changes, the DNS name is automatically updated to reflect the live IP addresses.

When DNS cannot be used, clients can still connect to the endpoints with the IP addresses,
but the benefits of load balancing and automatic updates to IP addresses won't be available.

## Network architecture with load balancer

You can compensate for the lack of DNS resolution with load balancers that can expose services and provide service discovery.
A load balancer is configured in front of Redis Enterprise cluster, exposing several logical services:

- Control plane services, such as the RS admin console to access cluster administration interface
- Data plane services, such as a database endpoint to connect from client applications

Depending on which Redis Enterprise services you want to access outside the cluster you may need to configure the load balancers separately.
One or more Virtual IPs (VIPs) are defined on the load balancer to expose Redis Enterprise services.
The architecture is shown in the following diagram with 3 nodes Redis Enterprise cluster with one database (DB1) configured on port 12000:

{{< image filename="/images/rs/cluster-behind-load-balancer-top-down.png" alt="cluster-behind-load-balancer-top-down" >}}
## Setting up an RS cluster with load balancers

### Prerequisites

- [Install]({{< relref "/operate/rs/installing-upgrading" >}}) the latest version of RS on your clusters
- Configure the cluster with the cluster name (FQDN) even though DNS is not in use.
    Remember that the same cluster name is used to issue the licence keys.
    We recommend that you use a “.local” suffix in the FQDN.

### Configuring the load balancers

- Make sure that the load balancer is performing TCP health checks on the cluster nodes.
- Expose the services that you require through a Virtual IP, for example:
    - Web Management Portal (8443)
    - Rest API service (Secured - 9443; Non-secured - 8080)
    - Database ports (In the range of 10000-19999)

Other ports are shown in the list of [RS network ports]({{< relref "/operate/rs/networking/port-configurations.md" >}}).

{{< note >}}
Sticky, secured connections are needed only for RS admin console service (provided on port 8443).

- Certain LBAs provide specific logic to close idle connections. Either disable this feature or make sure the applications connecting to Redis use reconnection logic.
- Make sure the LB is fast enough to resolve connections between two clusters or applications that are connected to Redis databases through LB.
- Choose the standard LB which is commonly used in your environment so that you have easy access to in-house expertise for troubleshooting issues.
{{< /note >}}

### RS cluster configuration

There are certain recommended settings within the cluster that guarantee a flawless connectivity experience for applications and admin users when they access the cluster through a Load Balancer.

{{< note >}}
- Run the `rladmin` commands directly on the cluster.
- The `rladmin` commands update the settings on all nodes in the cluster.
{{< /note >}}

The following settings are needed to allow inbound connections to be terminated on the relevant node inside the cluster:
```sh
    # enable all-node proxy policy by default
    rladmin tune cluster default_sharded_proxy_policy all-nodes

    # ensure we redirect where necessary when running behind an LBA
    rladmin cluster config handle_redirects enabled
```

An additional setting can be done to allow (on average) closer termination of client connection to where the Redis shard is located. This is an optional setting.

```sh
    # enable sparse placement by default
    rladmin tune cluster default_shards_placement sparse
```

### RS database configuration

After the cluster settings are updated and the LBs are configured you can go to the RS admin console at https://load-balancer-virtual-ip:8443/ and [create a new database]({{< relref "/operate/rs/databases/create.md" >}}).

If you are creating an Active-Active database, you will need to use the `crdb-cli` utility. See the [`crdb-cli` reference]({{< relref "/operate/rs/references/cli-utilities/crdb-cli" >}}) for more information about creating Active-Active databases from the command line.

### Keep LB configuration updated when the cluster configuration changes

When your RS cluster is located behind a load balancer, you must update the LB when the cluster topology and IP addresses change.
Some common cases that require you to update the LB are:

- Adding new nodes to the Redis Enterprise cluster
- Removing nodes from the Redis Enterprise cluster
- Maintenance for Redis Enterprise cluster nodes
- IP address changes for Redis Enterprise cluster nodes

After these changes, make sure that the redis connections in your applications can connect to the Redis database,
especially if they are directly connected on IP addresses that have changed.

## Intercluster communication considerations

Redis Enterprise supports several topologies that allow inter cluster replication, these include [Active/Passive]({{< relref "/operate/rs/databases/import-export/replica-of/" >}}) and [Active/Active]({{< relref "/operate/rs/databases/active-active/" >}}) for deployment options.
When your Redis Enterprise software clusters are located behind load balancers, you must allow some network services to be open and defined in the load balancers to allow the replication to work.

### Active-Passive

For Active-Passive communication to work, you will need to expose database port(s) locally in each cluster (as defined above) but also allow these ports through firewalls that may be positioned between the clusters.

### Active-Active

For Active-Active communication to work, you need to expose several ports, including every database port and several control plane ports as defined in [Network port configurations]({{< relref "/operate/rs/networking/port-configurations.md" >}}). Pay attention to services that are marked with Connection Source as "Active-Active". These ports should be allowed through firewalls that may be positioned between the clusters.

---
Title: Configure proxy policy
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linktitle: Proxy policy
weight: 40
url: '/operate/rs/7.8/databases/configure/proxy-policy/'
---
Redis Software provides high-performance data access
through a proxy process that manages and optimizes access to shards
within the Redis Software cluster. Each node contains a single proxy process.
Each proxy can be active and take incoming traffic or it can be passive
and wait for failovers.

## Proxy policies

A database can have one of the following proxy policies:

| Proxy policy | Description | Recommended use cases | Advantages | Disadvantages |
|--------------|-------------|-----------------------|-----------|-----------------|
| Single | Only a single proxy is bound to the database. This is the default database configuration. | Most use cases without high traffic or load | Lower resource usage, fewer application-to-cluster connections | Higher latency, more network hops |
| All primary shards | Multiple proxies are bound to the database, one on each node that hosts a database primary shard. | Most use cases that require multiple endpoints, such as when using the [OSS Cluster API]({{<relref "/operate/rs/7.8/clusters/optimize/oss-cluster-api">}}) | Lower latency, fewer network hops, higher throughput | Higher resource usage, more application-to-proxy connections |
| All nodes | Multiple proxies are bound to the database, one on each node in the cluster, regardless of whether or not there is a shard from this database on the node. | When using [load balancers]({{<relref "/operate/rs/7.8/networking/cluster-lba-setup">}}) for environments without DNS | Higher throughput | Highest resource usage |

## View proxy policy

You can use the Cluster Manager UI, [`rladmin`]({{<relref "/operate/rs/7.8/references/cli-utilities/rladmin">}}), or the [REST API]({{<relref "/operate/rs/7.8/references/rest-api">}}) to view proxy configuration settings.

The [`rladmin info cluster`]({{<relref "/operate/rs/7.8/references/cli-utilities/rladmin/info#info-cluster">}}) command returns the current proxy policy for sharded and non-sharded (single shard) databases.

```sh
$ rladmin info cluster
cluster configuration:
   ...
   default_non_sharded_proxy_policy: single
   default_sharded_proxy_policy: single
   ...
```

## Configure database proxy policy

You can use the [Cluster Manager UI](#cluster-manager-ui-method), the [REST API](#rest-api-method), or [`rladmin`](#command-line-method) to configure a database's proxy policy.

{{<warning>}}
Any configuration update that unbinds existing proxies can disconnect existing client connections.
{{</warning>}}

### Cluster Manager UI method

You can change a database's proxy policy when you [create]({{<relref "/operate/rs/7.8/databases/create">}}) or [edit]({{<relref "/operate/rs/7.8/databases/configure#edit-database-settings">}}) a database using the Cluster Manager UI:

1. While in edit mode on the database's configuration screen, expand the **Clustering** section.

1. Select a policy from the **Database proxy** list.

1. Click **Create** or **Save**.

### REST API method

You can specify a proxy policy when you [create a database]({{<relref "/operate/rs/7.8/references/rest-api/requests/bdbs#post-bdbs-v1">}}) using the REST API:

```sh
POST /v1/bdbs
{ 
  "proxy_policy": "single | all-master-shards | all-nodes",
  // Other database configuration parameters
}
```

To change the proxy policy of an existing database and endpoint, you can use an [update database configuration]({{<relref "/operate/rs/7.8/references/rest-api/requests/bdbs#put-bdbs">}}) REST API request:

```sh
PUT /v1/bdbs/<database-id>
{ 
  "proxy_policy": "single | all-master-shards | all-nodes",
  "endpoint": <endpoint_uid>
}
```

### Command-line method

You can configure a database's proxy policy using [`rladmin bind`]({{<relref "/operate/rs/7.8/references/cli-utilities/rladmin/bind">}}).

The following example changes the bind policy for a database named "db1" with an endpoint ID "1:1" to "All primary shards" proxy policy:

```sh
rladmin bind db db1 endpoint 1:1 policy all-master-shards
```

The next command performs the same task using the database ID instead of the name. The ID of this database is "1".

```sh
rladmin bind db db:1 endpoint 1:1 policy all-master-shards
```

{{< note >}}
You can find the endpoint ID for the endpoint argument by running `rladmin status`. Look for the endpoint ID information under
the `ENDPOINT` section of the output.
{{< /note >}}

### Reapply policies after topology changes

If you want to reapply the policy after topology changes, such as node restarts,
failovers and migrations, run this command to reset the policy:

```sh
rladmin bind db db:<ID> endpoint <endpoint id> policy <all-master-shards|all-nodes>
```

This is not required with single policies.

#### Other implications

During the regular operation of the cluster different actions might take
place, such as automatic migration or automatic failover, which change
what proxy needs to be bound to what database. When such actions take
place the cluster attempts, as much as possible, to automatically change
proxy bindings to adhere to the defined policies. That said, the cluster
attempts to prevent any existing client connections from being
disconnected, and hence might not entirely enforce the policies. In such
cases, you can enforce the policy using the appropriate rladmin
commands.

## Multiple active proxies

Each database you create in a Redis Software cluster has an endpoint, which consists of a unique URL and port on the FQDN. This endpoint receives all the traffic for all operations for that database. By default, Redis Software binds this database endpoint to one of the proxies on a single node in the cluster. This proxy becomes an active proxy and receives all the operations for the given database. If the node with the active proxy fails, a new proxy on another node takes over as part of the failover process automatically.

In most cases, a single proxy can handle a large number of operations
without consuming additional resources. However, under high load,
network bandwidth, or a high rate of packets per second (PPS) on the
single active proxy can become a bottleneck to how fast database
operations can be performed. In such cases, having multiple active proxies across multiple nodes, mapped to the same external database
endpoint, can significantly improve throughput.

You can configure a database to have multiple internal proxies, which can improve performance in some cases.
Even though multiple active proxies can help improve the throughput of database
operations, configuring multiple active proxies may cause additional
latency in operations as the shards and proxies are spread across
multiple nodes in the cluster.

{{< note >}}
When the network on a single active proxy becomes the bottleneck, consider enabling multiple NIC support in Redis Software. With nodes that have multiple physical NICs (Network Interface Cards), you can configure Redis Software to separate internal and external traffic onto independent physical NICs. For more details, refer to [Multi-IP & IPv6]({{< relref "/operate/rs/7.8/networking/multi-ip-ipv6.md" >}}).
{{< /note >}}

Having multiple proxies for a database can improve Redis Software's ability for fast failover in case of proxy or node failure. With multiple proxies for a database, a client doesn't need to wait for the cluster to spin up another proxy and a DNS change in most cases. Instead, the client uses the next IP address in the list to connect to another proxy.

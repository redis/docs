Redis OSS Cluster API reduces access times and latency with near-linear scalability.
The Redis OSS Cluster API provides a simple mechanism for Redis clients to know the cluster topology.

Clients must first connect to the master node to get the cluster topology,
and then they connect directly to the Redis proxy on each node that hosts a master shard.

{{< note >}}
You must use a client that supports the OSS cluster API to connect to a database
that has the OSS cluster API enabled.
{{< /note >}}

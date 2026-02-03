The number of databases is unlimited. The limiting factor is the
available memory in the cluster, and the number of shards in the
subscription.

Note that the impact of the specific database configuration on the 
number of shards it consumes. For example:

- Enabling database replication, without enabling database clustering, 
  creates two shards: a master shard and a replica shard.
- Enabling database clustering creates as many database shards as you 
  configure.
- Enabling both database replication and database clustering creates 
  double the number of database shards you configure.
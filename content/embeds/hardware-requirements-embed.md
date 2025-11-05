The hardware requirements for Redis Enterprise Software are different for development and production environments.

- In a development environment, you can test your application with a live database.

    If you want to test your application under production conditions, use the production environment requirements.

- In a production environment, you must have enough resources to handle the load on the database and recover from failures.

## Development environment

You can build your development environment with non-production hardware, such as a laptop, desktop, or small VM or instance,
and with these hardware requirements:

| Item | Description | Minimum requirements | Recommended |
|------------|-----------------|------------|-----------------|
| Nodes per cluster | You can install on one node but many features require at least two nodes. | 1 node | >= 2 nodes |
| RAM per node | The amount of RAM for each node. | 4GB | >= 10GB |
| Storage per node | The amount of storage space for each node. | 10GB | >= 20GB |

## Production environment

We recommend these hardware requirements for production systems or for development systems that are designed to demonstrate production use cases:

| Item | Description | Minimum requirements | Recommended |
|------------|-----------------|------------|-----------------|
| Nodes<sup>[1](#table-note-1)</sup> per cluster | At least three nodes are required to support a reliable, highly available deployment that handles process failure, node failure, and network split events in a consistent manner. | 3 nodes | >= 3 nodes (Must be an odd number of nodes) |
| Cores<sup>[2](#table-note-2)</sup> per node | Redis Enterprise Software is based on a multi-tenant architecture and can run multiple Redis processes (or shards) on the same core without significant performance degradation. | 2 cores | >=8 cores |
| RAM<sup>[3](#table-note-3)</sup> per node | Defining your RAM size must be part of the capacity planning for your Redis usage. | 8GB | >=32GB |
| Ephemeral storage | Used for storing [replication files (RDB format) and cluster log files]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}). | RAM x 2 | >= RAM x 4 |
| Persistent storage<sup>[4](#table-note-4)</sup> | Used for storing [snapshot (RDB format) and AOF files]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}) over a persistent storage media, such as AWS Elastic Block Storage (EBS) or Azure Data Disk. | RAM x 3 | In-memory >= RAM x 4 (except for [extreme 'write' scenarios]({{< relref "/operate/rs/clusters/optimize/disk-sizing-heavy-write-scenarios" >}}))<br /><br /> [Redis Flex and Auto Tiering]({{< relref "/operate/rs/databases/flash/" >}}) >= (RAM + Flash) x 4. |
| Network<sup>[5](#table-note-5)</sup> | We recommend using multiple NICs per node where each NIC is >1Gbps, but Redis Enterprise Software can also run over a single 1Gbps interface network used for processing application requests, inter-cluster communication, and storage access. | 1G | >=10G |
| Local disk for [Redis Flex and Auto Tiering]({{< relref "/operate/rs/databases/flash/" >}}) | used to to extend databases DRAM capacity with solid state drives (SSDs). Flash memory must be locally attached. [Read more]({{< relref "/operate/rs/databases/flash/" >}}) | (RAM+Flash) x 1.6 | (RAM+Flash) x 2.5 |


Additional considerations:

1. <a name="table-note-1"></a>Nodes per cluster:

    - Clusters with more than 35 nodes are not supported. Please contact the Redis support team for assistance if your sizing calls for deploying a larger number of nodes.

    - Quorum nodes also must comply with the above minimal hardware requirements.
    
    - To ensure synchronization and consistency, Active-Active deployments with three-node clusters should not use quorum nodes. Because quorum nodes do not store data shards, they cannot support replication. In case of a node failure, replica shards aren't available for Active-Active synchronization.

2. <a name="table-note-2"></a>Cores:

    - When the CPU load reaches a certain level, Redis Enterprise Software sends an alert to the operator.  

    - If your application is designed to put a lot of load on your Redis database, make sure that you have at least one available core for each shard of your database.

    - If some of the cluster nodes are utilizing more than 80% of the CPU, consider migrating busy resources to less busy nodes.

    - If all the cluster nodes are utilizing over 80% of the CPU, highly consider scaling out the cluster by [adding a node]({{< relref "/operate/rs/clusters/add-node" >}}).

3. <a name="table-note-3"></a> RAM:

    - Redis uses a relatively large number of buffers, which enable replica communication, client communication, pub/sub commands, and more.  As a result, you should ensure that 30% of the RAM is available on each node at any given time.

    - If one or more cluster nodes utilizes more than 65% of the RAM, consider migrating resources to less active nodes.

    - If all cluster nodes are utilizing more than 70% of available RAM, highly consider [adding a node]({{< relref "/operate/rs/clusters/add-node" >}}).

    - Do not run any other memory-intensive processes on the Redis Enterprise Software node.

4. <a name="table-note-4"></a>Persistent storage:

    - If no databases on the cluster have [persistence]({{< relref "/operate/rs/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}}) enabled, minimum persistent storage is RAM x 1.1 and the recommended persistent storage is RAM x 2. Persistent storage is essential because Redis Enterprise also uses it to maintain the cluster and database health, configurations, recovery procedures, and more.
  
5. <a name="table-note-5"></a>Network:

    - Only static IP addresses are supported to ensure nodes remain part of the cluster after a reboot.


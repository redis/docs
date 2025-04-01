---
Title: Benchmark an Auto Tiering enabled database
alwaysopen: false
categories:
- docs
- operate
- rs
description: null
linkTitle: Benchmark Auto Tiering
weight: $weight
url: '/operate/rs/7.8/references/memtier-benchmark/'
---
Auto Tiering on Redis Enterprise Software lets you use cost-effective Flash memory as a RAM extension for your database.

But what does the performance look like as compared to a memory-only database, one stored solely in RAM?

These scenarios use the `memtier_benchmark` utility to evaluate the performance of a Redis Enterprise Software deployment, including the trial version.  

The `memtier_benchmark` utility is located in `/opt/redislabs/bin/` of Redis Enterprise Software deployments.  To test performance for cloud provider deployments, see the [memtier-benchmark GitHub project](https://github.com/RedisLabs/memtier_benchmark).

For additional, such as assistance with larger clusters, [contact support](https://redislabs.com/company/support/).


## Benchmark and performance test considerations

These tests assume you're using a trial version of Redis Enterprise Software and want to test the performance of a Auto Tiering enabled database in the following scenarios:

- Without replication: Four (4) master shards
- With replication: Two (2) primary and two replica shards

With the trial version of Redis Enterprise Software you can create a cluster of up to four shards using a combination of database configurations, including:

- Four databases, each with a single master shard
- Two highly available databases with replication enabled (each database has one master shard and one replica shard)
- One non-replicated clustered database with four master shards
- One highly available and clustered database with two master shards and two replica shards

## Test environment and cluster setup

For the test environment, you need to:

1. Create a cluster with three nodes.
1. Prepare the flash memory.
1. Configure the load generation tool.

### Creating a three-node cluster {#creating-a-threenode-rs-cluster}

This performance test requires a three-node cluster.

You can run all of these tests on Amazon AWS with these hosts:

- 2 x i3.2xlarge (8 vCPU, 61 GiB RAM, up to 10GBit, 1.9TB NMVe SSD)

    These nodes serve RoF data

- 1 x m4.large, which acts as a quorum node

To learn how to install Redis Enterprise Software and set up a cluster, see:

- [Redis Enterprise Software quickstart]({{< relref "/operate/rs/installing-upgrading/quickstarts/redis-enterprise-software-quickstart" >}}) for a test installation
- [Install and upgrade]({{< relref "/operate/rs/installing-upgrading" >}}) for a production installation

These tests use a quorum node to reduce AWS EC2 instance use while maintaining the three nodes required to support a quorum node in case of node failure.  Quorum nodes can be on less powerful instances because they do not have shards or support traffic.

As of this writing, i3.2xlarge instances are required because they support NVMe SSDs, which are required to support RoF.  Auto Tiering requires Flash-enabled storage, such as NVMe SSDs.

For best results, compare performance of a Flash-enabled deployment to the performance in a RAM-only environment, such as a strictly on-premises deployment.

## Prepare the flash memory

After you install RS on the nodes,
the flash memory attached to the i3.2xlarge instances must be prepared and formatted with the `/opt/redislabs/sbin/prepare_flash.sh` script.

## Set up the load generation tool

The memtier_benchmark load generator tool generates the load on the RoF databases.
To use this tool, install RS on a dedicated instance that is not part of the RS cluster
but is in the same region/zone/subnet of your cluster.
We recommend that you use a relatively powerful instance to avoid bottlenecks at the load generation tool itself.

For these tests, the load generation host uses a c4.8xlarge instance type.

## Database configuration parameters

### Create a Auto Tiering test database

You can use the Redis Enterprise Cluster Manager UI to create a test database.
We recommend that you use a separate database for each test case with these requirements:

|  **Parameter** | **With replication** | **Without replication** | **Description** |
|  ------ | ------ | ------ | ------ |
|  Name | test-1 | test-2 | The name of the test database |
|  Memory limit | 100 GB | 100 GB | The memory limit refers to RAM+Flash, aggregated across all the shards of the database, including master and replica shards. |
|  RAM limit | 0.3 | 0.3 | RoF always keeps the Redis keys and Redis dictionary in RAM and additional RAM is required for storing hot values. For the purpose of these tests 30% RAM was calculated as an optimal value. |
|  Replication | Enabled | Disabled | A database with no replication has only master shards. A database with replication has master and replica shards. |
|  Data persistence | None | None | No data persistence is needed for these tests. |
|  Database clustering | Enabled | Enabled | A clustered database consists of multiple shards. |
|  Number of (master) shards | 2 | 4 | Shards are distributed as follows:<br/>- With replication: One master shard and one replica shard on each node<br/>- Without replication: Two master shards on each node |
|  Other parameters | Default | Default | Keep the default values for the other configuration parameters. |

## Data population

### Populate the benchmark dataset

The memtier_benchmark load generation tool populates the database.
To populate the database with N items of 500 Bytes each in size, on the load generation instance run:

```sh
$ memtier_benchmark -s $DB_HOST -p $DB_PORT --hide-histogram
--key-maximum=$N -n allkeys -d 500 --key-pattern=P:P --ratio=1:0
```

Set up a test database:

|  **Parameter** | **Description** |
|  ------ | ------ |
|  Database host<br/>(-s) | The fully qualified name of the endpoint or the IP shown in the RS database configuration |
|  Database port<br/>(-p) | The endpoint port shown in your database configuration |
|  Number of items<br/>(–key-maximum) | With replication: 75 Million<br/>Without replication: 150 Million |
|  Item size<br/>(-d) | 500 Bytes |

## Centralize the keyspace

### With replication {#centralize-with-repl}

To create roughly 20.5 million items in RAM for your highly available clustered database with 75 million items, run:

```sh
$ memtier_benchmark  -s $DB_HOST -p $DB_PORT --hide-histogram
--key-minimum=27250000 --key-maximum=47750000 -n allkeys
--key-pattern=P:P --ratio=0:1
```

To verify the database values, use **Values in RAM** metric, which is available from the **Metrics** tab of your database in the Cluster Manager UI.

### Without replication {#centralize-wo-repl}

To create 41 million items in RAM without replication enabled and 150 million items, run:

```sh
$ memtier_benchmark  -s $DB_HOST -p $DB_PORT --hide-histogram
--key-minimum=54500000 --key-maximum=95500000 -n allkeys
--key-pattern=P:P --ratio=0:1
```

## Test runs

### Generate load

#### With replication {#generate-with-repl}

We recommend that you do a dry run and double check the RAM Hit Ratio on the **Metrics** screen in the Cluster Manager UI before you write down the test results.

To test RoF with an 85% RAM Hit Ratio, run:

```sh
$ memtier_benchmark -s $DB_HOST -p $DB_PORT --pipeline=11 -c 20 -t 1
-d 500 --key-maximum=75000000 --key-pattern=G:G --key-stddev=5125000
--ratio=1:1 --distinct-client-seed --randomize --test-time=600
--run-count=1 --out-file=test.out
```

#### Without replication {#generate-wo-repl}

Here is the command for 150 million items:

```sh
$ memtier_benchmark -s $DB_HOST -p $DB_PORT --pipeline=24 -c 20 -t 1
-d 500 --key-maximum=150000000 --key-pattern=G:G --key-stddev=10250000
--ratio=1:1 --distinct-client-seed --randomize --test-time=600
--run-count=1 --out-file=test.out
```

Where:

|  **Parameter** | **Description** |
|------------|-----------------|
|  Access pattern (--key-pattern) and standard deviation (--key-stddev) | Controls the RAM Hit ratio after the centralization process is complete |
|  Number of threads (-t and -c)\ | Controls how many connections are opened to the database, whereby the number of connections is the number of threads multiplied by the number of connections per thread (-t) and number of clients per thread (-c) |
|  Pipelining (--pipeline)\ | Pipelining allows you to send multiple requests without waiting for each individual response (-t) and number of clients per thread (-c) |
|  Read\write ratio (--ratio)\ | A value of 1:1 means that you have the same number of write operations as read operations (-t) and number of clients per thread (-c) |

## Test results

### Monitor the test results

You can either monitor the results in the **Metrics** tab of the Cluster Manager UI or with the `memtier_benchmark` output.  However, be aware that:

- The memtier_benchmark results include the network latency between the load generator instance and the cluster instances.

- The metrics shown in the Cluster Manager UI do _not_ include network latency.

### Expected results

You should expect to see an average throughput of:

- Around 160,000 ops/sec when testing without replication (i.e. Four master shards)
- Around 115,000 ops/sec when testing with enabled replication (i.e. 2 master and 2 replica shards)

In both cases, the average latency should be below one millisecond.

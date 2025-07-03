---
Title: Size a Redis Cloud database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes sizing considerations for your Redis Cloud database, including throughput and dataset size.
linkTitle: Sizing
weight: $weight
---

## Dataset size {#dataset-size}

The dataset size of a database is a part of the full memory limit for the database. The memory limit represents the maximum amount of memory for the database, which includes data values, keys, module data, and overhead for specific features.  High availability features, such as replication and Active-Active,  increase memory consumption, so your dataset size and memory limit will be different.

For Redis Cloud Essentials, the plan size refers to the full memory limit, not the dataset size. Both the total memory limit and dataset size are listed under **Database details** when you create an Essentials database.

For Redis Cloud Pro, you define your dataset size when you create the database, and we calculate your total memory limit based on the features you choose. 

Here are some general guidelines:

- Memory limit represents an upper limit.  You cannot store more data than the memory limit.  Depending on your other selections, available memory for data may be less than expected.

- [Replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) doubles memory consumption; that is, 512 MB of data requires at least 1 GB of memory limit when replication is enabled. This affects both Redis Cloud Pro and Redis Cloud Essentials. For example, if you subscribe to a 1 GB Essentials plan, Redis will allocate 512 MB for your dataset and the other 512 MB for replication.

- [Active-Active]({{< relref "/operate/rc/databases/configuration/active-active-redis" >}}) also doubles memory consumption and the effect is cumulative with replication's impact. Since Active-Active requires replication to be turned on, the memory limit impact can be as large as four times (4x) the original data size.

- [Advanced capabilities]({{< relref "/operate/rc/databases/configuration/advanced-capabilities" >}}) also consume memory. For search databases, consider index size when you size your database. See [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more info.

Memory limits in Redis Cloud are subject to the same considerations as Redis Enterprise Software; to learn more, see [Database memory limits]({{< relref "/operate/rs/databases/memory-performance/memory-limit" >}}).

## Throughput

Throughput is the number of operations a database can handle over a certain period of time. For Redis Cloud databases, throughput is defined in operations per second (ops/sec).

For a Redis Cloud Pro subscription, you define throughput for a database when you create it. For a Redis Cloud Essentials subscription, your maximum throughput depends on your plan. 

We use this setting to guide the allocation of compute power and network bandwidth, ensuring your database can handle the expected workload. However, the throughput specified is not guaranteed - actual throughput may be higher or lower depending on your workload and database configuration.

### Throughput factors and variability

Some factors that can affect throughput include:
- **Request size**: Smaller requests (under 3KB) consume less network bandwidth and may result in more operations per second than requested, while larger requests may result in fewer operations per second.
- **Command complexity**: Simple commands, like `GET` and `SET`, are faster and require fewer resources, whereas more complex commands involve more processing time and can reduce throughput. See the [Command list]({{< relref "/commands" >}}) to see which commands are more complex than others.
- **Replication**: Using [multi-zone replication]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) affects throughput as each write operation is executed asynchronously in each zone.
- **Security**: Some security options, such as [transport layer security]({{< relref "/operate/rc/security/database-security/tls-ssl" >}}), may affect throughput.
- **Number of client connections**: The number of client connections affects throughput. Increasing or decreasing the number of client connections can result in higher or lower throughput.

### Optimize throughput

Here are some things to keep in mind for optimizing throughput:
- Optimize capacity planning and sizing of your Redis Cloud databases to meet your app performance requirements.
- Benchmark your app to understand what latency expectations are required, and adjust throughput accordingly.
- Test and monitor your app's performance and adjust the set ops/sec based on how if performs in real-world conditions.
- If your average request size is larger than 3KB, consider setting your throughput higher than expected. 
- Track the slow logs using the [`SLOWLOG` command]({{< relref "/commands/slowlog" >}}) or the **Slowlog** tab on the [database screen]({{< relref "/operate/rc/databases/view-edit-database" >}}).
- Use [pipelining]({{< relref "/develop/using-commands/pipelining" >}}) and [concurrent connections]({{< relref "/develop/reference/clients" >}}) effectively to optimize throughput and latency.
- Search databases have their own throughput requirements. See [Search and query sizing]({{< relref "/operate/rc/databases/configuration/advanced-capabilities#search-and-query-sizing" >}}) for more info.

### Frequently asked questions

**Can my workload exceed the configured throughput?**

Yes, many workloads perform better than expected, especially with optimized configurations and ideal conditions.

**Why is my application getting less throughput than what I set?**

Factors like high connection counts, complex commands, large payloads, and network limitations can affect throughput. Test and adjust based on your application’s needs. 

**How do I know the optimal throughput for my application?**

Start with the expected ops/sec. Most of the time, it’s more than enough. For an average request size of less than 3KB, we suggest specifying lower ops/sec than expected to reduce costs. For request sizes higher than 3 KB, we suggest specifying higher ops/sec than your target. Benchmarking your application under production-like conditions will help you find the best configuration.

**How does network bandwidth impact throughput?**

Insufficient bandwidth can bottleneck performance, especially with large request sizes.

**What is the expected latency for my application?**

Latency expectations vary by use case. Some applications tolerate milliseconds, while others require sub-millisecond performance. Benchmark your application to understand its latency profile.
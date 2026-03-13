---
title: Plan a Flex deployment for Redis Software
alwaysopen: false
categories:
- docs
- operate
- rs
description: Hardware requirements, sizing guidelines, best practices, and limitations for Flex databases on Redis Software.
hideListLinks: true
linkTitle: Plan deployment
weight: 10
---

Review the following hardware requirements, sizing guidelines, best practices, and known limitations before you deploy a Redis Software cluster for Flex databases.

## Version requirements

To create Flex databases, you need:

- Redis Software cluster version 8.0.2-17 or later

- Redis database version 8.2 or later

## Hardware requirements

When planning a Flex deployment, consider the following flash drive requirements:

- Flash storage must be locally attached. Network-attached storage (NAS), storage area networks (SAN), or solutions such as AWS Elastic Block Storage (EBS) are not supported.

- Flash storage must be dedicated to Flex database data and keys. It should not be used for durability, binaries, or persistence.

- For the best performance, the SSDs should be NVMe based. NVMe Gen 5 or Gen 4 is recommended. Gen 3 is also supported, but not recommended for best performance.

- Flash storage must be greater than the total provisioned database size to account for write buffers, space amplification, and more.

See the general Redis Software [hardware requirements]({{<relref "/operate/rs/installing-upgrading/install/plan-deployment/hardware-requirements">}}) for additional requirements.

## Sizing guidelines

Size your Redis Flex databases based on data volume, shard count, RAM-to-flash ratio, and CPU allocation to balance capacity, throughput, and latency.

### Shard size

Flex databases consist of shards—independent data partitions that handle a portion of the dataset and request load. Each shard runs as a self-contained Redis process with dedicated memory, CPU, and flash resources.

Use these standard building blocks to plan capacity:

- 50 GB per shard

- Allocate 1 vCPU per shard

For example, a 1 TB dataset requires 20 shards, with 50 GB per shard.

### CPU allocation

Throughput capacity scales with both CPU cores. At minimum, allocate 1 vCPU per 50 GB shard.

### RAM-to-flash ratio

The RAM-to-flash ratio directly affects throughput and latency:

- More RAM increases throughput and lowers latency.

- Less RAM lowers throughput and increases latency, but reduces cost.

Actual performance can vary based on your data model, commands, and network latency.

## Feature and data type compatibility

| Data type/feature | Flex support |
|------------------|--------------|
| [Active-Active databases]({{<relref "/operate/rs/databases/active-active">}}) | <span title="Not supported">&#x274c;</span>Not supported |
| [JSON]({{<relref "/develop/data-types/json">}}) | <span title="Supported">&#x2705;</span> Supported |
| [Probabilistic data structures]({{<relref "/develop/data-types/#probabilistic-data-types">}}) | <span title="Supported">&#x2705;</span> Supported |
| [Redis Search]({{<relref "/develop/ai/search-and-query">}}) | <span title="Not supported">&#x274c;</span>Not supported |
| Standard [Redis data types]({{<relref "/develop/data-types">}}) | <span title="Supported">&#x2705;</span> Supported |
| [Time series]({{<relref "/develop/data-types/timeseries">}}) | <span title="Not supported">&#x274c;</span>Not supported |

## Best practices

- Store small keys and values when possible. Avoid objects larger than 10 KB, which can reduce performance because the entire value moves between RAM and flash.

- Start with a balanced ratio, such as 20% RAM to 80% flash, and monitor latency and throughput metrics.

- Increase RAM percentage if 99th-percentile latency exceeds your target or cache hit rates drop.

- Decrease RAM percentage if memory utilization is high but latency remains stable to lower cost and improve efficiency.

- Re-evaluate the ratio of RAM to flash periodically as dataset size and access patterns evolve.

## Known limitations

- Flex databases cannot store keys or values larger than 4GB in flash storage. Larger keys or values will be stored in RAM only, and warnings will appear in the Redis logs:

    ```sh
    # WARNING: key too big for disk driver, size: 4703717276, key: subactinfo:htable
    ```

## Next steps

- [Get started]({{< relref "/operate/rs/flex/get-started" >}}): Configure Flex on your cluster.
- [Scale your deployment]({{< relref "/operate/rs/flex/scale" >}}): Learn scaling strategies.
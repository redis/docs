---
Title: Disk sizing for heavy write scenarios
alwaysopen: false
categories:
- docs
- operate
- rs
description: Sizing considerations for persistent disk space for heavy throughput
  databases.
linktitle: Disk sizing
weight: $weight
url: '/operate/rs/7.22/clusters/optimize/isk-sizing-heavy-write-scenarios/'
---
In extreme write scenarios when append-only files (AOF) are enabled, the AOF rewrite process can require considerably more disk space for [database persistence]({{<relref "/operate/rs/7.22/databases/configure/database-persistence/">}}).

For disk size requirements for standard usage, see [Hardware requirements]({{< relref "/operate/rs/7.22/installing-upgrading/install/plan-deployment/hardware-requirements" >}}).

## Estimate required disk space

To estimate the required persistent disk space for AOF rewrite purposes in extreme write scenarios, use the following formula:

**X (1 + 3Y + Y²)**

Where:
- **X** = size of each shard in GB
- **Y** = number of shards


## Examples

The following examples show how to calculate the persistent disk space required for heavy write scenarios for different database configurations, where:

- **Database size** is the memory limit configured for the database.

- **Number of shards** is the total number of shards (primary shards + replica shards).

### Example 1

- Database size = 10 GB
- Number of shards = 4

1. Calculate the shard size:

    ```sh
    Shard size = database size / number of shards
               = 10 GB / 4 shards
               = 2.5 GB per shard
    ```

1. Use the formula to calculate the required persistent disk space:

    ```sh
    Disk space = X (1 + 3Y + Y²)
               = 2.5 (1 + 3 × 4 + 4²)
               = 2.5 (1 + 12 + 16)
               = 2.5 × 29
               = 72.5 GB
    ```

1. Round up to 73 GB of required disk space.

### Example 2

- Database size = 10 GB
- Number of shards = 16

1. Calculate the shard size:

    ```sh
    Shard size = database size / number of shards
               = 10 GB / 16 shards
               = 0.625 GB per shard
    ```

1. Use the formula to calculate the required persistent disk space:

    ```sh
    Disk space = X (1 + 3Y + Y²)
               = 0.625 (1 + 3 × 16 + 16²)
               = 0.625 (1 + 48 + 256)
               = 0.625 × 305
               = 190.625 GB
    ```

1. Round up to 191 GB of required disk space.

### Example 3

- Database size = 40 GB
- Number of shards = 5

1. Calculate the shard size:

    ```sh
    Shard size = database size / number of shards
               = 40 GB / 5 shards
               = 8 GB per shard
    ```

1. Use the formula to calculate the required persistent disk space:

    ```sh
    Disk space = X (1 + 3Y + Y²)
               = 8 (1 + 3 × 5 + 5²)
               = 8 (1 + 15 + 25)
               = 8 × 41
               = 328 GB
    ```

1. Required disk space: 328 GB.

### Example 4

- Database size = 40 GB
- Number of shards = 15

1. Calculate the shard size:

    ```sh
    Shard size = database size / number of shards
               = 40 GB / 15 shards
               = 2.67 GB per shard
    ```

1. Use the formula to calculate the required persistent disk space:

    ```sh
    Disk space = X (1 + 3Y + Y²)
               = 2.67 (1 + 3 × 15 + 15²)
               = 2.67 (1 + 45 + 225)
               = 2.67 × 271
               = 723.57 GB
    ```

1. Round up to 724 GB of required disk space.



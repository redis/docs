---
Title: Auto Tiering
alwaysopen: false
categories:
- docs
- operate
- rs
- rc
description: Auto Tiering enables your data to span both RAM and dedicated flash memory.
hideListLinks: true
linktitle: Auto Tiering
weight: 50
url: '/operate/rs/7.4/databases/auto-tiering/'
aliases: /operate/rs/7.4/databases/redis-flex/
---
Redis Enterprise's auto tiering offers users the unique ability to use solid state drives (SSDs) to extend databases beyond DRAM capacity.
Developers can build applications that require large datasets using the same Redis API.
Using SSDs can significantly reduce the infrastructure costs compared to only DRAM deployments. 

Frequently used data, called hot data, belongs in the fastest memory level to deliver a real-time user experience.
Data that is accessed less frequently, called warm data, can be kept in a slightly slower memory tier.
Redis Enterprise’s Auto tiering maintains hot data in DRAM, keeps warm data in SSDs, and transfers data between tiers automatically.

Redis Enterprise’s auto tiering is based on a high-performance storage engine (Speedb) that manages the complexity of using SSDs and DRAM as the total available memory for databases in a Redis Enterprise cluster. This implementation offers a performance boost of up to 10k operations per second per core of the database, doubling the performance of Redis on Flash.

Just like all-RAM databases, databases with Auto Tiering enabled are compatible with existing Redis applications.

Auto Tiering is also supported on [Redis Cloud]({{< relref "/operate/rc/" >}}) and [Redis Enterprise Software for Kubernetes]({{< relref "/operate/kubernetes/" >}}).

## Use cases

The benefits associated with Auto Tiering are dependent on the use case.

Auto Tiering is ideal when your:

- working set is significantly smaller than your dataset (high RAM hit rate)
- average key size is smaller than average value size (all key names are stored in RAM)
- most recent data is the most frequently used (high RAM hit rate)

Auto Tiering is not recommended for:

- Long key names (all key names are stored in RAM)
- Broad access patterns (any value could be pulled into RAM)
- Large working sets (working set is stored in RAM)
- Frequently moved data (moving to and from RAM too often can impact performance)

Auto Tiering is not intended to be used for persistent storage. Redis Enterprise Software database persistent and ephemeral storage should be on different disks, either local or attached.

## Where is my data?

When using Auto Tiering, RAM storage holds:
- All keys (names)
- Key indexes
- Dictionaries
- Hot data (working set)

All data is accessed through RAM. If a value in flash memory is accessed, it becomes part of the working set and is moved to RAM. These values are referred to as "hot data".

Inactive or infrequently accessed data is referred to as "warm data" and stored in flash memory. When more space is needed in RAM, warm data is moved from RAM to flash storage.

{{<note>}} When using Auto Tiering with RediSearch, it’s important to note that RediSearch indexes are also stored in RAM.{{</note>}}

## RAM to Flash ratio

Redis Enterprise Software allows you to configure and tune the ratio of RAM-to-Flash for each database independently, optimizing performance for your specific use case.
While this is an online operation requiring no downtime for your database, it is recommended to perform it during maintenance windows as data might move between tiers (RAM <-> Flash).

The RAM limit cannot be smaller than 10% of the total memory. We recommend you keep at least 20% of all values in RAM. Do not set the RAM limit to 100%.

## Flash memory

Implementing Auto Tiering requires pre planning around memory and sizing. Considerations and requirements for Auto Tiering include:

- Flash memory must be locally attached (as opposed to network attached storage (NAS) and storage area networks (SAN)).
- Flash memory must be dedicated to Auto Tiering and not shared with other parts of the database, such as durability, binaries, or persistence.
- For the best performance, the SSDs should be NVMe based, but SATA can also be used.
- The available flash space must be greater than or equal to the total database size (RAM+Flash). The extra space accounts for write buffers and [write amplification](https://en.wikipedia.org/wiki/Write_amplification).

{{<note>}} The Redis Enterprise Software database persistent and ephemeral storage should be on different disks, either local or attached. {{</note>}}

Once these requirements are met, you can create and manage both databases with Auto Tiering enabled and
all-RAM databases in the same cluster.

When you begin planning the deployment of an Auto Tiering enabled database in production,
we recommend working closely with the Redis technical team for sizing and performance tuning.

### Cloud environments

When running in a cloud environment:

- Flash memory is on the ephemeral SSDs of the cloud instance (for example the local NVMe of AWS i4i instances and Azure Lsv2 and Lsv3 series).
- Persistent database storage needs to be network attached (for example, AWS EBS for AWS).

{{<note>}}
We specifically recommend "[Storage Optimized I4i - High I/O Instances](https://aws.amazon.com/ec2/instance-types/#storage-optimized)" because of the performance of NVMe for flash memory. {{</note>}}

### On-premises environments

When you begin planning the deployment of Auto Tiering in production, we recommend working closely with the Redis technical team for sizing and performance tuning.

On-premises environments support more deployment options than other environments such as:

- Using Redis Stack features:
  - [Search and query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}) 
  - [JSON]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json" >}})
  - [Time series]({{< relref "/operate/oss_and_stack/stack-with-enterprise/timeseries" >}})
  - [Probabilistic data structures]({{< relref "/operate/oss_and_stack/stack-with-enterprise/bloom" >}})

{{<note>}} Enabling Auto Tiering for Active-Active distributed databases requires validating and getting the Redis technical team's approval first . {{</note>}}

{{<warning>}} Auto Tiering is not supported running on network attached storage (NAS), storage area network (SAN), or with local HDD drives. {{</warning>}}

## Next steps

- [Auto Tiering metrics]({{< relref "/operate/rs/7.4/references/metrics/auto-tiering" >}})
- [Auto Tiering quick start]({{< relref "/operate/rs/7.4/databases/auto-tiering/quickstart.md" >}})

- [Ephemeral and persistent storage]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/persistent-ephemeral-storage" >}})
- [Hardware requirements]({{< relref "/operate/rs/7.4/installing-upgrading/install/plan-deployment/hardware-requirements.md" >}})

## Use case settings

The following table shows the default use case settings for a Pro database.

| **Type** | High Availability | Data Persistence | Eviction Policy |
|---|---|---|---|
| **Cache** | Single-zone | None | `volatile-lru` |
| **Database** | Multi-zone | Append-only file every 1 sec | None |
| **Vector Search** | Multi-zone | Append-only file every 1 sec | None |
| **Custom** | Single-zone | Append-only file every 1 sec | None |

## Billing Unit types

The Redis Billing Unit types associated with your Pro subscription depend on your database memory size and throughput requirements.  

| Billing unit type | Capacity (Memory/Throughput) |
|:------------|:----------|
| Nano<sup>[1](#table-note-1)</sup> | 500MB / 500 ops/sec |
| Micro | 1GB / 1K ops/sec |
| High-throughput | 2.5GB / 25K ops/sec |
| Small | 12.5GB / 12.5K ops/sec |
| Large | 25GB  / 25K ops/sec |
| Very large<sup>[2](#table-note-2)</sup> | 50GB / 5K ops/sec |
| XLarge<sup>[3](#table-note-3)</sup> | 50GB / 10K ops/sec |

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a>Not available for databases hosted on external AWS accounts.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a>Used for databases with Auto Tiering before Redis 7.2.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a>Used for hosted databases with Auto Tiering for Redis 7.2 and later.

Prices vary according to the cloud provider and region.  Minimum prices apply.  To learn more, see [Cloud pricing](https://redis.com/redis-enterprise-cloud/pricing/).
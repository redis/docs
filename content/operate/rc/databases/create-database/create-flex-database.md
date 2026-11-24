---
Title: Create a Flex database
alwaysopen: false
categories:
- docs
- operate
- rc
description: Shows how to create a Flex database on Redis Cloud and describes the best use cases for Flex. 
linkTitle: Create Flex database
weight: 8
tocEmbedHeaders: true
---

Flex allows your dataset to span both high-performance RAM and cost-efficient dedicated Flash memory. Flex automatically manages data placement between the two tiers, keeping frequently accessed (“hot”) data in RAM for sub-millisecond latency, while moving less active (“warm”) data to Flash to optimize capacity and cost. This dual memory architecture delivers predictable performance at scale, enabling larger datasets without compromising speed or operational simplicity.

Flex databases are currently compatible with most existing Redis applications, except for applications that use Time Series. [Redis Search](/content/develop/ai/search-and-query/_index.md) is available on Flex databases on Redis Cloud Pro in preview; see [Redis Search on Flex](#redis-search-on-flex-beta).

Flex is available on both Redis Cloud Essentials and Redis Cloud Pro.

## When to use Flex

Flex is ideal for workloads that demand large-scale, low-latency data access with the flexibility to optimize cost and performance.

Consider Flex when you need to:

- Run Redis at terabyte scale while maintaining high throughput and sub-10 ms latency.
- Power real-time feature stores for machine learning applications such as fraud detection, recommendation systems, and personalization engines.
- Operate large distributed caches that require elastic scaling and consistent performance under heavy load.
- Optimize infrastructure cost by combining high-speed RAM with cost-efficient Flash storage through Flex's automatic data tiering.

Flex is **not** a durable data store. It is designed for performance, elasticity, and scalability, not for long-term data persistence. While Flex can temporarily retain data in memory or Flash, it should not be used as a primary system of record or persistent storage layer.

For workloads that require durability and recovery across restarts or failures, use Redis Cloud's [Data persistence](/content/operate/rc/databases/configuration/data-persistence.md) features.

## Best practices and limitations

### Redis Search on Flex (Preview) {#redis-search-on-flex-beta}

[Redis Search](/content/develop/ai/search-and-query/_index.md) on Flex databases is available in preview on Redis Cloud Pro. It isn't available on Redis Cloud Essentials.

Redis Search on Flex stores search indexes on flash, so large indexes don't need to fit in RAM. You use the same Redis Search commands and client libraries as you do with an in-memory database.

To use it, enable the preview flag for Redis Search on Flex in the Redis Cloud console for your Redis Cloud Pro subscription, then create a Flex database with Redis database version 8.8 or later and a Redis Search index on tiered storage. You can turn on Redis Search on Flex only when you create the database. You can't add it to an existing Flex database.

The preview supports:

- HASH documents, and JSON documents without multi-value fields
- `TEXT` fields, including prefix, infix, suffix, wildcard, and fuzzy matching
- `TAG`, `NUMERIC`, `GEO`, and `VECTOR` fields
- `HNSW` vector indexes with `FLOAT32` and `FLOAT16` vectors. When you create an `HNSW` vector field, you must set the `M`, `EF_CONSTRUCTION`, `EF_RUNTIME`, and `RERANK` attributes.
- Loading fields from the keyspace with the `SORTBY` and `RETURN` options of `FT.SEARCH`
- High availability, persistence, backup, and upgrades

Redis Search on Flex doesn't support some Redis Search commands, field types, and options. If you use one of them, the command returns an error. For command support, see [Redis Search commands](/content/operate/oss_and_stack/stack-with-enterprise/search/commands.md).

Redis Search on Flex doesn't support:

- `FT.ALTER`, `FT.HYBRID`, and `FT.TAGVALS`. To change an index schema, drop the index and create it again.
- The `DD` option of `FT.DROPINDEX`.
- Cursors, including `FT.CURSOR READ`, `FT.CURSOR DEL`, and the `WITHCURSOR` option of `FT.AGGREGATE`.
- Synonyms, spell check, dictionaries, and autocomplete suggestions: `FT.SYNUPDATE`, `FT.SYNDUMP`, `FT.SPELLCHECK`, `FT.DICTADD`, `FT.DICTDEL`, `FT.DICTDUMP`, `FT.SUGADD`, `FT.SUGGET`, `FT.SUGDEL`, and `FT.SUGLEN`.
- `GEOSHAPE` fields.
- `FLAT` and `SVS-VAMANA` vector indexes, and `FLOAT64`, `BFLOAT16`, `INT8`, and `UINT8` vectors.
- The `WITHSUFFIXTRIE`, `NOINDEX`, `SORTABLE`, and `UNF` field options.
- `FT.CREATE` options other than `ON`, `PREFIX`, `FILTER`, `LANGUAGE`, `LANGUAGE_FIELD`, `SCORE`, `SCORE_FIELD`, `STOPWORDS`, and `SKIPINITIALSCAN`.
- Prefix, suffix, infix, and wildcard queries on `TAG` fields.
- The `SUMMARIZE`, `HIGHLIGHT`, `WITHOUTCOUNT`, `SLOP`, and `INORDER` options of `FT.SEARCH`, `DIALECT 4`, and the `HAMMING` scorer.

Filtered vector queries must set a [filter mode](/content/develop/ai/search-and-query/vectors/_index.md#filter-mode) with `HYBRID_POLICY`. Redis Search on Flex doesn't select one automatically.

Hash field expiration isn't reflected in the index or in query results. In `FT.AGGREGATE`, numeric values from fields that aren't in the index schema sort as strings. To sort them numerically, convert them with `APPLY to_number(@<field>)`.

Redis Search on Flex keeps some index data in RAM, even when the index is stored on flash. Set the [RAM percentage](#ram-percentage) to at least 20% for databases that use Redis Search on Flex. The number of indexes, the number of fields in each index, your query patterns, and your read and write mix all affect how much RAM and CPU you need. Reading index data from flash adds latency, so also set a [query performance factor](/content/operate/rc/databases/configuration/advanced-capabilities.md#query-performance-factor) to run queries on more CPUs.

Terraform support for Redis Search on Flex is available at Preview level.

### RAM percentage

On Redis Cloud Essentials, the RAM percentage for Flex plans is fixed at 10% and can't be changed. On Redis Cloud Pro, you can select a RAM percentage between 10% and 50% when you create your database. See [Choosing the right RAM ratio](https://support.redislabs.com/hc/en-us/articles/36437338181522-Redis-Flex-V2-Choosing-the-Right-RAM-Ratio-and-Troubleshooting-Performance) for guidance on selecting a RAM percentage.

### Key and value sizes

Similar to best practices for in-memory Redis, we recommend storing relatively small keys and values in Flex. If possible, avoid large objects (>10 KB).

Depending on your application's traffic pattern, using large objects might decrease performance, since the entire value is moved from RAM to Flash storage and vice versa.

Flex databases cannot store keys or values larger than 4 GB in Flash storage. Keys or values larger than 4 GB are stored in RAM only, and will generate warnings like the following in the Redis logs:

```
# WARNING: key too big for disk driver, size: 4703717276, key: subactinfo:htable
```

## Create a Flex database 

### Redis Cloud Essentials

{{< embed-md "rc-create-db-first-steps.md" >}} 

3. Select the type of [subscription](/content/operate/rc/subscriptions/_index.md) you need. For this guide, select **Essentials**.

    ![The Subscription selection panel with Essentials selected.](/images/rc/create-database-subscription-essentials.png)

    After you select **Essentials**, the rest of the database details will appear. Select **Flex (RAM + SSD)** to use Flex.

    ![The database name, cloud vendor, version, region, type, and durability settings.](/images/rc/create-database-essentials-cloud-vendor.png)

1. Redis will generate a database name for you. If you want to change it, you can do so in the **Database name** field.  

1. Choose a **Region** on Amazon Web Services for your database. See [Supported regions](/content/operate/rc/supported-regions.md) for a list of supported regions by cloud vendor.

1. Select the **Database version** you want to use.

1. Select your desired memory limit. 

    ![Available Flex plans.](/images/rc/subscription-new-flex-tiers.png)

    For a comparison of available plans, see [Redis Cloud Essentials plans](/content/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details.md).

    All Flex plans on Redis Cloud Essentials have a default RAM percentage of 10%. 

1. Choose your **High availability (replication)** settings from the list. 

    Redis Cloud supports the following high availability settings with Flex:

    - **None**: You will have a single copy of your database without replication.
    - **Single-Zone**: Your database will have a primary and a replica located in the same cloud zone. If anything happens to the primary, the replica takes over and becomes the new primary.

    See [High availability](/content/operate/rc/databases/configuration/high-availability.md) for more information about these settings.

1. Choose your **Data persistence** settings from the list.

    Redis Cloud supports the following data persistence options:

    - An **Append-Only File** maintains a record (sometimes called a _redo log_ or _journal_) of write operations.  This allows the data to be restored by using the record to reconstruct the database up to the point of failure. For Essentials databases, Redis updates the Append-Only file every second.

    - A **Snapshot** is a copy of the in-memory database, taken at periodic intervals (one, six, or twelve hours). You can restore data to the snapshot's point in time. 
    
    See [Data persistence](/content/operate/rc/databases/configuration/data-persistence.md) for more information about these settings.

1. Select the **Database version** you want to use.

1.  Enter your payment details.

    If you haven't previously entered a payment method, use the **Add Credit Card** button to add one.

    ![The Add credit card icon.](/images/rc/icon-add.png)
    {width="30px"}

    {{< embed-md "rc-credit-card-add.md" >}}

1. Select **Confirm & pay** to create your database.

![Select Confirm & Pay to create your new database.](/images/rc/button-create-db-confirm-pay.png)
{width="140px"}

When you create your database, there's a brief pause while your request is processed and then the **Database details** page appears.

### Redis Cloud Pro

To create a Flex database on Redis Cloud Pro, [create a new Pro database with custom settings](/content/operate/rc/databases/create-database/create-pro-database-new.md#custom-settings). 

In the **Advanced options** of the **Setup** tab, select **Redis Flex**.

![The Flex setting selected.](/images/rc/pro-flex-on.png)
{width="75%"}

During the **Sizing** step, when you are provisioning your databases, you can select the RAM percentage for your database. The default is 20%, but you can select a percentage between 10% and 50%. Lower RAM percentages reduce cost but may increase latency, while higher RAM percentages improve throughput and latency at higher cost. See [Choosing the right RAM ratio](https://support.redislabs.com/hc/en-us/articles/36437338181522-Redis-Flex-V2-Choosing-the-Right-RAM-Ratio-and-Troubleshooting-Performance) to choose the right RAM percentage for your database.

![The RAM percentage setting.](/images/rc/pro-flex-ram-percentage.png)
{width="75%"}

Continue with the instructions to [create your database](/content/operate/rc/databases/create-database/create-pro-database-new.md#custom-settings).

## Troubleshooting

See [Troubleshooting Redis Flex performance questions](https://support.redislabs.com/hc/en-us/articles/36437338181522-Redis-Flex-V2-Choosing-the-Right-RAM-Ratio-and-Troubleshooting-Performance#h_01KV6F382KNM8N0W00DFEHPY3S) on the Redis Support knowledge base to learn how to troubleshoot Redis Flex databases.
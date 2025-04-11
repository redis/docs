---
Title: Advanced capabilities
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes Redis Cloud Advanced capability options.
headerRange: '[1-3]'
toc: 'true'
weight: $weight
---

Advanced capabilities extend Redis database functionality by adding new features and data types.  

Available options depend on your database plan and **Type**.

## Redis Cloud Essentials {#essentials}

All Redis Cloud Essentials databases support [Redis Stack]({{< relref "/operate/oss_and_stack/" >}}), which enables the most frequently used capabilities.

{{<image filename="images/rc/new-database-general-type-free-stack.png" alt="For Essentials, the Type setting in the General section includes an option for Redis Stack." width="300px">}}

When the database **Type** is set to _Redis Stack_, the Advanced capabilities section of the database details page displays the advanced capabilities included with the database and their versions.

{{<image filename="images/rc/database-details-modules-stack-free.png" alt="For Essentials, the Database details page lists the capabilities and versions added by Redis Stack." width="75%">}}

Redis Cloud is updated on a regular basis, which includes the advanced capabilities supported by the service. Versions displayed by the Redis Cloud console may vary from those shown above.  For the latest details of any capability, see [Redis Stack and Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}). 

## Redis Cloud Pro {#pro}

By default, Redis Cloud Pro databases load all supported advanced capabilities. You can choose to load specific capabilities when you create your database. To choose which capabilities to load for your Pro database, [create it with custom settings]({{< relref "/operate/rc/databases/create-database/create-pro-database-new" >}}) and select **More options** in the **Sizing tab** to view advanced capability settings.

{{<image filename="images/rc/database-details-redis-module-select-flexible.png" alt="For Pro databases, you can select the capabilities included in your database." width="75%">}}

You can select more than one advanced capability for a database, though there are limits:

- The following advanced capabilities can be combined in Pro databases:

    - Search and query
    - JSON
    - Time series
    - Probabilistic

- [Active-Active databases]({{< relref "/operate/rc/databases/create-database/create-active-active-database" >}}) only support JSON and Search and query.

To remove a selected capability, clear its checkbox.

To learn more, see [Redis Stack]({{< relref "/develop/get-started/" >}}) and [Redis Stack and Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise" >}}).

### Search and query sizing

When you create a Pro database with [Search and Query]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search" >}}), you must consider the sizing and throughput requirements for search and query when you define the dataset size and throughput for your database. 

Use the [Search and query sizing calculator](https://redis.io/redisearch-sizing-calculator/) to estimate your index size and throughput requirements.

- **Dataset Size**: Add the estimated index size from the Sizing calculator to your expected dataset size.
- **Throughput**: Enter the total estimated throughput from the Sizing calculator when you enter your throughput.
- **Query performance factor**: The query performance factor adds extra power specifically for search and query. Select a factor to increase your queries per second by that amount.

#### Query performance factor

The query performance factor adds extra compute power specifically for search and query. When you create a Pro database with search and query, you can increase your search queries per second by the selected factor.

{{<image filename="images/rc/database-details-query-performance-factor-pro.png" alt="For Pro databases, you can select the query performance factor for your database." width="75%">}}

We recommend testing your application with a test database to see your baseline queries per second and determine how much you want to boost your query performance. After you have determined your queries per second and your desired performance factor, [create a new database]({{< relref "/operate/rc/databases/create-database" >}}) with the desired performance factor and [migrate data]({{< relref "/operate/rc/databases/migrate-databases" >}}) from the test database to your new database.

For more info on how to use scalable search, see [Best practices for scalable Redis Query Engine]({{< relref "/operate/oss_and_stack/stack-with-enterprise/search/scalable-query-best-practices" >}}).

The query performance factor is available for Redis Cloud Pro databases on Redis 7.2 and later.
---
Title: Use Redis Insight on Redis Cloud
alwaysopen: false
categories:
- docs
- operate
- rc
- redisinsight
description: Shows how to open your database in a browser-based version of Redis Insight and lists the features that are available.
hideListLinks: true
linkTitle: Redis Insight on Redis Cloud
weight: 1
---

[Redis Insight]({{< relref "/develop/tools/insight" >}}) is a free Redis GUI that lets you visualize your Redis data and learn more about Redis.

You can either [install Redis Insight]({{< relref "/develop/tools/insight" >}}) on your computer, or you can open your database in Redis Insight directly on Redis Cloud.

{{< note >}}
Opening your database with Redis Insight in your browser is only available for Essentials databases. For all other databases, [install Redis Insight]({{< relref "/develop/tools/insight" >}}) on your computer and [open Redis Insight]({{< relref "/operate/rc/databases/connect#ri-app" >}}) from the database page.
{{< /note >}}

To open your database with Redis Insight on Redis Cloud, select **Open with Redis Insight** on the [database screen]({{< relref "/operate/rc/databases/view-edit-database" >}}).

{{<image filename="images/rc/rc-ri-open.png" alt="Open with Redis Insight" width=400px >}}

Redis Insight will open in a new tab. 

This browser-based version of Redis Insight has a subset of the features of Redis Insight. For other Redis Insight features, [install Redis Insight]({{< relref "/develop/tools/insight" >}}) on your computer and [open Redis Insight]({{< relref "/operate/rc/databases/connect#ri-app" >}}) from the database page.

## Browse

The **Browse** tab lets you browse, filter, and visualize your Redis data structures.

- Create, read, update, and delete lists, hashes, strings, sets, sorted sets, streams, and [JSON]({{< relref "/develop/data-types/json/" >}})
- Filter keys by key name or pattern, and by key type
- Group keys according to their namespaces
    {{<image filename="images/rc/rc-ri-browser-group.png" alt="Keys in a database grouped by namespace." width=50% >}}
- View, validate, and manage your key values in a human-readable format using formatters that prettify and highlight data in different formats (for example, Unicode, JSON, MessagePack, HEX, and ASCII)
    {{<image filename="images/rc/rc-ri-browser-view.png" alt="Human-readable view of a hash key." width=50% >}}
- Search by key values using your [search indexes]({{< relref "/develop/ai/search-and-query" >}})
    {{<image filename="images/rc/rc-ri-browser-search.png" alt="Search for keys using a search index." width=50% >}}

If you don't have any Redis data yet, you can select **Load sample data** to add sample data into your database.

{{<image filename="images/rc/rc-ri-load-data.png" alt="Load Sample Data button" width=300px >}}

## CLI and Command Helper

The **CLI** lets you run Redis commands directly. 

{{<image filename="images/rc/rc-ri-cli.png" alt="The CLI and command helper" width=75% >}}

The CLI integrates with a **Command Helper** that lets you search and read information about Redis commands.

## Workbench

The **Workbench** is an advanced command line interface with intelligent command auto-complete and complex data visualization support.

{{<image filename="images/rc/rc-ri-workbench.png" alt="The Workbench" width=75% >}}

## Insights

The **Insights** panel provides interactive tutorials and recommendations to help you optimize your database performance and memory usage.

{{<image filename="images/rc/rc-ri-insights.png" alt="The Insights panel" width=75% >}}

From the **Workbench** of an empty database, select **Explore** to view the [**Insights** panel](#insights).

{{<image filename="images/rc/rc-ri-explore-button.png" alt="The Explore button" width=200px >}}

You can also select the **Insights** button in the top-right corner to view the **Insights** panel.

{{<image filename="images/rc/rc-ri-insights-button.png" alt="The Insights button" width=200px >}}


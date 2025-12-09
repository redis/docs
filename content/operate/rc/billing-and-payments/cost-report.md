---
title: Download and analyze cost report
alwaysopen: false
categories:
    - docs
    - operate
    - rc
description: Learn how to download and use the cost report for your Redis Cloud account.
linkTitle: Cost report
weight: 39
---

The Redis Cloud cost report gives you a detailed breakdown of your Redis Cloud subscription usage and associated charges. You can use it to track, audit, and optimize your Redis Cloud spending across Essentials and Pro subscription plans.

You can download the cost report from the [**Billing and payments**]({{< relref "/operate/rc/billing-and-payments" >}}) and [**Usage reports**]({{< relref "/operate/rc/logs-reports/usage-reports" >}}) pages. You can also use the [Redis Cloud REST API](#rest-api) to get a cost report in [FOCUS](https://focus.finops.org/) format.

{{< embed-md "rc-cost-report-csv.md" >}}

The cost report helps you with:

-   Internal cost visibility
-   Usage trend analysis
-   Budget forecasting
-   Troubleshooting unexpected charges

{{< note >}}
Consider the following limitations when you view the cost report:

-   All pricing is based on list price. Account-specific discounts don't appear in the cost report.
-   Network costs for Pro subscriptions aren't available in the cost report before November 2025.
-   Network costs for Pro subscriptions appear for each subscription. Network costs for individual databases aren't available.
-   Monthly network costs for Pro subscriptions take up to 72 hours to appear in the cost report.
{{< /note >}}

## Structure

The cost report CSV file has two sections: one for Redis Cloud Essentials subscriptions and one for Redis Cloud Pro subscriptions.

For more information about how to use the cost report effectively, see [How to download and visualize the cost report](https://support.redislabs.com/hc/en-us/articles/30042563097874-How-to-Download-and-Visualize-Redis-Cloud-Cost-Report) in the Redis knowledge base.

### Essentials subscriptions

In the Essentials subscription section, each row represents one month of usage for a subscription.

| Column | Description |
|:-------|:------------|
| **Start date** | The start date of the usage period |
| **End date** | The end date of the usage period |
| **Subscription ID** | The subscription's unique ID |
| **Subscription name** | The subscription's name |
| **Plan size** | The size of the [subscription plan]({{< relref "/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details" >}}), in MB |
| **Plan cost** | The cost of the subscription plan for the usage period |

All columns after the **Plan cost** column show the key values for any [tags]({{< relref "/operate/rc/databases/tag-database" >}}) you added to databases in all subscriptions. If a database has a tag with that key, the cell shows the tag value. You can use this information to filter and analyze your costs by tag.

{{< note >}}
The cost report doesn't show tags for Essentials subscriptions created before January 2024 with multiple databases.
{{< /note >}}

### Pro subscriptions

In the Pro subscription section, each subscription has multiple rows per usage period:

-   Each row represents each database's usage within the subscription over the usage period.
    -   If you changed a database's configuration, the cost report shows additional rows for usage before and after the change.
    -   For Active-Active databases, there are multiple rows for each region of the database.
-   Another row shows the monthly network costs for the subscription after November 2025.
-   If the Pro subscription doesn't meet the minimum price threshold, the cost report shows the actual cost of the subscription and another row shows the difference from the minimum price.

| Column | Description |
|:-------|:------------|
| **Start date** | The start date of the usage period |
| **End date** | The end date of the usage period |
| **Subscription ID** | The subscription's unique ID |
| **Subscription name** | The subscription's name |
| **Database ID** | The database's unique ID |
| **Database name** | The database's name |
| **Region** | The database's region. For Active-Active databases, the cost report shows a row for each region of the database. |
| **High availability** | Whether the subscription is [highly available]({{< relref "/operate/rc/databases/configuration/high-availability" >}}) |
| **Memory limit** | The database's memory limit, in MB |
| **Throughput** | The database's throughput, in ops/sec |
| **RBU type** | The [Redis Billing Unit (RBU)](#billing-unit-types) type of the database. This column shows "difference from min subscription price" for the row that shows the difference from the minimum subscription price, and "Network" for the row that shows the monthly network costs for the subscription. |
| **RBU Count** | The number of Redis Billing Units (RBUs) used by the database. |
| **RBU Price/hr** | The price per hour for the Redis Billing Unit (RBU) type of the database. |
| **Hours** | The number of hours the database was active during the usage period. |
| **Total cost** | The total cost of the database or network costs for the usage period |

All columns after the **Total cost** column show the key values for any [tags]({{< relref "/operate/rc/databases/tag-database" >}}) you added to databases in all subscriptions. If a database has a tag with that key, the column shows the value for that tag. You can use this information to filter and analyze your costs by tag.

#### Billing unit types

{{< embed-md "rc-pro-billing-units.md" >}}

## Get FOCUS format using REST API

You can use the [Redis Cloud REST API]({{< relref "/operate/rc/api" >}}) to get a cost report in [FinOps Open Cost and Usage Specification (FOCUS)](https://focus.finops.org/) compatible format.

{{< embed-md "rc-cost-report-api.md" >}}

The cost report returned from the Redis Cloud REST API contains fields from the [FOCUS column library](https://focus.finops.org/focus-columns/). See [Generate FOCUS-compliant cost report with REST API]({{< relref "/operate/rc/api/examples/generate-cost-report" >}}) for more details.
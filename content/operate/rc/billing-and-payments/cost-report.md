---
Title: Download and analyze cost report
alwaysopen: false
categories:
- docs
- operate
- rc
description: Describes how to download the cost report for your Redis Cloud account.
linkTitle: Cost report
weight: 39
---

The Redis Cloud cost report provides a detailed breakdown of your Redis Cloud subscription usage and associated charges. It is designed to help you track, audit, and optimize your Redis Cloud spending across Essentials and Pro subscription plans.

You can download the cost report from the [**Billing and Payments**]({{< relref "/operate/rc/billing-and-payments" >}}) and [**Usage Reports**]({{< relref "/operate/rc/logs-reports/usage-reports" >}}) pages. 

{{< embed-md "rc-cost-report-csv.md" >}}

The cost report is especially useful for:
- Internal cost visibility
- Usage trend analysis
- Budget forecasting
- Troubleshooting unexpected charges

{{< note >}}
Consider the following limitations when viewing the cost report:
- All pricing shown is based on list price. Account-specific discounts are not reflected in the cost report.
- Network costs for Pro subscriptions are not available in the cost report before July 2025.
- Monthly Network costs for Pro subscriptions take up to 72 hours to reflect in the cost report.
{{< /note >}}

## Structure

The Cost Report CSV file is separated into two sections, one for Redis Cloud Essentials subscriptions and one for Redis Cloud Pro subscriptions.

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

### Pro subscriptions

In the Pro subscription section, each subscription has multiple rows per month.
- Each row represents monthly usage of each database within the subscription. For Active-Active databases, there will be multiple rows for each region of the database.
- Another row shows the Monthly network costs for the subscription after July 2025.
- If the Pro subscription does not meet the minimum price threshold, the cost report shows the actual cost of the subscription and another row shows the difference from the minimum price.

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
| **RBU type** | The [Redis Billing Unit (RBU)](#billing-unit-types) type of the database. This column shows "difference from min subscription price" for the row that shows the difference from the minimum subscription price, and "Network" for the row that shows the monthly network costs for the subscription.  |
| **RBU Count** | The number of Redis Billing Units (RBUs) used by the database.  |
| **RBU Price/hr** | The price per hour for the Redis Billing Unit (RBU) type of the database.  |
| **Hours** | The number of hours the database was active during the usage period.  |
| **Total cost** | The total cost of the database or network costs for the usage period |

#### Billing unit types

{{< embed-md "rc-pro-billing-units.md" >}}


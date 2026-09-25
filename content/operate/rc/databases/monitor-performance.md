---
Title: Monitor database performance
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
linktitle: Monitor performance
weight: 35
---

Redis Cloud provides a variety of metrics to help you monitor database performance.  You can view graphs of performance data at any time and receive emails when performance crosses defined thresholds.

## View database metrics

The **Metrics** tab of the **View Database** screen provides a series of graphs showing performance data for your database.

{{<image filename="images/rc/database-metrics-tab.png" width="75%" alt="The Metrics tab of the View Database screen." >}}

Performance data provides insight into how your database is being used and how well it is performing.

### Metric intervals

The interval scrollbar controls the time period displayed in the graphs.  

{{<image filename="images/rc/database-metrics-interval-scrollbar.png" width="75%" alt="The Metrics tab of the View Database screen." >}}

The following intervals are available:

| Interval | Resolution |
|----------|------------|
| 5 minutes | 30 seconds |
| 15 minutes | 30 seconds |
| Hour | 1 minute |
| Day | 5 minutes |
| Week | 30 minutes |
| Month | 4 hours |
| 3 months | 12 hours |

## Promote metric graphs

The **Metrics** screen shows two primary graphs and a collection of smaller ones.  You can promote any smaller graph to a primary position.

When you use the mouse to point to a smaller graph, three things appear:

- A promotion icon pointing left
- A promotion icon pointing right
- A summary panel showing the minimum, average, maximum, and most recent values displayed in the graph.

{{<image filename="images/rc/metrics-promote-graphs.png" width="300px" alt="Promoting graphs to primary positions" >}}

Use the promotion icons to promote the smaller graph to one of the primary positions. The left icon promotes the smaller graph to the left position and the right icon promotes the smaller graph to the right position.

## Metric definitions

Several metric graphs are available:

| **Metric** | **Description** |
|------------|-----------------|
| [Ops/sec](/content/operate/rs/references/metrics/database-operations.md#opssec) | The number of overall operations per sec for all Redis commands |
| [Reads/sec](/content/operate/rs/references/metrics/database-operations.md#readssec) | The number of read operations per second |
| [Writes/sec](/content/operate/rs/references/metrics/database-operations.md#writessec) | The number of write operations per second |
| [Other cmds/sec](/content/operate/rs/references/metrics/database-operations.md#other-commandssec) | The number of other Redis commands per second |
| [Latency](/content/operate/rs/references/metrics/database-operations.md#latency) | Latency per operation, in milliseconds |
| [Reads latency](/content/operate/rs/references/metrics/database-operations.md#reads-latency) | Latency per read operation, in milliseconds |
| [Writes latency](/content/operate/rs/references/metrics/database-operations.md#writes-latency) | Latency per write operation, in milliseconds |
| [Other latency](/content/operate/rs/references/metrics/database-operations.md#other-commands-latency) | Latency of other commands, in milliseconds |
| [Used memory](/content/operate/rs/references/metrics/resource-usage.md#used-memory) | Amount of memory used by the database |
| [Total keys](/content/operate/rs/references/metrics/database-operations.md#total-keys) | Total number of keys in the database |
| [Connections](/content/operate/rs/references/metrics/resource-usage.md#connections) | Total number of connections to the endpoint |
| [Evicted objects/sec](/content/operate/rs/references/metrics/database-operations.md#evicted-objectssec) | Number of objects evicted from the database per second. |
| [Expired objects/sec](/content/operate/rs/references/metrics/database-operations.md#expired-objectssec) | Number of expired objects per second. An expired object is an object with expired TTL that was deleted from the database. |
| [Hit ratio](/content/operate/rs/references/metrics/database-operations.md#hit-ratio) | Percent of operations on existing keys out of the total number database operations |
| Network Ingress bytes/sec | Amount of traffic in bytes per second entering the database network |
| Network Egress bytes/sec | Amount of traffic in bytes per second exiting the database network |

For more detailed analysis, consider using [Redis Insight](/content/develop/tools/insight/_index.md) or [Prometheus and Grafana](/content/integrate/prometheus-with-redis-cloud/_index.md).

## Configure alerts {#configure-metric-alerts}

Depending on your subscription plan, you can enable alerts for several metrics for a given database.

To do so, locate the alerts settings for your database: for Essentials databases, select the **Alerts** tab on the database screen; for Pro databases, go to the **Configuration** tab and locate the **Alerts** section. 

| Setting name | Description | Default Value | Accepted Range |
|---|---|---|---|
| **Dataset size has reached** | Sends an alert when the dataset size reaches or exceeds the defined percentage of the memory limit. (_Pro only_) | 80% | 1-100% |
| **Total size of datasets under this plan reached** | Sends an alert when the total size of all datasets in the plan reaches or exceeds the defined percentage of the plan limit. (_Essentials only_) | 80% | 1-100% |
| **Throughput is higher than** | Sends an alert when throughput is over the defined limit in operations per second (ops/sec). (_Paid Essentials or Pro only_) | 1000 ops/sec | 1-10000000 ops/sec |
| **Throughput is lower than** | Sends an alert when throughput is under the defined limit in operations per second (ops/sec). (_Paid Essentials or Pro only_) | 10 ops/sec | 1-10000000 ops/sec |
| **Latency is higher than** | Sends an alert when the latency is over the defined limit in milliseconds (msec). (_Paid Essentials or Pro only_) | 10 msec | 1-10000 msec |
| **Number of connections** | Sends an alert when the number of connections exceeds the defined percentage of the plan limit.  (_Essentials only_) | 80% | 1-100% |
| **Replica Of - database unable to sync with source** | Sends an alert when the target database cannot sync with the source database after the defined number of seconds. (_Pro only_) | 1 second | 0-1 seconds |
| **Replica Of - sync lag is higher than** | Sends an alert if lag between the source and target databases exceeds the defined number of seconds. (_Pro only_) | 600 seconds | 1-86400 seconds |

Alert settings are specific to each database. Make sure you've configured alerts for all desired databases.

## Change alert recipients

Any member of the account team can receive alert emails.

To update alert settings for one or more team members, select **Access Management** from the Redis Cloud console menu and then select the **Team** tab. For details, see [Access management](/content/operate/rc/security/access-control/access-management.md).

If you subscribe to Redis Cloud through a Platform-as-a-Service (PaaS) provider (such as Heroku), you will need to review your provider's documentation for help managing your team.

## Connect to Prometheus

Redis Cloud exposes a Prometheus endpoint for Redis Cloud Pro databases. You can use this endpoint to connect Prometheus to your database.

{{< embed-md "rc-get-prometheus-endpoint.md" >}}

For more information on how to connect Prometheus to Redis Cloud, see [Prometheus and Grafana with Redis Cloud](/content/integrate/prometheus-with-redis-cloud/_index.md).

## Continue learning with Redis University

{{< university-links >}}

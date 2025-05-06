---
Title: Redis Cloud Essentials plans
alwaysopen: false
categories:
- docs
- operate
- rc
description: Provides detailed information on Redis Cloud Essentials plans
weight: $weight
---

Redis Cloud Essentials is cost-efficient and designed for low-throughput scenarios. It supports a range of availability, persistence, and backup options.  

[Essentials plan pricing](https://redis.io/pricing/#monthly) scales according to the memory size of the database defined in the subscription.  Additional limits also apply, as shown in the tables below.

The 30 MB Essentials plan is free; it's designed for learning and building test projects. It gives you enough space to learn Redis concepts and develop application prototypes.

Our paid plans start at 250 MB and offer extra features, like high availability and backups (both daily and instant). They are great for bigger projects or production environments that require increased storage, reliability, and other features to support your operational needs.

Essentials plans have bandwidth and throughput limits described in the tables below. We will notify you before limiting your database usage if you exceed these limits.

If you need additional resources, you can [upgrade your subscription]({{< relref "/operate/rc/subscriptions/view-essentials-subscription#upgrade-plan" >}}) at any time.

## Current plans

These plans are currently offered for all new and upgraded Essentials subscriptions (updated December 2024).

### Redis Cloud Essentials plans

{{<table-scrollable>}}
| **DB&nbsp;size**<sup>[1](#table-note-1)</sup> | **30&nbsp;MB&nbsp;(Free)** | **250 MB** | **1 GB** | **2.5 GB** | **5 GB** | **12 GB** |
|---|---|---|---|---|---|---|
| **Concurrent<br/>connections<br/>per database** | 30 | 256 | 1024 | 2500 | 5000 | 10000 |
| **CIDR<br/> allow rules** | 1 | 4 | 4-8 | 4-8 | 4-16 | 4-32 |
| **Monthly<br/> total network<br/> bandwidth<sup>[2](#table-note-2)</sup>** | 5&nbsp;GB | 100&nbsp;GB | 200&nbsp;GB | 400&nbsp;GB | 800&nbsp;GB | 2000&nbsp;GB |
| **Maximum<br/> throughput<sup>[3](#table-note-3)</sup>** | 100&nbsp;ops/sec | 1000&nbsp;ops/sec | 2000&nbsp;ops/sec | 4000&nbsp;ops/sec | 8000&nbsp;ops/sec | 16000&nbsp;ops/sec |
{{</table-scrollable>}}

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a> Database size includes replication where applicable. See [High availability cost impact]({{< relref "/operate/rc/databases/configuration/high-availability#dataset-size" >}}) for more information.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a> The monthly total network bandwidth limit applies to the entire plan. All databases in the plan share the allocated bandwidth limit.

3. <a name="table-note-3" style="display: block; height: 80px; margin-top: -80px;"></a> Assumes request size of 1 KiB. Maximums are capped by actual MB/s reached. To find the MB/s limit, divide the Maximum throughput by 1024.

### Redis Flex plans

{{<table-scrollable>}}
| **DB&nbsp;size**<sup>[1](#table-note-1-flex)</sup> | **1 GB** | **2.5 GB** | **5 GB** | **12 GB** | **25 GB** | **50 GB** | **100 GB** |
|---|---|---|---|---|---|---|---|
| **Concurrent<br/>connections<br/>per database** | 1024 | 2500 | 5000 | 10000 | 10000 | 10000 | 10000 |
| **CIDR<br/> allow rules** | 4-8 | 4-8 | 4-16 | 4-32 | 4-32 | 4-32 | 4-32 |
| **Monthly<br/> total network<br/> bandwidth** | 50&nbsp;GB | 100&nbsp;GB | 200&nbsp;GB | 500&nbsp;GB | 1000&nbsp;GB | 2000&nbsp;GB | 4000&nbsp;GB |
| **Maximum<br/> throughput<sup>[2](#table-note-2-flex)</sup>** | 200&nbsp;ops/sec | 500&nbsp;ops/sec | 1000&nbsp;ops/sec | 2400&nbsp;ops/sec | 5000&nbsp;ops/sec | 10000&nbsp;ops/sec | 20000&nbsp;ops/sec |
{{</table-scrollable>}}

1. <a name="table-note-1" style="display: block; height: 80px; margin-top: -80px;"></a> Database size includes replication where applicable. See [High availability cost impact]({{< relref "/operate/rc/databases/configuration/high-availability#dataset-size" >}}) for more information.

2. <a name="table-note-2" style="display: block; height: 80px; margin-top: -80px;"></a> Assumes request size of 1 KiB. Maximums are capped by actual MB/s reached. To find the MB/s limit, divide the Maximum throughput by 1024.

## Previous plans {#legacy}

These plans were available before November 2023.

{{<table-scrollable>}}
| **Max&nbsp;DB&nbsp;size&nbsp;**<sup>[1](#table-note-1-legacy)</sup>               | **30 MB**        | **100 MB**       | **250 MB**        | **500 MB**        | **1 GB**          | **2.5 GB**        | **5 GB**          | **10 GB**          |
|-----------------------------------------------------------------------------------|------------------|------------------|-------------------|-------------------|-------------------|-------------------|-------------------|--------------------|
| **Concurrent<br/>connections<br/>per database**                                   | 30               | 256              | 256               | 512               | 1024              | 2500              | 5000              | 10000              |
| **Monthly<br/> total network<br/> bandwidth**<sup>[2](#table-note-2-legacy)</sup> | 5&nbsp;GB        | 50&nbsp;GB       | 100&nbsp;GB       | 150&nbsp;GB       | 200&nbsp;GB       | 400&nbsp;GB       | 800&nbsp;GB       | 2000&nbsp;GB       |
| **Maximum<br/> throughput<sup>[3](#table-note-3-legacy)</sup>**                                                       | 100&nbsp;ops/sec | 500&nbsp;ops/sec | 1000&nbsp;ops/sec | 1500&nbsp;ops/sec | 2000&nbsp;ops/sec | 4000&nbsp;ops/sec | 8000&nbsp;ops/sec | 16000&nbsp;ops/sec |
{{</table-scrollable>}}

1. <a name="table-note-1-legacy" style="display: block; height: 80px; margin-top: -80px;"></a> Database size includes replication. See [High availability cost impact]({{< relref "/operate/rc/databases/configuration/high-availability#dataset-size" >}}) for more information.

2. <a name="table-note-2-legacy" style="display: block; height: 80px; margin-top: -80px;"></a> The monthly total network bandwidth limit applies to the entire plan. All databases in the plan share the allocated bandwidth limit.

2. <a name="table-note-2-legacy" style="display: block; height: 80px; margin-top: -80px;"></a> Assumes request size of 1 KiB. Maximums are capped by actual MB/s reached. To find the MB/s limit, divide the Maximum throughput by 1024.
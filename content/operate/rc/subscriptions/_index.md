---
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
linktitle: Subscriptions
title: Manage subscriptions
weight: 35
---

This page helps you manage your Redis Cloud subscriptions; it briefly compares available plans and shows where to find help with common tasks.

## Subscription plans

As of April 2024, Redis Cloud supports the following subscription plans:

- [Free Redis Cloud Essentials](#free-rce)
- [Paid Redis Cloud Essentials](#paid-rce)
- [Redis Cloud Pro](#redis-cloud-pro)

Here's a quick comparison of each plan:

| Feature | Redis Cloud Essentials (free) | Redis Cloud Essentials (paid) | Redis Cloud Pro |
|:-----|:-------:|:----:|:-----:|
| Memory size | 30 MB | 250 MB-12 GB | 50 TB |
| Concurrent connections | 30 | 256-10000 | Unlimited |
| Security | Role-based auth<br/>Password protection<br/>Encryption in transit | Role-based auth<br/>Password protection<br/>TLS auth<br/>Encryption in transit | Role-based auth<br/>Password protection<br/>TLS auth<br/>Encryption in transit<br/>Encryption at rest |
| REST API | No | Yes | Yes | 
| Selected additional features<br/> <br/> <br/>|| Replication<br/>Auto-failover<br /> | Dedicated accounts<br>Auto Tiering<br/>Active/Active<br/> |   

To learn more, see [Redis Cloud Pricing](https://redis.io/pricing/).

### Free Redis Cloud Essentials {#free-rce}

Free plans are a type of Redis Cloud Essentials plans designed for training purposes and prototyping. They can be seamlessly upgraded to other Redis Cloud Essentials plans with no data loss.

### Paid Redis Cloud Essentials {#paid-rce}
Redis Cloud Essentials is cost-efficient and designed for low-throughput scenarios. It support a range of availability, persistence, and backup options.  Pricing supports low throughput workloads. See [Redis Cloud Essentials plans]({{< relref "/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details" >}}) for a list of available plans.

### Redis Cloud Pro
Redis Cloud Pro supports more databases, larger databases, greater throughput, and unlimited connections compared to Redis Cloud Essentials. Hosted in dedicated VPCs, they feature high-availability in a single or multi-AZ, Active-Active, Auto-Tiering, clustering, data persistence, and configurable backups.  Pricing is "pay as you go" to support any dataset size or throughput.

Redis Cloud Pro annual plans support the same features as Redis Cloud Pro but at significant savings. Annual plans also provide Premium support. The underlying commitment applies to all workloads across multiple providers and regions.



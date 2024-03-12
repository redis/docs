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
weight: 20
---

This page helps you manage your Redis Cloud subscriptions; it briefly compares available plans and shows where to find help with common tasks.

## Subscription plans

As of November 2022, Redis Cloud supports the following subscription plans:

- [Free plans](#free-plans)
- [Fixed plans](#fixed-plans)
- [Flexible plans](#flexible-plans)
- [Annual plans](#annual-plans)

Here's a quick comparison of each plan:

| Feature | Free plan | Fixed plan | Flexible/<br/>Annual plan |
|:-----|:-------:|:----:|:-----:|
| Number of databases | 1 | 8-64 | Unlimited |
| Memory size | 30 MB | 250 MB-12 GB | 50 TB |
| Concurrent connections | 30 | 256-Unlimited | Unlimited |
| Security | role-based auth<br/>password protection<br/>encryption in transit | role-based auth<br/>password protection<br/>SSL & SIP auth<br/>encryption in transit | role-based auth<br/>password protection<br/>SSL & SAIP auth<br/>encryption in transit<br/>encryption at rest |
| Admin REST API | No | No | Yes |  
| Support | Basic | Standard | Flexible: Enhanced<br/>Annual: Premium |
| Selected additional features<br/> <br/> <br/>|| Replication<br/>Auto-failover<br /> | Dedicated accounts<br>Auto Tiering<br/>Active/Active<br/> |   

To learn more, see [Redis Cloud Pricing](https://redislabs.com/redis-enterprise-cloud/pricing/).

### Free plans

Free plans are a type of Fixed plans designed for training purposes and prototyping. They can be seamlessly upgraded to Fixed plans with no data loss.

### Fixed plans
Fixed plans are cost-efficient and designed for low-throughput scenarios. They support a range of availability, persistence, and backup options.  Pricing supports low throughput workloads.

### Flexible plans
Flexible plans support more databases, larger databases, greater throughput, and unlimited connections compared to Fixed plans. Hosted in dedicated VPCs, they feature high-availability in a single or multi-AZ, Active-Active, Auto-Tiering, clustering, data persistence, and configurable backups.  Pricing is "pay as you go" to support any dataset size or throughput.

### Annual plans
Annual plans support the same features as Flexible plans but at significant savings.  Annual plans also provide Premium support. The underlying commitment applies to all workloads across multiple providers and regions.

## Common tasks

Create a new subscription:

- The [Redis Cloud quick start]({{< relref "/operate/rc/rc-quickstart.md" >}}) helps you create a free subscription and your first database.  (Start here if you're new.)

- [Create a Fixed subscription]({{< relref "/operate/rc/subscriptions/create-fixed-subscription.md" >}})

- [Create a Flexible subscription]({{< relref "/operate/rc/subscriptions/create-flexible-subscription.md" >}})

- To create an Annual subscription, contact [support](https://redis.com/company/support).

View subscription details:

- [View or edit a Fixed subscription]({{< relref "/operate/rc/subscriptions/view-fixed-subscription.md" >}})

- [View Flexible subscription details]({{< relref "/operate/rc/subscriptions/view-flexible-subscription.md" >}})

- [Delete a subscription]({{< relref "/operate/rc/subscriptions/delete-subscription.md" >}})



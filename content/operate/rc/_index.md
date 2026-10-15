---
Title: Redis Cloud
alwaysopen: false
categories:
- docs
- operate
- rc
description: The fastest way to set up Redis - a fully managed Redis database on major public cloud services.
hideListLinks: true
weight: 20
---
[Redis Cloud](https://redis.io/cloud/) is a fully managed database-as-a-service that brings the speed and reliability of Redis to the cloud, offering seamless scalability and high availability for modern applications.

With Redis Cloud, you get all of the features of Redis Software, including:
- [Redis](/content/develop/_index.md) and [Redis Stack](/content/operate/oss_and_stack/stack-with-enterprise/_index.md) support
- Linear scalability
- Instant failover, backups, and recovery
- Predictable performance
- 24/7 monitoring and support

[Try Redis Cloud](https://redis.io/try-free/) to set up your free 30MB database.

## Get started
Use the [Quick start](/content/operate/rc/rc-quickstart.md) to learn how to create your free database.
- [Connect with redis-cli](/content/operate/rc/rc-quickstart.md#using-rediscli)
- [Connect with Redis client](/content/operate/rc/rc-quickstart.md#using-redis-client)
- [Connect with Redis Insight](/content/operate/rc/rc-quickstart.md#using-redisinsight)

You can also use [Vercel's Redis Cloud integration](https://vercel.com/marketplace/redis-cloud) or [Heroku's Redis Cloud add-on](https://elements.heroku.com/addons/rediscloud) to quickly add a Redis database to your project.

## Databases
Create and manage [Redis databases](/content/operate/rc/databases/_index.md) in the cloud.
- [Create database](/content/operate/rc/databases/create-database/_index.md)
- [View and edit databases](/content/operate/rc/databases/view-edit-database.md)
- [Monitor performance](/content/operate/rc/databases/monitor-performance.md)
- [Manage databases](/content/operate/rc/databases/configuration/_index.md)
- [Redis commands](/content/commands) & [compatibility](/content/operate/rc/compatibility.md)

## Subscriptions
Learn about the [types of subscriptions](/content/operate/rc/subscriptions/_index.md).
- [View and upgrade Essentials plan](/content/operate/rc/subscriptions/view-essentials-subscription/_index.md)
- [Essentials plans](/content/operate/rc/subscriptions/view-essentials-subscription/essentials-plan-details.md)
- [View and edit Pro plan](/content/operate/rc/subscriptions/view-pro-subscription.md)

## Accounts & settings
Manage Redis Cloud [accounts and settings](/content/operate/rc/accounts/_index.md).
- [Billing and payments](/content/operate/rc/billing-and-payments/_index.md)
- [Manage marketplace integrations](/content/operate/rc/cloud-integrations/_index.md)

## Security
Manage [secure connections](/content/operate/rc/security/_index.md) to cloud databases.
- [Access management](/content/operate/rc/security/access-control/access-management.md) for Redis Cloud console security and account management
- [Cloud database security](/content/operate/rc/security/database-security/_index.md)
- [Multi-factor authentication](/content/operate/rc/security/access-control/multi-factor-authentication.md)
- [Single sign-on](/content/operate/rc/security/access-control/saml-sso/_index.md) and [social login](/content/operate/rc/security/access-control/social-login.md)
- [Data access control](/content/operate/rc/security/access-control/data-access-control/_index.md)

## REST API
Use the [REST API](/content/operate/rc/api/_index.md) to manage Redis Cloud databases and subscriptions.
- [Get started with the REST API](/content/operate/rc/api/get-started/_index.md)
- REST API [reference](/content/operate/rc/api/api-reference.md) & [examples](/content/operate/rc/api/examples/_index.md)
- [`redisctl`](https://github.com/redis/redisctl) — a CLI tool that wraps the Redis Cloud and Redis Software APIs for terminal-based management

## Migrate to Redis Cloud
Follow the step-by-step guide for your source environment:
- [ElastiCache to Redis Cloud](https://redis.io/tutorials/migration/elasticache-to-redis-cloud/) — offline and live migration from AWS ElastiCache
- [Memorystore to Redis Cloud](https://redis.io/tutorials/migration/memorystore-to-redis-cloud/) — offline and live migration from Google Cloud Memorystore
- [Open source Redis to Redis Cloud](https://redis.io/tutorials/migration/redis-open-source-to-redis-cloud/) — migrate from a self-hosted Redis instance

## Migrate to Azure Managed Redis
- [ElastiCache to Azure Managed Redis (AMR)](https://redis.io/tutorials/learn/migration/elasti-cache-to-azure-managed-redis/) — move your workload from AWS to Azure
- [Memorystore to Azure Managed Redis (AMR)](https://redis.io/tutorials/learn/migration/memorystore-to-azure-managed-redis/) — move your workload from Google Cloud to Azure

## Related info
- [Redis Software](/content/operate/rs/_index.md)
- [Develop with Redis](/content/develop/_index.md)
- [Redis Stack](/content/operate/oss_and_stack/stack-with-enterprise/_index.md)
- [Glossary](/content/glossary/_index.md)

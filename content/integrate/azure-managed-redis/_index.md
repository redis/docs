---
LinkTitle: Azure Managed Redis
Title: Azure Managed Redis
categories:
- docs
- integrate
- rs
description: Connect your applications and Redis tools to Azure Managed Redis, a Microsoft-operated service built on Redis Enterprise.
group: cloud-service
summary: Use Redis clients, Redis Insight, and Redis developer guides with Azure Managed Redis, the in-memory data store that Microsoft operates on Azure.
type: integration
weight: 12
---

Azure Managed Redis (AMR) is an Azure service built on Redis Enterprise software.
Microsoft operates the service and documents how to provision, configure, and run it.
This page shows how Redis clients, tools, and developer guides apply to AMR, and links
to Microsoft Learn for everything specific to Azure.

## Overview

AMR gives applications inside or outside Azure an in-memory data store for workloads
such as caching, session storage, and vector search. Because it's built on Redis
Enterprise, you use standard Redis clients and commands to work with it.

Microsoft is the source for AMR tiers, pricing, regions, service limits, networking,
scaling, persistence, availability, and monitoring. To learn about the service, see
[What is Azure Managed Redis?](https://learn.microsoft.com/en-us/azure/redis/overview)
on Microsoft Learn.

## Create an instance

You need an Azure subscription to create an AMR instance. To create one in the Azure
portal, follow Microsoft's
[Quickstart: Create an Azure Managed Redis instance](https://learn.microsoft.com/en-us/azure/redis/quickstart-create-managed-redis).

Choose the modules you need when you create the instance. You can't add them later.
For details, see
[Using Redis modules with Azure Managed Redis](https://learn.microsoft.com/en-us/azure/redis/redis-modules).

## Connect your application

New AMR instances use Microsoft Entra ID authentication by default. Access keys are
also available. To add users and service principals to your instance, see
[Use Microsoft Entra for cache authentication](https://learn.microsoft.com/en-us/azure/redis/entra-for-authentication).

These Redis client guides show how to authenticate to AMR with Entra ID, using a managed
identity or a service principal:

| Client | Language | Guide |
| :-- | :-- | :-- |
| redis-py | Python | [Connect to Azure Managed Redis](/content/develop/clients/redis-py/amr.md) |
| node-redis | Node.js | [Connect to Azure Managed Redis](/content/develop/clients/nodejs/amr.md) |
| Jedis | Java | [Connect to Azure Managed Redis](/content/develop/clients/jedis/amr.md) |
| Lettuce | Java | [Connect to Azure Managed Redis](/content/develop/clients/lettuce/amr.md) |
| go-redis | Go | [Connect to Azure Managed Redis](/content/develop/clients/go/amr.md) |
| redis-rs | Rust | [Connect to Azure Managed Redis](/content/develop/clients/rust/amr.md) |

For .NET, Microsoft documents the `Microsoft.Azure.StackExchangeRedis` extension. See
[Client library support](https://learn.microsoft.com/en-us/azure/redis/entra-for-authentication#client-library-support)
on Microsoft Learn.
The .NET client turns on smart client handoffs (SCH) automatically for AMR hostnames.
See [Connect using Smart client handoffs (SCH)](/content/develop/clients/dotnet/connect.md#connect-using-smart-client-handoffs-sch).

For other clients and general connection options, see
[Connect with Redis client API libraries](/content/develop/clients/_index.md) and
Microsoft's
[client library best practices](https://learn.microsoft.com/en-us/azure/redis/best-practices-client-libraries).

## Explore your data

[Redis Insight](/content/develop/tools/insight/_index.md#connect-to-azure-managed-redis-with-ease)
can discover AMR databases across your Azure subscriptions and connect to them with
Entra ID, so you don't need a password. Your Azure administrator must configure access
once per tenant. For the steps, see the
[Azure setup guide](https://github.com/redis/RedisInsight/blob/main/docs/azure-setup.md).

To connect with Redis Insight or redis-cli, see Microsoft's
[Use client tools to access data in Azure Managed Redis](https://learn.microsoft.com/en-us/azure/redis/how-to-redis-access-data).

## Check service capabilities

The Redis developer guides, such as [data types](/content/develop/data-types/_index.md)
and [search and query](/content/develop/ai/search-and-query/_index.md), describe Redis
in general. AMR's supported Redis version, modules, commands, and configuration options
can differ from what these guides assume.

Before you apply a Redis example to AMR, check these pages on Microsoft Learn:

- [Redis version](https://learn.microsoft.com/en-us/azure/redis/overview#redis-version)
- [Redis modules and tier support](https://learn.microsoft.com/en-us/azure/redis/redis-modules)
- [Blocked commands](https://learn.microsoft.com/en-us/azure/redis/best-practices-client-libraries#blocked-commands)
- [Plan your configuration](https://learn.microsoft.com/en-us/azure/redis/plan-configuration)

## Migrate an existing deployment

Microsoft documents each migration route to AMR. Choose the guide for your source:

| Source | Migration guide |
| :-- | :-- |
| Azure Cache for Redis: Basic, Standard, or Premium tier | [Migrate Basic, Standard, and Premium tiers](https://learn.microsoft.com/en-us/azure/redis/migrate/migrate-basic-standard-premium-overview) |
| Azure Cache for Redis: Enterprise tier | [Migrate Enterprise tier](https://learn.microsoft.com/en-us/azure/redis/migrate/migrate-redis-enterprise-overview) |
| Redis on premises, on virtual machines, or in another cloud service | [Migrate to Azure Managed Redis from other caches](https://learn.microsoft.com/en-us/azure/redis/migrate/migration-guide) |

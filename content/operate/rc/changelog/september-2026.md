---
Title: Redis Cloud changelog (September 2026)
alwaysopen: false
categories:
- docs
- operate
- rc
description: New features, enhancements, and other changes added to Redis Cloud during
  September 2026.
highlights: Redis Search on Flex (beta), multiple sources in Data Integration pipelines, Redis Radar
linktitle: September 2026
weight: 46
tags:
- changelog
---

## New features

### Redis Search on Flex (beta)

[Redis Search](/content/develop/ai/search-and-query/_index.md) is now available as a beta feature for [Flex databases](/content/operate/rc/databases/create-database/create-flex-database.md) on Redis Cloud Pro. To use it, enable the beta flag for Redis Search on Flex for your Redis Cloud Pro subscription in the Redis Cloud console.

The beta supports HASH documents with `TEXT`, `TAG`, and `VECTOR` fields. JSON documents, `NUMERIC` and `GEO` fields, `FT.AGGREGATE`, `FT.HYBRID`, and background indexing aren't available yet. See [Redis Search on Flex](/content/operate/rc/databases/create-database/create-flex-database.md#redis-search-on-flex-beta) for the full list of supported features.

### Multiple sources in Data Integration pipelines

[Redis Data Integration (RDI)](/content/operate/rc/rdi/_index.md) on Redis Cloud now uses RDI 2.0.0. A Data Integration pipeline can now connect one or more source databases to one target Redis database. Sources can use the same or different database types. Each source has its own connectivity, credentials, and selection of tables and columns, and you can monitor and manage each source from the pipeline dashboard.

All Data Integration pipelines now use the Flink processor. See the [RDI Cloud FAQ](/content/operate/rc/rdi/faq.md#multiple-sources) for how resetting, flushing, and deleting work with multiple sources.

### Redis Radar

[Redis Radar](/content/operate/rc/radar.md) gives you one view of the status of every Redis cluster you run, across Redis Software, Redis Cloud, Redis Open Source, Amazon ElastiCache, and Google Memorystore. Redis Cloud's hosted Radar needs no setup. Go to [`radar.redis.io`](http://radar.redis.io) and sign in with your Redis Cloud credentials.

## Enhancements

### Connect to AWS PrivateLink from on-premises

You can now connect to a database over [AWS PrivateLink](/content/operate/rc/security/aws-privatelink.md) from an on-premises network connected to your consumer virtual private cloud (VPC) over AWS Direct Connect or a virtual private network (VPN). See [Connect from on-premises](/content/operate/rc/security/aws-privatelink.md#connect-from-on-premises) for the Domain Name System (DNS) options, including which ones work with Transport Layer Security (TLS).

### Single default credit card

Your Redis Cloud account now uses a single default credit card for all active subscriptions. You can [set the default credit card](/content/operate/rc/billing-and-payments/_index.md#set-the-default-credit-card) from **Billing & Payments > Payment Methods**.

If your account has more than one credit card in use across different subscriptions, an Account Admin or Billing Admin must choose a single default card. Starting October 1, 2026, that admin sees a dialog on login and must confirm a default card before continuing to the console.

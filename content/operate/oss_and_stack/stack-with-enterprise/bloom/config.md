---
Title: Probabilistic data structure configuration compatibility with Redis Software
alwaysopen: false
categories:
- docs
- operate
- stack
description: Probabilistic data structure configuration settings supported by Redis Software and Redis Cloud.
linkTitle: Configuration
toc: 'false'
weight: 30
---

## Configure probabilistic data structures in Redis Software

[Redis Software](/content/operate/rs/_index.md) lets you manually change any [RedisBloom configuration setting](/content/develop/data-types/probabilistic/configuration.md#redisbloom-configuration-parameters).

To change the RedisBloom configuration using the Redis Software Cluster Manager UI:

  1. From the **Databases** list, select the database, then click **Configuration**.

  1. Select the **Edit** button.

  1. In the **Capabilities** section, click **Parameters**.

  1. After you finish editing the module's configuration parameters, click **Done** to close the parameter editor.

  1. Click **Save**.

## Configure probabilistic data structures in Redis Cloud

[Redis Cloud](/content/operate/rc/_index.md) does not let you configure RedisBloom manually. However, if you have a Flexible or Annual [subscription](/content/operate/rc/subscriptions/_index.md), you can contact [support](https://redis.com/company/support/) to request a configuration change. You cannot change RedisBloom configuration for Free or Fixed subscriptions.

## Configuration settings

See [configuration parameters](/content/develop/data-types/probabilistic/configuration.md) in the Develop section for parameter details and compatibility with Redis Software and Redis Cloud.

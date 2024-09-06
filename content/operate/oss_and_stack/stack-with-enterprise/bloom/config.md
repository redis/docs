---
Title: Probabilistic data structure configuration compatibility with Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Probabilistic data structure configuration settings supported by Redis Enterprise Software and Redis Cloud.
linkTitle: Configuration
toc: 'false'
weight: 30
---

## Configure probabilistic data structures in Redis Software

[Redis Enterprise Software]({{< relref "/operate/rs" >}}) lets you manually change any [RedisBloom configuration setting]({{< relref "/develop/data-types/probabilistic/" >}}configuration/#redisbloom-configuration-parameters).

To change the RedisBloom configuration using the Redis Software Cluster Manager UI:

  1. From the **Databases** list, select the database, then click **Configuration**.

  1. Select the **Edit** button.

  1. In the **Capabilities** section, click **Parameters**.

  1. After you finish editing the module's configuration parameters, click **Done** to close the parameter editor.

  1. Click **Save**.

## Configure probabilistic data structures in Redis Cloud

[Redis Cloud]({{< relref "/operate/rc" >}}) does not let you configure RedisBloom manually. However, if you have a Flexible or Annual [subscription]({{< relref "/operate/rc/subscriptions" >}}), you can contact [support](https://redis.com/company/support/) to request a configuration change. You cannot change RedisBloom configuration for Free or Fixed subscriptions.

## Configuration settings

| Setting | Redis<br />Enterprise | Redis<br />Cloud | Notes |
|:--------|:----------------------|:-----------------|:------|
| [CF_MAX_EXPANSIONS]({{< relref "/develop/data-types/probabilistic/" >}}configuration/#cf_max_expansions) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 32 |
| [ERROR_RATE]({{< relref "/develop/data-types/probabilistic/" >}}configuration/#error_rate) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 0.01 |
| [INITIAL_SIZE]({{< relref "/develop/data-types/probabilistic/" >}}configuration/#initial_size) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: 100 |

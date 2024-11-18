---
Title: Time series configuration compatibility with Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Time series configuration settings supported by Redis Enterprise Software and Redis Cloud.
linkTitle: Configuration
toc: 'false'
weight: 30
---

## Configure time series in Redis Software

[Redis Enterprise Software]({{< relref "/operate/rs" >}}) lets you manually change any [RedisTimeSeries configuration setting]({{< relref "/develop/data-types/timeseries/" >}}configuration/#redistimeseries-configuration-parameters).

To change RedisTimeSeries configuration using the Redis Software Cluster Manager UI:

  1. From the **Databases** list, select the database, then click **Configuration**.

  1. Select the **Edit** button.

  1. In the **Capabilities** section, click **Parameters**.

  1. After you finish editing the module's configuration parameters, click **Done** to close the parameter editor.

  1. Click **Save**.

## Configure time series in Redis Cloud

[Redis Cloud]({{< relref "/operate/rc" >}}) does not let you configure RedisTimeSeries manually. However, if you have a Flexible or Annual [subscription]({{< relref "/operate/rc/subscriptions" >}}), you can contact [support](https://redis.com/company/support/) to request a configuration change. You cannot change RedisTimeSeries configuration for Free or Fixed subscriptions.

## Configuration settings

| Setting | Redis<br />Enterprise | Redis<br />Cloud | Notes |
|:--------|:----------------------|:-----------------|:------|
| [CHUNK_SIZE_BYTES]({{< relref "/develop/data-types/timeseries/configuration" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `4096` |
| [COMPACTION_POLICY]({{< relref "/develop/data-types/timeseries/configuration" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: No default compaction rules |
| [DUPLICATE_POLICY]({{< relref "/develop/data-types/timeseries/configuration" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `BLOCK` |
| [ENCODING]({{< relref "/develop/data-types/timeseries/configuration" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `COMPRESSED` |
| [NUM_THREADS]({{< relref "/develop/data-types/timeseries/configuration" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual\*</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | \* Updates automatically when you change your plan.<br /><br />Redis Enterprise default: Set by plan<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: Set by plan<br />• Free & Fixed: `1`<br /> |
| [RETENTION_POLICY]({{< relref "/develop/data-types/timeseries/configuration" >}}) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `0` |


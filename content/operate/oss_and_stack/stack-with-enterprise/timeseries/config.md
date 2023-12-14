---
Title: Time series configuration compatibility with Redis Enterprise
alwaysopen: false
categories:
- docs
- operate
- stack
description: Time series configuration settings supported by Redis Enterprise.
linkTitle: Configuration
toc: 'false'
weight: 30
---

[Redis Enterprise Software]({{< relref "/operate/rs" >}}) lets you manually change any [RedisTimeSeries configuration setting](https://redis.io/docs/stack/timeseries/configuration/#redistimeseries-configuration-parameters).

[Redis Cloud]({{< relref "/operate/rc" >}}) does not let you configure RedisTimeSeries manually. However, if you have a Flexible or Annual [subscription]({{< relref "/operate/rc/subscriptions" >}}), you can contact [support](https://redis.com/company/support/) to request a configuration change. You cannot change RedisTimeSeries configuration for Free or Fixed subscriptions.

| Setting | Redis<br />Enterprise | Redis<br />Cloud | Notes |
|:--------|:----------------------|:-----------------|:------|
| [CHUNK_SIZE_BYTES](https://redis.io/docs/stack/timeseries/configuration/#chunk_size_bytes) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `4096` |
| [COMPACTION_POLICY](https://redis.io/docs/stack/timeseries/configuration/#compaction_policy) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: No default compaction rules |
| [DUPLICATE_POLICY](https://redis.io/docs/stack/timeseries/configuration/#duplicate_policy) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `BLOCK` |
| [ENCODING](https://redis.io/docs/stack/timeseries/configuration/#encoding) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `COMPRESSED` |
| [NUM_THREADS](https://redis.io/docs/stack/timeseries/configuration/#num_threads) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual\*</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | \* Updates automatically when you change your plan.<br /><br />Redis Enterprise default: Set by plan<br /><br />Redis Cloud defaults:<br />• Flexible & Annual: Set by plan<br />• Free & Fixed: `1`<br /> |
| [RETENTION_POLICY](https://redis.io/docs/stack/timeseries/configuration/#retention_policy) | <span title="Supported">&#x2705; Supported</span><br /><span><br /></span> | <span title="Supported">&#x2705; Flexible & Annual</span><br /><span title="Not supported"><nobr>&#x274c; Free & Fixed</nobr></span> | Default: `0` |


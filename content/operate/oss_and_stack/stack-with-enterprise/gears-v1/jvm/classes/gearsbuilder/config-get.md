---
Title: ConfigGet
alwaysopen: false
categories:
- docs
- operate
- stack
description: Gets the value of a RedisGears configuration setting.
linkTitle: configGet
weight: 50
---

```java
public static java.lang.String configGet​(java.lang.String key)
```

Gets the value of a RedisGears [configuration setting]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/triggers-and-functions/Configuration" >}}).

{{<note>}}
You can set configuration values when you load the module or use the `RG.CONFIGSET` command.
{{</note>}}

## Parameters

| Name | Type | Description |
|------|------|-------------|
| key | string | The configuration setting to get |

## Returns

Returns the configuration value of a RedisGears configuration setting.

## Example

```java
GearsBuilder.configGet("ExecutionMaxIdleTime");
```
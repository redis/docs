---
Title: ExecuteArray
alwaysopen: false
categories:
- docs
- operate
- stack
description: Runs a Redis command.
linkTitle: executeArray
weight: 50
aliases:
- "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/executearray/"
bannerText: Redis Gears is a deprecated feature that is not recommended or supported
  for new users.
---

```java
public static native java.lang.Object executeArray(
    java.lang.String[] command)
```

Runs a Redis command. It accepts an array of strings, which represents the command to execute.

## Parameters

| Name | Type | Description |
|------|------|-------------|
| command | array of strings | A Redis command |

## Returns

Returns the command result. It could be a string or an array of strings, depending on the command.

## Example

```java
GearsBuilder.executeArray(new String[]{"SET", "age:maximum", "100"});
```
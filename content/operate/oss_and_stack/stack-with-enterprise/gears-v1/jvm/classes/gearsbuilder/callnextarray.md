---
Title: CallNextArray
alwaysopen: false
categories:
- docs
- operate
- stack
description: Calls the next execution that overrides the command or the original command
  itself.
linkTitle: callNextArray
weight: 50
---

```java
public static native java.lang.Object callNextArray(
    java.lang.String[] command)
```

When you override a Redis command with the [`CommandOverrider`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/readers/commandoverrider" >}}), use `callNextArray` to run the next execution that overrides the command or the original command itself.

It accepts an array of strings, which represents the command arguments.

## Parameters

| Name | Type | Description |
|------|------|-------------|
| args | array of strings | Redis command arguments |

## Returns

Returns the command result. It could be a string or an array of strings, depending on the command.

## Example

```java
GearsBuilder.callNextArray(new String[]{"restaurant:1", "reviews", "50"});
```
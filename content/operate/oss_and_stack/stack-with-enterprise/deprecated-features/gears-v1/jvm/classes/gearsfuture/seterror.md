---
Title: SetError
alwaysopen: false
categories:
- docs
- operate
- stack
description: Sets an error message.
linkTitle: setError
weight: 50
aliases:
- "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsfuture/seterror/"
bannerText: Redis Gears is a deprecated feature that is not recommended or supported
  for new users.
---

```java
public void setError​(java.lang.String error) 
	throws java.lang.Exception
```

Sets an error message for an asynchronous computation.

## Parameters

| Name | Type | Description |
|------|------|-------------|
| error | string | An error message |

## Returns

None

## Example

```java
GearsFuture<Boolean> f = new GearsFuture<Boolean>();
try {
	f.setError("An error has occurred during asyncForeach");
} catch (Exception e) {
	e.printStackTrace();
}
```

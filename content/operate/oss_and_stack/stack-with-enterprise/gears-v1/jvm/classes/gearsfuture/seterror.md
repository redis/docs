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

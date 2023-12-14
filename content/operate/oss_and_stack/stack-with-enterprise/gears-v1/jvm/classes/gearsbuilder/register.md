---
Title: Register
alwaysopen: false
categories:
- docs
- operate
- stack
description: Registers the pipeline of functions to run when certain events occur.
linkTitle: register
weight: 50
---

```java
public java.lang.String register()

public java.lang.String register​(ExecutionMode mode)

public java.lang.String register​(
    ExecutionMode mode, 
    gears.operations.OnRegisteredOperation onRegister, 
    gears.operations.OnUnregisteredOperation onUnregistered)
```

Registers the pipeline of functions to run when certain [events]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/register-events" >}}) occur. The registered functions will run each time the event occurs.

Execution modes:

| Name | Description |
|------|-------------|
| ASYNC | Runs asynchronously on all of the shards. |
| ASYNC_LOCAL | Runs asynchronously but only on the current shard that generated the event. |
| SYNC | Runs synchronously only on the same shard that generated the event. |

{{<note>}}
If you call `register()` without specifying an execution mode, it will default to `ASYNC`. 
{{</note>}}

## Parameters

| Name | Type | Description |
|------|------|-------------|
| mode | ExecutionMode | The execution mode to use (ASYNC/ASYNC_LOCAL/SYNC) |
| onRegister | OnRegisteredOperation | Register callback that will be called on each shard upon register |
| onUnregistered | OnUnregisteredOperation | Unregister callback that will be called on each shard upon unregister |

## Returns

Returns a registration ID.

## Example

```java
GearsBuilder.CreateGearsBuilder(reader).register();
```
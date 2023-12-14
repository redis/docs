---
Title: CommandReader
alwaysopen: false
categories:
- docs
- operate
- stack
description: Run RedisGears functions on command.
linkTitle: CommandReader
weight: 60
---

The `CommandReader` allows you to run RedisGears functions on command when you:

1. Pass the `CommandReader` to the [`GearsBuilder.CreateGearsBuilder()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/creategearsbuilder" >}}) function in your Java code.
1. Call the [`register()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}}) function.
1. Run `RG.JEXECUTE` to register your code.
1. Use `RG.TRIGGER` to run your code on command:

    ```sh
    RG.TRIGGER <Trigger name> [arg1 arg2 ...]
    ```

## Parameters

| Name | Type | Description |
|------|------|-------------|
| trigger | string | The command name that triggers the registered RedisGears functions to run |

## Output records

Outputs a record with the command trigger's name and arguments.

## Example

The following example shows how to create a custom command to update an item's stock. It also adds a timestamp to track when the last restock occurred.

Add a hash to the database that represents an inventory item:

```sh
redis> HSET inventory:headphones:1 color "blue" stock 5 price 30.00
(integer) 3
```

Example code:

```java
// Create the reader that will pass data to the pipe
CommandReader reader = new CommandReader();
// Set the name of the custom command
reader.setTrigger("Restock");
        
// Create the data pipe builder
GearsBuilder.CreateGearsBuilder(reader).map(r-> {
    // Parse the command arguments to get the key name and new stock value
    String itemKey = new String((byte[]) r[1], StandardCharsets.UTF_8);
    String newStock = new String((byte[]) r[2], StandardCharsets.UTF_8);
        	
    // Update the item's stock and add a timestamp
    GearsBuilder.execute("HSET", itemKey , "stock", newStock,
        			"last_restocked", Long.toString(System.currentTimeMillis()));
        	
    return "OK restocked " + itemKey;
}).register();
```

After you register the previous code with the `RG.JEXECUTE` command, run `RG.TRIGGER` to test it:

```sh
redis> RG.TRIGGER Restock inventory:headphones:1 20
1) "OK restocked inventory:headphones:1"
```

The item now has the updated value for `stock` and a `last_restocked` timestamp:

```sh
redis> HGETALL inventory:headphones:1
1) "color"
2) "blue"
3) "stock"
4) "20"
5) "price"
6) "30.00"
7) "last_restocked"
8) "1643232394078"
```

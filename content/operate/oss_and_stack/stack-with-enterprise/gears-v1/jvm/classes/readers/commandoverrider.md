---
Title: CommandOverrider
alwaysopen: false
categories:
- docs
- operate
- stack
description: Override a Redis command.
linkTitle: CommandOverrider
weight: 60
---

The `CommandOverrider` allows you to override and customize Redis commands.

1. Pass the `CommandOverrider` to the [`GearsBuilder.CreateGearsBuilder()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/creategearsbuilder" >}}) function in your Java code.
1. Call the [`register()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}}) function.
1. Run `RG.JEXECUTE` to register your code.

{{<note>}}
If you register code that uses `CommandOverrider`, its `reader` value is `"CommandReader"` when you run the [`RG.DUMPREGISTRATIONS`](http://oss.redis.com/redisgears/commands.html#rgdumpregistrations) command, not `"CommandOverrider"`.
{{</note>}}

## Parameters

| Name | Type | Description |
|------|------|-------------|
| command | string | The command to override |
| prefix | string | Only override the command for keys that start with this string |

## Output records

Outputs a record with the command's name and arguments.

## Example

The following example shows how to override the `HSET` command so that it also adds a `last_modified` timestamp for "user:" hashes.

Add some user data as a hash:

```sh
redis> HSET user:1 name "morgan" posts 201
(integer) 2
```

Example code:

```java
// Create the reader that will pass data to the pipe
CommandOverrider overrider = new CommandOverrider();
// Override the HSET command
overrider.setCommand("HSET");
// Only override HSET for keys that start with "user:"
overrider.setPrefix("user:");
        
// Create the data pipe builder
GearsBuilder.CreateGearsBuilder(overrider).map(r-> {
    // Extract the key from the command arguments
    String keyName = new String((byte[]) r[1], StandardCharsets.UTF_8);
        	
    // Add a last_modified timestamp to the user's profile
    GearsBuilder.execute("HSET", keyName, "last_modified", Long.toString(System.currentTimeMillis()));
        	
    // Get the original HSET arguments
    ArrayList<String> commandArray = new ArrayList<String>();
    for (int i=1; i < r.length; i++) {
        commandArray.add(new String((byte[]) r[i], StandardCharsets.UTF_8));
    }
        	
    // Run the original HSET command
    GearsBuilder.callNext(commandArray.toArray(new String[0]));
        	
    return "OK";
}).register();
```

After you register the previous code with the `RG.JEXECUTE` command, try to update the user's data with `HSET` to test it:

```sh
redis> HSET user:1 posts 234
"OK"
```

Now the user's profile should have the updated value for `posts` and a `last_modified` timestamp:

```sh
redis> HGETALL user:1
1) "name"
2) "morgan"
3) "posts"
4) "234"
5) "last_modified"
6) "1643237927663"
```
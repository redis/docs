---
Title: KeysReader
alwaysopen: false
categories:
- docs
- operate
- stack
description: Gets keys and their values from a database.
linkTitle: KeysReader
weight: 60
---

Creates records from the keys and values stored in a Redis database.

{{<note>}}
 Currently only supports string and hash data types. For other data types, it will only extract the key name.
{{</note>}}

## Constructors

You can use one of these constructors to create a new `KeysReader` object:

```java
public KeysReader()

public KeysReader(String pattern)

public KeysReader(String prefix, boolean readValues)

public KeysReader(String pattern, boolean noScan, boolean readValues)

public KeysReader(String prefix, 
                  boolean readValues, 
                  String[] eventTypes, 
                  String[] keyTypes)

public KeysReader(String pattern, 
                  boolean noScan, 
                  boolean readValues, 
                  String[] eventTypes, 
                  String[] keyTypes)
```

## Parameters

| Name | Type | Default value | Description |
|------|------|---------------|-------------|
| commands | array of strings | null | The commands that this reader is registered on |
| eventTypes | array of strings | null | The [event types]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/register-events#event-types" >}}) to register on (usually the command name) |
| keyTypes | array of strings | null | The key types to register on |
| noScan | boolean | false | Whether or not to scan the key space or just read the pattern as is |
| pattern/prefix | string | "\*" (match all keys) | The reader will get all keys that match this pattern |
| readValues | boolean | true | Whether or not to read the keys' values |


## Output records

Creates a `KeysReaderRecord` for each matching key in the database.

| Name | Type | Description |
|------|------|-------------|
| key | string | The name of the key |
| type | long | The core Redis type: 'string', 'hash', 'list', 'set', 'zset', or 'stream' |
| event | string | The event that triggered the execution (null if using the run function) |
| stringVal | string | The key's value for string data types |
| hashVal | Map<String,String> | The key's value for hash data types |
| listVal | List<String> | The key's value for list data types |
| setVal | Set<String> | The key's value for set data types |

## Examples

Here's a basic example of a `KeysReader` that creates records for all keys in the database:

```java
KeysReader reader = new KeysReader();
```

In the following example, the `KeysReader` creates records for all keys in the database that start with "person:". When registered, it only runs for hashes after `HSET` and `DEL` events occur.

```java
String[] eventTypes = {"HSET", "DEL"};
String[] keyTypes = {"HASH"};
KeysReader reader = new KeysReader("person:*", false, true, eventTypes, keyTypes);
```

---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: 'Managing keys in Redis: Key expiration, scanning, altering and querying
  the key space

  '
linkTitle: Keyspace
title: Keyspace
weight: 1
---

Redis keys are binary safe; this means that you can use any binary sequence as a
key, from a string like "foo" to the content of a JPEG file.
The empty string is also a valid key.

A few other rules about keys: 

* Very long keys are not a good idea. For instance a key of 1024 bytes is a bad
  idea not only memory-wise, but also because the lookup of the key in the
  dataset may require several costly key-comparisons. Even when the task at hand
  is to match the existence of a large value, hashing it (for example
  with SHA1) is a better idea, especially from the perspective of memory
  and bandwidth.
* Very short keys are often not a good idea. There is little point in writing
  "u1000flw" as a key if you can instead write "user:1000:followers".  The latter
  is more readable and the added space is minor compared to the space used by
  the key object itself and the value object. While short keys will obviously
  consume a bit less memory, your job is to find the right balance.
* Try to stick with a schema. For instance "object-type:id" is a good
  idea, as in "user:1000". Dots or dashes are often used for multi-word
  fields, as in "comment:4321:reply.to" or "comment:4321:reply-to".
* The maximum allowed key size is 512 MB.

## Altering and querying the key space

There are commands that are not defined on particular types, but are useful
in order to interact with the space of keys, and thus, can be used with
keys of any type.

For example the [`EXISTS`](/commands/exists) command returns 1 or 0 to signal if a given key
exists or not in the database, while the [`DEL`](/commands/del) command deletes a key
and associated value, whatever the value is.

    > set mykey hello
    OK
    > exists mykey
    (integer) 1
    > del mykey
    (integer) 1
    > exists mykey
    (integer) 0

From the examples you can also see how [`DEL`](/commands/del) itself returns 1 or 0 depending on whether
the key was removed (it existed) or not (there was no such key with that
name).

There are many key space related commands, but the above two are the
essential ones together with the [`TYPE`](/commands/type) command, which returns the kind
of value stored at the specified key:

    > set mykey x
    OK
    > type mykey
    string
    > del mykey
    (integer) 1
    > type mykey
    none

## Key expiration

Before moving on, we should look at an important Redis feature that works regardless of the type of value you're storing: key expiration. Key expiration lets you set a timeout for a key, also known as a "time to live", or "TTL". When the time to live elapses, the key is automatically destroyed. 

A few important notes about key expiration:

* They can be set both using seconds or milliseconds precision.
* However the expire time resolution is always 1 millisecond.
* Information about expires are replicated and persisted on disk, the time virtually passes when your Redis server remains stopped (this means that Redis saves the date at which a key will expire).

Use the [`EXPIRE`](/commands/expire) command to set a key's expiration:

    > set key some-value
    OK
    > expire key 5
    (integer) 1
    > get key (immediately)
    "some-value"
    > get key (after some time)
    (nil)

The key vanished between the two [`GET`](/commands/get) calls, since the second call was
delayed more than 5 seconds. In the example above we used [`EXPIRE`](/commands/expire) in
order to set the expire (it can also be used in order to set a different
expire to a key already having one, like [`PERSIST`](/commands/persist) can be used in order
to remove the expire and make the key persistent forever). However we
can also create keys with expires using other Redis commands. For example
using [`SET`](/commands/set) options:

    > set key 100 ex 10
    OK
    > ttl key
    (integer) 9

The example above sets a key with the string value `100`, having an expire
of ten seconds. Later the [`TTL`](/commands/ttl) command is called in order to check the
remaining time to live for the key.

In order to set and check expires in milliseconds, check the [`PEXPIRE`](/commands/pexpire) and
the [`PTTL`](/commands/pttl) commands, and the full list of [`SET`](/commands/set) options.

## Navigating the keyspace

### Scan
To incrementally  iterate over the keys in a Redis database in an efficient manner, you can use the [`SCAN`](/commands/scan) command.

Since [`SCAN`](/commands/scan) allows for incremental iteration, returning only a small number of elements per call, it can be used in production without the downside of commands like [`KEYS`](/commands/keys) or [`SMEMBERS`](/commands/smembers) that may block the server for a long time (even several seconds) when called against big collections of keys or elements.

However while blocking commands like [`SMEMBERS`](/commands/smembers) are able to provide all the elements that are part of a Set in a given moment.
The [`SCAN`](/commands/scan) family of commands only offer limited guarantees about the returned elements since the collection that we incrementally iterate can change during the iteration process.

### Keys

Another way to iterate over the keyspace is to use the [`KEYS`](/commands/keys) command, but this approach should be used with care, since [`KEYS`](/commands/keys) will block the Redis server until all keys are returned.

**Warning**: consider [`KEYS`](/commands/keys) as a command that should only be used in production
environments with extreme care.

[`KEYS`](/commands/keys) may ruin performance when it is executed against large databases.
This command is intended for debugging and special operations, such as changing
your keyspace layout.
Don't use [`KEYS`](/commands/keys) in your regular application code.
If you're looking for a way to find keys in a subset of your keyspace, consider
using [`SCAN`](/commands/scan) or [sets][tdts].

[tdts]: /topics/data-types#sets

Supported glob-style patterns:

* `h?llo` matches `hello`, `hallo` and `hxllo`
* `h*llo` matches `hllo` and `heeeello`
* `h[ae]llo` matches `hello` and `hallo,` but not `hillo`
* `h[^e]llo` matches `hallo`, `hbllo`, ... but not `hello`
* `h[a-b]llo` matches `hallo` and `hbllo`

Use `\` to escape special characters if you want to match them verbatim.

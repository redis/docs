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
linkTitle: Keys and values
title: Keys and values
weight: 10
aliases: /develop/use/keyspace
---

Every data object that you store in a Redis database has its own unique
*key*. The key is a string that you pass to Redis commands to
retrieve the corresponding object or modify its data. The data object associated with a
particular key is known as the *value* and the two together are known as
as *key-value pair*.

## Content of keys

A key is typically a textual name that has some meaning within your
data model. Unlike variable names in a programming language, Redis keys have few
restrictions on their format, so keys with whitespace or punctuation characters
are mostly fine (for example, "1st Attempt", or "% of price in $"). Redis doesn't
support namespaces or other categories for keys, so you must take care to avoid
name collisions. However, there is a convention for using the colon ":"
character to split keys into sections (for example, "person:1", "person:2",
"office:London", "office:NewYork:1"). You can use this as a simple way to collect
keys together into categories.

Although keys are usually textual, Redis actually implements *binary-safe* keys,
so you can use any sequence of bytes as a valid key, such as a JPEG file or
a struct value from your app. The empty string is also a valid key in Redis.

There are also a few other things to bear in mind about keys: 

* Very long keys are not a good idea. For instance, a key of 1024 bytes is a bad
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

### Hashtags

Redis uses [hashing](https://en.wikipedia.org/wiki/Hash_table) to retrieve the
value associated with a key in a highly efficient way. Hashing involves combining the
raw byte values from the key to produce an integer *index* number. The index is then
used to locate the *hash slot* where the value for the key is stored.

Normally, the whole key is used to calculate the hash index, but there are some
situations where you need to hash only a part of the key. You can select the
section of the key you want to hash using a pair of curly braces `{...}` to create
a *hashtag*. For example, the keys `person:1` and `person:2` produce different
hash indices but `{person}:1` and `{person}:2` produce the same index because
only the `person` hashtag section in the braces is used for the hash calculation.

A common use of hashtags is to allow
[multi-key operations]({{< relref "/operate/rs/databases/durability-ha/clustering" >}})
with a *clustered* database (see
[Database clustering]({{< relref "/operate/rs/databases/durability-ha/clustering#multikey-operations" >}})
for more information). Redis doesn't allow most multi-key operations in a clustered database
unless all the keys produce the same hash index. For example, the
[SINTER]({{< relref "/commands/sinter" >}})
command finds the [intersection](https://en.wikipedia.org/wiki/Intersection_(set_theory))
of two different [set]({{< relref "/develop/data-types/sets" >}}) values.
This means that the command

```bash
SINTER group:1 group:2
```

won't work with a clustered database but

```bash
SINTER {group}:1 {group}:2
```

will work because the hashtag ensures the two keys produce the same hash index.

Note that although hashtags are useful in certain cases, you shouldn't make
a habit of using them generally. If you have too many keys mapped to the same
hash slot then this will eventually harm the performance of your database.
See [Database clustering]({{< relref "/operate/rs/databases/durability-ha/clustering" >}})
for more information about how to use hashtags.

## Altering and querying the key space

There are commands that are not defined on particular types, but are useful
in order to interact with the space of keys, and thus, can be used with
keys of any type.

For example the [`EXISTS`]({{< relref "/commands/exists" >}}) command returns 1 or 0 to signal if a given key
exists or not in the database, while the [`DEL`]({{< relref "/commands/del" >}}) command deletes a key
and associated value, whatever the value is.

    > set mykey hello
    OK
    > exists mykey
    (integer) 1
    > del mykey
    (integer) 1
    > exists mykey
    (integer) 0

From the examples you can also see how [`DEL`]({{< relref "/commands/del" >}}) itself returns 1 or 0 depending on whether
the key was removed (it existed) or not (there was no such key with that
name).

There are many key space related commands, but the above two are the
essential ones together with the [`TYPE`]({{< relref "/commands/type" >}}) command, which returns the kind
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

Use the [`EXPIRE`]({{< relref "/commands/expire" >}}) command to set a key's expiration:

    > set key some-value
    OK
    > expire key 5
    (integer) 1
    > get key (immediately)
    "some-value"
    > get key (after some time)
    (nil)

The key vanished between the two [`GET`]({{< relref "/commands/get" >}}) calls, since the second call was
delayed more than 5 seconds. In the example above we used [`EXPIRE`]({{< relref "/commands/expire" >}}) in
order to set the expire (it can also be used in order to set a different
expire to a key already having one, like [`PERSIST`]({{< relref "/commands/persist" >}}) can be used in order
to remove the expire and make the key persistent forever). However we
can also create keys with expires using other Redis commands. For example
using [`SET`]({{< relref "/commands/set" >}}) options:

    > set key 100 ex 10
    OK
    > ttl key
    (integer) 9

The example above sets a key with the string value `100`, having an expire
of ten seconds. Later the [`TTL`]({{< relref "/commands/ttl" >}}) command is called in order to check the
remaining time to live for the key.

In order to set and check expires in milliseconds, check the [`PEXPIRE`]({{< relref "/commands/pexpire" >}}) and
the [`PTTL`]({{< relref "/commands/pttl" >}}) commands, and the full list of [`SET`]({{< relref "/commands/set" >}}) options.

## Navigating the keyspace

### Scan

To incrementally  iterate over the keys in a Redis database in an efficient manner, you can use the [`SCAN`]({{< relref "/commands/scan" >}}) command.

Since [`SCAN`]({{< relref "/commands/scan" >}}) allows for incremental iteration, returning only a small number of elements per call, it can be used in production without the downside of commands like [`KEYS`]({{< relref "/commands/keys" >}}) or [`SMEMBERS`]({{< relref "/commands/smembers" >}}) that may block the server for a long time (even several seconds) when called against big collections of keys or elements.

However while blocking commands like [`SMEMBERS`]({{< relref "/commands/smembers" >}}) are able to provide all the elements that are part of a Set in a given moment.
The [`SCAN`]({{< relref "/commands/scan" >}}) family of commands only offer limited guarantees about the returned elements since the collection that we incrementally iterate can change during the iteration process.

### Keys

Another way to iterate over the keyspace is to use the [`KEYS`]({{< relref "/commands/keys" >}}) command, but this approach should be used with care, since [`KEYS`]({{< relref "/commands/keys" >}}) will block the Redis server until all keys are returned.

**Warning**: consider [`KEYS`]({{< relref "/commands/keys" >}}) as a command that should only be used in production
environments with extreme care.

[`KEYS`]({{< relref "/commands/keys" >}}) may ruin performance when it is executed against large databases.
This command is intended for debugging and special operations, such as changing
your keyspace layout.
Don't use [`KEYS`]({{< relref "/commands/keys" >}}) in your regular application code.
If you're looking for a way to find keys in a subset of your keyspace, consider
using [`SCAN`]({{< relref "/commands/scan" >}}) or [sets]({{< relref "/develop/data-types/sets" >}}).

[tdts]: /develop/data-types#sets

Supported glob-style patterns:

* `h?llo` matches `hello`, `hallo` and `hxllo`
* `h*llo` matches `hllo` and `heeeello`
* `h[ae]llo` matches `hello` and `hallo,` but not `hillo`
* `h[^e]llo` matches `hallo`, `hbllo`, ... but not `hello`
* `h[a-b]llo` matches `hallo` and `hbllo`

Use `\` to escape special characters if you want to match them verbatim.

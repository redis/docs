---
title: Redis 7.2 Commands Reference
linkTitle: Redis 7.2 Commands
description: Complete list of all Redis commands available in version 7.2, organized by functional group
summary: Complete list of all Redis commands available in version 7.2, organized by functional group
layout: single
type: develop
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
weight: 5
---

This page provides a comprehensive reference of all Redis commands available in Redis 7.2, organized by functional group. Each command includes its description and syntax in a collapsible section for easy navigation.

{{< note >}}
Redis 7.2 includes all commands from previous versions plus new commands introduced in 7.2. Commands marked with **⭐ New in 7.2** were added in this release.

Command page links take you to the *current implementation* of each command page.
{{< /note >}}

## Quick Navigation

- [String commands](#string-commands)
- [Hash commands](#hash-commands)
- [List commands](#list-commands)
- [Set commands](#set-commands)
- [Sorted set commands](#sorted-set-commands)
- [Stream commands](#stream-commands)
- [Bitmap commands](#bitmap-commands)
- [HyperLogLog commands](#hyperloglog-commands)
- [Geospatial commands](#geospatial-commands)
- [JSON commands](#json-commands)
- [Search commands](#search-commands)
- [Time series commands](#time-series-commands)
- [Pub/Sub commands](#pubsub-commands)
- [Transaction commands](#transaction-commands)
- [Scripting commands](#scripting-commands)
- [Connection commands](#connection-commands)
- [Server commands](#server-commands)
- [Cluster commands](#cluster-commands)
- [Generic commands](#generic-commands)

---

## String commands

String commands operate on string values, the most basic Redis data type.

<details>
<summary><strong><a href="/commands/append/">APPEND</a></strong> - Appends a string to the value of a key. Creates the key if it doesn't exist.</summary>

**Syntax:** `APPEND key value`

**Description:** Appends a string to the value of a key. Creates the key if it doesn't exist.

**Complexity:** O(1). The amortized time complexity is O(1) assuming the appended value is small and the already present value is of any size, since the dynamic string library used by Redis will double the free space available on every reallocation.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/decr/">DECR</a></strong> - Decrements the integer value of a key by one. Uses 0 as initial value if the key doesn't exist.</summary>

**Syntax:** `DECR key`

**Description:** Decrements the integer value of a key by one. Uses 0 as initial value if the key doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/decrby/">DECRBY</a></strong> - Decrements a number from the integer value of a key. Uses 0 as initial value if the key doesn't exist.</summary>

**Syntax:** `DECRBY key decrement`

**Description:** Decrements a number from the integer value of a key. Uses 0 as initial value if the key doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/get/">GET</a></strong> - Returns the string value of a key.</summary>

**Syntax:** `GET key`

**Description:** Returns the string value of a key.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/getdel/">GETDEL</a></strong> - Returns the string value of a key after deleting the key.</summary>

**Syntax:** `GETDEL key`

**Description:** Returns the string value of a key after deleting the key.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/getex/">GETEX</a></strong> - Returns the string value of a key after setting its expiration time.</summary>

**Syntax:** `GETEX key [EX seconds | PX milliseconds | EXAT unix-time-seconds |
  PXAT unix-time-milliseconds | PERSIST]`

**Description:** Returns the string value of a key after setting its expiration time.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/getrange/">GETRANGE</a></strong> - Returns a substring of the string stored at a key.</summary>

**Syntax:** `GETRANGE key start end`

**Description:** Returns a substring of the string stored at a key.

**Complexity:** O(N) where N is the length of the returned string. The complexity is ultimately determined by the returned length, but because creating a substring from an existing string is very cheap, it can be considered O(1) for small strings.

**Since:** 2.4.0

</details>

<details>
<summary><strong><a href="/commands/getset/">GETSET</a></strong> - Returns the previous string value of a key after setting it to a new value.</summary>

**Syntax:** `GETSET key value`

**Description:** Returns the previous string value of a key after setting it to a new value.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/incr/">INCR</a></strong> - Increments the integer value of a key by one. Uses 0 as initial value if the key doesn't exist.</summary>

**Syntax:** `INCR key`

**Description:** Increments the integer value of a key by one. Uses 0 as initial value if the key doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/incrby/">INCRBY</a></strong> - Increments the integer value of a key by a number. Uses 0 as initial value if the key doesn't exist.</summary>

**Syntax:** `INCRBY key increment`

**Description:** Increments the integer value of a key by a number. Uses 0 as initial value if the key doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/incrbyfloat/">INCRBYFLOAT</a></strong> - Increment the floating point value of a key by a number. Uses 0 as initial value if the key doesn't exist.</summary>

**Syntax:** `INCRBYFLOAT key increment`

**Description:** Increment the floating point value of a key by a number. Uses 0 as initial value if the key doesn't exist.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/lcs/">LCS</a></strong> - Finds the longest common substring.</summary>

**Syntax:** `LCS key1 key2 [LEN] [IDX] [MINMATCHLEN min-match-len] [WITHMATCHLEN]`

**Description:** Finds the longest common substring.

**Complexity:** O(N*M) where N and M are the lengths of s1 and s2, respectively

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/mget/">MGET</a></strong> - Atomically returns the string values of one or more keys.</summary>

**Syntax:** `MGET key [key ...]`

**Description:** Atomically returns the string values of one or more keys.

**Complexity:** O(N) where N is the number of keys to retrieve.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/mset/">MSET</a></strong> - Atomically creates or modifies the string values of one or more keys.</summary>

**Syntax:** `MSET key value [key value ...]`

**Description:** Atomically creates or modifies the string values of one or more keys.

**Complexity:** O(N) where N is the number of keys to set.

**Since:** 1.0.1

</details>

<details>
<summary><strong><a href="/commands/msetnx/">MSETNX</a></strong> - Atomically modifies the string values of one or more keys only when all keys don't exist.</summary>

**Syntax:** `MSETNX key value [key value ...]`

**Description:** Atomically modifies the string values of one or more keys only when all keys don't exist.

**Complexity:** O(N) where N is the number of keys to set.

**Since:** 1.0.1

</details>

<details>
<summary><strong><a href="/commands/psetex/">PSETEX</a></strong> - Sets both string value and expiration time in milliseconds of a key. The key is created if it doesn't exist.</summary>

**Syntax:** `PSETEX key milliseconds value`

**Description:** Sets both string value and expiration time in milliseconds of a key. The key is created if it doesn't exist.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/set/">SET</a></strong> - Sets the string value of a key, ignoring its type. The key is created if it doesn't exist.</summary>

**Syntax:** `SET key value [NX | XX | IFEQ ifeq-value | IFNE ifne-value |
  IFDEQ ifdeq-digest | IFDNE ifdne-digest] [GET] [EX seconds |
  PX milliseconds | EXAT unix-time-seconds |
  PXAT unix-time-milliseconds | KEEPTTL]`

**Description:** Sets the string value of a key, ignoring its type. The key is created if it doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/setex/">SETEX</a></strong> - Sets the string value and expiration time of a key. Creates the key if it doesn't exist.</summary>

**Syntax:** `SETEX key seconds value`

**Description:** Sets the string value and expiration time of a key. Creates the key if it doesn't exist.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/setnx/">SETNX</a></strong> - Set the string value of a key only when the key doesn't exist.</summary>

**Syntax:** `SETNX key value`

**Description:** Set the string value of a key only when the key doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/setrange/">SETRANGE</a></strong> - Overwrites a part of a string value with another by an offset. Creates the key if it doesn't exist.</summary>

**Syntax:** `SETRANGE key offset value`

**Description:** Overwrites a part of a string value with another by an offset. Creates the key if it doesn't exist.

**Complexity:** O(1), not counting the time taken to copy the new string in place. Usually, this string is very small so the amortized complexity is O(1). Otherwise, complexity is O(M) with M being the length of the value argument.

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/strlen/">STRLEN</a></strong> - Returns the length of a string value.</summary>

**Syntax:** `STRLEN key`

**Description:** Returns the length of a string value.

**Complexity:** O(1)

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/substr/">SUBSTR</a></strong> - Returns a substring from a string value.</summary>

**Syntax:** `SUBSTR key start end`

**Description:** Returns a substring from a string value.

**Complexity:** O(N) where N is the length of the returned string. The complexity is ultimately determined by the returned length, but because creating a substring from an existing string is very cheap, it can be considered O(1) for small strings.

**Since:** 1.0.0

</details>


## Hash commands

Hash commands operate on hash data structures, which map string fields to string values.

<details>
<summary><strong><a href="/commands/hdel/">HDEL</a></strong> - Deletes one or more fields and their values from a hash. Deletes the hash if no fields remain.</summary>

**Syntax:** `HDEL key field [field ...]`

**Description:** Deletes one or more fields and their values from a hash. Deletes the hash if no fields remain.

**Complexity:** O(N) where N is the number of fields to be removed.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hexists/">HEXISTS</a></strong> - Determines whether a field exists in a hash.</summary>

**Syntax:** `HEXISTS key field`

**Description:** Determines whether a field exists in a hash.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hget/">HGET</a></strong> - Returns the value of a field in a hash.</summary>

**Syntax:** `HGET key field`

**Description:** Returns the value of a field in a hash.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hgetall/">HGETALL</a></strong> - Returns all fields and values in a hash.</summary>

**Syntax:** `HGETALL key`

**Description:** Returns all fields and values in a hash.

**Complexity:** O(N) where N is the size of the hash.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hincrby/">HINCRBY</a></strong> - Increments the integer value of a field in a hash by a number. Uses 0 as initial value if the field doesn't exist.</summary>

**Syntax:** `HINCRBY key field increment`

**Description:** Increments the integer value of a field in a hash by a number. Uses 0 as initial value if the field doesn't exist.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hincrbyfloat/">HINCRBYFLOAT</a></strong> - Increments the floating point value of a field by a number. Uses 0 as initial value if the field doesn't exist.</summary>

**Syntax:** `HINCRBYFLOAT key field increment`

**Description:** Increments the floating point value of a field by a number. Uses 0 as initial value if the field doesn't exist.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/hkeys/">HKEYS</a></strong> - Returns all fields in a hash.</summary>

**Syntax:** `HKEYS key`

**Description:** Returns all fields in a hash.

**Complexity:** O(N) where N is the size of the hash.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hlen/">HLEN</a></strong> - Returns the number of fields in a hash.</summary>

**Syntax:** `HLEN key`

**Description:** Returns the number of fields in a hash.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hmget/">HMGET</a></strong> - Returns the values of all fields in a hash.</summary>

**Syntax:** `HMGET key field [field ...]`

**Description:** Returns the values of all fields in a hash.

**Complexity:** O(N) where N is the number of fields being requested.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hmset/">HMSET</a></strong> - Sets the values of multiple fields.</summary>

**Syntax:** `HMSET key field value [field value ...]`

**Description:** Sets the values of multiple fields.

**Complexity:** O(N) where N is the number of fields being set.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hrandfield/">HRANDFIELD</a></strong> - Returns one or more random fields from a hash.</summary>

**Syntax:** `HRANDFIELD key [count [WITHVALUES]]`

**Description:** Returns one or more random fields from a hash.

**Complexity:** O(N) where N is the number of fields returned

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/hscan/">HSCAN</a></strong> - Iterates over fields and values of a hash.</summary>

**Syntax:** `HSCAN key cursor [MATCH pattern] [COUNT count] [NOVALUES]`

**Description:** Iterates over fields and values of a hash.

**Complexity:** O(1) for every call. O(N) for a complete iteration, including enough command calls for the cursor to return back to 0. N is the number of elements inside the collection.

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/hset/">HSET</a></strong> - Creates or modifies the value of a field in a hash.</summary>

**Syntax:** `HSET key field value [field value ...]`

**Description:** Creates or modifies the value of a field in a hash.

**Complexity:** O(1) for each field/value pair added, so O(N) to add N field/value pairs when the command is called with multiple field/value pairs.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hsetnx/">HSETNX</a></strong> - Sets the value of a field in a hash only when the field doesn't exist.</summary>

**Syntax:** `HSETNX key field value`

**Description:** Sets the value of a field in a hash only when the field doesn't exist.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/hstrlen/">HSTRLEN</a></strong> - Returns the length of the value of a field.</summary>

**Syntax:** `HSTRLEN key field`

**Description:** Returns the length of the value of a field.

**Complexity:** O(1)

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/hvals/">HVALS</a></strong> - Returns all values in a hash.</summary>

**Syntax:** `HVALS key`

**Description:** Returns all values in a hash.

**Complexity:** O(N) where N is the size of the hash.

**Since:** 2.0.0

</details>


## List commands

List commands operate on lists of strings, ordered by insertion order.

<details>
<summary><strong><a href="/commands/blmove/">BLMOVE</a></strong> - Pops an element from a list, pushes it to another list and returns it. Blocks until an element is available otherwise. Deletes the list if the last element was moved.</summary>

**Syntax:** `BLMOVE source destination <LEFT | RIGHT> <LEFT | RIGHT> timeout`

**Description:** Pops an element from a list, pushes it to another list and returns it. Blocks until an element is available otherwise. Deletes the list if the last element was moved.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/blmpop/">BLMPOP</a></strong> - Pops the first element from one of multiple lists. Blocks until an element is available otherwise. Deletes the list if the last element was popped.</summary>

**Syntax:** `BLMPOP timeout numkeys key [key ...] <LEFT | RIGHT> [COUNT count]`

**Description:** Pops the first element from one of multiple lists. Blocks until an element is available otherwise. Deletes the list if the last element was popped.

**Complexity:** O(N+M) where N is the number of provided keys and M is the number of elements returned.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/blpop/">BLPOP</a></strong> - Removes and returns the first element in a list. Blocks until an element is available otherwise. Deletes the list if the last element was popped.</summary>

**Syntax:** `BLPOP key [key ...] timeout`

**Description:** Removes and returns the first element in a list. Blocks until an element is available otherwise. Deletes the list if the last element was popped.

**Complexity:** O(N) where N is the number of provided keys.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/brpop/">BRPOP</a></strong> - Removes and returns the last element in a list. Blocks until an element is available otherwise. Deletes the list if the last element was popped.</summary>

**Syntax:** `BRPOP key [key ...] timeout`

**Description:** Removes and returns the last element in a list. Blocks until an element is available otherwise. Deletes the list if the last element was popped.

**Complexity:** O(N) where N is the number of provided keys.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/brpoplpush/">BRPOPLPUSH</a></strong> - Pops an element from a list, pushes it to another list and returns it. Block until an element is available otherwise. Deletes the list if the last element was popped.</summary>

**Syntax:** `BRPOPLPUSH source destination timeout`

**Description:** Pops an element from a list, pushes it to another list and returns it. Block until an element is available otherwise. Deletes the list if the last element was popped.

**Complexity:** O(1)

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/lindex/">LINDEX</a></strong> - Returns an element from a list by its index.</summary>

**Syntax:** `LINDEX key index`

**Description:** Returns an element from a list by its index.

**Complexity:** O(N) where N is the number of elements to traverse to get to the element at index. This makes asking for the first or the last element of the list O(1).

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/linsert/">LINSERT</a></strong> - Inserts an element before or after another element in a list.</summary>

**Syntax:** `LINSERT key <BEFORE | AFTER> pivot element`

**Description:** Inserts an element before or after another element in a list.

**Complexity:** O(N) where N is the number of elements to traverse before seeing the value pivot. This means that inserting somewhere on the left end on the list (head) can be considered O(1) and inserting somewhere on the right end (tail) is O(N).

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/llen/">LLEN</a></strong> - Returns the length of a list.</summary>

**Syntax:** `LLEN key`

**Description:** Returns the length of a list.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/lmove/">LMOVE</a></strong> - Returns an element after popping it from one list and pushing it to another. Deletes the list if the last element was moved.</summary>

**Syntax:** `LMOVE source destination <LEFT | RIGHT> <LEFT | RIGHT>`

**Description:** Returns an element after popping it from one list and pushing it to another. Deletes the list if the last element was moved.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/lmpop/">LMPOP</a></strong> - Returns multiple elements from a list after removing them. Deletes the list if the last element was popped.</summary>

**Syntax:** `LMPOP numkeys key [key ...] <LEFT | RIGHT> [COUNT count]`

**Description:** Returns multiple elements from a list after removing them. Deletes the list if the last element was popped.

**Complexity:** O(N+M) where N is the number of provided keys and M is the number of elements returned.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/lpop/">LPOP</a></strong> - Returns the first elements in a list after removing it. Deletes the list if the last element was popped.</summary>

**Syntax:** `LPOP key [count]`

**Description:** Returns the first elements in a list after removing it. Deletes the list if the last element was popped.

**Complexity:** O(N) where N is the number of elements returned

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/lpos/">LPOS</a></strong> - Returns the index of matching elements in a list.</summary>

**Syntax:** `LPOS key element [RANK rank] [COUNT num-matches] [MAXLEN len]`

**Description:** Returns the index of matching elements in a list.

**Complexity:** O(N) where N is the number of elements in the list, for the average case. When searching for elements near the head or the tail of the list, or when the MAXLEN option is provided, the command may run in constant time.

**Since:** 6.0.6

</details>

<details>
<summary><strong><a href="/commands/lpush/">LPUSH</a></strong> - Prepends one or more elements to a list. Creates the key if it doesn't exist.</summary>

**Syntax:** `LPUSH key element [element ...]`

**Description:** Prepends one or more elements to a list. Creates the key if it doesn't exist.

**Complexity:** O(1) for each element added, so O(N) to add N elements when the command is called with multiple arguments.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/lpushx/">LPUSHX</a></strong> - Prepends one or more elements to a list only when the list exists.</summary>

**Syntax:** `LPUSHX key element [element ...]`

**Description:** Prepends one or more elements to a list only when the list exists.

**Complexity:** O(1) for each element added, so O(N) to add N elements when the command is called with multiple arguments.

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/lrange/">LRANGE</a></strong> - Returns a range of elements from a list.</summary>

**Syntax:** `LRANGE key start stop`

**Description:** Returns a range of elements from a list.

**Complexity:** O(S+N) where S is the distance of start offset from HEAD for small lists, from nearest end (HEAD or TAIL) for large lists; and N is the number of elements in the specified range.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/lrem/">LREM</a></strong> - Removes elements from a list. Deletes the list if the last element was removed.</summary>

**Syntax:** `LREM key count element`

**Description:** Removes elements from a list. Deletes the list if the last element was removed.

**Complexity:** O(N+M) where N is the length of the list and M is the number of elements removed.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/lset/">LSET</a></strong> - Sets the value of an element in a list by its index.</summary>

**Syntax:** `LSET key index element`

**Description:** Sets the value of an element in a list by its index.

**Complexity:** O(N) where N is the length of the list. Setting either the first or the last element of the list is O(1).

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ltrim/">LTRIM</a></strong> - Removes elements from both ends a list. Deletes the list if all elements were trimmed.</summary>

**Syntax:** `LTRIM key start stop`

**Description:** Removes elements from both ends a list. Deletes the list if all elements were trimmed.

**Complexity:** O(N) where N is the number of elements to be removed by the operation.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/rpop/">RPOP</a></strong> - Returns and removes the last elements of a list. Deletes the list if the last element was popped.</summary>

**Syntax:** `RPOP key [count]`

**Description:** Returns and removes the last elements of a list. Deletes the list if the last element was popped.

**Complexity:** O(N) where N is the number of elements returned

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/rpoplpush/">RPOPLPUSH</a></strong> - Returns the last element of a list after removing and pushing it to another list. Deletes the list if the last element was popped.</summary>

**Syntax:** `RPOPLPUSH source destination`

**Description:** Returns the last element of a list after removing and pushing it to another list. Deletes the list if the last element was popped.

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/rpush/">RPUSH</a></strong> - Appends one or more elements to a list. Creates the key if it doesn't exist.</summary>

**Syntax:** `RPUSH key element [element ...]`

**Description:** Appends one or more elements to a list. Creates the key if it doesn't exist.

**Complexity:** O(1) for each element added, so O(N) to add N elements when the command is called with multiple arguments.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/rpushx/">RPUSHX</a></strong> - Appends an element to a list only when the list exists.</summary>

**Syntax:** `RPUSHX key element [element ...]`

**Description:** Appends an element to a list only when the list exists.

**Complexity:** O(1) for each element added, so O(N) to add N elements when the command is called with multiple arguments.

**Since:** 2.2.0

</details>


## Set commands

Set commands operate on unordered collections of unique strings.

<details>
<summary><strong><a href="/commands/sadd/">SADD</a></strong> - Adds one or more members to a set. Creates the key if it doesn't exist.</summary>

**Syntax:** `SADD key member [member ...]`

**Description:** Adds one or more members to a set. Creates the key if it doesn't exist.

**Complexity:** O(1) for each element added, so O(N) to add N elements when the command is called with multiple arguments.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/scard/">SCARD</a></strong> - Returns the number of members in a set.</summary>

**Syntax:** `SCARD key`

**Description:** Returns the number of members in a set.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sdiff/">SDIFF</a></strong> - Returns the difference of multiple sets.</summary>

**Syntax:** `SDIFF key [key ...]`

**Description:** Returns the difference of multiple sets.

**Complexity:** O(N) where N is the total number of elements in all given sets.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sdiffstore/">SDIFFSTORE</a></strong> - Stores the difference of multiple sets in a key.</summary>

**Syntax:** `SDIFFSTORE destination key [key ...]`

**Description:** Stores the difference of multiple sets in a key.

**Complexity:** O(N) where N is the total number of elements in all given sets.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sinter/">SINTER</a></strong> - Returns the intersect of multiple sets.</summary>

**Syntax:** `SINTER key [key ...]`

**Description:** Returns the intersect of multiple sets.

**Complexity:** O(N*M) worst case where N is the cardinality of the smallest set and M is the number of sets.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sintercard/">SINTERCARD</a></strong> - Returns the number of members of the intersect of multiple sets.</summary>

**Syntax:** `SINTERCARD numkeys key [key ...] [LIMIT limit]`

**Description:** Returns the number of members of the intersect of multiple sets.

**Complexity:** O(N*M) worst case where N is the cardinality of the smallest set and M is the number of sets.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/sinterstore/">SINTERSTORE</a></strong> - Stores the intersect of multiple sets in a key.</summary>

**Syntax:** `SINTERSTORE destination key [key ...]`

**Description:** Stores the intersect of multiple sets in a key.

**Complexity:** O(N*M) worst case where N is the cardinality of the smallest set and M is the number of sets.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sismember/">SISMEMBER</a></strong> - Determines whether a member belongs to a set.</summary>

**Syntax:** `SISMEMBER key member`

**Description:** Determines whether a member belongs to a set.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/smembers/">SMEMBERS</a></strong> - Returns all members of a set.</summary>

**Syntax:** `SMEMBERS key`

**Description:** Returns all members of a set.

**Complexity:** O(N) where N is the set cardinality.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/smismember/">SMISMEMBER</a></strong> - Determines whether multiple members belong to a set.</summary>

**Syntax:** `SMISMEMBER key member [member ...]`

**Description:** Determines whether multiple members belong to a set.

**Complexity:** O(N) where N is the number of elements being checked for membership

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/smove/">SMOVE</a></strong> - Moves a member from one set to another.</summary>

**Syntax:** `SMOVE source destination member`

**Description:** Moves a member from one set to another.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/spop/">SPOP</a></strong> - Returns one or more random members from a set after removing them. Deletes the set if the last member was popped.</summary>

**Syntax:** `SPOP key [count]`

**Description:** Returns one or more random members from a set after removing them. Deletes the set if the last member was popped.

**Complexity:** Without the count argument O(1), otherwise O(N) where N is the value of the passed count.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/srandmember/">SRANDMEMBER</a></strong> - Get one or multiple random members from a set</summary>

**Syntax:** `SRANDMEMBER key [count]`

**Description:** Get one or multiple random members from a set

**Complexity:** Without the count argument O(1), otherwise O(N) where N is the absolute value of the passed count.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/srem/">SREM</a></strong> - Removes one or more members from a set. Deletes the set if the last member was removed.</summary>

**Syntax:** `SREM key member [member ...]`

**Description:** Removes one or more members from a set. Deletes the set if the last member was removed.

**Complexity:** O(N) where N is the number of members to be removed.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sscan/">SSCAN</a></strong> - Iterates over members of a set.</summary>

**Syntax:** `SSCAN key cursor [MATCH pattern] [COUNT count]`

**Description:** Iterates over members of a set.

**Complexity:** O(1) for every call. O(N) for a complete iteration, including enough command calls for the cursor to return back to 0. N is the number of elements inside the collection.

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/sunion/">SUNION</a></strong> - Returns the union of multiple sets.</summary>

**Syntax:** `SUNION key [key ...]`

**Description:** Returns the union of multiple sets.

**Complexity:** O(N) where N is the total number of elements in all given sets.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sunionstore/">SUNIONSTORE</a></strong> - Stores the union of multiple sets in a key.</summary>

**Syntax:** `SUNIONSTORE destination key [key ...]`

**Description:** Stores the union of multiple sets in a key.

**Complexity:** O(N) where N is the total number of elements in all given sets.

**Since:** 1.0.0

</details>


## Sorted set commands

Sorted set commands operate on sets of unique strings ordered by a score.

<details>
<summary><strong><a href="/commands/bzmpop/">BZMPOP</a></strong> - Removes and returns a member by score from one or more sorted sets. Blocks until a member is available otherwise. Deletes the sorted set if the last element was popped.</summary>

**Syntax:** `BZMPOP timeout numkeys key [key ...] <MIN | MAX> [COUNT count]`

**Description:** Removes and returns a member by score from one or more sorted sets. Blocks until a member is available otherwise. Deletes the sorted set if the last element was popped.

**Complexity:** O(K) + O(M*log(N)) where K is the number of provided keys, N being the number of elements in the sorted set, and M being the number of elements popped.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/bzpopmax/">BZPOPMAX</a></strong> - Removes and returns the member with the highest score from one or more sorted sets. Blocks until a member available otherwise.  Deletes the sorted set if the last element was popped.</summary>

**Syntax:** `BZPOPMAX key [key ...] timeout`

**Description:** Removes and returns the member with the highest score from one or more sorted sets. Blocks until a member available otherwise.  Deletes the sorted set if the last element was popped.

**Complexity:** O(log(N)) with N being the number of elements in the sorted set.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/bzpopmin/">BZPOPMIN</a></strong> - Removes and returns the member with the lowest score from one or more sorted sets. Blocks until a member is available otherwise. Deletes the sorted set if the last element was popped.</summary>

**Syntax:** `BZPOPMIN key [key ...] timeout`

**Description:** Removes and returns the member with the lowest score from one or more sorted sets. Blocks until a member is available otherwise. Deletes the sorted set if the last element was popped.

**Complexity:** O(log(N)) with N being the number of elements in the sorted set.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/zadd/">ZADD</a></strong> - Adds one or more members to a sorted set, or updates their scores. Creates the key if it doesn't exist.</summary>

**Syntax:** `ZADD key [NX | XX] [GT | LT] [CH] [INCR] score member [score member
  ...]`

**Description:** Adds one or more members to a sorted set, or updates their scores. Creates the key if it doesn't exist.

**Complexity:** O(log(N)) for each item added, where N is the number of elements in the sorted set.

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zcard/">ZCARD</a></strong> - Returns the number of members in a sorted set.</summary>

**Syntax:** `ZCARD key`

**Description:** Returns the number of members in a sorted set.

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zcount/">ZCOUNT</a></strong> - Returns the count of members in a sorted set that have scores within a range.</summary>

**Syntax:** `ZCOUNT key min max`

**Description:** Returns the count of members in a sorted set that have scores within a range.

**Complexity:** O(log(N)) with N being the number of elements in the sorted set.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/zdiff/">ZDIFF</a></strong> - Returns the difference between multiple sorted sets.</summary>

**Syntax:** `ZDIFF numkeys key [key ...] [WITHSCORES]`

**Description:** Returns the difference between multiple sorted sets.

**Complexity:** O(L + (N-K)log(N)) worst case where L is the total number of elements in all the sets, N is the size of the first set, and K is the size of the result set.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zdiffstore/">ZDIFFSTORE</a></strong> - Stores the difference of multiple sorted sets in a key.</summary>

**Syntax:** `ZDIFFSTORE destination numkeys key [key ...]`

**Description:** Stores the difference of multiple sorted sets in a key.

**Complexity:** O(L + (N-K)log(N)) worst case where L is the total number of elements in all the sets, N is the size of the first set, and K is the size of the result set.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zincrby/">ZINCRBY</a></strong> - Increments the score of a member in a sorted set.</summary>

**Syntax:** `ZINCRBY key increment member`

**Description:** Increments the score of a member in a sorted set.

**Complexity:** O(log(N)) where N is the number of elements in the sorted set.

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zinter/">ZINTER</a></strong> - Returns the intersect of multiple sorted sets.</summary>

**Syntax:** `ZINTER numkeys key [key ...] [WEIGHTS weight [weight ...]]
  [AGGREGATE <SUM | MIN | MAX>] [WITHSCORES]`

**Description:** Returns the intersect of multiple sorted sets.

**Complexity:** O(N*K)+O(M*log(M)) worst case with N being the smallest input sorted set, K being the number of input sorted sets and M being the number of elements in the resulting sorted set.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zintercard/">ZINTERCARD</a></strong> - Returns the number of members of the intersect of multiple sorted sets.</summary>

**Syntax:** `ZINTERCARD numkeys key [key ...] [LIMIT limit]`

**Description:** Returns the number of members of the intersect of multiple sorted sets.

**Complexity:** O(N*K) worst case with N being the smallest input sorted set, K being the number of input sorted sets.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/zinterstore/">ZINTERSTORE</a></strong> - Stores the intersect of multiple sorted sets in a key.</summary>

**Syntax:** `ZINTERSTORE destination numkeys key [key ...] [WEIGHTS weight
  [weight ...]] [AGGREGATE <SUM | MIN | MAX>]`

**Description:** Stores the intersect of multiple sorted sets in a key.

**Complexity:** O(N*K)+O(M*log(M)) worst case with N being the smallest input sorted set, K being the number of input sorted sets and M being the number of elements in the resulting sorted set.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/zlexcount/">ZLEXCOUNT</a></strong> - Returns the number of members in a sorted set within a lexicographical range.</summary>

**Syntax:** `ZLEXCOUNT key min max`

**Description:** Returns the number of members in a sorted set within a lexicographical range.

**Complexity:** O(log(N)) with N being the number of elements in the sorted set.

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/zmpop/">ZMPOP</a></strong> - Returns the highest- or lowest-scoring members from one or more sorted sets after removing them. Deletes the sorted set if the last member was popped.</summary>

**Syntax:** `ZMPOP numkeys key [key ...] <MIN | MAX> [COUNT count]`

**Description:** Returns the highest- or lowest-scoring members from one or more sorted sets after removing them. Deletes the sorted set if the last member was popped.

**Complexity:** O(K) + O(M*log(N)) where K is the number of provided keys, N being the number of elements in the sorted set, and M being the number of elements popped.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/zmscore/">ZMSCORE</a></strong> - Returns the score of one or more members in a sorted set.</summary>

**Syntax:** `ZMSCORE key member [member ...]`

**Description:** Returns the score of one or more members in a sorted set.

**Complexity:** O(N) where N is the number of members being requested.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zpopmax/">ZPOPMAX</a></strong> - Returns the highest-scoring members from a sorted set after removing them. Deletes the sorted set if the last member was popped.</summary>

**Syntax:** `ZPOPMAX key [count]`

**Description:** Returns the highest-scoring members from a sorted set after removing them. Deletes the sorted set if the last member was popped.

**Complexity:** O(log(N)*M) with N being the number of elements in the sorted set, and M being the number of elements popped.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/zpopmin/">ZPOPMIN</a></strong> - Returns the lowest-scoring members from a sorted set after removing them. Deletes the sorted set if the last member was popped.</summary>

**Syntax:** `ZPOPMIN key [count]`

**Description:** Returns the lowest-scoring members from a sorted set after removing them. Deletes the sorted set if the last member was popped.

**Complexity:** O(log(N)*M) with N being the number of elements in the sorted set, and M being the number of elements popped.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/zrandmember/">ZRANDMEMBER</a></strong> - Returns one or more random members from a sorted set.</summary>

**Syntax:** `ZRANDMEMBER key [count [WITHSCORES]]`

**Description:** Returns one or more random members from a sorted set.

**Complexity:** O(N) where N is the number of members returned

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zrange/">ZRANGE</a></strong> - Returns members in a sorted set within a range of indexes.</summary>

**Syntax:** `ZRANGE key start stop [BYSCORE | BYLEX] [REV] [LIMIT offset count]
  [WITHSCORES]`

**Description:** Returns members in a sorted set within a range of indexes.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements returned.

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zrangebylex/">ZRANGEBYLEX</a></strong> - Returns members in a sorted set within a lexicographical range.</summary>

**Syntax:** `ZRANGEBYLEX key min max [LIMIT offset count]`

**Description:** Returns members in a sorted set within a lexicographical range.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements being returned. If M is constant (e.g. always asking for the first 10 elements with LIMIT), you can consider it O(log(N)).

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/zrangebyscore/">ZRANGEBYSCORE</a></strong> - Returns members in a sorted set within a range of scores.</summary>

**Syntax:** `ZRANGEBYSCORE key min max [WITHSCORES] [LIMIT offset count]`

**Description:** Returns members in a sorted set within a range of scores.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements being returned. If M is constant (e.g. always asking for the first 10 elements with LIMIT), you can consider it O(log(N)).

**Since:** 1.0.5

</details>

<details>
<summary><strong><a href="/commands/zrangestore/">ZRANGESTORE</a></strong> - Stores a range of members from sorted set in a key.</summary>

**Syntax:** `ZRANGESTORE dst src min max [BYSCORE | BYLEX] [REV] [LIMIT offset
  count]`

**Description:** Stores a range of members from sorted set in a key.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements stored into the destination key.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zrank/">ZRANK</a></strong> - Returns the index of a member in a sorted set ordered by ascending scores.</summary>

**Syntax:** `ZRANK key member [WITHSCORE]`

**Description:** Returns the index of a member in a sorted set ordered by ascending scores.

**Complexity:** O(log(N))

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/zrem/">ZREM</a></strong> - Removes one or more members from a sorted set. Deletes the sorted set if all members were removed.</summary>

**Syntax:** `ZREM key member [member ...]`

**Description:** Removes one or more members from a sorted set. Deletes the sorted set if all members were removed.

**Complexity:** O(M*log(N)) with N being the number of elements in the sorted set and M the number of elements to be removed.

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zremrangebylex/">ZREMRANGEBYLEX</a></strong> - Removes members in a sorted set within a lexicographical range. Deletes the sorted set if all members were removed.</summary>

**Syntax:** `ZREMRANGEBYLEX key min max`

**Description:** Removes members in a sorted set within a lexicographical range. Deletes the sorted set if all members were removed.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements removed by the operation.

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/zremrangebyrank/">ZREMRANGEBYRANK</a></strong> - Removes members in a sorted set within a range of indexes. Deletes the sorted set if all members were removed.</summary>

**Syntax:** `ZREMRANGEBYRANK key start stop`

**Description:** Removes members in a sorted set within a range of indexes. Deletes the sorted set if all members were removed.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements removed by the operation.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/zremrangebyscore/">ZREMRANGEBYSCORE</a></strong> - Removes members in a sorted set within a range of scores. Deletes the sorted set if all members were removed.</summary>

**Syntax:** `ZREMRANGEBYSCORE key min max`

**Description:** Removes members in a sorted set within a range of scores. Deletes the sorted set if all members were removed.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements removed by the operation.

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zrevrange/">ZREVRANGE</a></strong> - Returns members in a sorted set within a range of indexes in reverse order.</summary>

**Syntax:** `ZREVRANGE key start stop [WITHSCORES]`

**Description:** Returns members in a sorted set within a range of indexes in reverse order.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements returned.

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zrevrangebylex/">ZREVRANGEBYLEX</a></strong> - Returns members in a sorted set within a lexicographical range in reverse order.</summary>

**Syntax:** `ZREVRANGEBYLEX key max min [LIMIT offset count]`

**Description:** Returns members in a sorted set within a lexicographical range in reverse order.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements being returned. If M is constant (e.g. always asking for the first 10 elements with LIMIT), you can consider it O(log(N)).

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/zrevrangebyscore/">ZREVRANGEBYSCORE</a></strong> - Returns members in a sorted set within a range of scores in reverse order.</summary>

**Syntax:** `ZREVRANGEBYSCORE key max min [WITHSCORES] [LIMIT offset count]`

**Description:** Returns members in a sorted set within a range of scores in reverse order.

**Complexity:** O(log(N)+M) with N being the number of elements in the sorted set and M the number of elements being returned. If M is constant (e.g. always asking for the first 10 elements with LIMIT), you can consider it O(log(N)).

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/zrevrank/">ZREVRANK</a></strong> - Returns the index of a member in a sorted set ordered by descending scores.</summary>

**Syntax:** `ZREVRANK key member [WITHSCORE]`

**Description:** Returns the index of a member in a sorted set ordered by descending scores.

**Complexity:** O(log(N))

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/zscan/">ZSCAN</a></strong> - Iterates over members and scores of a sorted set.</summary>

**Syntax:** `ZSCAN key cursor [MATCH pattern] [COUNT count]`

**Description:** Iterates over members and scores of a sorted set.

**Complexity:** O(1) for every call. O(N) for a complete iteration, including enough command calls for the cursor to return back to 0. N is the number of elements inside the collection.

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/zscore/">ZSCORE</a></strong> - Returns the score of a member in a sorted set.</summary>

**Syntax:** `ZSCORE key member`

**Description:** Returns the score of a member in a sorted set.

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/zunion/">ZUNION</a></strong> - Returns the union of multiple sorted sets.</summary>

**Syntax:** `ZUNION numkeys key [key ...] [WEIGHTS weight [weight ...]]
  [AGGREGATE <SUM | MIN | MAX>] [WITHSCORES]`

**Description:** Returns the union of multiple sorted sets.

**Complexity:** O(N)+O(M*log(M)) with N being the sum of the sizes of the input sorted sets, and M being the number of elements in the resulting sorted set.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/zunionstore/">ZUNIONSTORE</a></strong> - Stores the union of multiple sorted sets in a key.</summary>

**Syntax:** `ZUNIONSTORE destination numkeys key [key ...] [WEIGHTS weight
  [weight ...]] [AGGREGATE <SUM | MIN | MAX>]`

**Description:** Stores the union of multiple sorted sets in a key.

**Complexity:** O(N)+O(M log(M)) with N being the sum of the sizes of the input sorted sets, and M being the number of elements in the resulting sorted set.

**Since:** 2.0.0

</details>


## Stream commands

Stream commands operate on append-only log data structures.

<details>
<summary><strong><a href="/commands/xack/">XACK</a></strong> - Returns the number of messages that were successfully acknowledged by the consumer group member of a stream.</summary>

**Syntax:** `XACK key group id [id ...]`

**Description:** Returns the number of messages that were successfully acknowledged by the consumer group member of a stream.

**Complexity:** O(1) for each message ID processed.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xadd/">XADD</a></strong> - Appends a new message to a stream. Creates the key if it doesn't exist.</summary>

**Syntax:** `XADD key [NOMKSTREAM] [KEEPREF | DELREF | ACKED] [<MAXLEN | MINID>
  [= | ~] threshold [LIMIT count]] <* | id> field value [field value
  ...]`

**Description:** Appends a new message to a stream. Creates the key if it doesn't exist.

**Complexity:** O(1) when adding a new entry, O(N) when trimming where N being the number of entries evicted.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xautoclaim/">XAUTOCLAIM</a></strong> - Changes, or acquires, ownership of messages in a consumer group, as if the messages were delivered to as consumer group member.</summary>

**Syntax:** `XAUTOCLAIM key group consumer min-idle-time start [COUNT count]
  [JUSTID]`

**Description:** Changes, or acquires, ownership of messages in a consumer group, as if the messages were delivered to as consumer group member.

**Complexity:** O(1) if COUNT is small.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/xclaim/">XCLAIM</a></strong> - Changes, or acquires, ownership of a message in a consumer group, as if the message was delivered a consumer group member.</summary>

**Syntax:** `XCLAIM key group consumer min-idle-time id [id ...] [IDLE ms]
  [TIME unix-time-milliseconds] [RETRYCOUNT count] [FORCE] [JUSTID]
  [LASTID lastid]`

**Description:** Changes, or acquires, ownership of a message in a consumer group, as if the message was delivered a consumer group member.

**Complexity:** O(log N) with N being the number of messages in the PEL of the consumer group.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xdel/">XDEL</a></strong> - Returns the number of messages after removing them from a stream.</summary>

**Syntax:** `XDEL key id [id ...]`

**Description:** Returns the number of messages after removing them from a stream.

**Complexity:** O(1) for each single item to delete in the stream, regardless of the stream size.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xgroup-create/">XGROUP CREATE</a></strong> - Creates a consumer group.</summary>

**Syntax:** `XGROUP CREATE key group <id | $> [MKSTREAM]
  [ENTRIESREAD entries-read]`

**Description:** Creates a consumer group.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xgroup-createconsumer/">XGROUP CREATECONSUMER</a></strong> - Creates a consumer in a consumer group.</summary>

**Syntax:** `XGROUP CREATECONSUMER key group consumer`

**Description:** Creates a consumer in a consumer group.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/xgroup-delconsumer/">XGROUP DELCONSUMER</a></strong> - Deletes a consumer from a consumer group.</summary>

**Syntax:** `XGROUP DELCONSUMER key group consumer`

**Description:** Deletes a consumer from a consumer group.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xgroup-destroy/">XGROUP DESTROY</a></strong> - Destroys a consumer group.</summary>

**Syntax:** `XGROUP DESTROY key group`

**Description:** Destroys a consumer group.

**Complexity:** O(N) where N is the number of entries in the group's pending entries list (PEL).

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xgroup-setid/">XGROUP SETID</a></strong> - Sets the last-delivered ID of a consumer group.</summary>

**Syntax:** `XGROUP SETID key group <id | $> [ENTRIESREAD entries-read]`

**Description:** Sets the last-delivered ID of a consumer group.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xinfo-consumers/">XINFO CONSUMERS</a></strong> - Returns a list of the consumers in a consumer group.</summary>

**Syntax:** `XINFO CONSUMERS key group`

**Description:** Returns a list of the consumers in a consumer group.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xinfo-groups/">XINFO GROUPS</a></strong> - Returns a list of the consumer groups of a stream.</summary>

**Syntax:** `XINFO GROUPS key`

**Description:** Returns a list of the consumer groups of a stream.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xinfo-stream/">XINFO STREAM</a></strong> - Returns information about a stream.</summary>

**Syntax:** `XINFO STREAM key [FULL [COUNT count]]`

**Description:** Returns information about a stream.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xlen/">XLEN</a></strong> - Return the number of messages in a stream.</summary>

**Syntax:** `XLEN key`

**Description:** Return the number of messages in a stream.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xpending/">XPENDING</a></strong> - Returns the information and entries from a stream consumer group's pending entries list.</summary>

**Syntax:** `XPENDING key group [[IDLE min-idle-time] start end count [consumer]]`

**Description:** Returns the information and entries from a stream consumer group's pending entries list.

**Complexity:** O(N) with N being the number of elements returned, so asking for a small fixed number of entries per call is O(1). O(M), where M is the total number of entries scanned when used with the IDLE filter. When the command returns just the summary and the list of consumers is small, it runs in O(1) time; otherwise, an additional O(N) time for iterating every consumer.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xrange/">XRANGE</a></strong> - Returns the messages from a stream within a range of IDs.</summary>

**Syntax:** `XRANGE key start end [COUNT count]`

**Description:** Returns the messages from a stream within a range of IDs.

**Complexity:** O(N) with N being the number of elements being returned. If N is constant (e.g. always asking for the first 10 elements with COUNT), you can consider it O(1).

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xread/">XREAD</a></strong> - Returns messages from multiple streams with IDs greater than the ones requested. Blocks until a message is available otherwise.</summary>

**Syntax:** `XREAD [COUNT count] [BLOCK milliseconds] STREAMS key [key ...] id
  [id ...]`

**Description:** Returns messages from multiple streams with IDs greater than the ones requested. Blocks until a message is available otherwise.

**Complexity:** 

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xreadgroup/">XREADGROUP</a></strong> - Returns new or historical messages from a stream for a consumer in a group. Blocks until a message is available otherwise.</summary>

**Syntax:** `XREADGROUP GROUP group consumer [COUNT count] [BLOCK milliseconds]
  [CLAIM min-idle-time] [NOACK] STREAMS key [key ...] id [id ...]`

**Description:** Returns new or historical messages from a stream for a consumer in a group. Blocks until a message is available otherwise.

**Complexity:** For each stream mentioned: O(M) with M being the number of elements returned. If M is constant (e.g. always asking for the first 10 elements with COUNT), you can consider it O(1). On the other side when XREADGROUP blocks, XADD will pay the O(N) time in order to serve the N clients blocked on the stream getting new data.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xrevrange/">XREVRANGE</a></strong> - Returns the messages from a stream within a range of IDs in reverse order.</summary>

**Syntax:** `XREVRANGE key end start [COUNT count]`

**Description:** Returns the messages from a stream within a range of IDs in reverse order.

**Complexity:** O(N) with N being the number of elements returned. If N is constant (e.g. always asking for the first 10 elements with COUNT), you can consider it O(1).

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xsetid/">XSETID</a></strong> - An internal command for replicating stream values.</summary>

**Syntax:** `XSETID key last-id [ENTRIESADDED entries-added]
  [MAXDELETEDID max-deleted-id]`

**Description:** An internal command for replicating stream values.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/xtrim/">XTRIM</a></strong> - Deletes messages from the beginning of a stream.</summary>

**Syntax:** `XTRIM key <MAXLEN | MINID> [= | ~] threshold [LIMIT count] [KEEPREF
  | DELREF | ACKED]`

**Description:** Deletes messages from the beginning of a stream.

**Complexity:** O(N), with N being the number of evicted entries. Constant times are very small however, since entries are organized in macro nodes containing multiple entries that can be released with a single deallocation.

**Since:** 5.0.0

</details>


## Bitmap commands

Bitmap commands operate on strings as arrays of bits.

<details>
<summary><strong><a href="/commands/bitcount/">BITCOUNT</a></strong> - Counts the number of set bits (population counting) in a string.</summary>

**Syntax:** `BITCOUNT key [start end [BYTE | BIT]]`

**Description:** Counts the number of set bits (population counting) in a string.

**Complexity:** O(N)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/bitfield/">BITFIELD</a></strong> - Performs arbitrary bitfield integer operations on strings.</summary>

**Syntax:** `BITFIELD key [GET encoding offset | [OVERFLOW <WRAP | SAT | FAIL>]
  <SET encoding offset value | INCRBY encoding offset increment>
  [GET encoding offset | [OVERFLOW <WRAP | SAT | FAIL>]
  <SET encoding offset value | INCRBY encoding offset increment>
  ...]]`

**Description:** Performs arbitrary bitfield integer operations on strings.

**Complexity:** O(1) for each subcommand specified

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/bitfield_ro/">BITFIELD_RO</a></strong> - Performs arbitrary read-only bitfield integer operations on strings.</summary>

**Syntax:** `BITFIELD RO key [GET encoding offset [GET encoding offset ...]]`

**Description:** Performs arbitrary read-only bitfield integer operations on strings.

**Complexity:** O(1) for each subcommand specified

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/bitop/">BITOP</a></strong> - Performs bitwise operations on multiple strings, and stores the result.</summary>

**Syntax:** `BITOP <AND | OR | XOR | NOT | DIFF | DIFF1 | ANDOR | ONE> destkey key [key ...]`

**Description:** Performs bitwise operations on multiple strings, and stores the result.

**Complexity:** O(N)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/bitpos/">BITPOS</a></strong> - Finds the first set (1) or clear (0) bit in a string.</summary>

**Syntax:** `BITPOS key bit [start [end [BYTE | BIT]]]`

**Description:** Finds the first set (1) or clear (0) bit in a string.

**Complexity:** O(N)

**Since:** 2.8.7

</details>

<details>
<summary><strong><a href="/commands/getbit/">GETBIT</a></strong> - Returns a bit value by offset.</summary>

**Syntax:** `GETBIT key offset`

**Description:** Returns a bit value by offset.

**Complexity:** O(1)

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/setbit/">SETBIT</a></strong> - Sets or clears the bit at offset of the string value. Creates the key if it doesn't exist.</summary>

**Syntax:** `SETBIT key offset value`

**Description:** Sets or clears the bit at offset of the string value. Creates the key if it doesn't exist.

**Complexity:** O(1)

**Since:** 2.2.0

</details>


## HyperLogLog commands

HyperLogLog commands provide probabilistic cardinality estimation.

<details>
<summary><strong><a href="/commands/pfadd/">PFADD</a></strong> - Adds elements to a HyperLogLog key. Creates the key if it doesn't exist.</summary>

**Syntax:** `PFADD key [element [element ...]]`

**Description:** Adds elements to a HyperLogLog key. Creates the key if it doesn't exist.

**Complexity:** O(1) to add every element.

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/pfcount/">PFCOUNT</a></strong> - Returns the approximated cardinality of the set(s) observed by the HyperLogLog key(s).</summary>

**Syntax:** `PFCOUNT key [key ...]`

**Description:** Returns the approximated cardinality of the set(s) observed by the HyperLogLog key(s).

**Complexity:** O(1) with a very small average constant time when called with a single key. O(N) with N being the number of keys, and much bigger constant times, when called with multiple keys.

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/pfdebug/">PFDEBUG</a></strong> - Internal commands for debugging HyperLogLog values.</summary>

**Syntax:** `PFDEBUG subcommand key`

**Description:** Internal commands for debugging HyperLogLog values.

**Complexity:** N/A

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/pfmerge/">PFMERGE</a></strong> - Merges one or more HyperLogLog values into a single key.</summary>

**Syntax:** `PFMERGE destkey [sourcekey [sourcekey ...]]`

**Description:** Merges one or more HyperLogLog values into a single key.

**Complexity:** O(N) to merge N HyperLogLogs, but with high constant times.

**Since:** 2.8.9

</details>

<details>
<summary><strong><a href="/commands/pfselftest/">PFSELFTEST</a></strong> - An internal command for testing HyperLogLog values.</summary>

**Syntax:** `PFSELFTEST`

**Description:** An internal command for testing HyperLogLog values.

**Complexity:** N/A

**Since:** 2.8.9

</details>


## Geospatial commands

Geospatial commands operate on geographic coordinates.

<details>
<summary><strong><a href="/commands/geoadd/">GEOADD</a></strong> - Adds one or more members to a geospatial index. The key is created if it doesn't exist.</summary>

**Syntax:** `GEOADD key [NX | XX] [CH] longitude latitude member [longitude
  latitude member ...]`

**Description:** Adds one or more members to a geospatial index. The key is created if it doesn't exist.

**Complexity:** O(log(N)) for each item added, where N is the number of elements in the sorted set.

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/geodist/">GEODIST</a></strong> - Returns the distance between two members of a geospatial index.</summary>

**Syntax:** `GEODIST key member1 member2 [M | KM | FT | MI]`

**Description:** Returns the distance between two members of a geospatial index.

**Complexity:** O(1)

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/geohash/">GEOHASH</a></strong> - Returns members from a geospatial index as geohash strings.</summary>

**Syntax:** `GEOHASH key [member [member ...]]`

**Description:** Returns members from a geospatial index as geohash strings.

**Complexity:** O(1) for each member requested.

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/geopos/">GEOPOS</a></strong> - Returns the longitude and latitude of members from a geospatial index.</summary>

**Syntax:** `GEOPOS key [member [member ...]]`

**Description:** Returns the longitude and latitude of members from a geospatial index.

**Complexity:** O(1) for each member requested.

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/georadius/">GEORADIUS</a></strong> - Queries a geospatial index for members within a distance from a coordinate, optionally stores the result.</summary>

**Syntax:** `GEORADIUS key longitude latitude radius <M | KM | FT | MI>
  [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC | DESC]
  [STORE key | STOREDIST key]`

**Description:** Queries a geospatial index for members within a distance from a coordinate, optionally stores the result.

**Complexity:** O(N+log(M)) where N is the number of elements inside the bounding box of the circular area delimited by center and radius and M is the number of items inside the index.

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/georadiusbymember/">GEORADIUSBYMEMBER</a></strong> - Queries a geospatial index for members within a distance from a member, optionally stores the result.</summary>

**Syntax:** `GEORADIUSBYMEMBER key member radius <M | KM | FT | MI> [WITHCOORD]
  [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC | DESC] [STORE key
  | STOREDIST key]`

**Description:** Queries a geospatial index for members within a distance from a member, optionally stores the result.

**Complexity:** O(N+log(M)) where N is the number of elements inside the bounding box of the circular area delimited by center and radius and M is the number of items inside the index.

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/georadiusbymember_ro/">GEORADIUSBYMEMBER_RO</a></strong> - Returns members from a geospatial index that are within a distance from a member.</summary>

**Syntax:** `GEORADIUSBYMEMBER RO key member radius <M | KM | FT | MI>
  [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC | DESC]`

**Description:** Returns members from a geospatial index that are within a distance from a member.

**Complexity:** O(N+log(M)) where N is the number of elements inside the bounding box of the circular area delimited by center and radius and M is the number of items inside the index.

**Since:** 3.2.10

</details>

<details>
<summary><strong><a href="/commands/georadius_ro/">GEORADIUS_RO</a></strong> - Returns members from a geospatial index that are within a distance from a coordinate.</summary>

**Syntax:** `GEORADIUS RO key longitude latitude radius <M | KM | FT | MI>
  [WITHCOORD] [WITHDIST] [WITHHASH] [COUNT count [ANY]] [ASC | DESC]`

**Description:** Returns members from a geospatial index that are within a distance from a coordinate.

**Complexity:** O(N+log(M)) where N is the number of elements inside the bounding box of the circular area delimited by center and radius and M is the number of items inside the index.

**Since:** 3.2.10

</details>

<details>
<summary><strong><a href="/commands/geosearch/">GEOSEARCH</a></strong> - Queries a geospatial index for members inside an area of a box or a circle.</summary>

**Syntax:** `GEOSEARCH key <FROMMEMBER member | FROMLONLAT longitude latitude>
  <BYRADIUS radius <M | KM | FT | MI> | BYBOX width height <M | KM |
  FT | MI>> [ASC | DESC] [COUNT count [ANY]] [WITHCOORD] [WITHDIST]
  [WITHHASH]`

**Description:** Queries a geospatial index for members inside an area of a box or a circle.

**Complexity:** O(N+log(M)) where N is the number of elements in the grid-aligned bounding box area around the shape provided as the filter and M is the number of items inside the shape

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/geosearchstore/">GEOSEARCHSTORE</a></strong> - Queries a geospatial index for members inside an area of a box or a circle, optionally stores the result.</summary>

**Syntax:** `GEOSEARCHSTORE destination source <FROMMEMBER member |
  FROMLONLAT longitude latitude> <BYRADIUS radius <M | KM | FT | MI>
  | BYBOX width height <M | KM | FT | MI>> [ASC | DESC] [COUNT count
  [ANY]] [STOREDIST]`

**Description:** Queries a geospatial index for members inside an area of a box or a circle, optionally stores the result.

**Complexity:** O(N+log(M)) where N is the number of elements in the grid-aligned bounding box area around the shape provided as the filter and M is the number of items inside the shape

**Since:** 6.2.0

</details>


## JSON commands

JSON commands operate on JSON data structures.

<details>
<summary><strong><a href="/commands/json.arrappend/">JSON.ARRAPPEND</a></strong> - Append one or more JSON values into the array at path after the last element in it.</summary>

**Syntax:** `JSON.ARRAPPEND key path value [value ...]`

**Description:** Append one or more JSON values into the array at path after the last element in it.

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.arrindex/">JSON.ARRINDEX</a></strong> - Returns the index of the first occurrence of a JSON scalar value in the array at path</summary>

**Syntax:** `JSON.ARRINDEX key path value [start [stop]]`

**Description:** Returns the index of the first occurrence of a JSON scalar value in the array at path

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the array, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.arrinsert/">JSON.ARRINSERT</a></strong> - Inserts the JSON scalar(s) value at the specified index in the array at path</summary>

**Syntax:** `JSON.ARRINSERT key path index value [value ...]`

**Description:** Inserts the JSON scalar(s) value at the specified index in the array at path

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the array, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.arrlen/">JSON.ARRLEN</a></strong> - Returns the length of the array at path</summary>

**Syntax:** `JSON.ARRLEN key [path]`

**Description:** Returns the length of the array at path

**Complexity:** O(1) where path is evaluated to a single value, O(N) where path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.arrpop/">JSON.ARRPOP</a></strong> - Removes and returns the element at the specified index in the array at path</summary>

**Syntax:** `JSON.ARRPOP key [path [index]]`

**Description:** Removes and returns the element at the specified index in the array at path

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the array and the specified index is not the last element, O(1) when path is evaluated to a single value and the specified index is the last element, or O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.arrtrim/">JSON.ARRTRIM</a></strong> - Trims the array at path to contain only the specified inclusive range of indices from start to stop</summary>

**Syntax:** `JSON.ARRTRIM key path start stop`

**Description:** Trims the array at path to contain only the specified inclusive range of indices from start to stop

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the array, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.clear/">JSON.CLEAR</a></strong> - Clears all values from an array or an object and sets numeric values to `0`</summary>

**Syntax:** `JSON.CLEAR key [path]`

**Description:** Clears all values from an array or an object and sets numeric values to `0`

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the values, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/json.debug/">JSON.DEBUG</a></strong> - Debugging container command</summary>

**Syntax:** `JSON.DEBUG`

**Description:** Debugging container command

**Complexity:** N/A

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.debug-memory/">JSON.DEBUG MEMORY</a></strong> - Reports the size in bytes of a key</summary>

**Syntax:** `JSON.DEBUG MEMORY key [path]`

**Description:** Reports the size in bytes of a key

**Complexity:** O(N) when path is evaluated to a single value, where N is the size of the value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.del/">JSON.DEL</a></strong> - Deletes a value</summary>

**Syntax:** `JSON.DEL key [path]`

**Description:** Deletes a value

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the deleted value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.forget/">JSON.FORGET</a></strong> - Deletes a value</summary>

**Syntax:** `JSON.FORGET key [path]`

**Description:** Deletes a value

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the deleted value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.get/">JSON.GET</a></strong> - Gets the value at one or more paths in JSON serialized form</summary>

**Syntax:** `JSON.GET key [INDENT indent] [NEWLINE newline] [SPACE space] [path
  [path ...]]`

**Description:** Gets the value at one or more paths in JSON serialized form

**Complexity:** O(N) when path is evaluated to a single value where N is the size of the value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.merge/">JSON.MERGE</a></strong> - Merges a given JSON value into matching paths. Consequently, JSON values at matching paths are updated, deleted, or expanded with new children</summary>

**Syntax:** `JSON.MERGE key path value`

**Description:** Merges a given JSON value into matching paths. Consequently, JSON values at matching paths are updated, deleted, or expanded with new children

**Complexity:** O(M+N) when path is evaluated to a single value where M is the size of the original value (if it exists) and N is the size of the new value, O(M+N) when path is evaluated to multiple values where M is the size of the key and N is the size of the new value * the number of original values in the key

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/json.mget/">JSON.MGET</a></strong> - Returns the values at a path from one or more keys</summary>

**Syntax:** `JSON.MGET key [key ...] path`

**Description:** Returns the values at a path from one or more keys

**Complexity:** O(M*N) when path is evaluated to a single value where M is the number of keys and N is the size of the value, O(N1+N2+...+Nm) when path is evaluated to multiple values where m is the number of keys and Ni is the size of the i-th key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.mset/">JSON.MSET</a></strong> - Sets or updates the JSON value of one or more keys</summary>

**Syntax:** `JSON.MSET key path value [key path value ...]`

**Description:** Sets or updates the JSON value of one or more keys

**Complexity:** O(K*(M+N)) where k is the number of keys in the command, when path is evaluated to a single value where M is the size of the original value (if it exists) and N is the size of the new value, or O(K*(M+N)) when path is evaluated to multiple values where M is the size of the key and N is the size of the new value * the number of original values in the key

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/json.numincrby/">JSON.NUMINCRBY</a></strong> - Increments the numeric value at path by a value</summary>

**Syntax:** `JSON.NUMINCRBY key path value`

**Description:** Increments the numeric value at path by a value

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.nummultby/">JSON.NUMMULTBY</a></strong> - Multiplies the numeric value at path by a value</summary>

**Syntax:** `JSON.NUMMULTBY key path value`

**Description:** Multiplies the numeric value at path by a value

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.objkeys/">JSON.OBJKEYS</a></strong> - Returns the JSON keys of the object at path</summary>

**Syntax:** `JSON.OBJKEYS key [path]`

**Description:** Returns the JSON keys of the object at path

**Complexity:** O(N) when path is evaluated to a single value, where N is the number of keys in the object, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.objlen/">JSON.OBJLEN</a></strong> - Returns the number of keys of the object at path</summary>

**Syntax:** `JSON.OBJLEN key [path]`

**Description:** Returns the number of keys of the object at path

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.resp/">JSON.RESP</a></strong> - Returns the JSON value at path in Redis Serialization Protocol (RESP)</summary>

**Syntax:** `JSON.RESP key [path]`

**Description:** Returns the JSON value at path in Redis Serialization Protocol (RESP)

**Complexity:** O(N) when path is evaluated to a single value, where N is the size of the value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.set/">JSON.SET</a></strong> - Sets or updates the JSON value at a path</summary>

**Syntax:** `JSON.SET key path value [NX | XX]`

**Description:** Sets or updates the JSON value at a path

**Complexity:** O(M+N) when path is evaluated to a single value where M is the size of the original value (if it exists) and N is the size of the new value, O(M+N) when path is evaluated to multiple values where M is the size of the key and N is the size of the new value * the number of original values in the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.strappend/">JSON.STRAPPEND</a></strong> - Appends a string to a JSON string value at path</summary>

**Syntax:** `JSON.STRAPPEND key [path] value`

**Description:** Appends a string to a JSON string value at path

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.strlen/">JSON.STRLEN</a></strong> - Returns the length of the JSON String at path in key</summary>

**Syntax:** `JSON.STRLEN key [path]`

**Description:** Returns the length of the JSON String at path in key

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/json.toggle/">JSON.TOGGLE</a></strong> - Toggles a boolean value</summary>

**Syntax:** `JSON.TOGGLE key path`

**Description:** Toggles a boolean value

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/json.type/">JSON.TYPE</a></strong> - Returns the type of the JSON value at path</summary>

**Syntax:** `JSON.TYPE key [path]`

**Description:** Returns the type of the JSON value at path

**Complexity:** O(1) when path is evaluated to a single value, O(N) when path is evaluated to multiple values, where N is the size of the key

**Since:** 1.0.0

</details>


## Search commands

Search commands provide full-text search and secondary indexing.

<details>
<summary><strong><a href="/commands/ft.aggregate/">FT.AGGREGATE</a></strong> - Run a search query on an index and perform aggregate transformations on the results</summary>

**Syntax:** `FT.AGGREGATE index query [VERBATIM] [LOAD count field [field ...]]
  [TIMEOUT timeout] [LOAD *] [GROUPBY nargs property [property ...]
  [REDUCE function nargs arg [arg ...] [AS name] [REDUCE function
  nargs arg [arg ...] [AS name] ...]] [GROUPBY nargs property
  [property ...] [REDUCE function nargs arg [arg ...] [AS name]
  [REDUCE function nargs arg [arg ...] [AS name] ...]] ...]]
  [SORTBY nargs [property <ASC | DESC> [property <ASC | DESC> ...]]
  [MAX num]] [APPLY expression AS name [APPLY expression AS name
  ...]] [LIMIT offset num] [FILTER filter] [WITHCURSOR
  [COUNT read size] [MAXIDLE idle time]] [PARAMS nargs name value
  [name value ...]]
  [SCORER scorer]
 [ADDSCORES]
  [DIALECT dialect]`

**Description:** Run a search query on an index and perform aggregate transformations on the results

**Complexity:** O(1)

**Since:** 1.1.0

</details>

<details>
<summary><strong><a href="/commands/ft.aliasadd/">FT.ALIASADD</a></strong> - Adds an alias to the index</summary>

**Syntax:** `FT.ALIASADD alias index`

**Description:** Adds an alias to the index

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.aliasdel/">FT.ALIASDEL</a></strong> - Deletes an alias from the index</summary>

**Syntax:** `FT.ALIASDEL alias`

**Description:** Deletes an alias from the index

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.aliasupdate/">FT.ALIASUPDATE</a></strong> - Adds or updates an alias to the index</summary>

**Syntax:** `FT.ALIASUPDATE alias index`

**Description:** Adds or updates an alias to the index

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.alter/">FT.ALTER</a></strong> - Adds a new field to the index</summary>

**Syntax:** `FT.ALTER index [SKIPINITIALSCAN] SCHEMA ADD field options`

**Description:** Adds a new field to the index

**Complexity:** O(N) where N is the number of keys in the keyspace

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.config-get/">FT.CONFIG GET</a></strong> - Retrieves runtime configuration options</summary>

**Syntax:** `FT.CONFIG GET option`

**Description:** Retrieves runtime configuration options

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.config-set/">FT.CONFIG SET</a></strong> - Sets runtime configuration options</summary>

**Syntax:** `FT.CONFIG SET option value`

**Description:** Sets runtime configuration options

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.create/">FT.CREATE</a></strong> - Creates an index with the given spec</summary>

**Syntax:** `FT.CREATE index [ON <HASH | JSON>] [PREFIX count prefix [prefix
  ...]] [FILTER filter] [LANGUAGE default lang]
  [LANGUAGE FIELD lang attribute] [SCORE default score]
  [SCORE FIELD score attribute] [PAYLOAD FIELD payload attribute]
  [MAXTEXTFIELDS] [TEMPORARY seconds] [NOOFFSETS] [NOHL] [NOFIELDS]
  [NOFREQS] [STOPWORDS count [stopword [stopword ...]]]
  [SKIPINITIALSCAN] SCHEMA field name [AS alias] <TEXT | TAG |
  NUMERIC | GEO | VECTOR> [WITHSUFFIXTRIE] [SORTABLE [UNF]]
  [NOINDEX] [field name [AS alias] <TEXT | TAG | NUMERIC | GEO |
  VECTOR> [WITHSUFFIXTRIE] [SORTABLE [UNF]] [NOINDEX] ...]`

**Description:** Creates an index with the given spec

**Complexity:** O(K) at creation where K is the number of fields, O(N) if scanning the keyspace is triggered, where N is the number of keys in the keyspace

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.cursor-del/">FT.CURSOR DEL</a></strong> - Deletes a cursor</summary>

**Syntax:** `FT.CURSOR DEL index cursor id`

**Description:** Deletes a cursor

**Complexity:** O(1)

**Since:** 1.1.0

</details>

<details>
<summary><strong><a href="/commands/ft.cursor-read/">FT.CURSOR READ</a></strong> - Reads from a cursor</summary>

**Syntax:** `FT.CURSOR READ index cursor id [COUNT read size]`

**Description:** Reads from a cursor

**Complexity:** O(1)

**Since:** 1.1.0

</details>

<details>
<summary><strong><a href="/commands/ft.dictadd/">FT.DICTADD</a></strong> - Adds terms to a dictionary</summary>

**Syntax:** `FT.DICTADD dict term [term ...]`

**Description:** Adds terms to a dictionary

**Complexity:** O(1)

**Since:** 1.4.0

</details>

<details>
<summary><strong><a href="/commands/ft.dictdel/">FT.DICTDEL</a></strong> - Deletes terms from a dictionary</summary>

**Syntax:** `FT.DICTDEL dict term [term ...]`

**Description:** Deletes terms from a dictionary

**Complexity:** O(1)

**Since:** 1.4.0

</details>

<details>
<summary><strong><a href="/commands/ft.dictdump/">FT.DICTDUMP</a></strong> - Dumps all terms in the given dictionary</summary>

**Syntax:** `FT.DICTDUMP dict`

**Description:** Dumps all terms in the given dictionary

**Complexity:** O(N), where N is the size of the dictionary

**Since:** 1.4.0

</details>

<details>
<summary><strong><a href="/commands/ft.dropindex/">FT.DROPINDEX</a></strong> - Deletes the index</summary>

**Syntax:** `FT.DROPINDEX index [DD]`

**Description:** Deletes the index

**Complexity:** O(1) or O(N) if documents are deleted, where N is the number of keys in the keyspace

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.explain/">FT.EXPLAIN</a></strong> - Returns the execution plan for a complex query</summary>

**Syntax:** `FT.EXPLAIN index query [DIALECT dialect]`

**Description:** Returns the execution plan for a complex query

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.explaincli/">FT.EXPLAINCLI</a></strong> - Returns the execution plan for a complex query</summary>

**Syntax:** `FT.EXPLAINCLI index query [DIALECT dialect]`

**Description:** Returns the execution plan for a complex query

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.info/">FT.INFO</a></strong> - Returns information and statistics on the index</summary>

**Syntax:** `FT.INFO index`

**Description:** Returns information and statistics on the index

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.profile/">FT.PROFILE</a></strong> - Performs a `FT.SEARCH` or `FT.AGGREGATE` command and collects performance information</summary>

**Syntax:** `FT.PROFILE index <SEARCH | AGGREGATE> [LIMITED] QUERY query`

**Description:** Performs a `FT.SEARCH` or `FT.AGGREGATE` command and collects performance information

**Complexity:** O(N)

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/ft.search/">FT.SEARCH</a></strong> - Searches the index with a textual query, returning either documents or just ids</summary>

**Syntax:** `FT.SEARCH index query [NOCONTENT] [VERBATIM] [NOSTOPWORDS]
  [WITHSCORES] [WITHPAYLOADS] [WITHSORTKEYS] [FILTER numeric field
  min max [FILTER numeric field min max ...]] [GEOFILTER geo field
  lon lat radius <m | km | mi | ft> [GEOFILTER geo field lon lat
  radius <m | km | mi | ft> ...]] [INKEYS count key [key ...]]
  [INFIELDS count field [field ...]] [RETURN count identifier
  [AS property] [identifier [AS property] ...]] [SUMMARIZE
  [FIELDS count field [field ...]] [FRAGS num] [LEN fragsize]
  [SEPARATOR separator]] [HIGHLIGHT [FIELDS count field [field ...]]
  [TAGS open close]] [SLOP slop] [TIMEOUT timeout] [INORDER]
  [LANGUAGE language] [EXPANDER expander] [SCORER scorer]
  [EXPLAINSCORE] [PAYLOAD payload] [SORTBY sortby [ASC | DESC]]
  [LIMIT offset num] [PARAMS nargs name value [name value ...]]
  [DIALECT dialect]`

**Description:** Searches the index with a textual query, returning either documents or just ids

**Complexity:** O(N)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft.spellcheck/">FT.SPELLCHECK</a></strong> - Performs spelling correction on a query, returning suggestions for misspelled terms</summary>

**Syntax:** `FT.SPELLCHECK index query [DISTANCE distance] [TERMS <INCLUDE |
  EXCLUDE> dictionary [terms [terms ...]]] [DIALECT dialect]`

**Description:** Performs spelling correction on a query, returning suggestions for misspelled terms

**Complexity:** O(1)

**Since:** 1.4.0

</details>

<details>
<summary><strong><a href="/commands/ft.syndump/">FT.SYNDUMP</a></strong> - Dumps the contents of a synonym group</summary>

**Syntax:** `FT.SYNDUMP index`

**Description:** Dumps the contents of a synonym group

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/ft.synupdate/">FT.SYNUPDATE</a></strong> - Creates or updates a synonym group with additional terms</summary>

**Syntax:** `FT.SYNUPDATE index synonym group id [SKIPINITIALSCAN] term [term
  ...]`

**Description:** Creates or updates a synonym group with additional terms

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/ft.tagvals/">FT.TAGVALS</a></strong> - Returns the distinct tags indexed in a Tag field</summary>

**Syntax:** `FT.TAGVALS index field name`

**Description:** Returns the distinct tags indexed in a Tag field

**Complexity:** O(N)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ft._list/">FT._LIST</a></strong> - Returns a list of all existing indexes</summary>

**Syntax:** `FT. LIST`

**Description:** Returns a list of all existing indexes

**Complexity:** O(1)

**Since:** 2.0.0

</details>


## Time series commands

Time series commands operate on time-series data.

<details>
<summary><strong><a href="/commands/ts.add/">TS.ADD</a></strong> - Append a sample to a time series</summary>

**Syntax:** `TS.ADD key timestamp value [RETENTION retentionPeriod]
  [ENCODING <COMPRESSED | UNCOMPRESSED>] [CHUNK SIZE size]
  [DUPLICATE POLICY policy] 
  [ON DUPLICATE <BLOCK | FIRST | LAST | MIN | MAX | SUM>]
  [IGNORE ignoreMaxTimediff ignoreMaxValDiff]
  [LABELS [label value ...]]`

**Description:** Append a sample to a time series

**Complexity:** O(M) when M is the amount of compaction rules or O(1) with no compaction

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.alter/">TS.ALTER</a></strong> - Update the retention, chunk size, duplicate policy, and labels of an existing time series</summary>

**Syntax:** `TS.ALTER key [RETENTION retentionPeriod] [CHUNK SIZE size]
  [DUPLICATE POLICY <BLOCK | FIRST | LAST | MIN | MAX | SUM>]
  [IGNORE ignoreMaxTimediff ignoreMaxValDiff] 
  [LABELS [label value ...]]`

**Description:** Update the retention, chunk size, duplicate policy, and labels of an existing time series

**Complexity:** O(N) where N is the number of labels requested to update

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.create/">TS.CREATE</a></strong> - Create a new time series</summary>

**Syntax:** `TS.CREATE key [RETENTION retentionPeriod] [ENCODING <COMPRESSED |
  UNCOMPRESSED>] [CHUNK SIZE size] [DUPLICATE POLICY <BLOCK | FIRST |
  LAST | MIN | MAX | SUM>]
  [IGNORE ignoreMaxTimediff ignoreMaxValDiff]
  [LABELS [label value ...]]`

**Description:** Create a new time series

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.createrule/">TS.CREATERULE</a></strong> - Create a compaction rule</summary>

**Syntax:** `TS.CREATERULE sourceKey destKey AGGREGATION <AVG | FIRST | LAST |
  MIN | MAX | SUM | RANGE | COUNT | STD.P | STD.S | VAR.P | VAR.S |
  TWA> bucketDuration [alignTimestamp]`

**Description:** Create a compaction rule

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.decrby/">TS.DECRBY</a></strong> - Decrease the value of the sample with the maximum existing timestamp, or create a new sample with a value equal to the value of the sample with the maximum existing timestamp with a given decrement</summary>

**Syntax:** `TS.DECRBY key value [TIMESTAMP timestamp]
  [RETENTION retentionPeriod] [ENCODING <COMPRESSED|UNCOMPRESSED>] [CHUNK SIZE size]
 [DUPLICATE POLICY policy] [LABELS [label value ...]]`

**Description:** Decrease the value of the sample with the maximum existing timestamp, or create a new sample with a value equal to the value of the sample with the maximum existing timestamp with a given decrement

**Complexity:** O(M) when M is the amount of compaction rules or O(1) with no compaction

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.del/">TS.DEL</a></strong> - Delete all samples between two timestamps for a given time series</summary>

**Syntax:** `TS.DEL key from timestamp to timestamp`

**Description:** Delete all samples between two timestamps for a given time series

**Complexity:** O(N) where N is the number of data points that will be removed

**Since:** 1.6.0

</details>

<details>
<summary><strong><a href="/commands/ts.deleterule/">TS.DELETERULE</a></strong> - Delete a compaction rule</summary>

**Syntax:** `TS.DELETERULE sourceKey destKey`

**Description:** Delete a compaction rule

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.get/">TS.GET</a></strong> - Get the sample with the highest timestamp from a given time series</summary>

**Syntax:** `TS.GET key [LATEST]`

**Description:** Get the sample with the highest timestamp from a given time series

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.incrby/">TS.INCRBY</a></strong> - Increase the value of the sample with the maximum existing timestamp, or create a new sample with a value equal to the value of the sample with the maximum existing timestamp with a given increment</summary>

**Syntax:** `TS.INCRBY key value [TIMESTAMP timestamp]
  [RETENTION retentionPeriod] [ENCODING <COMPRESSED|UNCOMPRESSED>] [CHUNK SIZE size]
 [DUPLICATE POLICY policy] [LABELS [label value ...]]`

**Description:** Increase the value of the sample with the maximum existing timestamp, or create a new sample with a value equal to the value of the sample with the maximum existing timestamp with a given increment

**Complexity:** O(M) when M is the amount of compaction rules or O(1) with no compaction

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.info/">TS.INFO</a></strong> - Returns information and statistics for a time series</summary>

**Syntax:** `TS.INFO key [DEBUG]`

**Description:** Returns information and statistics for a time series

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.madd/">TS.MADD</a></strong> - Append new samples to one or more time series</summary>

**Syntax:** `TS.MADD key timestamp value [key timestamp value ...]`

**Description:** Append new samples to one or more time series

**Complexity:** O(N*M) when N is the amount of series updated and M is the amount of compaction rules or O(N) with no compaction

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.mget/">TS.MGET</a></strong> - Get the sample with the highest timestamp from each time series matching a specific filter</summary>

**Syntax:** `TS.MGET [LATEST] [WITHLABELS | <SELECTED LABELS label1 [label1 ...]>]
  FILTER <l=v | l!=v | l= | l!= | l=(v1,v2,...) | l!=(v1,v2,...)
  [l=v | l!=v | l= | l!= | l=(v1,v2,...) | l!=(v1,v2,...) ...]>`

**Description:** Get the sample with the highest timestamp from each time series matching a specific filter

**Complexity:** O(n) where n is the number of time-series that match the filters

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.mrange/">TS.MRANGE</a></strong> - Query a range across multiple time series by filters in forward direction</summary>

**Syntax:** `TS.MRANGE fromTimestamp toTimestamp [LATEST] [FILTER BY TS Timestamp
  [Timestamp ...]] [FILTER BY VALUE min max] [WITHLABELS |
  <SELECTED LABELS label1 [label1 ...]>] [COUNT count] [[ALIGN value]
  AGGREGATION <AVG | FIRST | LAST | MIN | MAX | SUM | RANGE | COUNT
  | STD.P | STD.S | VAR.P | VAR.S | TWA> bucketDuration
  [BUCKETTIMESTAMP] [EMPTY]] FILTER <l=v | l!=v | l= | l!= |
  l=(v1,v2,...) | l!=(v1,v2,...) [l=v | l!=v | l= | l!= |
  l=(v1,v2,...) | l!=(v1,v2,...) ...]> [GROUPBY label REDUCE
  reducer]`

**Description:** Query a range across multiple time series by filters in forward direction

**Complexity:** O(n/m+k) where n = Number of data points, m = Chunk size (data points per chunk), k = Number of data points that are in the requested ranges

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.mrevrange/">TS.MREVRANGE</a></strong> - Query a range across multiple time-series by filters in reverse direction</summary>

**Syntax:** `TS.MREVRANGE fromTimestamp toTimestamp [LATEST]
  [FILTER BY TS Timestamp [Timestamp ...]] [FILTER BY VALUE min max]
  [WITHLABELS | <SELECTED LABELS label1 [label1 ...]>] [COUNT count]
  [[ALIGN value] AGGREGATION <AVG | FIRST | LAST | MIN | MAX | SUM |
  RANGE | COUNT | STD.P | STD.S | VAR.P | VAR.S | TWA>
  bucketDuration [BUCKETTIMESTAMP] [EMPTY]] FILTER <l=v | l!=v | l=
  | l!= | l=(v1,v2,...) | l!=(v1,v2,...) [l=v | l!=v | l= | l!= |
  l=(v1,v2,...) | l!=(v1,v2,...) ...]> [GROUPBY label REDUCE
  reducer]`

**Description:** Query a range across multiple time-series by filters in reverse direction

**Complexity:** O(n/m+k) where n = Number of data points, m = Chunk size (data points per chunk), k = Number of data points that are in the requested ranges

**Since:** 1.4.0

</details>

<details>
<summary><strong><a href="/commands/ts.queryindex/">TS.QUERYINDEX</a></strong> - Get all time series keys matching a filter list</summary>

**Syntax:** `TS.QUERYINDEX <l=v | l!=v | l= | l!= | l=(v1,v2,...) |
  l!=(v1,v2,...) [l=v | l!=v | l= | l!= | l=(v1,v2,...) |
  l!=(v1,v2,...) ...]>`

**Description:** Get all time series keys matching a filter list

**Complexity:** O(n) where n is the number of time-series that match the filters

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.range/">TS.RANGE</a></strong> - Query a range in forward direction</summary>

**Syntax:** `TS.RANGE key fromTimestamp toTimestamp [LATEST]
  [FILTER BY TS Timestamp [Timestamp ...]] [FILTER BY VALUE min max]
  [COUNT count] [[ALIGN value] AGGREGATION <AVG | FIRST | LAST | MIN
  | MAX | SUM | RANGE | COUNT | STD.P | STD.S | VAR.P | VAR.S | TWA>
  bucketDuration [BUCKETTIMESTAMP] [EMPTY]]`

**Description:** Query a range in forward direction

**Complexity:** O(n/m+k) where n = Number of data points, m = Chunk size (data points per chunk), k = Number of data points that are in the requested range

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/ts.revrange/">TS.REVRANGE</a></strong> - Query a range in reverse direction</summary>

**Syntax:** `TS.REVRANGE key fromTimestamp toTimestamp [LATEST]
  [FILTER BY TS Timestamp [Timestamp ...]] [FILTER BY VALUE min max]
  [COUNT count] [[ALIGN value] AGGREGATION <AVG | FIRST | LAST | MIN
  | MAX | SUM | RANGE | COUNT | STD.P | STD.S | VAR.P | VAR.S | TWA>
  bucketDuration [BUCKETTIMESTAMP] [EMPTY]]`

**Description:** Query a range in reverse direction

**Complexity:** O(n/m+k) where n = Number of data points, m = Chunk size (data points per chunk), k = Number of data points that are in the requested range

**Since:** 1.4.0

</details>


## Pub/Sub commands

Pub/Sub commands enable message passing between clients.

<details>
<summary><strong><a href="/commands/psubscribe/">PSUBSCRIBE</a></strong> - Listens for messages published to channels that match one or more patterns.</summary>

**Syntax:** `PSUBSCRIBE pattern [pattern ...]`

**Description:** Listens for messages published to channels that match one or more patterns.

**Complexity:** O(N) where N is the number of patterns to subscribe to.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/publish/">PUBLISH</a></strong> - Posts a message to a channel.</summary>

**Syntax:** `PUBLISH channel message`

**Description:** Posts a message to a channel.

**Complexity:** O(N+M) where N is the number of clients subscribed to the receiving channel and M is the total number of subscribed patterns (by any client).

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/pubsub-channels/">PUBSUB CHANNELS</a></strong> - Returns the active channels.</summary>

**Syntax:** `PUBSUB CHANNELS [pattern]`

**Description:** Returns the active channels.

**Complexity:** O(N) where N is the number of active channels, and assuming constant time pattern matching (relatively short channels and patterns)

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/pubsub-numpat/">PUBSUB NUMPAT</a></strong> - Returns a count of unique pattern subscriptions.</summary>

**Syntax:** `PUBSUB NUMPAT`

**Description:** Returns a count of unique pattern subscriptions.

**Complexity:** O(1)

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/pubsub-numsub/">PUBSUB NUMSUB</a></strong> - Returns a count of subscribers to channels.</summary>

**Syntax:** `PUBSUB NUMSUB [channel [channel ...]]`

**Description:** Returns a count of subscribers to channels.

**Complexity:** O(N) for the NUMSUB subcommand, where N is the number of requested channels

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/pubsub-shardchannels/">PUBSUB SHARDCHANNELS</a></strong> - Returns the active shard channels.</summary>

**Syntax:** `PUBSUB SHARDCHANNELS [pattern]`

**Description:** Returns the active shard channels.

**Complexity:** O(N) where N is the number of active shard channels, and assuming constant time pattern matching (relatively short shard channels).

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/pubsub-shardnumsub/">PUBSUB SHARDNUMSUB</a></strong> - Returns the count of subscribers of shard channels.</summary>

**Syntax:** `PUBSUB SHARDNUMSUB [shardchannel [shardchannel ...]]`

**Description:** Returns the count of subscribers of shard channels.

**Complexity:** O(N) for the SHARDNUMSUB subcommand, where N is the number of requested shard channels

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/punsubscribe/">PUNSUBSCRIBE</a></strong> - Stops listening to messages published to channels that match one or more patterns.</summary>

**Syntax:** `PUNSUBSCRIBE [pattern [pattern ...]]`

**Description:** Stops listening to messages published to channels that match one or more patterns.

**Complexity:** O(N) where N is the number of patterns to unsubscribe.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/spublish/">SPUBLISH</a></strong> - Post a message to a shard channel</summary>

**Syntax:** `SPUBLISH shardchannel message`

**Description:** Post a message to a shard channel

**Complexity:** O(N) where N is the number of clients subscribed to the receiving shard channel.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/ssubscribe/">SSUBSCRIBE</a></strong> - Listens for messages published to shard channels.</summary>

**Syntax:** `SSUBSCRIBE shardchannel [shardchannel ...]`

**Description:** Listens for messages published to shard channels.

**Complexity:** O(N) where N is the number of shard channels to subscribe to.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/subscribe/">SUBSCRIBE</a></strong> - Listens for messages published to channels.</summary>

**Syntax:** `SUBSCRIBE channel [channel ...]`

**Description:** Listens for messages published to channels.

**Complexity:** O(N) where N is the number of channels to subscribe to.

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/sunsubscribe/">SUNSUBSCRIBE</a></strong> - Stops listening to messages posted to shard channels.</summary>

**Syntax:** `SUNSUBSCRIBE [shardchannel [shardchannel ...]]`

**Description:** Stops listening to messages posted to shard channels.

**Complexity:** O(N) where N is the number of shard channels to unsubscribe.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/unsubscribe/">UNSUBSCRIBE</a></strong> - Stops listening to messages posted to channels.</summary>

**Syntax:** `UNSUBSCRIBE [channel [channel ...]]`

**Description:** Stops listening to messages posted to channels.

**Complexity:** O(N) where N is the number of channels to unsubscribe.

**Since:** 2.0.0

</details>


## Transaction commands

Transaction commands enable atomic execution of command groups.

<details>
<summary><strong><a href="/commands/discard/">DISCARD</a></strong> - Discards a transaction.</summary>

**Syntax:** `DISCARD`

**Description:** Discards a transaction.

**Complexity:** O(N), when N is the number of queued commands

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/exec/">EXEC</a></strong> - Executes all commands in a transaction.</summary>

**Syntax:** `EXEC`

**Description:** Executes all commands in a transaction.

**Complexity:** Depends on commands in the transaction

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/multi/">MULTI</a></strong> - Starts a transaction.</summary>

**Syntax:** `MULTI`

**Description:** Starts a transaction.

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/unwatch/">UNWATCH</a></strong> - Forgets about watched keys of a transaction.</summary>

**Syntax:** `UNWATCH`

**Description:** Forgets about watched keys of a transaction.

**Complexity:** O(1)

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/watch/">WATCH</a></strong> - Monitors changes to keys to determine the execution of a transaction.</summary>

**Syntax:** `WATCH key [key ...]`

**Description:** Monitors changes to keys to determine the execution of a transaction.

**Complexity:** O(1) for every key.

**Since:** 2.2.0

</details>


## Scripting commands

Scripting commands enable server-side Lua script execution.

<details>
<summary><strong><a href="/commands/eval/">EVAL</a></strong> - Executes a server-side Lua script.</summary>

**Syntax:** `EVAL script numkeys [key [key ...]] [arg [arg ...]]`

**Description:** Executes a server-side Lua script.

**Complexity:** Depends on the script that is executed.

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/evalsha/">EVALSHA</a></strong> - Executes a server-side Lua script by SHA1 digest.</summary>

**Syntax:** `EVALSHA sha1 numkeys [key [key ...]] [arg [arg ...]]`

**Description:** Executes a server-side Lua script by SHA1 digest.

**Complexity:** Depends on the script that is executed.

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/evalsha_ro/">EVALSHA_RO</a></strong> - Executes a read-only server-side Lua script by SHA1 digest.</summary>

**Syntax:** `EVALSHA RO sha1 numkeys [key [key ...]] [arg [arg ...]]`

**Description:** Executes a read-only server-side Lua script by SHA1 digest.

**Complexity:** Depends on the script that is executed.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/eval_ro/">EVAL_RO</a></strong> - Executes a read-only server-side Lua script.</summary>

**Syntax:** `EVAL RO script numkeys [key [key ...]] [arg [arg ...]]`

**Description:** Executes a read-only server-side Lua script.

**Complexity:** Depends on the script that is executed.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/fcall/">FCALL</a></strong> - Invokes a function.</summary>

**Syntax:** `FCALL function numkeys [key [key ...]] [arg [arg ...]]`

**Description:** Invokes a function.

**Complexity:** Depends on the function that is executed.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/fcall_ro/">FCALL_RO</a></strong> - Invokes a read-only function.</summary>

**Syntax:** `FCALL RO function numkeys [key [key ...]] [arg [arg ...]]`

**Description:** Invokes a read-only function.

**Complexity:** Depends on the function that is executed.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-delete/">FUNCTION DELETE</a></strong> - Deletes a library and its functions.</summary>

**Syntax:** `FUNCTION DELETE library-name`

**Description:** Deletes a library and its functions.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-dump/">FUNCTION DUMP</a></strong> - Dumps all libraries into a serialized binary payload.</summary>

**Syntax:** `FUNCTION DUMP`

**Description:** Dumps all libraries into a serialized binary payload.

**Complexity:** O(N) where N is the number of functions

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-flush/">FUNCTION FLUSH</a></strong> - Deletes all libraries and functions.</summary>

**Syntax:** `FUNCTION FLUSH [ASYNC | SYNC]`

**Description:** Deletes all libraries and functions.

**Complexity:** O(N) where N is the number of functions deleted

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-kill/">FUNCTION KILL</a></strong> - Terminates a function during execution.</summary>

**Syntax:** `FUNCTION KILL`

**Description:** Terminates a function during execution.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-list/">FUNCTION LIST</a></strong> - Returns information about all libraries.</summary>

**Syntax:** `FUNCTION LIST [LIBRARYNAME library-name-pattern] [WITHCODE]`

**Description:** Returns information about all libraries.

**Complexity:** O(N) where N is the number of functions

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-load/">FUNCTION LOAD</a></strong> - Creates a library.</summary>

**Syntax:** `FUNCTION LOAD [REPLACE] function-code`

**Description:** Creates a library.

**Complexity:** O(1) (considering compilation time is redundant)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-restore/">FUNCTION RESTORE</a></strong> - Restores all libraries from a payload.</summary>

**Syntax:** `FUNCTION RESTORE serialized-value [FLUSH | APPEND | REPLACE]`

**Description:** Restores all libraries from a payload.

**Complexity:** O(N) where N is the number of functions on the payload

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/function-stats/">FUNCTION STATS</a></strong> - Returns information about a function during execution.</summary>

**Syntax:** `FUNCTION STATS`

**Description:** Returns information about a function during execution.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/script-debug/">SCRIPT DEBUG</a></strong> - Sets the debug mode of server-side Lua scripts.</summary>

**Syntax:** `SCRIPT DEBUG <YES | SYNC | NO>`

**Description:** Sets the debug mode of server-side Lua scripts.

**Complexity:** O(1)

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/script-exists/">SCRIPT EXISTS</a></strong> - Determines whether server-side Lua scripts exist in the script cache.</summary>

**Syntax:** `SCRIPT EXISTS sha1 [sha1 ...]`

**Description:** Determines whether server-side Lua scripts exist in the script cache.

**Complexity:** O(N) with N being the number of scripts to check (so checking a single script is an O(1) operation).

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/script-flush/">SCRIPT FLUSH</a></strong> - Removes all server-side Lua scripts from the script cache.</summary>

**Syntax:** `SCRIPT FLUSH [ASYNC | SYNC]`

**Description:** Removes all server-side Lua scripts from the script cache.

**Complexity:** O(N) with N being the number of scripts in cache

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/script-kill/">SCRIPT KILL</a></strong> - Terminates a server-side Lua script during execution.</summary>

**Syntax:** `SCRIPT KILL`

**Description:** Terminates a server-side Lua script during execution.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/script-load/">SCRIPT LOAD</a></strong> - Loads a server-side Lua script to the script cache.</summary>

**Syntax:** `SCRIPT LOAD script`

**Description:** Loads a server-side Lua script to the script cache.

**Complexity:** O(N) with N being the length in bytes of the script body.

**Since:** 2.6.0

</details>


## Connection commands

Connection commands manage client connections.

<details>
<summary><strong><a href="/commands/auth/">AUTH</a></strong> - Authenticates the connection.</summary>

**Syntax:** `AUTH [username] password`

**Description:** Authenticates the connection.

**Complexity:** O(N) where N is the number of passwords defined for the user

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/client-caching/">CLIENT CACHING</a></strong> - Instructs the server whether to track the keys in the next request.</summary>

**Syntax:** `CLIENT CACHING <YES | NO>`

**Description:** Instructs the server whether to track the keys in the next request.

**Complexity:** O(1)

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/client-getname/">CLIENT GETNAME</a></strong> - Returns the name of the connection.</summary>

**Syntax:** `CLIENT GETNAME`

**Description:** Returns the name of the connection.

**Complexity:** O(1)

**Since:** 2.6.9

</details>

<details>
<summary><strong><a href="/commands/client-getredir/">CLIENT GETREDIR</a></strong> - Returns the client ID to which the connection's tracking notifications are redirected.</summary>

**Syntax:** `CLIENT GETREDIR`

**Description:** Returns the client ID to which the connection's tracking notifications are redirected.

**Complexity:** O(1)

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/client-id/">CLIENT ID</a></strong> - Returns the unique client ID of the connection.</summary>

**Syntax:** `CLIENT ID`

**Description:** Returns the unique client ID of the connection.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/client-info/">CLIENT INFO</a></strong> - Returns information about the connection.</summary>

**Syntax:** `CLIENT INFO`

**Description:** Returns information about the connection.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/client-kill/">CLIENT KILL</a></strong> - Terminates open connections.</summary>

**Syntax:** `CLIENT KILL <ip:port | <[ID client-id] | [TYPE <NORMAL | MASTER |
  SLAVE | REPLICA | PUBSUB>] | [USER username] | [ADDR ip:port] |
  [LADDR ip:port] | [SKIPME <YES | NO>] | [MAXAGE maxage]
  [[ID client-id] | [TYPE <NORMAL | MASTER | SLAVE | REPLICA |
  PUBSUB>] | [USER username] | [ADDR ip:port] | [LADDR ip:port] |
  [SKIPME <YES | NO>] | [MAXAGE maxage] ...]>>`

**Description:** Terminates open connections.

**Complexity:** O(N) where N is the number of client connections

**Since:** 2.4.0

</details>

<details>
<summary><strong><a href="/commands/client-list/">CLIENT LIST</a></strong> - Lists open connections.</summary>

**Syntax:** `CLIENT LIST [TYPE <NORMAL | MASTER | REPLICA | PUBSUB>]
  [ID client-id [client-id ...]]`

**Description:** Lists open connections.

**Complexity:** O(N) where N is the number of client connections

**Since:** 2.4.0

</details>

<details>
<summary><strong><a href="/commands/client-no-evict/">CLIENT NO-EVICT</a></strong> - Sets the client eviction mode of the connection.</summary>

**Syntax:** `CLIENT NO-EVICT <ON | OFF>`

**Description:** Sets the client eviction mode of the connection.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/client-no-touch/">CLIENT NO-TOUCH</a></strong> - Controls whether commands sent by the client affect the LRU/LFU of accessed keys. <span style="color: #e74c3c;">⭐ New in 7.2</span></summary>

**Syntax:** `CLIENT NO-TOUCH <ON | OFF>`

**Description:** Controls whether commands sent by the client affect the LRU/LFU of accessed keys.

**Complexity:** O(1)

**Since:** 7.2.0

</details>

<details>
<summary><strong><a href="/commands/client-pause/">CLIENT PAUSE</a></strong> - Suspends commands processing.</summary>

**Syntax:** `CLIENT PAUSE timeout [WRITE | ALL]`

**Description:** Suspends commands processing.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/client-reply/">CLIENT REPLY</a></strong> - Instructs the server whether to reply to commands.</summary>

**Syntax:** `CLIENT REPLY <ON | OFF | SKIP>`

**Description:** Instructs the server whether to reply to commands.

**Complexity:** O(1)

**Since:** 3.2.0

</details>

<details>
<summary><strong><a href="/commands/client-setinfo/">CLIENT SETINFO</a></strong> - Sets information specific to the client or connection. <span style="color: #e74c3c;">⭐ New in 7.2</span></summary>

**Syntax:** `CLIENT SETINFO <LIB-NAME libname | LIB-VER libver>`

**Description:** Sets information specific to the client or connection.

**Complexity:** O(1)

**Since:** 7.2.0

</details>

<details>
<summary><strong><a href="/commands/client-setname/">CLIENT SETNAME</a></strong> - Sets the connection name.</summary>

**Syntax:** `CLIENT SETNAME connection-name`

**Description:** Sets the connection name.

**Complexity:** O(1)

**Since:** 2.6.9

</details>

<details>
<summary><strong><a href="/commands/client-tracking/">CLIENT TRACKING</a></strong> - Controls server-assisted client-side caching for the connection.</summary>

**Syntax:** `CLIENT TRACKING <ON | OFF> [REDIRECT client-id] [PREFIX prefix
  [PREFIX prefix ...]] [BCAST] [OPTIN] [OPTOUT] [NOLOOP]`

**Description:** Controls server-assisted client-side caching for the connection.

**Complexity:** O(1). Some options may introduce additional complexity.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/client-trackinginfo/">CLIENT TRACKINGINFO</a></strong> - Returns information about server-assisted client-side caching for the connection.</summary>

**Syntax:** `CLIENT TRACKINGINFO`

**Description:** Returns information about server-assisted client-side caching for the connection.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/client-unblock/">CLIENT UNBLOCK</a></strong> - Unblocks a client blocked by a blocking command from a different connection.</summary>

**Syntax:** `CLIENT UNBLOCK client-id [TIMEOUT | ERROR]`

**Description:** Unblocks a client blocked by a blocking command from a different connection.

**Complexity:** O(log N) where N is the number of client connections

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/client-unpause/">CLIENT UNPAUSE</a></strong> - Resumes processing commands from paused clients.</summary>

**Syntax:** `CLIENT UNPAUSE`

**Description:** Resumes processing commands from paused clients.

**Complexity:** O(N) Where N is the number of paused clients

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/echo/">ECHO</a></strong> - Returns the given string.</summary>

**Syntax:** `ECHO message`

**Description:** Returns the given string.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/hello/">HELLO</a></strong> - Handshakes with the Redis server.</summary>

**Syntax:** `HELLO [protover [AUTH username password] [SETNAME clientname]]`

**Description:** Handshakes with the Redis server.

**Complexity:** O(1)

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/ping/">PING</a></strong> - Returns the server's liveliness response.</summary>

**Syntax:** `PING [message]`

**Description:** Returns the server's liveliness response.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/quit/">QUIT</a></strong> - Closes the connection.</summary>

**Syntax:** `QUIT`

**Description:** Closes the connection.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/reset/">RESET</a></strong> - Resets the connection.</summary>

**Syntax:** `RESET`

**Description:** Resets the connection.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/select/">SELECT</a></strong> - Changes the selected database.</summary>

**Syntax:** `SELECT index`

**Description:** Changes the selected database.

**Complexity:** O(1)

**Since:** 1.0.0

</details>


## Server commands

Server commands provide server management and introspection.

<details>
<summary><strong><a href="/commands/acl-cat/">ACL CAT</a></strong> - Lists the ACL categories, or the commands inside a category.</summary>

**Syntax:** `ACL CAT [category]`

**Description:** Lists the ACL categories, or the commands inside a category.

**Complexity:** O(1) since the categories and commands are a fixed set.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-deluser/">ACL DELUSER</a></strong> - Deletes ACL users, and terminates their connections.</summary>

**Syntax:** `ACL DELUSER username [username ...]`

**Description:** Deletes ACL users, and terminates their connections.

**Complexity:** O(1) amortized time considering the typical user.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-dryrun/">ACL DRYRUN</a></strong> - Simulates the execution of a command by a user, without executing the command.</summary>

**Syntax:** `ACL DRYRUN username command [arg [arg ...]]`

**Description:** Simulates the execution of a command by a user, without executing the command.

**Complexity:** O(1).

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-genpass/">ACL GENPASS</a></strong> - Generates a pseudorandom, secure password that can be used to identify ACL users.</summary>

**Syntax:** `ACL GENPASS [bits]`

**Description:** Generates a pseudorandom, secure password that can be used to identify ACL users.

**Complexity:** O(1)

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-getuser/">ACL GETUSER</a></strong> - Lists the ACL rules of a user.</summary>

**Syntax:** `ACL GETUSER username`

**Description:** Lists the ACL rules of a user.

**Complexity:** O(N). Where N is the number of password, command and pattern rules that the user has.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-list/">ACL LIST</a></strong> - Dumps the effective rules in ACL file format.</summary>

**Syntax:** `ACL LIST`

**Description:** Dumps the effective rules in ACL file format.

**Complexity:** O(N). Where N is the number of configured users.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-load/">ACL LOAD</a></strong> - Reloads the rules from the configured ACL file.</summary>

**Syntax:** `ACL LOAD`

**Description:** Reloads the rules from the configured ACL file.

**Complexity:** O(N). Where N is the number of configured users.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-log/">ACL LOG</a></strong> - Lists recent security events generated due to ACL rules.</summary>

**Syntax:** `ACL LOG [count | RESET]`

**Description:** Lists recent security events generated due to ACL rules.

**Complexity:** O(N) with N being the number of entries shown.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-save/">ACL SAVE</a></strong> - Saves the effective ACL rules in the configured ACL file.</summary>

**Syntax:** `ACL SAVE`

**Description:** Saves the effective ACL rules in the configured ACL file.

**Complexity:** O(N). Where N is the number of configured users.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-setuser/">ACL SETUSER</a></strong> - Creates and modifies an ACL user and its rules.</summary>

**Syntax:** `ACL SETUSER username [rule [rule ...]]`

**Description:** Creates and modifies an ACL user and its rules.

**Complexity:** O(N). Where N is the number of rules provided.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-users/">ACL USERS</a></strong> - Lists all ACL users.</summary>

**Syntax:** `ACL USERS`

**Description:** Lists all ACL users.

**Complexity:** O(N). Where N is the number of configured users.

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/acl-whoami/">ACL WHOAMI</a></strong> - Returns the authenticated username of the current connection.</summary>

**Syntax:** `ACL WHOAMI`

**Description:** Returns the authenticated username of the current connection.

**Complexity:** O(1)

**Since:** 6.0.0

</details>

<details>
<summary><strong><a href="/commands/bgrewriteaof/">BGREWRITEAOF</a></strong> - Asynchronously rewrites the append-only file to disk.</summary>

**Syntax:** `BGREWRITEAOF`

**Description:** Asynchronously rewrites the append-only file to disk.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/bgsave/">BGSAVE</a></strong> - Asynchronously saves the database(s) to disk.</summary>

**Syntax:** `BGSAVE [SCHEDULE]`

**Description:** Asynchronously saves the database(s) to disk.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/command/">COMMAND</a></strong> - Returns detailed information about all commands.</summary>

**Syntax:** `COMMAND`

**Description:** Returns detailed information about all commands.

**Complexity:** O(N) where N is the total number of Redis commands

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/command-count/">COMMAND COUNT</a></strong> - Returns a count of commands.</summary>

**Syntax:** `COMMAND COUNT`

**Description:** Returns a count of commands.

**Complexity:** O(1)

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/command-docs/">COMMAND DOCS</a></strong> - Returns documentary information about one, multiple or all commands.</summary>

**Syntax:** `COMMAND DOCS [command-name [command-name ...]]`

**Description:** Returns documentary information about one, multiple or all commands.

**Complexity:** O(N) where N is the number of commands to look up

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/command-getkeys/">COMMAND GETKEYS</a></strong> - Extracts the key names from an arbitrary command.</summary>

**Syntax:** `COMMAND GETKEYS command [arg [arg ...]]`

**Description:** Extracts the key names from an arbitrary command.

**Complexity:** O(N) where N is the number of arguments to the command

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/command-getkeysandflags/">COMMAND GETKEYSANDFLAGS</a></strong> - Extracts the key names and access flags for an arbitrary command.</summary>

**Syntax:** `COMMAND GETKEYSANDFLAGS command [arg [arg ...]]`

**Description:** Extracts the key names and access flags for an arbitrary command.

**Complexity:** O(N) where N is the number of arguments to the command

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/command-info/">COMMAND INFO</a></strong> - Returns information about one, multiple or all commands.</summary>

**Syntax:** `COMMAND INFO [command-name [command-name ...]]`

**Description:** Returns information about one, multiple or all commands.

**Complexity:** O(N) where N is the number of commands to look up

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/command-list/">COMMAND LIST</a></strong> - Returns a list of command names.</summary>

**Syntax:** `COMMAND LIST [FILTERBY <MODULE module-name | ACLCAT category |
  PATTERN pattern>]`

**Description:** Returns a list of command names.

**Complexity:** O(N) where N is the total number of Redis commands

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/config-get/">CONFIG GET</a></strong> - Returns the effective values of configuration parameters.</summary>

**Syntax:** `CONFIG GET parameter [parameter ...]`

**Description:** Returns the effective values of configuration parameters.

**Complexity:** O(N) when N is the number of configuration parameters provided

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/config-resetstat/">CONFIG RESETSTAT</a></strong> - Resets the server's statistics.</summary>

**Syntax:** `CONFIG RESETSTAT`

**Description:** Resets the server's statistics.

**Complexity:** O(1)

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/config-rewrite/">CONFIG REWRITE</a></strong> - Persists the effective configuration to file.</summary>

**Syntax:** `CONFIG REWRITE`

**Description:** Persists the effective configuration to file.

**Complexity:** O(1)

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/config-set/">CONFIG SET</a></strong> - Sets configuration parameters in-flight.</summary>

**Syntax:** `CONFIG SET parameter value [parameter value ...]`

**Description:** Sets configuration parameters in-flight.

**Complexity:** O(N) when N is the number of configuration parameters provided

**Since:** 2.0.0

</details>

<details>
<summary><strong><a href="/commands/dbsize/">DBSIZE</a></strong> - Returns the number of keys in the database.</summary>

**Syntax:** `DBSIZE`

**Description:** Returns the number of keys in the database.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/failover/">FAILOVER</a></strong> - Starts a coordinated failover from a server to one of its replicas.</summary>

**Syntax:** `FAILOVER [TO host port [FORCE]] [ABORT] [TIMEOUT milliseconds]`

**Description:** Starts a coordinated failover from a server to one of its replicas.

**Complexity:** O(1)

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/flushall/">FLUSHALL</a></strong> - Removes all keys from all databases.</summary>

**Syntax:** `FLUSHALL [ASYNC | SYNC]`

**Description:** Removes all keys from all databases.

**Complexity:** O(N) where N is the total number of keys in all databases

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/flushdb/">FLUSHDB</a></strong> - Remove all keys from the current database.</summary>

**Syntax:** `FLUSHDB [ASYNC | SYNC]`

**Description:** Remove all keys from the current database.

**Complexity:** O(N) where N is the number of keys in the selected database

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/info/">INFO</a></strong> - Returns information and statistics about the server.</summary>

**Syntax:** `INFO [section [section ...]]`

**Description:** Returns information and statistics about the server.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/lastsave/">LASTSAVE</a></strong> - Returns the Unix timestamp of the last successful save to disk.</summary>

**Syntax:** `LASTSAVE`

**Description:** Returns the Unix timestamp of the last successful save to disk.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/latency-doctor/">LATENCY DOCTOR</a></strong> - Returns a human-readable latency analysis report.</summary>

**Syntax:** `LATENCY DOCTOR`

**Description:** Returns a human-readable latency analysis report.

**Complexity:** O(1)

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/latency-graph/">LATENCY GRAPH</a></strong> - Returns a latency graph for an event.</summary>

**Syntax:** `LATENCY GRAPH event`

**Description:** Returns a latency graph for an event.

**Complexity:** O(1)

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/latency-histogram/">LATENCY HISTOGRAM</a></strong> - Returns the cumulative distribution of latencies of a subset or all commands.</summary>

**Syntax:** `LATENCY HISTOGRAM [command [command ...]]`

**Description:** Returns the cumulative distribution of latencies of a subset or all commands.

**Complexity:** O(N) where N is the number of commands with latency information being retrieved.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/latency-history/">LATENCY HISTORY</a></strong> - Returns timestamp-latency samples for an event.</summary>

**Syntax:** `LATENCY HISTORY event`

**Description:** Returns timestamp-latency samples for an event.

**Complexity:** O(1)

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/latency-latest/">LATENCY LATEST</a></strong> - Returns the latest latency samples for all events.</summary>

**Syntax:** `LATENCY LATEST`

**Description:** Returns the latest latency samples for all events.

**Complexity:** O(1)

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/latency-reset/">LATENCY RESET</a></strong> - Resets the latency data for one or more events.</summary>

**Syntax:** `LATENCY RESET [event [event ...]]`

**Description:** Resets the latency data for one or more events.

**Complexity:** O(1)

**Since:** 2.8.13

</details>

<details>
<summary><strong><a href="/commands/lolwut/">LOLWUT</a></strong> - Displays computer art and the Redis version</summary>

**Syntax:** `LOLWUT [VERSION version]`

**Description:** Displays computer art and the Redis version

**Complexity:** 

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/memory-doctor/">MEMORY DOCTOR</a></strong> - Outputs a memory problems report.</summary>

**Syntax:** `MEMORY DOCTOR`

**Description:** Outputs a memory problems report.

**Complexity:** O(1)

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/memory-malloc-stats/">MEMORY MALLOC-STATS</a></strong> - Returns the allocator statistics.</summary>

**Syntax:** `MEMORY MALLOC-STATS`

**Description:** Returns the allocator statistics.

**Complexity:** Depends on how much memory is allocated, could be slow

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/memory-purge/">MEMORY PURGE</a></strong> - Asks the allocator to release memory.</summary>

**Syntax:** `MEMORY PURGE`

**Description:** Asks the allocator to release memory.

**Complexity:** Depends on how much memory is allocated, could be slow

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/memory-stats/">MEMORY STATS</a></strong> - Returns details about memory usage.</summary>

**Syntax:** `MEMORY STATS`

**Description:** Returns details about memory usage.

**Complexity:** O(1)

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/memory-usage/">MEMORY USAGE</a></strong> - Estimates the memory usage of a key.</summary>

**Syntax:** `MEMORY USAGE key [SAMPLES count]`

**Description:** Estimates the memory usage of a key.

**Complexity:** O(N) where N is the number of samples.

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/module-list/">MODULE LIST</a></strong> - Returns all loaded modules.</summary>

**Syntax:** `MODULE LIST`

**Description:** Returns all loaded modules.

**Complexity:** O(N) where N is the number of loaded modules.

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/module-load/">MODULE LOAD</a></strong> - Loads a module.</summary>

**Syntax:** `MODULE LOAD path [arg [arg ...]]`

**Description:** Loads a module.

**Complexity:** O(1)

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/module-loadex/">MODULE LOADEX</a></strong> - Loads a module using extended parameters.</summary>

**Syntax:** `MODULE LOADEX path [CONFIG name value [CONFIG name value ...]]
  [ARGS args [args ...]]`

**Description:** Loads a module using extended parameters.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/module-unload/">MODULE UNLOAD</a></strong> - Unloads a module.</summary>

**Syntax:** `MODULE UNLOAD name`

**Description:** Unloads a module.

**Complexity:** O(1)

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/monitor/">MONITOR</a></strong> - Listens for all requests received by the server in real-time.</summary>

**Syntax:** `MONITOR`

**Description:** Listens for all requests received by the server in real-time.

**Complexity:** 

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/psync/">PSYNC</a></strong> - An internal command used in replication.</summary>

**Syntax:** `PSYNC replicationid offset`

**Description:** An internal command used in replication.

**Complexity:** 

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/replconf/">REPLCONF</a></strong> - An internal command for configuring the replication stream.</summary>

**Syntax:** `REPLCONF`

**Description:** An internal command for configuring the replication stream.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/replicaof/">REPLICAOF</a></strong> - Configures a server as replica of another, or promotes it to a master.</summary>

**Syntax:** `REPLICAOF <host port | NO ONE>`

**Description:** Configures a server as replica of another, or promotes it to a master.

**Complexity:** O(1)

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/restore-asking/">RESTORE-ASKING</a></strong> - An internal command for migrating keys in a cluster.</summary>

**Syntax:** `RESTORE-ASKING key ttl serialized-value [REPLACE] [ABSTTL]
  [IDLETIME seconds] [FREQ frequency]`

**Description:** An internal command for migrating keys in a cluster.

**Complexity:** O(1) to create the new key and additional O(N*M) to reconstruct the serialized value, where N is the number of Redis objects composing the value and M their average size. For small string values the time complexity is thus O(1)+O(1*M) where M is small, so simply O(1). However for sorted set values the complexity is O(N*M*log(N)) because inserting values into sorted sets is O(log(N)).

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/role/">ROLE</a></strong> - Returns the replication role.</summary>

**Syntax:** `ROLE`

**Description:** Returns the replication role.

**Complexity:** O(1)

**Since:** 2.8.12

</details>

<details>
<summary><strong><a href="/commands/save/">SAVE</a></strong> - Synchronously saves the database(s) to disk.</summary>

**Syntax:** `SAVE`

**Description:** Synchronously saves the database(s) to disk.

**Complexity:** O(N) where N is the total number of keys in all databases

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/shutdown/">SHUTDOWN</a></strong> - Synchronously saves the database(s) to disk and shuts down the Redis server.</summary>

**Syntax:** `SHUTDOWN [NOSAVE | SAVE] [NOW] [FORCE] [ABORT]`

**Description:** Synchronously saves the database(s) to disk and shuts down the Redis server.

**Complexity:** O(N) when saving, where N is the total number of keys in all databases when saving data, otherwise O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/slaveof/">SLAVEOF</a></strong> - Sets a Redis server as a replica of another, or promotes it to being a master.</summary>

**Syntax:** `SLAVEOF <host port | NO ONE>`

**Description:** Sets a Redis server as a replica of another, or promotes it to being a master.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/slowlog-get/">SLOWLOG GET</a></strong> - Returns the slow log's entries.</summary>

**Syntax:** `SLOWLOG GET [count]`

**Description:** Returns the slow log's entries.

**Complexity:** O(N) where N is the number of entries returned

**Since:** 2.2.12

</details>

<details>
<summary><strong><a href="/commands/slowlog-len/">SLOWLOG LEN</a></strong> - Returns the number of entries in the slow log.</summary>

**Syntax:** `SLOWLOG LEN`

**Description:** Returns the number of entries in the slow log.

**Complexity:** O(1)

**Since:** 2.2.12

</details>

<details>
<summary><strong><a href="/commands/slowlog-reset/">SLOWLOG RESET</a></strong> - Clears all entries from the slow log.</summary>

**Syntax:** `SLOWLOG RESET`

**Description:** Clears all entries from the slow log.

**Complexity:** O(N) where N is the number of entries in the slowlog

**Since:** 2.2.12

</details>

<details>
<summary><strong><a href="/commands/swapdb/">SWAPDB</a></strong> - Swaps two Redis databases.</summary>

**Syntax:** `SWAPDB index1 index2`

**Description:** Swaps two Redis databases.

**Complexity:** O(N) where N is the count of clients watching or blocking on keys from both databases.

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/sync/">SYNC</a></strong> - An internal command used in replication.</summary>

**Syntax:** `SYNC`

**Description:** An internal command used in replication.

**Complexity:** 

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/time/">TIME</a></strong> - Returns the server time.</summary>

**Syntax:** `TIME`

**Description:** Returns the server time.

**Complexity:** O(1)

**Since:** 2.6.0

</details>


## Cluster commands

Cluster commands manage Redis Cluster operations.

<details>
<summary><strong><a href="/commands/asking/">ASKING</a></strong> - Signals that a cluster client is following an -ASK redirect.</summary>

**Syntax:** `ASKING`

**Description:** Signals that a cluster client is following an -ASK redirect.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-addslots/">CLUSTER ADDSLOTS</a></strong> - Assigns new hash slots to a node.</summary>

**Syntax:** `CLUSTER ADDSLOTS slot [slot ...]`

**Description:** Assigns new hash slots to a node.

**Complexity:** O(N) where N is the total number of hash slot arguments

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-addslotsrange/">CLUSTER ADDSLOTSRANGE</a></strong> - Assigns new hash slot ranges to a node.</summary>

**Syntax:** `CLUSTER ADDSLOTSRANGE start-slot end-slot [start-slot end-slot ...]`

**Description:** Assigns new hash slot ranges to a node.

**Complexity:** O(N) where N is the total number of the slots between the start slot and end slot arguments.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-bumpepoch/">CLUSTER BUMPEPOCH</a></strong> - Advances the cluster config epoch.</summary>

**Syntax:** `CLUSTER BUMPEPOCH`

**Description:** Advances the cluster config epoch.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-count-failure-reports/">CLUSTER COUNT-FAILURE-REPORTS</a></strong> - Returns the number of active failure reports active for a node.</summary>

**Syntax:** `CLUSTER COUNT-FAILURE-REPORTS node-id`

**Description:** Returns the number of active failure reports active for a node.

**Complexity:** O(N) where N is the number of failure reports

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-countkeysinslot/">CLUSTER COUNTKEYSINSLOT</a></strong> - Returns the number of keys in a hash slot.</summary>

**Syntax:** `CLUSTER COUNTKEYSINSLOT slot`

**Description:** Returns the number of keys in a hash slot.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-delslots/">CLUSTER DELSLOTS</a></strong> - Sets hash slots as unbound for a node.</summary>

**Syntax:** `CLUSTER DELSLOTS slot [slot ...]`

**Description:** Sets hash slots as unbound for a node.

**Complexity:** O(N) where N is the total number of hash slot arguments

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-delslotsrange/">CLUSTER DELSLOTSRANGE</a></strong> - Sets hash slot ranges as unbound for a node.</summary>

**Syntax:** `CLUSTER DELSLOTSRANGE start-slot end-slot [start-slot end-slot ...]`

**Description:** Sets hash slot ranges as unbound for a node.

**Complexity:** O(N) where N is the total number of the slots between the start slot and end slot arguments.

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-failover/">CLUSTER FAILOVER</a></strong> - Forces a replica to perform a manual failover of its master.</summary>

**Syntax:** `CLUSTER FAILOVER [FORCE | TAKEOVER]`

**Description:** Forces a replica to perform a manual failover of its master.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-flushslots/">CLUSTER FLUSHSLOTS</a></strong> - Deletes all slots information from a node.</summary>

**Syntax:** `CLUSTER FLUSHSLOTS`

**Description:** Deletes all slots information from a node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-forget/">CLUSTER FORGET</a></strong> - Removes a node from the nodes table.</summary>

**Syntax:** `CLUSTER FORGET node-id`

**Description:** Removes a node from the nodes table.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-getkeysinslot/">CLUSTER GETKEYSINSLOT</a></strong> - Returns the key names in a hash slot.</summary>

**Syntax:** `CLUSTER GETKEYSINSLOT slot count`

**Description:** Returns the key names in a hash slot.

**Complexity:** O(N) where N is the number of requested keys

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-info/">CLUSTER INFO</a></strong> - Returns information about the state of a node.</summary>

**Syntax:** `CLUSTER INFO`

**Description:** Returns information about the state of a node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-keyslot/">CLUSTER KEYSLOT</a></strong> - Returns the hash slot for a key.</summary>

**Syntax:** `CLUSTER KEYSLOT key`

**Description:** Returns the hash slot for a key.

**Complexity:** O(N) where N is the number of bytes in the key

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-links/">CLUSTER LINKS</a></strong> - Returns a list of all TCP links to and from peer nodes.</summary>

**Syntax:** `CLUSTER LINKS`

**Description:** Returns a list of all TCP links to and from peer nodes.

**Complexity:** O(N) where N is the total number of Cluster nodes

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-meet/">CLUSTER MEET</a></strong> - Forces a node to handshake with another node.</summary>

**Syntax:** `CLUSTER MEET ip port [cluster-bus-port]`

**Description:** Forces a node to handshake with another node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-myid/">CLUSTER MYID</a></strong> - Returns the ID of a node.</summary>

**Syntax:** `CLUSTER MYID`

**Description:** Returns the ID of a node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-myshardid/">CLUSTER MYSHARDID</a></strong> - Returns the shard ID of a node. <span style="color: #e74c3c;">⭐ New in 7.2</span></summary>

**Syntax:** `CLUSTER MYSHARDID`

**Description:** Returns the shard ID of a node.

**Complexity:** O(1)

**Since:** 7.2.0

</details>

<details>
<summary><strong><a href="/commands/cluster-nodes/">CLUSTER NODES</a></strong> - Returns the cluster configuration for a node.</summary>

**Syntax:** `CLUSTER NODES`

**Description:** Returns the cluster configuration for a node.

**Complexity:** O(N) where N is the total number of Cluster nodes

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-replicas/">CLUSTER REPLICAS</a></strong> - Lists the replica nodes of a master node.</summary>

**Syntax:** `CLUSTER REPLICAS node-id`

**Description:** Lists the replica nodes of a master node.

**Complexity:** O(N) where N is the number of replicas.

**Since:** 5.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-replicate/">CLUSTER REPLICATE</a></strong> - Configure a node as replica of a master node.</summary>

**Syntax:** `CLUSTER REPLICATE node-id`

**Description:** Configure a node as replica of a master node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-reset/">CLUSTER RESET</a></strong> - Resets a node.</summary>

**Syntax:** `CLUSTER RESET [HARD | SOFT]`

**Description:** Resets a node.

**Complexity:** O(N) where N is the number of known nodes. The command may execute a FLUSHALL as a side effect.

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-saveconfig/">CLUSTER SAVECONFIG</a></strong> - Forces a node to save the cluster configuration to disk.</summary>

**Syntax:** `CLUSTER SAVECONFIG`

**Description:** Forces a node to save the cluster configuration to disk.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-set-config-epoch/">CLUSTER SET-CONFIG-EPOCH</a></strong> - Sets the configuration epoch for a new node.</summary>

**Syntax:** `CLUSTER SET-CONFIG-EPOCH config-epoch`

**Description:** Sets the configuration epoch for a new node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-setslot/">CLUSTER SETSLOT</a></strong> - Binds a hash slot to a node.</summary>

**Syntax:** `CLUSTER SETSLOT slot <IMPORTING node-id | MIGRATING node-id |
  NODE node-id | STABLE>`

**Description:** Binds a hash slot to a node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-shards/">CLUSTER SHARDS</a></strong> - Returns the mapping of cluster slots to shards.</summary>

**Syntax:** `CLUSTER SHARDS`

**Description:** Returns the mapping of cluster slots to shards.

**Complexity:** O(N) where N is the total number of cluster nodes

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-slaves/">CLUSTER SLAVES</a></strong> - Lists the replica nodes of a master node.</summary>

**Syntax:** `CLUSTER SLAVES node-id`

**Description:** Lists the replica nodes of a master node.

**Complexity:** O(N) where N is the number of replicas.

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/cluster-slots/">CLUSTER SLOTS</a></strong> - Returns the mapping of cluster slots to nodes.</summary>

**Syntax:** `CLUSTER SLOTS`

**Description:** Returns the mapping of cluster slots to nodes.

**Complexity:** O(N) where N is the total number of Cluster nodes

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/readonly/">READONLY</a></strong> - Enables read-only queries for a connection to a Redis Cluster replica node.</summary>

**Syntax:** `READONLY`

**Description:** Enables read-only queries for a connection to a Redis Cluster replica node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/readwrite/">READWRITE</a></strong> - Enables read-write queries for a connection to a Reids Cluster replica node.</summary>

**Syntax:** `READWRITE`

**Description:** Enables read-write queries for a connection to a Reids Cluster replica node.

**Complexity:** O(1)

**Since:** 3.0.0

</details>


## Generic commands

Generic commands work across all data types.

<details>
<summary><strong><a href="/commands/copy/">COPY</a></strong> - Copies the value of a key to a new key.</summary>

**Syntax:** `COPY source destination [DB destination-db] [REPLACE]`

**Description:** Copies the value of a key to a new key.

**Complexity:** O(N) worst case for collections, where N is the number of nested items. O(1) for string values.

**Since:** 6.2.0

</details>

<details>
<summary><strong><a href="/commands/del/">DEL</a></strong> - Deletes one or more keys.</summary>

**Syntax:** `DEL key [key ...]`

**Description:** Deletes one or more keys.

**Complexity:** O(N) where N is the number of keys that will be removed. When a key to remove holds a value other than a string, the individual complexity for this key is O(M) where M is the number of elements in the list, set, sorted set or hash. Removing a single key that holds a string value is O(1).

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/dump/">DUMP</a></strong> - Returns a serialized representation of the value stored at a key.</summary>

**Syntax:** `DUMP key`

**Description:** Returns a serialized representation of the value stored at a key.

**Complexity:** O(1) to access the key and additional O(N*M) to serialize it, where N is the number of Redis objects composing the value and M their average size. For small string values the time complexity is thus O(1)+O(1*M) where M is small, so simply O(1).

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/exists/">EXISTS</a></strong> - Determines whether one or more keys exist.</summary>

**Syntax:** `EXISTS key [key ...]`

**Description:** Determines whether one or more keys exist.

**Complexity:** O(N) where N is the number of keys to check.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/expire/">EXPIRE</a></strong> - Sets the expiration time of a key in seconds.</summary>

**Syntax:** `EXPIRE key seconds [NX | XX | GT | LT]`

**Description:** Sets the expiration time of a key in seconds.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/expireat/">EXPIREAT</a></strong> - Sets the expiration time of a key to a Unix timestamp.</summary>

**Syntax:** `EXPIREAT key unix-time-seconds [NX | XX | GT | LT]`

**Description:** Sets the expiration time of a key to a Unix timestamp.

**Complexity:** O(1)

**Since:** 1.2.0

</details>

<details>
<summary><strong><a href="/commands/expiretime/">EXPIRETIME</a></strong> - Returns the expiration time of a key as a Unix timestamp.</summary>

**Syntax:** `EXPIRETIME key`

**Description:** Returns the expiration time of a key as a Unix timestamp.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/keys/">KEYS</a></strong> - Returns all key names that match a pattern.</summary>

**Syntax:** `KEYS pattern`

**Description:** Returns all key names that match a pattern.

**Complexity:** O(N) with N being the number of keys in the database, under the assumption that the key names in the database and the given pattern have limited length.

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/migrate/">MIGRATE</a></strong> - Atomically transfers a key from one Redis instance to another.</summary>

**Syntax:** `MIGRATE host port <key | ""> destination-db timeout [COPY] [REPLACE]
  [AUTH password | AUTH2 username password] [KEYS key [key ...]]`

**Description:** Atomically transfers a key from one Redis instance to another.

**Complexity:** This command actually executes a DUMP+DEL in the source instance, and a RESTORE in the target instance. See the pages of these commands for time complexity. Also an O(N) data transfer between the two instances is performed.

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/move/">MOVE</a></strong> - Moves a key to another database.</summary>

**Syntax:** `MOVE key db`

**Description:** Moves a key to another database.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/object-encoding/">OBJECT ENCODING</a></strong> - Returns the internal encoding of a Redis object.</summary>

**Syntax:** `OBJECT ENCODING key`

**Description:** Returns the internal encoding of a Redis object.

**Complexity:** O(1)

**Since:** 2.2.3

</details>

<details>
<summary><strong><a href="/commands/object-freq/">OBJECT FREQ</a></strong> - Returns the logarithmic access frequency counter of a Redis object.</summary>

**Syntax:** `OBJECT FREQ key`

**Description:** Returns the logarithmic access frequency counter of a Redis object.

**Complexity:** O(1)

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/object-idletime/">OBJECT IDLETIME</a></strong> - Returns the time since the last access to a Redis object.</summary>

**Syntax:** `OBJECT IDLETIME key`

**Description:** Returns the time since the last access to a Redis object.

**Complexity:** O(1)

**Since:** 2.2.3

</details>

<details>
<summary><strong><a href="/commands/object-refcount/">OBJECT REFCOUNT</a></strong> - Returns the reference count of a value of a key.</summary>

**Syntax:** `OBJECT REFCOUNT key`

**Description:** Returns the reference count of a value of a key.

**Complexity:** O(1)

**Since:** 2.2.3

</details>

<details>
<summary><strong><a href="/commands/persist/">PERSIST</a></strong> - Removes the expiration time of a key.</summary>

**Syntax:** `PERSIST key`

**Description:** Removes the expiration time of a key.

**Complexity:** O(1)

**Since:** 2.2.0

</details>

<details>
<summary><strong><a href="/commands/pexpire/">PEXPIRE</a></strong> - Sets the expiration time of a key in milliseconds.</summary>

**Syntax:** `PEXPIRE key milliseconds [NX | XX | GT | LT]`

**Description:** Sets the expiration time of a key in milliseconds.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/pexpireat/">PEXPIREAT</a></strong> - Sets the expiration time of a key to a Unix milliseconds timestamp.</summary>

**Syntax:** `PEXPIREAT key unix-time-milliseconds [NX | XX | GT | LT]`

**Description:** Sets the expiration time of a key to a Unix milliseconds timestamp.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/pexpiretime/">PEXPIRETIME</a></strong> - Returns the expiration time of a key as a Unix milliseconds timestamp.</summary>

**Syntax:** `PEXPIRETIME key`

**Description:** Returns the expiration time of a key as a Unix milliseconds timestamp.

**Complexity:** O(1)

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/pttl/">PTTL</a></strong> - Returns the expiration time in milliseconds of a key.</summary>

**Syntax:** `PTTL key`

**Description:** Returns the expiration time in milliseconds of a key.

**Complexity:** O(1)

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/randomkey/">RANDOMKEY</a></strong> - Returns a random key name from the database.</summary>

**Syntax:** `RANDOMKEY`

**Description:** Returns a random key name from the database.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/rename/">RENAME</a></strong> - Renames a key and overwrites the destination.</summary>

**Syntax:** `RENAME key newkey`

**Description:** Renames a key and overwrites the destination.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/renamenx/">RENAMENX</a></strong> - Renames a key only when the target key name doesn't exist.</summary>

**Syntax:** `RENAMENX key newkey`

**Description:** Renames a key only when the target key name doesn't exist.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/restore/">RESTORE</a></strong> - Creates a key from the serialized representation of a value.</summary>

**Syntax:** `RESTORE key ttl serialized-value [REPLACE] [ABSTTL]
  [IDLETIME seconds] [FREQ frequency]`

**Description:** Creates a key from the serialized representation of a value.

**Complexity:** O(1) to create the new key and additional O(N*M) to reconstruct the serialized value, where N is the number of Redis objects composing the value and M their average size. For small string values the time complexity is thus O(1)+O(1*M) where M is small, so simply O(1). However for sorted set values the complexity is O(N*M*log(N)) because inserting values into sorted sets is O(log(N)).

**Since:** 2.6.0

</details>

<details>
<summary><strong><a href="/commands/redis-6-2-commands/">Redis 6.2 Commands Reference</a></strong> - Complete list of all Redis commands available in version 6.2, organized by functional group</summary>

**Syntax:** ``

**Description:** Complete list of all Redis commands available in version 6.2, organized by functional group

**Complexity:** 

**Since:** 

</details>

<details>
<summary><strong><a href="/commands/redis-7-2-commands/">Redis 7.2 Commands Reference</a></strong> - Complete list of all Redis commands available in version 7.2, organized by functional group</summary>

**Syntax:** ``

**Description:** Complete list of all Redis commands available in version 7.2, organized by functional group

**Complexity:** 

**Since:** 

</details>

<details>
<summary><strong><a href="/commands/redis-7-4-commands/">Redis 7.4 Commands Reference</a></strong> - Complete list of all Redis commands available in version 7.4, organized by functional group</summary>

**Syntax:** ``

**Description:** Complete list of all Redis commands available in version 7.4, organized by functional group

**Complexity:** 

**Since:** 

</details>

<details>
<summary><strong><a href="/commands/redis-8-0-commands/">Redis 8.0 Commands Reference</a></strong> - Complete list of all Redis commands available in version 8.0, organized by functional group</summary>

**Syntax:** ``

**Description:** Complete list of all Redis commands available in version 8.0, organized by functional group

**Complexity:** 

**Since:** 

</details>

<details>
<summary><strong><a href="/commands/redis-8-2-commands/">Redis 8.2 Commands Reference</a></strong> - Complete list of all Redis commands available in version 8.2, organized by functional group</summary>

**Syntax:** ``

**Description:** Complete list of all Redis commands available in version 8.2, organized by functional group

**Complexity:** 

**Since:** 

</details>

<details>
<summary><strong><a href="/commands/redis-8-4-commands/">Redis 8.4 Commands Reference</a></strong> - Complete list of all Redis commands available in version 8.4, organized by functional group</summary>

**Syntax:** ``

**Description:** Complete list of all Redis commands available in version 8.4, organized by functional group

**Complexity:** 

**Since:** 

</details>

<details>
<summary><strong><a href="/commands/scan/">SCAN</a></strong> - Iterates over the key names in the database.</summary>

**Syntax:** `SCAN cursor [MATCH pattern] [COUNT count] [TYPE type]`

**Description:** Iterates over the key names in the database.

**Complexity:** O(1) for every call. O(N) for a complete iteration, including enough command calls for the cursor to return back to 0. N is the number of elements inside the collection.

**Since:** 2.8.0

</details>

<details>
<summary><strong><a href="/commands/sort/">SORT</a></strong> - Sorts the elements in a list, a set, or a sorted set, optionally storing the result.</summary>

**Syntax:** `SORT key [BY pattern] [LIMIT offset count] [GET pattern [GET pattern
  ...]] [ASC | DESC] [ALPHA] [STORE destination]`

**Description:** Sorts the elements in a list, a set, or a sorted set, optionally storing the result.

**Complexity:** O(N+M*log(M)) where N is the number of elements in the list or set to sort, and M the number of returned elements. When the elements are not sorted, complexity is O(N).

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/sort_ro/">SORT_RO</a></strong> - Returns the sorted elements of a list, a set, or a sorted set.</summary>

**Syntax:** `SORT RO key [BY pattern] [LIMIT offset count] [GET pattern [GET
  pattern ...]] [ASC | DESC] [ALPHA]`

**Description:** Returns the sorted elements of a list, a set, or a sorted set.

**Complexity:** O(N+M*log(M)) where N is the number of elements in the list or set to sort, and M the number of returned elements. When the elements are not sorted, complexity is O(N).

**Since:** 7.0.0

</details>

<details>
<summary><strong><a href="/commands/touch/">TOUCH</a></strong> - Returns the number of existing keys out of those specified after updating the time they were last accessed.</summary>

**Syntax:** `TOUCH key [key ...]`

**Description:** Returns the number of existing keys out of those specified after updating the time they were last accessed.

**Complexity:** O(N) where N is the number of keys that will be touched.

**Since:** 3.2.1

</details>

<details>
<summary><strong><a href="/commands/ttl/">TTL</a></strong> - Returns the expiration time in seconds of a key.</summary>

**Syntax:** `TTL key`

**Description:** Returns the expiration time in seconds of a key.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/type/">TYPE</a></strong> - Determines the type of value stored at a key.</summary>

**Syntax:** `TYPE key`

**Description:** Determines the type of value stored at a key.

**Complexity:** O(1)

**Since:** 1.0.0

</details>

<details>
<summary><strong><a href="/commands/unlink/">UNLINK</a></strong> - Asynchronously deletes one or more keys.</summary>

**Syntax:** `UNLINK key [key ...]`

**Description:** Asynchronously deletes one or more keys.

**Complexity:** O(1) for each key removed regardless of its size. Then the command does O(N) work in a different thread in order to reclaim memory, where N is the number of allocations the deleted objects where composed of.

**Since:** 4.0.0

</details>

<details>
<summary><strong><a href="/commands/wait/">WAIT</a></strong> - Blocks until the asynchronous replication of all preceding write commands sent by the connection is completed.</summary>

**Syntax:** `WAIT numreplicas timeout`

**Description:** Blocks until the asynchronous replication of all preceding write commands sent by the connection is completed.

**Complexity:** O(1)

**Since:** 3.0.0

</details>

<details>
<summary><strong><a href="/commands/waitaof/">WAITAOF</a></strong> - Blocks until all of the preceding write commands sent by the connection are written to the append-only file of the master and/or replicas. <span style="color: #e74c3c;">⭐ New in 7.2</span></summary>

**Syntax:** `WAITAOF numlocal numreplicas timeout`

**Description:** Blocks until all of the preceding write commands sent by the connection are written to the append-only file of the master and/or replicas.

**Complexity:** O(1)

**Since:** 7.2.0

</details>



---
acl_categories:
- '@write'
- '@string'
- '@fast'
arguments:
- display_text: key
  key_spec_index: 0
  name: key
  type: key
arity: 2
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
command_flags:
- write
- denyoom
- fast
complexity: O(1)
description: Increments the integer value of a key by one. Uses 0 as initial value
  if the key doesn't exist.
group: string
hidden: false
key_specs:
- RW: true
  access: true
  begin_search:
    spec:
      index: 1
    type: index
  find_keys:
    spec:
      keystep: 1
      lastkey: 0
      limit: 0
    type: range
  update: true
linkTitle: INCR
since: 1.0.0
summary: Increments the integer value of a key by one. Uses 0 as initial value if
  the key doesn't exist.
syntax_fmt: INCR key
syntax_str: ''
title: INCR
---
Increments the number stored at `key` by one.
If the key does not exist, it is set to `0` before performing the operation.
An error is returned if the key contains a value of the wrong type or contains a
string that can not be represented as integer.
This operation is limited to 64 bit signed integers.

**Note**: this is a string operation because Redis does not have a dedicated
integer type.
The string stored at the key is interpreted as a base-10 **64 bit signed
integer** to execute the operation.

Redis stores integers in their integer representation, so for string values
that actually hold an integer, there is no overhead for storing the string
representation of the integer.

## Examples

{{< clients-example cmds_string incr >}}
> SET mykey "10"
"OK"
> INCR mykey
(integer) 11
> GET mykey
"11"
{{< /clients-example >}}

Give this command a try in the interactive console:

{{% redis-cli %}}
SET mykey "10"
INCR mykey
GET mykey
{{% /redis-cli %}}

## Pattern: Counter

The counter pattern is the most obvious thing you can do with Redis atomic
increment operations.
The idea is simply send an `INCR` command to Redis every time an operation
occurs.
For instance in a web application we may want to know how many page views this
user did every day of the year.

To do so the web application may simply increment a key every time the user
performs a page view, creating the key name concatenating the User ID and a
string representing the current date.

This simple pattern can be extended in many ways:

* It is possible to use `INCR` and [`EXPIRE`]({{< relref "/commands/expire" >}}) together at every page view to have
  a counter counting only the latest N page views separated by less than the
  specified amount of seconds.
* A client may use GETSET in order to atomically get the current counter value
  and reset it to zero.
* Using other atomic increment/decrement commands like [`DECR`]({{< relref "/commands/decr" >}}) or [`INCRBY`]({{< relref "/commands/incrby" >}}) it
  is possible to handle values that may get bigger or smaller depending on the
  operations performed by the user.
  Imagine for instance the score of different users in an online game.

## Pattern: Rate limiter

The rate limiter pattern is a special counter that is used to limit the rate at
which an operation can be performed.
The classical materialization of this pattern involves limiting the number of
requests that can be performed against a public API.

We provide two implementations of this pattern using `INCR`, where we assume
that the problem to solve is limiting the number of API calls to a maximum of
_ten requests per second per IP address_.

## Pattern: Rate limiter 1

The more simple and direct implementation of this pattern is the following:

```
FUNCTION LIMIT_API_CALL(ip)
ts = CURRENT_UNIX_TIME()
keyname = ip+":"+ts
MULTI
    INCR(keyname)
    EXPIRE(keyname,10)
EXEC
current = RESPONSE_OF_INCR_WITHIN_MULTI
IF current > 10 THEN
    ERROR "too many requests per second"
ELSE
    PERFORM_API_CALL()
END
```

Basically we have a counter for every IP, for every different second.
But these counters are always incremented setting an expire of 10 seconds so that
they'll be removed by Redis automatically when the current second is a different
one.

Note the used of [`MULTI`]({{< relref "/commands/multi" >}}) and [`EXEC`]({{< relref "/commands/exec" >}}) in order to make sure that we'll both
increment and set the expire at every API call.

## Pattern: Rate limiter 2

An alternative implementation uses a single counter, but is a bit more complex
to get it right without race conditions.
We'll examine different variants.

```
FUNCTION LIMIT_API_CALL(ip):
current = GET(ip)
IF current != NULL AND current > 10 THEN
    ERROR "too many requests per second"
ELSE
    value = INCR(ip)
    IF value == 1 THEN
        EXPIRE(ip,1)
    END
    PERFORM_API_CALL()
END
```

The counter is created in a way that it only will survive one second, starting
from the first request performed in the current second.
If there are more than 10 requests in the same second the counter will reach a
value greater than 10, otherwise it will expire and start again from 0.

**In the above code there is a race condition**.
If for some reason the client performs the `INCR` command but does not perform
the [`EXPIRE`]({{< relref "/commands/expire" >}}) the key will be leaked until we'll see the same IP address again.

This can be easily fixed by turning the `INCR` with optional [`EXPIRE`]({{< relref "/commands/expire" >}}) into a Lua
script that is then sent using the [`EVAL`]({{< relref "/commands/eval" >}}) command (only available since Redis version
2.6).

```
local current
current = redis.call("incr",KEYS[1])
if current == 1 then
    redis.call("expire",KEYS[1],1)
end
```

There is a different way to fix this issue without using scripting, by using
Redis lists instead of counters.
The implementation is more complex and uses more advanced features but has the
advantage of remembering the IP addresses of the clients currently performing an
API call, that may be useful or not depending on the application.

```
FUNCTION LIMIT_API_CALL(ip)
current = LLEN(ip)
IF current > 10 THEN
    ERROR "too many requests per second"
ELSE
    IF EXISTS(ip) == FALSE
        MULTI
            RPUSH(ip,ip)
            EXPIRE(ip,1)
        EXEC
    ELSE
        RPUSHX(ip,ip)
    END
    PERFORM_API_CALL()
END
```

The [`RPUSHX`]({{< relref "/commands/rpushx" >}}) command only pushes the element if the key already exists.

Note that we have a race here, but it is not a problem: [`EXISTS`]({{< relref "/commands/exists" >}}) may return
false but the key may be created by another client before we create it inside
the [`MULTI`]({{< relref "/commands/multi" >}}) / [`EXEC`]({{< relref "/commands/exec" >}}) block.
However this race will just miss an API call under rare conditions, so the rate
limiting will still work correctly.

## Return information

{{< multitabs id="incr-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

[Integer reply](../../develop/reference/protocol-spec#integers): the value of the key after the increment.

-tab-sep-

[Integer reply](../../develop/reference/protocol-spec#integers): the value of the key after the increment.

{{< /multitabs >}}

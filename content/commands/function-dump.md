---
acl_categories:
- '@slow'
- '@scripting'
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
- noscript
complexity: O(N) where N is the number of functions
description: Dumps all libraries into a serialized binary payload.
group: scripting
hidden: false
linkTitle: FUNCTION DUMP
since: 7.0.0
summary: Dumps all libraries into a serialized binary payload.
syntax_fmt: FUNCTION DUMP
syntax_str: ''
title: FUNCTION DUMP
---
Return the serialized payload of loaded libraries.
You can restore the serialized payload later with the [`FUNCTION RESTORE`]({{< relref "/commands/function-restore" >}}) command.

For more information please refer to [Introduction to Redis Functions]({{< relref "/develop/interact/programmability/functions-intro" >}}).

## Examples

The following example shows how to dump loaded libraries using `FUNCTION DUMP` and then it calls [`FUNCTION FLUSH`]({{< relref "/commands/function-flush" >}}) deletes all the libraries.
Then, it restores the original libraries from the serialized payload with [`FUNCTION RESTORE`]({{< relref "/commands/function-restore" >}}).

```
redis> FUNCTION LOAD "#!lua name=mylib \n redis.register_function('myfunc', function(keys, args) return args[1] end)"
"mylib"
redis> FUNCTION DUMP
"\xf5\xc3@X@]\x1f#!lua name=mylib \n redis.registe\rr_function('my@\x0b\x02', @\x06`\x12\nkeys, args) 6\x03turn`\x0c\a[1] end)\x0c\x00\xba\x98\xc2\xa2\x13\x0e$\a"
redis> FUNCTION FLUSH
OK
redis> FUNCTION RESTORE "\xf5\xc3@X@]\x1f#!lua name=mylib \n redis.registe\rr_function('my@\x0b\x02', @\x06`\x12\nkeys, args) 6\x03turn`\x0c\a[1] end)\x0c\x00\xba\x98\xc2\xa2\x13\x0e$\a"
OK
redis> FUNCTION LIST
1) 1) "library_name"
   2) "mylib"
   3) "engine"
   4) "LUA"
   5) "functions"
   6) 1) 1) "name"
         2) "myfunc"
         3) "description"
         4) (nil)
         5) "flags"
         6) (empty array)
```

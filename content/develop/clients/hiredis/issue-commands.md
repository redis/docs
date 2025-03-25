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
description: Handle commands and replies with `hiredis`.
linkTitle: Issue commands
title: Issue commands
weight: 5
---

Unlike the other [client libraries]({{< relref "/develop/clients" >}}),
`hiredis` doesn't provide an extensive API to construct the many different
Redis [commands]({{< relref "/commands" >}}). However, it does provide a lightweight and
flexible API to help you construct commands and parse their replies from
your own code.

The sections below describe the available functions in
detail.

## Construct synchronous commands

Use the `redisCommand()` function to send commands to the server:

```c
void *redisCommand(redisContext *c, const char *format, ...);
```

This function receives a `redisContext` pointer and a pointer
to a string containing the command. The command text is the
same as the equivalent [`redis-cli`]({{< relref "/develop/tools/cli" >}})
command. For example, to issue the command:

```
SET foo bar
```

you would use (with an existing `redisContext* c`):

```c
redisReply *reply = redisCommand(c, "SET foo bar");
```

The command string is interpreted in a similar way to the format
string for `printf()`, so you can easily interpolate string values from
your code into the command with the `%s` format specifier:

```c
char *myKeyNumber = "1";
char *myValue = "Hello";

// This issues the command 'SET key:1 Hello'.
redisReply *reply = redisCommand(c, "SET key:%s %s", myKeyNumber, myValue);
```



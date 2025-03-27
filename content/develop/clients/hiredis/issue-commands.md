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

you would use the following command with an existing `redisContext* c`:

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

You may need to include binary data in the command (for example, to store
[vector embeddings]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}})
in fields of a [hash]({{< relref "/develop/data-types/hashes" >}})) object.
To do this, use the `%b` format specifier and pass a pointer to the
data buffer, followed by a `size_t` value indicating its length in bytes.
As the example below shows, you can freely mix `%s` and `%b` specifiers
in the same format string.

```c
char *entryNumber = "1";
char *embedding = "<binary data>";
char *url = "https://redis.io/";
size_t embLength = 13;

redisReply *reply = redisCommand(c,
    "HSET entry:%s embedding %b  url %s",
    entryNumber,
    embedding, embLength,
    url
);
```

The `redisCommand()` function has a variant `redisCommandArgv()`:

```c
void *redisCommandArgv(redisContext *c, int argc, const char **argv, const size_t *argvlen);
```

This doesn't take a format string but instead builds the command from an array
of strings passed in the `argv` parameter.

Use the `argc` value to
specify the length of this array and the `argvlen` array to specify
the lengths of each of the strings in the array. If you pass `NULL`
for `argvlen` then the function will attempt to use `strlen()` to
get the length of each string. However, this will not work if any of
the strings contains binary data, so you should pass `argvlen`
explicitly in this case. The example below shows how to use
`redisCommandArgv()` with a simple command:

```c
const char *argv[3] = { "SET", "greeting", "hello"};
int argc = 3;
const size_t argvlen[] = {3, 8, 5};

redisReply *reply = redisCommandArgv(c, argc, argv, argvlen);
```

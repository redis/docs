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
description: Construct commands and send them to the Redis server.
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
to a string containing the command (see
[Connect]({{< relref "/develop/clients/hiredis/connect" >}})
to learn how to obtain the context pointer). The command text is the
same as the equivalent [`redis-cli`]({{< relref "/develop/tools/cli" >}})
command. For example, to issue the command:

```
SET foo bar
```

you would use the following command with an existing `redisContext* c`:

```c
redisReply *reply = redisCommand(c, "SET foo bar");
```

See the [Command reference]({{< relref "/commands" >}}) for examples
of CLI commands that you can use with `hiredis`. Most code examples
in other sections of the docs also have a CLI tab showing
command sequences that are equivalent to the code.

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
in the same format string. Also, you can use the sequence `%%` to
denote a literal percent sign, but the other `printf()` specifiers,
such as `%d`, are not supported.

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

The `redisCommand()` function has a variant called `redisCommandArgv()`:

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

## Construct asynchronous commands

Use the `redisAsyncCommand()` and `redisAsyncCommandArgv()`
functions to send commands to the server asynchronously:

```c
int redisAsyncCommand(
  redisAsyncContext *ac, redisCallbackFn *fn, void *privdata,
  const char *format, ...);
int redisAsyncCommandArgv(
  redisAsyncContext *ac, redisCallbackFn *fn, void *privdata,
  int argc, const char **argv, const size_t *argvlen);
```

These work the same way as `redisCommand()` and `redisCommandArgv()`
(see [Construct synchronous commands](#construct-synchronous-commands)
above) but they have two extra parameters. The first is a pointer to
a optional callback function and the second is a pointer to your own
custom data, which will be passed to the callback when it
executes. Pass `NULL` for both of these pointers if you don't need
to use them.

The callback has the following signature:

```c
void(redisAsyncContext *c, void *reply, void *privdata);
```

The first parameter is the asynchronous connection context and
the second is a pointer to the reply object. Use a cast to
`(redisReply *)` to access the reply in the usual way (see 
[Handle command replies]({{< relref "/develop/clients/hiredis/handle-replies" >}})
for a full description of `redisReply`). The last parameter
is the custom data pointer that you supplied during the
`redisAsyncCommand()` call. This is passed to your function
without any modification.

The example below shows how you can use `redisAsyncCommand()` with
or without a reply callback:

```c
// The callback expects the key for the data in the `privdata`
// custom data parameter.
void getCallback(redisAsyncContext *c, void *r, void *privdata) {
    redisReply *reply = r;
    char *key = privdata;

    if (reply == NULL) {
        if (c->errstr) {
            printf("errstr: %s\n", c->errstr);
        }
        return;
    }

    printf("Key: %s, value: %s\n", key, reply->str);

    /* Disconnect after receiving the reply to GET */
    redisAsyncDisconnect(c);
}
    .
    .
    .

// Key and string value to pass to `SET`.
char *key = "testkey";
char *value = "testvalue";

// We aren't interested in the simple status reply for
// `SET`, so use NULL for the callback and custom data
// pointers.
redisAsyncCommand(c, NULL, NULL, "SET %s %s", key, value);

// The reply from `GET` is essential, so set a callback
// to retrieve it. Also, pass the key to the callback
// as the custom data.
redisAsyncCommand(c, getCallback, key, "GET %s", key);
```

Note that you should normally disconnect asynchronously from a
callback when you have finished using the connection.
Use `redisAsyncDisconnect()` to disconnect gracefully, letting
pending commands execute and activate their callbacks.
Use `redisAsyncFree()` to disconnect immediately. If you do this then
any pending callbacks from commands that have already executed will be
called with a `NULL` reply pointer.

## Command replies

The information in the `redisReply` object has several formats,
and the format for a particular reply depends on the command that generated it.
See
[Handle replies]({{< relref "/develop/clients/hiredis/handle-replies" >}})
to learn about the different reply formats and how to use them.

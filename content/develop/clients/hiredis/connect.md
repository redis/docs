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
description: Connect to the server with `hiredis`.
linkTitle: Connect
title: Connect
weight: 1
---

## Basic synchronous connection

The example below creates a simple synchronous connection to a local
Redis server and tests the connection, before closing it with
`redisFree()`. The `redisConnect()` function takes just a hostname
and port as its arguments, and returns a context object.

```c
#include <stdio.h>

#include <hiredis/hiredis.h>
    .
    .
    .

// The `redisContext` type represents the connection
// to the Redis server. Here, we connect to the
// default host and port.
redisContext *c = redisConnect("127.0.0.1", 6379);

// Check if the context is null or if a specific
// error occurred.
if (c == NULL || c->err) {
    if (c != NULL) {
        printf("Error: %s\n", c->errstr);
        // handle error
    } else {
        printf("Can't allocate redis context\n");
    }

    exit(1);
}

// Set a string key.
redisReply *reply = redisCommand(c, "SET foo bar");
printf("Reply: %s\n", reply->str); // >>> Reply: OK
freeReplyObject(reply);

// Get the key we have just stored.
reply = redisCommand(c, "GET foo");
printf("Reply: %s\n", reply->str); // >>> Reply: bar
freeReplyObject(reply);

// Close the connection.
redisFree(c);
```

## Asynchronous connection

You can also connect to Redis using an asynchronous API.
The `redisAsyncConnect()` call that creates the context is
similar to the synchronous function `redisConnect()`, but it returns the
context object immediately before the connection is complete.
It lets you supply callbacks to respond when a connection is successful
or to handle any errors that may occur.

The following code creates an asynchronous connection and
sets the context callbacks. Note that you must also include the
`async.h` header to access the asynchronous API.

```c
#include <stdio.h>

#include <hiredis/hiredis.h>
#include <hiredis/async.h>
    .
    .
    .

redisAsyncContext *c = redisAsyncConnect("127.0.0.1", 6379);

if (c->err) {
    printf("Error: %s\n", c->errstr);
    return 1;
}

// Set callbacks to respond to successful or unsuccessful
// connection and disconnection.
redisAsyncSetConnectCallback(c, connectCallback);
redisAsyncSetDisconnectCallback(c, disconnectCallback);

char *key = "testkey";
char *value = "testvalue";

// Status reply is ignored.
redisAsyncCommand(c, NULL, NULL, "SET %s %s", key, value);

// Reply handled by `getCallback()` function.
redisAsyncCommand(c, getCallback, key, "GET %s", key);
```

The callback functions have a simple signature that receives
the context object and a status code. See
[Handling errors]({{< relref "/develop/clients/hiredis/handle-replies#handling-errors" >}})
for a list of the possible status codes.

```c
void connectCallback(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Connected...\n");
}

void disconnectCallback(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Disconnected...\n");
}
```

Use the `redisAsyncCommand()` function to issue Redis commands
with an asynchronous connection. This is similar to the equivalent
synchronous function `redisCommand()` but also lets you supply a callback
and a custom data pointer to process the response to the command. See
[Construct asynchronous commands]({{< relref "/develop/clients/hiredis/issue-commands#construct-asynchronous-commands" >}}) for more
information.

Note that you should normally disconnect asynchronously from a
callback when you have finished using the connection.
Use `redisAsyncDisconnect()` to disconnect gracefully, letting
pending commands execute and activate their callbacks.
Use `redisAsyncFree()` to disconnect immediately. If you do this then
any pending callbacks from commands that have already executed will be
called with a `NULL` reply pointer.

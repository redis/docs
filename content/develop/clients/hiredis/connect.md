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

#include "hiredis.h"
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



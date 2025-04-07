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
description: Use `hiredis` in conjunction with the `libevent` framework.
linkTitle: libevent integration
title: Integrate hiredis with a libevent app
weight: 60
---

The [`libevent`](https://libevent.org/) library provides an
implementation of an event loop that lets you call functions
asynchronously in response to events. This guide explains
how to use `hiredis` to connect to a Redis server from a
`libevent` app.

## Install `libevent`

The [`libevent` home page](https://libevent.org/) has links to download
all versions of the library, but you should use the latest version
unless there is a specific version you need to target.

When you have downloaded `libevent`, follow the instructions in the
`README` file to compile and install the library.

## Create a simple app

For a real project, you would build your code with a makefile, but for
this simple test, you can just place it in a file called `main.c` and
build it with the following command (assuming you used `make install` to
install the `libhiredis` and `libevent` libraries):

```bash
cc main.c -L/usr/local/lib -lhiredis -levent
```

See [Build and install]({{< relref "/develop/clients/hiredis#build-and-install" >}})
to learn how to build `hiredis`, if you have not already done so.

Now, add the following code in `main.c`. An explanation follows the
code example:

```c
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <signal.h>

#include <hiredis/hiredis.h>
#include <hiredis/async.h>
#include <hiredis/adapters/libevent.h>

// Callback for the `GET` command. 
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

// Callback to respond to successful or unsuccessful connection.
void connectCallback(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Connected...\n");
}

// Callback to respond to intentional or unexpected disconnection.
void disconnectCallback(const redisAsyncContext *c, int status) {
    if (status != REDIS_OK) {
        printf("Error: %s\n", c->errstr);
        return;
    }
    printf("Disconnected...\n");
}


int main (int argc, char **argv) {
#ifndef _WIN32
    signal(SIGPIPE, SIG_IGN);
#endif

    // Create the libevent `event_base` object to track all
    // events.
    struct event_base *base = event_base_new();

    redisAsyncContext *c = redisAsyncConnect("127.0.0.1", 6379);

    if (c->err) {
        printf("Error: %s\n", c->errstr);
        return 1;
    }

    // Use the Redis libevent adapter to attach the Redis connection
    // to the libevent main loop.
    redisLibeventAttach(c,base);
    
    redisAsyncSetConnectCallback(c, connectCallback);
    redisAsyncSetDisconnectCallback(c, disconnectCallback);
    
    char *key = "testkey";
    char *value = "testvalue";

    redisAsyncCommand(c, NULL, NULL, "SET %s %s", key, value);
    redisAsyncCommand(c, getCallback, key, "GET %s", key);
    
    // Run the event loop.
    event_base_dispatch(base);

    return 0;
}
```

The code calls
[`event_base_new()`](https://libevent.org/doc/event_8h.html#af34c025430d445427a2a5661082405c3)
to initialize the core
[`event_base`](https://libevent.org/doc/structevent__base.html)
object that manages the event loop. It then creates a standard
[asynchronous connection]({{< relref "/develop/clients/hiredis/connect#asynchronous-connection" >}})
to Redis and uses the `libevent` adapter function `redisLibeventAttach()` to
attach the connection to the event loop.

After setting the [connection callbacks]({{< relref "/develop/clients/hiredis/connect#asynchronous-connection" >}}), the code issues two asynchronous
Redis commands (see
[Construct asynchronous commands]({{< relref "/develop/clients/hiredis/issue-commands#construct-asynchronous-commands" >}})
for more information).
The final step is to call
[`event_base_dispatch()`](https://libevent.org/doc/event_8h.html#a19d60cb72a1af398247f40e92cf07056)
to start the event loop. This will wait for the commands to be processed and
then exit when the Redis connection is closed in the `getCallback()` function.

## Run the code

If you compile and run the code, you will see the following output,
showing that the callbacks executed correctly:

```
Connected...
Key: testkey, value: testvalue
Disconnected...
```

You can use the
[`KEYS`]({{< relref "/commands/keys" >}}) command from
[`redis-cli`]({{< relref "/develop/tools/cli" >}}) or
[Redis Insight]({{< relref "/develop/tools/insight" >}}) to check
that the "testkey" string key was added to the Redis database.

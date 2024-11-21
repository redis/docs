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
description: Learn how to use Redis transactions and pipelines
linkTitle: Transactions/pipelines
title: Transactions and pipelines
weight: 2
---

Redis lets you send a sequence of commands to the server together in a batch.
There are two types of batch that you can use:

-   *Transactions* guarantee that all the included commands will execute
    to completion without being interrupted by commands from other clients.
    See the [Transactions]({{< relref "/develop/interact/transactions" >}})
    page for more information.
-   *Pipelines* avoid network and processing overhead by sending several commands
    to the server together in a single communication. The server then sends back
    a single communication with all the responses. This typically improves
    performance compared to sending the commands separately. See the
    [Pipelining]({{< relref "/develop/use/pipelining" >}}) page for more
    information.

## Transactions





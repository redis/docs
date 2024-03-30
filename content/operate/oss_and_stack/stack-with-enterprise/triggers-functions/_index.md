---
Title: Triggers and functions
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Stack adds JavaScript support for triggers and functions to Redis
  databases.
hideListLinks: true
linkTitle: Triggers and functions
toc: 'true'
weight: 60
---

{{<banner-article>}}
A preview of Redis Stack triggers and functions is available for Redis Enterprise databases as of version 7.2.
{{</banner-article>}}

Redis Stack triggers and functions allow you to run JavaScript functions inside a Redis Enterprise database. You can run functions on-demand or register functions with triggers to run automatically when certain database events occur.

{{<note>}}
- The preview version of triggers and functions is not intended for production use since the API might change in the future and potentially cause application issues when upgrading to a later version.

- During preview, triggers and functions are not supported for databases with Auto Tiering enabled (previously known as Redis on Flash).
{{</note>}}

## Primary features

- JavaScript engine for functions

- On-demand functions

- Keyspace triggers

- Stream triggers

- Asynchronous handling of functions

- Read data from across the cluster

## Triggers

If you register a function with a trigger, the function will automatically run when the trigger event occurs in the database.

Types of triggers include:

- Keyspace triggers:

    - [Redis commands]({{< relref "/commands" >}}/) - Run registered functions when Redis commands add, modify, or delete data.

    - Key expiration - Run registered functions when keys expire.

    - Key eviction - Run registered functions when keys are evicted from the database.

- Stream triggers - Run registered functions when new items are added to the stream.

## Functions

You can write JavaScript functions to interact with data stored in your Redis database, then load the functions into your database as strings or files. Functions are organized in libraries.

After you load a function into your database, you can run them manually or use triggers to run them automatically when certain database events occur.

## More info

- [Triggers and functions quick start]({{< relref "/develop/interact/programmability/triggers-and-functions/" >}}quick_start/)

- [Triggers and functions documentation]({{< relref "/develop/interact/programmability/triggers-and-functions/" >}})

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
description: 'How to interact with data in Redis, including queries, triggered
  functions, transactions, and pub/sub'
linkTitle: Interact with data
title: Interact with data in Redis
hideListLinks: true
weight: 40
---

Redis is useful as a key-value store but also gives you other powerful ways
to interact with your data:

- [Redis Query Engine](#search-and-query)
- [Programmability](#programmability)
- [Transactions](#transactions)
- [Publish/subscribe](#publishsubscribe)

## Search and query with the Redis Query Engine

The [Redis query engine]({{< relref "/develop/ai/search-and-query" >}})
lets you retrieve data by content rather than by key. You
can [index]({{< relref "/develop/ai/search-and-query/indexing" >}})
the fields of [hash]({{< relref "/develop/data-types/hashes" >}})
and [JSON]({{< relref "/develop/data-types/json" >}}) objects
according to their type and then perform sophisticated
[queries]({{< relref "/develop/ai/search-and-query/query" >}})
on those fields. For example, you can use queries to find:
  - matches in
    [text fields]({{< relref "/develop/ai/search-and-query/query/full-text" >}})
  - numeric values that fall within a specified
    [range]({{< relref "/develop/ai/search-and-query/query/range" >}})
  - [Geospatial]({{< relref "/develop/ai/search-and-query/query/geo-spatial" >}})
    coordinates that fall within a specified area
  - [Vector matches]({{< relref "/develop/ai/search-and-query/query/vector-search" >}})
    against [word embeddings](https://en.wikipedia.org/wiki/Word_embedding) calculated from
    your text data

## Programmability

Redis has an [interface]({{< relref "/develop/interact/programmability" >}})
for the [Lua programming language](https://www.lua.org/)
that lets you store and execute scripts on the server. Use scripts
to ensure that different clients always update data using the same logic.
You can also reduce network traffic by reimplementing a sequence of
related client-side commands as a single server script.

## Transactions

A client will often execute a sequence of commands to make
a set of related changes to data objects. However, another client could also
modify the same data object with similar commands in between. This situation can create
corrupt or inconsistent data.

Use a [transaction]({{< relref "/develop/interact/transactions" >}}) to
group several commands from a client together as a single unit. The
commands in the transaction are guaranteed to execute in sequence without
interruptions from other clients' commands.

You can also use the
[`WATCH`]({{< relref "/commands/watch" >}}) command to check for changes
to the keys used in a transaction just before it executes. If the data you
are watching changes while you construct the transaction then
execution safely aborts. Use this feature for efficient
[optimistic concurrency control](https://en.wikipedia.org/wiki/Optimistic_concurrency_control)
in the common case where data is usually accessed only by one client
at a time.

## Publish/subscribe

Redis has a [publish/subscribe]({{< relref "/develop/interact/pubsub" >}}) (Pub/sub)
feature that implements the well-known
[design pattern](https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern)
of the same name. You can *publish* messages from a particular client
connection to a channel maintained by the server. Other connections that have
*subscribed* to the channel will receive the messages in the order you sent them.
Use pub/sub to share small amounts of data among clients easily and
efficiently.

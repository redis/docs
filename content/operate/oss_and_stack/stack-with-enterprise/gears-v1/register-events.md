---
Title: Register events
alwaysopen: false
categories:
- docs
- operate
- stack
description: Register RedisGears functions to run when certain events occur in a Redis
  database.
linkTitle: Register events
toc: 'true'
weight: 80
---

You can register RedisGears functions to run when certain events occur in a Redis database.

## Register on events

To register RedisGears functions to run on an event, your code needs to:

1. Pass `KeysReader` to a `GearsBuilder` object.

1. Call the `GearsBuilder.register()` function.

1. Pass the `eventTypes` parameter to either:

    - The `register` function for Python.
    
    - The `KeysReader` object for Java.

For more information and examples of event registration, see:

- Java references:

    - [`KeysReader`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/readers/keysreader" >}})

    - [`GearsBuilder.register()`]({{< relref "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/classes/gearsbuilder/register" >}})

## Event types

For the list of event types you can register on, see the [Redis keyspace notification documentation]({{< relref "/develop/pubsub/keyspace-notifications" >}}#events-generated-by-different-commands).

## Active-Active event types

In addition to standard Redis [events]({{< relref "/develop/pubsub/keyspace-notifications" >}}#events-generated-by-different-commands), [Redis Enterprise Active-Active databases]({{< relref "/operate/rs/databases/active-active" >}}) also support the registration of RedisGears functions for the following event types:

- `change`: This event occurs when a key changes on another replica of the Active-Active database.

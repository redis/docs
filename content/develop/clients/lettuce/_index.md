---
aliases: /develop/connect/clients/java/lettuce
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
description: Connect your Lettuce application to a Redis database
linkTitle: Lettuce (Java)
title: Lettuce guide (Java)
weight: 6
---

[Lettuce](https://github.com/redis/lettuce/tree/main/src/main) is an advanced Java client for Redis
that supports synchronous, asynchronous, and reactive connections.
If you only need synchronous connections then you may find the other Java client
[Jedis]({{< relref "/develop/clients/jedis" >}}) easier to use.

The sections below explain how to install `Lettuce` and connect your application
to a Redis database.

`Lettuce` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

To include Lettuce as a dependency in your application, edit the appropriate dependency file as shown below.

If you use Maven, add the following dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.7.1.RELEASE</version> <!-- Check for the latest version on Maven Central -->
</dependency>
```

If you use Gradle, include this line in your `build.gradle` file:

```
dependencies {
    compileOnly 'io.lettuce:lettuce-core:6.7.1.RELEASE'
}
```

If you wish to use the JAR files directly, download the latest Lettuce and, optionally, Apache Commons Pool2 JAR files from Maven Central or any other Maven repository.

To build from source, see the instructions on the [Lettuce source code GitHub repo](https://github.com/lettuce-io/lettuce-core).

## Connect and test

Connect to a local server using the following code. First, import
the required classes.

{{< clients-example set="landing" step="import" lang_filter="Lettuce-Sync" description="Foundational: Import required Lettuce classes for synchronous Redis connections" difficulty="beginner" >}}
{{< /clients-example >}}

Use the following code to connect to the server.

{{< clients-example set="landing" step="connect" lang_filter="Lettuce-Sync" description="Foundational: Establish a synchronous connection to a Redis server using Lettuce" difficulty="beginner" >}}
{{< /clients-example >}}

Test the connection by storing and retrieving a simple string.

{{< clients-example set="landing" step="set_get_string" lang_filter="Lettuce-Sync" description="Foundational: Set and retrieve string values using SET and GET commands to verify the connection works" difficulty="beginner" >}}
{{< /clients-example >}}

Close the connection when you're done.

{{< clients-example set="landing" step="close" lang_filter="Lettuce-Sync" description="Foundational: Properly close the Lettuce connection to release resources" difficulty="beginner" >}}
{{< /clients-example >}}

## More information

The [Lettuce reference guide](https://redis.github.io/lettuce/) has more examples
and an API reference. You may also be interested in the
[Project Reactor](https://projectreactor.io/) library that Lettuce uses.

See also the other pages in this section for more information and examples:

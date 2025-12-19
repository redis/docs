---
aliases: /develop/connect/clients/java/jedis
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
description: Connect your Java application to a Redis database
linkTitle: Jedis (Java)
title: Jedis guide (Java)
weight: 5
---

[Jedis](https://github.com/redis/jedis) is a synchronous Java client for Redis.
Use [Lettuce]({{< relref "/develop/clients/lettuce" >}}) if you need
a more advanced Java client that also supports asynchronous and reactive connections.
The sections below explain how to install `Jedis` and connect your application
to a Redis database.

{{< note >}}Jedis 7.2.0 introduced a new client connection API:

| New API class | Replaces | Use case |
| :-- | :-- | :-- |
| `RedisClient` | `UnifiedJedis`, `JedisPool`, `JedisPooled` | Single connection (with connection pooling) |
| `RedisClusterClient` | `JedisCluster` | Redis Cluster connections |
| `RedisSentinelClient` | `JedisSentinelPool` | Redis Sentinel connections |

The old client classes are now considered deprecated.
{{< /note >}}

`Jedis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

To include `Jedis` as a dependency in your application, edit the dependency file, as follows.

* If you use **Maven**:   

  ```xml
  <dependency>
      <groupId>redis.clients</groupId>
      <artifactId>jedis</artifactId>
      <version>7.2.0</version>
  </dependency>
  ```

* If you use **Gradle**: 

  ```
  repositories {
      mavenCentral()
  }
  //...
  dependencies {
      implementation 'redis.clients:jedis:7.2.0'
      //...
  }
  ```

* If you use the JAR files, download the latest Jedis and Apache Commons Pool2 JAR files from [Maven Central](https://central.sonatype.com/) or any other Maven repository.

* Build from [source](https://github.com/redis/jedis)


## Connect and test

Add the following imports to your source file:

{{< clients-example set="landing" step="import" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Connect to localhost on port 6379:

{{< clients-example set="landing" step="connect" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

After you have connected, you can check the connection by storing and
retrieving a simple [string]({{< relref "/develop/data-types/strings" >}}) value:

{{< clients-example set="landing" step="set_get_string" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}}):

{{< clients-example set="landing" step="set_get_hash" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

Close the connection when you're done:

{{< clients-example set="landing" step="close" lang_filter="Java-Sync" >}}
{{< /clients-example >}}

## More information

`Jedis` has a complete [API reference](https://www.javadoc.io/doc/redis.clients/jedis/latest/index.html) available on [javadoc.io/](https://javadoc.io/).
The `Jedis` [GitHub repository](https://github.com/redis/jedis) also has useful docs
and examples including a page about handling
[failover with Jedis](https://github.com/redis/jedis/blob/master/docs/failover.md)

See also the other pages in this section for more information and examples:

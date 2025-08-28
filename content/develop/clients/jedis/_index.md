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

`Jedis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

To include `Jedis` as a dependency in your application, edit the dependency file, as follows.

* If you use **Maven**:   

  ```xml
  <dependency>
      <groupId>redis.clients</groupId>
      <artifactId>jedis</artifactId>
      <version>6.1.0</version>
  </dependency>
  ```

* If you use **Gradle**: 

  ```
  repositories {
      mavenCentral()
  }
  //...
  dependencies {
      implementation 'redis.clients:jedis:6.1.0'
      //...
  }
  ```

* If you use the JAR files, download the latest Jedis and Apache Commons Pool2 JAR files from [Maven Central](https://central.sonatype.com/) or any other Maven repository.

* Build from [source](https://github.com/redis/jedis)


## Connect and test

The following code opens a basic connection to a local Redis server
and closes it after use.

```java
package org.example;
import redis.clients.jedis.UnifiedJedis;

public class Main {
    public static void main(String[] args) {
        UnifiedJedis jedis = new UnifiedJedis("redis://localhost:6379");

        // Code that interacts with Redis...

        jedis.close();
    }
}
```

After you have connected, you can check the connection by storing and
retrieving a simple string value:

```java
...

String res1 = jedis.set("bike:1", "Deimos");
System.out.println(res1); // OK

String res2 = jedis.get("bike:1");
System.out.println(res2); // Deimos

...
```

## More information

`Jedis` has a complete [API reference](https://www.javadoc.io/doc/redis.clients/jedis/latest/index.html) available on [javadoc.io/](https://javadoc.io/).
The `Jedis` [GitHub repository](https://github.com/redis/jedis) also has useful docs
and examples including a page about handling
[failover with Jedis](https://github.com/redis/jedis/blob/master/docs/failover.md)

See also the other pages in this section for more information and examples:

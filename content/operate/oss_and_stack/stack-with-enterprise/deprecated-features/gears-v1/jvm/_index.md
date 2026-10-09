---
Title: RedisGears JVM plugin
alwaysopen: false
categories:
- docs
- operate
- stack
description: The RedisGears JVM plugin allows you to run RedisGears functions in the
  Java virtual machine.
hideListLinks: true
linkTitle: Run with JVM
weight: 75
aliases:
- "/operate/oss_and_stack/stack-with-enterprise/gears-v1/jvm/"
bannerText: Redis Gears is a deprecated feature that is not recommended or supported
  for new users.
bannerChildren: true
---

With the [RedisGears JVM plugin](https://github.com/RedisGears/JVMPlugin), you can write RedisGears functions in [Java](https://en.wikipedia.org/wiki/Java_(programming_language)) and run them on a [Redis Software](/content/operate/rs/_index.md) cluster. It currently supports [JVM](https://en.wikipedia.org/wiki/Java_virtual_machine) version 11.

Similar to the Python plugin, the JVM plugin allows both batch processing and event-driven processing.

Before you can run RedisGears with Java, you will need to [install the RedisGears module and the JVM plugin](/content/operate/oss_and_stack/stack-with-enterprise/deprecated-features/gears-v1/installing-redisgears.md#install-redisgears) on your Redis Software cluster and [enable them for your database](/content/operate/oss_and_stack/stack-with-enterprise/deprecated-features/gears-v1/jvm/install.md).

Once you have written your code, compile and package it into a [JAR](https://en.wikipedia.org/wiki/JAR_(file_format)) file and upload it to a node on your Redis Software cluster. Use the `RG.JEXECUTE` command with the `redis-cli` command-line tool to run your code.

## More info

- [RedisGears JVM quick start](/content/operate/oss_and_stack/stack-with-enterprise/deprecated-features/gears-v1/jvm/quickstart.md)
- [RedisGears Java classes and functions](/content/operate/oss_and_stack/stack-with-enterprise/deprecated-features/gears-v1/jvm/classes/_index.md)
- [RedisGears recipes](/content/operate/oss_and_stack/stack-with-enterprise/deprecated-features/gears-v1/jvm/recipes/_index.md)
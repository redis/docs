---
aliases: /develop/connect/clients/php
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
description: Connect your PHP application to a Redis database
linkTitle: Predis (PHP)
title: Predis guide (PHP)
weight: 8
---

[`Predis`](https://github.com/predis/predis) is the recommended [PHP](https://php.net/)
client for Redis. 
The sections below explain how to install `Predis` and connect your application to a Redis database.

{{< note >}}Although we provide basic documentation for `Predis`, it is a third-party
client library and is not developed or supported directly by Redis.
{{< /note >}}

`Predis` requires a running Redis server. See [here]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis Open Source installation instructions.

## Install

Use [Composer](https://getcomposer.org/) to install the `Predis` library
with the following command line:

```bash
composer require predis/predis
```

## Connect and test

Connect to a locally-running server on the standard port (6379)
with the following code:

{{< clients-example set="landing" step="connect" lang_filter="PHP" >}}
{{< /clients-example >}}

Store and retrieve a simple string to test the connection:

{{< clients-example set="landing" step="set_get_string" lang_filter="PHP" >}}
{{< /clients-example >}}

Store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}})
object:

{{< clients-example set="landing" step="set_get_hash" lang_filter="PHP" >}}
{{< /clients-example >}}

## More information

The [Predis wiki on Github](https://github.com/predis/predis/wiki) has
information about the different connection options you can use.

See also the pages in this section for more information and examples:

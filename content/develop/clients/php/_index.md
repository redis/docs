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

`Predis` requires a running [Redis Community Edition]({{< relref "/operate/oss_and_stack/install/install-stack/" >}}) server.
See [Getting started]({{< relref "/operate/oss_and_stack/install/" >}}) for Redis installation
instructions.

## Install

Use [Composer](https://getcomposer.org/) to install the `Predis` library
with the following command line:

```bash
composer require predis/predis
```

## Connect and test

Connect to a locally-running server on the standard port (6379)
with the following code:

```php
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

$r = new PredisClient([
                'scheme'   => 'tcp',
                'host'     => '127.0.0.1',
                'port'     => 6379,
                'password' => '',
                'database' => 0,
            ]);
```

Store and retrieve a simple string to test the connection:

```php
echo $r->set('foo', 'bar'), PHP_EOL;
// >>> OK

echo $r->get('foo'), PHP_EOL;
// >>> bar
```

Store and retrieve a [hash]({{< relref "/develop/data-types/hashes" >}})
object:

```php
$r->hset('user-session:123', 'name', 'John');
$r->hset('user-session:123', 'surname', 'Smith');
$r->hset('user-session:123', 'company', 'Redis');
$r->hset('user-session:123', 'age', 29);

echo var_export($r->hgetall('user-session:123')), PHP_EOL;
/* >>>
array (
  'name' => 'John',
  'surname' => 'Smith',
  'company' => 'Redis',
  'age' => '29',
)
*/
```

## More information

The [Predis wiki on Github](https://github.com/predis/predis/wiki) has
information about the different connection options you can use.

See also the pages in this section for more information and examples:

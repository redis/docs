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
description: Learn how to use the Redis query engine with JSON
linkTitle: Index and query JSON
title: Example - Index and query JSON documents
weight: 20
---

This example shows how to index and query Redis JSON data using `predis`.

Make sure that you have Redis Community Edition and `predis` installed, as described
in the [Install](#install) section above.

Start by importing dependencies:

```php
<?php

require 'vendor/autoload.php';

use Predis\Client as PredisClient;

use Predis\Command\Argument\Search\AggregateArguments;
use Predis\Command\Argument\Search\CreateArguments;
use Predis\Command\Argument\Search\SearchArguments;
use Predis\Command\Argument\Search\SchemaFields\NumericField;
use Predis\Command\Argument\Search\SchemaFields\TextField;
use Predis\Command\Argument\Search\SchemaFields\TagField;
use Predis\Command\Argument\Search\SchemaFields\VectorField;
```

Connect to the Redis server:

```php
$r = new PredisClient([
                'scheme'   => 'tcp',
                'host'     => '127.0.0.1',
                'port'     => 6379,
                'password' => '',
                'database' => 0,
            ]);
```

Create some test data to add to the database:

```php
$user1 = json_encode([
    'name' => 'Paul John',
    'email' => 'paul.john@example.com',
    'age' => 42,
    'city' => 'London',
], JSON_THROW_ON_ERROR);

$user2 = json_encode([
    'name' => 'Eden Zamir',
    'email' => 'eden.zamir@example.com',
    'age' => 29,
    'city' => 'Tel Aviv',
], JSON_THROW_ON_ERROR);

$user3 = json_encode([
    'name' => 'Paul Zamir',
    'email' => 'paul.zamir@example.com',
    'age' => 35,
    'city' => 'Tel Aviv',
], JSON_THROW_ON_ERROR);
```

Create an
[index]({{< relref "/develop/interact/search-and-query/indexing" >}}).
In this example, only JSON documents with the key prefix `user:` are indexed.
For more information, see
[Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}).

```php
$schema = [
    new TextField('$.name', 'name'),
    new TagField('$.city', 'city'),
    new NumericField('$.age', "age"),
];

try {
$r->ftCreate("idx:users", $schema,
    (new CreateArguments())
        ->on('JSON')
        ->prefix(["user:"]));
}
catch (Exception $e) {
    echo $e->getMessage(), PHP_EOL;
}
```

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

```php
$r->jsonset('user:1', '$', $user1);
$r->jsonset('user:2', '$', $user2);
$r->jsonset('user:3', '$', $user3);
```

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

```php
$res = $r->ftSearch("idx:users", "Paul @age:[30 40]");
echo json_encode($res), PHP_EOL;
// >>> [1,"user:3",["$","{\"name\":\"Paul Zamir\",\"email\":\"paul.zamir@example.com\",\"age\":35,\"city\":\"London\"}"]]
```

Specify query options to return only the `city` field:

```php
$arguments = new SearchArguments();
$arguments->addReturn(3, '$.city', true, 'thecity');
$arguments->dialect(2);
$arguments->limit(0, 5);

$res = $r->ftSearch("idx:users", "Paul", $arguments);

echo json_encode($res), PHP_EOL;
// >>> [2,"user:1",["thecity","London"],"user:3",["thecity","Tel Aviv"]]
```

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

```php
$ftAggregateArguments = (new AggregateArguments())
->groupBy('@city')
->reduce('COUNT', true, 'count');

$res = $r->ftAggregate('idx:users', '*', $ftAggregateArguments);
echo json_encode($res), PHP_EOL;
// >>> [2,["city","London","count","1"],["city","Tel Aviv","count","2"]]
```

See the [Redis query engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.

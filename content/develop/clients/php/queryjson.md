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
description: Learn how to use the Redis query engine with JSON and hash documents.
linkTitle: Index and query documents
title: Index and query documents
scope: example
relatedPages:
- /develop/clients/php/vecsearch
- /develop/ai/search-and-query
topics:
- Redis Query Engine
- JSON
- hash
weight: 20
---

This example shows how to create a
[search index]({{< relref "/develop/ai/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

{{< note >}}From [v3.0.0](https://github.com/predis/predis/releases/tag/v3.0.0) onwards,
`Predis` uses query dialect 2 by default.
Redis query engine methods such as [`ftSearch()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}})
or another Redis server available. Also install the
[`Predis`]({{< relref "/develop/clients/php" >}}) client library if you
haven't already done so.

Add the following dependencies:

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

## Create data

Create some test data to add to your database:

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

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/php/connect" >}})
to learn more about the available connection options.

```php
$r = new PredisClient([
                'scheme'   => 'tcp',
                'host'     => '127.0.0.1',
                'port'     => 6379,
                'password' => '',
                'database' => 0,
            ]);
```

Create an
[index]({{< relref "/develop/ai/search-and-query/indexing" >}}).
In this example, only JSON documents with the key prefix `user:` are indexed.
For more information, see
[Query syntax]({{< relref "/develop/ai/search-and-query/query/" >}}).

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

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them:

```php
$r->jsonset('user:1', '$', $user1);
$r->jsonset('user:2', '$', $user2);
$r->jsonset('user:3', '$', $user3);
```

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/ai/search-and-query/query" >}})
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
[aggregation query]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
to count all users in each city.

```php
$ftAggregateArguments = (new AggregateArguments())
->groupBy('@city')
->reduce('COUNT', true, 'count');

$res = $r->ftAggregate('idx:users', '*', $ftAggregateArguments);
echo json_encode($res), PHP_EOL;
// >>> [2,["city","London","count","1"],["city","Tel Aviv","count","2"]]
```

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must use `HASH` for the `On()` option
when you create the index. The code below shows these changes with
a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples.

```php
$hashSchema = [
    new TextField('name'),
    new TagField('city'),
    new NumericField('age'),
];

try {
$r->ftCreate("hash-idx:users", $hashSchema,
    (new CreateArguments())
        ->on('HASH')
        ->prefix(["huser:"]));
}
catch (Exception $e) {
    echo $e->getMessage(), PHP_EOL;
}
```

You use [`hmset()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`jsonset()`]({{< relref "/commands/json.set" >}}).
Supply the fields as an array directly, without using
[`json_encode()`](https://www.php.net/manual/en/function.json-encode.php).

```php
$r->hmset('huser:1', [
    'name' => 'Paul John',
    'email' => 'paul.john@example.com',
    'age' => 42,
    'city' => 'London',
]);

$r->hmset('huser:2', [
    'name' => 'Eden Zamir',
    'email' => 'eden.zamir@example.com',
    'age' => 29,
    'city' => 'Tel Aviv',
]);

$r->hmset('huser:3', [
    'name' => 'Paul Zamir',
    'email' => 'paul.zamir@example.com',
    'age' => 35,
    'city' => 'Tel Aviv',
]);
```

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
almost the same except that the fields are returned directly in the
result array rather than in a JSON string with `$` as its key:

```php
$res = $r->ftSearch("hash-idx:users", "Paul @age:[30 40]");
echo json_encode($res), PHP_EOL;
// >>> [1,"huser:3",["age","35","city","Tel Aviv","email","paul.zamir@example.com","name","Paul Zamir"]]
```

## More information

See the [Redis query engine]({{< relref "/develop/ai/search-and-query" >}}) docs
for a full description of all query features with examples.

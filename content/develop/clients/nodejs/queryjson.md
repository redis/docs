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
description: Learn how to use the Redis Query Engine with JSON and hash documents.
linkTitle: Index and query documents
title: Index and query documents
weight: 2
---

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) documents and
run queries against the index. It then goes on to show the slight differences
in the equivalent code for [hash]({{< relref "/develop/data-types/hashes" >}})
documents.

{{< note >}}From [v5.0.0](https://github.com/redis/node-redis/releases/tag/redis%405.0.0)
onwards, `node-redis` uses query dialect 2 by default.
Redis query engine methods such as [`ft.search()`]({{< relref "/commands/ft.search" >}})
will explicitly request this dialect, overriding the default set for the server.
See
[Query dialects]({{< relref "/develop/interact/search-and-query/advanced-concepts/dialects" >}})
for more information.
{{< /note >}}

## Initialize

Make sure that you have [Redis Open Source]({{< relref "/operate/oss_and_stack/" >}})
or another Redis server available. Also install the
[`node-redis`]({{< relref "/develop/clients/nodejs" >}}) client library if you
haven't already done so.

Add the following dependencies:

```js
import {
    createClient,
    SCHEMA_FIELD_TYPE,
    FT_AGGREGATE_GROUP_BY_REDUCERS,
    FT_AGGREGATE_STEPS,
} from 'redis';
```

## Create data

Create some test data to add to your database. The example data shown
below is compatible with both JSON and hash objects.

```js
const user1 = {
    name: 'Paul John',
    email: 'paul.john@example.com',
    age: 42,
    city: 'London'
};

const user2 = {
    name: 'Eden Zamir',
    email: 'eden.zamir@example.com',
    age: 29,
    city: 'Tel Aviv'
};

const user3 = {
    name: 'Paul Zamir',
    email: 'paul.zamir@example.com',
    age: 35,
    city: 'Tel Aviv'
};
```

## Add the index

Connect to your Redis database. The code below shows the most
basic connection but see
[Connect to the server]({{< relref "/develop/clients/nodejs/connect" >}})
to learn more about the available connection options.

```js
const client = await createClient();
await client.connect();
```

Create an index. In this example, only JSON documents with the key prefix `user:` are indexed. For more information, see [Query syntax]({{< relref "/develop/interact/search-and-query/query/" >}}).

```js
await client.ft.create('idx:users', {
    '$.name': {
        type: SchemaFieldTypes.TEXT,
        AS: 'name'
    },
    '$.city': {
        type: SchemaFieldTypes.TEXT,
        AS: 'city'
    },
    '$.age': {
        type: SchemaFieldTypes.NUMERIC,
        AS: 'age'
    }
}, {
    ON: 'JSON',
    PREFIX: 'user:'
});
```

## Add the data

Add the three sets of user data to the database as
[JSON]({{< relref "/develop/data-types/json" >}}) objects.
If you use keys with the `user:` prefix then Redis will index the
objects automatically as you add them. Note that placing
the commands in a `Promise.all()` call is an easy way to create a
[pipeline]({{< relref "/develop/clients/nodejs/transpipe" >}}),
which is more efficient than sending the commands individually.

```js
const [user1Reply, user2Reply, user3Reply] = await Promise.all([
    client.json.set('user:1', '$', user1),
    client.json.set('user:2', '$', user2),
    client.json.set('user:3', '$', user3)
]);
```

## Query the data

You can now use the index to search the JSON objects. The
[query]({{< relref "/develop/interact/search-and-query/query" >}})
below searches for objects that have the text "Paul" in any field
and have an `age` value in the range 30 to 40:

```js
let findPaulResult = await client.ft.search('idx:users', 'Paul @age:[30 40]');

console.log(findPaulResult.total); // >>> 1

findPaulResult.documents.forEach(doc => {
    console.log(`ID: ${doc.id}, name: ${doc.value.name}, age: ${doc.value.age}`);
});
```

Specify query options to return only the `city` field:

```js
let citiesResult = await client.ft.search('idx:users', '*',{
    RETURN: 'city'
});

console.log(citiesResult.total); // >>> 3

citiesResult.documents.forEach(cityDoc => {
    console.log(cityDoc.value);
});
```

Use an
[aggregation query]({{< relref "/develop/interact/search-and-query/query/aggregation" >}})
to count all users in each city.

```js
let aggResult = await client.ft.aggregate('idx:users', '*', {
    STEPS: [{
        type: AggregateSteps.GROUPBY,
        properties: '@city',
        REDUCE: [{
            type: AggregateGroupByReducers.COUNT,
            AS: 'count'
        }]
    }]
});

console.log(aggResult.total); // >>> 2

aggResult.results.forEach(result => {
    console.log(`${result.city} - ${result.count}`);
});
```

Finally, close the connection to Redis.

```js
await client.quit();
```

## Differences with hash documents

Indexing for hash documents is very similar to JSON indexing but you
need to specify some slightly different options.

When you create the schema for a hash index, you don't need to
add aliases for the fields, since you use the basic names to access
the fields anyway. Also, you must use `HASH` for the `ON` option
when you create the index. The code below shows these changes with
a new index called `hash-idx:users`, which is otherwise the same as
the `idx:users` index used for JSON documents in the previous examples.

```js
await client.ft.create('hash-idx:users', {
    'name': {
        type: SchemaFieldTypes.TEXT
    },
    'city': {
        type: SchemaFieldTypes.TEXT
    },
    'age': {
        type: SchemaFieldTypes.NUMERIC
    }
}, {
    ON: 'HASH',
    PREFIX: 'huser:'
});
```

You use [`hSet()`]({{< relref "/commands/hset" >}}) to add the hash
documents instead of [`json.set()`]({{< relref "/commands/json.set" >}}),
but the same flat `userX` objects work equally well with either
hash or JSON:

```js
const [huser1Reply, huser2Reply, huser3Reply] = await Promise.all([
    client.hSet('huser:1', user1),
    client.hSet('huser:2', user2),
    client.hSet('huser:3', user3)
]);
```

The query commands work the same here for hash as they do for JSON (but
the name of the hash index is different). The format of the result is
also the same:

```js
let findPaulHashResult = await client.ft.search(
    'hash-idx:users', 'Paul @age:[30 40]'
);

console.log(findPaulHashResult.total); // >>> 1

findPaulHashResult.documents.forEach(doc => {
    console.log(`ID: ${doc.id}, name: ${doc.value.name}, age: ${doc.value.age}`);
});
// >>> ID: huser:3, name: Paul Zamir, age: 35
```

## More information

See the [Redis Query Engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.

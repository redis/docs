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
description: Learn how to use the Redis Query Engine with JSON
linkTitle: Index and query JSON
title: Example - Index and query JSON documents
weight: 2
---

This example shows how to create a
[search index]({{< relref "/develop/interact/search-and-query/indexing" >}})
for [JSON]({{< relref "/develop/data-types/json" >}}) data and
run queries against the index.

Make sure that you have Redis Stack and `node-redis` installed. 

Start by importing dependencies:

```js
import {
    createClient,
    SchemaFieldTypes,
    AggregateGroupByReducers,
    AggregateSteps,
} from 'redis';
```

Connect to the database:

```js
const client = await createClient();
await client.connect();
```

Create some test data to add to the database:

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


See the [Redis Query Engine]({{< relref "/develop/interact/search-and-query" >}}) docs
for a full description of all query features with examples.

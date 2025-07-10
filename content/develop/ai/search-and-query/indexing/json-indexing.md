---
aliases:
- /develop/interact/search-and-query/indexing/json-indexing
- /develop/ai/search-and-query/indexing/json-indexing
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
description: How to create and configure indexes for Redis JSON documents
linkTitle: JSON indexing
title: JSON indexing
weight: 25
---

You can create search indexes for Redis JSON documents to enable fast, flexible queries across your structured data. JSON indexing uses JSONPath expressions to specify which parts of your documents to index, making it ideal for complex, nested data structures.

## Create an index with JSON schema

When you create an index with the [`FT.CREATE`]({{< relref "commands/ft.create/" >}}) command, include the `ON JSON` keyword to index any existing and future JSON documents stored in the database.

To define the `SCHEMA`, you provide [JSONPath]({{< relref "/develop/data-types/json/path" >}}) expressions. The result of each JSONPath expression is indexed and associated with a logical name called an `attribute` (previously known as a `field`). You can use these attributes in queries.

{{% alert title="Note" color="info" %}}
Note: `attribute` is optional for [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).
{{% /alert %}}

Use the following syntax to create a JSON index:

```sql
FT.CREATE {index_name} ON JSON SCHEMA {json_path} AS {attribute} {type}
```

For example, this command creates an index that indexes the name, description, price, and image vector embedding of each JSON document that represents an inventory item:

```sql
127.0.0.1:6379> FT.CREATE itemIdx ON JSON PREFIX 1 item: SCHEMA $.name AS name TEXT $.description as description TEXT $.price AS price NUMERIC $.embedding AS embedding VECTOR FLAT 6 DIM 4 DISTANCE_METRIC L2 TYPE FLOAT32
```

## Add JSON documents

After you create an index, Redis automatically indexes any existing, modified, or newly created JSON documents stored in the database. For existing documents, indexing runs asynchronously in the background, so it can take some time before the document is available. Modified and newly created documents are indexed synchronously, so the document will be available by the time the add or modify command finishes.

You can use any JSON write command, such as [`JSON.SET`]({{< relref "commands/json.set/" >}}) and [`JSON.ARRAPPEND`]({{< relref "commands/json.arrappend/" >}}), to create or modify JSON documents.

The following examples use these JSON documents to represent individual inventory items.

Item 1 JSON document:

```json
{
  "name": "Noise-cancelling Bluetooth headphones",
  "description": "Wireless Bluetooth headphones with noise-cancelling technology",
  "connection": {
    "wireless": true,
    "type": "Bluetooth"
  },
  "price": 99.98,
  "stock": 25,
  "colors": [
    "black",
    "silver"
  ],
  "embedding": [0.87, -0.15, 0.55, 0.03]
}
```

Item 2 JSON document:

```json
{
  "name": "Wireless earbuds",
  "description": "Wireless Bluetooth in-ear headphones",
  "connection": {
    "wireless": true,
    "type": "Bluetooth"
  },
  "price": 64.99,
  "stock": 17,
  "colors": [
    "black",
    "white"
  ],
  "embedding": [-0.7, -0.51, 0.88, 0.14]
}
```

Use [`JSON.SET`]({{< relref "commands/json.set/" >}}) to store these documents in the database:

```sql
127.0.0.1:6379> JSON.SET item:1 $ '{"name":"Noise-cancelling Bluetooth headphones","description":"Wireless Bluetooth headphones with noise-cancelling technology","connection":{"wireless":true,"type":"Bluetooth"},"price":99.98,"stock":25,"colors":["black","silver"],"embedding":[0.87,-0.15,0.55,0.03]}'
"OK"
127.0.0.1:6379> JSON.SET item:2 $ '{"name":"Wireless earbuds","description":"Wireless Bluetooth in-ear headphones","connection":{"wireless":true,"type":"Bluetooth"},"price":64.99,"stock":17,"colors":["black","white"],"embedding":[-0.7,-0.51,0.88,0.14]}'
"OK"
```

Because indexing is synchronous in this case, the documents will be available on the index as soon as the [`JSON.SET`]({{< relref "commands/json.set/" >}}) command returns. Any subsequent queries that match the indexed content will return the document.

## Search the index

To search the index for JSON documents, use the [`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) command. You can search any attribute defined in the `SCHEMA`.

For example, use this query to search for items with the word "earbuds" in the name:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@name:(earbuds)'
1) "1"
2) "item:2"
3) 1) "$"
   2) "{\"name\":\"Wireless earbuds\",\"description\":\"Wireless Bluetooth in-ear headphones\",\"connection\":{\"wireless\":true,\"connection\":\"Bluetooth\"},\"price\":64.99,\"stock\":17,\"colors\":[\"black\",\"white\"],\"embedding\":[-0.7,-0.51,0.88,0.14]}"
```

This query searches for all items that include "bluetooth" and "headphones" in the description:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@description:(bluetooth headphones)'
1) "2"
2) "item:1"
3) 1) "$"
   2) "{\"name\":\"Noise-cancelling Bluetooth headphones\",\"description\":\"Wireless Bluetooth headphones with noise-cancelling technology\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":99.98,\"stock\":25,\"colors\":[\"black\",\"silver\"], \"embedding\":[0.87,-0.15,0.55,0.03]}"
4) "item:2"
5) 1) "$"
   2) "{\"name\":\"Wireless earbuds\",\"description\":\"Wireless Bluetooth in-ear headphones\",\"connection\":{\"wireless\":true,\"connection\":\"Bluetooth\"},\"price\":64.99,\"stock\":17,\"colors\":[\"black\",\"white\"],\"embedding\":[-0.7,-0.51,0.88,0.14]}"
```

Now search for Bluetooth headphones with a price less than 70:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@description:(bluetooth headphones) @price:[0 70]'
1) "1"
2) "item:2"
3) 1) "$"
   2) "{\"name\":\"Wireless earbuds\",\"description\":\"Wireless Bluetooth in-ear headphones\",\"connection\":{\"wireless\":true,\"connection\":\"Bluetooth\"},\"price\":64.99,\"stock\":17,\"colors\":[\"black\",\"white\"],\"embedding\":[-0.7,-0.51,0.88,0.14]}"
```

For more information about search queries, see [Search query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}).

{{% alert title="Note" color="info" %}}
[`FT.SEARCH`]({{< relref "commands/ft.search/" >}}) queries require `attribute` modifiers. Don't use JSONPath expressions in queries because the query parser doesn't fully support them.
{{% /alert %}}

## Index JSON objects

You cannot index JSON objects directly. FT.CREATE will return an error if the JSONPath expression returns an object.

To index the contents of a JSON object, you need to index the individual elements within the object as separate attributes.

For example, to index the `connection` JSON object, define the `$.connection.wireless` and `$.connection.type` fields as separate attributes when you create the index:

```sql
127.0.0.1:6379> FT.CREATE itemIdx3 ON JSON SCHEMA $.connection.wireless AS wireless TAG $.connection.type AS connectionType TEXT
"OK"
```

After you create the new index, you can search for items with the wireless TAG set to `true`:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx3 '@wireless:{true}'
1) "2"
2) "item:2"
3) 1) "$"
   2) "{\"name\":\"Wireless earbuds\",\"description\":\"Wireless Bluetooth in-ear headphones\",\"connection\":{\"wireless\":true,\"connection\":\"Bluetooth\"},\"price\":64.99,\"stock\":17,\"colors\":[\"black\",\"white\"]}"
4) "item:1"
5) 1) "$"
   2) "{\"name\":\"Noise-cancelling Bluetooth headphones\",\"description\":\"Wireless Bluetooth headphones with noise-cancelling technology\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":99.98,\"stock\":25,\"colors\":[\"black\",\"silver\"]}"
```

You can also search for items with a Bluetooth connection type:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx3 '@connectionType:(bluetooth)'
1) "2"
2) "item:1"
3) 1) "$"
   2) "{\"name\":\"Noise-cancelling Bluetooth headphones\",\"description\":\"Wireless Bluetooth headphones with noise-cancelling technology\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":99.98,\"stock\":25,\"colors\":[\"black\",\"silver\"]}"
4) "item:2"
5) 1) "$"
   2) "{\"name\":\"Wireless earbuds\",\"description\":\"Wireless Bluetooth in-ear headphones\",\"connection\":{\"wireless\":true,\"type\":\"Bluetooth\"},\"price\":64.99,\"stock\":17,\"colors\":[\"black\",\"white\"]}"
```

## Index missing or empty values

As of v2.10, you can search for missing properties, that is, properties that do not exist in a given document, using the `INDEXMISSING` option to `FT.CREATE` in conjunction with the `ismissing` query function with `FT.SEARCH`. You can also search for existing properties with no value (i.e., empty) using the `INDEXEMPTY` option with `FT.CREATE`. Both query types require DIALECT 2. Examples below:

```
JSON.SET key:1 $ '{"propA": "foo"}'
JSON.SET key:2 $ '{"propA": "bar", "propB":"abc"}'
FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.propA AS propA TAG $.propB AS propB TAG INDEXMISSING

> FT.SEARCH idx 'ismissing(@propB)' DIALECT 2
1) "1"
2) "key:1"
3) 1) "$"
   2) "{\"propA\":\"foo\"}"
```

```
JSON.SET key:1 $ '{"propA": "foo", "propB":""}'
JSON.SET key:2 $ '{"propA": "bar", "propB":"abc"}'
FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.propA AS propA TAG $.propB AS propB TAG INDEXEMPTY

> FT.SEARCH idx '@propB:{""}' DIALECT 2
1) "1"
2) "key:1"
3) 1) "$"
   2) "{\"propA\":\"foo\",\"propB\":\"\"}"
```

## Next steps

- For advanced JSON array indexing techniques, see [JSON arrays]({{< relref "/develop/ai/search-and-query/indexing/json-arrays" >}})
- For field projection and search techniques, see [Search techniques]({{< relref "/develop/ai/search-and-query/indexing/search-techniques" >}})
- Learn about available field types on the [Field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) page

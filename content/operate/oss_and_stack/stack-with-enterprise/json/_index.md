---
Title: JSON
alwaysopen: false
categories:
- docs
- operate
- stack
description: Redis Open Source adds support for JSON to Redis databases.
hideListLinks: true
linkTitle: JSON
toc: 'true'
weight: 30
---

Redis Open Source adds support for the [JSON data structure](http://www.json.org/) to Redis databases.

Applications developed with the [source available version of RedisJSON](https://github.com/RedisJSON/RedisJSON) are 100%
compatible with Redis Enterprise databases with JSON enabled.

## JSON paths

[Paths]({{< relref "/develop/data-types/json/path" >}}) let you traverse the structure of a JSON document, starting from the root, and interact only with the data you want. You can also use paths to perform operations on specific JSON elements.

Since there is no standard for JSON path syntax, Redis Open Source implements its own.

### JSONPath syntax

RedisJSON v2.0 and later support the [JSONPath syntax]({{< relref "/develop/data-types/json/path" >}}), which resembles [Goessner's design](https://goessner.net/articles/JsonPath/):
  
  - Paths start with a dollar sign (`$`), which represents the root of the JSON document.

  - See the [JSONPath syntax table]({{< relref "/develop/data-types/json/path" >}}) to learn how to access various elements within a JSON document.

The following path refers to `headphones`, which is a child of `inventory` under the root:

`$.inventory.headphones`
  
See [JSONPath examples]({{< relref "/develop/data-types/json/path" >}}) for examples with more complex syntax.

### Legacy path syntax

The [legacy path syntax]({{< relref "/develop/data-types/json/path" >}}#legacy-path-syntax) refers to the path implementation in RedisJSON v1. RedisJSON v2 still supports this legacy path syntax in addition to JSONPath syntax.

The legacy path syntax works as follows:

  - A period character represents the root.
  
  - For paths to the root's children, it is optional to prefix the path with a period.

  - Supports both dot notation and bracket notation for JSON object key access.
  
The following paths refer to `headphones`, which is a child of `inventory` under the root:

`.inventory.headphones`
 
`inventory["headphones"]`

`['inventory']["headphones"]`

### Key name rules

You can only use the legacy path syntax to access JSON keys if they follow these name syntax rules:

- Key names must begin with a letter, a dollar sign (`$`), or an underscore (`_`).
- Key names can contain letters, digits, dollar signs, and underscores.
- Key names are case-sensitive.

## Index and search JSON documents

You can index, search, and query stored JSON documents.

For more information about how to search and query JSON documents, see the [quick start]({{< relref "/develop/get-started/document-database" >}}).

## JSON in Active-Active databases

RedisJSON v2.2 and later support the JSON data structure as a conflict-free replicated data type [(CRDT)](https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type) in [Active-Active Redis Enterprise databases]({{< relref "/operate/rs/databases/active-active" >}}).

For details about how Redis Enterprise resolves JSON operation conflicts that can arise when replicas attempt to sync, see the JSON [conflict resolution rules]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json/active-active#conflict-resolution-rules" >}}).

## More info

- [JSON quick start]({{< relref "/develop/data-types/json/" >}}#use-redisjson)
- [JSON commands]({{< relref "/operate/oss_and_stack/stack-with-enterprise/json/commands" >}})
- [RedisJSON source](https://github.com/RedisJSON/RedisJSON)

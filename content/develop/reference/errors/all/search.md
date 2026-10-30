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
description: Every error message that Redis Search returns in Redis 8.10
linkTitle: Redis Search
title: Redis Search errors
weight: 3
---

These are the error messages of [Redis Search](/content/develop/ai/search-and-query/_index.md) commands, such as `FT.CREATE`, `FT.SEARCH`, and `FT.AGGREGATE`. Most of them start with an error code that begins with `SEARCH_`, such as `SEARCH_INDEX_NOT_FOUND` or `SEARCH_SYNTAX`. A description follows the code. Some messages have no code, and [Messages without a code](#messages-without-a-code) lists them.

A few messages never come back as the reply to a command. Instead, [`FT.INFO`](/content/commands/ft.info.md) shows them as the last error that happened while indexing a document.

{{< error-catalog module="search" summary="true" >}}

## Query syntax

### SEARCH_SYNTAX

Redis Search couldn't parse the query string of `FT.SEARCH`, `FT.AGGREGATE`, or a similar command, or the arguments of `FT.HYBRID`. Many messages give the position of the problem, as an offset, and the text near it. A message such as `Expected a TAG field` means that the query uses the syntax of one field type on a field of another type. To fix it, check the query at that position for a typo, a missing parenthesis or bracket, or a special character that needs escaping. For the syntax, see [Query syntax](/content/develop/ai/search-and-query/advanced-concepts/query_syntax.md).

{{< error-catalog module="search" code="SEARCH_SYNTAX" >}}

### SEARCH_QUERY_STRING_BAD

No command in Redis 8.10 returns this code. Its default message is `Bad query string`. Most errors in the query string return [`SEARCH_SYNTAX`](#search_syntax) instead.

### SEARCH_KEYWORD

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't handle a keyword in the query.

### SEARCH_FIELD_MISSING_REQ

No command in Redis 8.10 returns this code. When a query uses `ismissing()` on a field that wasn't defined with `INDEXMISSING`, you get [`SEARCH_SYNTAX`](#search_syntax) instead. To fix that error, add `INDEXMISSING` to the field when you create the index.

### SEARCH_ORDER_OPTION_BAD

The query uses `SLOP` or `INORDER` on a JSON text field whose JSONPath can return several values, for example a path with a wildcard. The order of those values isn't defined, so Redis Search can't apply `SLOP` or `INORDER` to them. To fix it, remove `SLOP` and `INORDER` from the query, or search only fields whose path leads to a single value or a single array. See [Index JSON arrays as TEXT](/content/develop/ai/search-and-query/indexing/_index.md#index-json-arrays-as-text).

{{< error-catalog module="search" code="SEARCH_ORDER_OPTION_BAD" >}}

### SEARCH_PARAM_NOT_FOUND

The query uses a parameter, such as `$p`, that isn't defined in `PARAMS`. To fix it, add the parameter to `PARAMS`, or correct its name in the query.

{{< error-catalog module="search" code="SEARCH_PARAM_NOT_FOUND" >}}

### SEARCH_NO_RESULTS

No command in Redis 8.10 returns this code. A query that matches no documents returns an empty result, not an error.

### SEARCH_BUILD_PLAN

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't build a plan for the query.

## Command arguments

### SEARCH_PARSE_ARGS

Redis Search couldn't parse the arguments of the command. This code covers more messages than any other, from many commands. The description after the code says which argument is wrong and why. Many descriptions start with the name of the argument, such as `LIMIT: Not enough arguments were provided`. To fix it, compare that argument with the syntax on the command's page, such as [`FT.SEARCH`](/content/commands/ft.search.md) or [`FT.CREATE`](/content/commands/ft.create.md).

{{< error-catalog module="search" code="SEARCH_PARSE_ARGS" >}}

### SEARCH_ARG_UNRECOGNIZED

The command has an argument that Redis Search doesn't recognize. Most messages show the argument, and some also give its position. To fix it, check the spelling and the order of the arguments against the syntax on the command's page.

{{< error-catalog module="search" code="SEARCH_ARG_UNRECOGNIZED" >}}

### SEARCH_ADD_ARGS

Redis Search couldn't parse some arguments of `FT.CREATE`, of the older `FT.ADD` command, or of `PARAMS` in a query. In `FT.CREATE`, these are the options for the documents of the index, such as `ON`, `SCORE`, `LANGUAGE`, and `INDEXALL`. In `PARAMS`, the parameters must come in name and value pairs. To fix it, correct the argument that the message describes.

{{< error-catalog module="search" code="SEARCH_ADD_ARGS" >}}

### SEARCH_OPTION_INVALID

Redis Search doesn't recognize the name of an option or an attribute. `Invalid attribute` refers to a query attribute, such as `$weight` in `(foo bar) => { $weight: 2.0; }`. `Invalid option` refers to a parameter of `FT.CONFIG SET`, or to a parameter of a vector query. To fix it, check the name for typos. For the attributes that you can use, see [Query attributes](/content/develop/ai/search-and-query/advanced-concepts/query_attributes.md).

{{< error-catalog module="search" code="SEARCH_OPTION_INVALID" >}}

### SEARCH_OPTION_BAD

The option that you used isn't available in the current mode. With `FT.CONFIG SET`, the message `Not modifiable at runtime` means that you can set the parameter only when Redis starts. To fix it, set the parameter in the Redis configuration file, and then restart Redis.

{{< error-catalog module="search" code="SEARCH_OPTION_BAD" >}}

### SEARCH_ATTR_BAD

An argument names a field, or gives a value, that this operation doesn't accept. For example, `FT.TAGVALS` needs the name of a `TAG` field in the index, and the `COUNT` reducer doesn't take arguments. To fix it, check the name and type of the field with [`FT.INFO`](/content/commands/ft.info.md), or remove the extra arguments.

{{< error-catalog module="search" code="SEARCH_ATTR_BAD" >}}

### SEARCH_VALUE_BAD

A value in your command, in a configuration parameter, or in a document isn't valid. The description after the code says which value. Examples are an unknown policy for `ON_TIMEOUT` in `FT.CONFIG SET`, a geoshape that Redis Search can't parse, or a JSON array with a value that isn't a string in a `TAG` field. To fix it, correct the value that the description names.

{{< error-catalog module="search" code="SEARCH_VALUE_BAD" >}}

### SEARCH_NUMERIC_VALUE_INVALID

Redis Search expected a number, but the value isn't one. You get this error for a query parameter that the query uses as a number, such as the number of neighbors in a K nearest neighbors (KNN) vector query. You also get it for an arithmetic operation in `APPLY`, and for the value of a `NUMERIC` field in a hash. To fix it, check the value that the message shows.

{{< error-catalog module="search" code="SEARCH_NUMERIC_VALUE_INVALID" >}}

### SEARCH_PARAM_DUP

A vector query, or a clause of `FT.HYBRID`, gives the same parameter twice, such as `K` or `EF_RUNTIME`. To fix it, give each parameter only once. When a name appears twice in `PARAMS`, you get [`SEARCH_ADD_ARGS`](#search_add_args) instead.

{{< error-catalog module="search" code="SEARCH_PARAM_DUP" >}}

### SEARCH_FIELD_DUP

Two fields or properties in your command have the same name. For example, two `REDUCE` steps in a `GROUPBY` use the same `AS` name, or a vector query sets its distance field twice. To fix it, give each one a different name.

{{< error-catalog module="search" code="SEARCH_FIELD_DUP" >}}

### SEARCH_QUERY_BAD

Redis Search found a problem when it checked your query against the index, or when it checked a new index definition. The description after the code says what's wrong. For example, the query names a language or a scorer that doesn't exist, or the query vector has a different size than the vector field expects. Messages that mention a disk index only come from an index that uses Redis Flex. To fix it, correct the part of the command that the description names.

{{< error-catalog module="search" code="SEARCH_QUERY_BAD" >}}

## Indexes

### SEARCH_INDEX_NOT_FOUND

The index that you named doesn't exist. With `FT.ALIASADD` and `FT.ALIASUPDATE`, the name must be an index, not an alias. To fix it, check the name for typos. To see the names of all indexes, run [`FT._LIST`](/content/commands/ft._list.md).

{{< error-catalog module="search" code="SEARCH_INDEX_NOT_FOUND" >}}

### SEARCH_INDEX_EXISTS

An index or an alias with that name already exists. `FT.CREATE` returns `Index already exists`, and `FT.ALIASADD` returns `Alias already exists`. A query can also return this code when it gives a vector distance field the name of a field in the index. To fix it, choose a name that isn't in use yet.

{{< error-catalog module="search" code="SEARCH_INDEX_EXISTS" >}}

### SEARCH_ALIAS_CONFLICT

`FT.ALIASADD` or `FT.ALIASUPDATE` can't create the alias because an index already has that name. To fix it, choose an alias name that no index uses.

{{< error-catalog module="search" code="SEARCH_ALIAS_CONFLICT" >}}

### SEARCH_INDEX_DROPPED_BG

The index was dropped after Redis Search accepted the query, but before the query ran. With `FT.CURSOR READ`, the index was dropped while the cursor was idle. To fix it, check that the index exists, create it again if you need it, and then run the query again.

{{< error-catalog module="search" code="SEARCH_INDEX_DROPPED_BG" >}}

### SEARCH_PATH_BAD

A field in `FT.CREATE` or `FT.ALTER` has a JSONPath that Redis Search can't parse. The message shows the path, the field, and the index. To fix it, correct the syntax of the path, for example a missing closing bracket.

{{< error-catalog module="search" code="SEARCH_PATH_BAD" >}}

## Documents

Redis Search indexes a document when you write it with a command such as `HSET` or `JSON.SET`. If Redis Search can't index the document, that command still succeeds. Redis Search leaves the document out of the index, and `FT.INFO` shows the message as the `last indexing error`.

### SEARCH_DOC_NOT_FOUND

Redis Search couldn't find a document that the command needs. With the older `FT.ADD` command, you get `Document does not exist` when you use the `NOCREATE` option and no document has that key. To fix it, add the document without `NOCREATE`.

{{< error-catalog module="search" code="SEARCH_DOC_NOT_FOUND" >}}

### SEARCH_DOCUMENT_EXISTS

`FT.ADD` found an existing document with the same key, and you didn't use the `REPLACE` option. To fix it, add `REPLACE` to update the document, or use a different key.

{{< error-catalog module="search" code="SEARCH_DOCUMENT_EXISTS" >}}

### SEARCH_DOCUMENT_NOT_ADDED

`FT.ADD` didn't update the document because the condition of its `IF` option wasn't true. In this case, `FT.ADD` replies with [`NOADD`](#noadd) instead of this message.

{{< error-catalog module="search" code="SEARCH_DOCUMENT_NOT_ADDED" >}}

### NOADD

`FT.ADD` didn't add or update the document because the condition of its `IF` option wasn't true for the existing document. A condition that uses a field that the document doesn't have also counts as not true. This reply means that the command didn't change anything, not that it failed. If you expected the document to change, check the `IF` condition.

{{< error-catalog module="search" code="NOADD" >}}

### SEARCH_REDIS_KEY_TYPE_BAD

The key exists but doesn't hold a hash, so Redis Search can't use it as a document. You get this error from `FT.ADD` when the key holds another type of value, such as a string. To fix it, use a different key, or delete the existing key first.

{{< error-catalog module="search" code="SEARCH_REDIS_KEY_TYPE_BAD" >}}

### SEARCH_TYPE_UNSUP

Redis Search found a value of a type that it doesn't support at that point. The description after the code says which value. For example, `Unsupported reply type` means that, in a cluster, `FT.HYBRID` got a reply of an unexpected type from a shard.

{{< error-catalog module="search" code="SEARCH_TYPE_UNSUP" >}}

### SEARCH_JSON_TYPE_INVALID

A value in a JSON document has a JSON type that the field can't index. For example, a `NUMERIC` field needs a JSON number, and a JSON boolean can only be indexed as a `TAG` field. In these messages, `GEOMETRY` means a `GEOSHAPE` field. To fix it, change the value in the document, or change the type of the field in the index schema.

{{< error-catalog module="search" code="SEARCH_JSON_TYPE_INVALID" >}}

### SEARCH_GEO_COORDINATES_INVALID

A `GEO` field in a document has a longitude or a latitude outside the valid range. The longitude must be from -180 to 180 degrees, and the latitude from -85.05112878 to 85.05112878 degrees. The message shows the longitude first, then the latitude. To fix it, correct the value in the document, and check that the longitude comes first.

{{< error-catalog module="search" code="SEARCH_GEO_COORDINATES_INVALID" >}}

### SEARCH_GEO_FORMAT_BAD

No command in Redis 8.10 returns this code. Its default message says that a geo value must have the format `lon lat` or `lon,lat`. A geo value in another format returns [`SEARCH_PARSE_ARGS`](#search_parse_args) with `Invalid geo string` instead.

### SEARCH_VECTOR_BLOB_SIZE_MISMATCH

A vector that you stored in a hash has a different size, in bytes, than the vector field expects. The expected size is the number of dimensions (`DIM`) times the size of one element of the field's `TYPE`, such as 4 bytes for `FLOAT32`. To fix it, store the vector with the `TYPE` and the number of dimensions of the field.

{{< error-catalog module="search" code="SEARCH_VECTOR_BLOB_SIZE_MISMATCH" >}}

### SEARCH_VECTOR_LEN_BAD

A vector in a JSON document has a different number of elements than the `DIM` of the vector field. The message shows both numbers. To fix it, store the vector with exactly `DIM` elements.

{{< error-catalog module="search" code="SEARCH_VECTOR_LEN_BAD" >}}

## Aggregations

### SEARCH_PROP_NOT_FOUND

A step of `FT.AGGREGATE`, or a `SORTBY`, uses a property that isn't available at that point. A property is available when it's a field of the index, when you load it with `LOAD`, or when an earlier step creates it, for example with `APPLY` and `AS`. To fix it, check the name, load the property with `LOAD`, or move the step after the one that creates the property.

{{< error-catalog module="search" code="SEARCH_PROP_NOT_FOUND" >}}

### SEARCH_VALUE_NOT_FOUND

An `APPLY` or `FILTER` expression uses a property that has no value in one of the results, for example because the document doesn't have that field. To fix it, check that the property exists first with the `exists()` function, as the message suggests. See [APPLY expressions](/content/develop/ai/search-and-query/advanced-concepts/aggregations.md#apply-expressions).

{{< error-catalog module="search" code="SEARCH_VALUE_NOT_FOUND" >}}

### SEARCH_EXPR

Redis Search couldn't parse or evaluate an expression, such as the expression of `APPLY` or `FILTER` in `FT.AGGREGATE`, or the `FILTER` of an index in `FT.CREATE`. The message describes the problem, such as an unknown function, the wrong number of arguments, or a syntax error and its position. To fix it, correct the expression. See [APPLY expressions](/content/develop/ai/search-and-query/advanced-concepts/aggregations.md#apply-expressions).

{{< error-catalog module="search" code="SEARCH_EXPR" >}}

### SEARCH_REDUCER_NOT_FOUND

A `REDUCE` step in a `GROUPBY` names a reducer that doesn't exist. To fix it, check the name of the reducer. See [Supported GROUPBY reducers](/content/develop/ai/search-and-query/advanced-concepts/aggregations.md#supported-groupby-reducers).

{{< error-catalog module="search" code="SEARCH_REDUCER_NOT_FOUND" >}}

### SEARCH_REDUCER_ERROR

No command in Redis 8.10 returns this code. Its default message is `Generic reducer error`. Errors in the arguments of a reducer return [`SEARCH_PARSE_ARGS`](#search_parse_args) instead.

### SEARCH_REDUCER_INIT_FAILED

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't initialize a reducer.

### SEARCH_AGG_PLAN

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't plan the aggregation request.

### SEARCH_CONSTRUCT_PIPELINE

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't build the pipeline of steps that runs the query.

### SEARCH_CURSOR_ALLOC_FAILED

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't create a cursor. When an index already has too many cursors, you get [`SEARCH_LIMIT_OVER`](#search_limit_over) instead.

## Vector and hybrid queries

In this section, a hybrid query has two meanings. In the parameters of a vector query, such as `HYBRID_POLICY`, it's a vector query with a filter. The [`FT.HYBRID`](/content/commands/ft.hybrid.md) command is a different thing. It combines a full-text search with a vector search.

### SEARCH_HYBRID_POLICY_BAD

The `HYBRID_POLICY` parameter of a vector query has a value that Redis Search doesn't know. To fix it, use `BATCHES` or `ADHOC_BF`. See [Filter mode](/content/develop/ai/search-and-query/vectors/_index.md#filter-mode).

{{< error-catalog module="search" code="SEARCH_HYBRID_POLICY_BAD" >}}

### SEARCH_HYBRID_ATTR_NON_HYBRID

A vector query without a filter, such as `*=>[KNN 10 @v $vec]`, uses a parameter that only applies to a query with a filter, such as `HYBRID_POLICY` or `BATCH_SIZE`. To fix it, remove the parameter, or add a filter to the query.

{{< error-catalog module="search" code="SEARCH_HYBRID_ATTR_NON_HYBRID" >}}

### SEARCH_ADHOC_BATCH_SIZE_IRRELEVANT

A vector query sets `BATCH_SIZE` and also sets `HYBRID_POLICY` to `ADHOC_BF`. The batch size only applies to the `BATCHES` policy. To fix it, remove `BATCH_SIZE`, or use `HYBRID_POLICY BATCHES`.

{{< error-catalog module="search" code="SEARCH_ADHOC_BATCH_SIZE_IRRELEVANT" >}}

### SEARCH_ADHOC_EF_RUNTIME_IRRELEVANT

A vector query sets `EF_RUNTIME` and also sets `HYBRID_POLICY` to `ADHOC_BF`. With `ADHOC_BF`, Redis Search computes the distance to every vector that passes the filter, so `EF_RUNTIME` has no effect. To fix it, remove `EF_RUNTIME`, or don't set `HYBRID_POLICY` to `ADHOC_BF`.

{{< error-catalog module="search" code="SEARCH_ADHOC_EF_RUNTIME_IRRELEVANT" >}}

### SEARCH_RANGE_ATTR_NON_RANGE

A vector query that isn't a range query uses a parameter that only applies to range queries, such as `EPSILON`. To fix it, remove the parameter, or use a range query with `VECTOR_RANGE`.

{{< error-catalog module="search" code="SEARCH_RANGE_ATTR_NON_RANGE" >}}

### SEARCH_VECTOR_NOT_ALLOWED

`FT.HYBRID` found a vector expression, such as `KNN`, where it isn't allowed. The query of the `SEARCH` clause and the `FILTER` of the `VSIM` clause can't contain vector expressions. To fix it, put the vector search in the `VSIM` clause only.

{{< error-catalog module="search" code="SEARCH_VECTOR_NOT_ALLOWED" >}}

### SEARCH_WEIGHT_NOT_ALLOWED

The `FILTER` of the `VSIM` clause in `FT.HYBRID` sets a weight with the `$weight` query attribute. This filter only selects documents and doesn't affect scores, so it can't have a weight. To fix it, remove `$weight` from the filter.

{{< error-catalog module="search" code="SEARCH_WEIGHT_NOT_ALLOWED" >}}

### SEARCH_SAFE_DEPLETER_FAILURE

`FT.HYBRID` couldn't lock the index to collect the results of its subqueries in the background. This can happen when a write to the index is in progress. To fix it, run the query again.

{{< error-catalog module="search" code="SEARCH_SAFE_DEPLETER_FAILURE" >}}

## Resources and limits

### SEARCH_LIMIT_OVER

A value in your command is over a limit of Redis Search, or the command would take the index or the server over one. The description after the code says which limit, and often gives its maximum. Some limits are configuration parameters, such as [`search-max-search-results`](/content/develop/ai/search-and-query/administration/configuration.md#search-max-search-results) for the `LIMIT` of `FT.SEARCH`. To fix it, use a smaller value, or raise the limit if it's a configuration parameter.

{{< error-catalog module="search" code="SEARCH_LIMIT_OVER" >}}

### SEARCH_TIMEOUT

The query ran longer than its timeout. The timeout is the `TIMEOUT` argument of the query, or the `search-timeout` configuration parameter if the query has no `TIMEOUT`. You get this error when the policy of [`search-on-timeout`](/content/develop/ai/search-and-query/administration/configuration.md#search-on-timeout) is `FAIL`. With the other policies, Redis returns the results that it found before the timeout. To fix it, make the query match fewer documents, or give it more time with `TIMEOUT`.

{{< error-catalog module="search" code="SEARCH_TIMEOUT" >}}

### SEARCH_OOM

Redis was out of memory (OOM) when the query started, so Redis Search didn't run the query. Out of memory means that Redis used more memory than its `maxmemory` limit. You get this error when the policy of [`search-on-oom`](/content/develop/ai/search-and-query/administration/configuration.md#search-on-oom) is `FAIL`. To fix it, free up memory or increase `maxmemory`.

{{< error-catalog module="search" code="SEARCH_OOM" >}}

### SEARCH_INDEX_BG_OOM_FAIL

When you create an index, or change it with `FT.ALTER`, Redis Search indexes the existing keys in a background scan. This scan stopped because Redis ran out of memory. After that, the index doesn't index new documents either, and `FT.INFO` shows this message as the `last indexing error`. To fix it, free up memory or increase `maxmemory`, and then drop the index and create it again.

{{< error-catalog module="search" code="SEARCH_INDEX_BG_OOM_FAIL" >}}

## Clusters

### ERRCLUSTER

You only get this error in a cluster. Redis Search doesn't have the list of shards in the cluster yet, so it can't send the command to them. To fix it, wait until the cluster is ready, and then run the command again.

{{< error-catalog module="search" code="ERRCLUSTER" >}}

### SEARCH_CLUSTER_NO_RESPONSES

You only get this error in a cluster. `FT.INFO` sent the request to the shards, but no shard replied. To fix it, check that the shards are running and reachable, and then run the command again.

{{< error-catalog module="search" code="SEARCH_CLUSTER_NO_RESPONSES" >}}

### SEARCH_SLOTS_UNAVAIL

You only get this error in a cluster. A shard got a query for hash slots that it doesn't have at the moment, for example while slots move to another shard. To fix it, run the query again when the slot migration is over.

{{< error-catalog module="search" code="SEARCH_SLOTS_UNAVAIL" >}}

### SEARCH_INDEX_MISMATCH

You only get this error in a cluster. On one of the shards, the index has different key prefixes than the index that the query was sent for. This can happen when the index is created again with other prefixes while the query runs. To fix it, run the query again. If the error continues, check that the index has the same definition on every shard.

{{< error-catalog module="search" code="SEARCH_INDEX_MISMATCH" >}}

### SEARCH_DIST_FAILED

No command in Redis 8.10 returns this code. Its default message says that Redis Search couldn't distribute the operation to the shards. When a command can't reach the shards, the message is `Could not distribute command` or `Could not send query to cluster` instead.

## Redis Flex and disk indexes

Some of these messages call an index that uses Redis Flex a disk index.

### SEARCH_FLEX_LIMIT_NUMBER_OF_INDEXES

You only get this error when you create an index that uses Redis Flex. The database already has as many indexes as Redis Flex allows. To fix it, drop an index that you no longer need with [`FT.DROPINDEX`](/content/commands/ft.dropindex.md).

{{< error-catalog module="search" code="SEARCH_FLEX_LIMIT_NUMBER_OF_INDEXES" >}}

### SEARCH_FLEX_UNSUPPORTED_FIELD

You only get this error from an index that uses Redis Flex. The schema in `FT.CREATE` has a field type that Redis Flex doesn't support, such as `GEO` or `GEOSHAPE`. To fix it, remove that field from the schema.

{{< error-catalog module="search" code="SEARCH_FLEX_UNSUPPORTED_FIELD" >}}

### SEARCH_FLEX_UNSUPPORTED_FT_CREATE_ARGUMENT

You only get this error from an index that uses Redis Flex. `FT.CREATE` has an argument that Redis Flex doesn't support, and the message names it. To fix it, remove that argument.

{{< error-catalog module="search" code="SEARCH_FLEX_UNSUPPORTED_FT_CREATE_ARGUMENT" >}}

### SEARCH_FLEX_UNSUPPORTED_QUERY

You only get this error from an index that uses Redis Flex. The query uses a kind of `TAG` query that Redis Flex doesn't support, such as a prefix, suffix, or wildcard match, and the message names it. To fix it, rewrite the query without that kind of match.

{{< error-catalog module="search" code="SEARCH_FLEX_UNSUPPORTED_QUERY" >}}

### SEARCH_FLEX_UNSUPPORTED_ARGUMENT

You only get this error from an index that uses Redis Flex. The command uses an argument that Redis Flex doesn't support, such as `HIGHLIGHT`, `SLOP`, or `WITHCURSOR`, or a `SORTBY` that doesn't sort by vector distance. The same code covers `FT.SEARCH` and `FT.AGGREGATE` inside a `MULTI`/`EXEC` transaction or a Lua script. To fix it, remove the argument that the message names. In a transaction or a script, follow the advice in the message, or run the command outside it.

{{< error-catalog module="search" code="SEARCH_FLEX_UNSUPPORTED_ARGUMENT" >}}

### SEARCH_FLEX_SEARCH_LOAD_UNSUPPORTED

No command in Redis 8.10 returns this code. Its default message says that Redis Flex doesn't support `LOAD`.

### SEARCH_FLEX_SEARCH_NOCONTENT_OR_RETURN_0_REQUIRED

No command in Redis 8.10 returns this code. Its default message says that `FT.SEARCH` needs `NOCONTENT` or `RETURN 0` in Redis Flex. In Redis 8.10, an `FT.SEARCH` that returns fields inside a transaction or a script gets [`SEARCH_FLEX_UNSUPPORTED_ARGUMENT`](#search_flex_unsupported_argument) instead, with the same advice.

### SEARCH_DISK_CREATION

You only get this error from an index that uses Redis Flex. `FT.CREATE` couldn't create or open the disk storage for the new index. This points to a problem on the server rather than in your command.

{{< error-catalog module="search" code="SEARCH_DISK_CREATION" >}}

### SEARCH_DISK_ITERATOR_CREATION

You only get this error from an index that uses Redis Flex. While it ran the query, Redis Search couldn't start reading the values of a `NUMERIC` field from disk. The description after the code is the error that the disk storage reported.

{{< error-catalog module="search" code="SEARCH_DISK_ITERATOR_CREATION" >}}

## Other codes

### SEARCH_GENERIC

This is the general code for errors that have no more specific code. Its messages cover unrelated problems, such as a failure to index a document, a failure to reach the shards of a cluster, or an internal error while a query runs. The description after the code says what went wrong. `FT.ALIASADD` and `FT.ALIASUPDATE` also use this code for the permission error that other commands return as [`NOPERM`](#noperm).

{{< error-catalog module="search" code="SEARCH_GENERIC" >}}

### ERR

Redis Search uses the general `ERR` code for a few errors. `ERR wrong number of arguments` means that the command has too few or too many arguments. `ERR CONFIG SET failed` means that a `search-` configuration parameter doesn't accept the value that you gave to [`CONFIG SET`](/content/commands/config-set.md). Messages with `Internal error` or `with no context` point to a problem inside Redis Search, not in your command. To fix the other errors, compare your command with the syntax on its command page.

{{< error-catalog module="search" code="ERR" >}}

### NOPERM

Your user's access control list (ACL) rules don't allow access to all the keys that the index covers. Redis Search checks that the user can access keys with every prefix of the index. If the index has no `PREFIX`, the user needs access to all keys. To fix it, give the user access to the prefixes of the index, for example with [`ACL SETUSER`](/content/commands/acl-setuser.md) and a key pattern such as `~<prefix>*`.

{{< error-catalog module="search" code="NOPERM" >}}

### WRONGTYPE

The key that you passed to `FT.SUGADD`, `FT.SUGGET`, `FT.SUGDEL`, or `FT.SUGLEN` holds another type of value, not a suggestion dictionary. To fix it, use a different key for the suggestions, or check the type of the key with [`TYPE`](/content/commands/type.md).

{{< error-catalog module="search" code="WRONGTYPE" >}}

## Messages without a code

These messages don't start with an error code. Their first word is an ordinary word, such as `Alias`, `Cursor`, or `DISTANCE`. Clients and [`INFO errorstats`](/content/commands/info.md) treat that first word as the code.

{{< error-catalog module="search" others="true" >}}

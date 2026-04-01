---
linkTitle: The RedisVL CLI
title: The RedisVL CLI
url: '/develop/ai/redisvl/0.9.1/overview/cli/'
---


RedisVL is a Python library with a dedicated CLI to help load and create vector search indices within Redis.

This notebook will walk through how to use the Redis Vector Library CLI (``rvl``).

Before running this notebook, be sure to
1. Have installed ``redisvl`` and have that environment active for this notebook.
2. Have a running Redis instance with the Search and Query capability


```python
# First, see if the rvl tool is installed
!rvl version
```

    11:20:38 [RedisVL] INFO   RedisVL version 0.8.2


## Commands
Here's a table of all the rvl commands and options. We'll go into each one in detail below.

| Command       | Options                  | Description |
|---------------|--------------------------|-------------|
| `rvl version` |                          | display the redisvl library version|
| `rvl index`   | `create --schema` or `-s <schema.yaml>`| create a redis index from the specified schema file|
| `rvl index`   | `listall`                | list all the existing search indices|
| `rvl index`   | `info --index` or ` -i <index_name>`   | display the index definition in tabular format|
| `rvl index`   | `delete --index` or `-i <index_name>` | remove the specified index, leaving the data still in Redis|
| `rvl index`   | `destroy --index` or `-i <index_name>`| remove the specified index, as well as the associated data|
| `rvl stats`   | `--index` or `-i <index_name>`        | display the index statistics, including number of docs, average bytes per record, indexing time, etc|
| `rvl stats`   | `--schema` or `-s <schema.yaml>`        | display the index statistics of a schema defined in <schema.yaml>. The index must have already been created within Redis|

## Index

The ``rvl index`` command can be used for a number of tasks related to creating and managing indices. Whether you are working in Python or another language, this cli tool can still be useful for managing and inspecting your indices.

First, we will create an index from a yaml schema that looks like the following:



```python
%%writefile schema.yaml

version: '0.1.0'

index:
    name: vectorizers
    prefix: doc
    storage_type: hash

fields:
    - name: sentence
      type: text
    - name: embedding
      type: vector
      attrs:
        dims: 768
        algorithm: flat
        distance_metric: cosine
```

    Overwriting schema.yaml



```python
# Create an index from a yaml schema
!rvl index create -s schema.yaml
```

    12:42:45 [RedisVL] INFO   Index created successfully



```python
# list the indices that are available
!rvl index listall
```

    12:42:47 [RedisVL] INFO   Indices:
    12:42:47 [RedisVL] INFO   1. vectorizers



```python
# inspect the index fields
!rvl index info -i vectorizers
```

    
    
    Index Information:
    ╭───────────────┬───────────────┬───────────────┬───────────────┬───────────────╮
    │ Index Name    │ Storage Type  │ Prefixes      │ Index Options │ Indexing      │
    ├───────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
    | vectorizers   | HASH          | ['doc']       | []            | 0             |
    ╰───────────────┴───────────────┴───────────────┴───────────────┴───────────────╯
    Index Fields:
    ╭─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────────╮
    │ Name            │ Attribute       │ Type            │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │ Field Option    │ Option Value    │
    ├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────────┤
    │ sentence        │ sentence        │ TEXT            │ WEIGHT          │ 1               │                 │                 │                 │                 │                 │                 │
    │ embedding       │ embedding       │ VECTOR          │ algorithm       │ FLAT            │ data_type       │ FLOAT32         │ dim             │ 768             │ distance_metric │ COSINE          │
    ╰─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────────╯



```python
# delete an index without deleting the data within it
!rvl index delete -i vectorizers
```

    12:42:54 [RedisVL] INFO   Index deleted successfully



```python
# see the indices that still exist
!rvl index listall
```

    12:42:56 [RedisVL] INFO   Indices:


## Stats

The ``rvl stats`` command will return some basic information about the index. This is useful for checking the status of an index, or for getting information about the index to use in other commands.


```python
# create a new index with the same schema
# recreating the index will reindex the documents
!rvl index create -s schema.yaml
```

    12:42:59 [RedisVL] INFO   Index created successfully



```python
# list the indices that are available
!rvl index listall
```

    12:43:01 [RedisVL] INFO   Indices:
    12:43:01 [RedisVL] INFO   1. vectorizers



```python
# see all the stats for the index
!rvl stats -i vectorizers
```

    
    Statistics:
    ╭─────────────────────────────┬────────────╮
    │ Stat Key                    │ Value      │
    ├─────────────────────────────┼────────────┤
    │ num_docs                    │ 0          │
    │ num_terms                   │ 0          │
    │ max_doc_id                  │ 0          │
    │ num_records                 │ 0          │
    │ percent_indexed             │ 1          │
    │ hash_indexing_failures      │ 0          │
    │ number_of_uses              │ 1          │
    │ bytes_per_record_avg        │ nan        │
    │ doc_table_size_mb           │ 0          │
    │ inverted_sz_mb              │ 0          │
    │ key_table_size_mb           │ 0          │
    │ offset_bits_per_record_avg  │ nan        │
    │ offset_vectors_sz_mb        │ 0          │
    │ offsets_per_term_avg        │ nan        │
    │ records_per_doc_avg         │ nan        │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 0          │
    │ total_inverted_index_blocks │ 0          │
    │ vector_index_sz_mb          │ 0.00818634 │
    ╰─────────────────────────────┴────────────╯


## Optional arguments
You can modify these commands with the below optional arguments

| Argument       | Description | Default |
|----------------|-------------|---------|
| `-u --url`     | The full Redis URL to connect to | `redis://localhost:6379` |
| `--host`       | Redis host to connect to | `localhost` |
| `-p --port`    | Redis port to connect to. Must be an integer | `6379` |
| `--user`       | Redis username, if one is required   | `default` |
| `--ssl`        | Boolean flag indicating if ssl is required. If set the Redis base url changes to `rediss://` | None |
| `-a --password`| Redis password, if one is required| `""` |

### Choosing your Redis instance
By default rvl first checks if you have `REDIS_URL` environment variable defined and tries to connect to that. If not, it then falls back to `localhost:6379`, unless you pass the `--host` or `--port` arguments


```python
# specify your Redis instance to connect to
!rvl index listall --host localhost --port 6379
```

    12:43:06 [RedisVL] INFO   Indices:
    12:43:06 [RedisVL] INFO   1. vectorizers


### Using SSL encryption
If your Redis instance is configured to use SSL encryption then set the `--ssl` flag.
You can similarly specify the username and password to construct the full Redis URL


```python
# connect to rediss://jane_doe:password123@localhost:6379
!rvl index listall --user jane_doe -a password123 --ssl
```


```python
!rvl index destroy -i vectorizers
```

    12:43:09 [RedisVL] INFO   Index deleted successfully


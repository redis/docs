---
linkTitle: The RedisVL CLI
title: The RedisVL CLI
aliases:
- /integrate/redisvl/user_guide/cli
---


RedisVL is a Python library with a dedicated CLI to create, inspect, list, and delete Redis search indexes, inspect index statistics, and run the RedisVL MCP server.

This notebook will walk through how to use the Redis Vector Library CLI (``rvl``).

Before running this notebook, be sure to
1. Have installed ``redisvl`` and have that environment active for this notebook.
2. Have a running Redis instance with Redis Search enabled

For complete command syntax and options, see the CLI Reference.


```python
# First, see if the rvl tool is installed
!rvl version
```

## Commands
The table below documents the current CLI tree. Use ``rvl index --help`` and ``rvl stats --help`` for detailed flag help and examples.

| Command | Purpose |
|---------|---------|
| `rvl version` | display the installed RedisVL version |
| `rvl index create` | create a new Redis search index from a schema YAML file |
| `rvl index info` | display schema and storage details for an index |
| `rvl index listall` | list Redis search indexes available on the target Redis deployment |
| `rvl index delete` | delete an index while leaving indexed data in Redis |
| `rvl index destroy` | delete an index and drop its indexed data |
| `rvl stats` | display statistics for an existing Redis search index |
| `rvl mcp` | run the RedisVL MCP server |

Within data-plane commands, ``-i`` or ``--index`` targets an existing Redis index name and ``-s`` or ``--schema`` points to a schema YAML file. Shared Redis connection options such as ``--url``, ``--host``, and ``--port`` apply to ``rvl index`` and ``rvl stats``.

## Index

The ``rvl index`` command groups the index management workflows. Use ``rvl index --help`` to see the documented subcommands: ``create``, ``info``, ``listall``, ``delete``, and ``destroy``. Whether you are working in Python or another language, this CLI can still be useful for managing and inspecting your indexes.

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

    Index created successfully



```python
# list the indices that are available
!rvl index listall
```

    Indices:
    1. vectorizers



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

    Index deleted successfully



```python
# see the indices that still exist
!rvl index listall
```

    Indices:


## Stats

The ``rvl stats`` command returns basic information about an index. Use ``-i`` or ``--index`` to target an existing Redis index name, or ``-s`` or ``--schema`` to target a schema-defined index. Shared Redis connection options such as ``--url``, ``--host``, and ``--port`` also apply here.


```python
# create a new index with the same schema
# recreating the index will reindex the documents
!rvl index create -s schema.yaml
```

    Index created successfully



```python
# list the indices that are available
!rvl index listall
```

    Indices:
    1. vectorizers



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
    │ doc_table_size_mb           │ 0.00769805 │
    │ inverted_sz_mb              │ 0          │
    │ key_table_size_mb           │ 2.28881835 │
    │ offset_bits_per_record_avg  │ nan        │
    │ offset_vectors_sz_mb        │ 0          │
    │ offsets_per_term_avg        │ nan        │
    │ records_per_doc_avg         │ nan        │
    │ sortable_values_size_mb     │ 0          │
    │ total_indexing_time         │ 0          │
    │ total_inverted_index_blocks │ 0          │
    │ vector_index_sz_mb          │ 0          │
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

    Indices:
    1. vectorizers


### Using SSL encryption
If your Redis instance is configured to use SSL encryption then set the `--ssl` flag.
You can similarly specify the username and password to construct the full Redis URL


```python
# NBVAL_SKIP
# Not run in CI. This cell would block until the nbval cell timeout
# connect to rediss://jane_doe:password123@localhost:6379
!rvl index listall --user jane_doe -a password123 --ssl
```


```python
!rvl index destroy -i vectorizers
```

    Index deleted successfully


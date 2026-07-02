---
linkTitle: The RedisVL CLI
title: The RedisVL CLI
url: '/develop/ai/redisvl/0.20.1/user_guide/cli/'
---


RedisVL is a Python library with a dedicated CLI to create, inspect, list, migrate, and delete Redis search indexes, inspect index statistics, and run the RedisVL MCP server.

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
| `rvl migrate wizard` | interactively build a migration plan and schema patch (experimental) |
| `rvl migrate plan` | generate `migration_plan.yaml` from a patch or target schema (experimental) |
| `rvl migrate apply` | execute a reviewed `drop_recreate` migration (experimental) |
| `rvl migrate validate` | validate a completed migration and emit report artifacts (experimental) |
| `rvl migrate rollback` | restore original vector bytes from a migration backup (experimental) |
| `rvl migrate batch-plan` | generate a batch plan for multiple indexes (experimental) |
| `rvl migrate batch-apply` | execute a batch migration with checkpoint state (experimental) |
| `rvl migrate batch-resume` | resume an interrupted batch migration (experimental) |
| `rvl migrate batch-status` | inspect batch migration checkpoint state (experimental) |

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


## Migrate

The ``rvl migrate`` command provides a full workflow for changing index schemas without losing data. Common use cases include vector quantization (float32 → float16), algorithm changes (HNSW → FLAT), and adding/removing fields.

```bash
# List available indexes
rvl index listall --url redis://localhost:6379

# Build a migration plan interactively
rvl migrate wizard --index myindex --url redis://localhost:6379

# Or generate from a schema patch file
rvl migrate plan --index myindex --schema-patch patch.yaml --url redis://localhost:6379

# Apply with backup and multi-worker quantization
rvl migrate apply --plan migration_plan.yaml --url redis://localhost:6379 \
  --backup-dir /tmp/backups --workers 4 --batch-size 500

# Validate the result
rvl migrate validate --plan migration_plan.yaml --url redis://localhost:6379
```

See the [Migration Guide]({{< relref "how_to_guides/migrate-indexes" >}}) for detailed usage, performance tuning, and examples.

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

# NBVAL_SKIP
# Not run in CI. This cell would block until the nbval cell timeout
# connect to rediss://jane_doe:password123@localhost:6379
!rvl index listall --user jane_doe -a password123 --ssl


```python
# connect to rediss://jane_doe:password123@localhost:6379
!rvl index listall --user jane_doe -a password123 --ssl
```

    Index deleted successfully



```python
!rvl index destroy -i vectorizers
```

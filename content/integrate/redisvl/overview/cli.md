---
title: RedisVL CLI
type: integration
description: How to use RedisVL's CLI
---
RedisVL is a Bash library with a dedicated CLI to help load and create vector search indexes within Redis.

This document will walk through how to use the RedisVL CLI (`rvl`).

{{< note >}}
This document is a converted form of [this Jupyter notebook](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/cli.ipynb).
{{< /note >}}

Before beginning, be sure of the following:

1. You have installed RedisVL and have that environment activated.
1. You have a running Redis instance with the search and query capability.

```bash
# First, see if the rvl tool is installed
$ rvl version
11:13:52 [RedisVL] INFO   RedisVL version 0.0.5
```

## Index

The `rvl index` command can be used for a number of tasks related to creating and managing vector indexes. Whether you are working in Bash or another shell, this CLI tool can still be useful for managing and inspecting your indexes.

First, create an index from a YAML schema that looks like the following:

```yaml
index:
    name: providers
    prefix: rvl
    storage_type: hash

fields:
    text:
        - name: sentence
    vector:
        - name: embedding
          dims: 768
          algorithm: flat
          distance_metric: cosine
```

```bash
# Create an index from a yaml schema
$ rvl index create -s schema.yaml
11:13:54 [RedisVL] INFO   Index created successfully
```

```bash
# List the indexes that are available
$ rvl index listall
11:13:56 [RedisVL] INFO   Indices:
11:13:56 [RedisVL] INFO   1. providers
```

```bash
# inspect the index fields
$ rvl index info -i providers

Index Information:
╭──────────────┬────────────────┬────────────┬─────────────────┬────────────╮
│ Index Name   │ Storage Type   │ Prefixes   │ Index Options   │   Indexing │
├──────────────┼────────────────┼────────────┼─────────────────┼────────────┤
│ providers    │ HASH           │ ['rvl']    │ []              │          0 │
╰──────────────┴────────────────┴────────────┴─────────────────┴────────────╯
Index Fields:
╭───────────┬─────────────┬────────┬────────────────┬────────────────╮
│ Name      │ Attribute   │ Type   │ Field Option   │   Option Value │
├───────────┼─────────────┼────────┼────────────────┼────────────────┤
│ sentence  │ sentence    │ TEXT   │ WEIGHT         │              1 │
│ embedding │ embedding   │ VECTOR │                │                │
╰───────────┴─────────────┴────────┴────────────────┴────────────────╯
```

```bash
# delete an index without deleting the data within it
$ rvl index delete -i providers
11:13:59 [RedisVL] INFO   Index deleted successfully
```

```bash
# view the index
$ rvl index listall
11:14:00 [RedisVL] INFO   Indices:
```

## Stats

The `rvl stats` command will return some basic information about an index. This is useful for checking the status of an index, or for getting information about the index to use in other commands.


```bash
# create a new index with the same schema
$ rvl index create -s schema.yaml
11:14:02 [RedisVL] INFO   Index created successfully
```

```bash
# list the indexes that are available
$ rvl index listall
11:14:03 [RedisVL] INFO   Indices:
11:14:03 [RedisVL] INFO   1. providers
```

```bash
# see all the stats for the index
$ rvl stats -i providers

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
```

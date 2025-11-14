---
acl_categories:
- '@search'
arguments:
- name: index
  type: string
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
command_flags:
- readonly
complexity: O(1)
description: Returns information and statistics on the index
group: search
hidden: false
linkTitle: FT.INFO
module: Search
since: 1.0.0
stack_path: docs/interact/search-and-query
summary: Returns information and statistics on the index
syntax: FT.INFO index
syntax_fmt: FT.INFO index
syntax_str: ''
title: FT.INFO
---

Returns information and statistics about a given index.

## Required arguments

`index`
<br />
is the name of the given index. You must first create the index using [`FT.CREATE`]({{< relref "commands/ft.create/" >}}).

## Returned values

### General

| Return field name | Definition |
|:---               |:---        |
| `index_name` | The index name that was defined when index was created. |
| `index_options` | The index options selected during `FT.CREATE` such as `FILTER {filter}`, `LANGUAGE {default_lang}`, etc. |
| `index_definition` | Includes `key_type`, hash or JSON; `prefixes`, if any; and `default_score`. |
| `attributes` | The index schema field names, types, and attributes. |
| `num_docs` | The number of documents. |
| `max_doc_id` | The maximum document ID. |
| `num_terms` | The number of distinct terms. |
| `num_records` | The total number of records. |

### Various size statistics

| Statistic | Definition |
|:---       |:---        |
| `inverted_sz_mb` | The memory used by the inverted index, which is the core data structure used for searching in RediSearch. The size is given in megabytes. |
| `vector_index_sz_mb` | The memory used by the vector index, which stores any vectors associated with each document. |
| `total_inverted_index_blocks` | The total number of blocks in the inverted index. |
| `offset_vectors_sz_mb` | The memory used by the offset vectors, which store positional information for terms in documents. |
| `doc_table_size_mb` | The memory used by the document table, which contains metadata about each document in the index. |
| `sortable_values_size_mb` | The memory used by sortable values, which are values associated with documents and used for sorting purposes. |
| `key_table_size_mb` | The memory used by the key table, which stores the mapping between document IDs and Redis keys. |
| `geoshapes_sz_mb` | The memory used by GEO-related fields. |
| `records_per_doc_avg` | The average number of records (including deletions) per document. |
| `bytes_per_record_avg` | The average size of each record in bytes. |
| `offsets_per_term_avg` | The average number of offsets (position information) per term. |
| `offset_bits_per_record_avg` | The average number of bits used for offsets per record. |
| `tag_overhead_sz_mb` | The size of the TAG index structures used for optimising performance. |
| `text_overhead_sz_mb` | The size of the TEXT index structures used for optimising performance. |
| `total_index_memory_sz_mb` | The total memory consumed by all indexes in the DB. |

### Indexing-related statistics

| Statistic | Definition |
|:---       |:---        |
| `hash_indexing_failures` | The number of failures encountered during indexing. |
| `total_indexing_time` | The total time taken for indexing in seconds. |
| `indexing` | Indicates whether the index is currently being generated. |
| `percent_indexed` | The percentage of the index that has been successfully generated (1 means 100%). |
| `number_of_uses` | The number of times the index has been used. |
| `cleaning` | The index deletion flag. A value of `1` indicates index deletion is in progress. |

### Garbage collection statistics

| Statistic | Definition |
|:---       |:---        |
| `bytes_collected` | The number of bytes collected during garbage collection. |
| `total_ms_run` | The total time in milliseconds spent on garbage collection. |
| `total_cycles` | The total number of garbage collection cycles. |
| `average_cycle_time_ms` | The average time in milliseconds for each garbage collection cycle. The value `nan` indicates that the average cycle time is not available. |
| `last_run_time_ms` | The time in milliseconds taken by the last garbage collection run. |

The next two GC-related fields are relevant in scenarios where simultaneous changes occurred in the same memory area for both the parent process and the child process, resulting in the parent discarding these changes.

| Statistic | Definition |
|:---       |:---        |
| `gc_numeric_trees_missed` | The number of numeric tree nodes whose changes were discarded due to splitting by the parent process during garbage collection. |
| `gc_blocks_denied` | The number of blocks whose changes were discarded (skipped) because they were modified by the parent process during the garbage collection. Notably, as inverted index blocks are append-only, only the last block of an inverted index can be skipped. |

### Cursor statistics

| Statistic | Definition |
|:---       |:---        |
| `global_idle` | The number of idle cursors in the system. |
| `global_total` | The total number of cursors in the system. |
| `index_capacity` | The maximum number of cursors allowed per index. |
| `index_total` | The total number of cursors open on the index. |

### Other statistics

- Dialect statistics: the number of times the index was searched using each DIALECT, 1 - 4.
- Index error statistics, including `indexing failures`, `last indexing error`, and `last indexing error key`.
- Field statistics, including `indexing failures`, `last indexing error`, and `last indexing error key` for each schema field.

## Example

<details open>
<summary><b>Return statistics about an index</b></summary>

{{< highlight bash >}}
127.0.0.1:6379> ft.info idx:bicycle
 1) index_name
 2) idx:bicycle
 3) index_options
 4) (empty array)
 5) index_definition
 6) 1) key_type
    2) JSON
    3) prefixes
    4) 1) bicycle:
    5) default_score
    6) "1"
 7) attributes
 8) 1) 1) identifier
       2) $.pickup_zone
       3) attribute
       4) pickup_zone
       5) type
       6) GEOSHAPE
       7) coord_system
       8) SPHERICAL
    2) 1) identifier
       2) $.store_location
       3) attribute
       4) store_location
       5) type
       6) GEO
    3) 1) identifier
       2) $.brand
       3) attribute
       4) brand
       5) type
       6) TEXT
       7) WEIGHT
       8) "1"
    4) 1) identifier
       2) $.model
       3) attribute
       4) model
       5) type
       6) TEXT
       7) WEIGHT
       8) "1"
    5) 1) identifier
       2) $.description
       3) attribute
       4) description
       5) type
       6) TEXT
       7) WEIGHT
       8) "1"
    6) 1) identifier
       2) $.price
       3) attribute
       4) price
       5) type
       6) NUMERIC
    7) 1) identifier
       2) $.condition
       3) attribute
       4) condition
       5) type
       6) TAG
       7) SEPARATOR
       8) ,
 9) num_docs
10) "10"
11) max_doc_id
12) "10"
13) num_terms
14) "546"
15) num_records
16) "692"
17) inverted_sz_mb
18) "0.003993034362792969"
19) vector_index_sz_mb
20) "0"
21) total_inverted_index_blocks
22) "551"
23) offset_vectors_sz_mb
24) "7.047653198242188e-4"
25) doc_table_size_mb
26) "7.152557373046875e-4"
27) sortable_values_size_mb
28) "0"
29) key_table_size_mb
30) "3.0422210693359375e-4"
31) geoshapes_sz_mb
32) "0.00426483154296875"
33) records_per_doc_avg
34) "69.19999694824219"
35) bytes_per_record_avg
36) "6.0505781173706055"
37) offsets_per_term_avg
38) "1.0679190158843994"
39) offset_bits_per_record_avg
40) "8"
41) hash_indexing_failures
42) "0"
43) total_indexing_time
44) "4.539999961853027"
45) indexing
46) "0"
47) percent_indexed
48) "1"
49) number_of_uses
50) (integer) 1
51) cleaning
52) (integer) 0
53) gc_stats
54)  1) bytes_collected
     2) "0"
     3) total_ms_run
     4) "0"
     5) total_cycles
     6) "0"
     7) average_cycle_time_ms
     8) "nan"
     9) last_run_time_ms
    10) "0"
    11) gc_numeric_trees_missed
    12) "0"
    13) gc_blocks_denied
    14) "0"
55) cursor_stats
56) 1) global_idle
    2) (integer) 0
    3) global_total
    4) (integer) 0
    5) index_capacity
    6) (integer) 128
    7) index_total
    8) (integer) 0
57) dialect_stats
58) 1) dialect_1
    2) (integer) 0
    3) dialect_2
    4) (integer) 0
    5) dialect_3
    6) (integer) 0
    7) dialect_4
    8) (integer) 0
59) Index Errors
60) 1) indexing failures
    2) (integer) 0
    3) last indexing error
    4) N/A
    5) last indexing error key
    6) "N/A"
61) field statistics
62) 1) 1) identifier
       2) $.pickup_zone
       3) attribute
       4) pickup_zone
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
    2) 1) identifier
       2) $.store_location
       3) attribute
       4) store_location
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
    3) 1) identifier
       2) $.brand
       3) attribute
       4) brand
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
    4) 1) identifier
       2) $.model
       3) attribute
       4) model
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
    5) 1) identifier
       2) $.description
       3) attribute
       4) description
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
    6) 1) identifier
       2) $.price
       3) attribute
       4) price
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
    7) 1) identifier
       2) $.condition
       3) attribute
       4) condition
       5) Index Errors
       6) 1) indexing failures
          2) (integer) 0
          3) last indexing error
          4) N/A
          5) last indexing error key
          6) "N/A"
{{< / highlight >}}
</details>

## Redis Enterprise and Redis Cloud compatibility

| Redis<br />Enterprise | Redis Cloud<br />Flexible & Annual | Redis Cloud<br />Free & Fixed | <span style="min-width: 9em; display: table-cell">Notes</span> |
|:----------------------|:-----------------|:-----------------|:------|
| <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</span> | <span title="Supported">&#x2705; Supported</nobr></span> |  |

## Return information

{{< multitabs id="ft-info-return-info" 
    tab1="RESP2" 
    tab2="RESP3" >}}

One of the following:
* [Array]({{< relref "/develop/reference/protocol-spec#arrays" >}}) of key-value pairs containing index information and statistics.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index.

-tab-sep-

One of the following:
* [Map]({{< relref "/develop/reference/protocol-spec#maps" >}}) containing index information and statistics as key-value pairs.
* [Simple error reply]({{< relref "/develop/reference/protocol-spec#simple-errors" >}}) in these cases: no such index.

{{< /multitabs >}}

## See also

[`FT.CREATE`]({{< relref "commands/ft.create/" >}}) | [`FT.SEARCH`]({{< relref "commands/ft.search/" >}})

## Related topics

[RediSearch]({{< relref "/develop/ai/search-and-query/" >}})

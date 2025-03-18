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
description: Introduction to Redis vector sets
linkTitle: Vector sets
title: Redis Vector sets
weight: 55
---

Vector sets are a data type similar to sorted sets, but having string elements that are associated with a vector instead of a score.
Vector sets allow you to add items to a set, and then either:

* Retrieve a subset of items that are the most similar to a specified vector, or
* Retrieve a subset of items that are the most similar to the vector of an element that is already part of the vector set.

Vector sets also provide for optional filtered search capabilities. It is possible to associate attributes to all or to a subset of elements in the set, and then, using the `FILTER` option of the `VSIM` command, to ask for items similar to a given vector but also passing a filter specified as a simple mathematical expression (Like `".year > 1950"` or similar). This means that **you can have vector similarity and scalar filters at the same time**.

## Installation

Build with:

    make

Then load the module with the following command line, or by inserting the needed directives in the `redis.conf` file.

    ./redis-server --loadmodule vset.so

To run tests, I suggest using this:

    ./redis-server --save "" --enable-debug-command yes

The execute the tests with:

    ./test.py

## Reference of available commands

**VADD: add items into a vector set**

    VADD key [REDUCE dim] FP32|VALUES vector element [CAS] [NOQUANT | Q8 | BIN]
             [EF build-exploration-factor] [SETATTR <attributes>] [M <numlinks>]

Add a new element into the vector set specified by the key.
The vector can be provided as FP32 blob of values, or as floating point
numbers as strings, prefixed by the number of elements (3 in the example):

    VADD mykey VALUES 3 0.1 1.2 0.5 my-element

Meaning of the options:

`REDUCE` implements random projection, in order to reduce the
dimensionality of the vector. The projection matrix is saved and reloaded
along with the vector set.

`CAS` performs the operation partially using threads, in a
check-and-set style. The neighbor candidates collection, which is slow, is
performed in the background, while the command is executed in the main thread.

`NOQUANT` forces the vector to be created (in the first VADD call to a given key) without integer 8 quantization, which is otherwise the default.

`BIN` forces the vector to use binary quantization instead of int8. This is much faster and uses less memory, but has impacts on the recall quality.

`Q8` forces the vector to use signed 8 bit quantization. This is the default, and the option only exists in order to make sure to check at insertion time if the vector set is of the same format.

`EF` plays a role in the effort made to find good candidates when connecting the new node to the existing HNSW graph. The default is 200. Using a larger value, may help to have a better recall. To improve the recall it is also possible to increase `EF` during `VSIM` searches.

`SETATTR` associates attributes to the newly created entry or update the entry attributes (if it already exists). It is the same as calling the `VSETATTR` attribute separately, so please check the documentation of that command in the filtered search section of this documentation.

`M` defaults to 16 and is the HNSW famous `M` parameters. It is the maximum number of connections that each node of the graph have with other nodes: more connections mean more memory, but a better ability to explore the graph. Nodes at layer zero (every node exists at least at layer zero) have `M*2` connections, while the other layers only have `M` connections. This means that, for instance, an `M` of 64 will use at least 1024 bytes of memory for each node! That is, `64 links * 2 times * 8 bytes pointers`, and even more, since on average each node has something like 1.33 layers (but the other layers have just `M` connections, instead of `M*2`). If you don't have a recall quality problem, the default is fine, and uses a limited amount of memory.

**VSIM: return elements by vector similarity**

    VSIM key [ELE|FP32|VALUES] <vector or element> [WITHSCORES] [COUNT num] [EF search-exploration-factor] [FILTER expression] [FILTER-EF max-filtering-effort] [TRUTH]

The command returns similar vectors, for simplicity (and verbosity) in the following example, instead of providing a vector using FP32 or VALUES (like in `VADD`), we will ask for elements having a vector similar to a given element already in the sorted set:

    > VSIM word_embeddings ELE apple
     1) "apple"
     2) "apples"
     3) "pear"
     4) "fruit"
     5) "berry"
     6) "pears"
     7) "strawberry"
     8) "peach"
     9) "potato"
    10) "grape"

It is possible to specify a `COUNT` and also to get the similarity score (from 1 to 0, where 1 is identical, 0 is opposite vector) between the query and the returned items.

    > VSIM word_embeddings ELE apple WITHSCORES COUNT 3
    1) "apple"
    2) "0.9998867657923256"
    3) "apples"
    4) "0.8598527610301971"
    5) "pear"
    6) "0.8226882219314575"

The `EF` argument is the exploration factor: the higher it is, the slower the command becomes, but the better the index is explored to find nodes that are near to our query. Sensible values are from 50 to 1000.

The `TRUTH` option forces the command to perform a linear scan of all the entries inside the set, without using the graph search inside the HNSW, so it returns the best matching elements (the perfect result set) that can be used in order to easily calculate the recall. Of course the linear scan is `O(N)`, so it is much slower than the `log(N)` (considering a small `COUNT`) provided by the HNSW index.

For `FILTER` and `FILTER-EF` options, please check the filtered search section of this documentation.

**VDIM: return the dimension of the vectors inside the vector set**

    VDIM keyname

Example:

    > VDIM word_embeddings
    (integer) 300

Note that in the case of vectors that were populated using the `REDUCE`
option, for random projection, the vector set will report the size of
the projected (reduced) dimension. Yet the user should perform all the
queries using full-size vectors.

**VCARD: return the number of elements in a vector set**

    VCARD key

Example:

    > VCARD word_embeddings
    (integer) 3000000


**VREM: remove elements from vector set**

    VREM key element

Example:

    > VADD vset VALUES 3 1 0 1 bar
    (integer) 1
    > VREM vset bar
    (integer) 1
    > VREM vset bar
    (integer) 0

VREM does not perform thumstone / logical deletion, but will actually reclaim
the memory from the vector set, so it is save to add and remove elements
in a vector set in the context of long running applications that continuously
update the same index.

**VEMB: return the approximated vector of an element**

    VEMB key element

Example:

    > VEMB word_embeddings SQL
      1) "0.18208661675453186"
      2) "0.08535309880971909"
      3) "0.1365649551153183"
      4) "-0.16501599550247192"
      5) "0.14225517213344574"
      ... 295 more elements ...

Because vector sets perform insertion time normalization and optional
quantization, the returned vector could be approximated. `VEMB` will take
care to de-quantized and de-normalize the vector before returning it.

It is possible to ask VEMB to return raw data, that is, the interal representation used by the vector: fp32, int8, or a bitmap for binary quantization. This behavior is triggered by the `RAW` option of of VEMB:

    VEMB word_embedding apple RAW

In this case the return value of the command is an array of three or more elements:
1. The name of the quantization used, that is one of: "fp32", "bin", "q8".
2. The a string blob containing the raw data, 4 bytes fp32 floats for fp32, a bitmap for binary quants, or int8 bytes array for q8 quants.
3. A float representing the l2 of the vector before normalization. You need to multiply by this vector if you want to de-normalize the value for any reason.

For q8 quantization, an additional elements is also returned: the quantization
range, so the integers from -127 to 127 represent (normalized) components
in the range `-range`, `+range`.

**VLINKS: introspection command that shows neighbors for a node**

    VLINKS key element [WITHSCORES]

The command reports the neighbors for each level.

**VINFO: introspection command that shows info about a vector set**

    VINFO key

Example:

    > VINFO word_embeddings
     1) quant-type
     2) int8
     3) vector-dim
     4) (integer) 300
     5) size
     6) (integer) 3000000
     7) max-level
     8) (integer) 12
     9) vset-uid
    10) (integer) 1
    11) hnsw-max-node-uid
    12) (integer) 3000000

**VSETATTR: associate or remove the JSON attributes of elements**

    VSETATTR key element "{... json ...}"

Each element of a vector set can be optionally associated with a JSON string
in order to use the `FILTER` option of `VSIM` to filter elements by scalars
(see the filtered search section for more information). This command can set,
update (if already set) or delete (if you set to an empty string) the
associated JSON attributes of an element.

The command returns 0 if the element or the key don't exist, without
raising an error, otherwise 1 is returned, and the element attributes
are set or updated.

**VGETATTR: retrieve the JSON attributes of elements**

    VGETATTR key element

The command returns the JSON attribute associated with an element, or
null if there is no element associated, or no element at all, or no key.

# Filtered search

Each element of the vector set can be associated with a set of attributes specified as a JSON blob:

    > VADD vset VALUES 3 1 1 1 a SETATTR '{"year": 1950}'
    (integer) 1
    > VADD vset VALUES 3 -1 -1 -1 b SETATTR '{"year": 1951}'
    (integer) 1

Specifying an attribute with the `SETATTR` option of `VADD` is exactly equivalent to adding an element and then setting (or updating, if already set) the attributes JSON string. Also the symmetrical `VGETATTR` command returns the attribute associated to a given element.

    > VAD vset VALUES 3 0 1 0 c
    (integer) 1
    > VSETATTR vset c '{"year": 1952}'
    (integer) 1
    > VGETATTR vset c
    "{\"year\": 1952}"

At this point, I may use the FILTER option of VSIM to only ask for the subset of elements that are verified by my expression:

    > VSIM vset VALUES 3 0 0 0 FILTER '.year > 1950'
    1) "c"
    2) "b"

The items will be returned again in order of similarity (most similar first), but only the items with the year field matching the expression is returned.

The expressions are similar to what you would write inside the `if` statement of JavaScript or other familiar programming languages: you can use `and`, `or`, the obvious math operators like `+`, `-`, `/`, `>=`, `<`, ... and so forth (see the expressions section for more info). The selectors of the JSON object attributes start with a dot followed by the name of the key inside the JSON objects.

Elements with invalid JSON or not having a given specified field **are considered as not matching** the expression, but will not generate any error at runtime.

I'll draft the missing sections for the README following the style and format of the existing content.

## FILTER expressions capabilities

FILTER expressions allow you to perform complex filtering on vector similarity results using a JavaScript-like syntax. The expression is evaluated against each element's JSON attributes, with only elements that satisfy the expression being included in the results.

### Expression Syntax

Expressions support the following operators and capabilities:

1. **Arithmetic operators**: `+`, `-`, `*`, `/`, `%` (modulo), `**` (exponentiation)
2. **Comparison operators**: `>`, `>=`, `<`, `<=`, `==`, `!=`
3. **Logical operators**: `and`/`&&`, `or`/`||`, `!`/`not`
4. **Containment operator**: `in`
5. **Parentheses** for grouping: `(...)`

### Selector Notation

Attributes are accessed using dot notation:

- `.year` references the "year" attribute
- `.movie.year` would **NOT** reference the "year" field inside a "movie" object, only keys that are at the first level of the JSON object are accessible.

### JSON and expressions data types

Expressions can work with:

- Numbers (dobule precision floats)
- Strings (enclosed in single or double quotes)
- Booleans (no native type: they are represented as 1 for true, 0 for false)
- Arrays (for use with the `in` operator: `value in [1, 2, 3]`)

JSON attributes are converted in this way:

- Numbers will be converted to numbers.
- Strings to strings.
- Booleans to 0 or 1 number.
- Arrays to tuples (for "in" operator), but only if composed of just numbers and strings.

Any other type is ignored, and accessig it will make the expression evaluate to false.

### Examples

```
# Find items from the 1980s
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.year >= 1980 and .year < 1990'

# Find action movies with high ratings
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.genre == "action" and .rating > 8.0'

# Find movies directed by either Spielberg or Nolan
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '.director in ["Spielberg", "Nolan"]'

# Complex condition with numerical operations
VSIM movies VALUES 3 0.5 0.8 0.2 FILTER '(.year - 2000) ** 2 < 100 and .rating / 2 > 4'
```

### Error Handling

Elements with any of the following conditions are considered not matching:
- Missing the queried JSON attribute
- Having invalid JSON in their attributes
- Having a JSON value that cannot be converted to the expected type

This behavior allows you to safely filter on optional attributes without generating errors.

### FILTER effort

The `FILTER-EF` option controls the maximum effort spent when filtering vector search results.

When performing vector similarity search with filtering, Vector Sets perform the standard similarity search as they apply the filter expression to each node. Since many results might be filtered out, Vector Sets may need to examine a lot more candidates than the requested `COUNT` to ensure sufficient matching results are returned. Actually, if the elements matching the filter are very rare or if there are less than elements matching than the specified count, this would trigger a full scan of the HNSW graph.

For this reason, by default, the maximum effort is limited to a reasonable amount of nodes explored.

### Modifying the FILTER effort

1. By default, Vector Sets will explore up to `COUNT * 100` candidates to find matching results.
2. You can control this exploration with the `FILTER-EF` parameter.
3. A higher `FILTER-EF` value increases the chances of finding all relevant matches at the cost of increased processing time.
4. A `FILTER-EF` of zero will explore as many nodes as needed in order to actually return the number of elements specified by `COUNT`.
5. Even when a high `FILTER-EF` value is specified **the implementation will do a lot less work** if the elements passing the filter are very common, because of the early stop conditions of the HNSW implementation (once the specified amount of elements is reached and the quality check of the other candidates trigger an early stop).

```
VSIM key [ELE|FP32|VALUES] <vector or element> COUNT 10 FILTER '.year > 2000' FILTER-EF 500
```

In this example, Vector Sets will examine up to 500 potential nodes. Of course if count is reached before exploring 500 nodes, and the quality checks show that it is not possible to make progresses on similarity, the search is ended sooner.

### Performance Considerations

- If you have highly selective filters (few items match), use a higher `FILTER-EF`, or just design your application in order to handle a result set that is smaller than the requested count. Note that anyway the additional elements may be too distant than the query vector.
- For less selective filters, the default should be sufficient.
- Very selective filters with low `FILTER-EF` values may return fewer items than requested.
- Extremely high values may impact performance without significantly improving results.

The optimal `FILTER-EF` value depends on:
1. The selectivity of your filter.
2. The distribution of your data.
3. The required recall quality.

A good practice is to start with the default and increase if needed when you observe fewer results than expected.

### Testing a larg-ish data set

To really see how things work at scale, you can [download](https://antirez.com/word2vec_with_attribs.rdb) the following dataset:

    wget https://antirez.com/word2vec_with_attribs.rdb

It contains the 3 million words in Word2Vec having as attribute a JSON with just the length of the word. Because of the length distribution of words in large amounts of texts, where longer words become less and less common, this is ideal to check how filtering behaves with a filter verifying as true with less and less elements in a vector set.

For instance:

    > VSIM word_embeddings_bin ele "pasta" FILTER ".len == 6"
     1) "pastas"
     2) "rotini"
     3) "gnocci"
     4) "panino"
     5) "salads"
     6) "breads"
     7) "salame"
     8) "sauces"
     9) "cheese"
    10) "fritti"

This will easily retrieve the desired amount of items (`COUNT` is 10 by default) since there are many items of length 6. However:

    > VSIM word_embeddings_bin ele "pasta" FILTER ".len == 33"
    1) "skinless_boneless_chicken_breasts"
    2) "boneless_skinless_chicken_breasts"
    3) "Boneless_skinless_chicken_breasts"

This time even if we asked for 10 items, we only get 3, since the default filter effort will be `10*100 = 1000`. We can tune this giving the effort in an explicit way, with the risk of our query being slower, of course:

    > VSIM word_embeddings_bin ele "pasta" FILTER ".len == 33" FILTER-EF 10000
     1) "skinless_boneless_chicken_breasts"
     2) "boneless_skinless_chicken_breasts"
     3) "Boneless_skinless_chicken_breasts"
     4) "mozzarella_feta_provolone_cheddar"
     5) "Greatfood.com_R_www.greatfood.com"
     6) "Pepperidge_Farm_Goldfish_crackers"
     7) "Prosecuted_Mobsters_Rebuilt_Dying"
     8) "Crispy_Snacker_Sandwiches_Popcorn"
     9) "risultati_delle_partite_disputate"
    10) "Peppermint_Mocha_Twist_Gingersnap"

This time we get all the ten items, even if the last one will be quite far from our query vector. We encourage to experiment with this test dataset in order to understand better the dynamics of the implementation and the natural tradeoffs of filtered search.

**Keep in mind** that by default, Redis Vector Sets will try to avoid a likely very useless huge scan of the HNSW graph, and will be more happy to return few or no elements at all, since this is almost always what the user actually wants in the context of retrieving *similar* items to the query.

# Single Instance Scalability and Latency

Vector Sets implement a threading model that allows Redis to handle many concurrent requests: by default `VSIM` is always threaded, and `VADD` is not (but can be partially threaded using the `CAS` option). This section explains how the threading and locking mechanisms work, and what to expect in terms of performance.

## Threading Model

- The `VSIM` command runs in a separate thread by default, allowing Redis to continue serving other commands.
- A maximum of 32 threads can run concurrently (defined by `HNSW_MAX_THREADS`).
- When this limit is reached, additional `VSIM` requests are queued - Redis remains responsive, no latency event is generated.
- The `VADD` command with the `CAS` option also leverages threading for the computation-heavy candidate search phase, but the insertion itself is performed in the main thread. `VADD` always runs in a sub-millisecond time, so this is not a source of latency, but having too many hundreds of writes per second can be challenging to handle with a single instance. Please, look at the next section about multiple instances scalability.
- Commands run within Lua scripts, MULTI/EXEC blocks, or from replication are executed in the main thread to ensure consistency.

```
> VSIM vset VALUES 3 1 1 1 FILTER '.year > 2000'  # This runs in a thread.
> VADD vset VALUES 3 1 1 1 element CAS            # Candidate search runs in a thread.
```

## Locking Mechanism

Vector Sets use a read/write locking mechanism to coordinate access:

- Reads (`VSIM`, `VEMB`, etc.) acquire a read lock, allowing multiple concurrent reads.
- Writes (`VADD`, `VREM`, etc.) acquire a write lock, temporarily blocking all reads.
- When a write lock is requested while reads are in progress, the write operation waits for all reads to complete.
- Once a write lock is granted, all reads are blocked until the write completes.
- Each thread has a dedicated slot for tracking visited nodes during graph traversal, avoiding contention. This improves performances but limits the maximum number of concurrent threads, since each node has a memory cost proportional to the number of slots.

## DEL latency

Deleting a very large vector set (millions of elements) can cause latency spikes, as deletion rebuilds connections between nodes. This may change in the future.
The deletion latency is most noticeable when using `DEL` on a key containing a large vector set or when the key expires.

## Performance Characteristics

- Search operations (`VSIM`) scale almost linearly with the number of CPU cores available, up to the thread limit. You can expect a Vector Set composed of million of items associated with components of dimension 300, with the default int8 quantization, to deliver around 50k VSIM operations per second in a single host.
- Insertion operations (`VADD`) are more computationally expensive than searches, and can't be threaded: expect much lower throughput, in the range of a few thousands inserts per second.
- Binary quantization offers significantly faster search performance at the cost of some recall quality, while int8 quantization, the default, seems to have very small impacts on recall quality, while it significantly improves performances and space efficiency.
- The `EF` parameter has a major impact on both search quality and performance - higher values mean better recall but slower searches.
- Graph traversal time scales logarithmically with the number of elements, making Vector Sets efficient even with millions of vectors

## Loading / Saving performances

Vector Sets are able to serialize on disk the graph structure as it is in memory, so loading back the data does not need to rebuild the HNSW graph. This means that Redis can load millions of items per minute. For instance 3 million items with 300 components vectors can be loaded back into memory into around 15 seconds.

# Scaling vector sets to multiple instances

The fundamental way vector sets can be scaled to very large data sets
and to many Redis instances is that a given very large set of vectors
can be partitioned into N different Redis keys, that can also live into
different Redis instances.

For instance, I could add my elements into `key0`, `key1`, `key2`, by hashing
the item in some way, like doing `crc32(item)%3`, effectively splitting
the dataset into three different parts. However once I want all the vectors
of my dataset near to a given query vector, I could simply perform the
`VSIM` command against all the three keys, merging the results by
score (so the commands must be called using the `WITHSCORES` option) on
the client side: once the union of the results are ordered by the
similarity score, the query is equivalent to having a single key `key1+2+3`
containing all the items.

There are a few interesting facts to note about this pattern:

1. It is possible to have a logical sorted set that is as big as the sum of all the Redis instances we are using.
2. Deletion operations remain simple, we can hash the key and select the key where our item belongs.
3. However, even if I use 10 different Redis instances, I'm not going to reach 10x the **read** operations per second, compared to using a single server: for each logical query, I need to query all the instances. Yet, smaller graphs are faster to navigate, so there is some win even from the point of view of CPU usage.
4. Insertions, so **write** queries, will be scaled linearly: I can add N items against N instances at the same time, splitting the insertion load evenly. This is very important since vector sets, being based on HNSW data structures, are slower to add items than to query similar items, by a very big factor.
5. While it cannot guarantee always the best results, with proper timeout management this system may be considered *highly available*, since if a subset of N instances are reachable, I'll be still be able to return similar items to my query vector.

Notably, this pattern can be implemented in a way that avoids paying the sum of the round trip time with all the servers: it is possible to send the queries at the same time to all the instances, so that latency will be equal the slower reply out of of the N servers queries.

# Optimizing memory usage

Vector Sets, or better, HNSWs, the underlying data structure used by Vector Sets, combined with the features provided by the Vector Sets themselves (quantization, random projection, filtering, ...) form an implementation that has a non-trivial space of parameters that can be tuned. Despite to the complexity of the implementation and of vector similarity problems, here there is a list of simple ideas that can drive the user to pick the best settings:

* 8 bit quantization (the default) is almost always a win. It reduces the memory usage of vectors by a factor of 4, yet the performance penality in terms of recall is minimal. It also reduces insertion and search time by around 2 times or more.
* Binary quantization is much more extreme: it makes vector sets a lot faster, but increases the recall error in a sensible way, for instance from 95% to 80% if all the parameters remain the same. Yet, the speedup is really big, and the memory usage of vectors, compaerd to full precision vectors, 32 times smaller.
* Vectors memory usage are not the only responsible for Vector Set high memory usage per entry: nodes contain, on average `M*2 + M*0.33` pointers, where M is by default 16 (but can be tuned in `VADD`, see the `M` option). Also each node has the string item and the optional JSON attributes: those should be as small as possible in order to avoid contributing more to the memory usage.
* The `M` parameter should be incresed to 32 or more only when a near perfect recall is really needed.
* It is possible to gain space (less memory usage) sacrificing time (more CPU time) by using a low `M` (the default of 16, for instance) and a high `EF` (the effort parameter of `VSIM`) in order to scan the graph more deeply.
* When memory usage is seriosu concern, and there is the suspect the vectors we are storing don't contain as much information - at least for our use case - to justify the number of components they feature, random projection (the `REDUCE` option of `VADD`) could be tested to see if dimensionality reduction is possible with acceptable precision loss.

# Vector Sets troubleshooting and understandability

Vector graphs and similarity queries pose many challenges mainly due to the following three problems:

1. The error due to the approximated nature of Vector Sets is hard to evaluate.
2. The error added by the quantization is often depends on the exact vector space (the embedding we are using **and** how far apart the elements we represent into such embeddings are).
3. We live in the illusion that learned embeddings capture the best similarity possible among elements, which is obviously not always true, and highly application dependent.

The only way to debug such problems, is the ability to inspect step by step what is happening inside our application, and the structure of the HNSW graph itself. To do so, we suggest to consider the following tools:

1. The `TRUTH` option of the `VSIM` command is able to return the ground truth of the most similar elements, without using the HNSW graph, but doing a linear scan.
2. The `VLINKS` command allows to explore the graph to see if the connections among nodes make sense, and to investigate why a given node may be more isolated than expected. Such command can also be used in a different way, when we want very fast "similar items" without paying the HNSW traversal time. It exploits the fact that we have a direct reference from each element in our vector set to each node in our HNSW graph.
3. The `WITHSCORES` option, in the supported commands, return a value that is directly related to the *cosine similarity* between the query and the items vectors, the interval of the similarity is simply rescaled from the -1, 1 original range to 0, 1, otherwise the metric is identical.

# Known bugs

* When `VADD` with `REDUCE` is replicated, we should probably send the replicas the random matrix, in order for `VEMB` to read the same things. This is not critical, because the behavior of `VADD` / `VSIM` should be transparent if you don't look at the transformed vectors, but still probably worth doing.
* Replication code is pretty much untested, and very vanilla (replicating the commands verbatim).

# Implementation details

Vector sets are based on the `hnsw.c` implementation of the HNSW data structure with extensions for speed and functionality.

The main features are:

* Proper nodes deletion with relinking.
* 8 bits and binary quantization.
* Threaded queries.
* Filtered search with predicate callback.

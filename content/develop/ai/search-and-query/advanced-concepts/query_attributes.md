## Query attributes

As of v1.2.0, you can apply specific query modifying attributes to specific clauses of the query.

The syntax is `(foo bar) => { $attribute: value; $attribute:value; ...}`:

```
(foo bar) => { $weight: 2.0; $slop: 1; $inorder: true; }
~(bar baz) => { $weight: 0.5; }
```

The supported attributes are:

1. **$weight**: determines the weight of the sub-query or token in the overall ranking on the result (default: 1.0).
2. **$slop**: determines the maximum allowed slop (space between terms) in the query clause (default: 0).
3. **$inorder**: whether or not the terms in a query clause must appear in the same order as in the query. This is usually set alongside with `$slop` (default: false).
4. **$phonetic**: whether or not to perform phonetic matching (default: true). Note: setting this attribute to true for fields which were not created as `PHONETIC` will produce an error.

As of v2.6.1, the query attributes syntax supports these additional attributes:

* **$yield_distance_as**: specifies the distance field name, used for later sorting and/or returning, for clauses that yield some distance metric. It is currently supported for vector queries only (both KNN and range).   
* **vector query params**: pass optional parameters for [vector queries]({{< relref "develop/ai/search-and-query/vectors#querying-vector-fields" >}}) in key-value format.

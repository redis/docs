---
aliases:
- /develop/interact/search-and-query/advanced-concepts/tags
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
description: Details about tag fields
linkTitle: Tags
title: Tags
weight: 6
---

Tag fields are similar to full-text fields but they interpret the text as a simple
list of *tags* delimited by a
[separator](#creating-a-tag-field) character (which is a comma "," by default).
This limitation means that tag fields can use simpler
[tokenization]({{< relref "/develop/ai/search-and-query/advanced-concepts/escaping" >}})
and encoding in the index, which is more efficient than full-text indexing.

The values in tag fields cannot be accessed by general field-less search and can be used only with a special syntax.

The main differences between tag and full-text fields are:

1.  [Tokenization]({{< relref "/develop/ai/search-and-query/advanced-concepts/escaping#tokenization-rules-for-tag-fields" >}})
    is very simple for tags.

1.  Stemming is not performed on tag indexes.

1.  Tags cannot be found from a general full-text search. If a document has a field called "tags"
    with the values "foo" and "bar", searching for foo or bar without a special tag modifier (see below) will not return this document.

1.  The index is much simpler and more compressed: frequencies or offset vectors of field flags
    are not stored. The index contains only document IDs encoded as deltas. This means that an entry in
    a tag index is usually one or two bytes long. This makes them very memory-efficient and fast.

1.  You can create up to 1024 tag fields per index.

## Creating a tag field

Tag fields can be added to the schema with the following syntax:

```
FT.CREATE ... SCHEMA ... {field_name} TAG [SEPARATOR {sep}] [CASESENSITIVE]
```

For hashes, SEPARATOR can be any printable ASCII character; the default is a comma (`,`). For JSON, there is no default separator; you must declare one explicitly if needed.

For example:

```
JSON.SET key:1 $ '{"colors": "red, orange, yellow"}' 
FT.CREATE idx on JSON PREFIX 1 key: SCHEMA $.colors AS colors TAG SEPARATOR ","

> FT.SEARCH idx '@colors:{orange}'
1) "1"
2) "key:1"
3) 1) "$"
   2) "{\"colors\":\"red, orange, yellow\"}"
```

CASESENSITIVE can be specified to keep the original case.

## Querying tag fields

As mentioned above, just searching for a tag without any modifiers will not retrieve documents
containing it.

The syntax for matching tags in a query is as follows (the curly braces are part of the syntax):

 ```
    @<field_name>:{ <tag> | <tag> | ...}
 ```

For example, this query finds documents with either the tag `hello world` or `foo bar`:

```
    FT.SEARCH idx "@tags:{ hello world | foo bar }"
```

Tag clauses can be combined into any sub-clause, used as negative expressions, optional expressions, etc. For example, given the following index:

```
FT.CREATE idx ON HASH PREFIX 1 test: SCHEMA title TEXT price NUMERIC tags TAG SEPARATOR ";"
```

You can combine a full-text search on the title field, a numerical range on price, and match either the `foo bar` or `hello world` tag like this:

```
FT.SEARCH idx "@title:hello @price:[0 100] @tags:{ foo bar | hello world }
```

Tags support prefix matching with the regular `*` character:

```
FT.SEARCH idx "@tags:{ hell* }"
FT.SEARCH idx "@tags:{ hello\\ w* }"

```

## Multiple tags in a single filter

Notice that including multiple tags in the same clause creates a union of all documents that contain any of the included tags. To create an intersection of documents containing all of the given tags, you should repeat the tag filter several times.

For example, imagine an index of travelers, with a tag field for the cities each traveler has visited:

```
FT.CREATE myIndex ON HASH PREFIX 1 traveler: SCHEMA name TEXT cities TAG

HSET traveler:1 name "John Doe" cities "New York, Barcelona, San Francisco"
```

For this index, the following query will return all the people who visited at least one of the following cities:

```
FT.SEARCH myIndex "@cities:{ New York | Los Angeles | Barcelona }"
```

But the next query will return all people who have visited all three cities:

```
FT.SEARCH myIndex "@cities:{ New York } @cities:{Los Angeles} @cities:{ Barcelona }"
```

## Including punctuation and spaces in tags

A tag field can contain any punctuation characters except for the field separator.
You can use punctuation without escaping when you *define* a tag field,
but you typically need to escape certain characters when you *query* the field
because the query syntax itself uses the same characters.
(See [Query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax#tag-filters" >}})
for the full set of characters that require escaping.)

For example, given the following index:

```
FT.CREATE punctuation ON HASH PREFIX 1 test: SCHEMA tags TAG
```

You can add tags that contain punctuation like this:

```
HSET test:1 tags "Andrew's Top 5,Justin's Top 5"
```

However, when you query for those tags, you must escape the punctuation characters
with a backslash (`\`). So, querying for the tag `Andrew's Top 5` in
[`redis-cli`]({{< relref "/develop/tools/cli" >}}) looks like this:

```
FT.SEARCH punctuation "@tags:{ Andrew\\'s Top 5 }"
```

(Note that you need the double backslash here because the terminal app itself
uses the backslash as an escape character.
Programming languages commonly use this convention also.)

You can include spaces in a tag filter without escaping *unless* you are
using a version of RediSearch earlier than v2.4 or you are using
[query dialect 1]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects#dialect-1" >}}).
See
[Query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax#tag-filters" >}})
for a full explanation.

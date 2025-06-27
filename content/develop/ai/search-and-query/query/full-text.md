---
aliases:
- /develop/interact/search-and-query/query/full-text
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
description: Perform a full-text search
linkTitle: Full-text
title: Full-text search
weight: 3
---

A full-text search finds words or phrases within larger texts. You can search within a specific text field or across all text fields. 

This article provides a good overview of the most relevant full-text search capabilities. Please find further details about all the full-text search features in the [reference documentation]({{< relref "/develop/ai/search-and-query/advanced-concepts/" >}}).

The examples in this article use a schema with the following fields:

| Field name | Field type |
| ---------- | ---------- |
| `brand`      | `TEXT`       |
| `model`      | `TEXT`       |
| `description`| `TEXT`       |


## Single word

To search for a word (or word stem) across all text fields, you can construct the following simple query:

```
FT.SEARCH index "word"
```

Instead of searching across all text fields, you might want to limit the search to a specific text field.

```
FT.SEARCH index "@field: word"
```

Words that occur very often in natural language, such as `the` or `a` for the English language, aren't indexed and will not return a search result. You can find further details in the [stop words article]({{< relref "/develop/ai/search-and-query/advanced-concepts/stopwords" >}}).

The following example searches for all bicycles that have the word 'kids' in the description:

{{< clients-example query_ft ft1 >}}
FT.SEARCH idx:bicycle "@description: kids"
{{< /clients-example >}}

## Phrase

A phrase is a sentence, sentence fragment, or small group of words. You can find further details about how to find exact phrases in the [exact match article]({{< relref "/develop/ai/search-and-query/query/exact-match" >}}).


## Word prefix

You can also search for words that match a given prefix.

```
FT.SEARCH index "prefix*"
```

```
FT.SEARCH index "@field: prefix*"
```

{{% alert title="Important" color="warning" %}}
The prefix needs to be at least two characters long.
{{% /alert  %}}

Here is an example that shows you how to search for bicycles with a brand that starts with 'ka':

{{< clients-example query_ft ft2 >}}
FT.SEARCH idx:bicycle "@model: ka*"
{{< /clients-example >}}

## Word suffix

Similar to the prefix, it is also possible to search for words that share the same suffix.

```
FT.SEARCH index "*suffix"
```

You can also combine prefix- and suffix-based searches within a query expression.

```
FT.SEARCH index "*infix*"
```

Here is an example that finds all brands that end with 'bikes':

{{< clients-example query_ft ft3 >}}
FT.SEARCH idx:bicycle "@brand:*bikes"
{{< /clients-example >}}

## Fuzzy search

A fuzzy search allows you to find documents with words that approximately match your search term. To perform a fuzzy search, you wrap search terms with pairs of `%` characters. A single pair represents a (Levenshtein) distance of one, two pairs represent a distance of two, and three pairs, the maximum distance, represents a distance of three.

Here is the command that searches across all text fields with a distance of one:

```
FT.SEARCH index "%word%"
```

The following example finds all documents that contain a word that has a distance of one to the incorrectly spelled word 'optamized'. You can see that this matches the word 'optimized'.

{{< clients-example query_ft ft4 >}}
FT.SEARCH idx:bicycle "%optamized%"
{{< /clients-example >}}

If you want to increase the maximum word distance to two, you can use the following query:

{{< clients-example query_ft ft5 >}}
FT.SEARCH idx:bicycle "%%optamised%%"
{{< /clients-example >}}

## Unicode considerations

Redis Query Engine only supports Unicode characters in the [basic multilingual plane](https://en.wikipedia.org/wiki/Plane_(Unicode)#Basic_Multilingual_Plane); U+0000 to U+FFFF. Unicode characters beyond U+FFFF, such as Emojis, are not supported and would not be retrieved by queries including such characters in the following use cases:

* Querying TEXT fields with Prefix/Suffix/Infix
* Querying TEXT fields with fuzzy

Examples:

```
redis> FT.CREATE idx SCHEMA tag TAG text TEXT
OK
redis> HSET doc:1 tag '😀😁🙂' text '😀😁🙂'
(integer) 2
redis> HSET doc:2 tag '😀😁🙂abc' text '😀😁🙂abc'
(integer) 2
redis> FT.SEARCH idx '@text:(*😀😁🙂)' NOCONTENT
1) (integer) 0
redis> FT.SEARCH idx '@text:(*😀😁🙂*)' NOCONTENT
1) (integer) 0
redis> FT.SEARCH idx '@text:(😀😁🙂*)' NOCONTENT
1) (integer) 0

redis> FT.SEARCH idx '@text:(%😀😁🙃%)' NOCONTENT
1) (integer) 0
```
---
aliases:
- /develop/interact/search-and-query/advanced-concepts/escaping
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
description: Controlling text tokenization and escaping
linkTitle: Tokenization
title: Tokenization
weight: 10
---

Full-text search works by comparing words, URLs, numbers, and other elements of the query
against the text in the searchable fields of each document. However,
it would be very inefficient to compare the entire text of the query against the
entire text of each field over and over again, so the search system doesn't do this.
Instead, it splits the document text into short, significant sections
called *tokens* during the indexing process and stores the tokens as part of the document's
index data.

During a search, the query system also tokenizes the
query text and then simply compares the tokens from the query against the tokens stored
for each document. Finding a match like this is much more efficient than pattern-matching on
the whole text and also lets you use
[stemming]({{< relref "/develop/ai/search-and-query/advanced-concepts/stemming" >}}) and
[stop words]({{< relref "/develop/ai/search-and-query/advanced-concepts/stopwords" >}})
to improve the search even further. See this article about
[Tokenization](https://queryunderstanding.com/tokenization-c8cdd6aef7ff)
for a general introduction to the concepts.

Redis uses a very simple tokenizer for documents and a slightly more sophisticated tokenizer for queries. Both allow a degree of control over string escaping and tokenization. 

The sections below describe the rules for tokenizing text fields and queries.
Note that
[Tag fields]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}}) 
are essentially text fields but they use a simpler form of tokenization, as described
separately in the
[Tokenization rules for tag fields](#tokenization-rules-for-tag-fields) section.

## Tokenization rules for text fields

1. All punctuation marks and whitespace (besides underscores) separate the document and queries into tokens. For example, any character of `,.<>{}[]"':;!@#$%^&*()-+=~` will break the text into terms, so the text `foo-bar.baz...bag` will be tokenized into `[foo, bar, baz, bag]`

2. Escaping separators in both queries and documents is done by prepending a backslash to any separator. For example, the text `hello\-world hello-world` will be tokenized as `[hello-world, hello, world]`. In most languages you will need an extra backslash to signify an actual backslash when formatting the document or query, so the actual text entered into redis-cli will be `hello\\-world`. 

3. Underscores (`_`) are not used as separators in either document or query, so the text `hello_world` will remain as is after tokenization. 

4. Repeating spaces or punctuation marks are stripped. 

5. Latin characters are converted to lowercase. 

6. A backslash before the first digit will tokenize it as a term. This will translate the `-` sign as NOT, which otherwise would make the number negative. Add a backslash before `.` if you are searching for a float. For example, `-20 -> {-20} vs -\20 -> {NOT{20}}`.

## Tokenization rules for tag fields

[Tag fields]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags" >}}) interpret
a text field as a list of *tags* delimited by a
[separator]({{< relref "/develop/ai/search-and-query/advanced-concepts/tags#creating-a-tag-field" >}})
character (which is a comma "," by
default). The tokenizer simply splits the text wherever it finds the separator and so most
punctuation marks and whitespace are valid characters within each tag token. The only
changes that the tokenizer makes to the tags are:

-   Trimming whitespace at the start and end of the tag. Other whitespace in the tag text is left intact.
-   Converting Latin alphabet characters to lowercase. You can override this by adding the
    [`CASESENSITIVE`]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options#tag-fields" >}}) option in the indexing schema for the tag field.

This means that when you define a tag field, you don't need to escape any characters, except
in the unusual case where you want leading or trailing spaces to be part of the tag text.
However, you do need to escape certain characters in a *query* against a tag field. See the
[Query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax#tag-filters" >}}) and
[Exact match]({{< relref "/develop/ai/search-and-query/query/exact-match" >}}) pages for more information about escaping
and how to use [DIALECT 2]({{< relref "/develop/ai/search-and-query/advanced-concepts/dialects#dialect-2" >}}), which is required for
exact match queries involving tags.

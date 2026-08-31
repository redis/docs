---
aliases:
- /develop/interact/search-and-query/advanced-concepts/highlight
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
description: Highlighting full-text results
linkTitle: Highlighting
title: Highlighting
weight: 31
---

Redis Open Source uses advanced algorithms for highlighting and summarizing, which enable only the relevant portions of a document to appear in response to a search query. This feature allows users to immediately understand the relevance of a document to their search criteria, typically highlighting the matching terms in bold text.

## Command syntax

```
FT.SEARCH ...
    SUMMARIZE [FIELDS {num} {field}] [FRAGS {numFrags}] [LEN {fragLen}] [SEPARATOR {sepstr}]
    HIGHLIGHT [FIELDS {num} {field}] [TAGS {openTag} {closeTag}]
```

There are two sub-commands used for highlighting. The first is `HIGHLIGHT`, which surrounds matching text with an open and/or close tag. The second is `SUMMARIZE`, which splits a field into contextual fragments surrounding the found terms. It is possible to summarize a field, highlight a field, or perform both actions in the same query.

### Summarization

```
FT.SEARCH ...
    SUMMARIZE [FIELDS {num} {field}] [FRAGS {numFrags}] [LEN {fragLen}] [SEPARATOR {sepStr}]
```

Summarization will fragment the text into smaller sized snippets, each of which containing the found term(s) and some additional surrounding context.

Redis can perform summarization using the `SUMMARIZE` keyword. If no additional arguments are passed, all returned fields are summarized using built-in defaults.

The `SUMMARIZE` keyword accepts the following arguments:

* **`FIELDS`**: If present, it must be the first argument. This should be followed
    by the number of fields to summarize, which itself is followed by a list of
    fields. Each field is summarized. If no `FIELDS` directive is passed,
    then all returned fields are summarized.

* **`FRAGS`**: The number of fragments to be returned. If not specified, a default is 3.

* **`LEN`**: The number of context words each fragment should contain. Context
    words surround the found term. A higher value will return a larger block of
    text. If not specified, the default value is 20.

* **`SEPARATOR`**: The string used to divide individual summary snippets.
    The default is `... ` which is common among search engines, but you may
    override this with any other string if you desire to programmatically divide the snippets
    later on. You may also use a newline sequence, as newlines are stripped from the
    result body during processing.

### Highlighting

```
FT.SEARCH ... HIGHLIGHT [FIELDS {num} {field}] [TAGS {openTag} {closeTag}]
```

Highlighting will surround the found term (and its variants) with a user-defined pair of tags. This may be used to display the matched text in a different typeface using a markup language, or to otherwise make the text appear differently.

Redis performs highlighting using the `HIGHLIGHT` keyword. If no additional arguments are passed, all returned fields are highlighted using built-in defaults.

The `HIGHLIGHT` keyword accepts the following arguments:

* **`FIELDS`**: If present, it must be the first argument. This should be followed
    by the number of fields to highlight, which itself is followed by a list of
    fields. Each field present is highlighted. If no `FIELDS` directive is passed,
    then all returned fields are highlighted.
    
* **`TAGS`**: If present, it must be followed by two strings. The first string is prepended
    to each matched term. The second string is appended to each matched term. If no `TAGS` are
    specified, a built-in tag pair is prepended and appended to each matched term.


#### Field selection

If no specific fields are passed to the `RETURN`, `SUMMARIZE`, or `HIGHLIGHT` keywords, then all of a document's fields are returned. However, if any of these keywords contain a `FIELD` directive, then the `SEARCH` command will only return the sum total of all fields enumerated in any of those directives.

The `RETURN` keyword is treated specially, as it overrides any fields specified in `SUMMARIZE` or `HIGHLIGHT`.

In the command `RETURN 1 foo SUMMARIZE FIELDS 1 bar HIGHLIGHT FIELDS 1 baz`, the fields `foo` is returned as-is, while `bar` and `baz` are not returned, because `RETURN` was specified, but did not include those fields.

In the command `SUMMARIZE FIELDS 1 bar HIGHLIGHT FIELDS 1 baz`, `bar` is returned summarized and `baz` is returned highlighted.

## JSON indexes

<!-- TODO(DOC-6994): confirm the maintenance lines and the first patch version in each before
publishing, then replace the sentence below. DOC-6994 says "8.4 onward", the 8.2 backport
merged but has no Jira fix version, and the 8.6 backport was still open. Follow the wording
pattern used for search-bg-index-sleep-duration-us in administration/configuration. -->

`HIGHLIGHT` and `SUMMARIZE` work on a JSON index when the field maps to a single-value
[JSONPath]({{< relref "/develop/data-types/json/path" >}}) such as `$.name`. Earlier releases
reject `HIGHLIGHT` and `SUMMARIZE` on every JSON index.

Three rules apply to JSON indexes but not to hash indexes:

* **`RETURN` is required.** Pass `RETURN` with explicit field names. Without it, Redis loads
    the document as a single serialized value, so the individual fields are not available to
    the highlighter. `HIGHLIGHT` or `SUMMARIZE` with no `RETURN`, or with `RETURN 0`, fails
    with `HIGHLIGHT/SUMMARIZE on JSON indexes requires RETURN with explicit field names`.

* **Multi-value JSONPaths are rejected.** A path such as `$.tags[*]` or `$..name` fails with
    `HIGHLIGHT/SUMMARIZE is not supported for JSON fields with multi-value JSONPath`. Each
    value in a multi-value path is indexed separately, with its own byte offsets, so there is
    no single value to highlight. The error applies to any field in the returned or
    highlighted set, whatever its schema type.

* **Raw JSONPath aliases cannot be highlighted.** In a `RETURN` clause such as`RETURN 3 $.name AS alias`, the alias
    `alias` is not a schema field, so naming it in `HIGHLIGHT FIELDS` or `SUMMARIZE FIELDS`
    fails with ``Property `alias` is not in schema``. Name the schema field explicitly instead of using the alias.

A single-value JSONPath that resolves to a JSON array or object, such as `$.colors` where
`colors` is an array, is accepted but not highlighted. Redis returns the loaded value
unchanged, without an error.

Hash indexes keep their existing behavior. `RETURN` is optional, and `HIGHLIGHT` without
`RETURN` highlights every returned `TEXT` field.

### JSON examples

Index two fields with single-value JSONPaths and one with a multi-value JSONPath:

```sql
127.0.0.1:6379> JSON.SET item:1 $ '{"name":"Noise-cancelling Bluetooth headphones","description":"Wireless Bluetooth headphones with noise-cancelling technology","tags":["audio","wireless"]}'
OK
127.0.0.1:6379> FT.CREATE itemIdx ON JSON PREFIX 1 item: SCHEMA $.name AS name TEXT $.description AS description TEXT $.tags[*] AS tags TEXT
OK
```

`RETURN` names both fields, and `HIGHLIGHT FIELDS` highlights only `name`:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@name:(bluetooth)' RETURN 2 name description HIGHLIGHT FIELDS 1 name TAGS '<b>' '</b>'
1) "1"
2) "item:1"
3) 1) "name"
   2) "Noise-cancelling <b>Bluetooth</b> headphones"
   3) "description"
   4) "Wireless Bluetooth headphones with noise-cancelling technology"
```

Without `RETURN`, the same query fails:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx '@name:(bluetooth)' HIGHLIGHT
(error) HIGHLIGHT/SUMMARIZE on JSON indexes requires RETURN with explicit field names
```

Highlighting `tags`, which uses the multi-value JSONPath `$.tags[*]`, also fails:

```sql
127.0.0.1:6379> FT.SEARCH itemIdx 'bluetooth' RETURN 1 tags HIGHLIGHT FIELDS 1 tags
(error) HIGHLIGHT/SUMMARIZE is not supported for JSON fields with multi-value JSONPath
```

The equivalent hash index needs no `RETURN`:

```sql
127.0.0.1:6379> HSET item:hash name "Noise-cancelling Bluetooth headphones"
(integer) 1
127.0.0.1:6379> FT.CREATE hashIdx ON HASH PREFIX 1 item:hash SCHEMA name TEXT
OK
127.0.0.1:6379> FT.SEARCH hashIdx '@name:(bluetooth)' HIGHLIGHT FIELDS 1 name TAGS '<b>' '</b>'
1) "1"
2) "item:hash"
3) 1) "name"
   2) "Noise-cancelling <b>Bluetooth</b> headphones"
```

For more about indexing and querying JSON documents, see
[Index and query JSON documents]({{< relref "/develop/ai/search-and-query/indexing/" >}}).

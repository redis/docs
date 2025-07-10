---
aliases:
- /develop/interact/search-and-query/advanced-concepts/escaping
- /develop/ai/search-and-query/advanced-concepts/escaping
- /develop/interact/search-and-query/indexing/tokenization
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
description: How Redis processes and tokenizes text for indexing and search
linkTitle: Tokenization
title: Tokenization
weight: 10
---

Tokenization is the process of breaking text into smaller, searchable units called *tokens*. Understanding how Redis tokenizes your data helps you create more effective indexes and write better search queries.

## How tokenization works

When you index documents, Redis splits text into tokens and stores them efficiently. During searches, Redis tokenizes your query and matches tokens rather than comparing entire text strings.

**Benefits of tokenization**:
- **Performance**: Token matching is much faster than full-text comparison
- **Flexibility**: Enables features like stemming, stop words, and fuzzy matching
- **Efficiency**: Reduces storage requirements and memory usage

## Field type differences

Redis uses different tokenization approaches based on field type:

| Field Type | Tokenization | Use Case |
|------------|--------------|----------|
| **TEXT** | Complex word-based splitting | Full-text search, content analysis |
| **TAG** | Simple delimiter splitting | Exact matching, categories, filters |

## TEXT field tokenization

TEXT fields use sophisticated tokenization for full-text search capabilities.

### Basic rules

1. **Punctuation separates tokens**: Most punctuation marks and whitespace create token boundaries
2. **Underscores preserved**: Underscores (`_`) are NOT treated as separators
3. **Case normalization**: Latin characters converted to lowercase
4. **Whitespace handling**: Multiple spaces or punctuation marks are stripped
5. **Escaping supported**: Use backslash (`\`) to escape separator characters

### Separator characters

These characters split text into separate tokens:
```
, . < > { } [ ] " ' : ; ! @ # $ % ^ & * ( ) - + = ~ ` | \ / ?
```

**Example**:
```
"hello-world.test" → ["hello", "world", "test"]
"user@example.com" → ["user", "example", "com"]
"price:$99.99" → ["price", "99", "99"]
```

### Escaping separators

Use backslash (`\`) to include separator characters in tokens:

```
"hello\-world" → ["hello-world"]
"user\@domain" → ["user@domain"]
"file\.txt" → ["file.txt"]
```

**Note**: In most programming languages, you need double backslashes:
```python
query = "hello\\-world"  # Produces "hello\-world"
```

### Underscores preserved

Underscores remain part of tokens:
```
"hello_world" → ["hello_world"]
"user_id_123" → ["user_id_123"]
```

### Number handling

Numbers require special attention:

```
"-20" → ["-20"]           # Negative number
"-\20" → ["NOT", "20"]    # Escaped: NOT operator + number
"3.14" → ["3", "14"]      # Decimal split by dot
"3\.14" → ["3.14"]        # Escaped: preserved as single token
```

Redis uses different tokenization approaches for different field types. [Tag fields]({{< relref "/develop/ai/search-and-query/indexing/tags" >}}) use simpler tokenization focused on exact matching, while TEXT fields support complex full-text search features.

## TAG field tokenization

[Tag fields]({{< relref "/develop/ai/search-and-query/indexing/tags" >}}) use much simpler tokenization designed for exact matching.

### How TAG tokenization works

1. **Split at separators**: Text is divided only at the specified separator character (default: comma)
2. **Preserve content**: Most punctuation and whitespace within tags is preserved
3. **Trim whitespace**: Leading and trailing spaces are removed from each tag
4. **Case handling**: Converts to lowercase unless `CASESENSITIVE` is specified

### TAG tokenization examples

**Default comma separator**:
```
"red, blue, green" → ["red", "blue", "green"]
"Electronics,Gaming,PC" → ["electronics", "gaming", "pc"]
```

**Custom separator**:
```
"Fiction;Mystery;Thriller" → ["fiction", "mystery", "thriller"]
"admin|editor|viewer" → ["admin", "editor", "viewer"]
```

**Preserved punctuation**:
```
"Andrew's Top 5,Best Buy,5-Star" → ["andrew's top 5", "best buy", "5-star"]
```

### When to escape in TAG queries

**During indexing**: No escaping needed when storing tag values
**During querying**: Escape special characters in tag queries

```sql
# Store tags (no escaping needed)
HSET product:1 tags "Andrew's Top 5,Best-Seller"

# Query tags (escaping required)
FT.SEARCH products "@tags:{ Andrew\\'s Top 5 }"
FT.SEARCH products "@tags:{ Best\\-Seller }"
```

## Practical examples

### TEXT field examples

**Product descriptions**:
```sql
# Document content
"High-quality noise-cancelling headphones with Bluetooth 5.0"

# Tokenized as
["high", "quality", "noise", "cancelling", "headphones", "with", "bluetooth", "5", "0"]

# Search queries that match
"@description:(noise cancelling)"     # Matches: noise AND cancelling
"@description:(bluetooth)"            # Matches: bluetooth
"@description:(high quality)"         # Matches: high AND quality
```

**Email addresses and URLs**:
```sql
# Document content
"Contact: support@example.com or visit https://example.com/help"

# Tokenized as
["contact", "support", "example", "com", "or", "visit", "https", "example", "com", "help"]

# To search for complete email, escape the @ symbol
"@content:(support\\@example.com)"
```

### TAG field examples

**Product categories**:
```sql
# Store categories
HSET product:1 categories "Electronics,Audio,Headphones"

# Create index
FT.CREATE products ON HASH PREFIX 1 product: SCHEMA categories TAG

# Query exact categories
FT.SEARCH products "@categories:{Electronics}"
FT.SEARCH products "@categories:{Audio}"
```

**User roles with special characters**:
```sql
# Store roles with punctuation
HSET user:1 roles "Admin,Content-Editor,API-User"

# Query with escaping
FT.SEARCH users "@roles:{Content\\-Editor}"
FT.SEARCH users "@roles:{API\\-User}"
```

## Best practices

### Choose the right field type

- **Use TEXT for**: Content search, descriptions, articles, comments
- **Use TAG for**: Categories, status values, user roles, product types

### Optimize for your queries

**TEXT fields**:
- Consider how users will search your content
- Plan for partial word matches and stemming
- Test with realistic search terms

**TAG fields**:
- Keep tag values simple and consistent
- Avoid complex punctuation when possible
- Use meaningful separator characters

### Handle special characters

**In TEXT fields**:
- Escape separators when you need them in search terms
- Remember that punctuation splits tokens
- Use underscores for compound identifiers

**In TAG fields**:
- Store tags without escaping
- Escape punctuation in queries
- Test your tag queries with real data

## Next steps

- Learn about [tags]({{< relref "/develop/ai/search-and-query/indexing/tags" >}}) for exact matching
- Explore [field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) for other field types
- See [query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}) for advanced search patterns

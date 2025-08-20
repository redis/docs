---
aliases:
- /develop/interact/search-and-query/advanced-concepts/tags
- /develop/ai/search-and-query/advanced-concepts/tags
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
description: How to use tag fields for exact match searches and high-performance filtering
linkTitle: Tag fields
title: Tag fields
weight: 6
---

Tag fields provide exact match search capabilities with high performance and memory efficiency. Use tag fields when you need to filter documents by specific values without the complexity of full-text search tokenization.

Tag fields interpret text as a simple list of *tags* delimited by a [separator](#separator-options) character. This approach enables simpler [tokenization]({{< relref "/develop/ai/search-and-query/advanced-concepts/escaping/#tokenization-rules-for-tag-fields" >}}) and encoding, making tag indexes much more efficient than full-text indexes. Note: even though tag and text fields both use text, they are two separate field types and so you don't query them the same way.

{{% alert title="Important: Different defaults for HASH vs JSON" color="warning" %}}
- The default separator for hash documents is a comma (`,`).
- There is no default separator for JSON documents. You must explicitly specify one if needed.

Specifying a tag from the text `"foo,bar"` behaves differently:
- For hash documents, two tags are created: `"foo"` and `"bar"`.
- For JSON documents, one tag is created: `"foo,bar"` (unless you add `SEPARATOR ","`).
{{% /alert %}}

## Tag fields vs text fields

Tag fields excel in scenarios requiring exact matching rather than full-text search. Choose tag fields when you need to index categorical data such as:

- **Product categories**: Electronics, Clothing, Books
- **User roles**: Admin, Editor, Viewer
- **Status values**: Active, Pending, Completed
- **Geographic regions**: US, EU, APAC
- **Content types**: Video, Image, Document

### Key differences

| Feature | Tag fields | Text fields |
|---------|------------|-------------|
| **Search type** | Exact match | Full-text search |
| **Tokenization** | Simple delimiter splitting | Complex word tokenization |
| **Stemming** | None | Language-specific stemming |
| **Memory usage** | Very low (1-2 bytes per entry) | Higher (frequencies, positions) |
| **Performance** | Fastest | Slower for exact matches |
| **Multiple values** | Support comma-separated lists | Single text content |
| **Case control** | Optional case-sensitive matching | Typically case-insensitive |
| **Use case** | Categories, filters, IDs | Content search, descriptions |

## Technical details

### Index structure
- **Compressed storage**: Only document IDs encoded as deltas (1-2 bytes per entry)
- **No frequencies**: Unlike TEXT fields, tag indexes don't store term frequencies
- **No positions**: No offset vectors or field flags stored
- **Limit**: You can create up to 1024 tag fields per index

### Tokenization differences
- **Simple splitting**: Text is split only at separator characters
- **No stemming**: Words are indexed exactly as written
- **Case handling**: Optional case-sensitive or case-insensitive matching
- **No stop words**: All tag values are indexed regardless of content

## Create a tag field

Add tag fields to your schema using this syntax:

```
FT.CREATE ... SCHEMA ... {field_name} TAG [SEPARATOR {sep}] [CASESENSITIVE]
```

### Separator options

The separator behavior differs significantly between hash and JSON documents:

**Hash documents**

- The default separator is the comma (`,`).
- Strings are automatically splits at commas. For example,
  the string `"red,blue,green"` becomes three tags: `"red"`, `"blue"`, and `"green"`.
- You can use any printable ASCII character as a custom separator.

**JSON documents**

- There is no default separator; it's effectively `null`.
- Treats the entire string as single tag unless you specify a separator with the `SEPARATOR` option. For example,
  the string `"red,blue,green"` becomes one tag: `"red,blue,green"`
- Add `SEPARATOR ","` to your schema to allow splitting.
- You should use JSON arrays instead of comma-separated strings

**Why the difference?**

JSON has native array support, so the preferred approach is:

```json
{"colors": ["red", "blue", "green"]}  // Use with $.colors[*] AS colors TAG
```
Rather than:

```json
{"colors": "red,blue,green"}  // Requires SEPARATOR ","
```

### Case sensitivity

- **Default**: Case-insensitive matching (`red` matches `Red`, `RED`)
- **CASESENSITIVE**: Preserves original case for exact matching

### Examples

**Hash examples**

1. Basic hash tag field (automatic comma splitting):

    ```sql
    HSET product:1 categories "Electronics,Gaming,PC"
    FT.CREATE products ON HASH PREFIX 1 product: SCHEMA categories TAG

    > FT.SEARCH products '@categories:{Gaming}'
    1) "1"
    2) "product:1"
    ```

1. Hash with custom separator:

    ```sql
    HSET book:1 genres "Fiction;Mystery;Thriller"
    FT.CREATE books ON HASH PREFIX 1 book: SCHEMA genres TAG SEPARATOR ";"
    ```

1. Case-sensitive hash tags:

    ```sql
    HSET product:1 categories "Electronics,Gaming,PC"
    FT.CREATE products ON HASH PREFIX 1 product: SCHEMA categories TAG CASESENSITIVE

    > FT.SEARCH products '@categories:{PC}'  # Case matters
    1) "1"
    2) "product:1"
    ```

**JSON examples**

1. JSON with string and explicit separator (not recommended):

    ```sql
    JSON.SET key:1 $ '{"colors": "red, orange, yellow"}'
    FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.colors AS colors TAG SEPARATOR ","

    > FT.SEARCH idx '@colors:{orange}'
    1) "1"
    2) "key:1"
    3) 1) "$"
       2) "{\"colors\":\"red, orange, yellow\"}"
    ```

1. JSON with array of strings (recommended approach):

    ```sql
    JSON.SET key:1 $ '{"colors": ["red", "orange", "yellow"]}'
    FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.colors[*] AS colors TAG

    > FT.SEARCH idx '@colors:{orange}'
    1) "1"
    2) "key:1"
    3) 1) "$"
       2) "{\"colors\":[\"red\",\"orange\",\"yellow\"]}"
    ```

1. JSON without separator (single tag):

    ```sql
    JSON.SET key:1 $ '{"category": "Electronics,Gaming"}'
    FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.category AS category TAG
    # No SEPARATOR specified - entire string becomes one tag

    > FT.SEARCH idx '@category:{Electronics,Gaming}'  # Must match exactly
    1) "1"
    2) "key:1"
    ```

## Query tag fields

**Important**: Tag fields require special query syntax - you cannot find tag values with general field-less searches.

### Basic tag query syntax

Use curly braces to specify tag values (the braces are part of the syntax):

```
@<field_name>:{ <tag> | <tag> | ...}
```

### Single tag match

Find documents with a specific tag:

```sql
FT.SEARCH idx "@category:{Electronics}"
FT.SEARCH idx "@status:{Active}"
```

### Multiple tag match (OR)

Find documents with any of the specified tags:

```sql
FT.SEARCH idx "@tags:{ hello world | foo bar }"
FT.SEARCH idx "@category:{ Electronics | Gaming | Software }"
```

### Combining with other queries

Tag queries work seamlessly with other field types:

```sql
FT.CREATE idx ON HASH PREFIX 1 product: SCHEMA
    title TEXT
    price NUMERIC
    category TAG SEPARATOR ";"

# Combine text search, numeric range, and tag filter
FT.SEARCH idx "@title:laptop @price:[500 1500] @category:{ Electronics | Gaming }"
```

### Prefix matching

Use the `*` wildcard for prefix matching:

```sql
FT.SEARCH idx "@tags:{ tech* }"        # Matches: technology, technical, tech
FT.SEARCH idx "@tags:{ hello\\ w* }"   # Matches: "hello world", "hello web"
```

### Negative matching

Exclude documents with specific tags:

```sql
FT.SEARCH idx "-@category:{Discontinued}"
FT.SEARCH idx "@title:phone -@category:{Refurbished}"
```

## Advanced tag queries

### OR vs AND logic

**Single clause (OR logic)**: Find documents with ANY of the specified tags
```sql
@cities:{ New York | Los Angeles | Barcelona }
# Returns: Documents with New York OR Los Angeles OR Barcelona
```

**Multiple clauses (AND logic)**: Find documents with ALL of the specified tags
```sql
@cities:{ New York } @cities:{ Los Angeles } @cities:{ Barcelona }
# Returns: Documents with New York AND Los Angeles AND Barcelona
```

### Practical example

Consider a travel database:

```sql
FT.CREATE travelers ON HASH PREFIX 1 traveler: SCHEMA
    name TEXT
    cities TAG

HSET traveler:1 name "John Doe" cities "New York, Barcelona, San Francisco"
HSET traveler:2 name "Jane Smith" cities "New York, Los Angeles, Tokyo"
```

**Find travelers who visited any of these cities:**
```sql
FT.SEARCH travelers "@cities:{ New York | Los Angeles | Barcelona }"
# Returns: Both John and Jane
```

**Find travelers who visited all of these cities:**
```sql
FT.SEARCH travelers "@cities:{ New York } @cities:{ Barcelona }"
# Returns: Only John (has both New York and Barcelona)
```

## Handle special characters

Tag fields can contain any punctuation except the field separator, but you need to escape certain characters in queries.

### Defining tags with special characters

You can store tags with punctuation without escaping:

```sql
FT.CREATE products ON HASH PREFIX 1 test: SCHEMA tags TAG

HSET test:1 tags "Andrew's Top 5,Justin's Top 5,5-Star Rating"
HSET test:2 tags "Best Buy,Top-Rated,Editor's Choice"
```

### Querying tags with special characters

**Escape punctuation in queries** using backslash (`\`):

```sql
# Query for "Andrew's Top 5"
FT.SEARCH products "@tags:{ Andrew\\'s Top 5 }"

# Query for "5-Star Rating"
FT.SEARCH products "@tags:{ 5\\-Star Rating }"

# Query for "Editor's Choice"
FT.SEARCH products "@tags:{ Editor\\'s Choice }"
```

### Characters that need escaping

In tag queries, escape these characters:
- Single quotes: `'` → `\\'`
- Hyphens: `-` → `\\-`
- Parentheses: `()` → `\\(\\)`
- Brackets: `[]{}` → `\\[\\]\\{\\}`
- Pipes: `|` → `\\|`

### Spaces in tags

**Modern Redis** (v2.4+): Spaces don't need escaping in tag queries
```sql
FT.SEARCH products "@tags:{ Top Rated Product }"
```

**Older versions** or **dialect 1**: Escape spaces
```sql
FT.SEARCH products "@tags:{ Top\\ Rated\\ Product }"
```

### Best practices

- **Use simple separators**: Stick to comma (`,`) or semicolon (`;`)
- **Avoid complex punctuation**: Keep tag values simple when possible
- **Test your queries**: Verify escaping works with your specific characters
- **Use consistent casing**: Decide on case sensitivity early in your design

See [Query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax#tag-filters" >}}) for complete escaping rules.

## Performance and architecture considerations

### Multiple TAG fields versus a single TAG field

You can structure your data in two ways:

1. Multiple single-value TAG fields

    ```sql
    FT.CREATE products ON JSON PREFIX 1 product: SCHEMA
        $.color AS color TAG
        $.brand AS brand TAG
        $.type AS type TAG

    JSON.SET product:1 $ '{"color": "blue", "brand": "ASUS", "type": "laptop"}'

    # Query specific fields
    FT.SEARCH products '@color:{blue} @brand:{ASUS}'
    ```

1. Single multi-value TAG field

    ```sql
    FT.CREATE products ON JSON PREFIX 1 product: SCHEMA
        $.tags[*] AS tags TAG

    JSON.SET product:1 $ '{"tags": ["color:blue", "brand:ASUS", "type:laptop"]}'

    # Query with prefixed values
    FT.SEARCH products '@tags:{color:blue} @tags:{brand:ASUS}'
    ```

### Performance comparison

Both approaches have similar performance characteristics:

- Memory usage is comparable: TAG indexes are highly compressed regardless of structure.
- Query speed is similar: both use the same underlying inverted index structure.
- Index efficiency; TAG fields store only document IDs (1-2 bytes per entry).

### Choose TAG fields based on your use case

Use multiple TAG fields when:

- You need field-specific queries (`@color:{blue}` vs `@brand:{ASUS}`).
- Your schema is stable and well-defined.
- You want cleaner, more readable queries.
- You need different configurations per field (for example, case-sensitive versus case-insensitive).

Use single TAG field when:

- You have dynamic or unknown tag categories.
- You want maximum flexibility for adding new tag types.
- Your application manages tag prefixing/namespacing.
- You have many sparse categorical fields.

## An e-commerce use case

```sql
# Product categories and attributes
FT.CREATE products ON HASH PREFIX 1 product: SCHEMA
    name TEXT
    category TAG
    brand TAG
    features TAG SEPARATOR ";"

HSET product:1 name "Gaming Laptop" category "Electronics" brand "ASUS" features "RGB;16GB RAM;SSD"

# Find gaming products with specific features
FT.SEARCH products "@category:{Electronics} @features:{RGB} @features:{SSD}"
```

## Next steps

- Learn about [tokenization rules]({{< relref "/develop/ai/search-and-query/advanced-concepts/escaping#tokenization-rules-for-tag-fields" >}}) for tag fields
- Explore [field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) for other field types
- See [query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}) for advanced query patterns

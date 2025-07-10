---
aliases:
- /develop/interact/search-and-query/advanced-concepts/tags
- /develop/ai/search-and-query/advanced-concepts/tags
- /develop/interact/search-and-query/indexing/tags
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
weight: 15
---

Tag fields provide exact match search capabilities with high performance and memory efficiency. Use tag fields when you need to filter documents by specific values without the complexity of full-text search tokenization.

## When to use tag fields

Tag fields excel in scenarios requiring exact matching:

- **Product categories**: Electronics, Clothing, Books
- **User roles**: Admin, Editor, Viewer
- **Status values**: Active, Pending, Completed
- **Geographic regions**: US, EU, APAC
- **Content types**: Video, Image, Document

## Key advantages

Tag fields offer several benefits over TEXT fields:

1. **Exact match semantics** - Find documents with precise values
2. **High performance** - Compressed indexes with minimal memory usage
3. **Simple tokenization** - No stemming or complex text processing
4. **Multiple values** - Support comma-separated lists in a single field
5. **Case control** - Optional case-sensitive matching

## Tag fields vs TEXT fields

| Feature | Tag Fields | TEXT Fields |
|---------|------------|-------------|
| **Search type** | Exact match | Full-text search |
| **Tokenization** | Simple delimiter splitting | Complex word tokenization |
| **Stemming** | None | Language-specific stemming |
| **Memory usage** | Very low (1-2 bytes per entry) | Higher (frequencies, positions) |
| **Performance** | Fastest | Slower for exact matches |
| **Use case** | Categories, filters, IDs | Content search, descriptions |

Tag fields interpret text as a simple list of *tags* delimited by a [separator](#creating-a-tag-field) character (comma "," by default). This approach enables simpler [tokenization]({{< relref "/develop/ai/search-and-query/indexing/tokenization" >}}) and encoding, making tag indexes much more efficient than full-text indexes.

**Important**: You can only access tag field values using special tag query syntax - they don't appear in general field-less searches.

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

- **Hash documents**: Default separator is comma (`,`). You can use any printable ASCII character
- **JSON documents**: No default separator - you must specify one explicitly if needed
- **Custom separators**: Use semicolon (`;`), pipe (`|`), or other characters as needed

### Case sensitivity

- **Default**: Case-insensitive matching (`red` matches `Red`, `RED`)
- **CASESENSITIVE**: Preserves original case for exact matching

### Examples

**Basic tag field with JSON:**
```sql
JSON.SET key:1 $ '{"colors": "red, orange, yellow"}'
FT.CREATE idx ON JSON PREFIX 1 key: SCHEMA $.colors AS colors TAG SEPARATOR ","

> FT.SEARCH idx '@colors:{orange}'
1) "1"
2) "key:1"
3) 1) "$"
   2) "{\"colors\":\"red, orange, yellow\"}"
```

**Case-sensitive tags with Hash:**
```sql
HSET product:1 categories "Electronics,Gaming,PC"
FT.CREATE products ON HASH PREFIX 1 product: SCHEMA categories TAG CASESENSITIVE

> FT.SEARCH products '@categories:{PC}'
1) "1"
2) "product:1"
```

**Custom separator:**
```sql
HSET book:1 genres "Fiction;Mystery;Thriller"
FT.CREATE books ON HASH PREFIX 1 book: SCHEMA genres TAG SEPARATOR ";"
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

1. **Use simple separators**: Stick to comma (`,`) or semicolon (`;`)
2. **Avoid complex punctuation**: Keep tag values simple when possible
3. **Test your queries**: Verify escaping works with your specific characters
4. **Use consistent casing**: Decide on case sensitivity early in your design

See [Query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax#tag-filters" >}}) for complete escaping rules.

## Common use cases

### E-commerce filtering
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

### User management
```sql
# User roles and permissions
FT.CREATE users ON HASH PREFIX 1 user: SCHEMA
    name TEXT
    roles TAG SEPARATOR ","
    departments TAG SEPARATOR ","

HSET user:1 name "John Admin" roles "admin,editor" departments "IT,Security"

# Find users with admin access in IT
FT.SEARCH users "@roles:{admin} @departments:{IT}"
```

### Content classification
```sql
# Document tagging system
FT.CREATE docs ON JSON PREFIX 1 doc: SCHEMA
    $.title AS title TEXT
    $.tags AS tags TAG SEPARATOR ","
    $.status AS status TAG

JSON.SET doc:1 $ '{"title":"API Guide","tags":"technical,guide,api","status":"published"}'

# Find published technical documents
FT.SEARCH docs "@status:{published} @tags:{technical}"
```

## Next steps

- Learn about [tokenization rules]({{< relref "/develop/ai/search-and-query/indexing/tokenization" >}}) for tag fields
- Explore [field and type options]({{< relref "/develop/ai/search-and-query/indexing/field-and-type-options" >}}) for other field types
- See [query syntax]({{< relref "/develop/ai/search-and-query/advanced-concepts/query_syntax" >}}) for advanced query patterns

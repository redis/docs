---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Index and query JSON documents in real time with Redis Search
linkTitle: JSON document queries
title: How do I query JSON documents in real time?
weight: 1
---

## Problem

You need to:

- Store complex entities as JSON documents
- Query documents by any field without knowing the query pattern in advance
- Perform full-text search across text fields
- Filter and sort results by multiple criteria
- Aggregate and analyze document data
- Return results in milliseconds at scale

Traditional databases require predefined schemas and indexes, making it hard to adapt to changing query patterns.

## Solution overview

Redis combines JSON document storage with Search indexing to provide real-time queries:

1. **Store documents** - Use JSON.SET to store documents with nested structures
2. **Create indexes** - Define searchable fields with FT.CREATE
3. **Query documents** - Use FT.SEARCH with filters, sorting, and pagination
4. **Aggregate data** - Use FT.AGGREGATE for analytics

Documents are indexed automatically as they're added or updated.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         JSON Document Query System                       │
└──────────────────────────────────────────────────────────┘

1. Store JSON Documents
┌────────────────────────────────────────────────────────┐
│ JSON.SET product:1 $ '{                                │
│   "name": "Laptop",                                    │
│   "category": "electronics",                           │
│   "price": 999,                                        │
│   "specs": {                                           │
│     "cpu": "Intel i7",                                 │
│     "ram": 16                                          │
│   },                                                   │
│   "tags": ["computer", "portable"]                     │
│ }'                                                     │
└────────────────────────────────────────────────────────┘

2. Create Search Index
┌────────────────────────────────────────────────────────┐
│ FT.CREATE idx:products ON JSON PREFIX 1 product:       │
│   SCHEMA                                               │
│     $.name        AS name        TEXT                  │
│     $.category    AS category    TAG                   │
│     $.price       AS price       NUMERIC SORTABLE      │
│     $.specs.cpu   AS cpu         TEXT                  │
│     $.specs.ram   AS ram         NUMERIC               │
│     $.tags[*]     AS tags        TAG                   │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Automatic Indexing                                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │ JSON Document → Index Extraction → Inverted     │  │
│  │                                     Indexes      │  │
│  │                                                  │  │
│  │ TEXT fields    → Full-text search index         │  │
│  │ TAG fields     → Exact-match index              │  │
│  │ NUMERIC fields → Range query index              │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

3. Query Documents
┌────────────────────────────────────────────────────────┐
│ FT.SEARCH idx:products                                 │
│   "@category:{electronics}                             │
│    @price:[500 1500]                                   │
│    @tags:{portable}"                                   │
│   SORTBY price ASC                                     │
│   LIMIT 0 10                                           │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Query Execution                                       │
│  ┌──────────────────────────────────────────────────┐  │
│  │ 1. Filter: category=electronics (TAG index)      │  │
│  │ 2. Filter: price 500-1500 (NUMERIC index)        │  │
│  │ 3. Filter: tags contains portable (TAG index)    │  │
│  │ 4. Sort: by price ascending                      │  │
│  │ 5. Limit: return first 10 results                │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Results (< 10ms)                                      │
│  1. product:1 - Laptop - $999                          │
│  2. product:5 - Tablet - $599                          │
│  3. product:8 - Chromebook - $499                      │
└────────────────────────────────────────────────────────┘

4. Aggregate Data
┌────────────────────────────────────────────────────────┐
│ FT.AGGREGATE idx:products "*"                          │
│   GROUPBY 1 @category                                  │
│     REDUCE AVG 1 @price AS avg_price                   │
│     REDUCE COUNT 0 AS count                            │
│   SORTBY 2 @count DESC                                 │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Aggregation Results                                   │
│  electronics: avg=$899, count=45                       │
│  clothing: avg=$49, count=120                          │
│  books: avg=$19, count=200                             │
└────────────────────────────────────────────────────────┘

Benefits:
  - Schema-less JSON storage
  - Automatic index updates
  - Complex queries in <10ms
  - Full-text + exact + range queries
  - Real-time aggregations
```

## Prerequisites

Before implementing this pattern, review:

- [Document database quick start]({{< relref "/develop/get-started/document-database" >}}) - JSON + Search basics
- [JSON data type]({{< relref "/develop/data-types/json" >}}) - JSON operations
- [Search and query]({{< relref "/develop/ai/search-and-query" >}}) - Search documentation
- [Client library examples]({{< relref "/develop/clients" >}}) - Language-specific JSON query examples

## Implementation

### Step 1: Store JSON documents

Store entities as JSON documents using JSON.SET.

**Python example:**

```python
import redis
from redis.commands.json.path import Path

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Store product documents
products = [
    {
        "id": "product:1",
        "name": "Wireless Headphones",
        "brand": "AudioTech",
        "price": 99.99,
        "category": "Electronics",
        "tags": ["wireless", "bluetooth", "audio"],
        "stock": 150,
        "rating": 4.5
    },
    {
        "id": "product:2",
        "name": "Running Shoes",
        "brand": "SportFit",
        "price": 79.99,
        "category": "Sports",
        "tags": ["running", "athletic", "footwear"],
        "stock": 200,
        "rating": 4.7
    }
]

for product in products:
    r.json().set(product["id"], Path.root_path(), product)
    print(f"Stored {product['id']}")
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient()
  .on('error', err => console.log('Redis Client Error', err))
  .connect();

const products = [
  {
    id: 'product:1',
    name: 'Wireless Headphones',
    brand: 'AudioTech',
    price: 99.99,
    category: 'Electronics',
    tags: ['wireless', 'bluetooth', 'audio'],
    stock: 150,
    rating: 4.5
  }
];

for (const product of products) {
  await client.json.set(product.id, '$', product);
  console.log(`Stored ${product.id}`);
}
```

### Step 2: Create a search index

Define which fields to index and how to index them.

```redis
FT.CREATE idx:products 
  ON JSON 
  PREFIX 1 product: 
  SCHEMA 
    $.name AS name TEXT SORTABLE 
    $.brand AS brand TAG 
    $.price AS price NUMERIC SORTABLE 
    $.category AS category TAG 
    $.tags[*] AS tags TAG 
    $.stock AS stock NUMERIC 
    $.rating AS rating NUMERIC SORTABLE
```

**Python example:**

```python
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType

# Create index definition
index_def = IndexDefinition(
    prefix=["product:"],
    index_type=IndexType.JSON
)

# Define schema
schema = (
    TextField("$.name", as_name="name", sortable=True),
    TagField("$.brand", as_name="brand"),
    NumericField("$.price", as_name="price", sortable=True),
    TagField("$.category", as_name="category"),
    TagField("$.tags[*]", as_name="tags"),
    NumericField("$.stock", as_name="stock"),
    NumericField("$.rating", as_name="rating", sortable=True)
)

# Create the index
try:
    r.ft("idx:products").create_index(schema, definition=index_def)
    print("Index created successfully")
except Exception as e:
    print(f"Index creation error: {e}")
```

### Step 3: Query documents

Search for documents using various query patterns.

**Simple text search:**

```python
# Search for products containing "wireless"
results = r.ft("idx:products").search("@name:wireless")

for doc in results.docs:
    print(f"{doc.id}: {doc.name} - ${doc.price}")
```

**Filter by category:**

```python
# Find all electronics
results = r.ft("idx:products").search("@category:{Electronics}")
```

**Numeric range queries:**

```python
from redis.commands.search.query import Query

# Find products priced between $50 and $100
query = Query("@price:[50 100]").sort_by("price")
results = r.ft("idx:products").search(query)
```

**Combined filters:**

```python
# Find electronics under $100 with rating > 4.0
query = Query("@category:{Electronics} @price:[0 100] @rating:[4.0 +inf]") \
    .sort_by("rating", asc=False) \
    .paging(0, 10)

results = r.ft("idx:products").search(query)
```

**Tag queries:**

```python
# Find products with specific tags
results = r.ft("idx:products").search("@tags:{wireless | bluetooth}")
```

**Node.js example:**

```javascript
// Search for wireless products
const results = await client.ft.search('idx:products', '@name:wireless');

for (const doc of results.documents) {
  console.log(`${doc.id}: ${doc.value.name} - $${doc.value.price}`);
}

// Combined filters with sorting
const filtered = await client.ft.search(
  'idx:products',
  '@category:{Electronics} @price:[0 100]',
  {
    SORTBY: {
      BY: 'price',
      DIRECTION: 'ASC'
    },
    LIMIT: {
      from: 0,
      size: 10
    }
  }
);
```

### Step 4: Aggregate data

Use FT.AGGREGATE for analytics and grouping.

**Python example:**

```python
from redis.commands.search.aggregation import AggregateRequest, Asc, Desc
from redis.commands.search import reducers

# Group by category and calculate average price
request = AggregateRequest("*") \
    .group_by("@category", reducers.avg("@price").alias("avg_price")) \
    .sort_by(Desc("@avg_price"))

results = r.ft("idx:products").aggregate(request)

for row in results.rows:
    print(f"Category: {row[1]}, Avg Price: ${row[3]:.2f}")
```

**Count products by brand:**

```python
request = AggregateRequest("*") \
    .group_by("@brand", reducers.count().alias("count")) \
    .sort_by(Desc("@count"))

results = r.ft("idx:products").aggregate(request)
```

### Step 5: Update documents

Updates to JSON documents are automatically reflected in the index.

```python
# Update price
r.json().set("product:1", "$.price", 89.99)

# Update nested field
r.json().set("product:1", "$.stock", 175)

# Add to array
r.json().arrappend("product:1", "$.tags", "premium")

# Query immediately reflects changes
results = r.ft("idx:products").search("@price:[0 90]")
```

## Redis Cloud setup

When deploying JSON queries to Redis Cloud:

1. **Plan index size** - Indexes consume memory; monitor usage
2. **Choose field types carefully** - TEXT for full-text, TAG for exact match, NUMERIC for ranges
3. **Use SORTABLE sparingly** - Adds memory overhead
4. **Set appropriate prefixes** - Organize documents by prefix
5. **Monitor query performance** - Use FT.PROFILE to analyze queries

Example configuration:
- **Memory**: Account for both documents and indexes
- **Index fields**: Only index fields you'll query
- **Sortable fields**: Only fields you'll sort by
- **Pagination**: Use LIMIT to control result size

## Common pitfalls

1. **Indexing all fields** - Only index fields you'll query
2. **Not using TAG for exact matches** - TEXT fields are tokenized
3. **Missing SORTABLE** - Can't sort by field without SORTABLE flag
4. **Wrong JSONPath** - Use `$.field` for JSON, not `field`
5. **Not handling index creation errors** - Index may already exist

## Related patterns

- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Semantic search
- [Hybrid search]({{< relref "/develop/patterns/queries/hybrid-search" >}}) - Combine vector and keyword
- [JSON document modeling]({{< relref "/develop/patterns/data-modeling/json-documents" >}}) - Structure documents
- [Real-time aggregations]({{< relref "/develop/patterns/analytics/real-time-aggregations" >}}) - Analyze data

## More information

- [Document database quick start]({{< relref "/develop/get-started/document-database" >}})
- [JSON documentation]({{< relref "/develop/data-types/json" >}})
- [Search documentation]({{< relref "/develop/ai/search-and-query" >}})
- [FT.CREATE command]({{< relref "/commands/ft.create" >}})
- [FT.SEARCH command]({{< relref "/commands/ft.search" >}})
- [FT.AGGREGATE command]({{< relref "/commands/ft.aggregate" >}})
- [Python JSON query examples]({{< relref "/develop/clients/redis-py/queryjson" >}})
- [Node.js JSON query examples]({{< relref "/develop/clients/nodejs/queryjson" >}})


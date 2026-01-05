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
description: Model entities as JSON documents for flexible schemas and fast queries
linkTitle: JSON documents
title: How do I model entities as JSON documents?
weight: 1
---

## Problem

You need to store complex entities with:

- Nested structures and arrays
- Flexible schemas that evolve over time
- Fast queries on nested fields
- Partial updates without reading entire document
- Support for multiple data types

Traditional key-value storage requires serialization and can't query nested fields efficiently.

## Solution overview

Redis JSON provides native JSON document storage with:

1. **JSONPath queries** - Access nested fields directly
2. **Atomic operations** - Update parts of documents atomically
3. **Indexing** - Create search indexes on JSON fields
4. **Type preservation** - Numbers, strings, booleans, nulls, arrays, objects
5. **Memory efficiency** - Optimized internal representation

Combine JSON with Search for powerful document queries.

**Architecture:**

```
┌──────────────────────────────────────────────────────┐
│  Redis JSON Document Storage                         │
└──────────────────────────────────────────────────────┘

Key: user:1001
┌────────────────────────────────────────────────────┐
│ {                                                  │
│   "id": 1001,                                      │
│   "name": "Alice",                                 │
│   "email": "alice@example.com",                    │
│   "profile": {                    ◀── Nested       │
│     "age": 30,                                     │
│     "city": "San Francisco"                        │
│   },                                               │
│   "orders": [                     ◀── Arrays       │
│     {"id": "A1", "total": 99.99},                 │
│     {"id": "A2", "total": 149.99}                 │
│   ],                                               │
│   "active": true,                 ◀── Booleans     │
│   "version": 3                                     │
│ }                                                  │
└────────────────────────────────────────────────────┘

Operations:
  JSON.SET user:1001 $ '{...}'        - Store document
  JSON.GET user:1001 $.profile.city   - Get nested field
  JSON.SET user:1001 $.profile.age 31 - Update field
  JSON.ARRAPPEND user:1001 $.orders   - Add to array
  JSON.NUMINCRBY user:1001 $.version  - Increment number

With Search Index:
  FT.SEARCH idx:users "@city:San Francisco"
  FT.SEARCH idx:users "@age:[25 35]"
  FT.AGGREGATE idx:users * GROUPBY 1 @city
```

## Prerequisites

Before implementing this pattern, review:

- [JSON data type]({{< relref "/develop/data-types/json" >}}) - JSON documentation
- [Document database quick start]({{< relref "/develop/get-started/document-database" >}}) - Getting started
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Query patterns
- [JSONPath syntax]({{< relref "/develop/data-types/json/path" >}}) - Path expressions

## Implementation

### Step 1: Store JSON documents

Use JSON.SET to store documents.

**Python example:**

```python
import redis
from redis.commands.json.path import Path

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Store a user document
user = {
    "id": "user:123",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 28,
    "address": {
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
    },
    "preferences": {
        "theme": "dark",
        "notifications": True,
        "language": "en"
    },
    "tags": ["premium", "verified"],
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-03-20T15:45:00Z"
}

r.json().set("user:123", Path.root_path(), user)

# Store a product document
product = {
    "id": "product:456",
    "name": "Wireless Headphones",
    "brand": "AudioTech",
    "price": 99.99,
    "currency": "USD",
    "in_stock": True,
    "quantity": 150,
    "categories": ["Electronics", "Audio", "Headphones"],
    "specs": {
        "battery_life": "30 hours",
        "bluetooth": "5.0",
        "noise_cancellation": True,
        "weight": "250g"
    },
    "ratings": {
        "average": 4.5,
        "count": 1247
    },
    "images": [
        "https://example.com/img1.jpg",
        "https://example.com/img2.jpg"
    ]
}

r.json().set("product:456", Path.root_path(), product)
```

**Node.js example:**

```javascript
import { createClient } from 'redis';

const client = await createClient().connect();

const user = {
  id: 'user:123',
  name: 'Alice Johnson',
  email: 'alice@example.com',
  age: 28,
  address: {
    street: '123 Main St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94102'
  },
  tags: ['premium', 'verified']
};

await client.json.set('user:123', '$', user);
```

### Step 2: Read and query documents

Retrieve entire documents or specific fields.

**Python example:**

```python
# Get entire document
user = r.json().get("user:123")
print(f"User: {user['name']}")

# Get specific field
email = r.json().get("user:123", Path("$.email"))
print(f"Email: {email}")

# Get nested field
city = r.json().get("user:123", Path("$.address.city"))
print(f"City: {city}")

# Get multiple fields
fields = r.json().get("user:123", Path("$.name"), Path("$.email"), Path("$.age"))
print(f"Fields: {fields}")

# Get array element
first_tag = r.json().get("user:123", Path("$.tags[0]"))
print(f"First tag: {first_tag}")
```

### Step 3: Update documents

Update specific fields without replacing entire document.

**Python example:**

```python
# Update single field
r.json().set("user:123", Path("$.age"), 29)

# Update nested field
r.json().set("user:123", Path("$.address.city"), "Los Angeles")

# Update multiple fields (use pipeline)
pipe = r.pipeline()
pipe.json().set("user:123", Path("$.preferences.theme"), "light")
pipe.json().set("user:123", Path("$.last_login"), "2024-03-21T09:15:00Z")
pipe.execute()

# Append to array
r.json().arrappend("user:123", Path("$.tags"), "early_adopter")

# Increment numeric field
r.json().numincrby("product:456", Path("$.quantity"), -5)
r.json().numincrby("product:456", Path("$.ratings.count"), 1)

# Toggle boolean
current = r.json().get("user:123", Path("$.preferences.notifications"))
r.json().set("user:123", Path("$.preferences.notifications"), not current[0])
```

**Node.js example:**

```javascript
// Update field
await client.json.set('user:123', '$.age', 29);

// Update nested field
await client.json.set('user:123', '$.address.city', 'Los Angeles');

// Append to array
await client.json.arrAppend('user:123', '$.tags', 'early_adopter');

// Increment number
await client.json.numIncrBy('product:456', '$.quantity', -5);
```

### Step 4: Array operations

Manipulate arrays within documents.

**Python example:**

```python
# Append to array
r.json().arrappend("user:123", Path("$.tags"), "vip", "beta_tester")

# Insert at position
r.json().arrinsert("user:123", Path("$.tags"), 0, "featured")

# Get array length
length = r.json().arrlen("user:123", Path("$.tags"))
print(f"Number of tags: {length}")

# Remove from array by index
r.json().arrpop("user:123", Path("$.tags"), -1)  # Remove last element

# Trim array
r.json().arrtrim("user:123", Path("$.tags"), 0, 4)  # Keep first 5 elements

# Get array index of value
index = r.json().arrindex("user:123", Path("$.tags"), "premium")
print(f"'premium' is at index: {index}")
```

### Step 5: Complex document modeling

Model relationships and nested structures.

**Python example:**

```python
# Order with line items
order = {
    "id": "order:789",
    "customer_id": "user:123",
    "status": "processing",
    "created_at": "2024-03-20T14:30:00Z",
    "shipping_address": {
        "name": "Alice Johnson",
        "street": "123 Main St",
        "city": "San Francisco",
        "state": "CA",
        "zip": "94102"
    },
    "items": [
        {
            "product_id": "product:456",
            "name": "Wireless Headphones",
            "quantity": 1,
            "price": 99.99
        },
        {
            "product_id": "product:789",
            "name": "Phone Case",
            "quantity": 2,
            "price": 19.99
        }
    ],
    "totals": {
        "subtotal": 139.97,
        "tax": 11.20,
        "shipping": 5.99,
        "total": 157.16
    },
    "payment": {
        "method": "credit_card",
        "last_four": "4242",
        "status": "authorized"
    }
}

r.json().set("order:789", Path.root_path(), order)

# Calculate total from items
items = r.json().get("order:789", Path("$.items"))
total = sum(item['quantity'] * item['price'] for item in items[0])
r.json().set("order:789", Path("$.totals.subtotal"), total)

# Add item to order
new_item = {
    "product_id": "product:999",
    "name": "Screen Protector",
    "quantity": 1,
    "price": 9.99
}
r.json().arrappend("order:789", Path("$.items"), new_item)

# Update order status
r.json().set("order:789", Path("$.status"), "shipped")
r.json().set("order:789", Path("$.shipped_at"), "2024-03-21T10:00:00Z")
```

### Step 6: Document versioning

Implement optimistic locking with version numbers.

**Python example:**

```python
def update_with_version(key, path, new_value):
    """Update document with optimistic locking"""
    # Get current version
    current_version = r.json().get(key, Path("$.version"))
    if current_version is None:
        current_version = [0]
    
    # Update with version check (using Lua script)
    script = """
    local key = KEYS[1]
    local path = ARGV[1]
    local new_value = ARGV[2]
    local expected_version = tonumber(ARGV[3])
    
    local current = redis.call('JSON.GET', key, '$.version')
    local version = cjson.decode(current)[1] or 0
    
    if version ~= expected_version then
        return redis.error_reply('Version mismatch')
    end
    
    redis.call('JSON.SET', key, path, new_value)
    redis.call('JSON.NUMINCRBY', key, '$.version', 1)
    
    return 'OK'
    """
    
    try:
        r.eval(script, 1, key, path, new_value, current_version[0])
        return True
    except redis.ResponseError as e:
        if 'Version mismatch' in str(e):
            return False
        raise

# Initialize document with version
doc = {
    "id": "doc:1",
    "data": "initial value",
    "version": 0
}
r.json().set("doc:1", Path.root_path(), doc)

# Update with version check
success = update_with_version("doc:1", "$.data", '"updated value"')
if success:
    print("Update successful")
else:
    print("Version conflict - retry")
```

## Redis Cloud setup

When deploying JSON documents to Redis Cloud:

1. **Plan document size** - Typical documents: 1KB-100KB
2. **Use indexes** - Create Search indexes for queries
3. **Set TTL** - Use EXPIRE for temporary documents
4. **Monitor memory** - JSON uses optimized storage but plan capacity
5. **Batch operations** - Use pipelines for multiple updates

Example configuration:
- **Document size**: 1-100KB typical
- **Indexes**: Create for frequently queried fields
- **TTL**: Set for session data, caches
- **Memory**: ~1.5x JSON string size (optimized)

## Common pitfalls

1. **Not using JSONPath** - Access nested fields directly, don't fetch entire document
2. **Missing indexes** - Create Search indexes for queries
3. **Large documents** - Keep documents focused (< 100KB)
4. **Not using atomic operations** - Use JSON.NUMINCRBY, JSON.ARRAPPEND
5. **Ignoring schema evolution** - Plan for adding/removing fields

## Related patterns

- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Query JSON documents
- [Secondary indexes]({{< relref "/develop/patterns/data-modeling/secondary-indexes" >}}) - Index design
- [Atomic operations]({{< relref "/develop/patterns/data-modeling/atomic-operations" >}}) - Multi-key updates

## More information

- [JSON data type]({{< relref "/develop/data-types/json" >}})
- [Document database quick start]({{< relref "/develop/get-started/document-database" >}})
- [JSONPath syntax]({{< relref "/develop/data-types/json/path" >}})
- [JSON.SET command]({{< relref "/commands/json.set" >}})
- [JSON.GET command]({{< relref "/commands/json.get" >}})
- [Python JSON examples]({{< relref "/develop/clients/redis-py/queryjson" >}})


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
description: Design secondary indexes for efficient queries on multiple attributes
linkTitle: Secondary indexes
title: How do I design secondary indexes?
weight: 3
---

## Problem

You need to query data by multiple attributes:

- Find users by email, username, or age
- Query products by category, price range, or brand
- Look up orders by customer, date, or status
- Support multiple access patterns efficiently
- Maintain indexes as data changes

Primary keys alone don't support these query patterns.

## Solution overview

Redis provides multiple indexing strategies:

1. **Redis Search** - Automatic indexing with FT.CREATE (recommended)
2. **Sorted sets** - Manual numeric/lexicographic indexes
3. **Sets** - Manual exact-match indexes
4. **Composite indexes** - Combine multiple fields

Choose based on query complexity and maintenance requirements.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         Secondary Index Strategies                       │
└──────────────────────────────────────────────────────────┘

Primary Data (User objects)
┌────────────────────────────────────────────────────────┐
│ user:1 → {id:1, email:"alice@ex.com", age:25, city:"SF"}│
│ user:2 → {id:2, email:"bob@ex.com", age:30, city:"NYC"} │
│ user:3 → {id:3, email:"carol@ex.com", age:25, city:"SF"}│
└────────────────────────────────────────────────────────┘

1. REDIS SEARCH (Automatic Indexing) - RECOMMENDED
┌────────────────────────────────────────────────────────┐
│ FT.CREATE idx:users ON JSON PREFIX 1 user:            │
│   SCHEMA                                               │
│     $.email AS email TAG                               │
│     $.age AS age NUMERIC                               │
│     $.city AS city TAG                                 │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Automatic Index Maintenance                           │
│  ┌──────────────────────────────────────────────────┐  │
│  │ JSON.SET user:1 → Index updated automatically    │  │
│  │ JSON.DEL user:1 → Index cleaned automatically    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                        │
│  Query: FT.SEARCH idx:users "@city:{SF} @age:[20 30]" │
│  Result: user:1, user:3 (< 1ms)                       │
└────────────────────────────────────────────────────────┘

2. SORTED SETS (Manual Numeric Indexes)
┌────────────────────────────────────────────────────────┐
│ Index by age:                                          │
│ ┌──────────────────────────────────────────────────┐  │
│ │ ZADD idx:users:age 25 user:1                     │  │
│ │ ZADD idx:users:age 30 user:2                     │  │
│ │ ZADD idx:users:age 25 user:3                     │  │
│ └──────────────────────────────────────────────────┘  │
│         │                                              │
│         ▼                                              │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Sorted Set: idx:users:age                        │  │
│ │ ┌──────────────────────────────────────────────┐ │  │
│ │ │ Score | Member                               │ │  │
│ │ ├───────┼──────────────────────────────────────┤ │  │
│ │ │  25   │ user:1                               │ │  │
│ │ │  25   │ user:3                               │ │  │
│ │ │  30   │ user:2                               │ │  │
│ │ └──────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│  Query: ZRANGEBYSCORE idx:users:age 20 30             │
│  Result: user:1, user:3, user:2                       │
│                                                        │
│  ⚠️  Manual maintenance required:                      │
│  - Update index when data changes                     │
│  - Delete from index when record deleted              │
└────────────────────────────────────────────────────────┘

3. SETS (Manual Exact-Match Indexes)
┌────────────────────────────────────────────────────────┐
│ Index by city:                                         │
│ ┌──────────────────────────────────────────────────┐  │
│ │ SADD idx:users:city:SF user:1 user:3             │  │
│ │ SADD idx:users:city:NYC user:2                   │  │
│ └──────────────────────────────────────────────────┘  │
│         │                                              │
│         ▼                                              │
│ ┌──────────────────────────────────────────────────┐  │
│ │ Set: idx:users:city:SF                           │  │
│ │ ┌──────────────────────────────────────────────┐ │  │
│ │ │ {user:1, user:3}                             │ │  │
│ │ └──────────────────────────────────────────────┘ │  │
│ │                                                  │  │
│ │ Set: idx:users:city:NYC                          │  │
│ │ ┌──────────────────────────────────────────────┐ │  │
│ │ │ {user:2}                                     │ │  │
│ │ └──────────────────────────────────────────────┘ │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│  Query: SMEMBERS idx:users:city:SF                    │
│  Result: user:1, user:3                               │
│                                                        │
│  ⚠️  Manual maintenance required                       │
└────────────────────────────────────────────────────────┘

4. COMPOSITE INDEXES (Multiple Fields)
┌────────────────────────────────────────────────────────┐
│ Index by city + age range:                            │
│ ┌──────────────────────────────────────────────────┐  │
│ │ ZADD idx:users:SF:age 25 user:1                  │  │
│ │ ZADD idx:users:SF:age 25 user:3                  │  │
│ │ ZADD idx:users:NYC:age 30 user:2                 │  │
│ └──────────────────────────────────────────────────┘  │
│                                                        │
│  Query: ZRANGEBYSCORE idx:users:SF:age 20 30          │
│  Result: user:1, user:3 (SF residents aged 20-30)     │
└────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  Decision Matrix                        │
├─────────────────────┬──────────────┬────────────────────┤
│ Strategy            │ Maintenance  │ Best For           │
├─────────────────────┼──────────────┼────────────────────┤
│ Redis Search        │ Automatic    │ Complex queries    │
│ Sorted Sets         │ Manual       │ Range queries      │
│ Sets                │ Manual       │ Exact matches      │
│ Composite           │ Manual       │ Multi-field lookup │
└─────────────────────┴──────────────┴────────────────────┘

Recommendation: Use Redis Search for automatic maintenance
and complex query support. Use manual indexes only for
simple, performance-critical lookups.
```

## Prerequisites

Before implementing this pattern, review:

- [Indexes documentation]({{< relref "/develop/clients/patterns/indexes" >}}) - Index patterns
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Search indexes
- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}}) - Manual indexes

## Implementation

### Step 1: Automatic indexes with Redis Search (recommended)

Create indexes automatically on JSON or hash fields.

**Python example:**

```python
import redis
from redis.commands.search.field import TextField, TagField, NumericField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Create index on JSON documents
schema = (
    TextField("$.name", as_name="name"),
    TextField("$.email", as_name="email"),
    TagField("$.status", as_name="status"),
    NumericField("$.age", as_name="age"),
    TagField("$.city", as_name="city")
)

index_def = IndexDefinition(prefix=["user:"], index_type=IndexType.JSON)
r.ft("idx:users").create_index(schema, definition=index_def)

# Query by email
results = r.ft("idx:users").search(Query("@email:alice@example.com"))

# Query by age range
results = r.ft("idx:users").search(Query("@age:[25 35]"))

# Query by city
results = r.ft("idx:users").search(Query("@city:{San Francisco}"))

# Composite query
results = r.ft("idx:users").search(
    Query("@status:{active} @age:[25 35] @city:{San Francisco}")
)
```

### Step 2: Manual numeric indexes with sorted sets

Create indexes for numeric fields using sorted sets.

**Python example:**

```python
def add_user_with_indexes(user_id, name, email, age, city):
    """Add user and maintain manual indexes"""
    pipe = r.pipeline()
    
    # Store user data
    pipe.json().set(f"user:{user_id}", "$", {
        "id": user_id,
        "name": name,
        "email": email,
        "age": age,
        "city": city
    })
    
    # Create age index (sorted set)
    pipe.zadd("idx:users:by_age", {user_id: age})
    
    # Create email index (hash for lookup)
    pipe.hset("idx:users:by_email", email, user_id)
    
    # Create city index (set)
    pipe.sadd(f"idx:users:by_city:{city}", user_id)
    
    pipe.execute()

# Add users
add_user_with_indexes("1", "Alice", "alice@example.com", 28, "San Francisco")
add_user_with_indexes("2", "Bob", "bob@example.com", 35, "New York")
add_user_with_indexes("3", "Charlie", "charlie@example.com", 30, "San Francisco")

# Query by age range
user_ids = r.zrangebyscore("idx:users:by_age", 25, 35)
print(f"Users aged 25-35: {user_ids}")

# Query by email
user_id = r.hget("idx:users:by_email", "alice@example.com")
print(f"User with email: {user_id}")

# Query by city
user_ids = r.smembers("idx:users:by_city:San Francisco")
print(f"Users in SF: {user_ids}")
```

### Step 3: Composite indexes

Combine multiple fields in a single index.

**Python example:**

```python
def create_composite_index(user_id, city, age):
    """Create composite index for city + age queries"""
    # Use sorted set with composite key
    # Score is age, member is city:user_id
    composite_key = f"{city}:{user_id}"
    r.zadd("idx:users:city_age", {composite_key: age})

def query_by_city_and_age(city, min_age, max_age):
    """Query users by city and age range"""
    # Get all entries in age range
    results = r.zrangebyscore("idx:users:city_age", min_age, max_age)
    
    # Filter by city prefix
    city_users = [
        r.split(':')[1] for r in results 
        if r.startswith(f"{city}:")
    ]
    
    return city_users

# Create composite indexes
create_composite_index("1", "San Francisco", 28)
create_composite_index("2", "New York", 35)
create_composite_index("3", "San Francisco", 30)

# Query
users = query_by_city_and_age("San Francisco", 25, 35)
print(f"SF users aged 25-35: {users}")
```

**Lexicographic composite index:**

```python
def create_lex_composite_index(user_id, status, created_date):
    """Create lexicographic composite index"""
    # Format: status:date:user_id
    # All with score 0 for lexicographic ordering
    composite_key = f"{status}:{created_date}:{user_id}"
    r.zadd("idx:users:status_date", {composite_key: 0})

def query_by_status_and_date_range(status, start_date, end_date):
    """Query by status and date range"""
    min_key = f"{status}:{start_date}:"
    max_key = f"{status}:{end_date}:\xff"
    
    results = r.zrangebylex("idx:users:status_date", 
                            f"[{min_key}", f"[{max_key}")
    
    # Extract user IDs
    user_ids = [r.split(':')[2] for r in results]
    return user_ids

# Create indexes
create_lex_composite_index("1", "active", "2024-01-15")
create_lex_composite_index("2", "active", "2024-02-20")
create_lex_composite_index("3", "inactive", "2024-01-10")

# Query active users from January
users = query_by_status_and_date_range("active", "2024-01-01", "2024-01-31")
print(f"Active users in January: {users}")
```

### Step 4: Maintaining indexes on updates

Keep indexes in sync when data changes.

**Python example:**

```python
def update_user_age(user_id, new_age):
    """Update user age and maintain indexes"""
    # Get old age
    old_age = r.zscore("idx:users:by_age", user_id)
    
    pipe = r.pipeline()
    
    # Update user data
    pipe.json().set(f"user:{user_id}", "$.age", new_age)
    
    # Update age index
    if old_age is not None:
        pipe.zrem("idx:users:by_age", user_id)
    pipe.zadd("idx:users:by_age", {user_id: new_age})
    
    pipe.execute()

def delete_user_with_indexes(user_id):
    """Delete user and all index entries"""
    # Get user data for index cleanup
    user = r.json().get(f"user:{user_id}")
    
    if not user:
        return
    
    pipe = r.pipeline()
    
    # Delete user data
    pipe.delete(f"user:{user_id}")
    
    # Remove from indexes
    pipe.zrem("idx:users:by_age", user_id)
    pipe.hdel("idx:users:by_email", user['email'])
    pipe.srem(f"idx:users:by_city:{user['city']}", user_id)
    
    pipe.execute()
```

### Step 5: Multi-value indexes

Index documents with array fields.

**Python example:**

```python
def add_product_with_tags(product_id, name, tags):
    """Add product and index by multiple tags"""
    pipe = r.pipeline()
    
    # Store product
    pipe.json().set(f"product:{product_id}", "$", {
        "id": product_id,
        "name": name,
        "tags": tags
    })
    
    # Create index entry for each tag
    for tag in tags:
        pipe.sadd(f"idx:products:by_tag:{tag}", product_id)
    
    pipe.execute()

def find_products_by_tags(tags, match_all=False):
    """Find products by tags"""
    if not tags:
        return []
    
    tag_keys = [f"idx:products:by_tag:{tag}" for tag in tags]
    
    if match_all:
        # Intersection - products with ALL tags
        return r.sinter(*tag_keys)
    else:
        # Union - products with ANY tag
        return r.sunion(*tag_keys)

# Add products
add_product_with_tags("1", "Laptop", ["electronics", "computers", "portable"])
add_product_with_tags("2", "Mouse", ["electronics", "accessories"])
add_product_with_tags("3", "Desk", ["furniture", "office"])

# Find products with ANY of these tags
products = find_products_by_tags(["electronics", "furniture"])
print(f"Electronics or furniture: {products}")

# Find products with ALL of these tags
products = find_products_by_tags(["electronics", "portable"], match_all=True)
print(f"Electronic AND portable: {products}")
```

### Step 6: Unique constraint indexes

Enforce uniqueness using indexes.

**Python example:**

```python
def add_user_with_unique_email(user_id, email, name):
    """Add user with unique email constraint"""
    # Check if email already exists
    existing = r.hget("idx:users:by_email", email)
    
    if existing:
        raise ValueError(f"Email {email} already exists")
    
    pipe = r.pipeline()
    
    # Add user
    pipe.json().set(f"user:{user_id}", "$", {
        "id": user_id,
        "email": email,
        "name": name
    })
    
    # Add to email index
    pipe.hset("idx:users:by_email", email, user_id)
    
    pipe.execute()

# Using SET NX for atomic unique check
def add_user_atomic_unique(user_id, email, name):
    """Atomically add user with unique email"""
    # Try to set email index atomically
    was_set = r.hsetnx("idx:users:by_email", email, user_id)
    
    if not was_set:
        raise ValueError(f"Email {email} already exists")
    
    try:
        # Add user data
        r.json().set(f"user:{user_id}", "$", {
            "id": user_id,
            "email": email,
            "name": name
        })
    except Exception as e:
        # Rollback email index on error
        r.hdel("idx:users:by_email", email)
        raise
```

## Redis Cloud setup

When deploying secondary indexes to Redis Cloud:

1. **Prefer Redis Search** - Automatic index maintenance
2. **Monitor index size** - Indexes consume memory
3. **Use appropriate data types** - Sorted sets for ranges, sets for exact match
4. **Batch index updates** - Use pipelines
5. **Consider index cardinality** - High cardinality may need different strategy

Example configuration:
- **Search indexes**: Automatic, recommended for most cases
- **Manual indexes**: For specific performance requirements
- **Memory overhead**: ~50-100% of data size for indexes
- **Update strategy**: Atomic with pipelines

## Common pitfalls

1. **Not maintaining indexes** - Indexes get out of sync with data
2. **Over-indexing** - Too many indexes waste memory
3. **Wrong index type** - Use TAG for exact match, TEXT for full-text
4. **Missing cleanup** - Delete index entries when deleting data
5. **Not using Search** - Manual indexes when Search would work better

## Related patterns

- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Search indexes
- [Atomic operations]({{< relref "/develop/patterns/data-modeling/atomic-operations" >}}) - Index updates
- [JSON documents]({{< relref "/develop/patterns/data-modeling/json-documents" >}}) - Document modeling

## More information

- [Indexes documentation]({{< relref "/develop/clients/patterns/indexes" >}})
- [FT.CREATE command]({{< relref "/commands/ft.create" >}})
- [Sorted sets]({{< relref "/develop/data-types/sorted-sets" >}})
- [Sets]({{< relref "/develop/data-types/sets" >}})
- [Search indexing]({{< relref "/develop/ai/search-and-query/indexing" >}})


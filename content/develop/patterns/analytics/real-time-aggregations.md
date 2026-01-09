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
description: Build real-time dashboards with Redis Search aggregations
linkTitle: Real-time aggregations
title: How do I build real-time dashboards with aggregations?
weight: 3
---

## Problem

You need to calculate real-time metrics and analytics:

- Group data by multiple dimensions (category, region, time)
- Calculate aggregates (sum, average, min, max, count)
- Build multi-level aggregations (group by, then reduce)
- Update dashboards in real time as data changes
- Query large datasets efficiently

Traditional databases require complex queries and may not provide real-time results.

## Solution overview

Redis Search provides powerful aggregation pipelines that:

1. **Group data** - Group by one or more fields
2. **Reduce** - Apply aggregation functions (sum, avg, count, etc.)
3. **Transform** - Apply functions to results
4. **Sort and limit** - Order and paginate results

Aggregations run directly on indexed data for fast results.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│         FT.AGGREGATE Pipeline                            │
└──────────────────────────────────────────────────────────┘

Input: Indexed Documents
┌────────────────────────────────────────────────────────┐
│ Sales Data (idx:sales)                                 │
│ ┌────────────────────────────────────────────────────┐ │
│ │ {product: "Laptop", region: "US", amount: 999}    │ │
│ │ {product: "Mouse", region: "US", amount: 29}      │ │
│ │ {product: "Laptop", region: "EU", amount: 1099}   │ │
│ │ {product: "Keyboard", region: "US", amount: 79}   │ │
│ │ {product: "Mouse", region: "EU", amount: 25}      │ │
│ │ ... 1M more documents ...                         │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│ FT.AGGREGATE idx:sales "*"                             │
│   GROUPBY 2 @region @product                           │
│     REDUCE SUM 1 @amount AS total_sales                │
│     REDUCE COUNT 0 AS num_orders                       │
│     REDUCE AVG 1 @amount AS avg_order                  │
│   SORTBY 2 @total_sales DESC                           │
│   LIMIT 0 10                                           │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Pipeline Stages                                       │
│                                                        │
│  Stage 1: FILTER (optional)                           │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Apply query filters                              │ │
│  │ @region:{US} @amount:[100 inf]                   │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         ▼                                              │
│  Stage 2: GROUPBY                                      │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Group by: region, product                        │ │
│  │                                                  │ │
│  │ US + Laptop    → [999, 1050, 899]                │ │
│  │ US + Mouse     → [29, 25, 30]                    │ │
│  │ EU + Laptop    → [1099, 1150]                    │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         ▼                                              │
│  Stage 3: REDUCE                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Apply aggregation functions                      │ │
│  │                                                  │ │
│  │ US + Laptop:                                     │ │
│  │   SUM(amount) = 2948                             │ │
│  │   COUNT(*) = 3                                   │ │
│  │   AVG(amount) = 982.67                           │ │
│  │                                                  │ │
│  │ US + Mouse:                                      │ │
│  │   SUM(amount) = 84                               │ │
│  │   COUNT(*) = 3                                   │ │
│  │   AVG(amount) = 28                               │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         ▼                                              │
│  Stage 4: SORTBY                                       │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Sort by total_sales DESC                         │ │
│  │                                                  │ │
│  │ 1. US + Laptop: $2948                            │ │
│  │ 2. EU + Laptop: $2249                            │ │
│  │ 3. US + Keyboard: $237                           │ │
│  │ 4. US + Mouse: $84                               │ │
│  └──────────────────────────────────────────────────┘ │
│         │                                              │
│         ▼                                              │
│  Stage 5: LIMIT                                        │
│  ┌──────────────────────────────────────────────────┐ │
│  │ Return top 10 results                            │ │
│  └──────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────────────────┐
│  Results (< 50ms for 1M docs)                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │ region | product  | total | count | avg          │  │
│  ├────────┼──────────┼───────┼───────┼──────────────┤  │
│  │ US     | Laptop   | 2948  | 3     | 982.67       │  │
│  │ EU     | Laptop   | 2249  | 2     | 1124.50      │  │
│  │ US     | Keyboard | 237   | 3     | 79.00        │  │
│  │ US     | Mouse    | 84    | 3     | 28.00        │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘

Available Reducers:
  - COUNT, COUNT_DISTINCT, COUNT_DISTINCTISH
  - SUM, AVG, MIN, MAX, STDDEV
  - FIRST_VALUE, RANDOM_SAMPLE
  - TOLIST (collect values into array)

Performance:
  - Runs on indexed data (no full scan)
  - Parallel execution
  - <50ms for millions of documents
  - Real-time dashboards
```

## Prerequisites

Before implementing this pattern, review:

- [Search aggregations]({{< relref "/develop/ai/search-and-query/query/aggregation" >}}) - Aggregation documentation
- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Index creation
- [FT.AGGREGATE command]({{< relref "/commands/ft.aggregate" >}}) - Command reference

## Implementation

### Step 1: Create index for aggregations

Define an index with fields you'll aggregate on.

**Python example:**

```python
import redis
from redis.commands.search.field import TextField, NumericField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

# Create index for sales data
schema = (
    TextField("$.product_name", as_name="product_name"),
    TagField("$.category", as_name="category"),
    TagField("$.region", as_name="region"),
    NumericField("$.amount", as_name="amount"),
    NumericField("$.quantity", as_name="quantity"),
    NumericField("$.timestamp", as_name="timestamp")
)

index_def = IndexDefinition(prefix=["sale:"], index_type=IndexType.JSON)
r.ft("idx:sales").create_index(schema, definition=index_def)
```

### Step 2: Simple aggregations

Group by a field and calculate aggregates.

**Python example:**

```python
from redis.commands.search.aggregation import AggregateRequest
from redis.commands.search import reducers

# Group by category and sum amounts
request = AggregateRequest("*") \
    .group_by("@category", reducers.sum("@amount").alias("total_sales")) \
    .sort_by("@total_sales", asc=False)

results = r.ft("idx:sales").aggregate(request)

print("Sales by category:")
for row in results.rows:
    category = row[1]
    total = row[3]
    print(f"  {category}: ${total:,.2f}")
```

**Node.js example:**

```javascript
const results = await client.ft.aggregate('idx:sales', '*', {
  STEPS: [{
    type: AggregateSteps.GROUPBY,
    properties: ['@category'],
    REDUCE: [{
      type: AggregateGroupByReducers.SUM,
      property: '@amount',
      AS: 'total_sales'
    }]
  }, {
    type: AggregateSteps.SORTBY,
    BY: {
      BY: '@total_sales',
      DIRECTION: 'DESC'
    }
  }]
});
```

### Step 3: Multiple aggregation functions

Calculate multiple metrics in one query.

**Python example:**

```python
# Group by category with multiple aggregates
request = AggregateRequest("*") \
    .group_by(
        "@category",
        reducers.sum("@amount").alias("total_sales"),
        reducers.avg("@amount").alias("avg_sale"),
        reducers.count().alias("num_sales"),
        reducers.max("@amount").alias("max_sale"),
        reducers.min("@amount").alias("min_sale")
    ) \
    .sort_by("@total_sales", asc=False)

results = r.ft("idx:sales").aggregate(request)

print("Detailed sales metrics by category:")
for row in results.rows:
    print(f"\nCategory: {row[1]}")
    print(f"  Total Sales: ${row[3]:,.2f}")
    print(f"  Average Sale: ${row[5]:,.2f}")
    print(f"  Number of Sales: {row[7]}")
    print(f"  Max Sale: ${row[9]:,.2f}")
    print(f"  Min Sale: ${row[11]:,.2f}")
```

### Step 4: Multi-level grouping

Group by multiple dimensions.

**Python example:**

```python
# Group by category and region
request = AggregateRequest("*") \
    .group_by(
        ["@category", "@region"],
        reducers.sum("@amount").alias("total_sales"),
        reducers.count().alias("num_sales")
    ) \
    .sort_by("@total_sales", asc=False) \
    .limit(0, 20)

results = r.ft("idx:sales").aggregate(request)

print("Sales by category and region:")
for row in results.rows:
    category = row[1]
    region = row[3]
    total = row[5]
    count = row[7]
    print(f"  {category} in {region}: ${total:,.2f} ({count} sales)")
```

### Step 5: Time-based aggregations

Group by time periods for trend analysis.

**Python example:**

```python
import time

def get_hourly_sales(hours=24):
    """Get sales aggregated by hour"""
    now = time.time()
    start_time = now - (hours * 3600)
    
    # Filter by time range and group by hour
    request = AggregateRequest(f"@timestamp:[{start_time} {now}]") \
        .apply(hour="floor(@timestamp/3600)") \
        .group_by(
            "@hour",
            reducers.sum("@amount").alias("total_sales"),
            reducers.count().alias("num_sales")
        ) \
        .sort_by("@hour")
    
    results = r.ft("idx:sales").aggregate(request)
    
    return results

# Get last 24 hours of sales by hour
hourly_sales = get_hourly_sales(24)

print("Hourly sales (last 24 hours):")
for row in hourly_sales.rows:
    hour = int(row[1])
    total = row[3]
    count = row[5]
    from datetime import datetime
    hour_str = datetime.fromtimestamp(hour * 3600).strftime("%Y-%m-%d %H:00")
    print(f"  {hour_str}: ${total:,.2f} ({count} sales)")
```

### Step 6: Filtered aggregations

Apply filters before aggregating.

**Python example:**

```python
def get_category_sales_by_region(category, min_amount=None):
    """Get sales for a category, grouped by region"""
    # Build filter query
    filters = [f"@category:{{{category}}}"]
    if min_amount:
        filters.append(f"@amount:[{min_amount} +inf]")
    
    query = " ".join(filters)
    
    request = AggregateRequest(query) \
        .group_by(
            "@region",
            reducers.sum("@amount").alias("total_sales"),
            reducers.avg("@amount").alias("avg_sale"),
            reducers.count().alias("num_sales")
        ) \
        .sort_by("@total_sales", asc=False)
    
    results = r.ft("idx:sales").aggregate(request)
    
    return results

# Get electronics sales by region (only sales > $100)
results = get_category_sales_by_region("Electronics", min_amount=100)

print("Electronics sales by region (>$100):")
for row in results.rows:
    region = row[1]
    total = row[3]
    avg = row[5]
    count = row[7]
    print(f"  {region}: ${total:,.2f} total, ${avg:,.2f} avg ({count} sales)")
```

### Step 7: Dashboard metrics

Build a complete dashboard with multiple metrics.

**Python example:**

```python
def get_dashboard_metrics(time_range_hours=24):
    """Get comprehensive dashboard metrics"""
    now = time.time()
    start_time = now - (time_range_hours * 3600)
    time_filter = f"@timestamp:[{start_time} {now}]"
    
    metrics = {}
    
    # Total sales
    request = AggregateRequest(time_filter) \
        .group_by(
            [],
            reducers.sum("@amount").alias("total"),
            reducers.count().alias("count"),
            reducers.avg("@amount").alias("average")
        )
    result = r.ft("idx:sales").aggregate(request)
    metrics["overall"] = {
        "total_sales": result.rows[0][1] if result.rows else 0,
        "num_sales": result.rows[0][3] if result.rows else 0,
        "avg_sale": result.rows[0][5] if result.rows else 0
    }
    
    # Sales by category
    request = AggregateRequest(time_filter) \
        .group_by("@category", reducers.sum("@amount").alias("total")) \
        .sort_by("@total", asc=False) \
        .limit(0, 5)
    result = r.ft("idx:sales").aggregate(request)
    metrics["top_categories"] = [
        {"category": row[1], "sales": row[3]}
        for row in result.rows
    ]
    
    # Sales by region
    request = AggregateRequest(time_filter) \
        .group_by("@region", reducers.sum("@amount").alias("total")) \
        .sort_by("@total", asc=False)
    result = r.ft("idx:sales").aggregate(request)
    metrics["by_region"] = [
        {"region": row[1], "sales": row[3]}
        for row in result.rows
    ]
    
    return metrics

# Get dashboard data
dashboard = get_dashboard_metrics(24)

print("\n=== Sales Dashboard (Last 24 Hours) ===\n")
print(f"Total Sales: ${dashboard['overall']['total_sales']:,.2f}")
print(f"Number of Sales: {dashboard['overall']['num_sales']}")
print(f"Average Sale: ${dashboard['overall']['avg_sale']:,.2f}")

print("\nTop Categories:")
for cat in dashboard['top_categories']:
    print(f"  {cat['category']}: ${cat['sales']:,.2f}")

print("\nSales by Region:")
for region in dashboard['by_region']:
    print(f"  {region['region']}: ${region['sales']:,.2f}")
```

## Redis Cloud setup

When deploying aggregations to Redis Cloud:

1. **Index all aggregation fields** - TAG for grouping, NUMERIC for calculations
2. **Use filters** - Reduce data before aggregating
3. **Limit results** - Use LIMIT to control result size
4. **Monitor performance** - Use FT.PROFILE to analyze queries
5. **Consider caching** - Cache frequent aggregation results

Example configuration:
- **Index fields**: Only fields used in aggregations
- **Result limit**: 100-1000 rows typical
- **Caching**: Cache results for 1-60 seconds
- **Refresh rate**: Balance freshness vs performance

## Common pitfalls

1. **Not indexing group-by fields** - Must be indexed as TAG or NUMERIC
2. **Missing SORTABLE** - Can't sort by field without SORTABLE flag
3. **Too many results** - Use LIMIT to control output
4. **Complex calculations** - Use APPLY for transformations
5. **Not using filters** - Filter before aggregating for performance

## Related patterns

- [JSON document queries]({{< relref "/develop/patterns/queries/json-document-queries" >}}) - Index creation
- [Sliding windows]({{< relref "/develop/patterns/analytics/sliding-windows" >}}) - Time-based metrics
- [Unique counting]({{< relref "/develop/patterns/analytics/unique-counting" >}}) - Cardinality estimation

## More information

- [Search aggregations]({{< relref "/develop/ai/search-and-query/query/aggregation" >}})
- [FT.AGGREGATE command]({{< relref "/commands/ft.aggregate" >}})
- [Aggregation reducers]({{< relref "/develop/ai/search-and-query/query/aggregation#reducers" >}})
- [FT.CREATE command]({{< relref "/commands/ft.create" >}})


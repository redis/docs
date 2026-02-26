---
linkTitle: SVS-VAMANA vector search
title: SVS-VAMANA Vector Search
weight: 09
url: '/develop/ai/redisvl/0.12.1/user_guide/svs_vamana/'
---


In this notebook, we will explore SVS-VAMANA (Scalable Vector Search with VAMANA graph algorithm), a graph-based vector search algorithm that is optimized to work with compression methods to reduce memory usage. It combines the Vamana graph algorithm with advanced compression techniques (LVQ and LeanVec) and is optimized for Intel hardware.

**How it works**

Vamana builds a single-layer proximity graph and prunes edges during construction based on tunable parameters, similar to HNSW but with a simpler structure. The compression methods apply per-vector normalization and scalar quantization, learning parameters directly from the data to enable fast, on-the-fly distance computations with SIMD-optimized layout Vector quantization and compression.


**SVS-VAMANA offers:**
- **Fast approximate nearest neighbor search** using graph-based algorithms
- **Vector compression** (LVQ, LeanVec) with up to 87.5% memory savings
- **Dimensionality reduction** (optional, with LeanVec)
- **Automatic performance optimization** through CompressionAdvisor

**Use SVS-VAMANA when:**
- Large datasets where memory is expensive
- Cloud deployments with memory-based pricing
- When 90-95% recall is acceptable
- High-dimensional vectors (>1024 dims) with LeanVec compression



**Table of Contents**

1. [Prerequisites](#Prerequisites)
2. [Quick Start with CompressionAdvisor](#Quick-Start-with-CompressionAdvisor)
3. [Creating an SVS-VAMANA Index](#Creating-an-SVS-VAMANA-Index)
4. [Loading Sample Data](#Loading-Sample-Data)
5. [Performing Vector Searches](#Performing-Vector-Searches)
6. [Understanding Compression Types](#Understanding-Compression-Types)
7. [Hybrid Queries with SVS-VAMANA](#Hybrid-Queries-with-SVS-VAMANA)
8. [Performance Monitoring](#Performance-Monitoring)
9. [Manual Configuration (Advanced)](#Manual-Configuration-(Advanced))
10. [Best Practices and Tips](#Best-Practices-and-Tips)
11. [Cleanup](#Cleanup)

---

## Prerequisites

Before running this notebook, ensure you have:
1. Installed `redisvl` and have that environment active for this notebook
2. A running Redis Stack instance with:
   - Redis >= 8.2.0
   - RediSearch >= 2.8.10

For example, you can run Redis Stack locally with Docker:

```bash
docker run -d -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

**Note:** SVS-VAMANA only supports FLOAT16 and FLOAT32 datatypes.


```python
# Import necessary modules
import numpy as np
from redisvl.index import SearchIndex
from redisvl.query import VectorQuery
from redisvl.utils import CompressionAdvisor
from redisvl.redis.utils import array_to_buffer

# Set random seed for reproducible results
np.random.seed(42)
```


```python
# Redis connection
REDIS_URL = "redis://localhost:6379"
```

## Quick Start with CompressionAdvisor

The easiest way to get started with SVS-VAMANA is using the `CompressionAdvisor` utility, which automatically recommends optimal configuration based on your vector dimensions and performance priorities.


```python
# Get recommended configuration for common embedding dimensions
dims = 1024  # Common embedding dimensions (works reliably with SVS-VAMANA)

config = CompressionAdvisor.recommend(
    dims=dims,
    priority="balanced"  # Options: "memory", "speed", "balanced"
)

print("Recommended Configuration:")
for key, value in config.items():
    print(f"  {key}: {value}")

# Estimate memory savings
savings = CompressionAdvisor.estimate_memory_savings(
    config["compression"],
    dims,
    config.get("reduce")
)
print(f"\nEstimated Memory Savings: {savings}%")
```

    Recommended Configuration:
      algorithm: svs-vamana
      datatype: float16
      graph_max_degree: 64
      construction_window_size: 300
      compression: LeanVec4x8
      reduce: 512
      search_window_size: 30
    
    Estimated Memory Savings: 81.2%


## Creating an SVS-VAMANA Index

Let's create an index using the recommended configuration. We'll use a simple schema with text content and vector embeddings.


```python
# Create index schema with recommended SVS-VAMANA configuration
schema = {
    "index": {
        "name": "svs_demo",
        "prefix": "doc",
    },
    "fields": [
        {"name": "content", "type": "text"},
        {"name": "category", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "dims": dims,
                **config,  # Use the recommended configuration
                "distance_metric": "cosine"
            }
        }
    ]
}

# Create the index
index = SearchIndex.from_dict(schema, redis_url=REDIS_URL)
index.create(overwrite=True)

print(f"✅ Created SVS-VAMANA index: {index.name}")
print(f"   Algorithm: {config['algorithm']}")
print(f"   Compression: {config['compression']}")
print(f"   Dimensions: {dims}")
if 'reduce' in config:
    print(f"   Reduced to: {config['reduce']} dimensions")
```

    ✅ Created SVS-VAMANA index: svs_demo
       Algorithm: svs-vamana
       Compression: LeanVec4x8
       Dimensions: 1024
       Reduced to: 512 dimensions


## Loading Sample Data

Let's create some sample documents with embeddings to demonstrate SVS-VAMANA search capabilities.


```python
# Generate sample data
sample_documents = [
    {"content": "Machine learning algorithms for data analysis", "category": "technology"},
    {"content": "Natural language processing and text understanding", "category": "technology"},
    {"content": "Computer vision and image recognition systems", "category": "technology"},
    {"content": "Delicious pasta recipes from Italy", "category": "food"},
    {"content": "Traditional French cooking techniques", "category": "food"},
    {"content": "Healthy meal planning and nutrition", "category": "food"},
    {"content": "Travel guide to European destinations", "category": "travel"},
    {"content": "Adventure hiking in mountain regions", "category": "travel"},
    {"content": "Cultural experiences in Asian cities", "category": "travel"},
    {"content": "Financial planning for retirement", "category": "finance"},
]

# Generate random embeddings for demonstration
# In practice, you would use a real embedding model
data_to_load = []

# Use reduced dimensions if LeanVec compression is applied
vector_dims = config.get("reduce", dims)
print(f"Creating vectors with {vector_dims} dimensions (reduced from {dims} if applicable)")

for i, doc in enumerate(sample_documents):
    # Create a random vector with some category-based clustering
    base_vector = np.random.random(vector_dims).astype(np.float32)
    
    # Add some category-based similarity (optional, for demo purposes)
    category_offset = hash(doc["category"]) % 100 / 1000.0
    base_vector[0] += category_offset
    
    # Convert to the datatype specified in config
    if config["datatype"] == "float16":
        base_vector = base_vector.astype(np.float16)
    
    data_to_load.append({
        "content": doc["content"],
        "category": doc["category"],
        "embedding": array_to_buffer(base_vector, dtype=config["datatype"])
    })

# Load data into the index
index.load(data_to_load)
print(f"✅ Loaded {len(data_to_load)} documents into the index")

# Wait a moment for indexing to complete
import time
time.sleep(2)

# Verify the data was loaded
info = index.info()
print(f"   Index now contains {info.get('num_docs', 0)} documents")
```

    Creating vectors with 512 dimensions (reduced from 1024 if applicable)
    ✅ Loaded 10 documents into the index
       Index now contains 0 documents


## Performing Vector Searches

Now let's perform some vector similarity searches using our SVS-VAMANA index.


```python
# Create a query vector (in practice, this would be an embedding of your query text)
# Important: Query vector must match the index datatype and dimensions
vector_dims = config.get("reduce", dims)
if config["datatype"] == "float16":
    query_vector = np.random.random(vector_dims).astype(np.float16)
else:
    query_vector = np.random.random(vector_dims).astype(np.float32)

# Perform a vector similarity search
query = VectorQuery(
    vector=query_vector.tolist(),
    vector_field_name="embedding",
    return_fields=["content", "category"],
    num_results=5
)

results = index.query(query)

print("🔍 Vector Search Results:")
print("=" * 50)
for i, result in enumerate(results, 1):
    distance = result.get('vector_distance', 'N/A')
    print(f"{i}. [{result['category']}] {result['content']}")
    print(f"   Distance: {distance:.4f}" if isinstance(distance, (int, float)) else f"   Distance: {distance}")
    print()
```

    🔍 Vector Search Results:
    ==================================================


## Runtime Parameters for Performance Tuning

SVS-VAMANA supports runtime parameters that can be adjusted at query time without rebuilding the index. These parameters allow you to fine-tune the trade-off between search speed and accuracy.

**Available Runtime Parameters:**

- **`search_window_size`**: Controls the size of the search window during KNN search (higher = better recall, slower search)
- **`epsilon`**: Approximation factor for range queries (default: 0.01)
- **`use_search_history`**: Whether to use search buffer (OFF/ON/AUTO, default: AUTO)
- **`search_buffer_capacity`**: Tuning parameter for 2-level compression (default: search_window_size)

Let's see how these parameters affect search performance:


```python
# Example 1: Basic query with default parameters
basic_query = VectorQuery(
    vector=query_vector.tolist(),
    vector_field_name="embedding",
    return_fields=["content", "category"],
    num_results=5
)

print("🔍 Basic Query (default parameters):")
results = index.query(basic_query)
print(f"Found {len(results)} results\n")

# Example 2: Query with tuned runtime parameters for higher recall
tuned_query = VectorQuery(
    vector=query_vector.tolist(),
    vector_field_name="embedding",
    return_fields=["content", "category"],
    num_results=5,
    search_window_size=40,      # Larger window for better recall
    use_search_history='ON',    # Use search history
    search_buffer_capacity=50   # Larger buffer capacity
)

print("🎯 Tuned Query (higher recall parameters):")
results = index.query(tuned_query)
print(f"Found {len(results)} results")
print("\nNote: Higher search_window_size improves recall but may increase latency")
```

### Runtime Parameters with Range Queries

Runtime parameters are also useful for range queries, where you want to find all vectors within a certain distance threshold:


```python
from redisvl.query import VectorRangeQuery

# Range query with runtime parameters
range_query = VectorRangeQuery(
    vector=query_vector.tolist(),
    vector_field_name="embedding",
    return_fields=["content", "category"],
    distance_threshold=0.3,
    epsilon=0.05,               # Approximation factor
    search_window_size=30,      # Search window size
    use_search_history='AUTO'   # Automatic history management
)

results = index.query(range_query)
print(f"🎯 Range Query Results: Found {len(results)} vectors within distance threshold 0.3")
for i, result in enumerate(results[:3], 1):
    distance = result.get('vector_distance', 'N/A')
    print(f"{i}. {result['content'][:50]}... (distance: {distance})")
```

## Understanding Compression Types

SVS-VAMANA supports different compression algorithms that trade off between memory usage and search quality. Let's explore the available options.


```python
# Compare different compression priorities
print("Compression Recommendations for Different Priorities:")
print("=" * 60)

priorities = ["memory", "speed", "balanced"]
for priority in priorities:
    config = CompressionAdvisor.recommend(dims=dims, priority=priority)
    savings = CompressionAdvisor.estimate_memory_savings(
        config["compression"],
        dims,
        config.get("reduce")
    )
    
    print(f"\n{priority.upper()} Priority:")
    print(f"  Compression: {config['compression']}")
    print(f"  Datatype: {config['datatype']}")
    if "reduce" in config:
        print(f"  Dimensionality reduction: {dims} → {config['reduce']}")
    print(f"  Search window size: {config['search_window_size']}")
    print(f"  Memory savings: {savings}%")
```

    Compression Recommendations for Different Priorities:
    ============================================================
    
    MEMORY Priority:
      Compression: LeanVec4x8
      Datatype: float16
      Dimensionality reduction: 1024 → 512
      Search window size: 20
      Memory savings: 81.2%
    
    SPEED Priority:
      Compression: LeanVec4x8
      Datatype: float16
      Dimensionality reduction: 1024 → 256
      Search window size: 40
      Memory savings: 90.6%
    
    BALANCED Priority:
      Compression: LeanVec4x8
      Datatype: float16
      Dimensionality reduction: 1024 → 512
      Search window size: 30
      Memory savings: 81.2%


## Compression Types Explained

SVS-VAMANA offers several compression algorithms:

### LVQ (Learned Vector Quantization)
- **LVQ4**: 4 bits per dimension (87.5% memory savings)
- **LVQ4x4**: 8 bits per dimension (75% memory savings)
- **LVQ4x8**: 12 bits per dimension (62.5% memory savings)
- **LVQ8**: 8 bits per dimension (75% memory savings)

### LeanVec (Compression + Dimensionality Reduction)
- **LeanVec4x8**: 12 bits per dimension + dimensionality reduction
- **LeanVec8x8**: 16 bits per dimension + dimensionality reduction

The CompressionAdvisor automatically chooses the best compression type based on your vector dimensions and priority.


```python
# Demonstrate compression savings for different vector dimensions
test_dimensions = [384, 768, 1024, 1536, 3072]

print("Memory Savings by Vector Dimension:")
print("=" * 50)
print(f"{'Dims':<6} {'Compression':<12} {'Savings':<8} {'Strategy'}")
print("-" * 50)

for dims in test_dimensions:
    config = CompressionAdvisor.recommend(dims=dims, priority="balanced")
    savings = CompressionAdvisor.estimate_memory_savings(
        config["compression"],
        dims,
        config.get("reduce")
    )
    
    strategy = "LeanVec" if dims >= 1024 else "LVQ"
    print(f"{dims:<6} {config['compression']:<12} {savings:>6.1f}% {strategy}")
```

    Memory Savings by Vector Dimension:
    ==================================================
    Dims   Compression  Savings  Strategy
    --------------------------------------------------
    384    LVQ4x4         75.0% LVQ
    768    LVQ4x4         75.0% LVQ
    1024   LeanVec4x8     81.2% LeanVec
    1536   LeanVec4x8     81.2% LeanVec
    3072   LeanVec4x8     81.2% LeanVec


## Hybrid Queries with SVS-VAMANA

SVS-VAMANA can be combined with other Redis search capabilities for powerful hybrid queries that filter by metadata while performing vector similarity search.


```python
# Perform a hybrid search: vector similarity + category filter
hybrid_query = VectorQuery(
    vector=query_vector.tolist(),
    vector_field_name="embedding",
    return_fields=["content", "category"],
    num_results=3
)

# Add a filter to only search within "technology" category
hybrid_query.set_filter("@category:{technology}")

filtered_results = index.query(hybrid_query)

print("🔍 Hybrid Search Results (Technology category only):")
print("=" * 55)
for i, result in enumerate(filtered_results, 1):
    distance = result.get('vector_distance', 'N/A')
    print(f"{i}. [{result['category']}] {result['content']}")
    print(f"   Distance: {distance:.4f}" if isinstance(distance, (int, float)) else f"   Distance: {distance}")
    print()
```

    🔍 Hybrid Search Results (Technology category only):
    =======================================================


## Performance Monitoring

Let's examine the index statistics to understand the performance characteristics of our SVS-VAMANA index.


```python
# Get detailed index information
info = index.info()

print("📊 Index Statistics:")
print("=" * 30)
print(f"Documents: {info.get('num_docs', 0)}")

# Handle vector_index_sz_mb which might be a string
vector_size = info.get('vector_index_sz_mb', 0)
if isinstance(vector_size, str):
    try:
        vector_size = float(vector_size)
    except ValueError:
        vector_size = 0.0
print(f"Vector index size: {vector_size:.2f} MB")

# Handle total_indexing_time which might also be a string
indexing_time = info.get('total_indexing_time', 0)
if isinstance(indexing_time, str):
    try:
        indexing_time = float(indexing_time)
    except ValueError:
        indexing_time = 0.0
print(f"Total indexing time: {indexing_time:.2f} seconds")

# Calculate memory efficiency
if info.get('num_docs', 0) > 0 and vector_size > 0:
    mb_per_doc = vector_size / info.get('num_docs', 1)
    print(f"Memory per document: {mb_per_doc:.4f} MB")
    
    # Estimate for larger datasets
    for scale in [1000, 10000, 100000]:
        estimated_mb = mb_per_doc * scale
        print(f"Estimated size for {scale:,} docs: {estimated_mb:.1f} MB")
else:
    print("Memory efficiency calculation requires documents and vector index size > 0")
```

    📊 Index Statistics:
    ==============================
    Documents: 0
    Vector index size: 0.00 MB
    Total indexing time: 1.58 seconds
    Memory efficiency calculation requires documents and vector index size > 0


## Manual Configuration (Advanced)

For advanced users who want full control over SVS-VAMANA parameters, you can manually configure the algorithm instead of using CompressionAdvisor.


```python
# Example of manual SVS-VAMANA configuration
manual_schema = {
    "index": {
        "name": "svs_manual",
        "prefix": "manual",
    },
    "fields": [
        {"name": "content", "type": "text"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "dims": 768,
                "algorithm": "svs-vamana",
                "datatype": "float32",
                "distance_metric": "cosine",
                
                # Graph construction parameters
                "graph_max_degree": 64,           # Higher = better recall, more memory
                "construction_window_size": 300,  # Higher = better quality, slower build
                
                # Search parameters
                "search_window_size": 40,         # Higher = better recall, slower search
                
                # Compression settings
                "compression": "LVQ4x4",          # Choose compression type
                "training_threshold": 10000,      # Min vectors before compression training
            }
        }
    ]
}

print("Manual SVS-VAMANA Configuration:")
print("=" * 40)
vector_attrs = manual_schema["fields"][1]["attrs"]
for key, value in vector_attrs.items():
    if key != "dims":  # Skip dims as it's obvious
        print(f"  {key}: {value}")

# Calculate memory savings for this configuration
manual_savings = CompressionAdvisor.estimate_memory_savings(
    "LVQ4x4", 768, None
)
print(f"\nEstimated memory savings: {manual_savings}%")
```

    Manual SVS-VAMANA Configuration:
    ========================================
      algorithm: svs-vamana
      datatype: float32
      distance_metric: cosine
      graph_max_degree: 64
      construction_window_size: 300
      search_window_size: 40
      compression: LVQ4x4
      training_threshold: 10000
    
    Estimated memory savings: 75.0%


## Best Practices and Tips

### When to Use SVS-VAMANA
- **Large datasets** (>10K vectors) where memory efficiency matters
- **High-dimensional vectors** (>512 dimensions) that benefit from compression
- **Applications** that can tolerate slight recall trade-offs for speed and memory savings

### Parameter Tuning Guidelines

**Index-time parameters** (set during index creation):
- **Start with CompressionAdvisor** recommendations for compression and datatype
- **Use LeanVec** for high-dimensional vectors (≥1024 dims)
- **Use LVQ** for lower-dimensional vectors (<1024 dims)
- **graph_max_degree**: Higher values improve recall but increase memory usage
- **construction_window_size**: Higher values improve index quality but slow down build time

**Runtime parameters** (adjustable at query time without rebuilding index):
- **search_window_size**: Start with 20, increase to 40-100 for higher recall
- **epsilon**: Use 0.01-0.05 for range queries (higher = faster but less accurate)
- **use_search_history**: Use 'AUTO' (default) or 'ON' for better recall
- **search_buffer_capacity**: Usually set equal to search_window_size

### Performance Considerations
- **Index build time** increases with higher construction_window_size
- **Search latency** increases with higher search_window_size (tunable at query time!)
- **Memory usage** decreases with more aggressive compression
- **Recall quality** may decrease with more aggressive compression or lower search_window_size

## Cleanup

Clean up the indices created in this demo.


```python
# Clean up demo indices
try:
    index.delete()
    print("Cleaned up svs_demo index")
except:
    print("- svs_demo index was already deleted or doesn't exist")
```

    Cleaned up svs_demo index


---
linkTitle: Advanced query types
title: Advanced Query Types
aliases:
- /integrate/redisvl/user_guide/11_advanced_queries
weight: 11
---


In this notebook, we will explore advanced query types available in RedisVL:

1. **`TextQuery`**: Full text search with advanced scoring
2. **`AggregateHybridQuery`**: Combines text and vector search for hybrid retrieval
3. **`MultiVectorQuery`**: Search over multiple vector fields simultaneously

These query types are powerful tools for building sophisticated search applications that go beyond simple vector similarity search.

Prerequisites:
- Ensure `redisvl` is installed in your Python environment.
- Have a running instance of [Redis Stack](https://redis.io/docs/install/install-stack/) or [Redis Cloud](https://redis.io/cloud).


## Setup and Data Preparation

First, let's create a schema and prepare sample data that includes text fields, numeric fields, and vector fields.


```python
import numpy as np
from jupyterutils import result_print

# Sample data with text descriptions, categories, and vectors
data = [
    {
        'product_id': 'prod_1',
        'brief_description': 'comfortable running shoes for athletes',
        'full_description': 'Engineered with a dual-layer EVA foam midsole and FlexWeave breathable mesh upper, these running shoes deliver responsive cushioning for long-distance runs. The anatomical footbed adapts to your stride while the carbon rubber outsole provides superior traction on varied terrain.',
        'category': 'footwear',
        'price': 89.99,
        'rating': 4.5,
        'text_embedding': np.array([0.1, 0.2, 0.1], dtype=np.float32).tobytes(),
        'image_embedding': np.array([0.8, 0.1], dtype=np.float32).tobytes(),
    },
    {
        'product_id': 'prod_2',
        'brief_description': 'lightweight running jacket with water resistance',
        'full_description': 'Stay protected with this ultralight 2.5-layer DWR-coated shell featuring laser-cut ventilation zones and reflective piping for low-light visibility. Packs into its own chest pocket and weighs just 4.2 oz, making it ideal for unpredictable weather conditions.',
        'category': 'outerwear',
        'price': 129.99,
        'rating': 4.8,
        'text_embedding': np.array([0.2, 0.3, 0.2], dtype=np.float32).tobytes(),
        'image_embedding': np.array([0.7, 0.2], dtype=np.float32).tobytes(),
    },
    {
        'product_id': 'prod_3',
        'brief_description': 'professional tennis racket for competitive players',
        'full_description': 'Competition-grade racket featuring a 98 sq in head size, 16x19 string pattern, and aerospace-grade graphite frame that delivers explosive power with pinpoint control. Tournament-approved specs include 315g weight and 68 RA stiffness rating for advanced baseline play.',
        'category': 'equipment',
        'price': 199.99,
        'rating': 4.9,
        'text_embedding': np.array([0.9, 0.1, 0.05], dtype=np.float32).tobytes(),
        'image_embedding': np.array([0.1, 0.9], dtype=np.float32).tobytes(),
    },
    {
        'product_id': 'prod_4',
        'brief_description': 'yoga mat with extra cushioning for comfort',
        'full_description': 'Premium 8mm thick TPE yoga mat with dual-texture surface - smooth side for hot yoga flow and textured side for maximum grip during balancing poses. Closed-cell technology prevents moisture absorption while alignment markers guide proper positioning in asanas.',
        'category': 'accessories',
        'price': 39.99,
        'rating': 4.3,
        'text_embedding': np.array([0.15, 0.25, 0.15], dtype=np.float32).tobytes(),
        'image_embedding': np.array([0.5, 0.5], dtype=np.float32).tobytes(),
    },
    {
        'product_id': 'prod_5',
        'brief_description': 'basketball shoes with excellent ankle support',
        'full_description': 'High-top basketball sneakers with Zoom Air units in forefoot and heel, reinforced lateral sidewalls for explosive cuts, and herringbone traction pattern optimized for hardwood courts. The internal bootie construction and extended ankle collar provide lockdown support during aggressive drives.',
        'category': 'footwear',
        'price': 139.99,
        'rating': 4.7,
        'text_embedding': np.array([0.12, 0.18, 0.12], dtype=np.float32).tobytes(),
        'image_embedding': np.array([0.75, 0.15], dtype=np.float32).tobytes(),
    },
    {
        'product_id': 'prod_6',
        'brief_description': 'swimming goggles with anti-fog coating',
        'full_description': 'Low-profile competition goggles with curved polycarbonate lenses offering 180-degree peripheral vision and UV protection. Hydrophobic anti-fog coating lasts 10x longer than standard treatments, while the split silicone strap and interchangeable nose bridges ensure a watertight, custom fit.',
        'category': 'accessories',
        'price': 24.99,
        'rating': 4.4,
        'text_embedding': np.array([0.3, 0.1, 0.2], dtype=np.float32).tobytes(),
        'image_embedding': np.array([0.2, 0.8], dtype=np.float32).tobytes(),
    },
]
```

## Define the Schema

Our schema includes:
- **Tag fields**: `product_id`, `category`
- **Text fields**: `brief_description` and `full_description` for full-text search
- **Numeric fields**: `price`, `rating`
- **Vector fields**: `text_embedding` (3 dimensions) and `image_embedding` (2 dimensions) for semantic search


```python
schema = {
    "index": {
        "name": "advanced_queries",
        "prefix": "products",
        "storage_type": "hash",
    },
    "fields": [
        {"name": "product_id", "type": "tag"},
        {"name": "category", "type": "tag"},
        {"name": "brief_description", "type": "text"},
        {"name": "full_description", "type": "text"},
        {"name": "price", "type": "numeric"},
        {"name": "rating", "type": "numeric"},
        {
            "name": "text_embedding",
            "type": "vector",
            "attrs": {
                "dims": 3,
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"
            }
        },
        {
            "name": "image_embedding",
            "type": "vector",
            "attrs": {
                "dims": 2,
                "distance_metric": "cosine",
                "algorithm": "flat",
                "datatype": "float32"
            }
        }
    ],
}
```

## Create Index and Load Data


```python
from redisvl.index import SearchIndex

# Create the search index
index = SearchIndex.from_dict(schema, redis_url="redis://localhost:6379")

# Create the index and load data
index.create(overwrite=True)
keys = index.load(data)

print(f"Loaded {len(keys)} products into the index")
```

    16:27:50 redisvl.index.index INFO   Index already exists, overwriting.
    Loaded 6 products into the index


## 1. TextQuery: Full Text Search

The `TextQuery` class enables full text search with advanced scoring algorithms. It's ideal for keyword-based search with relevance ranking.

### Basic Text Search

Let's search for products related to "running shoes":


```python
from redisvl.query import TextQuery

# Create a text query
text_query = TextQuery(
    text="running shoes",
    text_field_name="brief_description",
    return_fields=["product_id", "brief_description", "category", "price"],
    num_results=5
)

results = index.query(text_query)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th><th>category</th><th>price</th></tr><tr><td>4.080705480646511</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>footwear</td><td>89.99</td></tr><tr><td>1.4504838715161907</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td><td>footwear</td><td>139.99</td></tr><tr><td>1.431980178975859</td><td>prod_2</td><td>lightweight running jacket with water resistance</td><td>outerwear</td><td>129.99</td></tr></table>


### Text Search with Different Scoring Algorithms

RedisVL supports multiple text scoring algorithms. Let's compare `BM25STD` and `TFIDF`:


```python
# BM25 standard scoring (default)
bm25_query = TextQuery(
    text="comfortable shoes",
    text_field_name="brief_description",
    text_scorer="BM25STD",
    return_fields=["product_id", "brief_description", "price"],
    num_results=3
)

print("Results with BM25 scoring:")
results = index.query(bm25_query)
result_print(results)
```

    Results with BM25 scoring:



<table><tr><th>score</th><th>product_id</th><th>brief_description</th><th>price</th></tr><tr><td>4.165936382048982</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>89.99</td></tr><tr><td>1.769051138581863</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>39.99</td></tr><tr><td>1.2306902673750557</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td><td>139.99</td></tr></table>



```python
# TFIDF scoring
tfidf_query = TextQuery(
    text="comfortable shoes",
    text_field_name="brief_description",
    text_scorer="TFIDF",
    return_fields=["product_id", "brief_description", "price"],
    num_results=3
)

print("Results with TFIDF scoring:")
results = index.query(tfidf_query)
result_print(results)
```

    Results with TFIDF scoring:



<table><tr><th>score</th><th>product_id</th><th>brief_description</th><th>price</th></tr><tr><td>1.3333333333333333</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>89.99</td></tr><tr><td>1.3333333333333333</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>89.99</td></tr><tr><td>1.0</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td><td>139.99</td></tr></table>


### Text Search with Filters

Combine text search with filters to narrow results:


```python
from redisvl.query.filter import Tag, Num

# Search for "shoes" only in the footwear category
filtered_text_query = TextQuery(
    text="shoes",
    text_field_name="brief_description",
    filter_expression=Tag("category") == "footwear",
    return_fields=["product_id", "brief_description", "category", "price"],
    num_results=5
)

results = index.query(filtered_text_query)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th><th>category</th><th>price</th></tr><tr><td>2.385806908729779</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>footwear</td><td>89.99</td></tr><tr><td>2.385806908729779</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>footwear</td><td>89.99</td></tr><tr><td>1.9340948871093797</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td><td>footwear</td><td>139.99</td></tr></table>



```python
# Search for products under $100
price_filtered_query = TextQuery(
    text="comfortable",
    text_field_name="brief_description",
    filter_expression=Num("price") < 100,
    return_fields=["product_id", "brief_description", "price"],
    num_results=5
)

results = index.query(price_filtered_query)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th><th>price</th></tr><tr><td>2.2775029612659465</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>89.99</td></tr><tr><td>1.1387514806329733</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>89.99</td></tr><tr><td>1.1190633543347508</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>39.99</td></tr><tr><td>1.1190633543347508</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>39.99</td></tr></table>


### Text Search with Multiple Fields and Weights

You can search across multiple text fields with different weights to prioritize certain fields.
Here we'll prioritize the `brief_description` field and make text similarity in that field twice as important as text similarity in `full_description`:


```python
weighted_query = TextQuery(
    text="shoes",
    text_field_name={"brief_description": 1.0, "full_description": 0.5},
    return_fields=["product_id", "brief_description"],
    num_results=3
)

results = index.query(weighted_query)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th></tr><tr><td>3.040323653363804</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>3.040323653363804</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>1.289396591406253</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td></tr></table>


### Text Search with Custom Stopwords

Stopwords are common words that are filtered out before processing the query. You can specify which language's default stopwords should be filtered out, like `english`, `french`, or `german`. You can also define your own list of stopwords:


```python
# Use English stopwords (default)
query_with_stopwords = TextQuery(
    text="the best shoes for running",
    text_field_name="brief_description",
    stopwords="english",  # Common words like "the", "for" will be removed
    return_fields=["product_id", "brief_description"],
    num_results=3
)

results = index.query(query_with_stopwords)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th></tr><tr><td>4.1444591833267275</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>4.1444591833267275</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>1.4875097606385526</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td></tr></table>



```python
# Use custom stopwords
custom_stopwords_query = TextQuery(
    text="professional equipment for athletes",
    text_field_name="brief_description",
    stopwords=["for", "with"],  # Only these words will be filtered
    return_fields=["product_id", "brief_description"],
    num_results=3
)

results = index.query(custom_stopwords_query)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th></tr><tr><td>2.5107799078325</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>2.5107799078325</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>2.482820220115406</td><td>prod_3</td><td>professional tennis racket for competitive players</td></tr></table>



```python
# No stopwords
no_stopwords_query = TextQuery(
    text="the best shoes for running",
    text_field_name="brief_description",
    stopwords=None,  # All words will be included
    return_fields=["product_id", "brief_description"],
    num_results=3
)

results = index.query(no_stopwords_query)
result_print(results)
```


<table><tr><th>score</th><th>product_id</th><th>brief_description</th></tr><tr><td>3.69730364515632</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>3.69730364515632</td><td>prod_1</td><td>comfortable running shoes for athletes</td></tr><tr><td>1.5329921800414583</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td></tr></table>


## 2. AggregateHybridQuery: Combining Text and Vector Search

The `AggregateHybridQuery` combines text search and vector similarity to provide the best of both worlds:
- **Text search**: Finds exact keyword matches
- **Vector search**: Captures semantic similarity

Results are scored using a weighted combination:

```
hybrid_score = (alpha) * vector_score + (1 - alpha) * text_score
```

Where `alpha` controls the balance between vector and text search (default: 0.7).

### Index-Level Stopwords Configuration

The previous example showed **query-time stopwords** using `TextQuery.stopwords`, which filters words from the query before searching. RedisVL also supports **index-level stopwords** configuration, which determines which words are indexed in the first place.

**Key Difference:**
- **Query-time stopwords** (`TextQuery.stopwords`): Filters words from your search query (client-side)
- **Index-level stopwords** (`IndexInfo.stopwords`): Controls which words get indexed in Redis (server-side)

**Three Configuration Modes:**

1. **`None` (default)**: Use Redis's default stopwords list
2. **`[]` (empty list)**: Disable stopwords completely (`STOPWORDS 0` in FT.CREATE)
3. **`["the", "a", "an"]`**: Use a custom stopwords list

**When to use `STOPWORDS 0`:**
- When you need to search for common words like "of", "at", "the"
- For entity names containing stopwords (e.g., "Bank of Glasberliner", "University of Glasberliner")
- When working with structured data where every word matters


```python
# Create a schema with index-level stopwords disabled
from redisvl.index import SearchIndex

stopwords_schema = {
    "index": {
        "name": "company_index",
        "prefix": "company:",
        "storage_type": "hash",
        "stopwords": []  # STOPWORDS 0 - disable stopwords completely
    },
    "fields": [
        {"name": "company_name", "type": "text"},
        {"name": "description", "type": "text"}
    ]
}

# Create index using from_dict (handles schema creation internally)
company_index = SearchIndex.from_dict(stopwords_schema, redis_url="redis://localhost:6379")
company_index.create(overwrite=True, drop=True)

print(f"Index created with STOPWORDS 0: {company_index}")
```

    Index created with STOPWORDS 0: <redisvl.index.index.SearchIndex object at 0x109ce3c50>



```python
# Load sample data with company names containing common stopwords
companies = [
    {"company_name": "Bank of Glasberliner", "description": "Major financial institution"},
    {"company_name": "University of Glasberliner", "description": "Public university system"},
    {"company_name": "Department of Glasberliner Affairs", "description": "A government agency"},
    {"company_name": "Glasberliner FC", "description": "Football Club"},
    {"company_name": "The Home Market", "description": "Home improvement retailer"},
]

for i, company in enumerate(companies):
    company_index.load([company], keys=[f"company:{i}"])

print(f"✓ Loaded {len(companies)} companies")
```

    ✓ Loaded 5 companies



```python
# Search for "Bank of Glasberliner" - with STOPWORDS 0, "of" is indexed and searchable
from redisvl.query import FilterQuery

query = FilterQuery(
    filter_expression='@company_name:(Bank of Glasberliner)',
    return_fields=["company_name", "description"],
)

results = company_index.search(query.query, query_params=query.params)

print(f"Found {len(results.docs)} results for 'Bank of Glasberliner':")
for doc in results.docs:
    print(f"  - {doc.company_name}: {doc.description}")
```

    Found 1 results for 'Bank of Glasberliner':
      - Bank of Glasberliner: Major financial institution


**Comparison: With vs Without Stopwords**

If we had used the default stopwords (not specifying `stopwords` in the schema), the word "of" would be filtered out during indexing. This means:

- ❌ Searching for `"Bank of Glasberliner"` might not find exact matches
- ❌ The phrase would be indexed as `"Bank Berlin"` (without "of")
- ✅ With `STOPWORDS 0`, all words including "of" are indexed

**Custom Stopwords Example:**

You can also provide a custom list of stopwords:


```python
# Example: Create index with custom stopwords
custom_stopwords_schema = {
    "index": {
        "name": "custom_stopwords_index",
        "prefix": "custom:",
        "stopwords": ["inc", "llc", "corp"]  # Filter out legal entity suffixes
    },
    "fields": [
        {"name": "name", "type": "text"}
    ]
}

# This would create an index where "inc", "llc", "corp" are not indexed
print("Custom stopwords:", custom_stopwords_schema["index"]["stopwords"])
```

    Custom stopwords: ['inc', 'llc', 'corp']


**YAML Format:**

You can also define stopwords in YAML schema files:

```yaml
version: '0.1.0'

index:
  name: company_index
  prefix: company:
  storage_type: hash
  stopwords: []  # Disable stopwords (STOPWORDS 0)

fields:
  - name: company_name
    type: text
  - name: description
    type: text
```

Or with custom stopwords:

```yaml
index:
  stopwords:
    - the
    - a
    - an
```


```python
# Cleanup
company_index.delete(drop=True)
print("✓ Cleaned up company_index")
```

    ✓ Cleaned up company_index


### Basic Aggregate Hybrid Query

Let's search for "running" with both text and semantic search:


```python
from redisvl.query import AggregateHybridQuery

# Create a hybrid query
hybrid_query = AggregateHybridQuery(
    text="running shoes",
    text_field_name="brief_description",
    vector=[0.1, 0.2, 0.1],  # Query vector
    vector_field_name="text_embedding",
    return_fields=["product_id", "brief_description", "category", "price"],
    num_results=5
)

results = index.query(hybrid_query)
result_print(results)
```


<table><tr><th>vector_distance</th><th>product_id</th><th>brief_description</th><th>category</th><th>price</th><th>vector_similarity</th><th>text_score</th><th>hybrid_score</th></tr><tr><td>5.96046447754e-08</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>footwear</td><td>89.99</td><td>0.999999970198</td><td>4.82977442609</td><td>2.14893230697</td></tr><tr><td>5.96046447754e-08</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>footwear</td><td>89.99</td><td>0.999999970198</td><td>4.82977442609</td><td>2.14893230697</td></tr><tr><td>5.96046447754e-08</td><td>prod_1</td><td>comfortable running shoes for athletes</td><td>footwear</td><td>89.99</td><td>0.999999970198</td><td>4.82977442609</td><td>2.14893230697</td></tr><tr><td>0.0038834810257</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>accessories</td><td>39.99</td><td>0.998058259487</td><td>0</td><td>0.698640781641</td></tr><tr><td>0.0038834810257</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>accessories</td><td>39.99</td><td>0.998058259487</td><td>0</td><td>0.698640781641</td></tr></table>


### Adjusting the Alpha Parameter

The `alpha` parameter controls the weight between vector and text search:
- `alpha=1.0`: Pure vector search
- `alpha=0.0`: Pure text search
- `alpha=0.7` (default): 70% vector, 30% text


```python
# More emphasis on vector search (alpha=0.9)
vector_heavy_query = AggregateHybridQuery(
    text="comfortable",
    text_field_name="brief_description",
    vector=[0.15, 0.25, 0.15],
    vector_field_name="text_embedding",
    alpha=0.9,  # 90% vector, 10% text
    return_fields=["product_id", "brief_description"],
    num_results=3
)

print("Results with alpha=0.9 (vector-heavy):")
results = index.query(vector_heavy_query)
result_print(results)
```

    Results with alpha=0.9 (vector-heavy):



<table><tr><th>vector_distance</th><th>product_id</th><th>brief_description</th><th>vector_similarity</th><th>text_score</th><th>hybrid_score</th></tr><tr><td>-1.19209289551e-07</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>1.0000000596</td><td>1.53838070541</td><td>1.05383812419</td></tr><tr><td>-1.19209289551e-07</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>1.0000000596</td><td>1.53838070541</td><td>1.05383812419</td></tr><tr><td>-1.19209289551e-07</td><td>prod_4</td><td>yoga mat with extra cushioning for comfort</td><td>1.0000000596</td><td>1.53838070541</td><td>1.05383812419</td></tr></table>


### Aggregate Hybrid Query with Filters

You can also combine hybrid search with filters:


```python
# Hybrid search with a price filter
filtered_hybrid_query = AggregateHybridQuery(
    text="professional equipment",
    text_field_name="brief_description",
    vector=[0.9, 0.1, 0.05],
    vector_field_name="text_embedding",
    filter_expression=Num("price") > 100,
    return_fields=["product_id", "brief_description", "category", "price"],
    num_results=5
)

results = index.query(filtered_hybrid_query)
result_print(results)
```


<table><tr><th>vector_distance</th><th>product_id</th><th>brief_description</th><th>category</th><th>price</th><th>vector_similarity</th><th>text_score</th><th>hybrid_score</th></tr><tr><td>-1.19209289551e-07</td><td>prod_3</td><td>professional tennis racket for competitive players</td><td>equipment</td><td>199.99</td><td>1.0000000596</td><td>1.54723705506</td><td>1.16417115824</td></tr><tr><td>-1.19209289551e-07</td><td>prod_3</td><td>professional tennis racket for competitive players</td><td>equipment</td><td>199.99</td><td>1.0000000596</td><td>1.54723705506</td><td>1.16417115824</td></tr><tr><td>-1.19209289551e-07</td><td>prod_3</td><td>professional tennis racket for competitive players</td><td>equipment</td><td>199.99</td><td>1.0000000596</td><td>1.54723705506</td><td>1.16417115824</td></tr><tr><td>0.411657452583</td><td>prod_2</td><td>lightweight running jacket with water resistance</td><td>outerwear</td><td>129.99</td><td>0.794171273708</td><td>0</td><td>0.555919891596</td></tr><tr><td>0.411657452583</td><td>prod_2</td><td>lightweight running jacket with water resistance</td><td>outerwear</td><td>129.99</td><td>0.794171273708</td><td>0</td><td>0.555919891596</td></tr></table>


### Using Different Text Scorers

AggregateHybridQuery supports the same text scoring algorithms as TextQuery:


```python
# Aggregate Hybrid query with TFIDF scorer
hybrid_tfidf = AggregateHybridQuery(
    text="shoes support",
    text_field_name="brief_description",
    vector=[0.12, 0.18, 0.12],
    vector_field_name="text_embedding",
    text_scorer="TFIDF",
    return_fields=["product_id", "brief_description"],
    num_results=3
)

results = index.query(hybrid_tfidf)
result_print(results)
```


<table><tr><th>vector_distance</th><th>product_id</th><th>brief_description</th><th>vector_similarity</th><th>text_score</th><th>hybrid_score</th></tr><tr><td>0</td><td>prod_5</td><td>basketball shoes with excellent ankle support</td><td>1</td><td>3</td><td>1.6</td></tr><tr><td>0</td><td>prod_2</td><td>lightweight running jacket with water resistance</td><td>1</td><td>0</td><td>0.7</td></tr><tr><td>0</td><td>prod_2</td><td>lightweight running jacket with water resistance</td><td>1</td><td>0</td><td>0.7</td></tr></table>


### Runtime Parameters for Vector Search Tuning

**Important:** `AggregateHybridQuery` uses FT.AGGREGATE commands which do NOT support runtime parameters.

Runtime parameters (such as `ef_runtime` for HNSW indexes or `search_window_size` for SVS-VAMANA indexes) are only supported with FT.SEARCH commands.

**For runtime parameter support, use `VectorQuery` or `VectorRangeQuery` instead:**

- `VectorQuery`: Supports all runtime parameters (HNSW and SVS-VAMANA)
- `VectorRangeQuery`: Supports all runtime parameters (HNSW and SVS-VAMANA)
- `AggregateHybridQuery`: Does NOT support runtime parameters (uses FT.AGGREGATE)

See the **Runtime Parameters** section earlier in this notebook for examples of using runtime parameters with `VectorQuery`.

## 3. MultiVectorQuery: Multi-Vector Search

The `MultiVectorQuery` allows you to search over multiple vector fields simultaneously. This is useful when you have different types of embeddings (e.g., text and image embeddings) and want to find results that match across multiple modalities.

The final score is calculated as a weighted combination:

```
combined_score = w_1 * score_1 + w_2 * score_2 + w_3 * score_3 + ...
```

### Basic Multi-Vector Query

First, we need to import the `Vector` class to define our query vectors:


```python
from redisvl.query import MultiVectorQuery, Vector

# Define multiple vectors for the query
text_vector = Vector(
    vector=[0.1, 0.2, 0.1],
    field_name="text_embedding",
    dtype="float32",
    weight=0.7  # 70% weight for text embedding
)

image_vector = Vector(
    vector=[0.8, 0.1],
    field_name="image_embedding",
    dtype="float32",
    weight=0.3  # 30% weight for image embedding
)

# Create a multi-vector query
multi_vector_query = MultiVectorQuery(
    vectors=[text_vector, image_vector],
    return_fields=["product_id", "brief_description", "category"],
    num_results=5
)

results = index.query(multi_vector_query)
result_print(results)
```

### Adjusting Vector Weights

You can adjust the weights to prioritize different vector fields:


```python
# More emphasis on image similarity
text_vec = Vector(
    vector=[0.9, 0.1, 0.05],
    field_name="text_embedding",
    dtype="float32",
    weight=0.2  # 20% weight
)

image_vec = Vector(
    vector=[0.1, 0.9],
    field_name="image_embedding",
    dtype="float32",
    weight=0.8  # 80% weight
)

image_heavy_query = MultiVectorQuery(
    vectors=[text_vec, image_vec],
    return_fields=["product_id", "brief_description", "category"],
    num_results=3
)

print("Results with emphasis on image similarity:")
results = index.query(image_heavy_query)
result_print(results)
```

### Multi-Vector Query with Filters

Combine multi-vector search with filters to narrow results:


```python
# Multi-vector search with category filter
text_vec = Vector(
    vector=[0.1, 0.2, 0.1],
    field_name="text_embedding",
    dtype="float32",
    weight=0.6
)

image_vec = Vector(
    vector=[0.8, 0.1],
    field_name="image_embedding",
    dtype="float32",
    weight=0.4
)

filtered_multi_query = MultiVectorQuery(
    vectors=[text_vec, image_vec],
    filter_expression=Tag("category") == "footwear",
    return_fields=["product_id", "brief_description", "category", "price"],
    num_results=5
)

results = index.query(filtered_multi_query)
result_print(results)
```

## Comparing Query Types

Let's compare the three query types side by side:


```python
# TextQuery - keyword-based search
text_q = TextQuery(
    text="shoes",
    text_field_name="brief_description",
    return_fields=["product_id", "brief_description"],
    num_results=3
)

print("TextQuery Results (keyword-based):")
result_print(index.query(text_q))
print()
```


```python
# AggregateHybridQuery - combines text and vector search
hybrid_q = AggregateHybridQuery(
    text="shoes",
    text_field_name="brief_description",
    vector=[0.1, 0.2, 0.1],
    vector_field_name="text_embedding",
    return_fields=["product_id", "brief_description"],
    num_results=3
)

print("AggregateHybridQuery Results (text + vector):")
result_print(index.query(hybrid_q))
print()
```


```python
# MultiVectorQuery - searches multiple vector fields
mv_text = Vector(
    vector=[0.1, 0.2, 0.1],
    field_name="text_embedding",
    dtype="float32",
    weight=0.5
)

mv_image = Vector(
    vector=[0.8, 0.1],
    field_name="image_embedding",
    dtype="float32",
    weight=0.5
)

multi_q = MultiVectorQuery(
    vectors=[mv_text, mv_image],
    return_fields=["product_id", "brief_description"],
    num_results=3
)

print("MultiVectorQuery Results (multiple vectors):")
result_print(index.query(multi_q))
```

## Best Practices

### When to Use Each Query Type:

1. **`TextQuery`**:
   - When you need precise keyword matching
   - For traditional search engine functionality
   - When text relevance scoring is important
   - Example: Product search, document retrieval

2. **`AggregateHybridQuery`**:
   - When you want to combine keyword and semantic search
   - For improved search quality over pure text or vector search
   - When you have both text and vector representations of your data
   - Example: E-commerce search, content recommendation

3. **`MultiVectorQuery`**:
   - When you have multiple types of embeddings (text, image, audio, etc.)
   - For multi-modal search applications
   - When you want to balance multiple semantic signals
   - Example: Image-text search, cross-modal retrieval


```python
# Cleanup
index.delete()
```

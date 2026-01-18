---
linkTitle: Schema
title: Schema
url: '/develop/ai/redisvl/0.11.1/api/schema/'
---


Schema in RedisVL provides a structured format to define index settings and
field configurations using the following three components:

| Component   | Description                                                                        |
|-------------|------------------------------------------------------------------------------------|
| version     | The version of the schema spec. Current supported version is 0.1.0.                |
| index       | Index specific settings like name, key prefix, key separator, and storage type.    |
| fields      | Subset of fields within your data to include in the index and any custom settings. |

## IndexSchema

<a id="indexschema-api"></a>

### `class IndexSchema(*, index, fields=<factory>, version='0.1.0')`

A schema definition for a search index in Redis, used in RedisVL for
configuring index settings and organizing vector and metadata fields.

The class offers methods to create an index schema from a YAML file or a
Python dictionary, supporting flexible schema definitions and easy
integration into various workflows.

An example schema.yaml file might look like this:

```yaml
version: '0.1.0'

index:
    name: user-index
    prefix: user
    key_separator: ":"
    storage_type: json

fields:
    - name: user
      type: tag
    - name: credit_score
      type: tag
    - name: embedding
      type: vector
      attrs:
        algorithm: flat
        dims: 3
        distance_metric: cosine
        datatype: float32
```

Loading the schema for RedisVL from yaml is as simple as:

```python
from redisvl.schema import IndexSchema

schema = IndexSchema.from_yaml("schema.yaml")
```

Loading the schema for RedisVL from dict is as simple as:

```python
from redisvl.schema import IndexSchema

schema = IndexSchema.from_dict({
    "index": {
        "name": "user-index",
        "prefix": "user",
        "key_separator": ":",
        "storage_type": "json",
    },
    "fields": [
        {"name": "user", "type": "tag"},
        {"name": "credit_score", "type": "tag"},
        {
            "name": "embedding",
            "type": "vector",
            "attrs": {
                "algorithm": "flat",
                "dims": 3,
                "distance_metric": "cosine",
                "datatype": "float32"
            }
        }
    ]
})
```

#### `NOTE`
The fields attribute in the schema must contain unique field names to ensure
correct and unambiguous field references.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **index** (*IndexInfo*)
  * **fields** (*Dict* *[* *str* *,* *BaseField* *]*)
  * **version** (*Literal* *[* *'0.1.0'* *]*)

#### `add_field(field_inputs)`

Adds a single field to the index schema based on the specified field
type and attributes.

This method allows for the addition of individual fields to the schema,
providing flexibility in defining the structure of the index.

* **Parameters:**
  **field_inputs** (*Dict* *[* *str* *,* *Any* *]*) – A field to add.
* **Raises:**
  **ValueError** – If the field name or type are not provided or if the name
      already exists within the schema.

```python
# Add a tag field
schema.add_field({"name": "user", "type": "tag})

# Add a vector field
schema.add_field({
    "name": "user-embedding",
    "type": "vector",
    "attrs": {
        "dims": 1024,
        "algorithm": "flat",
        "datatype": "float32"
    }
})
```

#### `add_fields(fields)`

Extends the schema with additional fields.

This method allows dynamically adding new fields to the index schema. It
processes a list of field definitions.

* **Parameters:**
  **fields** (*List* *[* *Dict* *[* *str* *,* *Any* *]* *]*) – A list of fields to add.
* **Raises:**
  **ValueError** – If a field with the same name already exists in the
      schema.

```python
schema.add_fields([
    {"name": "user", "type": "tag"},
    {"name": "bio", "type": "text"},
    {
        "name": "user-embedding",
        "type": "vector",
        "attrs": {
            "dims": 1024,
            "algorithm": "flat",
            "datatype": "float32"
        }
    }
])
```

#### `classmethod from_dict(data)`

Create an IndexSchema from a dictionary.

* **Parameters:**
  **data** (*Dict* *[* *str* *,* *Any* *]*) – The index schema data.
* **Returns:**
  The index schema.
* **Return type:**
  [IndexSchema](#indexschema)

```python
from redisvl.schema import IndexSchema

schema = IndexSchema.from_dict({
    "index": {
        "name": "docs-index",
        "prefix": "docs",
        "storage_type": "hash",
    },
    "fields": [
        {
            "name": "doc-id",
            "type": "tag"
        },
        {
            "name": "doc-embedding",
            "type": "vector",
            "attrs": {
                "algorithm": "flat",
                "dims": 1536
            }
        }
    ]
})
```

#### `classmethod from_yaml(file_path)`

Create an IndexSchema from a YAML file.

* **Parameters:**
  **file_path** (*str*) – The path to the YAML file.
* **Returns:**
  The index schema.
* **Return type:**
  [IndexSchema](#indexschema)

```python
from redisvl.schema import IndexSchema
schema = IndexSchema.from_yaml("schema.yaml")
```

#### `remove_field(field_name)`

Removes a field from the schema based on the specified name.

This method is useful for dynamically altering the schema by removing
existing fields.

* **Parameters:**
  **field_name** (*str*) – The name of the field to be removed.

#### `to_dict()`

Serialize the index schema model to a dictionary, handling Enums
and other special cases properly.

* **Returns:**
  The index schema as a dictionary.
* **Return type:**
  Dict[str, Any]

#### `to_yaml(file_path, overwrite=True)`

Write the index schema to a YAML file.

* **Parameters:**
  * **file_path** (*str*) – The path to the YAML file.
  * **overwrite** (*bool*) – Whether to overwrite the file if it already exists.
* **Raises:**
  **FileExistsError** – If the file already exists and overwrite is False.
* **Return type:**
  None

#### `property field_names: List[str]`

A list of field names associated with the index schema.

* **Returns:**
  A list of field names from the schema.
* **Return type:**
  List[str]

#### `fields: Dict[str, BaseField]`

Fields associated with the search index and their properties.

Note: When creating from dict/YAML, provide fields as a list of field definitions.
The validator will convert them to a Dict[str, BaseField] internally.

#### `index: IndexInfo`

Details of the basic index configurations.

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `version: Literal['0.1.0']`

Version of the underlying index schema.

## Defining Fields

Fields in the schema can be defined in YAML format or as a Python dictionary, specifying a name, type, an optional path, and attributes for customization.

**YAML Example**:

```yaml
- name: title
  type: text
  path: $.document.title
  attrs:
    weight: 1.0
    no_stem: false
    withsuffixtrie: true
```

**Python Dictionary Example**:

```python
{
    "name": "location",
    "type": "geo",
    "attrs": {
        "sortable": true
    }
}
```

## Basic Field Types

RedisVL supports several basic field types for indexing different kinds of data. Each field type has specific attributes that customize its indexing and search behavior.

### `Text Fields`

Text fields support full-text search with stemming, phonetic matching, and other text analysis features.

### `class TextField(*, name, type=FieldTypes.TEXT, path=None, attrs=<factory>)`

Bases: `BaseField`

Text field supporting a full text search index

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *FieldTypes.TEXT* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([TextFieldAttributes](#textfieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[TextFieldAttributes](#textfieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal[FieldTypes.TEXT]`

Field type

### `class TextFieldAttributes(*, sortable=False, index_missing=False, no_index=False, weight=1, no_stem=False, withsuffixtrie=False, phonetic_matcher=None, index_empty=False, unf=False)`

Full text field attributes

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **sortable** (*bool*)
  * **index_missing** (*bool*)
  * **no_index** (*bool*)
  * **weight** (*float*)
  * **no_stem** (*bool*)
  * **withsuffixtrie** (*bool*)
  * **phonetic_matcher** (*str* *|* *None*)
  * **index_empty** (*bool*)
  * **unf** (*bool*)

#### `index_empty: bool`

Allow indexing and searching for empty strings

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `no_stem: bool`

Disable stemming on the text field during indexing

#### `phonetic_matcher: str | None`

Used to perform phonetic matching during search

#### `unf: bool`

Un-normalized form - disable normalization on sortable fields (only applies when sortable=True)

#### `weight: float`

Declares the importance of this field when calculating results

#### `withsuffixtrie: bool`

Keep a suffix trie with all terms which match the suffix to optimize certain queries

### `Tag Fields`

Tag fields are optimized for exact-match filtering and faceted search on categorical data.

### `class TagField(*, name, type=FieldTypes.TAG, path=None, attrs=<factory>)`

Bases: `BaseField`

Tag field for simple boolean-style filtering

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *FieldTypes.TAG* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([TagFieldAttributes](#tagfieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[TagFieldAttributes](#tagfieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal[FieldTypes.TAG]`

Field type

### `class TagFieldAttributes(*, sortable=False, index_missing=False, no_index=False, separator=',', case_sensitive=False, withsuffixtrie=False, index_empty=False)`

Tag field attributes

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **sortable** (*bool*)
  * **index_missing** (*bool*)
  * **no_index** (*bool*)
  * **separator** (*str*)
  * **case_sensitive** (*bool*)
  * **withsuffixtrie** (*bool*)
  * **index_empty** (*bool*)

#### `case_sensitive: bool`

Treat text as case sensitive or not. By default, tag characters are converted to lowercase

#### `index_empty: bool`

Allow indexing and searching for empty strings

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `separator: str`

Indicates how the text in the original attribute is split into individual tags

#### `withsuffixtrie: bool`

Keep a suffix trie with all terms which match the suffix to optimize certain queries

### `Numeric Fields`

Numeric fields support range queries and sorting on numeric data.

### `class NumericField(*, name, type=FieldTypes.NUMERIC, path=None, attrs=<factory>)`

Bases: `BaseField`

Numeric field for numeric range filtering

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *FieldTypes.NUMERIC* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([NumericFieldAttributes](#numericfieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[NumericFieldAttributes](#numericfieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal[FieldTypes.NUMERIC]`

Field type

### `class NumericFieldAttributes(*, sortable=False, index_missing=False, no_index=False, unf=False)`

Numeric field attributes

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **sortable** (*bool*)
  * **index_missing** (*bool*)
  * **no_index** (*bool*)
  * **unf** (*bool*)

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `unf: bool`

Un-normalized form - disable normalization on sortable fields (only applies when sortable=True)

### `Geo Fields`

Geo fields enable location-based search with geographic coordinates.

### `class GeoField(*, name, type=FieldTypes.GEO, path=None, attrs=<factory>)`

Bases: `BaseField`

Geo field with a geo-spatial index for location based search

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *FieldTypes.GEO* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([GeoFieldAttributes](#geofieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[GeoFieldAttributes](#geofieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal[FieldTypes.GEO]`

Field type

### `class GeoFieldAttributes(*, sortable=False, index_missing=False, no_index=False)`

Numeric field attributes

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **sortable** (*bool*)
  * **index_missing** (*bool*)
  * **no_index** (*bool*)

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## Vector Field Types

Vector fields enable semantic similarity search using various algorithms. All vector fields share common attributes but have algorithm-specific configurations.

### `Common Vector Attributes`

All vector field types share these base attributes:

### `class BaseVectorFieldAttributes(*, dims, algorithm, datatype=VectorDataType.FLOAT32, distance_metric=VectorDistanceMetric.COSINE, initial_cap=None, index_missing=False)`

Base vector field attributes shared by FLAT, HNSW, and SVS-VAMANA fields

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **dims** (*int*)
  * **algorithm** (*VectorIndexAlgorithm*)
  * **datatype** (*VectorDataType*)
  * **distance_metric** (*VectorDistanceMetric*)
  * **initial_cap** (*int* *|* *None*)
  * **index_missing** (*bool*)

#### `classmethod uppercase_strings(v)`

Validate that provided values are cast to uppercase

#### `algorithm: VectorIndexAlgorithm`

FLAT, HNSW, or SVS-VAMANA

* **Type:**
  The indexing algorithm for the field

#### `datatype: VectorDataType`

The float datatype for the vector embeddings

#### `dims: int`

Dimensionality of the vector embeddings field

#### `distance_metric: VectorDistanceMetric`

The distance metric used to measure query relevance

#### `property field_data: Dict[str, Any]`

Select attributes required by the Redis API

#### `index_missing: bool`

Allow indexing and searching for missing values (documents without the field)

#### `initial_cap: int | None`

Initial vector capacity in the index affecting memory allocation size of the index

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

**Key Attributes:**

- dims: Dimensionality of the vector (e.g., 768, 1536).
- algorithm: Indexing algorithm for vector search:
  - flat: Brute-force exact search. 100% recall, slower for large datasets. Best for <10K vectors.
  - hnsw: Graph-based approximate search. Fast with high recall (95-99%). Best for general use.
  - svs-vamana: SVS-VAMANA (Scalable Vector Search with VAMANA graph algorithm) provides fast approximate nearest neighbor search with optional compression support. This algorithm is optimized for Intel hardware and offers reduced memory usage through vector compression.

  #### NOTE
  For detailed algorithm comparison and selection guidance, see [Vector Algorithm Comparison](#vector-algorithm-comparison).
- datatype: Float precision (bfloat16, float16, float32, float64). Note: SVS-VAMANA only supports float16 and float32.
- distance_metric: Similarity metric (COSINE, L2, IP).
- initial_cap: Initial capacity hint for memory allocation (optional).
- index_missing: When True, allows searching for documents missing this field (optional).

### `HNSW Vector Fields`

HNSW (Hierarchical Navigable Small World) - Graph-based approximate search with excellent recall. **Best for general-purpose vector search (10K-1M+ vectors).**

### `When to use HNSW & Performance Details`

**Use HNSW when:**

- Medium to large datasets (100K-1M+ vectors) requiring high recall rates
- Search accuracy is more important than memory usage
- Need general-purpose vector search with balanced performance
- Cross-platform deployments where hardware-specific optimizations aren’t available

**Performance characteristics:**

- **Search speed**: Very fast approximate search with tunable accuracy
- **Memory usage**: Higher than compressed SVS-VAMANA but reasonable for most applications
- **Recall quality**: Excellent recall rates (95-99%), often better than other approximate methods
- **Build time**: Moderate construction time, faster than SVS-VAMANA for smaller datasets

### `class HNSWVectorField(*, name, type='vector', path=None, attrs)`

Bases: `BaseField`

Vector field with HNSW (Hierarchical Navigable Small World) indexing for approximate nearest neighbor search.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *'vector'* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([HNSWVectorFieldAttributes](#hnswvectorfieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[HNSWVectorFieldAttributes](#hnswvectorfieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal['vector']`

Field type

### `class HNSWVectorFieldAttributes(*, dims, algorithm=VectorIndexAlgorithm.HNSW, datatype=VectorDataType.FLOAT32, distance_metric=VectorDistanceMetric.COSINE, initial_cap=None, index_missing=False, m=16, ef_construction=200, ef_runtime=10, epsilon=0.01)`

HNSW vector field attributes for approximate nearest neighbor search.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **dims** (*int*)
  * **algorithm** (*Literal* *[* *VectorIndexAlgorithm.HNSW* *]*)
  * **datatype** (*VectorDataType*)
  * **distance_metric** (*VectorDistanceMetric*)
  * **initial_cap** (*int* *|* *None*)
  * **index_missing** (*bool*)
  * **m** (*int*)
  * **ef_construction** (*int*)
  * **ef_runtime** (*int*)
  * **epsilon** (*float*)

#### `algorithm: Literal[VectorIndexAlgorithm.HNSW]`

The indexing algorithm (fixed as ‘hnsw’)

#### `ef_construction: int`

100-800)

* **Type:**
  Max edge candidates during build time (default
* **Type:**
  200, range

#### `ef_runtime: int`

1. - primary tuning parameter

* **Type:**
  Max top candidates during search (default

#### `epsilon: float`

0.01)

* **Type:**
  Range search boundary factor (default

#### `m: int`

8-64)

* **Type:**
  Max outgoing edges per node in each layer (default
* **Type:**
  16, range

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

**HNSW Examples:**

**Balanced configuration (recommended starting point):**

```yaml
- name: embedding
  type: vector
  attrs:
    algorithm: hnsw
    dims: 768
    distance_metric: cosine
    datatype: float32
    # Balanced settings for good recall and performance
    m: 16
    ef_construction: 200
    ef_runtime: 10
```

**High-recall configuration:**

```yaml
- name: embedding
  type: vector
  attrs:
    algorithm: hnsw
    dims: 768
    distance_metric: cosine
    datatype: float32
    # Tuned for maximum accuracy
    m: 32
    ef_construction: 400
    ef_runtime: 50
```

### `SVS-VAMANA Vector Fields`

SVS-VAMANA (Scalable Vector Search with VAMANA graph algorithm) provides fast approximate nearest neighbor search with optional compression support. This algorithm is optimized for Intel hardware and offers reduced memory usage through vector compression. **Best for large datasets (>100K vectors) on Intel hardware with memory constraints.**

### `When to use SVS-VAMANA & Detailed Guide`

**Requirements:**
: - Redis >= 8.2.0 with RediSearch >= 2.8.10
  - datatype must be ‘float16’ or ‘float32’ (float64/bfloat16 not supported)

**Use SVS-VAMANA when:**
: - Large datasets where memory is expensive
  - Cloud deployments with memory-based pricing
  - When 90-95% recall is acceptable
  - High-dimensional vectors (>1024 dims) with LeanVec compression

**Performance vs other algorithms:**
: - **vs FLAT**: Much faster search, significantly lower memory usage with compression, but approximate results
  - **vs HNSW**: Better memory efficiency with compression, similar or better recall, Intel-optimized

**Compression selection guide:**

- **No compression**: Best performance, standard memory usage
- **LVQ4/LVQ8**: Good balance of compression (2x-4x) and performance
- **LeanVec4x8/LeanVec8x8**: Maximum compression (up to 8x) with dimensionality reduction

**Memory Savings Examples (1M vectors, 768 dims):**
: - No compression (float32): 3.1 GB
  - LVQ4x4 compression: 1.6 GB (~48% savings)
  - LeanVec4x8 + reduce to 384: 580 MB (~81% savings)

### `class SVSVectorField(*, name, type=FieldTypes.VECTOR, path=None, attrs)`

Bases: `BaseField`

Vector field with SVS-VAMANA indexing and compression for memory-efficient approximate nearest neighbor search.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *FieldTypes.VECTOR* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([SVSVectorFieldAttributes](#svsvectorfieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[SVSVectorFieldAttributes](#svsvectorfieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal[FieldTypes.VECTOR]`

Field type

### `class SVSVectorFieldAttributes(*, dims, algorithm=VectorIndexAlgorithm.SVS_VAMANA, datatype=VectorDataType.FLOAT32, distance_metric=VectorDistanceMetric.COSINE, initial_cap=None, index_missing=False, graph_max_degree=40, construction_window_size=250, search_window_size=20, epsilon=0.01, compression=None, reduce=None, training_threshold=None)`

SVS-VAMANA vector field attributes with compression support.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **dims** (*int*)
  * **algorithm** (*Literal* *[* *VectorIndexAlgorithm.SVS_VAMANA* *]*)
  * **datatype** (*VectorDataType*)
  * **distance_metric** (*VectorDistanceMetric*)
  * **initial_cap** (*int* *|* *None*)
  * **index_missing** (*bool*)
  * **graph_max_degree** (*int*)
  * **construction_window_size** (*int*)
  * **search_window_size** (*int*)
  * **epsilon** (*float*)
  * **compression** (*CompressionType* *|* *None*)
  * **reduce** (*int* *|* *None*)
  * **training_threshold** (*int* *|* *None*)

#### `validate_svs_params()`

Validate SVS-VAMANA specific constraints

#### `algorithm: Literal[VectorIndexAlgorithm.SVS_VAMANA]`

The indexing algorithm for the vector field

#### `compression: CompressionType | None`

LVQ4, LVQ8, LeanVec4x8, LeanVec8x8

* **Type:**
  Vector compression

#### `construction_window_size: int`

1. - affects quality vs build time

* **Type:**
  Build-time candidates (default

#### `epsilon: float`

0.01)

* **Type:**
  Range query boundary factor (default

#### `graph_max_degree: int`

1. - affects recall vs memory

* **Type:**
  Max edges per node (default

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `reduce: int | None`

Dimensionality reduction for LeanVec types (must be < dims)

#### `search_window_size: int`

1. - primary tuning parameter

* **Type:**
  Search candidates (default

#### `training_threshold: int | None`

10,240)

* **Type:**
  Min vectors before compression training (default

**SVS-VAMANA Examples:**

**Basic configuration (no compression):**

```yaml
- name: embedding
  type: vector
  attrs:
    algorithm: svs-vamana
    dims: 768
    distance_metric: cosine
    datatype: float32
    # Standard settings for balanced performance
    graph_max_degree: 40
    construction_window_size: 250
    search_window_size: 20
```

**High-performance configuration with compression:**

```yaml
- name: embedding
  type: vector
  attrs:
    algorithm: svs-vamana
    dims: 768
    distance_metric: cosine
    datatype: float32
    # Tuned for better recall
    graph_max_degree: 64
    construction_window_size: 500
    search_window_size: 40
    # Maximum compression with dimensionality reduction
    compression: LeanVec4x8
    reduce: 384  # 50% dimensionality reduction
    training_threshold: 1000
```

**Important Notes:**

- **Requirements**: SVS-VAMANA requires Redis >= 8.2 with RediSearch >= 2.8.10.
- **Datatype limitations**: SVS-VAMANA only supports float16 and float32 datatypes (not bfloat16 or float64).
- **Compression compatibility**: The reduce parameter is only valid with LeanVec compression types (LeanVec4x8 or LeanVec8x8).
- **Platform considerations**: Intel’s proprietary LVQ and LeanVec optimizations are not available in Redis Open Source. On non-Intel platforms and Redis Open Source, SVS-VAMANA with compression falls back to basic 8-bit scalar quantization.
- **Performance tip**: Start with default parameters and tune search_window_size first for your speed vs accuracy requirements.

### `FLAT Vector Fields`

FLAT - Brute-force exact search. **Best for small datasets (<10K vectors) requiring 100% accuracy.**

### `When to use FLAT & Performance Details`

**Use FLAT when:**
: - Small datasets (<100K vectors) where exact results are required
  - Search accuracy is critical and approximate results are not acceptable
  - Baseline comparisons when evaluating approximate algorithms
  - Simple use cases where setup simplicity is more important than performance

**Performance characteristics:**
: - **Search accuracy**: 100% exact results (no approximation)
  - **Search speed**: Linear time O(n) - slower as dataset grows
  - **Memory usage**: Minimal overhead, stores vectors as-is
  - **Build time**: Fastest index construction (no preprocessing)

**Trade-offs vs other algorithms:**
: - **vs HNSW**: Much slower search but exact results, faster index building
  - **vs SVS-VAMANA**: Slower search and higher memory usage, but exact results

### `class FlatVectorField(*, name, type=FieldTypes.VECTOR, path=None, attrs)`

Bases: `BaseField`

Vector field with FLAT (exact search) indexing for exact nearest neighbor search.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **type** (*Literal* *[* *FieldTypes.VECTOR* *]*)
  * **path** (*str* *|* *None*)
  * **attrs** ([FlatVectorFieldAttributes](#flatvectorfieldattributes))

#### `as_redis_field()`

Convert schema field to Redis Field object

* **Return type:**
  *Field*

#### `attrs: `[FlatVectorFieldAttributes](#flatvectorfieldattributes)

Specified field attributes

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `type: Literal[FieldTypes.VECTOR]`

Field type

### `class FlatVectorFieldAttributes(*, dims, algorithm=VectorIndexAlgorithm.FLAT, datatype=VectorDataType.FLOAT32, distance_metric=VectorDistanceMetric.COSINE, initial_cap=None, index_missing=False, block_size=None)`

FLAT vector field attributes for exact nearest neighbor search.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **dims** (*int*)
  * **algorithm** (*Literal* *[* *VectorIndexAlgorithm.FLAT* *]*)
  * **datatype** (*VectorDataType*)
  * **distance_metric** (*VectorDistanceMetric*)
  * **initial_cap** (*int* *|* *None*)
  * **index_missing** (*bool*)
  * **block_size** (*int* *|* *None*)

#### `algorithm: Literal[VectorIndexAlgorithm.FLAT]`

The indexing algorithm (fixed as ‘flat’)

#### `block_size: int | None`

Block size for processing (optional) - improves batch operation throughput

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

**FLAT Example:**

```yaml
- name: embedding
  type: vector
  attrs:
    algorithm: flat
    dims: 768
    distance_metric: cosine
    datatype: float32
    # Optional: tune for batch processing
    block_size: 1024
```

**Note**: FLAT is recommended for small datasets or when exact results are mandatory. For larger datasets, consider HNSW or SVS-VAMANA for better performance.

## SVS-VAMANA Configuration Utilities

For SVS-VAMANA indices, RedisVL provides utilities to help configure compression settings and estimate memory savings.

### `CompressionAdvisor`

### `class CompressionAdvisor`

Bases: `object`

Helper to recommend compression settings based on vector characteristics.

This class provides utilities to:
- Recommend optimal SVS-VAMANA configurations based on vector dimensions and priorities
- Estimate memory savings from compression and dimensionality reduction

### `Examples`

```pycon
>> # Get recommendations for high-dimensional vectors
>> config = CompressionAdvisor.recommend(dims=1536, priority="balanced")
>> config.compression
'LeanVec4x8'
>> config.reduce
768
```

```pycon
>> # Estimate memory savings
>> savings = CompressionAdvisor.estimate_memory_savings(
...     compression="LeanVec4x8",
...     dims=1536,
...     reduce=768
... )
>> savings
81.2
```

#### `static estimate_memory_savings(compression, dims, reduce=None)`

Estimate memory savings percentage from compression.

Calculates the percentage of memory saved compared to uncompressed float32 vectors.

* **Parameters:**
  * **compression** (*str*) – Compression type (e.g., "LVQ4", "LeanVec4x8")
  * **dims** (*int*) – Original vector dimensionality
  * **reduce** (*int* *|* *None*) – Reduced dimensionality (for LeanVec compression)
* **Returns:**
  Memory savings percentage (0-100)
* **Return type:**
  float

### `Examples`

```pycon
>> # LeanVec with dimensionality reduction
>> CompressionAdvisor.estimate_memory_savings(
...     compression="LeanVec4x8",
...     dims=1536,
...     reduce=768
... )
81.2
```

```pycon
>> # LVQ without dimensionality reduction
>> CompressionAdvisor.estimate_memory_savings(
...     compression="LVQ4",
...     dims=384
... )
87.5
```

#### `static recommend(dims, priority='balanced', datatype=None)`

Recommend compression settings based on dimensions and priorities.

* **Parameters:**
  * **dims** (*int*) – Vector dimensionality (must be > 0)
  * **priority** (*Literal* *[* *'speed'* *,*  *'memory'* *,*  *'balanced'* *]*) – Optimization priority:
    - "memory": Maximize memory savings
    - "speed": Optimize for query speed
    - "balanced": Balance between memory and speed
  * **datatype** (*str* *|* *None*) – Override datatype (default: float16 for high-dim, float32 for low-dim)
* **Returns:**
  Complete SVS-VAMANA configuration including:
  : - algorithm: "svs-vamana"
    - datatype: Recommended datatype
    - compression: Compression type
    - reduce: Dimensionality reduction (for LeanVec only)
    - graph_max_degree: Graph connectivity
    - construction_window_size: Build-time candidates
    - search_window_size: Query-time candidates
* **Return type:**
  dict
* **Raises:**
  **ValueError** – If dims <= 0

### `Examples`

```pycon
>> # High-dimensional embeddings (e.g., OpenAI ada-002)
>> config = CompressionAdvisor.recommend(dims=1536, priority="memory")
>> config.compression
'LeanVec4x8'
>> config.reduce
768
```

```pycon
>> # Lower-dimensional embeddings
>> config = CompressionAdvisor.recommend(dims=384, priority="speed")
>> config.compression
'LVQ4x8'
```

### `SVSConfig`

### `class SVSConfig(*, algorithm='svs-vamana', datatype=None, compression=None, reduce=None, graph_max_degree=None, construction_window_size=None, search_window_size=None)`

Bases: `BaseModel`

SVS-VAMANA configuration model.

* **Parameters:**
  * **algorithm** (*Literal* *[* *'svs-vamana'* *]*)
  * **datatype** (*str* *|* *None*)
  * **compression** (*str* *|* *None*)
  * **reduce** (*int* *|* *None*)
  * **graph_max_degree** (*int* *|* *None*)
  * **construction_window_size** (*int* *|* *None*)
  * **search_window_size** (*int* *|* *None*)

#### `algorithm`

Always "svs-vamana"

* **Type:**
  Literal[‘svs-vamana’]

#### `datatype`

Vector datatype (float16, float32)

* **Type:**
  str | None

#### `compression`

Compression type (LVQ4, LeanVec4x8, etc.)

* **Type:**
  str | None

#### `reduce`

Reduced dimensionality (only for LeanVec)

* **Type:**
  int | None

#### `graph_max_degree`

Max edges per node

* **Type:**
  int | None

#### `construction_window_size`

Build-time candidates

* **Type:**
  int | None

#### `search_window_size`

Query-time candidates

* **Type:**
  int | None

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

<a id="vector-algorithm-comparison"></a>

## Vector Algorithm Comparison

This section provides detailed guidance for choosing between vector search algorithms.

### `Algorithm Selection Guide`

#### `Vector Algorithm Comparison`

| Algorithm      | Best For                               | Performance                    | Memory Usage              | Trade-offs                            |
|----------------|----------------------------------------|--------------------------------|---------------------------|---------------------------------------|
| **FLAT**       | Small datasets (<100K vectors)         | 100% recall, O(n) search       | Minimal overhead          | Exact but slow for large data         |
| **HNSW**       | General purpose (100K-1M+ vectors)     | 95-99% recall, O(log n) search | Moderate (graph overhead) | Fast approximate search               |
| **SVS-VAMANA** | Large datasets with memory constraints | 90-95% recall, O(log n) search | Low (with compression)    | Intel-optimized, requires newer Redis |

### `When to Use Each Algorithm`

**Choose FLAT when:**
: - Dataset size < 100,000 vectors
  - Exact results are mandatory
  - Simple setup is preferred
  - Query latency is not critical

**Choose HNSW when:**
: - Dataset size 100K - 1M+ vectors
  - Need balanced speed and accuracy
  - Cross-platform compatibility required
  - Most common choice for production

**Choose SVS-VAMANA when:**
: - Dataset size > 100K vectors
  - Memory usage is a primary concern
  - Running on Intel hardware
  - Can accept 90-95% recall for memory savings

### `Performance Characteristics`

**Search Speed:**
: - FLAT: Linear time O(n) - gets slower as data grows
  - HNSW: Logarithmic time O(log n) - scales well
  - SVS-VAMANA: Logarithmic time O(log n) - scales well

**Memory Usage (1M vectors, 768 dims, float32):**
: - FLAT: ~3.1 GB (baseline)
  - HNSW: ~3.7 GB (20% overhead for graph)
  - SVS-VAMANA: 1.6-3.1 GB (depends on compression)

**Recall Quality:**
: - FLAT: 100% (exact search)
  - HNSW: 95-99% (tunable via ef_runtime)
  - SVS-VAMANA: 90-95% (depends on compression)

### `Migration Considerations`

**From FLAT to HNSW:**
: - Straightforward migration
  - Expect slight recall reduction but major speed improvement
  - Tune ef_runtime to balance speed vs accuracy

**From HNSW to SVS-VAMANA:**
: - Requires Redis >= 8.2 with RediSearch >= 2.8.10
  - Change datatype to float16 or float32 if using others
  - Consider compression options for memory savings

**From SVS-VAMANA to others:**
: - May need to change datatype back if using float64/bfloat16
  - HNSW provides similar performance with broader compatibility

For complete Redis field documentation, see: [https://redis.io/commands/ft.create/](https://redis.io/commands/ft.create/)

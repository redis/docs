---
linkTitle: Schema
title: Schema
aliases:
- /integrate/redisvl/api/schema
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

### `class IndexSchema(*, index, fields={}, version='0.1.0')`

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

Fields associated with the search index and their properties

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

## Supported Field Types and Attributes

Each field type supports specific attributes that customize its behavior. Below are the field types and their available attributes:

**Text Field Attributes**:

- weight: Importance of the field in result calculation.
- no_stem: Disables stemming during indexing.
- withsuffixtrie: Optimizes queries by maintaining a suffix trie.
- phonetic_matcher: Enables phonetic matching.
- sortable: Allows sorting on this field.

**Tag Field Attributes**:

- separator: Character for splitting text into individual tags.
- case_sensitive: Case sensitivity in tag matching.
- withsuffixtrie: Suffix trie optimization for queries.
- sortable: Enables sorting based on the tag field.

**Numeric and Geo Field Attributes**:

- Both numeric and geo fields support the sortable attribute, enabling sorting on these fields.

**Common Vector Field Attributes**:

- dims: Dimensionality of the vector.
- algorithm: Indexing algorithm (flat or hnsw).
- datatype: Float datatype of the vector (bfloat16, float16, float32, float64).
- distance_metric: Metric for measuring query relevance (COSINE, L2, IP).

**HNSW Vector Field Specific Attributes**:

- m: Max outgoing edges per node in each layer.
- ef_construction: Max edge candidates during build time.
- ef_runtime: Max top candidates during search.
- epsilon: Range search boundary factor.

Note:
: See fully documented Redis-supported fields and options here: [https://redis.io/commands/ft.create/](https://redis.io/commands/ft.create/)

---
linkTitle: Filter
title: Filter
url: '/develop/ai/redisvl/0.8.2/api/filter/'
---


<a id="filter-api"></a>

## FilterExpression

### `class FilterExpression(_filter=None, operator=None, left=None, right=None)`

A FilterExpression is a logical combination of filters in RedisVL.

FilterExpressions can be combined using the & and | operators to create
complex expressions that evaluate to the Redis Query language.

This presents an interface by which users can create complex queries
without having to know the Redis Query language.

```python
from redisvl.query.filter import Tag, Num

brand_is_nike = Tag("brand") == "nike"
price_is_over_100 = Num("price") < 100
f = brand_is_nike & price_is_over_100

print(str(f))

>> (@brand:{nike} @price:[-inf (100)])
```

This can be combined with the VectorQuery class to create a query:

```python
from redisvl.query import VectorQuery

v = VectorQuery(
    vector=[0.1, 0.1, 0.5, ...],
    vector_field_name="product_embedding",
    return_fields=["product_id", "brand", "price"],
    filter_expression=f,
)
```

#### `NOTE`
Filter expressions are typically not called directly. Instead they are
built by combining filter statements using the & and | operators.

* **Parameters:**
  * **\_filter** (*str* *|* *None*)
  * **operator** (*FilterOperator* *|* *None*)
  * **left** ([FilterExpression](#filterexpression) *|* *None*)
  * **right** ([FilterExpression](#filterexpression) *|* *None*)

## Tag

### `class Tag(field)`

A Tag filter can be applied to Tag fields

* **Parameters:**
  **field** (*str*)

#### `__eq__(other)`

Create a Tag equality filter expression.

* **Parameters:**
  **other** (*Union* *[* *List* *[* *str* *]* *,* *str* *]*) – The tag(s) to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Tag

f = Tag("brand") == "nike"
```

#### `__ne__(other)`

Create a Tag inequality filter expression.

* **Parameters:**
  **other** (*Union* *[* *List* *[* *str* *]* *,* *str* *]*) – The tag(s) to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Tag
f = Tag("brand") != "nike"
```

#### `__str__()`

Return the Redis Query string for the Tag filter

* **Return type:**
  str

## Text

### `class Text(field)`

A Text is a FilterField representing a text field in a Redis index.

* **Parameters:**
  **field** (*str*)

#### `__eq__(other)`

Create a Text equality filter expression. These expressions yield
filters that enforce an exact match on the supplied term(s).

* **Parameters:**
  **other** (*str*) – The text value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Text

f = Text("job") == "engineer"
```

#### `__mod__(other)`

Create a Text "LIKE" filter expression. A flexible expression that
yields filters that can use a variety of additional operators like
wildcards (\*), fuzzy matches (%%), or combinatorics (|) of the supplied
term(s).

* **Parameters:**
  **other** (*str*) – The text value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Text

f = Text("job") % "engine*"         # suffix wild card match
f = Text("job") % "%%engine%%"      # fuzzy match w/ Levenshtein Distance
f = Text("job") % "engineer|doctor" # contains either term in field
f = Text("job") % "engineer doctor" # contains both terms in field
```

#### `__ne__(other)`

Create a Text inequality filter expression. These expressions yield
negated filters on exact matches on the supplied term(s). Opposite of an
equality filter expression.

* **Parameters:**
  **other** (*str*) – The text value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Text

f = Text("job") != "engineer"
```

#### `__str__()`

Return the Redis Query string for the Text filter

* **Return type:**
  str

## Num

### `class Num(field)`

A Num is a FilterField representing a numeric field in a Redis index.

* **Parameters:**
  **field** (*str*)

#### `__eq__(other)`

Create a Numeric equality filter expression.

* **Parameters:**
  **other** (*int*) – The value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Num
f = Num("zipcode") == 90210
```

#### `__ge__(other)`

Create a Numeric greater than or equal to filter expression.

* **Parameters:**
  **other** (*int*) – The value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Num

f = Num("age") >= 18
```

#### `__gt__(other)`

Create a Numeric greater than filter expression.

* **Parameters:**
  **other** (*int*) – The value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Num

f = Num("age") > 18
```

#### `__le__(other)`

Create a Numeric less than or equal to filter expression.

* **Parameters:**
  **other** (*int*) – The value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Num

f = Num("age") <= 18
```

#### `__lt__(other)`

Create a Numeric less than filter expression.

* **Parameters:**
  **other** (*int*) – The value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Num

f = Num("age") < 18
```

#### `__ne__(other)`

Create a Numeric inequality filter expression.

* **Parameters:**
  **other** (*int*) – The value to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Num

f = Num("zipcode") != 90210
```

#### `__str__()`

Return the Redis Query string for the Numeric filter

* **Return type:**
  str

#### `between(start, end, inclusive='both')`

Operator for searching values between two numeric values.

* **Parameters:**
  * **start** (*int*)
  * **end** (*int*)
  * **inclusive** (*str*)
* **Return type:**
  [FilterExpression](#filterexpression)

## Geo

### `class Geo(field)`

A Geo is a FilterField representing a geographic (lat/lon) field in a
Redis index.

* **Parameters:**
  **field** (*str*)

#### `__eq__(other)`

Create a geographic filter within a specified GeoRadius.

* **Parameters:**
  **other** ([GeoRadius](#georadius)) – The geographic spec to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Geo, GeoRadius

f = Geo("location") == GeoRadius(-122.4194, 37.7749, 1, unit="m")
```

#### `__ne__(other)`

Create a geographic filter outside of a specified GeoRadius.

* **Parameters:**
  **other** ([GeoRadius](#georadius)) – The geographic spec to filter on.
* **Return type:**
  [FilterExpression](#filterexpression)

```python
from redisvl.query.filter import Geo, GeoRadius

f = Geo("location") != GeoRadius(-122.4194, 37.7749, 1, unit="m")
```

#### `__str__()`

Return the Redis Query string for the Geo filter

* **Return type:**
  str

## GeoRadius

### `class GeoRadius(longitude, latitude, radius=1, unit='km')`

A GeoRadius is a GeoSpec representing a geographic radius.

Create a GeoRadius specification (GeoSpec)

* **Parameters:**
  * **longitude** (*float*) – The longitude of the center of the radius.
  * **latitude** (*float*) – The latitude of the center of the radius.
  * **radius** (*int* *,* *optional*) – The radius of the circle. Defaults to 1.
  * **unit** (*str* *,* *optional*) – The unit of the radius. Defaults to "km".
* **Raises:**
  **ValueError** – If the unit is not one of "m", "km", "mi", or "ft".

#### `__init__(longitude, latitude, radius=1, unit='km')`

Create a GeoRadius specification (GeoSpec)

* **Parameters:**
  * **longitude** (*float*) – The longitude of the center of the radius.
  * **latitude** (*float*) – The latitude of the center of the radius.
  * **radius** (*int* *,* *optional*) – The radius of the circle. Defaults to 1.
  * **unit** (*str* *,* *optional*) – The unit of the radius. Defaults to "km".
* **Raises:**
  **ValueError** – If the unit is not one of "m", "km", "mi", or "ft".

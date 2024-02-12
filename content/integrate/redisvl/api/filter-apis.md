---
linkTitle: Filter
title: Filter
type: integration
description: The filter APIs
weight: 4
---

## Tag Objects

```python
class Tag(FilterField)
```

A Tag is a FilterField representing a tag in a Redis index.

###  \_\_init\_\_

```python
def __init__(field: str)
```

Create a Tag FilterField.

**Arguments**:

- `field` _str_ - The name of the tag field in the index to be queried against

###  \_\_eq\_\_

```python
@check_operator_misuse
def __eq__(other: Union[List[str], str]) -> "FilterExpression"
```

Create a Tag equality filter expression.

**Arguments**:

- `other` _Union[List[str], str]_ - The tag(s) to filter on.
  
  ```python
  from redisvl.query.filter import Tag
  filter = Tag("brand") == "nike"
  ```

###  \_\_ne\_\_

```python
@check_operator_misuse
def __ne__(other) -> "FilterExpression"
```

Create a Tag inequality filter expression.

**Arguments**:

- `other` _Union[List[str], str]_ - The tag(s) to filter on.
  
  ```python
  from redisvl.query.filter import Tag
  filter = Tag("brand") != "nike"
  ```

###  \_\_str\_\_

```python
def __str__() -> str
```

Return the Redis Query syntax for a Tag filter expression.

## GeoRadius Objects

```python
class GeoRadius(GeoSpec)
```

A GeoRadius is a GeoSpec representing a geographic radius.

###  \_\_init\_\_

```python
def __init__(longitude: float,
             latitude: float,
             radius: int = 1,
             unit: str = "km")
```

Create a GeoRadius specification (GeoSpec)

**Arguments**:

- `longitude` _float_ - The longitude of the center of the radius.
- `latitude` _float_ - The latitude of the center of the radius.
- `radius` _int, optional_ - The radius of the circle. Defaults to 1.
- `unit` _str, optional_ - The unit of the radius. Defaults to "km".
  

**Raises**:

- `ValueError` - If the unit is not one of "m", "km", "mi", or "ft".

## Geo Objects

```python
class Geo(FilterField)
```

A Geo is a FilterField representing a geographic (lat/lon) field in a
Redis index.

###  \_\_eq\_\_

```python
@check_operator_misuse
def __eq__(other) -> "FilterExpression"
```

Create a Geographic equality filter expression.

**Arguments**:

- `other` _GeoSpec_ - The geographic spec to filter on.
  
  ```python
  from redisvl.query.filter import Geo, GeoRadius
  filter = Geo("location") == GeoRadius(-122.4194, 37.7749, 1, unit="m")
  ```

###  \_\_ne\_\_

```python
@check_operator_misuse
def __ne__(other) -> "FilterExpression"
```

Create a Geographic inequality filter expression.

**Arguments**:

- `other` _GeoSpec_ - The geographic spec to filter on.
  
  ```python
  from redisvl.query.filter import Geo, GeoRadius
  filter = Geo("location") != GeoRadius(-122.4194, 37.7749, 1, unit="m")
  ```

###  \_\_str\_\_

```python
def __str__() -> str
```

Return the Redis Query syntax for a Geographic filter expression.

## Num Objects

```python
class Num(FilterField)
```

A Num is a FilterField representing a numeric field in a Redis index.

###  \_\_eq\_\_

```python
def __eq__(other: int) -> "FilterExpression"
```

Create a Numeric equality filter expression.

**Arguments**:

- `other` _int_ - The value to filter on.
  
  ```python
  from redisvl.query.filter import Num
  filter = Num("zipcode") == 90210
  ```

###  \_\_ne\_\_

```python
def __ne__(other: int) -> "FilterExpression"
```

Create a Numeric inequality filter expression.

**Arguments**:

- `other` _int_ - The value to filter on.
  
  ```python
  from redisvl.query.filter import Num
  filter = Num("zipcode") != 90210
  ```

###  \_\_gt\_\_

```python
def __gt__(other: int) -> "FilterExpression"
```

Create a Numeric greater than filter expression.

**Arguments**:

- `other` _int_ - The value to filter on.
  
  ```python
  from redisvl.query.filter import Num
  filter = Num("age") > 18
  ```

###  \_\_lt\_\_

```python
def __lt__(other: int) -> "FilterExpression"
```

Create a Numeric less than filter expression.

**Arguments**:

- `other` _int_ - The value to filter on.
  
  ```python
  from redisvl.query.filter import Num
  filter = Num("age") < 18
  ```

###  \_\_ge\_\_

```python
def __ge__(other: int) -> "FilterExpression"
```

Create a Numeric greater than or equal to filter expression.

**Arguments**:

- `other` _int_ - The value to filter on.
  
  ```python
  from redisvl.query.filter import Num
  filter = Num("age") >= 18
  ```

###  \_\_le\_\_

```python
def __le__(other: int) -> "FilterExpression"
```

Create a Numeric less than or equal to filter expression.

**Arguments**:

- `other` _int_ - The value to filter on.
  
  ```python
  from redisvl.query.filter import Num
  filter = Num("age") <= 18
  ```

###  \_\_str\_\_

```python
def __str__() -> str
```

Return the Redis Query syntax for a Numeric filter expression.

## Text Objects

```python
class Text(FilterField)
```

A Text is a FilterField representing a text field in a Redis index.

###  \_\_eq\_\_

```python
@check_operator_misuse
def __eq__(other: str) -> "FilterExpression"
```

Create a Text equality filter expression. These expressions yield
filters that enforce an exact match on the supplied term(s).

**Arguments**:

- `other` _str_ - The text value to filter on.
  
  ```python
  from redisvl.query.filter import Text
  filter = Text("job") == "engineer"
  ```

###  \_\_ne\_\_

```python
@check_operator_misuse
def __ne__(other: str) -> "FilterExpression"
```

Create a Text inequality filter expression. These expressions yield
negated filters on exact matches on the supplied term(s). Opposite of an
equality filter expression.

**Arguments**:

- `other` _str_ - The text value to filter on.
  
  ```python
  from redisvl.query.filter import Text
  filter = Text("job") != "engineer"
  ```

###  \_\_mod\_\_

```python
def __mod__(other: str) -> "FilterExpression"
```

Create a Text "LIKE" filter expression. A flexible expression that
yields filters that can use a variety of additional operators like
wildcards (*), fuzzy matches (%%), or combinatorics (|) of the supplied
term(s).

**Arguments**:

- `other` _str_ - The text value to filter on.
  
  ```python
  from redisvl.query.filter import Text
  filter = Text("job") % "engine*"         # suffix wild card match
  filter = Text("job") % "%%engine%%"      # fuzzy match w/ Levenshtein Distance
  filter = Text("job") % "engineer|doctor" # contains either term in field
  filter = Text("job") % "engineer doctor" # contains both terms in field
  ```

## FilterExpression Objects

```python
class FilterExpression()
```

A FilterExpression is a logical expression of FilterFields.

FilterExpressions can be combined using the & and | operators to create
complex logical expressions that evaluate to the Redis Query language.

This presents an interface by which users can create complex queries
without having to know the Redis Query language.

Filter expressions are not created directly. Instead they are built
by combining FilterFields using the & and | operators.

```python
    from redisvl.query.filter import Tag, Num
    brand_is_nike = Tag("brand") == "nike"
    price_is_over_100 = Num("price") < 100
    filter = brand_is_nike & price_is_over_100
    print(str(filter))
    (@brand:{nike} @price:[-inf (100)])
```

This can be combined with the VectorQuery class to create a query:

```python
    from redisvl.query import VectorQuery
    v = VectorQuery(
    ...     vector=[0.1, 0.1, 0.5, ...],
    ...     vector_field_name="product_embedding",
    ...     return_fields=["product_id", "brand", "price"],
    ...     filter_expression=filter,
    ... )
```

---
linkTitle: Semantic router
title: Semantic Router
url: '/develop/ai/redisvl/0.13.0/api/router/'
---


<a id="semantic-router-api"></a>

## Semantic Router

## Routing Config

## Route

## Route Match

### `class RouteMatch(*, name=None, distance=None)`

Model representing a matched route with distance information.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str* *|* *None*)
  * **distance** (*float* *|* *None*)

#### `distance: float | None`

The vector distance between the statement and the matched route.

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `name: str | None`

The matched route name.

## Distance Aggregation Method

### `class DistanceAggregationMethod(value, names=None, *, module=None, qualname=None, type=None, start=1, boundary=None)`

Enumeration for distance aggregation methods.

#### `avg = 'avg'`

Compute the average of the vector distances.

#### `min = 'min'`

Compute the minimum of the vector distances.

#### `sum = 'sum'`

Compute the sum of the vector distances.

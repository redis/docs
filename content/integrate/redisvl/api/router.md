---
linkTitle: Semantic router
title: Semantic Router
type: integration
---


<a id="semantic-router-api"></a>

## Semantic Router

### `class SemanticRouter(name, routes, vectorizer=None, routing_config=None, redis_client=None, redis_url='redis://localhost:6379', overwrite=False, connection_kwargs={})`

Semantic Router for managing and querying route vectors.

Initialize the SemanticRouter.

* **Parameters:**
  * **name** (*str*) – The name of the semantic router.
  * **routes** (*List* *[*[Route](#route) *]*) – List of Route objects.
  * **vectorizer** (*BaseVectorizer* *,* *optional*) – The vectorizer used to embed route references. Defaults to default HFTextVectorizer.
  * **routing_config** ([RoutingConfig](#routingconfig) *,* *optional*) – Configuration for routing behavior. Defaults to the default RoutingConfig.
  * **redis_client** (*Optional* *[* *Redis* *]* *,* *optional*) – Redis client for connection. Defaults to None.
  * **redis_url** (*str* *,* *optional*) – The redis url. Defaults to redis://localhost:6379.
  * **overwrite** (*bool* *,* *optional*) – Whether to overwrite existing index. Defaults to False.
  * **connection_kwargs** (*Dict* *[* *str* *,* *Any* *]*) – The connection arguments
    for the redis client. Defaults to empty {}.

#### `clear()`

Flush all routes from the semantic router index.

* **Return type:**
  None

#### `delete()`

Delete the semantic router index.

* **Return type:**
  None

#### `classmethod from_dict(data, **kwargs)`

Create a SemanticRouter from a dictionary.

* **Parameters:**
  **data** (*Dict* *[* *str* *,* *Any* *]*) – The dictionary containing the semantic router data.
* **Returns:**
  The semantic router instance.
* **Return type:**
  [SemanticRouter](#semanticrouter)
* **Raises:**
  **ValueError** – If required data is missing or invalid.

```python
from redisvl.extensions.router import SemanticRouter
router_data = {
    "name": "example_router",
    "routes": [{"name": "route1", "references": ["ref1"], "distance_threshold": 0.5}],
    "vectorizer": {"type": "openai", "model": "text-embedding-ada-002"},
}
router = SemanticRouter.from_dict(router_data)
```

#### `classmethod from_yaml(file_path, **kwargs)`

Create a SemanticRouter from a YAML file.

* **Parameters:**
  **file_path** (*str*) – The path to the YAML file.
* **Returns:**
  The semantic router instance.
* **Return type:**
  [SemanticRouter](#semanticrouter)
* **Raises:**
  * **ValueError** – If the file path is invalid.
  * **FileNotFoundError** – If the file does not exist.

```python
from redisvl.extensions.router import SemanticRouter
router = SemanticRouter.from_yaml("router.yaml", redis_url="redis://localhost:6379")
```

#### `get(route_name)`

Get a route by its name.

* **Parameters:**
  **route_name** (*str*) – Name of the route.
* **Returns:**
  The selected Route object or None if not found.
* **Return type:**
  Optional[[Route](#route)]

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `remove_route(route_name)`

Remove a route and all references from the semantic router.

* **Parameters:**
  **route_name** (*str*) – Name of the route to remove.
* **Return type:**
  None

#### `route_many(statement=None, vector=None, max_k=None, distance_threshold=None, aggregation_method=None)`

Query the semantic router with a given statement or vector for multiple matches.

* **Parameters:**
  * **statement** (*Optional* *[* *str* *]*) – The input statement to be queried.
  * **vector** (*Optional* *[* *List* *[* *float* *]* *]*) – The input vector to be queried.
  * **max_k** (*Optional* *[* *int* *]*) – The maximum number of top matches to return.
  * **distance_threshold** (*Optional* *[* *float* *]*) – The threshold for semantic distance.
  * **aggregation_method** (*Optional* *[*[DistanceAggregationMethod](#distanceaggregationmethod) *]*) – The aggregation method used for vector distances.
* **Returns:**
  The matching routes and their details.
* **Return type:**
  List[[RouteMatch](#routematch)]

#### `to_dict()`

Convert the SemanticRouter instance to a dictionary.

* **Returns:**
  The dictionary representation of the SemanticRouter.
* **Return type:**
  Dict[str, Any]

```python
from redisvl.extensions.router import SemanticRouter
router = SemanticRouter(name="example_router", routes=[], redis_url="redis://localhost:6379")
router_dict = router.to_dict()
```

#### `to_yaml(file_path, overwrite=True)`

Write the semantic router to a YAML file.

* **Parameters:**
  * **file_path** (*str*) – The path to the YAML file.
  * **overwrite** (*bool*) – Whether to overwrite the file if it already exists.
* **Raises:**
  **FileExistsError** – If the file already exists and overwrite is False.
* **Return type:**
  None

```python
from redisvl.extensions.router import SemanticRouter
router = SemanticRouter(
    name="example_router",
    routes=[],
    redis_url="redis://localhost:6379"
)
router.to_yaml("router.yaml")
```

#### `update_route_thresholds(route_thresholds)`

Update the distance thresholds for each route.

* **Parameters:**
  **route_thresholds** (*Dict* *[* *str* *,* *float* *]*) – Dictionary of route names and their distance thresholds.

#### `update_routing_config(routing_config)`

Update the routing configuration.

* **Parameters:**
  **routing_config** ([RoutingConfig](#routingconfig)) – The new routing configuration.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `name: str`

The name of the semantic router.

#### `property route_names: List[str]`

Get the list of route names.

* **Returns:**
  List of route names.
* **Return type:**
  List[str]

#### `property route_thresholds: Dict[str, float | None]`

Get the distance thresholds for each route.

* **Returns:**
  Dictionary of route names and their distance thresholds.
* **Return type:**
  Dict[str, float]

#### `routes: `List[[Route](#route)]

List of Route objects.

#### `routing_config: `[RoutingConfig](#routingconfig)

Configuration for routing behavior.

#### `vectorizer: BaseVectorizer`

The vectorizer used to embed route references.

## Routing Config

### `class RoutingConfig(*, max_k=1, aggregation_method=DistanceAggregationMethod.avg)`

Configuration for routing behavior.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **max_k** (*Annotated* *[* *int* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=False* *,* *default=1* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
  * **aggregation_method** ([DistanceAggregationMethod](#distanceaggregationmethod))

#### `max_k: Annotated[int, FieldInfo(annotation=NoneType, required=False, default=1, metadata=[Strict(strict=True), Gt(gt=0)])]`

Aggregation method to use to classify queries.

#### `model_config: ClassVar[ConfigDict] = {'extra': 'ignore'}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## Route

### `class Route(*, name, references, metadata={}, distance_threshold=0.5)`

Model representing a routing path with associated metadata and thresholds.

Create a new model by parsing and validating input data from keyword arguments.

Raises [ValidationError][pydantic_core.ValidationError] if the input data cannot be
validated to form a valid model.

self is explicitly positional-only to allow self as a field name.

* **Parameters:**
  * **name** (*str*)
  * **references** (*List* *[* *str* *]*)
  * **metadata** (*Dict* *[* *str* *,* *Any* *]*)
  * **distance_threshold** (*Annotated* *[* *float* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *,* *Le* *(* *le=2* *)* *]* *)* *]*)

#### `distance_threshold: Annotated[float, FieldInfo(annotation=NoneType, required=True, metadata=[Strict(strict=True), Gt(gt=0), Le(le=2)])]`

Distance threshold for matching the route.

#### `metadata: Dict[str, Any]`

Metadata associated with the route.

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `name: str`

The name of the route.

#### `references: List[str]`

List of reference phrases for the route.

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

### `class DistanceAggregationMethod(value, names=<not given>, *values, module=None, qualname=None, type=None, start=1, boundary=None)`

Enumeration for distance aggregation methods.

#### `avg = 'avg'`

Compute the average of the vector distances.

#### `min = 'min'`

Compute the minimum of the vector distances.

#### `sum = 'sum'`

Compute the sum of the vector distances.

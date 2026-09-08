---
linkTitle: Exceptions
title: Exceptions
aliases:
- /integrate/redisvl/api/exceptions
---


RedisVL defines its custom exceptions in `redisvl.exceptions`. Every one of them
inherits from [RedisVLError](#redisvlerror), so catching that single base class is enough to
handle any error the core index and query APIs raise on their own behalf. Catch the
more specific subclasses when you want to react differently to, for example, a
schema validation failure than to a Redis connection problem. (The MCP integration
defines its own `redisvl.mcp.errors.RedisVLMCPError`, which is outside this
hierarchy.)

```text
Exception
└── RedisVLError
    ├── RedisSearchError
    ├── SchemaValidationError
    ├── QueryValidationError
    └── RedisModuleVersionError
```

{{< note >}}
Exceptions raised by the underlying `redis-py` client, such as
`redis.exceptions.ConnectionError`, are not part of this hierarchy. Where
RedisVL performs an index or search operation on your behalf it wraps those
errors in a [RedisSearchError](#redissearcherror) and chains the original exception, so the
underlying cause is still available on `__cause__`. Constructor and argument
validation raises standard Python exceptions instead: for example,
`VectorQuery(..., ef_runtime=-1)` raises `ValueError` at construction time,
before any `try` block around the query run is entered.
{{< /note >}}

## When each error is raised

| Exception                                                                | Raised when                                                                                                                           | Typical entry points                                          |
|--------------------------------------------------------------------------|---------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------|
| [SchemaValidationError](#schemavalidationerror)     | An object does not match the index schema. Only raised when the index was<br/>created with `validate_on_load=True`.                   | `load()`                                                      |
| [QueryValidationError](#queryvalidationerror)       | A query is not valid for the index it targets, for example setting<br/>`ef_runtime` on a vector field that uses the `flat` algorithm. | `query()`                                                     |
| [RedisSearchError](#redissearcherror)               | An index or search operation fails, including errors returned by Redis<br/>itself.                                                    | `create()`, `exists()`, `delete()`, `search()`, `aggregate()` |
| [RedisModuleVersionError](#redismoduleversionerror) | The connected Redis or Redis Search version does not support a requested<br/>feature, such as an `svs-vamana` vector field.           | `create()`                                                    |
| [RedisVLError](#redisvlerror)                       | A load operation fails for a reason not covered by a more specific error.<br/>Also the base class for everything above.               | `load()`                                                      |

All of the above apply equally to [`SearchIndex`]({{< relref "searchindex/#searchindex" >}}) and
[`AsyncSearchIndex`]({{< relref "searchindex/#asyncsearchindex" >}}).

## Handling errors

### `Validating data on load`

Schema validation is off by default. Pass `validate_on_load=True` to have RedisVL
check each object against the index schema before writing it, and raise
[SchemaValidationError](#schemavalidationerror) on the first object that does not match.

```python
from redisvl.index import SearchIndex
from redisvl.exceptions import SchemaValidationError

index = SearchIndex.from_yaml(
    "schema.yaml",
    redis_url="redis://localhost:6379",
    validate_on_load=True,
)

try:
    index.load(data)
except SchemaValidationError as e:
    # The message identifies the offending object by its position in the
    # input and describes which field failed and why.
    print(f"Invalid record: {e}")
```

The error message reports the index of the object within the batch you passed, so a
failure part way through a large load still points at a specific record.

### `Handling query failures`

[QueryValidationError](#queryvalidationerror) signals a query that cannot run against this index. It
is a programming error rather than a transient one, so it is usually worth failing
loudly instead of retrying.

```python
from redisvl.query import VectorQuery
from redisvl.exceptions import QueryValidationError

query = VectorQuery(
    vector=[0.1, 0.2, 0.3],
    vector_field_name="embedding",
    return_fields=["title"],
    ef_runtime=50,  # only supported by the 'hnsw' algorithm
)

try:
    results = index.query(query)
except QueryValidationError as e:
    print(f"Query rejected: {e}")
```

### `Separating configuration problems from Redis problems`

[RedisModuleVersionError](#redismoduleversionerror) is a subclass of [RedisVLError](#redisvlerror), not of
[RedisSearchError](#redissearcherror), so ordering the `except` clauses lets you distinguish an
unsupported feature from a genuine Redis failure.

```python
from redisvl.exceptions import RedisModuleVersionError, RedisSearchError

try:
    index.create(overwrite=True)
except RedisModuleVersionError as e:
    # The deployment does not support the requested feature, for example an
    # 'svs-vamana' field on a Redis version without a new enough Redis Search.
    print(f"Unsupported by this Redis deployment: {e}")
except RedisSearchError as e:
    # Something went wrong talking to Redis, or the index definition was
    # rejected. The original redis-py exception is available as e.__cause__.
    print(f"Index creation failed: {e}")
```

Insufficient permissions usually arrive as [RedisSearchError](#redissearcherror) as well.
`create()` checks whether the index already exists before doing anything, so a
credential that cannot run `FT.INFO` fails at that check rather than at
`FT.CREATE`, with the chained `redis.exceptions.NoPermissionError` on
`e.__cause__` naming the denied command. The same applies to an existing index whose
key prefix falls outside the credential’s key patterns; for an index that does not exist
yet, the check simply reports it as absent and `create()` proceeds.

`listall()` is the exception: it issues `FT._LIST` directly, so a permission failure
there raises `redis.exceptions.NoPermissionError` itself rather than a wrapped
[RedisSearchError](#redissearcherror). See [Install RedisVL]({{< relref "../user_guide/installation" >}}) for the ACL categories
RedisVL needs.

When the credential genuinely cannot run `FT.INFO`, this error is not something to
handle: construct the extension with `create_index=False` instead, which skips the
existence check entirely. See [Install RedisVL]({{< relref "../user_guide/installation" >}}).

### `Telling "the index is missing" apart from other failures`

Redis Search reports an absent index as an ordinary error reply rather than a distinct
type, and the wording has changed between versions – older releases say `Unknown index
name`, Redis 8.6 and earlier say `<name>: no such index`, and Redis 8.8 introduced
`SEARCH_INDEX_NOT_FOUND Index not found: <name>`. There is no error code to branch on,
so code that needs to distinguish "missing" from "something went wrong" has to match the
message.

[`exists()`]({{< relref "searchindex/#exists" >}}) already does this for you, which is the reason
to prefer it over catching errors from [`info()`]({{< relref "searchindex/#info" >}}): it
returns `False` only for a recognized missing-index reply and re-raises everything
else, so a permission or connection failure is never reported as an absent index.

```python
# Prefer this
if not index.exists():
    index.create()

# over inspecting the error yourself, which couples your code to the
# wording of a particular Redis version
try:
    index.info()
except RedisSearchError as e:
    if "no such index" in str(e):  # breaks on Redis 8.8
        index.create()
```

When you do need the distinction elsewhere, read `e.__cause__` rather than the
[RedisSearchError](#redissearcherror) message: the wrapper interpolates the index name, so an index
whose name happens to contain one of the wordings above would make an unrelated failure
look like an absence.

### `Catching everything`

When the calling code only needs to know that the operation failed, catch the base
class.

```python
from redisvl.exceptions import RedisVLError

try:
    index.load(data)
    results = index.query(query)
except RedisVLError as e:
    logger.error("RedisVL operation failed: %s", e)
    raise
```

Because RedisVL chains the underlying exception when it wraps one, `e.__cause__`
still holds the original `redis-py` error where there was one.

## Exception classes

### `RedisVLError`

### `class RedisVLError`

Bases: `Exception`

Base exception for all RedisVL errors.

### `RedisSearchError`

### `class RedisSearchError`

Bases: [RedisVLError](#redisvlerror)

Error raised for Redis Search specific operations.

### `SchemaValidationError`

### `class SchemaValidationError(message, index=None)`

Bases: [RedisVLError](#redisvlerror)

Error when validating data against a schema.

### `QueryValidationError`

### `class QueryValidationError`

Bases: [RedisVLError](#redisvlerror)

Error when validating a query.

### `RedisModuleVersionError`

### `class RedisModuleVersionError`

Bases: [RedisVLError](#redisvlerror)

Error when Redis or module versions are incompatible with requested features.

#### `classmethod for_svs_vamana(min_redis_version)`

Create error for unsupported SVS-VAMANA.

* **Parameters:**
  **min_redis_version** (*str*) – Minimum required Redis version
* **Returns:**
  RedisModuleVersionError with formatted message

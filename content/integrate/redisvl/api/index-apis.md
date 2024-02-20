---
linkTitle: Index
title: Index
type: integration
description: The index APIs
weight: 2
---

## SearchIndex Objects

```python
class SearchIndex()
```

A class for interacting with Redis as a vector database.

This class is a wrapper around the redis-py client that provides
purpose-built methods for interacting with Redis as a vector database.

```python

    from redisvl.index import SearchIndex

    # initialize the index object with schema from file
    index = SearchIndex.from_yaml("schema.yaml", redis_url="redis://localhost:6379")

    # create the index
    index.create(overwrite=True)

    # data is an iterable of dictionaries
    index.load(data)

    # Do the same with an an async connection
    index = SearchIndex.from_yaml("schema.yaml", redis_url="redis://localhost:6379", use_async=True)
    await index.acreate(overwrite=True)
    await index.aload(data)
```

### \_\_init\_\_

```python
def __init__(schema: IndexSchema,
             redis_url: Optional[str] = None,
             redis_client: Optional[Union[redis.Redis, aredis.Redis]] = None,
             connection_args: Dict[str, Any] = {},
             **kwargs)
```

Initialize the RedisVL search index class with a schema, redis_url,
connection_args, and other kwargs.

### name

```python
@property
def name() -> str
```

The name of the Redis search index.

### prefix

```python
@property
def prefix() -> str
```

The optional key prefix that comes before a unique key value in
forming a Redis key.

### key\_separator

```python
@property
def key_separator() -> str
```

The optional separator between a defined prefix and key value in
forming a Redis key.

### storage\_type

```python
@property
def storage_type() -> StorageType
```

The underlying storage type for the search index: hash or json.

### client

```python
@property
def client() -> Optional[Union[redis.Redis, aredis.Redis]]
```

The underlying redis-py client object.

### from\_yaml

```python
@classmethod
def from_yaml(cls,
              schema_path: str,
              connection_args: Dict[str, Any] = {},
              **kwargs)
```

Create a SearchIndex from a YAML schema file.

**Arguments**:

- `schema_path` _str_ - Path to the YAML schema file.
- `connection_args` _Dict[str, Any], optional_ - Redis client connection
  args.
  

**Returns**:

- `SearchIndex` - A RedisVL SearchIndex object.
  
  ```python
  
  from redisvl.index import SearchIndex
  index = SearchIndex.from_yaml("schema.yaml", redis_url="redis://localhost:6379")
  index.create(overwrite=True)
  ```

### from\_dict

```python
@classmethod
def from_dict(cls,
              schema_dict: Dict[str, Any],
              connection_args: Dict[str, Any] = {},
              **kwargs)
```

Create a SearchIndex from a dictionary.

**Arguments**:

- `schema_dict` _Dict[str, Any]_ - A dictionary containing the schema.
- `connection_args` _Dict[str, Any], optional_ - Redis client connection
  args.
  

**Returns**:

- `SearchIndex` - A RedisVL SearchIndex object.
  
```python
  
  from redisvl.index import SearchIndex
  index = SearchIndex.from_dict({
- `"index"` - {
- `"name"` - "my-index",
- `"prefix"` - "rvl",
- `"storage_type"` - "hash",
  },
- `"fields"` - {
- `"tag"` - [{"name": "doc-id"}]
  }
  }, redis_url="redis://localhost:6379")
  index.create(overwrite=True)
```

### connect

```python
def connect(redis_url: Optional[str] = None,
            use_async: bool = False,
            **kwargs)
```

Connect to a Redis instance.

This method establishes a connection to a Redis server. If `redis_url`
is provided, it will be used as the connection endpoint. Otherwise, the
method attempts to use the `REDIS_URL` environment variable as the
connection URL. The `use_async` parameter determines whether the
connection should be asynchronous.

Note: Additional keyword arguments (`**kwargs`) can be used to provide
extra options specific to the Redis connection.

**Arguments**:

- `redis_url` _Optional[str], optional_ - The URL of the Redis server to
  connect to. If not provided, the method defaults to using the
  `REDIS_URL` environment variable.
- `use_async` _bool_ - If `True`, establishes a connection with an async
  Redis client. Defaults to `False`.
  

**Raises**:

- `redis.exceptions.ConnectionError` - If the connection to the Redis
  server fails.
- `ValueError` - If the Redis URL is not provided nor accessible
  through the `REDIS_URL` environment variable.
  
```python
  
  # standard sync Redis connection
  index.connect(redis_url="redis://localhost:6379")
  # async Redis connection
  index.connect(redis_url="redis://localhost:6379", use_async=True)
```

### disconnect

```python
def disconnect()
```

Reset the Redis connection.

### set\_client

```python
def set_client(client: Union[redis.Redis, aredis.Redis])
```

Manually set the Redis client to use with the search index.

This method configures the search index to use a specific Redis or
Async Redis client. It is useful for cases where an external,
custom-configured client is preferred instead of creating a new one.

**Arguments**:

- `client` _Union[redis.Redis, aredis.Redis]_ - A Redis or Async Redis
  client instance to be used for the connection.
  

**Raises**:

- `TypeError` - If the provided client is not valid.
  
  ```python
  
  r = redis.Redis.from_url("redis://localhost:6379")
  index.set_client(r)
  
  # async Redis client
  import redis.asyncio as aredis
  
  r = aredis.Redis.from_url("redis://localhost:6379")
  index.set_client(r)
  ```

### key

```python
def key(id: str) -> str
```

Create a redis key as a combination of an index key prefix (optional)
and specified id. The id is typically either a unique identifier, or
derived from some domain-specific metadata combination (like a document
id or chunk id).

**Arguments**:

- `id` _str_ - The specified unique identifier for a particular
  document indexed in Redis.
  

**Returns**:

- `str` - The full Redis key including key prefix and value as a string.

### create

```python
@check_modules_present("_redis_conn")
def create(overwrite: bool = False) -> None
```

Create an index in Redis from this SearchIndex object.

**Arguments**:

- `overwrite` _bool, optional_ - Whether to overwrite the index if it
  already exists. Defaults to False.
  

**Raises**:

- `RuntimeError` - If the index already exists and 'overwrite' is False.
- `ValueError` - If no fields are defined for the index.

### delete

```python
@check_modules_present("_redis_conn")
@check_index_exists()
def delete(drop: bool = True)
```

Delete the search index.

**Arguments**:

- `drop` _bool, optional_ - Delete the documents in the index.
  Defaults to True.
  
  raises:
- `redis.exceptions.ResponseError` - If the index does not exist.

### load

```python
@check_modules_present("_redis_conn")
def load(data: Iterable[Any],
         key_field: Optional[str] = None,
         keys: Optional[Iterable[str]] = None,
         ttl: Optional[int] = None,
         preprocess: Optional[Callable] = None,
         batch_size: Optional[int] = None) -> List[str]
```

Load a batch of objects to Redis. Returns the list of keys loaded to
Redis.

**Arguments**:

- `data` _Iterable[Any]_ - An iterable of objects to store.
- `key_field` _Optional[str], optional_ - Field used as the key for each
  object. Defaults to None.
- `keys` _Optional[Iterable[str]], optional_ - Optional iterable of keys.
  Must match the length of objects if provided. Defaults to None.
- `ttl` _Optional[int], optional_ - Time-to-live in seconds for each key.
  Defaults to None.
- `preprocess` _Optional[Callable], optional_ - A function to preprocess
  objects before storage. Defaults to None.
- `batch_size` _Optional[int], optional_ - Number of objects to write in
  a single Redis pipeline execution. Defaults to class's
  default batch size.
  

**Returns**:

- `List[str]` - List of keys loaded to Redis.
  

**Raises**:

- `ValueError` - If the length of provided keys does not match the length
  of objects.
  
  ```python
  keys = index.load([{"test": "foo"}, {"test": "bar"}])
  ```

### fetch

```python
def fetch(id: str) -> Dict[str, Any]
```

Fetch an object from Redis by id.

The id is typically either a unique identifier,
or derived from some domain-specific metadata combination
(like a document id or chunk id).

**Arguments**:

- `id` _str_ - The specified unique identifier for a particular
  document indexed in Redis.
  

**Returns**:

  Dict[str, Any]: The fetched object.

### search

```python
@check_modules_present("_redis_conn")
@check_index_exists()
def search(*args, **kwargs) -> Union["Result", Any]
```

Perform a search on this index.

Wrapper around redis.search.Search that adds the index name
to the search query and passes along the rest of the arguments
to the redis-py ft.search() method.

**Returns**:

  Union["Result", Any]: Search results.

### query

```python
@check_modules_present("_redis_conn")
@check_index_exists()
def query(query: BaseQuery) -> List[Dict[str, Any]]
```

Execute a query on the index.

This method takes a BaseQuery object directly, runs the search, and
handles post-processing of the search.

**Arguments**:

- `query` _BaseQuery_ - The query to run.
  

**Returns**:

- `List[Result]` - A list of search results.
  
  ```python
  results = index.query(query)
  ```

### query\_batch

```python
@check_modules_present("_redis_conn")
@check_index_exists()
def query_batch(query: BaseQuery, batch_size: int = 30) -> Generator
```

Execute a query on the index with batching.

This method takes a BaseQuery object directly, handles optional paging
support, and post-processing of the search results.

**Arguments**:

- `query` _BaseQuery_ - The query to run.
- `batch_size` _int_ - The size of batches to return on each iteration.
  

**Returns**:

- `List[Result]` - A list of search results.
  

**Raises**:

- `TypeError` - If the batch size is not an integer
- `ValueError` - If the batch size is less than or equal to zero.
  
  ```python
  for batch in index.query_batch(query, batch_size=10):
  # process batched results
  pass
  ```

### listall

```python
@check_modules_present("_redis_conn")
def listall() -> List[str]
```

List all search indices in Redis database.

**Returns**:

- `List[str]` - The list of indices in the database.

### exists

```python
@check_modules_present("_redis_conn")
def exists() -> bool
```

Check if the index exists in Redis.

**Returns**:

- `bool` - True if the index exists, False otherwise.

### info

```python
@check_modules_present("_redis_conn")
@check_index_exists()
def info() -> Dict[str, Any]
```

Get information about the index.

**Returns**:

- `dict` - A dictionary containing the information about the index.

### acreate

```python
@check_async_modules_present("_redis_conn")
async def acreate(overwrite: bool = False) -> None
```

Asynchronously create an index in Redis from this SearchIndex object.

**Arguments**:

- `overwrite` _bool, optional_ - Whether to overwrite the index if it
  already exists. Defaults to False.
  

**Raises**:

- `RuntimeError` - If the index already exists and 'overwrite' is False.

### adelete

```python
@check_async_modules_present("_redis_conn")
@check_async_index_exists()
async def adelete(drop: bool = True)
```

Delete the search index.

**Arguments**:

- `drop` _bool, optional_ - Delete the documents in the index.
  Defaults to True.
  

**Raises**:

- `redis.exceptions.ResponseError` - If the index does not exist.

### aload

```python
@check_async_modules_present("_redis_conn")
async def aload(data: Iterable[Any],
                key_field: Optional[str] = None,
                keys: Optional[Iterable[str]] = None,
                ttl: Optional[int] = None,
                preprocess: Optional[Callable] = None,
                concurrency: Optional[int] = None) -> List[str]
```

Asynchronously load objects to Redis with concurrency control.
Returns the list of keys loaded to Redis.

**Arguments**:

- `data` _Iterable[Any]_ - An iterable of objects to store.
- `key_field` _Optional[str], optional_ - Field used as the key for each
  object. Defaults to None.
- `keys` _Optional[Iterable[str]], optional_ - Optional iterable of keys.
  Must match the length of objects if provided. Defaults to None.
- `ttl` _Optional[int], optional_ - Time-to-live in seconds for each key.
  Defaults to None.
- `preprocess` _Optional[Callable], optional_ - An async function to
  preprocess objects before storage. Defaults to None.
- `concurrency` _Optional[int], optional_ - The maximum number of
  concurrent write operations. Defaults to class's default
  concurrency level.
  

**Returns**:

- `List[str]` - List of keys loaded to Redis.
  

**Raises**:

- `ValueError` - If the length of provided keys does not match the
  length of objects.
  
  ```python
  keys = await index.aload([{"test": "foo"}, {"test": "bar"}])
  ```

### afetch

```python
async def afetch(id: str) -> Dict[str, Any]
```

Asynchronously etch an object from Redis by id. The id is typically
either a unique identifier, or derived from some domain-specific
metadata combination (like a document id or chunk id).

**Arguments**:

- `id` _str_ - The specified unique identifier for a particular
  document indexed in Redis.
  

**Returns**:

  Dict[str, Any]: The fetched object.

### asearch

```python
@check_async_modules_present("_redis_conn")
@check_async_index_exists()
async def asearch(*args, **kwargs) -> Union["Result", Any]
```

Perform a search on this index.

Wrapper around redis.search.Search that adds the index name
to the search query and passes along the rest of the arguments
to the redis-py ft.search() method.

**Returns**:

  Union["Result", Any]: Search results.

### aquery

```python
@check_async_modules_present("_redis_conn")
@check_async_index_exists()
async def aquery(query: BaseQuery) -> List[Dict[str, Any]]
```

Asynchronously execute a query on the index.

This method takes a BaseQuery object directly, runs the search, and
handles post-processing of the search.

**Arguments**:

- `query` _BaseQuery_ - The query to run.
  

**Returns**:

- `List[Result]` - A list of search results.
  
  ```python
  results = await aindex.query(query)
  ```

### aquery\_batch

```python
@check_async_modules_present("_redis_conn")
@check_async_index_exists()
async def aquery_batch(query: BaseQuery,
                       batch_size: int = 30) -> AsyncGenerator
```

Execute a query on the index with batching.

This method takes a BaseQuery object directly, handles optional paging
support, and post-processing of the search results.

**Arguments**:

- `query` _BaseQuery_ - The query to run.
- `batch_size` _int_ - The size of batches to return on each iteration.
  

**Returns**:

- `List[Result]` - A list of search results.
  

**Raises**:

- `TypeError` - If the batch size is not an integer
- `ValueError` - If the batch size is less than or equal to zero.
  
  ```python
  async for batch in index.aquery_batch(query, batch_size=10):
  # process batched results
  pass
  ```

### alistall

```python
@check_async_modules_present("_redis_conn")
async def alistall() -> List[str]
```

List all search indices in Redis database.

**Returns**:

- `List[str]` - The list of indices in the database.

### aexists

```python
@check_async_modules_present("_redis_conn")
async def aexists() -> bool
```

Check if the index exists in Redis.

**Returns**:

- `bool` - True if the index exists, False otherwise.

### ainfo

```python
@check_async_modules_present("_redis_conn")
@check_async_index_exists()
async def ainfo() -> Dict[str, Any]
```

Get information about the index.

**Returns**:

- `dict` - A dictionary containing the information about the index.

## process_results

```python
def process_results(results: "Result", query: BaseQuery,
                    storage_type: StorageType) -> List[Dict[str, Any]]
```

Convert a list of search Result objects into a list of document
dictionaries.

This function processes results from Redis, handling different storage
types and query types. For JSON storage with empty return fields, it
unpacks the JSON object while retaining the document ID. The 'payload'
field is also removed from all resulting documents for consistency.

**Arguments**:

- `results` _Result_ - The search results from Redis.
- `query` _BaseQuery_ - The query object used for the search.
- `storage_type` _StorageType_ - The storage type of the search
  index (json or hash).
  

**Returns**:

  List[Dict[str, Any]]: A list of processed document dictionaries.

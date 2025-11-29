---
linkTitle: Rerankers
title: Rerankers
url: '/develop/ai/redisvl/0.8.1/api/reranker/'
---


## CohereReranker

<a id="coherereranker-api"></a>

### `class CohereReranker(model='rerank-english-v3.0', rank_by=None, limit=5, return_score=True, api_config=None)`

Bases: `BaseReranker`

The CohereReranker class uses Cohere’s API to rerank documents based on an
input query.

This reranker is designed to interact with Cohere’s /rerank API,
requiring an API key for authentication. The key can be provided
directly in the api_config dictionary or through the COHERE_API_KEY
environment variable. User must obtain an API key from Cohere’s website
([https://dashboard.cohere.com/](https://dashboard.cohere.com/)). Additionally, the cohere python
client must be installed with pip install cohere.

```python
from redisvl.utils.rerank import CohereReranker

# set up the Cohere reranker with some configuration
reranker = CohereReranker(rank_by=["content"], limit=2)
# rerank raw search results based on user input/query
results = reranker.rank(
    query="your input query text here",
    docs=[
        {"content": "document 1"},
        {"content": "document 2"},
        {"content": "document 3"}
    ]
)
```

Initialize the CohereReranker with specified model, ranking criteria,
and API configuration.

* **Parameters:**
  * **model** (*str*) – The identifier for the Cohere model used for reranking.
    Defaults to ‘rerank-english-v3.0’.
  * **rank_by** (*Optional* *[* *List* *[* *str* *]* *]*) – Optional list of keys specifying the
    attributes in the documents that should be considered for
    ranking. None means ranking will rely on the model’s default
    behavior.
  * **limit** (*int*) – The maximum number of results to return after
    reranking. Must be a positive integer.
  * **return_score** (*bool*) – Whether to return scores alongside the
    reranked results.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the API key.
    Defaults to None.
* **Raises:**
  * **ImportError** – If the cohere library is not installed.
  * **ValueError** – If the API key is not provided.

#### `async arank(query, docs, **kwargs)`

Rerank documents based on the provided query using the Cohere rerank API.

This method processes the user’s query and the provided documents to
rerank them in a manner that is potentially more relevant to the
query’s context.

* **Parameters:**
  * **query** (*str*) – The user’s search query.
  * **docs** (*Union* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *List* *[* *str* *]* *]*) – The list of documents
    to be ranked, either as dictionaries or strings.
* **Returns:**
  The reranked list of documents and optionally associated scores.
* **Return type:**
  Union[Tuple[Union[List[Dict[str, Any]], List[str]], float], List[Dict[str, Any]]]

#### `model_post_init(context,)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `rank(query, docs, **kwargs)`

Rerank documents based on the provided query using the Cohere rerank API.

This method processes the user’s query and the provided documents to
rerank them in a manner that is potentially more relevant to the
query’s context.

* **Parameters:**
  * **query** (*str*) – The user’s search query.
  * **docs** (*Union* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *List* *[* *str* *]* *]*) – The list of documents
    to be ranked, either as dictionaries or strings.
* **Returns:**
  The reranked list of documents and optionally associated scores.
* **Return type:**
  Union[Tuple[Union[List[Dict[str, Any]], List[str]], float], List[Dict[str, Any]]]

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## HFCrossEncoderReranker

<a id="hfcrossencoderreranker-api"></a>

### `class HFCrossEncoderReranker(model='cross-encoder/ms-marco-MiniLM-L-6-v2', limit=3, return_score=True, , rank_by=None)`

Bases: `BaseReranker`

The HFCrossEncoderReranker class uses a cross-encoder models from Hugging Face
to rerank documents based on an input query.

This reranker loads a cross-encoder model using the CrossEncoder class
from the sentence_transformers library. It requires the
sentence_transformers library to be installed.

```python
from redisvl.utils.rerank import HFCrossEncoderReranker

# set up the HFCrossEncoderReranker with a specific model
reranker = HFCrossEncoderReranker(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2", limit=3)
# rerank raw search results based on user input/query
results = reranker.rank(
    query="your input query text here",
    docs=[
        {"content": "document 1"},
        {"content": "document 2"},
        {"content": "document 3"}
    ]
)
```

Initialize the HFCrossEncoderReranker with a specified model and ranking criteria.

* **Parameters:**
  * **model** (*str*) – The name or path of the cross-encoder model to use for reranking.
    Defaults to ‘cross-encoder/ms-marco-MiniLM-L-6-v2’.
  * **limit** (*int*) – The maximum number of results to return after reranking. Must be a positive integer.
  * **return_score** (*bool*) – Whether to return scores alongside the reranked results.
  * **rank_by** (*List* *[* *str* *]*  *|* *None*)

#### `async arank(query, docs, **kwargs)`

Asynchronously rerank documents based on the provided query using the loaded cross-encoder model.

This method processes the user’s query and the provided documents to rerank them
in a manner that is potentially more relevant to the query’s context.

* **Parameters:**
  * **query** (*str*) – The user’s search query.
  * **docs** (*Union* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *List* *[* *str* *]* *]*) – The list of documents to be ranked,
    either as dictionaries or strings.
* **Returns:**
  The reranked list of documents and optionally associated scores.
* **Return type:**
  Union[Tuple[List[Dict[str, Any]], List[float]], List[Dict[str, Any]]]

#### `model_post_init(context,)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `rank(query, docs, **kwargs)`

Rerank documents based on the provided query using the loaded cross-encoder model.

This method processes the user’s query and the provided documents to rerank them
in a manner that is potentially more relevant to the query’s context.

* **Parameters:**
  * **query** (*str*) – The user’s search query.
  * **docs** (*Union* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *List* *[* *str* *]* *]*) – The list of documents to be ranked,
    either as dictionaries or strings.
* **Returns:**
  The reranked list of documents and optionally associated scores.
* **Return type:**
  Union[Tuple[List[Dict[str, Any]], List[float]], List[Dict[str, Any]]]

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## VoyageAIReranker

<a id="voyageaireranker-api"></a>

### `class VoyageAIReranker(model, rank_by=None, limit=5, return_score=True, api_config=None)`

Bases: `BaseReranker`

The VoyageAIReranker class uses VoyageAI’s API to rerank documents based on an
input query.

This reranker is designed to interact with VoyageAI’s /rerank API,
requiring an API key for authentication. The key can be provided
directly in the api_config dictionary or through the VOYAGE_API_KEY
environment variable. User must obtain an API key from VoyageAI’s website
([https://dash.voyageai.com/](https://dash.voyageai.com/)). Additionally, the voyageai python
client must be installed with pip install voyageai.

```python
from redisvl.utils.rerank import VoyageAIReranker

# set up the VoyageAI reranker with some configuration
reranker = VoyageAIReranker(rank_by=["content"], limit=2)
# rerank raw search results based on user input/query
results = reranker.rank(
    query="your input query text here",
    docs=[
        {"content": "document 1"},
        {"content": "document 2"},
        {"content": "document 3"}
    ]
)
```

Initialize the VoyageAIReranker with specified model, ranking criteria,
and API configuration.

* **Parameters:**
  * **model** (*str*) – The identifier for the VoyageAI model used for reranking.
  * **rank_by** (*Optional* *[* *List* *[* *str* *]* *]*) – Optional list of keys specifying the
    attributes in the documents that should be considered for
    ranking. None means ranking will rely on the model’s default
    behavior.
  * **limit** (*int*) – The maximum number of results to return after
    reranking. Must be a positive integer.
  * **return_score** (*bool*) – Whether to return scores alongside the
    reranked results.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the API key.
    Defaults to None.
* **Raises:**
  * **ImportError** – If the voyageai library is not installed.
  * **ValueError** – If the API key is not provided.

#### `async arank(query, docs, **kwargs)`

Rerank documents based on the provided query using the VoyageAI rerank API.

This method processes the user’s query and the provided documents to
rerank them in a manner that is potentially more relevant to the
query’s context.

* **Parameters:**
  * **query** (*str*) – The user’s search query.
  * **docs** (*Union* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *List* *[* *str* *]* *]*) – The list of documents
    to be ranked, either as dictionaries or strings.
* **Returns:**
  The reranked list of documents and optionally associated scores.
* **Return type:**
  Union[Tuple[Union[List[Dict[str, Any]], List[str]], float], List[Dict[str, Any]]]

#### `model_post_init(context,)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `rank(query, docs, **kwargs)`

Rerank documents based on the provided query using the VoyageAI rerank API.

This method processes the user’s query and the provided documents to
rerank them in a manner that is potentially more relevant to the
query’s context.

* **Parameters:**
  * **query** (*str*) – The user’s search query.
  * **docs** (*Union* *[* *List* *[* *Dict* *[* *str* *,* *Any* *]* *]* *,* *List* *[* *str* *]* *]*) – The list of documents
    to be ranked, either as dictionaries or strings.
* **Returns:**
  The reranked list of documents and optionally associated scores.
* **Return type:**
  Union[Tuple[Union[List[Dict[str, Any]], List[str]], float], List[Dict[str, Any]]]

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

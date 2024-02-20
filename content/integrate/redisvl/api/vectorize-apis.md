---
linkTitle: Vectorizers
title: Vectorizers
type: integration
description: The vectorizer APIs
weight: 5
---

## VertexAITextVectorizer Objects

```python
class VertexAITextVectorizer(BaseVectorizer)
```

The VertexAITextVectorizer uses Google's VertexAI Palm 2 embedding model
API to create text embeddings.

This vectorizer is tailored for use in
environments where integration with Google Cloud Platform (GCP) services is
a key requirement.

Utilizing this vectorizer requires an active GCP project and location
(region), along with appropriate application credentials. These can be
provided through the `api_config` dictionary or by setting the corresponding
environment variables. Additionally, the vertexai python client must be
installed with `pip install google-cloud-aiplatform>=1.26`.

```python

    # Synchronous embedding of a single text
    vectorizer = VertexAITextVectorizer(
        model="textembedding-gecko",
        api_config={
            "project_id": "your_gcp_project_id", # OR set GCP_PROJECT_ID
            "location": "your_gcp_location",     # OR set GCP_LOCATION
            "google_application_credentials": "path_to_your_creds"
            # OR set GOOGLE_APPLICATION_CREDENTIALS
        })
    embedding = vectorizer.embed("Hello, world!")

    # Asynchronous batch embedding of multiple texts
    embeddings = await vectorizer.embed_many(
        ["Hello, world!", "Goodbye, world!"],
        batch_size=2
    )
```


### \_\_init\_\_

```python
def __init__(model: str = "textembedding-gecko",
             api_config: Optional[Dict] = None)
```

Initialize the VertexAI vectorizer.

**Arguments**:

- `model` _str_ - Model to use for embedding. Defaults to
  'textembedding-gecko'.
- `api_config` _Optional[Dict], optional_ - Dictionary containing the
  API key. Defaults to None.
  

**Raises**:

- `ImportError` - If the google-cloud-aiplatform library is not installed.
- `ValueError` - If the API key is not provided.


### embed\_many

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
def embed_many(texts: List[str],
               preprocess: Optional[Callable] = None,
               batch_size: int = 10,
               as_buffer: bool = False,
               **kwargs) -> List[List[float]]
```

Embed many chunks of texts using the VertexAI API.

**Arguments**:

- `texts` _List[str]_ - List of text chunks to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `batch_size` _int, optional_ - Batch size of texts to use when creating
  embeddings. Defaults to 10.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[List[float]]` - List of embeddings.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


### embed

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
def embed(text: str,
          preprocess: Optional[Callable] = None,
          as_buffer: bool = False,
          **kwargs) -> List[float]
```

Embed a chunk of text using the VertexAI API.

**Arguments**:

- `text` _str_ - Chunk of text to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[float]` - Embedding.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


# vectorize.text


# vectorize.text.openai


## OpenAITextVectorizer Objects

```python
class OpenAITextVectorizer(BaseVectorizer)
```

The OpenAITextVectorizer class utilizes OpenAI's API to generate
embeddings for text data.

This vectorizer is designed to interact with OpenAI's embeddings API,
requiring an API key for authentication. The key can be provided directly
in the `api_config` dictionary or through the `OPENAI_API_KEY` environment
variable. Users must obtain an API key from OpenAI's website
(https://api.openai.com/). Additionally, the `openai` python client must be
installed with `pip install openai==0.28.1`.

The vectorizer supports both synchronous and asynchronous operations,
allowing for batch processing of texts and flexibility in handling
preprocessing tasks.

```python

    # Synchronous embedding of a single text
    vectorizer = OpenAITextVectorizer(
        model="text-embedding-ada-002",
        api_config={"api_key": "your_api_key"} # OR set OPENAI_API_KEY in your env
    )
    embedding = vectorizer.embed("Hello, world!")

    # Asynchronous batch embedding of multiple texts
    embeddings = await vectorizer.aembed_many(
        ["Hello, world!", "How are you?"],
        batch_size=2
    )
```


### \_\_init\_\_

```python
def __init__(model: str = "text-embedding-ada-002",
             api_config: Optional[Dict] = None)
```

Initialize the OpenAI vectorizer.

**Arguments**:

- `model` _str_ - Model to use for embedding. Defaults to
  'text-embedding-ada-002'.
- `api_config` _Optional[Dict], optional_ - Dictionary containing the
  API key. Defaults to None.
  

**Raises**:

- `ImportError` - If the OpenAI library is not installed.
- `ValueError` - If the OpenAI API key is not provided.


### embed\_many

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
def embed_many(texts: List[str],
               preprocess: Optional[Callable] = None,
               batch_size: int = 10,
               as_buffer: bool = False,
               **kwargs) -> List[List[float]]
```

Embed many chunks of texts using the OpenAI API.

**Arguments**:

- `texts` _List[str]_ - List of text chunks to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing
  callable to perform before vectorization. Defaults to None.
- `batch_size` _int, optional_ - Batch size of texts to use when creating
  embeddings. Defaults to 10.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[List[float]]` - List of embeddings.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


### embed

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
def embed(text: str,
          preprocess: Optional[Callable] = None,
          as_buffer: bool = False,
          **kwargs) -> List[float]
```

Embed a chunk of text using the OpenAI API.

**Arguments**:

- `text` _str_ - Chunk of text to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[float]` - Embedding.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


### aembed\_many

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
async def aembed_many(texts: List[str],
                      preprocess: Optional[Callable] = None,
                      batch_size: int = 1000,
                      as_buffer: bool = False,
                      **kwargs) -> List[List[float]]
```

Asynchronously embed many chunks of texts using the OpenAI API.

**Arguments**:

- `texts` _List[str]_ - List of text chunks to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `batch_size` _int, optional_ - Batch size of texts to use when creating
  embeddings. Defaults to 10.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[List[float]]` - List of embeddings.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


### aembed

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
async def aembed(text: str,
                 preprocess: Optional[Callable] = None,
                 as_buffer: bool = False,
                 **kwargs) -> List[float]
```

Asynchronously embed a chunk of text using the OpenAI API.

**Arguments**:

- `text` _str_ - Chunk of text to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[float]` - Embedding.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


# vectorize.text.huggingface


## HFTextVectorizer Objects

```python
class HFTextVectorizer(BaseVectorizer)
```

The HFTextVectorizer class is designed to leverage the power of Hugging
Face's Sentence Transformers for generating text embeddings. This vectorizer
is particularly useful in scenarios where advanced natural language
processing and understanding are required, and ideal for running on your own
hardware (for free).

Utilizing this vectorizer involves specifying a pre-trained model from
Hugging Face's vast collection of Sentence Transformers. These models are
trained on a variety of datasets and tasks, ensuring versatility and
robust performance across different text embedding needs. Additionally,
make sure the `sentence-transformers` library is installed with
`pip install sentence-transformers==2.2.2`.

```python

    # Embedding a single text
    vectorizer = HFTextVectorizer(model="sentence-transformers/all-mpnet-base-v2")
    embedding = vectorizer.embed("Hello, world!")

    # Embedding a batch of texts
    embeddings = vectorizer.embed_many(["Hello, world!", "How are you?"], batch_size=2)
```


### \_\_init\_\_

```python
def __init__(model: str = "sentence-transformers/all-mpnet-base-v2", **kwargs)
```

Initialize the Hugging Face text vectorizer.

**Arguments**:

- `model` _str_ - The pre-trained model from Hugging Face's Sentence
  Transformers to be used for embedding. Defaults to
  'sentence-transformers/all-mpnet-base-v2'.
  

**Raises**:

- `ImportError` - If the sentence-transformers library is not installed.
- `ValueError` - If there is an error setting the embedding model dimensions.


### embed

```python
def embed(text: str,
          preprocess: Optional[Callable] = None,
          as_buffer: bool = False,
          **kwargs) -> List[float]
```

Embed a chunk of text using the Hugging Face sentence transformer.

**Arguments**:

- `text` _str_ - Chunk of text to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing
  callable to perform before vectorization. Defaults to None.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[float]` - Embedding.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the text.


### embed\_many

```python
def embed_many(texts: List[str],
               preprocess: Optional[Callable] = None,
               batch_size: int = 1000,
               as_buffer: bool = False,
               **kwargs) -> List[List[float]]
```

Asynchronously embed many chunks of texts using the Hugging Face
sentence transformer.

**Arguments**:

- `texts` _List[str]_ - List of text chunks to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing
  callable to perform before vectorization. Defaults to None.
- `batch_size` _int, optional_ - Batch size of texts to use when creating
  embeddings. Defaults to 10.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
  

**Returns**:

- `List[List[float]]` - List of embeddings.
  

**Raises**:

- `TypeError` - If the wrong input type is passed in for the test.


# vectorize.text.cohere


## CohereTextVectorizer Objects

```python
class CohereTextVectorizer(BaseVectorizer)
```

The CohereTextVectorizer class utilizes Cohere's API to generate
embeddings for text data.

This vectorizer is designed to interact with Cohere's /embed API,
requiring an API key for authentication. The key can be provided
directly in the `api_config` dictionary or through the `COHERE_API_KEY`
environment variable. User must obtain an API key from Cohere's website
(https://dashboard.cohere.com/). Additionally, the `cohere` python
client must be installed with `pip install cohere`.

The vectorizer supports only synchronous operations, allows for batch
processing of texts and flexibility in handling preprocessing tasks.

```python

    from redisvl.vectorize.text import CohereTextVectorizer

    vectorizer = CohereTextVectorizer(
        model="embed-english-v3.0",
        api_config={"api_key": "your-cohere-api-key"} # OR set COHERE_API_KEY in your env
    )
    query_embedding = vectorizer.embed(
        text="your input query text here",
        input_type="search_query"
    )
    doc_embeddings = cohere.embed_many(
        texts=["your document text", "more document text"],
        input_type="search_documents"
    )
```


### \_\_init\_\_

```python
def __init__(model: str = "embed-english-v3.0",
             api_config: Optional[Dict] = None)
```

Initialize the Cohere vectorizer.

Visit https://cohere.ai/embed to learn about embeddings.

**Arguments**:

- `model` _str_ - Model to use for embedding. Defaults to 'embed-english-v3.0'.
- `api_config` _Optional[Dict], optional_ - Dictionary containing the API key.
  Defaults to None.
  

**Raises**:

- `ImportError` - If the cohere library is not installed.
- `ValueError` - If the API key is not provided.


### embed

```python
def embed(text: str,
          preprocess: Optional[Callable] = None,
          as_buffer: bool = False,
          **kwargs) -> List[float]
```

Embed a chunk of text using the Cohere Embeddings API.

Must provide the embedding `input_type` as a `kwarg` to this method
that specifies the type of input you're giving to the model.

Supported input types:
- ``search_document``: Used for embeddings stored in a vector database for search use-cases.
- ``search_query``: Used for embeddings of search queries run against a vector DB to find relevant documents.
- ``classification``: Used for embeddings passed through a text classifier
- ``clustering``: Used for the embeddings run through a clustering algorithm.

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type= "search_document" and when you are
querying the database, you should set the input_type = "search query".
If you want to use the embeddings for a classification or clustering
task downstream, you should set input_type= "classification" or
"clustering".

**Arguments**:

- `text` _str_ - Chunk of text to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
- `input_type` _str_ - Specifies the type of input passed to the model.
  Required for embedding models v3 and higher.
  

**Returns**:

- `List[float]` - Embedding.
  

**Raises**:

- `TypeError` - In an invalid input_type is provided.


### embed\_many

```python
@retry(
    wait=wait_random_exponential(min=1, max=60),
    stop=stop_after_attempt(6),
    retry=retry_if_not_exception_type(TypeError),
)
def embed_many(texts: List[str],
               preprocess: Optional[Callable] = None,
               batch_size: int = 10,
               as_buffer: bool = False,
               **kwargs) -> List[List[float]]
```

Embed many chunks of text using the Cohere Embeddings API.

Must provide the embedding `input_type` as a `kwarg` to this method
that specifies the type of input you're giving to the model.

Supported input types:
- ``search_document``: Used for embeddings stored in a vector database for search use-cases.
- ``search_query``: Used for embeddings of search queries run against a vector DB to find relevant documents.
- ``classification``: Used for embeddings passed through a text classifier
- ``clustering``: Used for the embeddings run through a clustering algorithm.


When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type= "search_document" and when you are
querying the database, you should set the input_type = "search query".
If you want to use the embeddings for a classification or clustering
task downstream, you should set input_type= "classification" or
"clustering".

**Arguments**:

- `texts` _List[str]_ - List of text chunks to embed.
- `preprocess` _Optional[Callable], optional_ - Optional preprocessing callable to
  perform before vectorization. Defaults to None.
- `batch_size` _int, optional_ - Batch size of texts to use when creating
  embeddings. Defaults to 10.
- `as_buffer` _bool, optional_ - Whether to convert the raw embedding
  to a byte string. Defaults to False.
- `input_type` _str_ - Specifies the type of input passed to the model.
  Required for embedding models v3 and higher.
  

**Returns**:

- `List[List[float]]` - List of embeddings.
  

**Raises**:

- `TypeError` - If an invalid input_type is provided.


# vectorize.base


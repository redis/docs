---
linkTitle: Vectorizers
title: Vectorizers
type: integration
---


## HFTextVectorizer

<a id="hftextvectorizer-api"></a>

### `class HFTextVectorizer(model='sentence-transformers/all-mpnet-base-v2', dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The HFTextVectorizer class is designed to leverage the power of Hugging
Face’s Sentence Transformers for generating text embeddings. This vectorizer
is particularly useful in scenarios where advanced natural language
processing and understanding are required, and ideal for running on your own
hardware (for free).

Utilizing this vectorizer involves specifying a pre-trained model from
Hugging Face’s vast collection of Sentence Transformers. These models are
trained on a variety of datasets and tasks, ensuring versatility and
robust performance across different text embedding needs. Additionally,
make sure the sentence-transformers library is installed with
pip install sentence-transformers==2.2.2.

```python
# Embedding a single text
vectorizer = HFTextVectorizer(model="sentence-transformers/all-mpnet-base-v2")
embedding = vectorizer.embed("Hello, world!")

# Embedding a batch of texts
embeddings = vectorizer.embed_many(["Hello, world!", "How are you?"], batch_size=2)
```

Initialize the Hugging Face text vectorizer.

* **Parameters:**
  * **model** (*str*) – The pre-trained model from Hugging Face’s Sentence
    Transformers to be used for embedding. Defaults to
    ‘sentence-transformers/all-mpnet-base-v2’.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ImportError** – If the sentence-transformers library is not installed.
  * **ValueError** – If there is an error setting the embedding model dimensions.
  * **ValueError** – If an invalid dtype is provided.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the Hugging Face sentence transformer.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing
    callable to perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the text.

#### `embed_many(texts, preprocess=None, batch_size=1000, as_buffer=False, **kwargs)`

Asynchronously embed many chunks of texts using the Hugging Face
sentence transformer.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing
    callable to perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## OpenAITextVectorizer

<a id="openaitextvectorizer-api"></a>

### `class OpenAITextVectorizer(model='text-embedding-ada-002', api_config=None, dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The OpenAITextVectorizer class utilizes OpenAI’s API to generate
embeddings for text data.

This vectorizer is designed to interact with OpenAI’s embeddings API,
requiring an API key for authentication. The key can be provided directly
in the api_config dictionary or through the OPENAI_API_KEY environment
variable. Users must obtain an API key from OpenAI’s website
([https://api.openai.com/](https://api.openai.com/)). Additionally, the openai python client must be
installed with pip install openai>=1.13.0.

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

Initialize the OpenAI vectorizer.

* **Parameters:**
  * **model** (*str*) – Model to use for embedding. Defaults to
    ‘text-embedding-ada-002’.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the
    API key and any additional OpenAI API options. Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ImportError** – If the openai library is not installed.
  * **ValueError** – If the OpenAI API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `aembed(text, preprocess=None, as_buffer=False, **kwargs)`

Asynchronously embed a chunk of text using the OpenAI API.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the text.

#### `aembed_many(texts, preprocess=None, batch_size=1000, as_buffer=False, **kwargs)`

Asynchronously embed many chunks of texts using the OpenAI API.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the text.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the OpenAI API.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the text.

#### `embed_many(texts, preprocess=None, batch_size=10, as_buffer=False, **kwargs)`

Embed many chunks of texts using the OpenAI API.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing
    callable to perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the text.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## AzureOpenAITextVectorizer

<a id="azureopenaitextvectorizer-api"></a>

### `class AzureOpenAITextVectorizer(model='text-embedding-ada-002', api_config=None, dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The AzureOpenAITextVectorizer class utilizes AzureOpenAI’s API to generate
embeddings for text data.

This vectorizer is designed to interact with AzureOpenAI’s embeddings API,
requiring an API key, an AzureOpenAI deployment endpoint and API version.
These values can be provided directly in the api_config dictionary with
the parameters ‘azure_endpoint’, ‘api_version’ and ‘api_key’ or through the
environment variables ‘AZURE_OPENAI_ENDPOINT’, ‘OPENAI_API_VERSION’, and ‘AZURE_OPENAI_API_KEY’.
Users must obtain these values from the ‘Keys and Endpoints’ section in their Azure OpenAI service.
Additionally, the openai python client must be installed with pip install openai>=1.13.0.

The vectorizer supports both synchronous and asynchronous operations,
allowing for batch processing of texts and flexibility in handling
preprocessing tasks.

```python
# Synchronous embedding of a single text
vectorizer = AzureOpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={
        "api_key": "your_api_key", # OR set AZURE_OPENAI_API_KEY in your env
        "api_version": "your_api_version", # OR set OPENAI_API_VERSION in your env
        "azure_endpoint": "your_azure_endpoint", # OR set AZURE_OPENAI_ENDPOINT in your env
    }
)
embedding = vectorizer.embed("Hello, world!")

# Asynchronous batch embedding of multiple texts
embeddings = await vectorizer.aembed_many(
    ["Hello, world!", "How are you?"],
    batch_size=2
)
```

Initialize the AzureOpenAI vectorizer.

* **Parameters:**
  * **model** (*str*) – Deployment to use for embedding. Must be the
    ‘Deployment name’ not the ‘Model name’. Defaults to
    ‘text-embedding-ada-002’.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the
    API key, API version, Azure endpoint, and any other API options.
    Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ImportError** – If the openai library is not installed.
  * **ValueError** – If the AzureOpenAI API key, version, or endpoint are not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `aembed(text, preprocess=None, as_buffer=False, **kwargs)`

Asynchronously embed a chunk of text using the OpenAI API.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `aembed_many(texts, preprocess=None, batch_size=1000, as_buffer=False, **kwargs)`

Asynchronously embed many chunks of texts using the AzureOpenAI API.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the AzureOpenAI API.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `embed_many(texts, preprocess=None, batch_size=10, as_buffer=False, **kwargs)`

Embed many chunks of texts using the AzureOpenAI API.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing
    callable to perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## VertexAITextVectorizer

<a id="vertexaitextvectorizer-api"></a>

### `class VertexAITextVectorizer(model='textembedding-gecko', api_config=None, dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The VertexAITextVectorizer uses Google’s VertexAI Palm 2 embedding model
API to create text embeddings.

This vectorizer is tailored for use in
environments where integration with Google Cloud Platform (GCP) services is
a key requirement.

Utilizing this vectorizer requires an active GCP project and location
(region), along with appropriate application credentials. These can be
provided through the api_config dictionary or set the GOOGLE_APPLICATION_CREDENTIALS
env var. Additionally, the vertexai python client must be
installed with pip install google-cloud-aiplatform>=1.26.

```python
# Synchronous embedding of a single text
vectorizer = VertexAITextVectorizer(
    model="textembedding-gecko",
    api_config={
        "project_id": "your_gcp_project_id", # OR set GCP_PROJECT_ID
        "location": "your_gcp_location",     # OR set GCP_LOCATION
    })
embedding = vectorizer.embed("Hello, world!")

# Asynchronous batch embedding of multiple texts
embeddings = await vectorizer.embed_many(
    ["Hello, world!", "Goodbye, world!"],
    batch_size=2
)
```

Initialize the VertexAI vectorizer.

* **Parameters:**
  * **model** (*str*) – Model to use for embedding. Defaults to
    ‘textembedding-gecko’.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the
    API config details. Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ImportError** – If the google-cloud-aiplatform library is not installed.
  * **ValueError** – If the API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the VertexAI API.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `embed_many(texts, preprocess=None, batch_size=10, as_buffer=False, **kwargs)`

Embed many chunks of texts using the VertexAI API.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If the wrong input type is passed in for the test.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## CohereTextVectorizer

<a id="coheretextvectorizer-api"></a>

### `class CohereTextVectorizer(model='embed-english-v3.0', api_config=None, dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The CohereTextVectorizer class utilizes Cohere’s API to generate
embeddings for text data.

This vectorizer is designed to interact with Cohere’s /embed API,
requiring an API key for authentication. The key can be provided
directly in the api_config dictionary or through the COHERE_API_KEY
environment variable. User must obtain an API key from Cohere’s website
([https://dashboard.cohere.com/](https://dashboard.cohere.com/)). Additionally, the cohere python
client must be installed with pip install cohere.

The vectorizer supports only synchronous operations, allows for batch
processing of texts and flexibility in handling preprocessing tasks.

```python
from redisvl.utils.vectorize import CohereTextVectorizer

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
    input_type="search_document"
)
```

Initialize the Cohere vectorizer.

Visit [https://cohere.ai/embed](https://cohere.ai/embed) to learn about embeddings.

* **Parameters:**
  * **model** (*str*) – Model to use for embedding. Defaults to ‘embed-english-v3.0’.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the API key.
    Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ImportError** – If the cohere library is not installed.
  * **ValueError** – If the API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the Cohere Embeddings API.

Must provide the embedding input_type as a kwarg to this method
that specifies the type of input you’re giving to the model.

Supported input types:
: - `search_document`: Used for embeddings stored in a vector database for search use-cases.
  - `search_query`: Used for embeddings of search queries run against a vector DB to find relevant documents.
  - `classification`: Used for embeddings passed through a text classifier
  - `clustering`: Used for the embeddings run through a clustering algorithm.

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type= “search_document” and when you are
querying the database, you should set the input_type = “search query”.
If you want to use the embeddings for a classification or clustering
task downstream, you should set input_type= “classification” or
“clustering”.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
  * **input_type** (*str*) – Specifies the type of input passed to the model.
    Required for embedding models v3 and higher.
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – In an invalid input_type is provided.

#### `embed_many(texts, preprocess=None, batch_size=10, as_buffer=False, **kwargs)`

Embed many chunks of text using the Cohere Embeddings API.

Must provide the embedding input_type as a kwarg to this method
that specifies the type of input you’re giving to the model.

Supported input types:
: - `search_document`: Used for embeddings stored in a vector database for search use-cases.
  - `search_query`: Used for embeddings of search queries run against a vector DB to find relevant documents.
  - `classification`: Used for embeddings passed through a text classifier
  - `clustering`: Used for the embeddings run through a clustering algorithm.

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type= “search_document” and when you are
querying the database, you should set the input_type = “search query”.
If you want to use the embeddings for a classification or clustering
task downstream, you should set input_type= “classification” or
“clustering”.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. Defaults to 10.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
  * **input_type** (*str*) – Specifies the type of input passed to the model.
    Required for embedding models v3 and higher.
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – In an invalid input_type is provided.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## BedrockTextVectorizer

<a id="bedrocktextvectorizer-api"></a>

### `class BedrockTextVectorizer(model='amazon.titan-embed-text-v2:0', api_config=None, dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The AmazonBedrockTextVectorizer class utilizes Amazon Bedrock’s API to generate
embeddings for text data.

This vectorizer is designed to interact with Amazon Bedrock API,
requiring AWS credentials for authentication. The credentials can be provided
directly in the api_config dictionary or through environment variables:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (defaults to us-east-1)

The vectorizer supports synchronous operations with batch processing and
preprocessing capabilities.

```python
# Initialize with explicit credentials
vectorizer = AmazonBedrockTextVectorizer(
    model="amazon.titan-embed-text-v2:0",
    api_config={
        "aws_access_key_id": "your_access_key",
        "aws_secret_access_key": "your_secret_key",
        "aws_region": "us-east-1"
    }
)

# Initialize using environment variables
vectorizer = AmazonBedrockTextVectorizer()

# Generate embeddings
embedding = vectorizer.embed("Hello, world!")
embeddings = vectorizer.embed_many(["Hello", "World"], batch_size=2)
```

Initialize the AWS Bedrock Vectorizer.

* **Parameters:**
  * **model** (*str*) – The Bedrock model ID to use. Defaults to amazon.titan-embed-text-v2:0
  * **api_config** (*Optional* *[* *Dict* *[* *str* *,* *str* *]* *]*) – AWS credentials and config.
    Can include: aws_access_key_id, aws_secret_access_key, aws_region
    If not provided, will use environment variables.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ValueError** – If credentials are not provided in config or environment.
  * **ImportError** – If boto3 is not installed.
  * **ValueError** – If an invalid dtype is provided.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using Amazon Bedrock.

* **Parameters:**
  * **text** (*str*) – Text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]*) – Optional preprocessing function.
  * **as_buffer** (*bool*) – Whether to return as byte buffer.
* **Returns:**
  The embedding vector.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If text is not a string.

#### `embed_many(texts, preprocess=None, batch_size=10, as_buffer=False, **kwargs)`

Embed multiple texts using Amazon Bedrock.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of texts to embed.
  * **preprocess** (*Optional* *[* *Callable* *]*) – Optional preprocessing function.
  * **batch_size** (*int*) – Size of batches for processing.
  * **as_buffer** (*bool*) – Whether to return as byte buffers.
* **Returns:**
  List of embedding vectors.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If texts is not a list of strings.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## CustomTextVectorizer

<a id="customtextvectorizer-api"></a>

### `class CustomTextVectorizer(embed, embed_many=None, aembed=None, aembed_many=None, dtype='float32')`

Bases: `BaseVectorizer`

The CustomTextVectorizer class wraps user-defined embedding methods to create
embeddings for text data.

This vectorizer is designed to accept a provided callable text vectorizer and
provides a class definition to allow for compatibility with RedisVL.
The vectorizer may support both synchronous and asynchronous operations which
allows for batch processing of texts, but at a minimum only syncronous embedding
is required to satisfy the ‘embed()’ method.

```python
# Synchronous embedding of a single text
vectorizer = CustomTextVectorizer(
    embed = my_vectorizer.generate_embedding
)
embedding = vectorizer.embed("Hello, world!")

# Asynchronous batch embedding of multiple texts
embeddings = await vectorizer.aembed_many(
    ["Hello, world!", "How are you?"],
    batch_size=2
)
```

Initialize the Custom vectorizer.

* **Parameters:**
  * **embed** (*Callable*) – a Callable function that accepts a string object and returns a list of floats.
  * **embed_many** (*Optional* *[* *Callable*) – a Callable function that accepts a list of string objects and returns a list containing lists of floats. Defaults to None.
  * **aembed** (*Optional* *[* *Callable* *]*) – an asyncronous Callable function that accepts a string object and returns a lists of floats. Defaults to None.
  * **aembed_many** (*Optional* *[* *Callable* *]*) – an asyncronous Callable function that accepts a list of string objects and returns a list containing lists of floats. Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
* **Raises:**
  **ValueError** – if embedding validation fails.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Generate an embedding for a single piece of text using your sync embed function.

* **Parameters:**
  * **text** (*str*) – The text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]*) – An optional callable to preprocess the text.
  * **as_buffer** (*bool*) – If True, return the embedding as a byte buffer.
* **Returns:**
  The embedding of the input text.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If the input is not a string.

#### `embed_many(texts, preprocess=None, batch_size=10, as_buffer=False, **kwargs)`

Generate embeddings for multiple pieces of text in batches using your sync embed_many function.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – A list of texts to embed.
  * **preprocess** (*Optional* *[* *Callable* *]*) – Optional preprocessing for each text.
  * **batch_size** (*int*) – Number of texts per batch.
  * **as_buffer** (*bool*) – If True, convert each embedding to a byte buffer.
* **Returns:**
  A list of embeddings, where each embedding is a list of floats.
* **Return type:**
  List[List[float]]
* **Raises:**
  * **TypeError** – If the input is not a list of strings.
  * **NotImplementedError** – If no embed_many function was provided.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

## VoyageAITextVectorizer

<a id="voyageaitextvectorizer-api"></a>

### `class VoyageAITextVectorizer(model='voyage-large-2', api_config=None, dtype='float32', *, dims=None)`

Bases: `BaseVectorizer`

The VoyageAITextVectorizer class utilizes VoyageAI’s API to generate
embeddings for text data.

This vectorizer is designed to interact with VoyageAI’s /embed API,
requiring an API key for authentication. The key can be provided
directly in the api_config dictionary or through the VOYAGE_API_KEY
environment variable. User must obtain an API key from VoyageAI’s website
([https://dash.voyageai.com/](https://dash.voyageai.com/)). Additionally, the voyageai python
client must be installed with pip install voyageai.

The vectorizer supports both synchronous and asynchronous operations, allows for batch
processing of texts and flexibility in handling preprocessing tasks.

```python
from redisvl.utils.vectorize import VoyageAITextVectorizer

vectorizer = VoyageAITextVectorizer(
    model="voyage-large-2",
    api_config={"api_key": "your-voyageai-api-key"} # OR set VOYAGE_API_KEY in your env
)
query_embedding = vectorizer.embed(
    text="your input query text here",
    input_type="query"
)
doc_embeddings = vectorizer.embed_many(
    texts=["your document text", "more document text"],
    input_type="document"
)
```

Initialize the VoyageAI vectorizer.

Visit [https://docs.voyageai.com/docs/embeddings](https://docs.voyageai.com/docs/embeddings) to learn about embeddings and check the available models.

* **Parameters:**
  * **model** (*str*) – Model to use for embedding. Defaults to “voyage-large-2”.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the API key.
    Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **dims** (*int* *|* *None*)
* **Raises:**
  * **ImportError** – If the voyageai library is not installed.
  * **ValueError** – If the API key is not provided.

#### `aembed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the VoyageAI Embeddings API.

Can provide the embedding input_type as a kwarg to this method
that specifies the type of input you’re giving to the model. For retrieval/search use cases,
we recommend specifying this argument when encoding queries or documents to enhance retrieval quality.
Embeddings generated with and without the input_type argument are compatible.

Supported input types are `document` and `query`

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type=”document” and when you are
querying the database, you should set the input_type=”query”.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
  * **input_type** (*str*) – Specifies the type of input passed to the model.
  * **truncation** (*bool*) – Whether to truncate the input texts to fit within the context length.
    Check [https://docs.voyageai.com/docs/embeddings](https://docs.voyageai.com/docs/embeddings)
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – In an invalid input_type is provided.

#### `aembed_many(texts, preprocess=None, batch_size=None, as_buffer=False, **kwargs)`

Embed many chunks of text using the VoyageAI Embeddings API.

Can provide the embedding input_type as a kwarg to this method
that specifies the type of input you’re giving to the model. For retrieval/search use cases,
we recommend specifying this argument when encoding queries or documents to enhance retrieval quality.
Embeddings generated with and without the input_type argument are compatible.

Supported input types are `document` and `query`

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type=”document” and when you are
querying the database, you should set the input_type=”query”.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. .
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
  * **input_type** (*str*) – Specifies the type of input passed to the model.
  * **truncation** (*bool*) – Whether to truncate the input texts to fit within the context length.
    Check [https://docs.voyageai.com/docs/embeddings](https://docs.voyageai.com/docs/embeddings)
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – In an invalid input_type is provided.

#### `embed(text, preprocess=None, as_buffer=False, **kwargs)`

Embed a chunk of text using the VoyageAI Embeddings API.

Can provide the embedding input_type as a kwarg to this method
that specifies the type of input you’re giving to the model. For retrieval/search use cases,
we recommend specifying this argument when encoding queries or documents to enhance retrieval quality.
Embeddings generated with and without the input_type argument are compatible.

Supported input types are `document` and `query`

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type=”document” and when you are
querying the database, you should set the input_type=”query”.

* **Parameters:**
  * **text** (*str*) – Chunk of text to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
  * **input_type** (*str*) – Specifies the type of input passed to the model.
  * **truncation** (*bool*) – Whether to truncate the input texts to fit within the context length.
    Check [https://docs.voyageai.com/docs/embeddings](https://docs.voyageai.com/docs/embeddings)
* **Returns:**
  Embedding.
* **Return type:**
  List[float]
* **Raises:**
  **TypeError** – If an invalid input_type is provided.

#### `embed_many(texts, preprocess=None, batch_size=None, as_buffer=False, **kwargs)`

Embed many chunks of text using the VoyageAI Embeddings API.

Can provide the embedding input_type as a kwarg to this method
that specifies the type of input you’re giving to the model. For retrieval/search use cases,
we recommend specifying this argument when encoding queries or documents to enhance retrieval quality.
Embeddings generated with and without the input_type argument are compatible.

Supported input types are `document` and `query`

When hydrating your Redis DB, the documents you want to search over
should be embedded with input_type=”document” and when you are
querying the database, you should set the input_type=”query”.

* **Parameters:**
  * **texts** (*List* *[* *str* *]*) – List of text chunks to embed.
  * **preprocess** (*Optional* *[* *Callable* *]* *,* *optional*) – Optional preprocessing callable to
    perform before vectorization. Defaults to None.
  * **batch_size** (*int* *,* *optional*) – Batch size of texts to use when creating
    embeddings. .
  * **as_buffer** (*bool* *,* *optional*) – Whether to convert the raw embedding
    to a byte string. Defaults to False.
  * **input_type** (*str*) – Specifies the type of input passed to the model.
  * **truncation** (*bool*) – Whether to truncate the input texts to fit within the context length.
    Check [https://docs.voyageai.com/docs/embeddings](https://docs.voyageai.com/docs/embeddings)
* **Returns:**
  List of embeddings.
* **Return type:**
  List[List[float]]
* **Raises:**
  **TypeError** – If an invalid input_type is provided.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialise private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

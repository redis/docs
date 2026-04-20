---
linkTitle: Vectorizers
title: Vectorizers
aliases:
- /integrate/redisvl/api/vectorizer
---


#### `NOTE`
**Backwards Compatibility:** Several vectorizers have deprecated aliases
available in the `redisvl.utils.vectorize.text` module for backwards
compatibility:

- `VoyageAITextVectorizer` → Use `VoyageAIVectorizer` instead
- `VertexAITextVectorizer` → Use `VertexAIVectorizer` instead
- `BedrockTextVectorizer` → Use `BedrockVectorizer` instead
- `CustomTextVectorizer` → Use `CustomVectorizer` instead

These aliases are deprecated as of version 0.13.0 and will be removed
in a future major release.

## HFTextVectorizer

<a id="hftextvectorizer-api"></a>

### `class HFTextVectorizer(model='sentence-transformers/all-mpnet-base-v2', dtype='float32', cache=None, *, dims=None)`

Bases: `BaseVectorizer`

The HFTextVectorizer class leverages Hugging Face’s Sentence Transformers
for generating vector embeddings from text input.

This vectorizer is particularly useful in scenarios where advanced natural language
processing and understanding are required, and ideal for running on your own
hardware without usage fees.

You can optionally enable caching to improve performance when generating
embeddings for repeated text inputs.

Utilizing this vectorizer involves specifying a pre-trained model from
Hugging Face’s vast collection of Sentence Transformers. These models are
trained on a variety of datasets and tasks, ensuring versatility and
robust performance across different embedding needs.

#### `NOTE`
Some multimodal models can make use of sentence-transformers by passing
PIL Image objects in place of strings (e.g. CLIP). To enable those use
cases, this class follows the SentenceTransformer convention of hinting
that it expects string inputs, but never enforcing it.

Requirements:
: - The sentence-transformers library must be installed with pip.

```python
# Basic usage
vectorizer = HFTextVectorizer(model="sentence-transformers/all-mpnet-base-v2")
embedding = vectorizer.embed("Hello, world!")

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="my_embeddings_cache")

vectorizer = HFTextVectorizer(
    model="sentence-transformers/all-mpnet-base-v2",
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

# Batch processing
embeddings = vectorizer.embed_many(
    ["Hello, world!", "How are you?"],
    batch_size=2
)

# Multimodal usage
from PIL import Image
vectorizer = HFTextVectorizer(model="sentence-transformers/clip-ViT-L-14")
embeddings1 = vectorizer.embed("Hello, world!")
embeddings2 = vectorizer.embed(Image.open("path/to/your/image.jpg"))
```

Initialize the Hugging Face text vectorizer.

* **Parameters:**
  * **model** (*str*) – The pre-trained model from Hugging Face’s Sentence
    Transformers to be used for embedding. Defaults to
    ‘sentence-transformers/all-mpnet-base-v2’.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **\*\*kwargs** – Additional parameters to pass to the SentenceTransformer
    constructor.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the sentence-transformers library is not installed.
  * **ValueError** – If there is an error setting the embedding model dimensions.
  * **ValueError** – If an invalid dtype is provided.

#### `model_post_init(context, /)`

This function is meant to behave like a BaseModel method to initialize private attributes.

It takes context as an argument since that’s what pydantic-core passes when calling it.

* **Parameters:**
  * **self** (*BaseModel*) – The BaseModel instance.
  * **context** (*Any*) – The context.
* **Return type:**
  None

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## OpenAITextVectorizer

<a id="openaitextvectorizer-api"></a>

### `class OpenAITextVectorizer(model='text-embedding-ada-002', api_config=None, dtype='float32', cache=None, *, dims=None)`

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

You can optionally enable caching to improve performance when generating
embeddings for repeated text inputs.

```python
# Basic usage with OpenAI embeddings
vectorizer = OpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={"api_key": "your_api_key"} # OR set OPENAI_API_KEY in your env
)
embedding = vectorizer.embed("Hello, world!")

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="openai_embeddings_cache")

vectorizer = OpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={"api_key": "your_api_key"},
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

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
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the openai library is not installed.
  * **ValueError** – If the OpenAI API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## AzureOpenAITextVectorizer

<a id="azureopenaitextvectorizer-api"></a>

### `class AzureOpenAITextVectorizer(model='text-embedding-ada-002', api_config=None, dtype='float32', cache=None, *, dims=None)`

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

You can optionally enable caching to improve performance when generating
embeddings for repeated text inputs.

```python
# Basic usage
vectorizer = AzureOpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={
        "api_key": "your_api_key", # OR set AZURE_OPENAI_API_KEY in your env
        "api_version": "your_api_version", # OR set OPENAI_API_VERSION in your env
        "azure_endpoint": "your_azure_endpoint", # OR set AZURE_OPENAI_ENDPOINT in your env
    }
)
embedding = vectorizer.embed("Hello, world!")

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="azureopenai_embeddings_cache")

vectorizer = AzureOpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={
        "api_key": "your_api_key",
        "api_version": "your_api_version",
        "azure_endpoint": "your_azure_endpoint",
    },
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

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
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the openai library is not installed.
  * **ValueError** – If the AzureOpenAI API key, version, or endpoint are not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## VertexAIVectorizer

<a id="vertexaivectorizer-api"></a>

#### `NOTE`
For backwards compatibility, an alias `VertexAITextVectorizer` is available
in the `redisvl.utils.vectorize.text` module. This alias is deprecated
as of version 0.13.0 and will be removed in a future major release.

### `class VertexAIVectorizer(model='textembedding-gecko', api_config=None, dtype='float32', cache=None, *, dims=None)`

Bases: `BaseVectorizer`

The VertexAIVectorizer uses Google’s VertexAI embedding model
API to create embeddings.

This vectorizer is tailored for use in
environments where integration with Google Cloud Platform (GCP) services is
a key requirement.

Utilizing this vectorizer requires an active GCP project and location
(region), along with appropriate application credentials. These can be
provided through the api_config dictionary or set the GOOGLE_APPLICATION_CREDENTIALS
env var. Additionally, the vertexai python client must be
installed with pip install google-cloud-aiplatform>=1.26.

You can optionally enable caching to improve performance when generating
embeddings for repeated inputs.

```python
# Basic usage
vectorizer = VertexAIVectorizer(
    model="textembedding-gecko",
    api_config={
        "project_id": "your_gcp_project_id", # OR set GCP_PROJECT_ID
        "location": "your_gcp_location",     # OR set GCP_LOCATION
    })
embedding = vectorizer.embed("Hello, world!")

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="vertexai_embeddings_cache")

vectorizer = VertexAIVectorizer(
    model="textembedding-gecko",
    api_config={
        "project_id": "your_gcp_project_id",
        "location": "your_gcp_location",
    },
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

# Batch embedding of multiple texts
embeddings = vectorizer.embed_many(
    ["Hello, world!", "Goodbye, world!"],
    batch_size=2
)

# Multimodal usage
from vertexai.vision_models import Image, Video

vectorizer = VertexAIVectorizer(
    model="multimodalembedding@001",
    api_config={
        "project_id": "your_gcp_project_id", # OR set GCP_PROJECT_ID
        "location": "your_gcp_location",     # OR set GCP_LOCATION
    }
)
text_embedding = vectorizer.embed("Hello, world!")
image_embedding = vectorizer.embed(Image.load_from_file("path/to/your/image.jpg"))
video_embedding = vectorizer.embed(Video.load_from_file("path/to/your/video.mp4"))
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
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the google-cloud-aiplatform library is not installed.
  * **ValueError** – If the API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `embed_image(image_path, **kwargs)`

Embed an image (from its path on disk) using a VertexAI multimodal model.

* **Parameters:**
  **image_path** (*str*)
* **Return type:**
  *List*[float] | bytes

#### `embed_video(video_path, **kwargs)`

Embed a video (from its path on disk) using a VertexAI multimodal model.

* **Parameters:**
  **video_path** (*str*)
* **Return type:**
  *List*[float] | bytes

#### `property is_multimodal: bool`

Whether a multimodal model has been configured.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## CohereTextVectorizer

<a id="coheretextvectorizer-api"></a>

### `class CohereTextVectorizer(model='embed-english-v3.0', api_config=None, dtype='float32', cache=None, *, dims=None)`

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

You can optionally enable caching to improve performance when generating
embeddings for repeated text inputs.

```python
from redisvl.utils.vectorize import CohereTextVectorizer

# Basic usage
vectorizer = CohereTextVectorizer(
    model="embed-english-v3.0",
    api_config={"api_key": "your-cohere-api-key"} # OR set COHERE_API_KEY in your env
)
query_embedding = vectorizer.embed(
    text="your input query text here",
    input_type="search_query"
)
doc_embeddings = vectorizer.embed_many(
    texts=["your document text", "more document text"],
    input_type="search_document"
)

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="cohere_embeddings_cache")

vectorizer = CohereTextVectorizer(
    model="embed-english-v3.0",
    api_config={"api_key": "your-cohere-api-key"},
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed(
    text="your input query text here",
    input_type="search_query"
)

# Second call will retrieve from cache
embedding2 = vectorizer.embed(
    text="your input query text here",
    input_type="search_query"
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
    ‘float32’ will use Cohere’s float embeddings, ‘int8’ and ‘uint8’ will map
    to Cohere’s corresponding embedding types. Defaults to ‘float32’.
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the cohere library is not installed.
  * **ValueError** – If the API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## BedrockVectorizer

<a id="bedrockvectorizer-api"></a>

#### `NOTE`
For backwards compatibility, an alias `BedrockTextVectorizer` is available
in the `redisvl.utils.vectorize.text` module. This alias is deprecated
as of version 0.13.0 and will be removed in a future major release.

### `class BedrockVectorizer(model='amazon.titan-embed-text-v2:0', api_config=None, dtype='float32', cache=None, *, dims=None)`

Bases: `BaseVectorizer`

The BedrockVectorizer class utilizes Amazon Bedrock’s API to generate
embeddings for text or image data.

This vectorizer is designed to interact with Amazon Bedrock API,
requiring AWS credentials for authentication. The credentials can be provided
directly in the api_config dictionary or through environment variables:
- AWS_ACCESS_KEY_ID
- AWS_SECRET_ACCESS_KEY
- AWS_REGION (defaults to us-east-1)

The vectorizer supports synchronous operations with batch processing and
preprocessing capabilities.

You can optionally enable caching to improve performance when generating
embeddings for repeated inputs.

```python
# Basic usage with explicit credentials
vectorizer = BedrockVectorizer(
    model="amazon.titan-embed-text-v2:0",
    api_config={
        "aws_access_key_id": "your_access_key",
        "aws_secret_access_key": "your_secret_key",
        "aws_region": "us-east-1"
    }
)

# With environment variables and caching
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="bedrock_embeddings_cache")

vectorizer = BedrockVectorizer(
    model="amazon.titan-embed-text-v2:0",
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

# Generate batch embeddings
embeddings = vectorizer.embed_many(["Hello", "World"], batch_size=2)

# Multimodal usage
from pathlib import Path
vectorizer = BedrockVectorizer(
    model="amazon.titan-embed-image-v1:0",
    api_config={
        "aws_access_key_id": "your_access_key",
        "aws_secret_access_key": "your_secret_key",
        "aws_region": "us-east-1"
    }
)
image_embedding = vectorizer.embed(Path("path/to/your/image.jpg"))

# Embedding a list of mixed modalities
embeddings = vectorizer.embed_many(
    ["Hello", "world!", Path("path/to/your/image.jpg")],
    batch_size=2
)
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
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ValueError** – If credentials are not provided in config or environment.
  * **ImportError** – If boto3 is not installed.
  * **ValueError** – If an invalid dtype is provided.

#### `embed_image(image_path, **kwargs)`

Embed an image (from its path on disk) using a Bedrock multimodal model.

* **Parameters:**
  **image_path** (*str*)
* **Return type:**
  *List*[float] | bytes

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## CustomVectorizer

<a id="customvectorizer-api"></a>

#### `NOTE`
For backwards compatibility, an alias `CustomTextVectorizer` is available
in the `redisvl.utils.vectorize.text` module. This alias is deprecated
as of version 0.13.0 and will be removed in a future major release.

### `class CustomVectorizer(embed, embed_many=None, aembed=None, aembed_many=None, dtype='float32', cache=None)`

Bases: `BaseVectorizer`

The CustomVectorizer class wraps user-defined embedding methods to create
embeddings for data.

This vectorizer is designed to accept a provided callable vectorizer and
provides a class definition to allow for compatibility with RedisVL.
The vectorizer may support both synchronous and asynchronous operations which
allows for batch processing of inputs, but at a minimum only synchronous embedding
is required to satisfy the ‘embed()’ method.

You can optionally enable caching to improve performance when generating
embeddings for repeated inputs.

```python
# Basic usage with a custom embedding function
vectorizer = CustomVectorizer(
    embed = my_vectorizer.generate_embedding
)
embedding = vectorizer.embed("Hello, world!")

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="my_embeddings_cache")

vectorizer = CustomVectorizer(
    embed=my_vectorizer.generate_embedding,
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

# Asynchronous batch embedding of multiple texts
embeddings = await vectorizer.aembed_many(
    ["Hello, world!", "How are you?"],
    batch_size=2
)
```

Initialize the Custom vectorizer.

* **Parameters:**
  * **embed** (*Callable*) – a Callable function that accepts an object and returns a list of floats.
  * **embed_many** (*Optional* *[* *Callable* *]*) – a Callable function that accepts a list of objects and returns a list containing lists of floats. Defaults to None.
  * **aembed** (*Optional* *[* *Callable* *]*) – an asynchronous Callable function that accepts a object and returns a lists of floats. Defaults to None.
  * **aembed_many** (*Optional* *[* *Callable* *]*) – an asynchronous Callable function that accepts a list of objects and returns a list containing lists of floats. Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding inputs as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated inputs. Defaults to None.
* **Raises:**
  **ValueError** – if embedding validation fails.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## VoyageAIVectorizer

<a id="voyageaivectorizer-api"></a>

#### `NOTE`
For backwards compatibility, an alias `VoyageAITextVectorizer` is available
in the `redisvl.utils.vectorize.text` module. This alias is deprecated
as of version 0.13.0 and will be removed in a future major release.

### `class VoyageAIVectorizer(model='voyage-3-large', api_config=None, dtype='float32', cache=None, *, dims=None)`

Bases: `BaseVectorizer`

The VoyageAIVectorizer class utilizes VoyageAI’s API to generate
embeddings for text and multimodal (text / image / video) data.

This vectorizer is designed to interact with VoyageAI’s /embed and /multimodal_embed APIs,
requiring an API key for authentication. The key can be provided
directly in the api_config dictionary or through the VOYAGE_API_KEY
environment variable. User must obtain an API key from VoyageAI’s website
([https://dash.voyageai.com/](https://dash.voyageai.com/)). Additionally, the voyageai python
client must be installed with pip install voyageai. For image embeddings, the Pillow
library must also be installed with pip install pillow.

The vectorizer supports both synchronous and asynchronous operations, allows for batch
processing of content and flexibility in handling preprocessing tasks.

You can optionally enable caching to improve performance when generating
embeddings for repeated text inputs.

```python
from redisvl.utils.vectorize import VoyageAIVectorizer

# Basic usage
vectorizer = VoyageAIVectorizer(
    model="voyage-3-large",
    api_config={"api_key": "your-voyageai-api-key"} # OR set VOYAGE_API_KEY in your env
)
query_embedding = vectorizer.embed(
    content="your input query text here",
    input_type="query"
)
doc_embeddings = vectorizer.embed_many(
    contents=["your document text", "more document text"],
    input_type="document"
)

# Multimodal usage - requires Pillow and voyageai>=0.3.6

vectorizer = VoyageAIVectorizer(
    model="voyage-multimodal-3.5",
    api_config={"api_key": "your-voyageai-api-key"} # OR set VOYAGE_API_KEY in your env
)
image_embedding = vectorizer.embed_image(
    "path/to/your/image.jpg",
    input_type="query"
)
video_embedding = vectorizer.embed_video(
    "path/to/your/video.mp4",
    input_type="document"
)

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="voyageai_embeddings_cache")

vectorizer = VoyageAIVectorizer(
    model="voyage-3-large",
    api_config={"api_key": "your-voyageai-api-key"},
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed(
    content="your input query text here",
    input_type="query"
)

# Second call will retrieve from cache
embedding2 = vectorizer.embed(
    content="your input query text here",
    input_type="query"
)
```

Initialize the VoyageAI vectorizer.

Visit [https://docs.voyageai.com/docs/embeddings](https://docs.voyageai.com/docs/embeddings) to learn about embeddings and check the available models.

* **Parameters:**
  * **model** (*str*) – Model to use for embedding. Defaults to "voyage-3-large".
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the API key.
    Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding content as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated items. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the voyageai library is not installed.
  * **ValueError** – If the API key is not provided.

### `Notes`

- Multimodal models require voyageai>=0.3.6 to be installed for video embeddings, as well as
  : ffmpeg installed on the system. Image embeddings require pillow to be installed.

#### `embed_image(image_path, **kwargs)`

Embed an image (from its path on disk) using VoyageAI’s multimodal API. Requires pillow to be installed.

* **Parameters:**
  **image_path** (*str*)
* **Return type:**
  *List*[float] | bytes

#### `embed_video(video_path, **kwargs)`

Embed a video (from its path on disk) using VoyageAI’s multimodal API.

Requires voyageai>=0.3.6 to be installed, as well as ffmpeg to be installed on the system.

* **Parameters:**
  **video_path** (*str*)
* **Return type:**
  *List*[float] | bytes

#### `property is_multimodal: bool`

Whether a multimodal model has been configured.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

## MistralAITextVectorizer

<a id="mistralaitextvectorizer-api"></a>

### `class MistralAITextVectorizer(model='mistral-embed', api_config=None, dtype='float32', cache=None, *, dims=None)`

Bases: `BaseVectorizer`

The MistralAITextVectorizer class utilizes MistralAI’s API to generate
embeddings for text data.

This vectorizer is designed to interact with Mistral’s embeddings API,
requiring an API key for authentication. The key can be provided directly
in the api_config dictionary or through the MISTRAL_API_KEY environment
variable. Users must obtain an API key from Mistral’s website
([https://console.mistral.ai/](https://console.mistral.ai/)). Additionally, the mistralai python client
must be installed with pip install mistralai.

The vectorizer supports both synchronous and asynchronous operations,
allowing for batch processing of texts and flexibility in handling
preprocessing tasks.

You can optionally enable caching to improve performance when generating
embeddings for repeated text inputs.

```python
# Basic usage
vectorizer = MistralAITextVectorizer(
    model="mistral-embed",
    api_config={"api_key": "your_api_key"} # OR set MISTRAL_API_KEY in your env
)
embedding = vectorizer.embed("Hello, world!")

# With caching enabled
from redisvl.extensions.cache.embeddings import EmbeddingsCache
cache = EmbeddingsCache(name="mistral_embeddings_cache")

vectorizer = MistralAITextVectorizer(
    model="mistral-embed",
    api_config={"api_key": "your_api_key"},
    cache=cache
)

# First call will compute and cache the embedding
embedding1 = vectorizer.embed("Hello, world!")

# Second call will retrieve from cache
embedding2 = vectorizer.embed("Hello, world!")

# Asynchronous batch embedding of multiple texts
embeddings = await vectorizer.aembed_many(
    ["Hello, world!", "How are you?"],
    batch_size=2
)
```

Initialize the MistralAI vectorizer.

* **Parameters:**
  * **model** (*str*) – Model to use for embedding. Defaults to
    ‘mistral-embed’.
  * **api_config** (*Optional* *[* *Dict* *]* *,* *optional*) – Dictionary containing the
    API key. Defaults to None.
  * **dtype** (*str*) – the default datatype to use when embedding text as byte arrays.
    Used when setting as_buffer=True in calls to embed() and embed_many().
    Defaults to ‘float32’.
  * **cache** (*Optional* *[*[*EmbeddingsCache*]({{< relref "cache/#embeddingscache" >}}) *]*) – Optional EmbeddingsCache instance to cache embeddings for
    better performance with repeated texts. Defaults to None.
  * **dims** (*Annotated* *[* *int* *|* *None* *,* *FieldInfo* *(* *annotation=NoneType* *,* *required=True* *,* *metadata=* *[* *Strict* *(* *strict=True* *)* *,* *Gt* *(* *gt=0* *)* *]* *)* *]*)
* **Raises:**
  * **ImportError** – If the mistralai library is not installed.
  * **ValueError** – If the Mistral API key is not provided.
  * **ValueError** – If an invalid dtype is provided.

#### `model_config: ClassVar[ConfigDict] = {'arbitrary_types_allowed': True}`

Configuration for the model, should be a dictionary conforming to [ConfigDict][pydantic.config.ConfigDict].

#### `property type: str`

Return the type of vectorizer.

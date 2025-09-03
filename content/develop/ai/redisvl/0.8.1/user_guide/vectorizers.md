---
linkTitle: Vectorizers
title: Vectorizers
weight: 04
url: '/develop/ai/redisvl/0.8.1/user_guide/vectorizers/'
---


In this notebook, we will show how to use RedisVL to create embeddings using the built-in text embedding vectorizers. Today RedisVL supports:
1. OpenAI
2. HuggingFace
3. Vertex AI
4. Cohere
5. Mistral AI
6. Amazon Bedrock
7. Bringing your own vectorizer
8. VoyageAI

Before running this notebook, be sure to
1. Have installed ``redisvl`` and have that environment active for this notebook.
2. Have a running Redis Stack instance with RediSearch > 2.4 active.

For example, you can run Redis Stack locally with Docker:

```bash
docker run -d -p 6379:6379 -p 8001:8001 redis/redis-stack:latest
```

This will run Redis on port 6379 and RedisInsight at http://localhost:8001.


```python
# import necessary modules
import os
```

## Creating Text Embeddings

This example will show how to create an embedding from 3 simple sentences with a number of different text vectorizers in RedisVL.

- "That is a happy dog"
- "That is a happy person"
- "Today is a nice day"


### OpenAI

The ``OpenAITextVectorizer`` makes it simple to use RedisVL with the embeddings models at OpenAI. For this you will need to install ``openai``. 

```bash
pip install openai
```



```python
import getpass

# setup the API Key
api_key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("Enter your OpenAI API key: ")
```


```python
from redisvl.utils.vectorize import OpenAITextVectorizer

# create a vectorizer
oai = OpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={"api_key": api_key},
)

test = oai.embed("This is a test sentence.")
print("Vector dimensions: ", len(test))
test[:10]
```

    Vector dimensions:  1536





    [-0.0011391325388103724,
     -0.003206387162208557,
     0.002380132209509611,
     -0.004501554183661938,
     -0.010328996926546097,
     0.012922565452754498,
     -0.005491119809448719,
     -0.0029864837415516376,
     -0.007327961269766092,
     -0.03365817293524742]




```python
# Create many embeddings at once
sentences = [
    "That is a happy dog",
    "That is a happy person",
    "Today is a sunny day"
]

embeddings = oai.embed_many(sentences)
embeddings[0][:10]
```




    [-0.017466850578784943,
     1.8471690054866485e-05,
     0.00129731057677418,
     -0.02555876597762108,
     -0.019842341542243958,
     0.01603139191865921,
     -0.0037347301840782166,
     0.0009670283179730177,
     0.006618348415941,
     -0.02497442066669464]




```python
# openai also supports asynchronous requests, which we can use to speed up the vectorization process.
embeddings = await oai.aembed_many(sentences)
print("Number of Embeddings:", len(embeddings))

```

    Number of Embeddings: 3


### Azure OpenAI

The ``AzureOpenAITextVectorizer`` is a variation of the OpenAI vectorizer that calls OpenAI models within Azure. If you've already installed ``openai``, then you're ready to use Azure OpenAI.

The only practical difference between OpenAI and Azure OpenAI is the variables required to call the API.


```python
# additionally to the API Key, setup the API endpoint and version
api_key = os.environ.get("AZURE_OPENAI_API_KEY") or getpass.getpass("Enter your AzureOpenAI API key: ")
api_version = os.environ.get("OPENAI_API_VERSION") or getpass.getpass("Enter your AzureOpenAI API version: ")
azure_endpoint = os.environ.get("AZURE_OPENAI_ENDPOINT") or getpass.getpass("Enter your AzureOpenAI API endpoint: ")
deployment_name = os.environ.get("AZURE_OPENAI_DEPLOYMENT_NAME", "text-embedding-ada-002")

```


```python
from redisvl.utils.vectorize import AzureOpenAITextVectorizer

# create a vectorizer
az_oai = AzureOpenAITextVectorizer(
    model=deployment_name, # Must be your CUSTOM deployment name
    api_config={
        "api_key": api_key,
        "api_version": api_version,
        "azure_endpoint": azure_endpoint
    },
)

test = az_oai.embed("This is a test sentence.")
print("Vector dimensions: ", len(test))
test[:10]
```


    ---------------------------------------------------------------------------

    ValueError                                Traceback (most recent call last)

    Cell In[7], line 4
          1 from redisvl.utils.vectorize import AzureOpenAITextVectorizer
          3 # create a vectorizer
    ----> 4 az_oai = AzureOpenAITextVectorizer(
          5     model=deployment_name, # Must be your CUSTOM deployment name
          6     api_config={
          7         "api_key": api_key,
          8         "api_version": api_version,
          9         "azure_endpoint": azure_endpoint
         10     },
         11 )
         13 test = az_oai.embed("This is a test sentence.")
         14 print("Vector dimensions: ", len(test))


    File ~/src/redis-vl-python/redisvl/utils/vectorize/text/azureopenai.py:78, in AzureOpenAITextVectorizer.__init__(self, model, api_config, dtype)
         54 def __init__(
         55     self,
         56     model: str = "text-embedding-ada-002",
         57     api_config: Optional[Dict] = None,
         58     dtype: str = "float32",
         59 ):
         60     """Initialize the AzureOpenAI vectorizer.
         61 
         62     Args:
       (...)
         76         ValueError: If an invalid dtype is provided.
         77     """
    ---> 78     self._initialize_clients(api_config)
         79     super().__init__(model=model, dims=self._set_model_dims(model), dtype=dtype)


    File ~/src/redis-vl-python/redisvl/utils/vectorize/text/azureopenai.py:106, in AzureOpenAITextVectorizer._initialize_clients(self, api_config)
         99 azure_endpoint = (
        100     api_config.pop("azure_endpoint")
        101     if api_config
        102     else os.getenv("AZURE_OPENAI_ENDPOINT")
        103 )
        105 if not azure_endpoint:
    --> 106     raise ValueError(
        107         "AzureOpenAI API endpoint is required. "
        108         "Provide it in api_config or set the AZURE_OPENAI_ENDPOINT\
        109             environment variable."
        110     )
        112 api_version = (
        113     api_config.pop("api_version")
        114     if api_config
        115     else os.getenv("OPENAI_API_VERSION")
        116 )
        118 if not api_version:


    ValueError: AzureOpenAI API endpoint is required. Provide it in api_config or set the AZURE_OPENAI_ENDPOINT                    environment variable.



```python
# Just like OpenAI, AzureOpenAI supports batching embeddings and asynchronous requests.
sentences = [
    "That is a happy dog",
    "That is a happy person",
    "Today is a sunny day"
]

embeddings = await az_oai.aembed_many(sentences)
embeddings[0][:10]
```

### Huggingface

[Huggingface](https://huggingface.co/models) is a popular NLP platform that has a number of pre-trained models you can use off the shelf. RedisVL supports using Huggingface "Sentence Transformers" to create embeddings from text. To use Huggingface, you will need to install the ``sentence-transformers`` library.

```bash
pip install sentence-transformers
```


```python
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from redisvl.utils.vectorize import HFTextVectorizer


# create a vectorizer
# choose your model from the huggingface website
hf = HFTextVectorizer(model="sentence-transformers/all-mpnet-base-v2")

# embed a sentence
test = hf.embed("This is a test sentence.")
test[:10]
```


```python
# You can also create many embeddings at once
embeddings = hf.embed_many(sentences, as_buffer=True)

```

### VertexAI

[VertexAI](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings) is GCP's fully-featured AI platform including a number of pretrained LLMs. RedisVL supports using VertexAI to create embeddings from these models. To use VertexAI, you will first need to install the ``google-cloud-aiplatform`` library.

```bash
pip install google-cloud-aiplatform>=1.26
```

1. Then you need to gain access to a [Google Cloud Project](https://cloud.google.com/gcp?hl=en) and provide [access to credentials](https://cloud.google.com/docs/authentication/application-default-credentials). This is accomplished by setting the `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to the path of a JSON key file downloaded from your service account on GCP.
2. Lastly, you need to find your [project ID](https://support.google.com/googleapi/answer/7014113?hl=en) and [geographic region for VertexAI](https://cloud.google.com/vertex-ai/docs/general/locations).


**Make sure the following env vars are set:**

```
GOOGLE_APPLICATION_CREDENTIALS=<path to your gcp JSON creds>
GCP_PROJECT_ID=<your gcp project id>
GCP_LOCATION=<your gcp geo region for vertex ai>
```


```python
from redisvl.utils.vectorize import VertexAITextVectorizer


# create a vectorizer
vtx = VertexAITextVectorizer(api_config={
    "project_id": os.environ.get("GCP_PROJECT_ID") or getpass.getpass("Enter your GCP Project ID: "),
    "location": os.environ.get("GCP_LOCATION") or getpass.getpass("Enter your GCP Location: "),
    "google_application_credentials": os.environ.get("GOOGLE_APPLICATION_CREDENTIALS") or getpass.getpass("Enter your Google App Credentials path: ")
})

# embed a sentence
test = vtx.embed("This is a test sentence.")
test[:10]
```

### Cohere

[Cohere](https://dashboard.cohere.ai/) allows you to implement language AI into your product. The `CohereTextVectorizer` makes it simple to use RedisVL with the embeddings models at Cohere. For this you will need to install `cohere`.

```bash
pip install cohere
```


```python
import getpass
# setup the API Key
api_key = os.environ.get("COHERE_API_KEY") or getpass.getpass("Enter your Cohere API key: ")
```


Special attention needs to be paid to the `input_type` parameter for each `embed` call. For example, for embedding 
queries, you should set `input_type='search_query'`; for embedding documents, set `input_type='search_document'`. See
more information [here](https://docs.cohere.com/reference/embed)


```python
from redisvl.utils.vectorize import CohereTextVectorizer

# create a vectorizer
co = CohereTextVectorizer(
    model="embed-english-v3.0",
    api_config={"api_key": api_key},
)

# embed a search query
test = co.embed("This is a test sentence.", input_type='search_query')
print("Vector dimensions: ", len(test))
print(test[:10])

# embed a document
test = co.embed("This is a test sentence.", input_type='search_document')
print("Vector dimensions: ", len(test))
print(test[:10])
```

Learn more about using RedisVL and Cohere together through [this dedicated user guide](https://docs.cohere.com/docs/redis-and-cohere).

### VoyageAI

[VoyageAI](https://dash.voyageai.com/) allows you to implement language AI into your product. The `VoyageAITextVectorizer` makes it simple to use RedisVL with the embeddings models at VoyageAI. For this you will need to install `voyageai`.

```bash
pip install voyageai
```


```python
import getpass
# setup the API Key
api_key = os.environ.get("VOYAGE_API_KEY") or getpass.getpass("Enter your VoyageAI API key: ")
```


Special attention needs to be paid to the `input_type` parameter for each `embed` call. For example, for embedding 
queries, you should set `input_type='query'`; for embedding documents, set `input_type='document'`. See
more information [here](https://docs.voyageai.com/docs/embeddings)


```python
from redisvl.utils.vectorize import VoyageAITextVectorizer

# create a vectorizer
vo = VoyageAITextVectorizer(
    model="voyage-law-2",  # Please check the available models at https://docs.voyageai.com/docs/embeddings
    api_config={"api_key": api_key},
)

# embed a search query
test = vo.embed("This is a test sentence.", input_type='query')
print("Vector dimensions: ", len(test))
print(test[:10])

# embed a document
test = vo.embed("This is a test sentence.", input_type='document')
print("Vector dimensions: ", len(test))
print(test[:10])
```

### Mistral AI

[Mistral](https://console.mistral.ai/) offers LLM and embedding APIs for you to implement into your product. The `MistralAITextVectorizer` makes it simple to use RedisVL with their embeddings model.
You will need to install `mistralai`.

```bash
pip install mistralai
```


```python
from redisvl.utils.vectorize import MistralAITextVectorizer

mistral = MistralAITextVectorizer()

# embed a sentence using their asynchronous method
test = await mistral.aembed("This is a test sentence.")
print("Vector dimensions: ", len(test))
print(test[:10])
```

### Amazon Bedrock

Amazon Bedrock provides fully managed foundation models for text embeddings. Install the required dependencies:

```bash
pip install 'redisvl[bedrock]'  # Installs boto3
```

#### Configure AWS credentials:


```python
import os
import getpass

if "AWS_ACCESS_KEY_ID" not in os.environ:
    os.environ["AWS_ACCESS_KEY_ID"] = getpass.getpass("Enter AWS Access Key ID: ")
if "AWS_SECRET_ACCESS_KEY" not in os.environ:
    os.environ["AWS_SECRET_ACCESS_KEY"] = getpass.getpass("Enter AWS Secret Key: ")

os.environ["AWS_REGION"] = "us-east-1"  # Change as needed
```

#### Create embeddings:


```python
from redisvl.utils.vectorize import BedrockTextVectorizer

bedrock = BedrockTextVectorizer(
    model="amazon.titan-embed-text-v2:0"
)

# Single embedding
text = "This is a test sentence."
embedding = bedrock.embed(text)
print(f"Vector dimensions: {len(embedding)}")

# Multiple embeddings
sentences = [
    "That is a happy dog",
    "That is a happy person",
    "Today is a sunny day"
]
embeddings = bedrock.embed_many(sentences)
```

### Custom Vectorizers

RedisVL supports the use of other vectorizers and provides a class to enable compatibility with any function that generates a vector or vectors from string data


```python
from redisvl.utils.vectorize import CustomTextVectorizer

def generate_embeddings(text_input, **kwargs):
    return [0.101] * 768

custom_vectorizer = CustomTextVectorizer(generate_embeddings)

custom_vectorizer.embed("This is a test sentence.")[:10]
```

This enables the use of custom vectorizers with other RedisVL components


```python
from redisvl.extensions.cache.llm import SemanticCache

cache = SemanticCache(name="custom_cache", vectorizer=custom_vectorizer)

cache.store("this is a test prompt", "this is a test response")
cache.check("this is also a test prompt")
```

## Search with Provider Embeddings

Now that we've created our embeddings, we can use them to search for similar sentences. We will use the same 3 sentences from above and search for similar sentences.

First, we need to create the schema for our index.

Here's what the schema for the example looks like in yaml for the HuggingFace vectorizer:

```yaml
version: '0.1.0'

index:
    name: vectorizers
    prefix: doc
    storage_type: hash

fields:
    - name: sentence
      type: text
    - name: embedding
      type: vector
      attrs:
        dims: 768
        algorithm: flat
        distance_metric: cosine
```


```python
from redisvl.index import SearchIndex

# construct a search index from the schema
index = SearchIndex.from_yaml("./schema.yaml", redis_url="redis://localhost:6379")

# create the index (no data yet)
index.create(overwrite=True)
```


```python
# use the CLI to see the created index
!rvl index listall
```

Loading data to RedisVL is easy. It expects a list of dictionaries. The vector is stored as bytes.


```python
from redisvl.redis.utils import array_to_buffer

embeddings = hf.embed_many(sentences)

data = [{"text": t,
         "embedding": array_to_buffer(v, dtype="float32")}
        for t, v in zip(sentences, embeddings)]

index.load(data)
```


```python
from redisvl.query import VectorQuery

# use the HuggingFace vectorizer again to create a query embedding
query_embedding = hf.embed("That is a happy cat")

query = VectorQuery(
    vector=query_embedding,
    vector_field_name="embedding",
    return_fields=["text"],
    num_results=3
)

results = index.query(query)
for doc in results:
    print(doc["text"], doc["vector_distance"])
```

## Selecting your float data type
When embedding text as byte arrays RedisVL supports 4 different floating point data types, `float16`, `float32`, `float64` and `bfloat16`, and 2 integer types, `int8` and `uint8`.
Your dtype set for your vectorizer must match what is defined in your search index. If one is not explicitly set the default is `float32`.


```python
vectorizer = HFTextVectorizer(dtype="float16")

# subsequent calls to embed('', as_buffer=True) and embed_many('', as_buffer=True) will now encode as float16
float16_bytes = vectorizer.embed('test sentence', as_buffer=True)

# to generate embeddings with different dtype instantiate a new vectorizer
vectorizer_64 = HFTextVectorizer(dtype='float64')
float64_bytes = vectorizer_64.embed('test sentence', as_buffer=True)

float16_bytes != float64_bytes
```


```python
# cleanup
index.delete()
```

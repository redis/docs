---
linkTitle: Vectorizers
title: Vectorizers
type: integration
description: Supported vectorizers
weight: 4
---
In this document, you will learn how to use RedisVL to create embeddings using the built-in text embedding vectorizers. RedisVL supports:

1. OpenAI
1. HuggingFace
1. Vertex AI
1. Cohere

{{< note >}}
This document is a converted form of [this Jupyter notebook](https://github.com/RedisVentures/redisvl/blob/main/docs/user_guide/vectorizers_04.ipynb).
{{< /note >}}

Before beginning, be sure of the following:

1. You have installed `redisvl` and have that environment activated.
1. You have a running Redis instance with the search and query capability.

```python
# import necessary modules
import os
```
## Create text embeddings

This example will show how to create an embedding from three simple sentences with a number of different text vectorizers in RedisVL.

- "That is a happy dog"
- "That is a happy person"
- "Today is a nice day"

### OpenAI

The `OpenAITextVectorizer` makes it easy to use RedisVL with the embedding models from OpenAI. For this you will need to install `openai`. 

```bash
pip install openai
```

```python
import getpass

# setup the API Key
api_key = os.environ.get("OPENAI_API_KEY") or getpass.getpass("Enter your OpenAI API key: ")
```

```python
from redisvl.vectorize.text import OpenAITextVectorizer

# create a vectorizer
oai = OpenAITextVectorizer(
    model="text-embedding-ada-002",
    api_config={"api_key": api_key},
)

test = oai.embed("This is a test sentence.")
print("Vector dimensions: ", len(test))
test[:10]

Vector dimensions:  1536

[-0.001025049015879631,
 -0.0030993607360869646,
 0.0024536605924367905,
 -0.004484387580305338,
 -0.010331203229725361,
 0.012700922787189484,
 -0.005368996877223253,
 -0.0029411641880869865,
 -0.0070833307690918446,
 -0.03386051580309868]
```

```python
# Create many embeddings at once
sentences = [
    "That is a happy dog",
    "That is a happy person",
    "Today is a sunny day"
]

embeddings = oai.embed_many(sentences)
embeddings[0][:10]

[-0.01747742109000683,
 -5.228330701356754e-05,
 0.0013870716793462634,
 -0.025637786835432053,
 -0.01985435001552105,
 0.016117358580231667,
 -0.0037306349258869886,
 0.0008945261361077428,
 0.006577865686267614,
 -0.025091219693422318]
```

```python
# openai also supports asyncronous requests, which we can use to speed up the vectorization process.
embeddings = await oai.aembed_many(sentences)
print("Number of Embeddings:", len(embeddings))

Number of Embeddings: 3
```

### Huggingface

[Huggingface](https://huggingface.co/models) is a popular NLP platform that has a number of pre-trained models you can use off the shelf. RedisVL supports using Huggingface "Sentence Transformers" to create embeddings from text. To use Huggingface, you will need to install the `sentence-transformers` library.

```bash
pip install sentence-transformers
```

```python
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from redisvl.vectorize.text import HFTextVectorizer


# create a vectorizer
# choose your model from the huggingface website
hf = HFTextVectorizer(model="sentence-transformers/all-mpnet-base-v2")

# embed a sentence
test = hf.embed("This is a test sentence.")
test[:10]

[0.00037810884532518685,
 -0.05080341175198555,
 -0.03514723479747772,
 -0.02325104922056198,
 -0.044158220291137695,
 0.020487844944000244,
 0.0014617963461205363,
 0.031261757016181946,
 0.05605152249336243,
 0.018815357238054276]
```

```python
# You can also create many embeddings at once
embeddings = hf.embed_many(sentences, as_buffer=True)
```

### VertexAI

[VertexAI](https://cloud.google.com/vertex-ai/docs/generative-ai/embeddings/get-text-embeddings) is GCP's fully-featured AI platform, which includes a number of pretrained LLMs. RedisVL supports using VertexAI to create embeddings from these models. To use VertexAI, you will first need to install the ``google-cloud-aiplatform`` library.

```bash
pip install google-cloud-aiplatform>=1.26
```

Then you need to gain access to a [Google Cloud Project](https://cloud.google.com/gcp?hl=en) and provide [access to credentials](https://cloud.google.com/docs/authentication/application-default-credentials). This is accomplished by setting the `GOOGLE_APPLICATION_CREDENTIALS` environment variable pointing to the path of a JSON key file downloaded from your service account on GCP.

Finally, you need to find your [project ID](https://support.google.com/googleapi/answer/7014113?hl=en) and [geographic region for VertexAI](https://cloud.google.com/vertex-ai/docs/general/locations).


**Make sure the following env vars are set:**

```bash
GOOGLE_APPLICATION_CREDENTIALS=<path to your gcp JSON creds>
GCP_PROJECT_ID=<your gcp project id>
GCP_LOCATION=<your gcp geo region for vertex ai>
```

```python
from redisvl.vectorize.text import VertexAITextVectorizer

# create a vectorizer
vtx = VertexAITextVectorizer()

# embed a sentence
test = vtx.embed("This is a test sentence.")
test[:10]

[0.04373306408524513,
 -0.05040992051362991,
 -0.011946038343012333,
 -0.043528858572244644,
 0.021510830149054527,
 0.028604144230484962,
 0.014770914800465107,
 -0.01610461436212063,
 -0.0036560404114425182,
 0.013746795244514942]
```
### Cohere

[Cohere](https://dashboard.cohere.ai/) allows you to implement language AI in your product. The `CohereTextVectorizer` makes it simple to use RedisVL with the embedding models at Cohere. For this, you will need to install `cohere`.

```bash
pip install cohere
```

```python
import getpass
# set up the API Key
api_key = os.environ.get("COHERE_API_KEY") or getpass.getpass("Enter your Cohere API key: ")
```

Special attention needs to be paid to the `input_type` parameter for each `embed` call. For example, for embedding 
queries, you should set `input_type='search_query'`; for embedding documents, set `input_type='search_document'`. See
more information [here](https://docs.cohere.com/reference/embed).

```python
from redisvl.vectorize.text import CohereTextVectorizer

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

Vector dimensions:  1024
[-0.010856628, -0.019683838, -0.0062179565, 0.003545761, -0.047943115, 0.0009365082, -0.005924225, 0.016174316, -0.03289795, 0.049194336]
```

## Search with provider embeddings

Now that you've created your embeddings, you can use them to search for similar sentences. You will use the same three sentences from above and search for similar sentences.

First, create the schema for your index.

Here's what the schema for the example looks like in YAML for the HuggingFace vectorizer:

```yaml
index:
    name: providers
    prefix: rvl
    storage_type: hash
    key_separator: ':'

fields:
    text:
        - name: sentence
    vector:
        - name: embedding
          dims: 768
          algorithm: flat
          distance_metric: cosine
```

```python
from redisvl.index import SearchIndex

# construct a search index from the schema
index = SearchIndex.from_yaml("./schema.yaml")

# connect to local redis instance
index.connect("redis://localhost:6379")

# create the index (no data yet)
index.create(overwrite=True)
```


```python
# use the CLI to see the created index
!rvl index listall

22:02:27 [RedisVL] INFO   Indices:
22:02:27 [RedisVL] INFO   1. providers
```

```python
# load expects an iterable of dictionaries where
# the vector is stored as a bytes buffer

data = [{"text": t,
         "embedding": v}
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

That is a happy dog 0.160862326622
That is a happy person 0.273598492146
Today is a sunny day 0.744559407234
```

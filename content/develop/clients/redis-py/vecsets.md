---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- oss
- kubernetes
- clients
description: Index and query embeddings with Redis vector sets
linkTitle: Vector set embeddings
title: Vector set embeddings
weight: 40
bannerText: Vector set is a new data type that is currently in preview and may be subject to change.
bannerChildren: true
---

A Redis [vector set]({{< relref "/develop/data-types/vector-sets" >}}) lets
you store a set of unique keys, each with its own associated vector.
You can then retrieve keys from the set according to the similarity between
their stored vectors and a query vector that you specify.

You can use vector sets to store any type of numeric vector but they are
particularly optimized to work with text embedding vectors (see
[Redis for AI]({{< relref "/develop/ai" >}}) to learn more about text
embeddings). The example below shows how to use the
[`sentence-transformers`](https://pypi.org/project/sentence-transformers/)
library to generate vector embeddings and then
store and retrieve them using a vector set with `redis-py`.

## Initialize

Start by installing the preview version of `redis-py` with the following
command:

```bash
pip install redis==6.0.0b2
```

Also, install `sentence-transformers`:

```bash
pip install sentence-transformers
```

In a new Python file, import the required classes:

```python
from sentence_transformers import SentenceTransformer

import redis
import numpy as np
```

The first of these imports is the
`SentenceTransformer` class, which generates an embedding from a section of text.
This example uses an instance of `SentenceTransformer` with the
[`all-MiniLM-L6-v2`](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
model for the embeddings. This model generates vectors with 384 dimensions, regardless
of the length of the input text, but note that the input is truncated to 256
tokens (see
[Word piece tokenization](https://huggingface.co/learn/nlp-course/en/chapter6/6)
at the [Hugging Face](https://huggingface.co/) docs to learn more about the way tokens
are related to the original text).

```python
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
```

## Create the data

The example data is contained a dictionary with some brief
descriptions of famous people:

```python
peopleData = {
    "Marie Curie": {
        "born": 1867, "died": 1934,
        "description": """
        Polish-French chemist and physicist. The only person ever to win
        two Nobel prizes for two different sciences.
        """
    },
    "Linus Pauling": {
        "born": 1901, "died": 1994,
        "description": """
        American chemist and peace activist. One of only two people to win two
        Nobel prizes in different fields (chemistry and peace).
        """
    },
    "Freddie Mercury": {
        "born": 1946, "died": 1991,
        "description": """
        British musician, best known as the lead singer of the rock band
        Queen.
        """
    },
    "Marie Fredriksson": {
        "born": 1958, "died": 2019,
        "description": """
        Swedish multi-instrumentalist, mainly known as the lead singer and
        keyboardist of the band Roxette.
        """
    },
    "Paul Erdos": {
        "born": 1913, "died": 1996,
        "description": """
        Hungarian mathematician, known for his eccentric personality almost
        as much as his contributions to many different fields of mathematics.
        """
    },
    "Maryam Mirzakhani": {
        "born": 1977, "died": 2017,
        "description": """
        Iranian mathematician. The first woman ever to win the Fields medal
        for her contributions to mathematics.
        """
    },
    "Masako Natsume": {
        "born": 1957, "died": 1985,
        "description": """
        Japanese actress. She was very famous in Japan but was primarily
        known elsewhere in the world for her portrayal of Tripitaka in the
        TV series Monkey.
        """
    },
    "Chaim Topol": {
        "born": 1935, "died": 2023,
        "description": """
        Israeli actor and singer, usually credited simply as 'Topol'. He was
        best known for his many appearances as Tevye in the musical Fiddler
        on the Roof.
        """
    }
}
```

## Add the data to a vector set

The next step is to connect to Redis and add the data to a new vector set.

The code below uses the dictionary's
[`items()`](https://docs.python.org/3/library/stdtypes.html#dict.items)
view to iterate through all the key-value pairs and add corresponding
elements to a vector set called `famousPeople`.

Use the
[`encode()`](https://sbert.net/docs/package_reference/sentence_transformer/SentenceTransformer.html#sentence_transformers.SentenceTransformer.encode)
method of `SentenceTransformer` to generate the
embedding as an array of `float32` values. The `tobytes()` method converts
the array to a byte string that you can pass to the
[`vadd()`]({{< relref "/commands/vadd" >}}) command to set the embedding.
Note that `vadd()` can also accept a list of `float` values to set the
vector, but the byte string format is more compact and saves a little
transmission time. If you later use
[`vemb()`]({{< relref "/commands/vemb" >}}) to retrieve the embedding,
it will return the vector as an array rather than the original byte
string (note that this is different from the behavior of byte strings in
[hash vector indexing]({{< relref "/develop/interact/search-and-query/advanced-concepts/vectors" >}})).

The call to `vadd()` also adds the `born` and `died` values from the
original dictionary as attribute data. You can access this during a query
or by using the [`vgetattr()`]({{< relref "/commands/vgetattr" >}}) method.

```py
r = redis.Redis(decode_responses=True)

for name, details in peopleData.items():
    emb = model.encode(details["description"]).astype(np.float32).tobytes()

    r.vset().vadd(
        "famousPeople",
        emb,
        name,
        attributes={
            "born": details["born"],
            "died": details["died"]
        }
    )
```

## Query the vector set

You can now query the data in the set. The basic approach is to use the
`encode()` method to generate another embedding vector for the query text.
(This is the same method used to add the elements to the set.) Then, pass
the query vector to [`vsim()`]({{< relref "/commands/vsim" >}}) to return elements
of the set, ranked in order of similarity to the query.

Start with a simple query for "actors":

```py
query_value = "actors"

actors_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes(),
)

print(f"'actors': {actors_results}")
```

This returns the following list of elements (formatted slightly for clarity):

```
'actors': ['Masako Natsume', 'Chaim Topol', 'Linus Pauling',
'Marie Fredriksson', 'Maryam Mirzakhani', 'Marie Curie',
'Freddie Mercury', 'Paul Erdos']
```

The first two people in the list are the two actors, as expected, but none of the
people from Linus Pauling onward was especially well-known for acting (and there certainly
isn't any information about that in the short description text).
As it stands, the search attempts to rank all the elements in the set, based
on the information contained in the embedding model.
You can use the `count` parameter of `vsim()` to limit the list of elements
to just the most relevant few items:

```py
query_value = "actors"

two_actors_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes(),
    count=2
)

print(f"'actors (2)': {two_actors_results}")
# >>> 'actors (2)': ['Masako Natsume', 'Chaim Topol']
```

The reason for using text embeddings rather than simple text search
is that the embeddings represent semantic information. This allows a query
to find elements with a similar meaning even if the text is
different. For example, the word "entertainer" doesn't appear in any of the
descriptions but if you use it as a query, the actors and musicians are ranked
highest in the results list:

```py
query_value = "entertainer"

entertainer_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes()
)

print(f"'entertainer': {entertainer_results}")
# >>> 'entertainer': ['Chaim Topol', 'Freddie Mercury',
# >>> 'Marie Fredriksson', 'Masako Natsume', 'Linus Pauling',
# 'Paul Erdos', 'Maryam Mirzakhani', 'Marie Curie']
```

Similarly, if you use "science" as a query, you get the following results:

```
'science': ['Marie Curie', 'Linus Pauling', 'Maryam Mirzakhani',
'Paul Erdos', 'Marie Fredriksson', 'Freddie Mercury', 'Masako Natsume',
'Chaim Topol']
```

The scientists are ranked highest but they are then followed by the
mathematicians. This seems reasonable given the connection between mathematics
and science.

You can also use
[filter expressions]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})
with `vsim()` to restrict the search further. For example,
repeat the "science" query, but this time limit the results to people
who died before the year 2000:

```py
query_value = "science"

science2000_results = r.vset().vsim(
    "famousPeople",
    model.encode(query_value).astype(np.float32).tobytes(),
    filter=".died < 2000"
)

print(f"'science2000': {science2000_results}")
# >>> 'science2000': ['Marie Curie', 'Linus Pauling',
# 'Paul Erdos', 'Freddie Mercury', 'Masako Natsume']
```

Note that the boolean filter expression is applied to items in the list
before the vector distance calculation is performed. Items that don't
pass the filter test are removed from the results completely, rather
than just reduced in rank. This can help to improve the performance of the
search because there is no need to calculate the vector distance for
elements that have already been filtered out of the search.

## More information

See the [vector sets]({{< relref "/develop/data-types/vector-sets" >}})
docs for more information and code examples. See the
[Redis for AI]({{< relref "/develop/ai" >}}) section for more details
about text embeddings and other AI techniques you can use with Redis.

You may also be interested in
[vector search]({{< relref "/develop/clients/redis-py/vecsearch" >}}).
This is a feature of the
[Redis query engine]({{< relref "/develop/interact/search-and-query" >}})
that lets you retrieve
[JSON]({{< relref "/develop/data-types/json" >}}) and
[hash]({{< relref "/develop/data-types/hashes" >}}) documents based on
vector data stored in their fields.

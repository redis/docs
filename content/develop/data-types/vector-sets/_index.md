---
aliases:
- /data-types/vector-sets/
- /manual/data-types/vector-sets/
- /develop/data-types/vector-set/
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
description: Introduction to Redis vector sets
linkTitle: Vector sets
title: Redis vector sets
weight: 130
---

{{< command-group group="module" url_group="vector_set" title="Vector set command summary" show_link=true >}}

Vector sets are a data type similar to sorted sets, but instead of a score, vector set elements have a string representation of a vector.
Vector sets allow you to add items to a set, and then either:

* retrieve a subset of items that are the most similar to a specified vector, or
* retrieve a subset of items that are the most similar to the vector of an element that is already part of the vector set.

Vector sets also provide for optional [filtered search](/content/develop/data-types/vector-sets/filtered-search.md). You can associate attributes with all or some elements in a vector set, and then use the `FILTER` option of the [`VSIM`](/content/commands/vsim.md) command to retrieve items similar to a given vector while applying simple mathematical filters to those attributes. Here's a sample filter: `".year > 1950"`.

## Endianness considerations for FP32 format

When using the FP32 blob format with vector set commands like [`VADD`](/content/commands/vadd.md) and [`VSIM`](/content/commands/vsim.md), the binary data must be encoded in little-endian byte order. This is important for cross-platform compatibility, as some ARM variants and other architectures may use different endianness.

If your platform uses big-endian or mixed-endian encoding, you have two options:
- Manually convert the byte order to little-endian before passing the blob to Redis.
- Use the `VALUES` syntax instead, which accepts floating-point numbers as strings and is platform-independent.

## Examples

The following examples give an overview of how to use vector sets. For clarity,
we will use a set of two-dimensional vectors that represent points in the
Cartesian coordinate plane. However, in real use cases, the vectors will typically
represent *text embeddings* and have hundreds of dimensions. See
[Redis for AI](/content/develop/ai/_index.md) for more information about using text
embeddings.

The points we will use are A: (1.0, 1.0), B: (-1.0, -1.0), C: (-1.0, 1.0), D: (1.0. -1.0), and
E: (1.0, 0), shown in the diagram below.

{{<image filename="images/vecsets/VecSetExamplePoints.drawio.svg" alt="Example points on the coordinate plane." width="400px">}}

### Basic operations

Start by adding the point vectors to a set called `points` using
[`VADD`](/content/commands/vadd.md). This also creates the vector set object.
The [`TYPE`](/content/commands/type.md) command returns a type of `vectorset`
for this object.

{{< clients-example set="vecset_tutorial" step="vadd" description="Foundational: Use VADD to create a new vector set and populate it with vectors" prereq="true" >}}
> VADD points VALUES 2 1.0 1.0 pt:A
(integer) 1
> VADD points VALUES 2 -1.0 -1.0 pt:B
(integer) 1
> VADD points VALUES 2 -1.0 1.0 pt:C
(integer) 1
> VADD points VALUES 2 1.0 -1.0 pt:D
(integer) 1
> VADD points VALUES 2 1.0 0 pt:E
(integer) 1
> TYPE points
vectorset
{{< /clients-example >}}


Get the number of elements in the set (also known as the *cardinality* of the set)
using [`VCARD`](/content/commands/vcard.md) and the number of dimensions of
the vectors using [`VDIM`](/content/commands/vdim.md):

{{< clients-example set="vecset_tutorial" step="vcardvdim" description="Metadata retrieval: Use VCARD to get the number of elements and VDIM to get vector dimensions when you need to inspect vector set properties" buildsUpon="vadd" needs_prereq="true" >}}
> VCARD points
(integer) 5
> VDIM points
(integer) 2
{{< /clients-example >}}

Get the coordinate values from the elements using [`VEMB`](/content/commands/vemb.md).
Note that the values will not typically be the exact values you supplied when you added
the vector because
[quantization](/content/develop/data-types/vector-sets/performance.md#quantization-effects)
is applied to improve performance.

{{< clients-example set="vecset_tutorial" step="vemb" description="Vector retrieval: Use VEMB to retrieve the approximate vector values of elements when you need to inspect the actual vector data stored in the set" buildsUpon="vadd" needs_prereq="true" >}}
> VEMB points pt:A
1) "0.9999999403953552"
2) "0.9999999403953552"
> VEMB points pt:B
1) "-0.9999999403953552"
2) "-0.9999999403953552"
> VEMB points pt:C
1) "-0.9999999403953552"
2) "0.9999999403953552"
> VEMB points pt:D
1) "0.9999999403953552"
2) "-0.9999999403953552"
> VEMB points pt:E
1) "1"
2) "0"
{{< /clients-example >}}

Remove an unwanted element with [`VREM`](/content/commands/vrem.md)

{{< clients-example set="vecset_tutorial" step="vrem" description="Element removal: Use VREM to delete elements from a vector set when you need to remove vectors from the collection" buildsUpon="vadd" needs_prereq="true" >}}
> VADD points VALUES 2 0 0 pt:F
(integer) 1
> VCARD points
(integer) 6
> VREM points pt:F
(integer) 1
> VCARD points
(integer) 5
{{< /clients-example >}}

Set and retrieve an element's JSON attribute data using
[`VSETATTR`](/content/commands/vsetattr.md)
and [`VGETATTR`](/content/commands/vgetattr.md). You can also pass an empty string
to `VSETATTR` to delete the attribute data:

{{< clients-example set="vecset_tutorial" step="attr" description="Attribute management: Use VSETATTR to store JSON attributes on elements and VGETATTR to retrieve them when you need to associate metadata with vectors" buildsUpon="vadd" needs_prereq="true" >}}
> VSETATTR points pt:A "{\"name\": \"Point A\", \"description\": \"First point added\"}"
(integer) 1
> VGETATTR points pt:A
"{\"name\": \"Point A\", \"description\": \"First point added\"}"
> VSETATTR points pt:A ""
(integer) 1
> VGETATTR points pt:A
(nil)
{{< /clients-example >}}

### Vector similarity search

Use [`VSIM`](/content/commands/vsim.md) to rank the points in order of their vector distance from a sample point:

{{< clients-example set="vecset_tutorial" step="vsim_basic" description="Similarity search: Use VSIM to find elements most similar to a query vector when you need to perform vector similarity searches" difficulty="intermediate" buildsUpon="vadd" needs_prereq="true" >}}
> VSIM points values 2 0.9 0.1
1) "pt:E"
2) "pt:A"
3) "pt:D"
4) "pt:C"
5) "pt:B"
{{< /clients-example >}}

Find the four elements that are closest to point A and show their distance "scores":

{{< clients-example set="vecset_tutorial" step="vsim_options" description="Similarity with options: Use VSIM with ELE, WITHSCORES, and COUNT options to find similar elements with scores and limits when you need detailed similarity results" difficulty="intermediate" buildsUpon="vadd" needs_prereq="true" >}}
> VSIM points ELE pt:A WITHSCORES COUNT 4
1) "pt:A"
2) "1"
3) "pt:E"
4) "0.8535534143447876"
5) "pt:C"
6) "0.5"
7) "pt:D"
8) "0.5"
{{< /clients-example >}}

Add some JSON attributes and use
[filter expressions](/content/develop/data-types/vector-sets/filtered-search.md)
to include them in the search:

{{< clients-example set="vecset_tutorial" step="vsim_filter" description="Filtered similarity search: Use VSIM with FILTER option to apply attribute-based conditions to similarity results when you need to combine vector similarity with attribute filtering" difficulty="advanced" buildsUpon="vadd" needs_prereq="true" >}}
> VSETATTR points pt:A "{\"size\":\"large\",\"price\": 18.99}"
(integer) 1
> VSETATTR points pt:B "{\"size\":\"large\",\"price\": 35.99}"
(integer) 1
> VSETATTR points pt:C "{\"size\":\"large\",\"price\": 25.99}"
(integer) 1
> VSETATTR points pt:D "{\"size\":\"small\",\"price\": 21.00}"
(integer) 1
> VSETATTR points pt:E "{\"size\":\"small\",\"price\": 17.75}"
(integer) 1

# Return elements in order of distance from point A whose
# `size` attribute is `large`.
> VSIM points ELE pt:A FILTER '.size == "large"'
1) "pt:A"
2) "pt:C"
3) "pt:B"

# Return elements in order of distance from point A whose size is
# `large` and whose price is greater than 20.00.
> VSIM points ELE pt:A FILTER '.size == "large" && .price > 20.00'
1) "pt:C"
2) "pt:B"
{{< /clients-example >}}
&nbsp;
> [!NOTE] Try it out
> Experiment with vector set commands interactively in the [Redis playground](https://redis.io/try/sandbox) — no installation required.

## More information

See the other pages in this section to learn more about the features
and performance parameters of vector sets.

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
description: Introduction to Redis vector sets
linkTitle: Vector sets
title: Redis vector sets
weight: 55
---

Vector sets are a data type similar to sorted sets, but instead of a score, vector set elements have a string representation of a vector.
Vector sets allow you to add items to a set, and then either:

* retrieve a subset of items that are the most similar to a specified vector, or
* retrieve a subset of items that are the most similar to the vector of an element that is already part of the vector set.

Vector sets also provide for optional [filtered search]({{< relref "/develop/data-types/vector-sets/filtered-search" >}}). You can associate attributes with all or some elements in a vector set, and then use the `FILTER` option of the [`VSIM`]({{< relref "/commands/vsim" >}}) command to retrieve items similar to a given vector while applying simple mathematical filters to those attributes. Here's a sample filter: `".year > 1950"`.

The following commands are available for vector sets:

- [VADD]({{< relref "/commands/vadd" >}}) - add an element to a vector set, creating a new set if it didn't already exist.
- [VCARD]({{< relref "/commands/vcard" >}}) - retrieve the number of elements in a vector set.
- [VDIM]({{< relref "/commands/vdim" >}}) - retrieve the dimension of the vectors in a vector set.
- [VEMB]({{< relref "/commands/vemb" >}}) - retrieve the approximate vector associated with a vector set element.
- [VGETATTR]({{< relref "/commands/vgetattr" >}}) - retrieve the attributes of a vector set element.
- [VINFO]({{< relref "/commands/vinfo" >}}) - retrieve metadata and internal details about a vector set, including size, dimensions, quantization type, and graph structure.
- [VISMEMBER]({{< relref "/commands/vismember" >}}) - check if an element exists in a vector set.
- [VLINKS]({{< relref "/commands/vlinks" >}}) - retrieve the neighbors of a specified element in a vector set; the connections for each layer of the HNSW graph.
- [VRANDMEMBER]({{< relref "/commands/vrandmember" >}}) - retrieve random elements of a vector set.
- [VREM]({{< relref "/commands/vrem" >}}) - remove an element from a vector set.
- [VSETATTR]({{< relref "/commands/vsetattr" >}}) - set or replace attributes on a vector set element.
- [VSIM]({{< relref "/commands/vsim" >}}) - retrieve elements similar to a given vector or element with optional filtering.

## Endianness considerations for FP32 format

When using the FP32 blob format with vector set commands like [`VADD`]({{< relref "/commands/vadd" >}}) and [`VSIM`]({{< relref "/commands/vsim" >}}), the binary data must be encoded in little-endian byte order. This is important for cross-platform compatibility, as some ARM variants and other architectures may use different endianness.

If your platform uses big-endian or mixed-endian encoding, you have two options:
- Manually convert the byte order to little-endian before passing the blob to Redis.
- Use the `VALUES` syntax instead, which accepts floating-point numbers as strings and is platform-independent.

## Examples

The following examples give an overview of how to use vector sets. For clarity,
we will use a set of two-dimensional vectors that represent points in the
Cartesian coordinate plane. However, in real use cases, the vectors will typically
represent *text embeddings* and have hundreds of dimensions. See
[Redis for AI]({{< relref "/develop/ai" >}}) for more information about using text
embeddings.

The points we will use are A: (1.0, 1.0), B: (-1.0, -1.0), C: (-1.0, 1.0), D: (1.0. -1.0), and
E: (1.0, 0), shown in the diagram below.

{{<image filename="images/vecsets/VecSetExamplePoints.drawio.svg" alt="Example points on the coordinate plane." width="400px">}}

### Basic operations

Start by adding the point vectors to a set called `points` using
[`VADD`]({{< relref "/commands/vadd" >}}). This also creates the vector set object.
The [`TYPE`]({{< relref "/commands/type" >}}) command returns a type of `vectorset`
for this object.

{{< clients-example vecset_tutorial vadd >}}
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
using [`VCARD`]({{< relref "/commands/vcard" >}}) and the number of dimensions of
the vectors using [`VDIM`]({{< relref "/commands/vdim" >}}):

{{< clients-example vecset_tutorial vcardvdim >}}
> VCARD points
(integer) 5
> VDIM points
(integer) 2
{{< /clients-example >}}

Get the coordinate values from the elements using [`VEMB`]({{< relref "/commands/vemb" >}}).
Note that the values will not typically be the exact values you supplied when you added
the vector because
[quantization]({{< relref "/develop/data-types/vector-sets/performance#quantization-effects" >}})
is applied to improve performance.

{{< clients-example vecset_tutorial vemb >}}
> VEMB points pt:A
1) "0.9999999403953552"
2) "0.9999999403953552"
9> VEMB points pt:B
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

Set and retrieve an element's JSON attribute data using
[`VSETATTR`]({{< relref "/commands/vsetattr" >}})
and [`VGETATTR`]({{< relref "/commands/vgetattr" >}}). You can also pass an empty string
to `VSETATTR` to delete the attribute data:

{{< clients-example vecset_tutorial attr >}}
> VSETATTR points pt:A "{\"name\": \"Point A\", \"description\": \"First point added\"}" 
(integer) 1
> VGETATTR points pt:A
"{\"name\": \"Point A\", \"description\": \"First point added\"}"
> VSETATTR points pt:A "" 
(integer) 1
> VGETATTR points pt:A
(nil)
{{< /clients-example >}}

Remove an unwanted element with [`VREM`]({{< relref "/commands/vrem" >}})

{{< clients-example vecset_tutorial vrem >}}
> VADD points VALUES 2 0 0 pt:F
(integer) 1
127.0.0.1:6379> VCARD points
(integer) 6
127.0.0.1:6379> VREM points pt:F
(integer) 1
127.0.0.1:6379> VCARD points
(integer) 5
{{< /clients-example >}}

### Vector similarity search

Use [`VSIM`]({{< relref "/commands/vsim" >}}) to rank the points in order of their vector distance from a sample point:

{{< clients-example vecset_tutorial vsim_basic >}}
> VSIM points values 2 0.9 0.1
1) "pt:E"
2) "pt:A"
3) "pt:D"
4) "pt:C"
5) "pt:B"
{{< /clients-example >}}

Find the four elements that are closest to point A and show their distance "scores":

{{< clients-example vecset_tutorial vsim_options >}}
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
[filter expressions]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})
to include them in the search:

{{< clients-example vecset_tutorial vsim_filter >}}
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

## More information

See the other pages in this section to learn more about the features
and performance parameters of vector sets.

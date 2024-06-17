---
Title: Graph
alwaysopen: false
bannerChildren: true
bannerText: Redis, Inc. has announced the end of life of RedisGraph. We will carry
  out the process gradually and in accordance with our commitment to our customers.
  See [details](https://redis.io/blog/redisgraph-eol/).
categories:
- docs
- operate
- stack
description: RedisGraph is a queryable graph database built on Redis.
hideListLinks: true
linkTitle: Graph
toc: 'true'
weight: 40
---
RedisGraph is the first queryable [Property Graph](https://github.com/opencypher/openCypher/blob/master/docs/property-graph-model.adoc) database to use [sparse matrices](https://en.wikipedia.org/wiki/Sparse_matrix) to represent the [adjacency matrix](https://en.wikipedia.org/wiki/Adjacency_matrix) in graphs and [linear algebra](http://faculty.cse.tamu.edu/davis/GraphBLAS.html) to query the graph.

## Primary features

- Based on the [Property Graph Model](https://github.com/opencypher/openCypher/blob/master/docs/property-graph-model.adoc)
    - Nodes (vertices) and Relationships (edges) that may have attributes
    - Nodes that can be labeled
    - Relationships have a relationship type
- Graphs represented as sparse adjacency matrices
- [Cypher](http://www.opencypher.org/) as query language
    - Cypher queries translated into linear algebra expressions

## Commands

See [Graph commands]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph/commands" >}}) for a list of graph commands that are supported in Redis Enterprise.

## Clients

For a list of available RedisGraph clients, see [RedisGraph client libraries](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/clients.md).

## Configuration

See [Configuration parameters](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/configuration.md) for the complete list of RedisGraph configuration parameters.

To learn which configuration parameters are supported in Redis Enterprise, see [Graph configuration compatibility with Redis Enterprise]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph/config" >}}).

## Design

For an overview of RedisGraph's design, see [RedisGraph: A High Performance In-Memory Graph Database](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/design/_index.md).

### Client specification

RedisGraph client libraries should follow the [Technical specification for writing RedisGraph client libraries](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/design/client_spec.md).

### Result set structure

[RedisGraph result set structure](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/design/result_structure.md) describes the format RedisGraph uses to print data when using `redis-cli`.

### GRAPH.BULK endpoint

You can import new graphs from CSV files using `redisgraph-bulk-loader`.

See the [`GRAPH.BULK` implementation details](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/design/bulk_spec.md) for more information.

## Data types

RedisGraph supports a number of distinct data types, including:

- Graph types:
    - Nodes
    - Relationships
    - Paths

- Scalar types:
    - Strings
    - Booleans
    - Integers
    - Floating-point values
    - Geospatial points
    - Null
  
- Collection types:
    - Arrays
    - Maps

See [RedisGraph data types](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/datatypes.md) for details.

## Cypher coverage

RedisGraph implements a subset of the Cypher language. See [Cypher coverage](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/cypher_support.md) for more information.

## Path algorithms

To learn how to find single-pair and single-source paths using `algo.SPpaths` and `algo.SSpaths`, see [Path algorithms](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/path_algorithm.md).

## Known limitations

RedisGraph has several [known limitations](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/known_limitations.md).

## More info

- [Graph quick start]({{< relref "/operate/oss_and_stack/stack-with-enterprise/deprecated-features/graph/graph-quickstart" >}})

- [RedisGraph documentation on GitHub](https://github.com/RedisGraph/RedisGraph/tree/master/docs/docs)

- [References](https://github.com/RedisGraph/RedisGraph/blob/master/docs/docs/References.md)

- [RedisGraph source](https://github.com/RedisGraph/RedisGraph/)

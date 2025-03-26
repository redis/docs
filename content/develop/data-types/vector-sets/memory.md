---
categories:
- docs
- develop
- stack
- rs
- rc
- oss
- kubernetes
- clients
description: Learn how to optimize memory consumption in Redis vector sets
linkTitle: Memory optimization
title: Memory optimization
weight: 25
---

## Overview

Redis vector sets are efficient, but vector similarity indexing and graph traversal come with memory tradeoffs. This guide helps you manage memory use through quantization, graph tuning, and attribute choices.

## Quantization modes

Vector sets support three quantization levels:

| Mode       | Memory usage  | Recall | Notes                           |
|------------|---------------|--------|---------------------------------|
| `Q8`       | 4x smaller    | High   | Default, fast and accurate      |
| `BIN`      | 32x smaller   | Lower  | Fastest, best for coarse search |
| `NOQUANT`  | Full size     | Highest| Best precision, slowest         |

Use `Q8` unless your use case demands either ultra-precision (use `NOQUANT`) or ultra-efficiency (use `BIN`).

## Graph structure memory

HNSW graphs store multiple connections per node. Each node:

- Has an average of `M * 2 + M * 0.33` pointers (default M = 16).
- Stores pointers using 8 bytes each.
- Allocates ~1.33 layers per node.

> A single node with M = 64 may consume ~1 KB in links alone.

To reduce memory:

- Lower `M` to shrink per-node connections.
- Avoid unnecessarily large values for `M` unless recall needs to be improved.

## Attribute and label size

Each node stores:

- A string label (element name)
- Optional JSON attribute string

Tips:

- Use short, fixed-length strings for labels.
- Keep attribute JSON minimal and flat. For example, use `{"year":2020}` instead of nested data.

## Vector dimension

High-dimensional vectors increase storage:

- 300 components at `FP32` = 1200 bytes/vector
- 300 components at `Q8` = 300 bytes/vector

You can reduce this using the `REDUCE` option during [`VADD`]({{< relref "/commands/vadd" >}}), which applies random projection.

```bash
VADD vset REDUCE 100 VALUES 300 ... item1
```

This projects a 300-dimensional vector into 100 dimensions, reducing size and improving speed at the cost of some recall.

## Summary

| Strategy            | Effect                                   |
|---------------------|------------------------------------------|
| Use `Q8`            | Best tradeoff for most use cases         |
| Use `BIN`           | Minimal memory, fastest search           |
| Lower `M`           | Shrinks HNSW link graph size             |
| Reduce dimensions   | Cuts memory per vector                   |
| Minimize JSON       | Smaller attributes, less memory per node |

## See also

- [Performance]({{< relref "/develop/data-types/vector-sets/performance" >}})
- [Installation]({{< relref "/develop/data-types/vector-sets/install" >}})
- [Scalability]({{< relref "/develop/data-types/vector-sets/scalability" >}})

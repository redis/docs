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
description: Vector compression and quantization for efficient memory usage and search performance
linkTitle: Vector Compression & Quantization
title: Vector Compression and Quantization Techniques
weight: 2
---

Efficient management of high-dimensional vector data is crucial for scalable search and retrieval. Advanced methods for vector compression and quantization—such as LVQ (Locally-Adaptive Vector Quantization) and LeanVec—can dramatically optimize memory usage and improve search speed, without sacrificing too much accuracy. This page describes practical approaches to compressing and quantizing vectors for scalable search.

{{< warning >}}
Some advanced vector compression features may depend on hardware or Intel's proprietary optimizations. On platforms without these capabilities, generic compression methods will be used, possibly with reduced performance.
{{< /warning >}}

## Compression and Quantization Techniques

### LVQ (Locally-Adaptive Vector Quantization)

* **Method:** Applies per-vector normalization and scalar quantization, learning parameters directly from the data.
* **Advantages:**
    * Enables fast, on-the-fly distance computations.
    * SIMD-optimized layout for efficient search.
    * Learns compression parameters from representative vectors.
* **Variants:**
    * **LVQ4x4:** 8 bits per dimension, fast search, large memory savings.
    * **LVQ8:** Faster ingestion, slower search.
    * **LVQ4x8:** Two-level quantization for improved recall.

### LeanVec

* **Method:** Combines dimensionality reduction with LVQ, applying quantization after reducing vector dimensions.
* **Advantages:**
    * Best suited for high-dimensional vectors.
    * Significant speed and memory improvements.
* **Variants:**
    * **LeanVec4x8:** Recommended for high-dimensional datasets, fastest search and ingestion.
    * **LeanVec8x8:** Improved recall when more granularity is needed.
* **LeanVec Dimension:** For faster search and lower memory usage, reduce the dimension further by using the optional `REDUCE` argument. The default is typically `input dimension / 2`, but more aggressive reduction (such as `dimension / 4`) is possible for greater efficiency.

## Choosing a compression type

| Compression type      | Best for                                        | Observations                                            |
|----------------------|--------------------------------------------------|---------------------------------------------------------|
| LVQ4x4               | Fast search and low memory use                   | Consider LeanVec for even faster search                 |
| LeanVec4x8           | Fastest search and ingestion                     | LeanVec dimensionality reduction might reduce recall    |
| LVQ4                 | Maximum memory saving                            | Recall might be insufficient                            |
| LVQ8                 | Faster ingestion than LVQ4x4                     | Search likely slower than LVQ4x4                        |
| LeanVec8x8           | Improved recall when LeanVec4x8 is insufficient  | LeanVec dimensionality reduction might reduce recall    |
| LVQ4x8               | Improved recall when LVQ4x4 is insufficient      | Slightly worse memory savings                           |

## Two-level compression

Both LVQ and LeanVec support multi-level compression schemes. The first level compresses each vector to capture its main structure, while the second encodes residual errors for more precise re-ranking.

This two-level approach enables:

* Fast candidate retrieval using the first-level compressed vectors.
* High-accuracy re-ranking using second-level residuals.

The naming convention reflects the number of bits per dimension at each compression level.

### Naming convention: LVQ<B₁>x<B₂> or LeanVec<B₁>x<B₂>

* **B₁:** Bits per dimension for first-level quantization.
* **B₂:** Bits per dimension for second-level quantization (residual encoding).

#### Examples

* **LVQ4x8:**
    * First level: 4 bits per dimension.
    * Second level: 8 bits per dimension.
    * Total: 12 bits per dimension (across two stages).
* **LVQ8:**
    * Single-level compression.
    * 8 bits per dimension.
    * No second-level residuals.
* **LeanVec4x8:**  
    * Dimensionality reduction followed by LVQ4x8 scheme.

## Learning Compression Parameters from Vector Data

The effectiveness of LVQ and LeanVec compression relies on adapting to the structure of input vectors. Learning parameters directly from data leads to more accurate and efficient search.

### Practical Considerations

* **Initial Training Requirement:**  
    A minimum number of representative vectors is needed during index initialization to train the compression parameters (see [TRAINING_THRESHOLD]({{< relref "/develop/ai/search-and-query/vectors/#svs-vamana-index" >}})).
* **Handling Data Drift:**  
    If incoming vector characteristics change significantly over time (data distribution shift), compression quality may degrade—a general limitation of all data-dependent methods.

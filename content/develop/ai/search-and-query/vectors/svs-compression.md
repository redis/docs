---
aliases:

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
description: Vector quantization and compression for efficient memory usage and search performance
linkTitle: Quantization and compression
title: Vector quantization and compression
weight: 2
---

Efficient management of high-dimensional vector data is crucial for scalable search and retrieval. Advanced methods for vector quantization and compression, such as LVQ (Locally-adaptive Vector Quantization) and LeanVec, can dramatically optimize memory usage and improve search speed, without sacrificing much accuracy. This page describes practical approaches to quantizing and compressing vectors for scalable search.

{{< warning >}}
Some advanced vector compression features may depend on hardware or Intel's proprietary optimizations. Intel's proprietary LVQ and LeanVec optimizations are not available in Redis Open Source. On non-Intel platforms and Redis Open Source platforms, `SVS-VAMANA` with `COMPRESSION` will fall back to basic, 8-bit scalar quantization implementation: all values in a vector are scaled using the global minimum and maximum, and then each dimension is quantized independently into 256 levels using 8-bit precision.
{{< /warning >}}

## Quantization and compression techniques

### LVQ (Locally-adaptive Vector Quantization)

* **Method:** Applies per-vector normalization and scalar quantization; learns parameters directly from the data.
* **Advantages:**
    * Enables fast, on-the-fly distance computations.
    * SIMD-optimized layout for efficient search.
    * Learns compression parameters from representative vectors.
* **Variants:**
    * **LVQ4x4:** 8 bits per dimension, fast search, large memory savings.
    * **LVQ8:** Faster ingestion, slower search.
    * **LVQ4x8:** Two-level quantization for improved recall.

### LeanVec (LVQ with dimensionality reduction)

* **Method:** Combines dimensionality reduction with LVQ, applying quantization after reducing vector dimensions.
* **Advantages:**
    * Best suited for high-dimensional vectors.
    * Significant speed and memory improvements.
* **Variants:**
    * **LeanVec4x8:** Recommended for high-dimensional datasets, fastest search and ingestion.
    * **LeanVec8x8:** Improved recall when more granularity is needed.
* **LeanVec Dimension:** For faster search and lower memory usage, reduce the dimension further by using the optional `REDUCE` argument. The default is typically `input dimension / 2`, but more aggressive reduction (such as `input dimension / 4`) is possible for greater efficiency.

## Choosing a compression type

| Compression type     | Best for                                         | Observations                                            |
|----------------------|--------------------------------------------------|---------------------------------------------------------|
| LVQ4x4               | Fast search and low memory use                   | Consider LeanVec for even faster search                 |
| LeanVec4x8           | Fastest search and ingestion                     | LeanVec dimensionality reduction might reduce recall    |
| LVQ4                 | Maximum memory saving                            | Recall might be insufficient                            |
| LVQ8                 | Faster ingestion than LVQ4x4                     | Search likely slower than LVQ4x4                        |
| LeanVec8x8           | Improved recall when LeanVec4x8 is insufficient  | LeanVec dimensionality reduction might reduce recall    |
| LVQ4x8               | Improved recall when LVQ4x4 is insufficient      | Slightly worse memory savings                           |

## Two-level compression

Both LVQ and LeanVec support two-level compression schemes. LVQ's two-level compression works by first quantizing each vector individually to capture its main structure, then encoding the residual error&mdash;the difference between the original and quantized vector&mdash;using a second quantization step. This allows fast search using only the first level, with the second level used for re-ranking to boost accuracy when needed.

Similarly, LeanVec uses a two-level approach: the first level reduces dimensionality and applies LVQ to speed up candidate retrieval, while the second level applies LVQ to the original high-dimensional vectors for accurate re-ranking.

Note that the original full-precision embeddings are never used by either LVQ or LeanVec, as both operate entirely on compressed representations.

This two-level approach allows for:

* Fast candidate retrieval using the first-level compressed vectors.
* High-accuracy re-ranking using the second-level residuals.

The naming convention used for the configurations reflects the number of bits allocated per dimension at each level of compression.

### Naming convention: LVQ<B₁>x<B₂>

* **B₁:** Number of bits per dimension used in the first-level quantization.
* **B₂:** Number of bits per dimension used in the second-level quantization (residual encoding).

#### Examples

* **LVQ4x8:**
    * First level: 4 bits per dimension.
    * Second level: 8 bits per dimension.
    * Total: 12 bits per dimension (used across two stages).
* **LVQ8:**
    * Single-level compression only.
    * 8 bits per dimension.
    * No second-level residuals.

Same notation is used for LeanVec.

## Learning compression parameters from vector data

The strong performance of LVQ and LeanVec stems from their ability to adapt to the structure of the input vectors. By learning compression parameters directly from the data, they achieve more accurate representations with fewer bits.

### What does this mean in practice?

* **Initial training requirement:**
    A minimum number of representative vectors is required during index initialization to train the compression parameters (see the [TRAINING_THRESHOLD]({{< relref "/develop/ai/search-and-query/vectors/#svs-vamana-index" >}}) parameter). A random sample from the dataset typically works well.
* **Handling data drift:**
    If the characteristics of incoming vectors change significantly over time (that is, a data distribution shift), compression quality may degrade. This is a general limitation of all data-dependent compression methods,not just LVQ and LeanVec. When the data no longer resembles the original training sample, the learned representation becomes less effective.

## Build Redis Open Source with Intel SVS support

By default, Redis Open Source with the Redis Query Engine supports SVS-VAMANA indexing with the global 8-bit quantisation. To compile Redis with the Intel SVS-VAMANA optimisations, LeanVec and LVQ, for Intel platforms, follow the instructions below.

{{< warning >}}
If you are using Redis Open Source under the AGPLv3 or SSPLv1 licenses, you cannot use it together with the Intel Optimization binaries (LeanVec and LVQ). The reason is that the Intel SVS license is not compatible with those licenses.
The LeanVec and LVQ techniques are closed source and are only available for use with Redis Open Source when distributed under the RSALv2 license.
For more details, please refer to the [information provided by Intel](https://github.com/intel/ScalableVectorSearch).
{{< /warning >}}

### Build Redis Open Source

Follow the [Redis Open Source build instructions]({{< relref "/operate/oss_and_stack/install/build-stack" >}}). Before executing `make`, define the following environment variable.

```sh
export BUILD_INTEL_SVS_OPT=yes
```

Alternatively, you can define the `BUILD_INTEL_SVS_OPT` variable as part of the `make` command:

```sh
make BUILD_INTEL_SVS_OPT=yes
```

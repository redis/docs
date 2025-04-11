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
description: Learn how Redis vector sets behave under load and how to optimize for speed and recall
linkTitle: Performance
title: Performance
weight: 15
---

## Query performance

Vector similarity queries using the [`VSIM`]({{< relref "/commands/vsim" >}}) are threaded by default. Redis uses up to 32 threads to process these queries in parallel.

- `VSIM` performance scales nearly linearly with available CPU cores.
- Expect ~50,000 similarity queries per second for a 3M-item set with 300-dim vectors using int8 quantization.
- Performance depends heavily on the `EF` parameter:
  - Higher `EF` improves recall, but slows down search.
  - Lower `EF` returns faster results with reduced accuracy.

## Insertion performance

Inserting vectors with the [`VADD`]({{< relref "/commands/vadd" >}}) command is more computationally expensive than querying:

- Insertion is single-threaded by default.
- Use the `CAS` option to offload candidate graph search to a background thread.
- Expect a few thousand insertions per second on a single node.

## Quantization effects

Quantization greatly impacts both speed and memory:

- `Q8` (default): 4x smaller than `FP32`, high recall, high speed
- `BIN` (binary): 32x smaller than `FP32`, lower recall, fastest search
- `NOQUANT` (`FP32`): Full precision, slower performance, highest memory use

Use the quantization mode that best fits your tradeoff between precision and efficiency.
The examples below show how the different modes affect a simple vector.
Note that even with `NOQUANT` mode, the values change slightly,
due to floating point rounding.

{{< clients-example vecset_tutorial add_quant >}}
> VADD quantSetQ8 VALUES 2 1.262185 1.958231 quantElement Q8
(integer) 1
> VEMB quantSetQ8 quantElement
1) "1.2643694877624512"
2) "1.958230972290039"

> VADD quantSetNoQ VALUES 2 1.262185 1.958231 quantElement NOQUANT
(integer) 1
> VEMB quantSetNoQ quantElement
1) "1.262184977531433"
2) "1.958230972290039"

> VADD quantSetBin VALUES 2 1.262185 1.958231 quantElement BIN
(integer) 1
> VEMB quantSetBin quantElement
1) "1"
2) "1"
{{< /clients-example >}}

## Deletion performance

Deleting large vector sets using the [`DEL`]({{< relref "/commands/del" >}}) can cause latency spikes:

- Redis must unlink and restructure many graph nodes.
- Latency is most noticeable when deleting millions of elements.

## Save and load performance

Vector sets save and load the full HNSW graph structure:

- When reloading from disk is fast and there's no need to rebuild the graph.

Example: A 3M vector set with 300 components loads in ~15 seconds.

## Summary of tuning tips

| Factor     | Effect on performance               | Tip                                            |
|------------|-------------------------------------|------------------------------------------------|
| `EF`       | Slower queries but higher recall    | Start low (for example, 200) and tune upward           |
| `M`        | More memory per node, better recall | Use defaults unless recall is too low          |
| Quant type | Binary is fastest, `FP32` is slowest| Use `Q8` or `BIN` unless full precision needed |
| `CAS`      | Faster insertions with threading    | Use when high write throughput is needed       |

## See also

- [Memory usage]({{< relref "/develop/data-types/vector-sets/memory" >}})
- [Scalability]({{< relref "/develop/data-types/vector-sets/scalability" >}})
- [Filtered search]({{< relref "/develop/data-types/vector-sets/filtered-search" >}})

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
complexity: O(log(N)) for each element added, where N is the number of elements in the vector set.
description: Add a new element to a vector set, or update its vector if it already exists.
group: vector_set
hidden: false
linkTitle: VADD
since: 1.0.0
summary: Add a new element to a vector set, or update its vector if it already exists
syntax_fmt: "VADD key [REDUCE dim] FP32|VALUES vector element [CAS] [NOQUANT | Q8 | BIN]\n  [EF build-exploration-factor] [SETATTR <attributes>] [M <numlinks>]"
title: VADD
---

Add a new element into the vector set specified by the key. The vector can be provided as FP32 blob of values, or as floating point numbers as strings, prefixed by the number of elements (3 in the example):

```
VADD mykey VALUES 3 0.1 1.2 0.5 my-element
```


Meaning of the options:

REDUCE implements random projection, in order to reduce the dimensionality of the vector. The projection matrix is saved and reloaded along with the vector set. Please note that the REDUCE option must be passed immediately before the vector, like in REDUCE 50 VALUES ....

CAS performs the operation partially using threads, in a check-and-set style. The neighbor candidates collection, which is slow, is performed in the background, while the command is executed in the main thread.

NOQUANT forces the vector to be created (in the first VADD call to a given key) without integer 8 quantization, which is otherwise the default.

BIN forces the vector to use binary quantization instead of int8. This is much faster and uses less memory, but has impacts on the recall quality.

Q8 forces the vector to use signed 8 bit quantization. This is the default, and the option only exists in order to make sure to check at insertion time if the vector set is of the same format.

EF plays a role in the effort made to find good candidates when connecting the new node to the existing HNSW graph. The default is 200. Using a larger value, may help to have a better recall. To improve the recall it is also possible to increase EF during VSIM searches.

SETATTR associates attributes to the newly created entry or update the entry attributes (if it already exists). It is the same as calling the VSETATTR attribute separately, so please check the documentation of that command in the filtered search section of this documentation.

M defaults to 16 and is the HNSW famous M parameters. It is the maximum number of connections that each node of the graph have with other nodes: more connections mean more memory, but a better ability to explore the graph. Nodes at layer zero (every node exists at least at layer zero) have M*2 connections, while the other layers only have M connections. This means that, for instance, an M of 64 will use at least 1024 bytes of memory for each node! That is, 64 links * 2 times * 8 bytes pointers, and even more, since on average each node has something like 1.33 layers (but the other layers have just M connections, instead of M*2). If you don't have a recall quality problem, the default is fine, and uses a limited amount of memory.
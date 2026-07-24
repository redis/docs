# redis-eval — hosted-phase prototype (DOC-6809)

Takes the recipe the offline `vector-eval/` experiment settled on (section-level
bge-small chunks + weighted RRF favouring vector ~2–3×) and proves it on a real
Redis 8 Query Engine backend, one step at a time. Each step isolates a single
source of variance so a divergence can only come from one place.

Runs against a local **Redis 8** with the `search` module on `localhost:6379`
(verified: Redis 8.8.0, RediSearch 8.8). Reuses `../vector-eval/.venv` (adds
`redis-py`) and the cached `../vector-eval/embeddings-section.npz` — no
re-embedding.

## Step 1 — Redis retrieval parity (`parity.py`)  ✅ PASS

**Question:** does RediSearch `FLAT`/`COSINE` KNN + app-layer weighted RRF
reproduce the offline numpy-cosine ranking? Embedding is held constant: BOTH the
numpy reference and the Redis path use the **same cached corpus vectors** and the
**same Python-embedded query vectors**. The only moving part is Redis vs numpy.

Design: load all 15,300 section chunks into a HASH index with a single indexed
`VECTOR FLAT` field (FLOAT32, DIM 384, COSINE); `owner` (page URL) rides on the
hash and comes back via `RETURN` (unindexed). Per query: KNN over the full chunk
population → dedup to best (nearest) chunk per page → top-50 pages, exactly
mirroring numpy `rank_pages`. Fuse with the dumped lexical ranking via weighted
RRF (v2/v3) and score against the same 35-case eval.

**Result (2529 pages → 15,300 chunks):**

| | numpy (offline) | redis (this) |
|---|---|---|
| command MRR (v3) | 0.795 | **0.795** (identical) |
| command recall@1/@5 | 73% / 91% | **73% / 91%** (identical) |
| concept MRR (vector) | 0.638 | 0.599 |
| overall MRR (wrrf v3) | 0.731 | 0.712 |
| top-1 page match | — | 34/35 |
| top-50 exact order | — | 19/35 |
| KNN latency (K=200) | — | **p50 4.1 ms, max 29 ms** |

**Verdict:** parity holds to tie-breaking. Command metrics are bit-identical. The
single concept-MRR delta traces to ONE query — *"connect to Redis from a Python
application"* — where two chunks (`redis-py/connect`, `ioredis/connect`) have an
**exactly equal** cosine score (gap `0.00e+00`); numpy's stable argsort and
Redis's internal order break the tie differently. Deep-tail order diverges on
more queries (hence top-50 exact only 19/35) but that rarely moves the first
expected hit (top-1 34/35), so recall@k / MRR are unaffected except at that one
tie. `diag_divergence.py` reproduces the tie evidence.

Side note (not a Redis issue): those client "connect" pages embed identically
because their section anchor text is templated the same across clients — the
embedding can't distinguish redis-py from ioredis for a "Python" query. A
chunking/corpus tuning candidate for later.

## Step 2 — Node ONNX embedding parity  ✅ PASS

**Question:** does embedding in Node (`fastembed` npm, ONNX via `onnxruntime-node`)
reproduce Python `fastembed` vectors closely enough to (a) embed queries
in-process in the Node MCP server and (b) keep the cached Python corpus vectors +
offline numbers valid? `fastembed` npm is the Node port of the same Qdrant
fastembed the Python side uses (same `@anush008/tokenizers`, same HF model files).

Design: Python exports the exact query + 510-chunk corpus-sample strings
(`export_texts.py` → `parity_texts.json`); Node embeds them with plain `embed()`
prepending the same BGE query prefix (`node/test/embed-dump.mjs` →
`node_vectors.json`); Python re-embeds the identical strings and compares
(`embed_parity.py`). Using plain `embed()` (not `queryEmbed`/`passageEmbed`) keeps
the only variable the ONNX embedding itself, not prefix wording.

**Result:**

| check | result |
|---|---|
| cosine(node, python), 35 queries | min/p50/mean **1.00000** |
| cosine(node, python), 510 corpus chunks | min/p50/mean **1.00000** |
| texts below 0.999 cosine | **0 / 545** |
| eval, pure-vector MRR (Node vs Python queries) | identical (.717 / .763 / .638) |
| eval, wrrf-v3 command MRR | .795 → .789 |

**Verdict:** the Node embeddings are identical to Python's (cosine 1.0), so
embedding in-process in the Node server is safe and the cached corpus vectors
remain valid. The lone wrrf-v3 delta (command MRR .795→.789, one query) is the
same tie-break sensitivity seen in Step 1: cosine-1.0 is not bit-identical, so a
couple of near-tied corpus chunks reorder in the tail and RRF — sensitive to
exact rank positions — flips one fused rank, even though the vector-only metric
is unchanged. Noise at n=22, not an embedding discrepancy.

Node embedding ran ~4 texts/s here (unoptimised local ONNX, same caveat as the
Python side — not a production latency signal; the Step 1 KNN latency is).

## Next

- **Step 3 — Redis-native hybrid** vs this app-layer weighted RRF: does the
  built-in hybrid query reproduce the ranking with vector-favoured weighting?
- **Step 4 (later):** wire the winning path into the MCP `search_docs` handler.

## Run

```
../vector-eval/.venv/bin/python parity.py section         # Step 1
../vector-eval/.venv/bin/python diag_divergence.py section

../vector-eval/.venv/bin/python export_texts.py           # Step 2
(cd ../node && node test/embed-dump.mjs)                   #   (downloads model 1st run)
../vector-eval/.venv/bin/python embed_parity.py section
```

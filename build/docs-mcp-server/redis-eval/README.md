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

## Step 3 — Redis-native FT.HYBRID vs app-layer weighted RRF  ✅ (resolves the fork)

**Question:** does Redis's native `FT.HYBRID` (8.4.4+) reproduce our validated
app-layer weighted-RRF recipe (vector ~3× lexical, overall MRR .73)?

Two structural facts, found in the command spec:
- `COMBINE RRF` exposes only `CONSTANT` + `WINDOW` — **no per-retriever weights**.
  Native RRF is equal-weight, the variant the fusion sweep already found dilutes
  the top ranks.
- `COMBINE LINEAR` takes `ALPHA`/`BETA` but fuses raw **scores** linearly — a
  different algorithm from our rank-based weighted RRF.
- Native hybrid also uses Redis's **own** BM25 over an indexed TEXT field, not our
  Porter-stemmed / field-boosted Node lexical (`lexical.json`).

`native_hybrid.py` decomposes both axes (fusion + lexical) on the 35-case eval.
Working `FT.HYBRID` invocation (gotchas noted for reuse):
`FT.HYBRID <idx> SEARCH "<terms>" SCORER BM25 VSIM @vec $qv KNN 2 K 200
[COMBINE RRF 2 CONSTANT 60 | COMBINE LINEAR 4 ALPHA a BETA b] LOAD 1 @owner
LIMIT 0 200 PARAMS 2 qv <blob>` — `VSIM @field $param`; KNN/COMBINE counts are
**k/v-pair counts** not the k value; **no `DIALECT`**; project with `LOAD`, not
`RETURN`.

**Results (overall MRR):**

| system | overall | command | concept |
|---|---|---|---|
| redis bm25 only | 0.117 | 0.032 | 0.262 |
| our lexical only | 0.530 | 0.571 | 0.461 |
| native rrf (equal-weight) | 0.425 | 0.448 | 0.387 |
| native linear α.2/β.8 | 0.501 | 0.527 | 0.458 |
| app wrrf, Redis BM25 + vec | 0.431 | 0.396 | 0.491 |
| **app wrrf, our lexical + vec (recipe)** | **0.731** | **0.795** | **0.621** |

**Verdict — resolves the "showcase vs control" fork toward app-layer fusion:**
native `FT.HYBRID` does **not** reproduce the recipe, for two independent reasons.
(1) Its RRF is equal-weight-only; LINEAR weights but underperforms weighted-RRF.
(2) More decisively, its lexical side (Redis raw BM25, MRR .117; **0% command
recall@5**) is far weaker than our Node ranker (.530) — command queries like
"append an entry to a stream" carry no `xadd` token, so a plain body-text BM25
ranks streams *tutorials* above the *XADD command page*; our title/slug field
boosts + page-type weighting are what fix that, and a plain Redis TEXT index
doesn't carry that signal. A subtle corollary: RRF gives every list fixed
rank-reciprocal mass regardless of quality, so it injects a bad retriever's
distractors (hence app-wrrf-over-Redis-BM25 .431 < native-linear .501); RRF wins
only when both retrievers are good, which they are with our Node lexical (.731).

**Architecture conclusion (matches SPEC §6):** use **Redis for vector KNN**
(proven in Step 1, ~4 ms), keep **lexical BM25 + weighted-RRF fusion in the app
(Node) layer** — where the lexical path already has to live for the stdio
no-datastore mode. `FT.HYBRID`'s all-in-Redis showcase costs ~0.23 MRR and can't
express the weighted fusion, so it's not the path.

*Honest caveat:* native BM25's showing is depressed partly by a deliberately
naive OR-of-terms query and by indexing only the section body (no boosted
title/slug fields). A Redis index mirroring the Node analyzer would narrow the
lexical gap — but that is re-implementing our lexical ranker inside Redis, with
native RRF still unable to do the weighted fusion. The conclusion holds either
way. (The eval's vector side here is numpy `rank_pages`; Step 1 already showed
Redis KNN ≈ numpy to tie-breaking, so this isolates fusion + lexical cleanly.)

## Next

- **Step 4 — wire the winning path into the MCP `search_docs` handler:** Redis
  KNN for vector + the existing Node BM25, fused with weighted RRF (vector ~3×).
  This is the first change to the shipped server; scope with Andy first.

## Run

```
../vector-eval/.venv/bin/python parity.py section         # Step 1
../vector-eval/.venv/bin/python diag_divergence.py section

../vector-eval/.venv/bin/python export_texts.py           # Step 2
(cd ../node && node test/embed-dump.mjs)                   #   (downloads model 1st run)
../vector-eval/.venv/bin/python embed_parity.py section

../vector-eval/.venv/bin/python native_hybrid.py section   # Step 3
```

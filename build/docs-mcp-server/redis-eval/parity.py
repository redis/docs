#!/usr/bin/env python3
"""
Step 1 of the hosted-phase prototype (DOC-6809): Redis retrieval parity.

Question this isolates: does RediSearch FLAT/COSINE KNN + app-layer weighted RRF
reproduce the OFFLINE numpy-cosine eval ranking (overall MRR ~.73, concept @10
100%)? To keep embedding out of the picture entirely (that's Step 2 — Node ONNX
parity), BOTH the numpy reference path and the Redis path use the SAME cached
bge-small corpus vectors (embeddings-section.npz) and the SAME Python-embedded
query vectors. The only moving part here is Redis vs numpy.

What it does:
  1. Reuse eval_vector to build the section chunks + load cached corpus vectors.
  2. Load every chunk into a RediSearch HASH index (FLAT, COSINE, FLOAT32, 384).
  3. Embed the 35 eval queries once with Python fastembed (the reference vectors).
  4. Per query: Redis KNN over all chunks -> dedup to best-per-page -> top-50 pages.
     Compare that page ranking against numpy rank_pages on the identical vector.
  5. Fuse each ranking with the dumped lexical ranking via weighted RRF and score
     recall@k / MRR, side by side numpy-vector vs redis-vector.
  6. Report KNN latency at a realistic K (separate from the full-K parity query).

Usage:
  ../vector-eval/.venv/bin/python parity.py section
Requires: local Redis 8 with search (localhost:6379), cached embeddings-section.npz.
"""
import os
import sys
import time

import numpy as np
import redis
from redis.commands.search.field import VectorField
from redis.commands.search.index_definition import IndexDefinition, IndexType
from redis.commands.search.query import Query

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "vector-eval"))
import eval_vector as ev  # noqa: E402  (MODE/CACHE resolve from argv[1], default "section")

INDEX = "docs_parity"
PREFIX = "parity:chunk:"
REALISTIC_K = 200  # for the latency figure; parity uses full-K


def connect():
    r = redis.Redis(host="localhost", port=6379, decode_responses=False)
    r.ping()
    return r


def build_index(r, dim):
    try:
        r.ft(INDEX).dropindex(delete_documents=True)
    except redis.ResponseError:
        pass
    # Only the vector is indexed; `owner` lives on the hash and is pulled back
    # via RETURN at query time (RediSearch returns unindexed hash fields fine).
    schema = (
        VectorField(
            "vector",
            "FLAT",
            {"TYPE": "FLOAT32", "DIM": dim, "DISTANCE_METRIC": "COSINE"},
        ),
    )
    r.ft(INDEX).create_index(
        schema,
        definition=IndexDefinition(prefix=[PREFIX], index_type=IndexType.HASH),
    )


def load_chunks(r, emb, owners):
    pipe = r.pipeline(transaction=False)
    for i, (vec, owner) in enumerate(zip(emb, owners)):
        pipe.hset(
            f"{PREFIX}{i}",
            mapping={
                "vector": np.asarray(vec, dtype=np.float32).tobytes(),
                "owner": owner,
            },
        )
        if i % 2000 == 0:
            pipe.execute()
    pipe.execute()


def redis_knn_pages(r, qvec, k, topn=50):
    """KNN over `k` chunks, dedup to best (nearest) page, return top-n page urls."""
    blob = np.asarray(qvec, dtype=np.float32).tobytes()
    q = (
        Query(f"*=>[KNN {k} @vector $blob AS score]")
        .sort_by("score")  # COSINE distance, ascending = nearest first
        .return_fields("owner", "score")
        .paging(0, k)
        .dialect(2)
    )
    res = r.ft(INDEX).search(q, query_params={"blob": blob})
    best = {}
    for doc in res.docs:
        owner = doc.owner.decode() if isinstance(doc.owner, bytes) else doc.owner
        if owner not in best:  # docs are distance-sorted, so first = nearest
            best[owner] = float(doc.score)
        if len(best) >= topn:
            break
    return list(best.keys())


def main():
    import json

    cases = json.load(open(ev.LEXICAL))
    print(f"Mode: {ev.MODE}. Building chunks + loading cached corpus vectors ...")
    pages = ev.load_pages()
    texts, owners = ev.build_chunks(pages, ev.MODE)
    emb, owners = ev.get_corpus_embeddings(texts, owners)  # cache hit, no re-embed
    total, dim = emb.shape
    print(f"  {len(pages)} pages -> {total} chunks, dim {dim}")

    print("Connecting to Redis + (re)building FLAT index ...")
    r = connect()
    build_index(r, dim)
    t0 = time.time()
    load_chunks(r, emb, owners)
    print(f"  loaded {total} chunks in {time.time()-t0:.1f}s")

    print("Embedding 35 queries with Python fastembed (reference vectors) ...")
    qvecs = ev.embed_batch(ev._model(), [c["q"] for c in cases], is_query=True)

    # --- Parity: Redis full-K KNN vs numpy rank_pages on identical vectors ---
    print("\nParity check: Redis KNN page ranking vs numpy rank_pages ...")
    identical, top1_match, latencies = 0, 0, []
    redis_rank_by_case = []
    for c, qv in zip(cases, qvecs):
        np_pages = ev.rank_pages(qv, emb, owners)  # numpy reference (all chunks)
        rd_pages = redis_knn_pages(r, qv, k=total)  # Redis, full-K = same population
        redis_rank_by_case.append(rd_pages)
        if np_pages[:50] == rd_pages[:50]:
            identical += 1
        if np_pages and rd_pages and np_pages[0] == rd_pages[0]:
            top1_match += 1
        # realistic-K latency (not the full-K parity query)
        t = time.time()
        redis_knn_pages(r, qv, k=REALISTIC_K)
        latencies.append((time.time() - t) * 1000)
    n = len(cases)
    print(f"  top-50 page order identical: {identical}/{n}")
    print(f"  top-1 page match:            {top1_match}/{n}")
    lat = sorted(latencies)
    print(f"  KNN K={REALISTIC_K} latency: p50 {lat[n//2]:.1f}ms  max {lat[-1]:.1f}ms")

    # --- Metrics: numpy-vector vs redis-vector, each fused with lexical ---
    def score(vec_ranker):
        groups = ["overall", "command", "concept"]
        systems = {
            "vector": lambda lex, vec: vec,
            "wrrf v2": lambda lex, vec: _wrrf([(vec, 2), (lex, 1)]),
            "wrrf v3": lambda lex, vec: _wrrf([(vec, 3), (lex, 1)]),
        }
        data = {s: {g: [] for g in groups} for s in systems}
        for c, qv in zip(cases, qvecs):
            exp = set(c["expected"])
            lex = c["lexical"]
            vec = vec_ranker(c, qv)
            for s, fn in systems.items():
                rk = ev.best_rank(fn(lex, vec), exp)
                data[s]["overall"].append(rk)
                data[s][c["kind"]].append(rk)
        return data

    def report(title, data):
        print(f"\n### {title} ###")
        for g in ["overall", "command", "concept"]:
            m = len(data["vector"][g])
            print(f"\n=== {g} (n={m}) ===  recall@1 / @3 / @5 / @10 | MRR")
            for s in data:
                rec, mrr = ev.metrics(data[s][g])
                cells = " / ".join(f"{rec[k]*100:3.0f}%" for k in ev.KS)
                print(f"  {s:8} {cells} | {mrr:.3f}")

    np_idx = {id(c): ev.rank_pages(qv, emb, owners) for c, qv in zip(cases, qvecs)}
    report("numpy vector (offline reference)", score(lambda c, qv: np_idx[id(c)]))
    rd_idx = {id(c): rd for c, rd in zip(cases, redis_rank_by_case)}
    report("redis vector (this prototype)", score(lambda c, qv: rd_idx[id(c)]))

    r.ft(INDEX).dropindex(delete_documents=True)
    print("\nDropped index; done.")


def _wrrf(lists_weights, k=60, topn=50):
    scores = {}
    for lst, w in lists_weights:
        for rank, u in enumerate(lst):
            scores[u] = scores.get(u, 0.0) + w / (k + rank + 1)
    return [u for u, _ in sorted(scores.items(), key=lambda kv: -kv[1])][:topn]


if __name__ == "__main__":
    main()

#!/usr/bin/env python3
"""Step 3: does Redis-native FT.HYBRID reproduce our validated app-layer
weighted-RRF recipe (vector ~3x lexical, overall MRR .73)?

FT.HYBRID (Redis 8.4.4+) fuses a text search and a vector search server-side.
Two findings drive the design:
  - COMBINE RRF exposes only CONSTANT + WINDOW — NO per-retriever weights. Native
    RRF is therefore EQUAL-weight, the exact variant our fusion sweep found
    dilutes the top ranks (.69 vs .73).
  - COMBINE LINEAR takes ALPHA/BETA weights but fuses raw SCORES linearly, a
    different algorithm from our rank-based weighted RRF.
Also, native hybrid uses Redis's OWN BM25 over an indexed TEXT field, not our
Porter-stemmed/boosted Node BM25 (lexical.json). So "native" differs on two axes:
fusion AND lexical signal. This harness decomposes both:

  native RRF          Redis BM25 + Redis KNN, native equal-weight RRF
  native LINEAR a/b   Redis BM25 + Redis KNN, native weighted score fusion
  app wRRF (redis)    Redis BM25 + Redis KNN, OUR weighted-rank RRF  [isolates fusion]
  app wRRF (ours)     lexical.json + Redis KNN, our recipe (= Step 1) [isolates lexical]

  ../vector-eval/.venv/bin/python native_hybrid.py section
"""
import json
import os
import re
import sys

import numpy as np
import redis

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "vector-eval"))
import eval_vector as ev  # noqa: E402

INDEX = "docs_hybrid"
PREFIX = "hybrid:chunk:"
KNN_K = 200
TOPN = 50


def connect():
    r = redis.Redis(host="localhost", port=6379, decode_responses=False)
    r.ping()
    return r


def build_index(r, dim):
    try:
        r.execute_command("FT.DROPINDEX", INDEX, "DD")
    except redis.ResponseError:
        pass
    r.execute_command(
        "FT.CREATE", INDEX, "ON", "HASH", "PREFIX", "1", PREFIX, "SCHEMA",
        "text", "TEXT",
        "owner", "TAG",
        "vec", "VECTOR", "FLAT", "6",
        "TYPE", "FLOAT32", "DIM", dim, "DISTANCE_METRIC", "COSINE",
    )


def load_chunks(r, texts, emb, owners):
    pipe = r.pipeline(transaction=False)
    for i, (t, v, o) in enumerate(zip(texts, emb, owners)):
        pipe.hset(f"{PREFIX}{i}", mapping={
            "text": t, "owner": o,
            "vec": np.asarray(v, dtype=np.float32).tobytes(),
        })
        if i % 2000 == 0:
            pipe.execute()
    pipe.execute()


def or_query(q):
    """Natural-language query -> BM25-friendly OR of alphanumeric terms."""
    terms = re.findall(r"[a-z0-9]+", q.lower())
    return " | ".join(terms) if terms else "*"


def _dedup_pages(rows):
    best = []
    seen = set()
    for owner in rows:
        if owner not in seen:
            seen.add(owner)
            best.append(owner)
        if len(best) >= TOPN:
            break
    return best


def _owner(doc):
    o = doc.get(b"owner") if isinstance(doc, dict) else None
    return o.decode() if isinstance(o, bytes) else o


def native_hybrid_pages(r, q, blob, combine):
    args = ["FT.HYBRID", INDEX, "SEARCH", or_query(q), "SCORER", "BM25",
            "VSIM", "@vec", "$qv", "KNN", "2", "K", str(KNN_K)]
    args += combine
    args += ["LOAD", "1", "@owner", "LIMIT", "0", str(KNN_K),
             "PARAMS", "2", "qv", blob]
    res = r.execute_command(*args)
    rows = res[b"results"] if isinstance(res, dict) else res.get("results", [])
    return _dedup_pages([_owner(d) for d in rows])


def redis_bm25_pages(r, q):
    res = r.ft(INDEX).search(_bm25_query(or_query(q)))
    return _dedup_pages([_owner_obj(d) for d in res.docs])


def _bm25_query(text):
    from redis.commands.search.query import Query
    return Query(text).scorer("BM25").return_fields("owner").paging(0, KNN_K)


def _owner_obj(doc):
    o = getattr(doc, "owner", None)
    return o.decode() if isinstance(o, bytes) else o


def main():
    cases = json.load(open(ev.LEXICAL, encoding="utf-8"))
    pages = ev.load_pages()
    texts, owners = ev.build_chunks(pages, ev.MODE)
    emb, owners = ev.get_corpus_embeddings(texts, owners)
    dim = emb.shape[1]
    print(f"{len(pages)} pages -> {len(texts)} chunks, dim {dim}")

    r = connect()
    build_index(r, dim)
    load_chunks(r, texts, emb, owners)
    print("index built + loaded")

    qvecs = ev.embed_batch(ev._model(), [c["q"] for c in cases], is_query=True)

    systems = ["redis bm25 only", "our lexical only",
               "native rrf", "native lin .2/.8", "native lin .1/.9",
               "app wrrf (redis)", "app wrrf (ours)"]
    groups = ["overall", "command", "concept"]
    data = {s: {g: [] for g in groups} for s in systems}

    for c, qv in zip(cases, qvecs):
        exp = set(c["expected"])
        blob = np.asarray(qv, dtype=np.float32).tobytes()

        rankings = {
            "native rrf": native_hybrid_pages(
                r, c["q"], blob, ["COMBINE", "RRF", "2", "CONSTANT", "60"]),
            "native lin .2/.8": native_hybrid_pages(
                r, c["q"], blob,
                ["COMBINE", "LINEAR", "4", "ALPHA", "0.2", "BETA", "0.8"]),
            "native lin .1/.9": native_hybrid_pages(
                r, c["q"], blob,
                ["COMBINE", "LINEAR", "4", "ALPHA", "0.1", "BETA", "0.9"]),
        }
        # app-layer fusions: same Redis KNN, two different lexical sources
        redis_vec = ev.rank_pages(qv, emb, owners)  # matches Step 1 vector side
        redis_bm25 = redis_bm25_pages(r, c["q"])
        rankings["redis bm25 only"] = redis_bm25
        rankings["our lexical only"] = c["lexical"]
        rankings["app wrrf (redis)"] = _wrrf([(redis_vec, 3), (redis_bm25, 1)])
        rankings["app wrrf (ours)"] = _wrrf([(redis_vec, 3), (c["lexical"], 1)])

        for s in systems:
            rk = ev.best_rank(rankings[s], exp)
            data[s]["overall"].append(rk)
            data[s][c["kind"]].append(rk)

    for g in groups:
        n = len(data[systems[0]][g])
        print(f"\n=== {g} (n={n}) ===  recall@1 / @3 / @5 / @10 | MRR")
        for s in systems:
            rec, mrr = ev.metrics(data[s][g])
            cells = " / ".join(f"{rec[k]*100:3.0f}%" for k in ev.KS)
            print(f"  {s:18} {cells} | {mrr:.3f}")

    r.execute_command("FT.DROPINDEX", INDEX, "DD")
    print("\ndropped index; done.")


def _wrrf(lists_weights, k=60, topn=TOPN):
    scores = {}
    for lst, w in lists_weights:
        for rank, u in enumerate(lst):
            scores[u] = scores.get(u, 0.0) + w / (k + rank + 1)
    return [u for u, _ in sorted(scores.items(), key=lambda kv: -kv[1])][:topn]


if __name__ == "__main__":
    main()

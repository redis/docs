#!/usr/bin/env python3
"""Diagnostic: for any query whose Redis top-1 page != numpy top-1 page, print
the numpy top-3 chunk cosine scores. If the top-2 gap is ~1e-5 or less, the
divergence is FLOAT32 tie-break noise (summation order), not a ranking defect.
"""
import os
import sys
import json

import numpy as np
import redis
from redis.commands.search.query import Query

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "vector-eval"))
import eval_vector as ev  # noqa: E402
import parity  # noqa: E402

cases = json.load(open(ev.LEXICAL, encoding="utf-8"))
pages = ev.load_pages()
texts, owners = ev.build_chunks(pages, ev.MODE)
emb, owners = ev.get_corpus_embeddings(texts, owners)
qvecs = ev.embed_batch(ev._model(), [c["q"] for c in cases], is_query=True)

r = redis.Redis(host="localhost", port=6379, decode_responses=False)
parity.build_index(r, emb.shape[1])
parity.load_chunks(r, emb, owners)

for c, qv in zip(cases, qvecs):
    np_pages = ev.rank_pages(qv, emb, owners)
    rd_pages = parity.redis_knn_pages(r, qv, k=emb.shape[0])
    if np_pages[0] == rd_pages[0]:
        continue
    sims = emb @ qv
    order = np.argsort(-sims)[:3]
    print(f"\nQUERY ({c['kind']}): {c['q']}")
    print(f"  numpy top-1 page: {np_pages[0]}")
    print(f"  redis top-1 page: {rd_pages[0]}")
    print("  numpy top-3 chunk cosine scores:")
    for j in order:
        print(f"    {sims[j]:.8f}  {owners[j]}")
    print(f"  top-1 vs top-2 gap: {sims[order[0]] - sims[order[1]]:.2e}")

r.ft(parity.INDEX).dropindex(delete_documents=True)

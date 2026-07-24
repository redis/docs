#!/usr/bin/env python3
"""Step 2c: compare Node fastembed-js vectors against Python fastembed on the
SAME strings, and confirm the eval is stable when queries are embedded in Node.

Two checks:
  1. Per-text cosine(node_vec, python_vec) for the 35 queries + corpus sample.
     Near-1.0 means the Node ONNX path reproduces Python embeddings (so the
     cached Python corpus vectors and the offline numbers stay valid).
  2. Re-run the 35-case eval with Node-embedded QUERY vectors against the cached
     Python corpus (the most likely near-term wiring: build offline in Python,
     embed queries in Node at request time). Metrics should match Step 1.

Run export_texts.py + node test/embed-dump.mjs first.
  ../vector-eval/.venv/bin/python embed_parity.py section
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "vector-eval"))
import eval_vector as ev  # noqa: E402


def cosine(a, b):
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)
    return float(a @ b / ((np.linalg.norm(a) * np.linalg.norm(b)) + 1e-12))


def main():
    texts = json.load(open(os.path.join(HERE, "parity_texts.json"), encoding="utf-8"))
    node = json.load(open(os.path.join(HERE, "node_vectors.json"), encoding="utf-8"))
    prefix = texts["query_prefix"]

    # Python embeddings of the identical strings.
    py_q = ev.embed_batch(ev._model(), texts["queries"], is_query=True)
    py_c = ev.embed_batch(ev._model(), texts["corpus"], is_query=False)

    q_cos = [cosine(n, p) for n, p in zip(node["queries"], py_q)]
    c_cos = [cosine(n, p) for n, p in zip(node["corpus"], py_c)]

    def stat(name, xs):
        xs = sorted(xs)
        print(f"  {name:14} min {xs[0]:.5f}  p50 {xs[len(xs)//2]:.5f}  "
              f"mean {sum(xs)/len(xs):.5f}  (n={len(xs)})")

    print(f"Node dim {node['dim']} vs Python dim {py_q.shape[1]}")
    print("Per-text cosine(node, python):")
    stat("queries", q_cos)
    stat("corpus", c_cos)
    below = sum(1 for x in q_cos + c_cos if x < 0.999)
    print(f"  texts below 0.999 cosine: {below}/{len(q_cos)+len(c_cos)}")

    # --- Eval stability: Node query vectors vs cached Python corpus ---
    cases = json.load(open(ev.LEXICAL, encoding="utf-8"))
    pages = ev.load_pages()
    corpus_texts, owners = ev.build_chunks(pages, ev.MODE)
    emb, owners = ev.get_corpus_embeddings(corpus_texts, owners)
    node_q = np.asarray(node["queries"], dtype=np.float32)

    groups = ["overall", "command", "concept"]

    def run(qvecs, label):
        systems = {
            "vector": lambda lex, vec: vec,
            "wrrf v3": lambda lex, vec: _wrrf([(vec, 3), (lex, 1)]),
        }
        data = {s: {g: [] for g in groups} for s in systems}
        for c, qv in zip(cases, qvecs):
            exp = set(c["expected"])
            vec = ev.rank_pages(qv, emb, owners)
            for s, fn in systems.items():
                rk = ev.best_rank(fn(c["lexical"], vec), exp)
                data[s]["overall"].append(rk)
                data[s][c["kind"]].append(rk)
        print(f"\n### {label} ###")
        for g in groups:
            print(f"=== {g} (n={len(data['vector'][g])}) ===  @1/@3/@5/@10 | MRR")
            for s in data:
                rec, mrr = ev.metrics(data[s][g])
                cells = " / ".join(f"{rec[k]*100:3.0f}%" for k in ev.KS)
                print(f"  {s:8} {cells} | {mrr:.3f}")

    run(py_q, "Python query vectors (baseline)")
    run(node_q, "Node query vectors (this prototype)")


def _wrrf(lists_weights, k=60, topn=50):
    scores = {}
    for lst, w in lists_weights:
        for rank, u in enumerate(lst):
            scores[u] = scores.get(u, 0.0) + w / (k + rank + 1)
    return [u for u, _ in sorted(scores.items(), key=lambda kv: -kv[1])][:topn]


if __name__ == "__main__":
    main()

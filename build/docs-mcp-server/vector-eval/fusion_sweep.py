#!/usr/bin/env python3
"""
Fusion sweep: with section-level embeddings CACHED, compare lexical / pure
vector / equal-weight RRF / weighted RRF (favouring vector) on the eval, to
resolve which fusion to build. Reuses eval_vector's corpus embeddings (cache
hit — no re-embedding) and the dumped lexical rankings.

  python fusion_sweep.py section
"""
import json

import eval_vector as ev


def wrrf(lists_weights, k=60, topn=50):
    """Weighted reciprocal-rank fusion. lists_weights: [(ranked_urls, weight)]."""
    scores = {}
    for lst, w in lists_weights:
        for r, u in enumerate(lst):
            scores[u] = scores.get(u, 0.0) + w / (k + r + 1)
    return [u for u, _ in sorted(scores.items(), key=lambda kv: -kv[1])][:topn]


cases = json.load(open(ev.LEXICAL))
pages = ev.load_pages()
texts, owners = ev.build_chunks(pages, ev.MODE)
emb, owners = ev.get_corpus_embeddings(texts, owners)  # cache hit
qvecs = ev.embed_batch(ev._model(), [c["q"] for c in cases], is_query=True)

systems = {
    "lexical": lambda lex, vec: lex,
    "vector": lambda lex, vec: vec,
    "rrf 1:1": lambda lex, vec: wrrf([(vec, 1), (lex, 1)]),
    "wrrf v2": lambda lex, vec: wrrf([(vec, 2), (lex, 1)]),
    "wrrf v3": lambda lex, vec: wrrf([(vec, 3), (lex, 1)]),
    "wrrf v5": lambda lex, vec: wrrf([(vec, 5), (lex, 1)]),
}
groups = ["overall", "command", "concept"]
data = {s: {g: [] for g in groups} for s in systems}

for c, q in zip(cases, qvecs):
    exp = set(c["expected"])
    lex = c["lexical"]
    vec = ev.rank_pages(q, emb, owners)
    for s, fn in systems.items():
        r = ev.best_rank(fn(lex, vec), exp)
        data[s]["overall"].append(r)
        data[s][c["kind"]].append(r)

for g in groups:
    n = len(data["lexical"][g])
    print(f"\n=== {g} (n={n}) ===  recall@1 / @3 / @5 / @10 | MRR")
    for s in systems:
        rec, mrr = ev.metrics(data[s][g])
        cells = " / ".join(f"{rec[k] * 100:3.0f}%" for k in ev.KS)
        print(f"  {s:9} {cells} | {mrr:.3f}")

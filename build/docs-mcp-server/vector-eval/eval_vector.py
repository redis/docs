#!/usr/bin/env python3
"""
Measure-first vector-search experiment for the docs MCP server (no Redis).

Compares three rankers on the same 35-case eval used by the lexical harness:
  - lexical : the production Node ranker's output (read from lexical.json)
  - vector  : bge-small-en-v1.5 embeddings, cosine, ranked in numpy
  - hybrid  : reciprocal-rank fusion of lexical + vector

v2 (slim): ONE page-level chunk per page (title + summary + lead section text),
~2.5k chunks instead of 21.5k section chunks — fast enough to iterate. Embedding
is batched with live progress and the corpus cache is written at the end
(embeddings.npz) for instant re-runs. The model (bge-small-en-v1.5) is what we'd
run in production via RedisVL; loaded here through fastembed (ONNX, no torch).

Usage:
  pip install -r requirements.txt
  node ../node/test/eval/dump-lexical.mjs > lexical.json
  python eval_vector.py
"""
import gzip
import json
import os
import sys
import time

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FEED = os.path.join(HERE, "..", "node", "test", "eval", "docs.ndjson.gz")
LEXICAL = os.path.join(HERE, "lexical.json")
CACHE = os.path.join(HERE, "embeddings.npz")
MODEL = "BAAI/bge-small-en-v1.5"
BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
LEAD_CHARS = 1200
KS = [1, 3, 5, 10]


def norm_url(u):
    return u.strip().lower().rstrip("/")


def load_pages():
    pages = []
    with gzip.open(FEED, "rt", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                o = json.loads(line)
            except json.JSONDecodeError:
                continue
            if isinstance(o, dict) and o.get("url") and o.get("title"):
                pages.append(o)
    return pages


def build_chunks(pages):
    """One page-level chunk per page: title + summary + lead section text."""
    texts, owners = [], []
    for p in pages:
        title = p.get("title", "") or ""
        summary = p.get("summary", "") or ""
        secs = " ".join((s.get("text", "") or "") for s in (p.get("sections") or []))
        parts = [x for x in (title, summary, secs[:LEAD_CHARS]) if x]
        texts.append(". ".join(parts).strip() or title or p["url"])
        owners.append(norm_url(p["url"]))
    return texts, np.array(owners)


def _model():
    from fastembed import TextEmbedding

    return TextEmbedding(model_name=MODEL)


def embed(texts, is_query=False, label="chunks"):
    payload = [BGE_QUERY_PREFIX + t for t in texts] if is_query else texts
    model = _model()
    vecs, t0, total = [], time.time(), len(payload)
    for i, v in enumerate(model.embed(payload, batch_size=64)):
        vecs.append(v)
        n = i + 1
        if n % 256 == 0 or n == total:
            rate = n / (time.time() - t0)
            print(f"    {n}/{total} {label} ({rate:.0f}/s)", flush=True)
    arr = np.asarray(vecs, dtype=np.float32)
    arr /= np.linalg.norm(arr, axis=1, keepdims=True) + 1e-12
    return arr


def get_corpus_embeddings(texts, owners):
    if os.path.exists(CACHE):
        d = np.load(CACHE, allow_pickle=True)
        if len(d["owners"]) == len(owners):
            print(f"  (using cached embeddings: {len(owners)} chunks)")
            return d["emb"], d["owners"]
    emb = embed(texts, is_query=False)
    np.savez(CACHE, emb=emb, owners=owners)
    print("  cached embeddings.npz")
    return emb, owners


def rank_pages(qvec, emb, owners, topn=50):
    sims = emb @ qvec
    best = {}
    for i in np.argsort(-sims):
        u = owners[i]
        if u not in best:
            best[u] = float(sims[i])
        if len(best) >= topn:
            break
    return [u for u, _ in sorted(best.items(), key=lambda kv: -kv[1])]


def rrf(lists, k=60, topn=50):
    scores = {}
    for lst in lists:
        for rank, url in enumerate(lst):
            scores[url] = scores.get(url, 0.0) + 1.0 / (k + rank + 1)
    return [u for u, _ in sorted(scores.items(), key=lambda kv: -kv[1])][:topn]


def best_rank(ranking, expected):
    for i, u in enumerate(ranking):
        if u in expected:
            return i + 1
    return None


def metrics(ranks):
    n = len(ranks) or 1
    rec = {k: sum(1 for r in ranks if r and r <= k) / n for k in KS}
    mrr = sum((1.0 / r) if r else 0.0 for r in ranks) / n
    return rec, mrr


def main():
    if not os.path.exists(LEXICAL):
        sys.exit("lexical.json missing — run: node ../node/test/eval/dump-lexical.mjs > lexical.json")
    cases = json.load(open(LEXICAL))

    print("Loading feed + building page-level chunks ...")
    pages = load_pages()
    texts, owners = build_chunks(pages)
    print(f"  {len(pages)} pages -> {len(texts)} chunks")

    print("Embedding corpus ...")
    emb, owners = get_corpus_embeddings(texts, owners)

    print("Embedding queries ...")
    qvecs = embed([c["q"] for c in cases], is_query=True, label="queries")

    systems, groups = ["lexical", "vector", "hybrid"], ["overall", "command", "concept"]
    data = {s: {g: [] for g in groups} for s in systems}
    for c, qv in zip(cases, qvecs):
        expected = set(c["expected"])
        lex, vec = c["lexical"], rank_pages(qv, emb, owners)
        ranks = {"lexical": best_rank(lex, expected),
                 "vector": best_rank(vec, expected),
                 "hybrid": best_rank(rrf([lex, vec]), expected)}
        for s in systems:
            data[s]["overall"].append(ranks[s])
            data[s][c["kind"]].append(ranks[s])

    for g in groups:
        n = len(data["lexical"][g])
        print(f"\n=== {g} (n={n}) ===   recall@1 / @3 / @5 / @10 | MRR")
        for s in systems:
            rec, mrr = metrics(data[s][g])
            cells = " / ".join(f"{rec[k]*100:3.0f}%" for k in KS)
            print(f"  {s:8} {cells} | {mrr:.3f}")


if __name__ == "__main__":
    main()

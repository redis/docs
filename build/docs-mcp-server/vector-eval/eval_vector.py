#!/usr/bin/env python3
"""
Measure-first vector-search experiment for the docs MCP server (no Redis).

Compares three rankers on the same 35-case eval used by the lexical harness:
  - lexical : the production Node ranker's output (read from lexical.json)
  - vector  : bge-small-en-v1.5 embeddings, best-chunk cosine, ranked in numpy
  - hybrid  : reciprocal-rank fusion of lexical + vector

Chunk mode (argv[1], default "section"):
  - page    : one chunk/page (title + summary + lead section text) ~2.5k chunks
  - section : one chunk per section (page title + section title + text) + a
              page anchor chunk ~15-18k chunks; better for concept queries.

Embedding is batched with live progress and CHECKPOINTED every CKPT_EVERY chunks
to embeddings-<mode>.npz, so a crash/kill resumes instead of restarting (the
21.5k-chunk first attempt died after >1h with nothing saved). Model is
bge-small-en-v1.5 (what we'd run via RedisVL in production); loaded here through
fastembed (ONNX, no torch). Embedding is ~6 chunks/s on this CPU — an
unoptimised-local artefact, not a production latency signal.

Usage:
  pip install -r requirements.txt
  node ../node/test/eval/dump-lexical.mjs > lexical.json
  python eval_vector.py section
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
MODEL = "BAAI/bge-small-en-v1.5"
DIM = 384  # bge-small-en-v1.5
BGE_QUERY_PREFIX = "Represent this sentence for searching relevant passages: "
LEAD_CHARS = 1200
MAX_SECTIONS = 8
CKPT_EVERY = 1024
KS = [1, 3, 5, 10]

MODE = (sys.argv[1] if len(sys.argv) > 1 else "section").lower()
CACHE = os.path.join(HERE, f"embeddings-{MODE}.npz")


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


def build_chunks(pages, mode):
    texts, owners = [], []
    for p in pages:
        url = norm_url(p["url"])
        title = p.get("title", "") or ""
        summary = p.get("summary", "") or ""
        sections = p.get("sections") or []
        if mode == "page":
            secs = " ".join((s.get("text", "") or "") for s in sections)[:LEAD_CHARS]
            parts = [x for x in (title, summary, secs) if x]
            texts.append(". ".join(parts).strip() or title or url)
            owners.append(url)
        else:  # section
            anchor = ". ".join(x for x in (title, summary) if x).strip()
            if anchor:
                texts.append(anchor)
                owners.append(url)
            n = 0
            for s in sections:
                body = (s.get("text", "") or "").strip()
                if len(body) < 20:
                    continue
                st = (s.get("title", "") or "").strip()
                texts.append(f"{title} — {st}. {body[:LEAD_CHARS]}".strip())
                owners.append(url)
                n += 1
                if n >= MAX_SECTIONS:
                    break
            if not anchor and n == 0:
                texts.append(title or url)
                owners.append(url)
    return texts, np.array(owners)


def _model():
    from fastembed import TextEmbedding

    return TextEmbedding(model_name=MODEL, threads=os.cpu_count())


def embed_batch(model, texts, is_query=False):
    payload = [BGE_QUERY_PREFIX + t for t in texts] if is_query else texts
    arr = np.asarray(list(model.embed(payload, batch_size=64)), dtype=np.float32)
    arr /= np.linalg.norm(arr, axis=1, keepdims=True) + 1e-12
    return arr


def get_corpus_embeddings(texts, owners):
    total = len(texts)
    emb = np.zeros((total, DIM), dtype=np.float32)
    start = 0
    if os.path.exists(CACHE):
        d = np.load(CACHE, allow_pickle=True)
        if int(d["total"]) == total:
            emb = d["emb"]
            start = int(d["n_done"])
            if start >= total:
                print(f"  (full cache: {total} chunks)")
                return emb, owners
            print(f"  resuming from {start}/{total}")
    model = _model()
    t0 = time.time()
    for s in range(start, total, CKPT_EVERY):
        e = min(s + CKPT_EVERY, total)
        emb[s:e] = embed_batch(model, texts[s:e])
        rate = (e - start) / (time.time() - t0)
        print(f"    {e}/{total} chunks ({rate:.0f}/s)", flush=True)
        np.savez(CACHE, emb=emb, owners=owners, total=total, n_done=e)
    print(f"  cached {os.path.basename(CACHE)}")
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

    print(f"Mode: {MODE}. Loading feed + building chunks ...")
    pages = load_pages()
    texts, owners = build_chunks(pages, MODE)
    print(f"  {len(pages)} pages -> {len(texts)} chunks")

    print("Embedding corpus ...")
    emb, owners = get_corpus_embeddings(texts, owners)

    print("Embedding queries ...")
    qvecs = embed_batch(_model(), [c["q"] for c in cases], is_query=True)

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

    print(f"\n### chunk mode: {MODE} ###")
    for g in groups:
        n = len(data["lexical"][g])
        print(f"\n=== {g} (n={n}) ===   recall@1 / @3 / @5 / @10 | MRR")
        for s in systems:
            rec, mrr = metrics(data[s][g])
            cells = " / ".join(f"{rec[k]*100:3.0f}%" for k in KS)
            print(f"  {s:8} {cells} | {mrr:.3f}")


if __name__ == "__main__":
    main()

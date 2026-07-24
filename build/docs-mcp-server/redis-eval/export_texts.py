#!/usr/bin/env python3
"""Step 2a: export the EXACT strings both embedders must see, so Node vs Python
embedding parity has zero input drift. Writes parity_texts.json:
  { "query_prefix": "...", "queries": [...35 raw query strings...],
    "corpus": [...sampled chunk texts...] }
The BGE query prefix is emitted here and applied identically on both sides.
"""
import json
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "vector-eval"))
import eval_vector as ev  # noqa: E402

cases = json.load(open(ev.LEXICAL, encoding="utf-8"))
pages = ev.load_pages()
texts, owners = ev.build_chunks(pages, ev.MODE)

# Spread a ~500-chunk sample across the corpus (deterministic stride).
stride = max(1, len(texts) // 500)
sample_idx = list(range(0, len(texts), stride))
corpus_sample = [texts[i] for i in sample_idx]

out = {
    "query_prefix": ev.BGE_QUERY_PREFIX,
    "queries": [c["q"] for c in cases],
    "corpus": corpus_sample,
    "corpus_idx": sample_idx,  # so the comparator can align to cached vectors
}
path = os.path.join(HERE, "parity_texts.json")
with open(path, "w", encoding="utf-8") as f:
    json.dump(out, f)
print(f"wrote {path}: {len(out['queries'])} queries, {len(corpus_sample)} corpus chunks")

#!/usr/bin/env python3
"""Dump the cached bge-small section vectors to a portable binary the Node
build-index loader can seed from (--vectors), so the vertical-slice eval need
not re-embed 15k chunks in Node at ~4/s. Step 2 proved Node fastembed-js == these
Python vectors (cosine 1.0), so seeding is equivalent to the Node embed path.

Writes to redis-eval/vecdump/:
  meta.json     {n, dim}
  owners.json   [url, ...]   (aligned to rows)
  vectors.f32   raw little-endian float32, n*dim

  ../vector-eval/.venv/bin/python dump_vectors_bin.py section
"""
import json
import os
import sys

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "vector-eval"))
import eval_vector as ev  # noqa: E402

pages = ev.load_pages()
texts, owners = ev.build_chunks(pages, ev.MODE)
emb, owners = ev.get_corpus_embeddings(texts, owners)
emb = np.ascontiguousarray(emb, dtype="<f4")  # little-endian float32

out = os.path.join(HERE, "vecdump")
os.makedirs(out, exist_ok=True)
emb.tofile(os.path.join(out, "vectors.f32"))
with open(os.path.join(out, "owners.json"), "w", encoding="utf-8") as f:
    json.dump([str(o) for o in owners], f)
with open(os.path.join(out, "meta.json"), "w", encoding="utf-8") as f:
    json.dump({"n": int(emb.shape[0]), "dim": int(emb.shape[1])}, f)
print(f"wrote {out}: n={emb.shape[0]} dim={emb.shape[1]}")

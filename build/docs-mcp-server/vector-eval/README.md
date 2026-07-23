# vector-eval — measure-first vector search experiment

Answers "does vector / hybrid retrieval beat the tuned lexical ranker, and is it
worth the hosted RediSearch infra?" **before** building any of it. No Redis: it
embeds the corpus with an open model (bge-small-en-v1.5 via fastembed/ONNX),
ranks in numpy, and scores against the **same 35-case eval** the lexical harness
uses (`../node/test/eval/cases.json`).

## Run

```bash
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
node ../node/test/eval/dump-lexical.mjs > lexical.json   # real lexical rankings
.venv/bin/python eval_vector.py section                  # or: page
```

Embedding is CHECKPOINTED to `embeddings-<mode>.npz` every 1024 chunks (a
crash/kill resumes, doesn't restart). Everything except the scripts is
gitignored (venv, caches, `lexical.json`). Note: embedding runs slowly here
(~6–11 chunks/s on unoptimised CPU ONNX) — **not** a production latency signal.

## Results (recall@5 / MRR)

| group | | lexical | vector | hybrid (RRF) |
|---|---|---|---|---|
| overall | page-level | 69 / .53 | 74 / .60 | **86 / .66** |
| overall | section-level | 69 / .53 | **83 / .72** | 91 / .67 |
| command | section-level | 73 / .57 | 91 / **.76** | 91 / .76 |
| concept | section-level | 62 / .46 | 69 / **.64** | **92** / .53 |

(section-level concept: hybrid @10 = 100%, vector @10 = 85%.)

## Findings

1. **Section-level chunking (feed `sections[]`) is the big win** — especially
   for concept queries (vector MRR .47 → .64). Coarse page-level chunks were
   what held vector back.
2. **With strong section-level embeddings, vanilla equal-weight RRF hurts the
   top ranks**: pure vector is best by MRR / @1–@3, hybrid is best by recall@5/@10.
   Fusing a strong retriever with a weaker one dilutes its confident top hits.
3. **Direction:** build section-level embeddings + a **weighted** fusion
   (favour vector), or ship pure vector. Tune against this eval before hosting.
   See `../SPEC.md` §6/§10.

Limitations: small eval (35 cases, 13 concept — directional, not definitive);
sections truncated to ~1200 chars; single small model (bge-small).

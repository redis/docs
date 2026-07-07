#!/usr/bin/env python3
"""
Redis semantic-cache demo server.

Run this file and visit http://localhost:8085 to drive a small
semantic-cache demo backed by Redis Search. The UI lets you:

* Type a natural-language prompt and watch the cache decide hit or
  miss. On a hit Redis returns the cached response in tens of
  milliseconds and the demo LLM is not called at all; on a miss the
  demo LLM "thinks" for ~1.5 s before answering and the new prompt,
  response, and embedding are written back to Redis for next time.
* Adjust the cosine-distance threshold to see how close a paraphrase
  must be for the cache to serve it.
* Switch tenant, locale, or model version to see metadata isolation
  in action — entries written under one tenant cannot be served to
  another, because the TAG filter goes into the same ``FT.SEARCH``
  call as the KNN.
* Watch cumulative savings build up: hit count, token spend avoided,
  and end-to-end latency saved against the LLM mock.
* Inspect every cached entry, including its remaining TTL and total
  hit count, and drop individual entries to simulate eviction.

The server holds a single ``LocalEmbedder``, a single
``RedisSemanticCache``, and a single ``MockLLM`` for the lifetime of
the process. The first run downloads the embedding model (~80 MB)
into the local Hugging Face cache; everything after is local.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlparse

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from cache import CacheHit, CacheMiss, RedisSemanticCache
    from embeddings import LocalEmbedder
    from mock_llm import MockLLM
    from seed_cache import SEED_ENTRIES, seed
except ImportError as exc:
    print(f"Error: {exc}")
    print(
        "Make sure the required packages are installed:\n"
        "    pip install redis sentence-transformers numpy"
    )
    sys.exit(1)


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Semantic Cache Demo</title>
  <style>
    :root {
      --bg: #eef3f1;
      --panel: #ffffff;
      --ink: #1d2730;
      --accent: #267d6b;
      --accent-dark: #1a594c;
      --muted: #5c6770;
      --line: #d4dfdb;
      --ok: #d2ecdf;
      --warn: #f8e0d0;
      --miss: #f1d9d9;
      --pill: #d9ebe6;
      --card: #fbfdfc;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #f3faf7, transparent 32rem),
        linear-gradient(180deg, #ecf2f0 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main { max-width: 1180px; margin: 0 auto; padding: 40px 20px 72px; }
    h1 { font-size: clamp(2rem, 4.6vw, 3.4rem); line-height: 1.05; margin-bottom: 8px; }
    p.lede { max-width: 60rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid; gap: 18px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 24px;
    }
    .panel {
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 20px;
      box-shadow: 0 10px 32px rgba(20, 60, 50, 0.07);
    }
    .panel.wide { grid-column: 1 / -1; }
    .panel h2 { margin-top: 0; margin-bottom: 8px; font-size: 1.25rem; }
    .panel h3 { margin: 14px 0 6px; font-size: 1rem; }
    .pill {
      display: inline-block; border-radius: 999px;
      background: var(--pill); color: var(--accent-dark);
      padding: 6px 10px; font-size: 0.85rem; margin-bottom: 10px;
    }
    label { display: block; font-weight: bold; margin: 10px 0 4px; }
    input, select, textarea {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
    textarea { min-height: 64px; resize: vertical; }
    input[type=checkbox] { width: auto; }
    .check-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; }
    .check-row label { margin: 0; font-weight: normal; }
    button {
      appearance: none; border: 0; border-radius: 999px;
      background: var(--accent); color: white;
      padding: 10px 16px; font: inherit; cursor: pointer;
      margin-right: 6px; margin-top: 10px;
    }
    button.secondary { background: #3b4951; }
    button.danger { background: #8a3a3a; }
    button.small {
      padding: 5px 10px; font-size: 0.85rem; margin-top: 4px;
      border-radius: 7px;
    }
    button:hover { filter: brightness(0.92); }
    dl { display: grid; grid-template-columns: max-content 1fr;
         gap: 6px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .row > * { flex: 1 1 0; min-width: 120px; }
    table { width: 100%; border-collapse: collapse; font-size: 0.92rem; }
    th, td { text-align: left; padding: 6px 8px;
             border-bottom: 1px solid var(--line); vertical-align: top; }
    th { color: var(--muted); font-weight: bold; }
    code, .mono { font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
                  font-size: 0.85rem; }
    .badge {
      display: inline-block; border-radius: 6px;
      padding: 2px 7px; font-size: 0.8rem; font-weight: bold;
    }
    .badge.hit { background: var(--ok); color: #1d4a2c; }
    .badge.miss { background: var(--miss); color: #6b2020; }
    .badge.dist { background: #e6e0f0; color: #43326a; }
    .badge.ttl { background: #e0ecf5; color: #1d3d59; }
    .verdict {
      display: flex; align-items: center; gap: 10px;
      padding: 12px 14px; border-radius: 12px; margin-top: 6px;
    }
    .verdict.hit { background: var(--ok); }
    .verdict.miss { background: var(--miss); }
    .verdict .label { font-size: 1.2rem; font-weight: bold; }
    .answer {
      margin-top: 10px; padding: 12px 14px;
      background: var(--card); border: 1px solid var(--line);
      border-radius: 10px;
    }
    .answer p { margin: 0; }
    .stats {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px; margin-top: 10px;
    }
    .stat {
      background: var(--card); border: 1px solid var(--line);
      border-radius: 10px; padding: 10px 12px;
    }
    .stat .num {
      font-size: 1.5rem; font-weight: bold; color: var(--accent-dark);
    }
    .stat .lbl { color: var(--muted); font-size: 0.85rem; }
    .threshold-row {
      display: flex; align-items: center; gap: 10px;
      margin-top: 10px;
    }
    .threshold-row input[type=range] {
      flex: 1; padding: 0;
    }
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    details summary {
      cursor: pointer; font-weight: bold; margin-top: 8px;
      color: var(--accent-dark);
    }
  </style>
</head>
<body>
  <main>
    <div class="pill" id="stack-label">loading…</div>
    <h1>Redis Semantic Cache Demo</h1>
    <p class="lede">
      A small semantic cache sits in front of a mock LLM. Each cache
      entry is a Hash at <code>__KEY_PREFIX__&lt;id&gt;</code> holding
      the prompt, the response, the prompt's 384-dimensional embedding,
      and metadata fields. A single <code>FT.SEARCH</code> on
      <code>__INDEX_NAME__</code> does the KNN against cached prompts
      with a TAG pre-filter (tenant, locale, model version, safety) in
      the same round trip. If the closest cached prompt is within the
      cosine-distance threshold, the demo serves the cached response
      and the LLM is not called at all.
    </p>

    <div class="grid">

      <section class="panel wide">
        <h2>Ask the LLM</h2>
        <p>Type a question, optionally adjust the metadata filters and
        the distance threshold, and submit. The server embeds the
        prompt, runs <code>FT.SEARCH</code> with KNN over the cache,
        and either serves the cached response (hit) or runs the mock
        LLM and writes the new response back to the cache (miss).</p>
        <label for="q-prompt">Prompt</label>
        <textarea id="q-prompt"
                  placeholder="e.g. How do I return an item?">How do I return an item?</textarea>
        <div class="row">
          <div>
            <label for="q-tenant">Tenant</label>
            <select id="q-tenant">
              <option value="acme">acme</option>
              <option value="globex">globex</option>
              <option value="initech">initech</option>
            </select>
          </div>
          <div>
            <label for="q-locale">Locale</label>
            <select id="q-locale">
              <option value="en">en</option>
              <option value="fr">fr</option>
              <option value="de">de</option>
            </select>
          </div>
          <div>
            <label for="q-model">Model version</label>
            <select id="q-model">
              <option value="gpt-4.5-2026">gpt-4.5-2026</option>
              <option value="gpt-4-2025">gpt-4-2025</option>
            </select>
          </div>
        </div>
        <div class="threshold-row">
          <label for="q-threshold" style="margin: 0; min-width: 9rem;">
            Distance threshold
          </label>
          <input id="q-threshold" type="range" min="0.0" max="1.0"
                 step="0.02" value="0.5">
          <span class="mono" id="q-threshold-value">0.50</span>
        </div>
        <p class="meta" style="color: var(--muted); margin-top: 4px;">
          The cache serves a hit when the closest cached prompt's
          cosine distance is at or below this threshold. Lower =
          stricter (fewer hits, safer reuse); higher = looser (more
          hits, more risk of serving a near-miss).
        </p>
        <button id="ask-button">Ask</button>
        <button id="lookup-button" class="secondary">Lookup only (no LLM)</button>

        <div id="verdict" class="verdict" style="display: none;"></div>
        <div id="answer" class="answer" style="display: none;"></div>
        <div id="timing" class="meta" style="margin-top: 10px;"></div>
      </section>

      <section class="panel">
        <h2>Cumulative savings</h2>
        <p>Every hit avoids one LLM round trip. The numbers below add
        up across the session — tokens that would have been spent and
        wall-clock seconds that would have been waited if the cache
        had not served the answer.</p>
        <div class="stats">
          <div class="stat">
            <div class="num" id="stat-queries">0</div>
            <div class="lbl">Total queries</div>
          </div>
          <div class="stat">
            <div class="num" id="stat-hits">0</div>
            <div class="lbl">Cache hits</div>
          </div>
          <div class="stat">
            <div class="num" id="stat-misses">0</div>
            <div class="lbl">Cache misses</div>
          </div>
          <div class="stat">
            <div class="num" id="stat-hitratio">0%</div>
            <div class="lbl">Hit ratio</div>
          </div>
          <div class="stat">
            <div class="num" id="stat-tokens">0</div>
            <div class="lbl">Tokens saved</div>
          </div>
          <div class="stat">
            <div class="num" id="stat-ms">0 ms</div>
            <div class="lbl">LLM time saved</div>
          </div>
        </div>
      </section>

      <section class="panel">
        <h2>Index state</h2>
        <div id="index-state"></div>
        <button id="reset-button" class="danger">Clear cache and re-seed</button>
      </section>

      <section class="panel wide">
        <h2>Cached entries</h2>
        <p>Every prompt/response pair currently in the cache.
        <code>hit_count</code> is the running total of times the entry
        has served a hit; <code>ttl</code> is the remaining lifetime
        in seconds before <code>EXPIRE</code> drops the key. Click
        <strong>Drop</strong> to simulate eviction.</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Prompt</th>
              <th>Metadata</th>
              <th>Hits</th>
              <th>TTL</th>
              <th></th>
            </tr>
          </thead>
          <tbody id="entries-body"></tbody>
        </table>
      </section>

    </div>

    <div id="status"></div>
  </main>

  <script>
    const $ = sel => document.querySelector(sel);
    const status = $('#status');

    let stats = {
      queries: 0, hits: 0, misses: 0,
      tokens_saved: 0, ms_saved: 0,
    };

    // Every value that ends up inside ``innerHTML`` flows through this
    // helper. Cached prompts are user input — a prompt like
    // ``<img src=x onerror=alert(1)>`` would otherwise execute when
    // the cache table is rendered. The pattern matters less for a
    // local demo (the only user is the operator) but it matters a lot
    // for the example: docs readers copy what they see.
    function esc(value) {
      if (value == null) return '';
      return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    function showStatus(text, kind) {
      status.textContent = text;
      status.className = kind || 'ok';
      setTimeout(() => { status.className = ''; status.textContent = ''; }, 4000);
    }

    async function postForm(path, params) {
      const body = new URLSearchParams(params || {}).toString();
      const res = await fetch(path, {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body,
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text}`);
      }
      return res.json();
    }

    async function getJson(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(`${res.status}`);
      return res.json();
    }

    function renderEntry(entry) {
      return `
        <tr>
          <td><code>${esc(entry.id)}</code></td>
          <td>${esc(entry.prompt)}</td>
          <td class="meta">
            ${esc(entry.tenant)} · ${esc(entry.locale)}<br>
            <code>${esc(entry.model_version)}</code>
          </td>
          <td>${esc(entry.hit_count)}</td>
          <td>${esc(entry.ttl_seconds)}s</td>
          <td>
            <button class="small danger" data-drop-id="${esc(entry.id)}">Drop</button>
          </td>
        </tr>
      `;
    }

    function renderIndex(info) {
      $('#index-state').innerHTML = `
        <dl>
          <dt>Entries</dt><dd>${esc(info.num_docs)}</dd>
          <dt>Index name</dt><dd><code>${esc(info.index_name)}</code></dd>
          <dt>Indexing failures</dt><dd>${esc(info.indexing_failures)}</dd>
          <dt>Vector index size</dt><dd>${esc(info.vector_index_size_mb)} MB</dd>
          <dt>Embedding model</dt><dd><code>${esc(info.model)}</code></dd>
          <dt>Mock LLM latency</dt><dd>${esc(info.mock_llm_latency_ms)} ms</dd>
        </dl>
      `;
    }

    function renderStats() {
      $('#stat-queries').textContent = stats.queries;
      $('#stat-hits').textContent = stats.hits;
      $('#stat-misses').textContent = stats.misses;
      const ratio = stats.queries === 0
        ? '0%'
        : Math.round((stats.hits / stats.queries) * 100) + '%';
      $('#stat-hitratio').textContent = ratio;
      $('#stat-tokens').textContent = stats.tokens_saved;
      $('#stat-ms').textContent = Math.round(stats.ms_saved) + ' ms';
    }

    function renderVerdict(payload) {
      const verdict = $('#verdict');
      const answer = $('#answer');
      const timing = $('#timing');
      verdict.style.display = 'flex';
      answer.style.display = 'block';
      if (payload.outcome === 'hit') {
        verdict.className = 'verdict hit';
        verdict.innerHTML = `
          <span class="label">CACHE HIT</span>
          <span class="badge dist">distance ${esc(payload.distance.toFixed(3))}</span>
          <span class="badge ttl">ttl ${esc(payload.ttl_seconds)}s</span>
          <span class="meta">entry <code>${esc(payload.entry_id)}</code>, ${esc(payload.hit_count)} hit(s)</span>
        `;
      } else {
        verdict.className = 'verdict miss';
        const nearest = payload.nearest_distance == null
          ? 'no candidate in scope'
          : 'nearest distance ' + payload.nearest_distance.toFixed(3);
        verdict.innerHTML = `
          <span class="label">CACHE MISS</span>
          <span class="meta">${esc(nearest)} (threshold ${esc(payload.threshold.toFixed(2))})</span>
          ${payload.wrote_entry_id
            ? '<span class="badge ttl">cached as <code>' + esc(payload.wrote_entry_id) + '</code></span>'
            : ''}
        `;
      }
      answer.innerHTML = `<p>${esc(payload.response) || '(no response)'}</p>`;
      timing.innerHTML = `
        Embed: <code>${payload.embed_ms.toFixed(1)} ms</code> ·
        Cache lookup: <code>${payload.lookup_ms.toFixed(1)} ms</code> ·
        LLM: <code>${payload.llm_ms != null ? payload.llm_ms.toFixed(1) + ' ms' : '— (skipped)'}</code> ·
        Total: <code>${payload.total_ms.toFixed(1)} ms</code>
      `;
    }

    // First time we see /state we use the server-side defaults to
    // initialise the UI: the stack label badge (so the same HTML
    // serves every language demo) and the threshold slider (so the
    // --threshold flag visibly changes the demo's behaviour rather
    // than being shadowed by a hardcoded UI default).
    let stateInitialised = false;

    async function refreshState() {
      const state = await getJson('/state');
      renderIndex(state.index);
      if (!stateInitialised) {
        if (state.index.stack_label) {
          $('#stack-label').textContent = state.index.stack_label;
        }
        if (state.index.default_threshold != null) {
          const slider = $('#q-threshold');
          slider.value = state.index.default_threshold;
          $('#q-threshold-value').textContent =
            Number(slider.value).toFixed(2);
        }
        stateInitialised = true;
      }
      const body = $('#entries-body');
      body.innerHTML = (state.entries || []).map(renderEntry).join('')
        || '<tr><td colspan="6" class="meta">(cache is empty)</td></tr>';
    }

    async function ask(lookupOnly) {
      const params = {
        prompt: $('#q-prompt').value,
        tenant: $('#q-tenant').value,
        locale: $('#q-locale').value,
        model_version: $('#q-model').value,
        threshold: $('#q-threshold').value,
        lookup_only: lookupOnly ? '1' : '',
      };
      try {
        const payload = await postForm('/query', params);
        renderVerdict(payload);
        // Lookup-only queries are a dry-run for threshold exploration:
        // no LLM call would have happened either way, so they don't
        // count as queries the cache "served" or as savings the cache
        // produced. Updating any of these would skew the hit-ratio,
        // tokens-saved, and ms-saved panels — exactly the numbers the
        // user is watching when sweeping the threshold.
        if (!lookupOnly) {
          stats.queries += 1;
          if (payload.outcome === 'hit') {
            stats.hits += 1;
            stats.tokens_saved += payload.tokens_avoided || 0;
            stats.ms_saved += payload.ms_avoided || 0;
          } else {
            stats.misses += 1;
          }
          renderStats();
        }
        await refreshState();
      } catch (exc) {
        showStatus('Query failed: ' + exc.message, 'error');
      }
    }

    $('#q-threshold').addEventListener('input', () => {
      $('#q-threshold-value').textContent =
        Number($('#q-threshold').value).toFixed(2);
    });
    $('#ask-button').onclick = () => ask(false);
    $('#lookup-button').onclick = () => ask(true);
    $('#reset-button').onclick = async () => {
      try {
        await postForm('/reset', {});
        stats = {queries: 0, hits: 0, misses: 0, tokens_saved: 0, ms_saved: 0};
        renderStats();
        $('#verdict').style.display = 'none';
        $('#answer').style.display = 'none';
        $('#timing').textContent = '';
        await refreshState();
        showStatus('Cache cleared and re-seeded', 'ok');
      } catch (exc) {
        showStatus('Reset failed: ' + exc.message, 'error');
      }
    };

    document.body.addEventListener('click', async e => {
      const id = e.target?.dataset?.dropId;
      if (!id) return;
      try {
        await postForm('/drop', {entry_id: id});
        await refreshState();
        showStatus(`Dropped ${id}`, 'ok');
      } catch (exc) {
        showStatus('Drop failed: ' + exc.message, 'error');
      }
    });

    refreshState();
    renderStats();
  </script>
</body>
</html>
"""


class SemanticCacheDemo:
    """Demo state: cache management, mock LLM, cumulative stats."""

    def __init__(
        self,
        cache: RedisSemanticCache,
        embedder: LocalEmbedder,
        llm: MockLLM,
        default_tenant: str = "acme",
        default_locale: str = "en",
    ) -> None:
        self.cache = cache
        self.embedder = embedder
        self.llm = llm
        self.default_tenant = default_tenant
        self.default_locale = default_locale
        self._lock = Lock()

    def seed(self) -> int:
        """Drop everything in scope and pre-populate with FAQ entries."""
        with self._lock:
            self.cache.clear()
            return seed(
                self.cache,
                self.embedder,
                tenant=self.default_tenant,
                locale=self.default_locale,
                model_version=self.llm.model_version,
            )

    def run_query(
        self,
        prompt: str,
        tenant: str,
        locale: str,
        model_version: str,
        threshold: float,
        lookup_only: bool,
    ) -> dict:
        """The hot path: embed, look up, optionally call the LLM, cache.

        Timings are taken with ``time.perf_counter`` around each
        bounded step so the UI can display the embed / lookup / LLM
        breakdown separately. The cache write on a miss is *not*
        included in ``total_ms`` so the latency number reflects the
        user-facing wait, not the background bookkeeping.
        """
        t0 = time.perf_counter()
        query_vec = self.embedder.encode_one(prompt)
        embed_ms = (time.perf_counter() - t0) * 1000

        t1 = time.perf_counter()
        result = self.cache.lookup(
            query_vec,
            tenant=tenant,
            locale=locale,
            model_version=model_version,
            distance_threshold=threshold,
        )
        lookup_ms = (time.perf_counter() - t1) * 1000

        if isinstance(result, CacheHit):
            return {
                "outcome": "hit",
                "response": result.response,
                "entry_id": result.id,
                "distance": result.distance,
                "ttl_seconds": result.ttl_seconds,
                "hit_count": result.hit_count,
                "threshold": threshold,
                "embed_ms": embed_ms,
                "lookup_ms": lookup_ms,
                "llm_ms": None,
                "total_ms": embed_ms + lookup_ms,
                "tokens_avoided": _estimate_response_tokens(
                    result.prompt, result.response,
                ),
                "ms_avoided": self.llm.latency_ms,
            }

        # Miss path. In "lookup only" mode the demo reports the miss
        # without actually calling the LLM — useful for sweeping the
        # threshold against a fixed prompt to see where the cutoff
        # would fall without polluting the cache.
        assert isinstance(result, CacheMiss)
        if lookup_only:
            return {
                "outcome": "miss",
                "response": "(LLM not called in lookup-only mode)",
                "nearest_distance": result.nearest_distance,
                "threshold": threshold,
                "wrote_entry_id": None,
                "embed_ms": embed_ms,
                "lookup_ms": lookup_ms,
                "llm_ms": None,
                "total_ms": embed_ms + lookup_ms,
            }

        t2 = time.perf_counter()
        llm_response = self.llm.complete(prompt)
        llm_ms = (time.perf_counter() - t2) * 1000

        # Write the new entry back. The embedding is the same vector
        # we already used for the lookup — no need to re-encode.
        entry_id = self.cache.put(
            prompt=prompt,
            response=llm_response.response,
            embedding=query_vec,
            tenant=tenant,
            locale=locale,
            model_version=model_version,
        )
        return {
            "outcome": "miss",
            "response": llm_response.response,
            "nearest_distance": result.nearest_distance,
            "threshold": threshold,
            "wrote_entry_id": entry_id,
            "embed_ms": embed_ms,
            "lookup_ms": lookup_ms,
            "llm_ms": llm_ms,
            "total_ms": embed_ms + lookup_ms + llm_ms,
        }


def _estimate_response_tokens(prompt: str, response: str) -> int:
    """Approximate combined token cost of a prompt and its response."""
    return max(1, (len(prompt) + len(response)) // 4)


class SemanticCacheHandler(BaseHTTPRequestHandler):
    """HTTP handler. Server-state lives on class attributes."""

    cache: RedisSemanticCache | None = None
    embedder: LocalEmbedder | None = None
    demo: SemanticCacheDemo | None = None
    llm: MockLLM | None = None

    # ------------------------------------------------------------------
    # GET
    # ------------------------------------------------------------------

    def do_GET(self) -> None:
        try:
            parsed = urlparse(self.path)
            if parsed.path in {"/", "/index.html"}:
                self._send_html(self._html_page())
                return
            if parsed.path == "/state":
                self._send_json(self._build_state(), 200)
                return
            self.send_error(404)
        except Exception as exc:
            self._send_error_json(exc)

    # ------------------------------------------------------------------
    # POST
    # ------------------------------------------------------------------

    def do_POST(self) -> None:
        try:
            parsed = urlparse(self.path)
            if parsed.path == "/query":
                self._handle_query()
                return
            if parsed.path == "/reset":
                self.demo.seed()
                self._send_json({"ok": True}, 200)
                return
            if parsed.path == "/drop":
                self._handle_drop()
                return
            self.send_error(404)
        except Exception as exc:
            self._send_error_json(exc)

    def _send_error_json(self, exc: Exception) -> None:
        """Return a JSON 500 so the client's ``await res.json()`` works.

        Without this wrapper, an exception in a handler escapes to
        ``BaseHTTPRequestHandler`` which writes a plain-text 500 page;
        the demo's ``fetch().then(r => r.json())`` then explodes with
        an opaque JSON parse error instead of surfacing what went wrong.
        """
        sys.stderr.write(f"[demo] handler error: {type(exc).__name__}: {exc}\n")
        try:
            self._send_json(
                {"error": str(exc), "type": type(exc).__name__}, 500,
            )
        except Exception:
            # Headers may already be partially flushed; nothing useful
            # left to do beyond letting the connection drop.
            pass

    # ---- handlers ---------------------------------------------------

    def _handle_query(self) -> None:
        params = self._read_form()
        prompt = params.get("prompt", [""])[0].strip()
        if not prompt:
            self._send_json({"error": "prompt is required"}, 400)
            return
        try:
            threshold = float(params.get("threshold", ["0.5"])[0])
        except ValueError:
            threshold = 0.5
        # ``float()`` happily parses "nan" / "inf"; either would
        # silently turn the lookup into a permanent hit (NaN comparisons
        # are always False, so ``distance > nan`` cannot reject) or a
        # permanent miss. Clamp to the meaningful cosine-distance range
        # so a malformed POST can't override the threshold semantics.
        import math
        if not math.isfinite(threshold):
            threshold = 0.5
        threshold = max(0.0, min(2.0, threshold))
        payload = self.demo.run_query(
            prompt=prompt,
            tenant=params.get("tenant", ["acme"])[0] or "acme",
            locale=params.get("locale", ["en"])[0] or "en",
            model_version=
                params.get("model_version", [self.llm.model_version])[0]
                or self.llm.model_version,
            threshold=threshold,
            lookup_only=bool(params.get("lookup_only", [""])[0]),
        )
        self._send_json(payload, 200)

    def _handle_drop(self) -> None:
        params = self._read_form()
        entry_id = params.get("entry_id", [""])[0].strip()
        if not entry_id:
            self._send_json({"error": "entry_id is required"}, 400)
            return
        deleted = self.cache.delete_entry(entry_id)
        self._send_json({"deleted": deleted, "entry_id": entry_id}, 200)

    # ---- state assembly ---------------------------------------------

    def _build_state(self) -> dict:
        info = self.cache.index_info()
        info["index_name"] = self.cache.index_name
        info["model"] = self.embedder.model_name
        info["mock_llm_latency_ms"] = self.llm.latency_ms
        # ``default_threshold`` is what the ``--threshold`` flag
        # actually configures; the UI slider initialises to this on
        # first load so the flag visibly changes the demo's behaviour.
        # ``stack_label`` lets the same HTML render a per-language
        # badge (redis-py, node-redis, etc.) without forking the file
        # per language.
        info["default_threshold"] = self.cache.distance_threshold
        info["stack_label"] = (
            "redis-py + sentence-transformers + "
            "Python standard library HTTP server"
        )
        return {
            "index": info,
            "entries": self.cache.list_entries(limit=200),
        }

    # ---- HTTP plumbing ----------------------------------------------

    def _read_form(self) -> dict[str, list[str]]:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else ""
        return parse_qs(raw)

    def _send_html(self, html: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def _send_json(self, payload: dict, status: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload, default=_json_default).encode("utf-8"))

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stderr.write(f"[demo] {format % args}\n")

    def _html_page(self) -> str:
        return (
            HTML_TEMPLATE
            .replace("__INDEX_NAME__", self.cache.index_name)
            .replace("__KEY_PREFIX__", self.cache.key_prefix)
        )


def _json_default(value):
    if isinstance(value, np.floating):
        return float(value)
    if isinstance(value, np.integer):
        return int(value)
    if isinstance(value, np.ndarray):
        return value.tolist()
    raise TypeError(f"unserializable: {type(value).__name__}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run the Redis semantic-cache demo server.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8085, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--index-name", default="semcache:idx",
        help="Redis Search index name",
    )
    parser.add_argument(
        "--key-prefix", default="cache:",
        help="Hash key prefix for cached entries",
    )
    parser.add_argument(
        "--ttl-seconds", type=int, default=3600,
        help="TTL applied to every cache entry on write",
    )
    parser.add_argument(
        "--threshold", type=float, default=0.5,
        help="Default cosine-distance threshold for cache hits",
    )
    parser.add_argument(
        "--llm-latency-ms", type=float, default=1500.0,
        help="Simulated LLM round-trip latency in milliseconds",
    )
    parser.add_argument(
        "--no-reset", dest="reset_on_start", action="store_false",
        help=(
            "Keep any existing cached entries instead of dropping"
            " and re-seeding on startup."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=False,
    )
    try:
        redis_client.ping()
    except redis.ConnectionError as exc:
        print(f"Error: cannot reach Redis at {args.redis_host}:{args.redis_port}")
        print(f"  ({exc})")
        sys.exit(1)

    cache = RedisSemanticCache(
        redis_client=redis_client,
        index_name=args.index_name,
        key_prefix=args.key_prefix,
        distance_threshold=args.threshold,
        default_ttl_seconds=args.ttl_seconds,
    )
    cache.create_index()

    print("Loading embedding model (first run downloads ~80 MB)...")
    embedder = LocalEmbedder()
    llm = MockLLM(latency_ms=args.llm_latency_ms)

    demo = SemanticCacheDemo(
        cache=cache, embedder=embedder, llm=llm,
    )

    if args.reset_on_start:
        print(
            f"Dropping any existing cache under '{args.key_prefix}*' and"
            " re-seeding from the FAQ list (pass --no-reset to keep)."
        )
        seeded = demo.seed()
        print(f"Seeded {seeded} entries.")

    SemanticCacheHandler.cache = cache
    SemanticCacheHandler.embedder = embedder
    SemanticCacheHandler.demo = demo
    SemanticCacheHandler.llm = llm

    print(
        f"Redis semantic cache demo listening on "
        f"http://{args.host}:{args.port}"
    )
    print(
        f"Using Redis at {args.redis_host}:{args.redis_port}"
        f" with index '{args.index_name}'"
    )

    server = ThreadingHTTPServer((args.host, args.port), SemanticCacheHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

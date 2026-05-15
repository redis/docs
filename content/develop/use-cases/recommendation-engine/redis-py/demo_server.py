#!/usr/bin/env python3
"""
Redis recommendation-engine demo server.

Run this file and visit http://localhost:8084 to drive a small product
catalogue indexed by Redis Search. The UI lets you:

* Type a natural-language query, optionally with TAG / NUMERIC filters,
  and watch ``FT.SEARCH`` retrieve top-k candidates with a KNN
  pre-filter in a single round trip.
* Click any product card to feed a "click" into the user session.
  Each click writes a new exponentially weighted session vector and
  bumps a per-category affinity counter in the user features hash,
  both visible to the very next ``FT.SEARCH``.
* Toggle session-blended retrieval and category-affinity re-ranking
  independently to see what each layer contributes.
* Refresh a product's embedding live to demonstrate that the HNSW
  index reflects the new vector on the next query, with no downtime.

The server holds a single ``LocalEmbedder`` instance and reuses it
for every query-embed step; ``catalog.json`` carries the item vectors
pre-computed by ``build_catalog.py`` so startup stays fast.
"""

from __future__ import annotations

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock
from urllib.parse import parse_qs, urlparse

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from embeddings import LocalEmbedder
    from recommender import RedisRecommender, Candidate
except ImportError as exc:
    print(f"Error: {exc}")
    print(
        "Make sure the required packages are installed:\n"
        "    pip install redis sentence-transformers numpy"
    )
    sys.exit(1)


DEMO_USER_ID = "demo"


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Recommendation Engine Demo</title>
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
    input, select {
      width: 100%; padding: 9px 11px;
      border-radius: 9px; border: 1px solid #c0d2cc;
      font: inherit; background: white;
    }
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
    .row > * { flex: 1 1 0; min-width: 110px; }
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
    .badge.score { background: var(--ok); color: #1d4a2c; }
    .badge.boost { background: #e6e0f0; color: #43326a; }
    .badge.stockout { background: var(--warn); color: #6b3220; }
    .cards {
      display: grid; gap: 10px;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      margin-top: 8px;
    }
    .card {
      background: var(--card); border: 1px solid var(--line);
      border-radius: 12px; padding: 12px;
      display: flex; flex-direction: column; gap: 4px;
    }
    .card .name { font-weight: bold; }
    .card .meta { font-size: 0.85rem; color: var(--muted); }
    .card .price { font-weight: bold; }
    .scores { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 4px; }
    .scores .badge { font-size: 0.75rem; }
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
    <div class="pill">redis-py + sentence-transformers + Python standard library HTTP server</div>
    <h1>Redis Recommendation Engine Demo</h1>
    <p class="lede">
      A small product catalogue is indexed by Redis Search at
      <code>__INDEX_NAME__</code>: each item is a Hash holding its
      metadata plus a 384-dimensional embedding. One <code>FT.SEARCH</code>
      with a <code>KNN</code> clause does similarity retrieval and
      structured pre-filtering in the same call. Click a product card
      to feed a click into the session — Redis updates the user-features
      hash atomically, and the very next query picks it up.
    </p>

    <div class="grid">

      <section class="panel wide">
        <h2>Search</h2>
        <p>The query text is embedded with the same model used to build
        the catalogue, then handed to <code>FT.SEARCH</code> as the
        <code>$vec</code> parameter inside a
        <code>KNN __TOPK__ @embedding</code> clause. Filters become
        TAG / NUMERIC predicates in front of the KNN, applied in one
        round trip.</p>
        <div class="row">
          <div style="flex: 2 1 360px;">
            <label for="q-text">Query</label>
            <input id="q-text" type="text"
                   value="warm waterproof jacket for hiking"
                   placeholder="describe what you want">
          </div>
          <div>
            <label for="q-category">Category</label>
            <select id="q-category"><option value="">(any)</option></select>
          </div>
          <div>
            <label for="q-brand">Brand</label>
            <select id="q-brand"><option value="">(any)</option></select>
          </div>
        </div>
        <div class="row">
          <div>
            <label for="q-min-price">Min price</label>
            <input id="q-min-price" type="number" min="0" step="1">
          </div>
          <div>
            <label for="q-max-price">Max price</label>
            <input id="q-max-price" type="number" min="0" step="1">
          </div>
          <div>
            <label for="q-min-rating">Min rating</label>
            <input id="q-min-rating" type="number" min="0" max="5" step="0.1">
          </div>
          <div>
            <label for="q-k">Top K</label>
            <input id="q-k" type="number" min="1" max="40" value="__TOPK__">
          </div>
        </div>
        <div class="row">
          <div class="check-row">
            <input id="q-in-stock" type="checkbox" checked>
            <label for="q-in-stock">In stock only</label>
          </div>
          <div class="check-row">
            <input id="q-use-session" type="checkbox" checked>
            <label for="q-use-session">Blend session vector into query</label>
          </div>
          <div class="check-row">
            <input id="q-rerank" type="checkbox" checked>
            <label for="q-rerank">Re-rank with category affinities</label>
          </div>
        </div>
        <button id="search-button">Search</button>
        <div id="search-meta" class="meta" style="margin-top: 10px;"></div>
        <div id="search-results"></div>
      </section>

      <section class="panel">
        <h2>Session signal</h2>
        <p>Each click writes the user features hash (<code>HSET
        __USER_KEY__</code>) — a new session vector via EWMA over the
        clicked item vectors, and a per-category affinity counter.
        The next <code>FT.SEARCH</code> sees it immediately; no batch
        cycle.</p>
        <dl id="user-features"></dl>
        <h3>Affinities</h3>
        <div id="user-affinities"></div>
        <h3>Recent clicks</h3>
        <ul id="recent-clicks"></ul>
        <button id="reset-user-button" class="secondary">Reset session</button>
      </section>

      <section class="panel">
        <h2>Refresh an item embedding</h2>
        <p>Re-embed a single product with a new piece of text and
        <code>HSET</code> the bytes back. The HNSW index reflects the
        change on the very next query — production embedding rollouts
        use the same path.</p>
        <label for="refresh-product">Product</label>
        <select id="refresh-product"></select>
        <label for="refresh-text">New text to embed</label>
        <input id="refresh-text"
               value="luxurious heavy parka with hood for arctic expedition">
        <button id="refresh-button">Refresh embedding</button>
        <p class="meta" id="refresh-meta" style="margin-top: 6px;"></p>
      </section>

      <section class="panel wide">
        <h2>Catalogue</h2>
        <p>Every item in the index, sorted by price. Click a card to
        record a session click.</p>
        <div class="cards" id="catalog-cards"></div>
      </section>

      <section class="panel wide">
        <h2>Index state</h2>
        <div id="index-state"></div>
        <button id="reset-index-button" class="danger">Reset everything (re-index from catalog.json)</button>
      </section>

    </div>

    <div id="status"></div>
  </main>

  <script>
    const $ = sel => document.querySelector(sel);
    const status = $('#status');

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

    function renderUser(features) {
      const dl = $('#user-features');
      dl.innerHTML = `
        <dt>Clicks</dt><dd>${features.clicks}</dd>
        <dt>Last clicked</dt>
        <dd>${features.last_clicked_id ? features.last_clicked_id + ' (' + features.last_clicked_category + ')' : '—'}</dd>
        <dt>Session vector</dt>
        <dd>${features.has_session_vec ? '✓ stored, ' + features.session_vec_dim + ' floats' : '—'}</dd>
      `;
      const aff = $('#user-affinities');
      const entries = Object.entries(features.affinities || {});
      if (!entries.length) {
        aff.textContent = '(none yet)';
      } else {
        entries.sort((a, b) => b[1] - a[1]);
        aff.innerHTML = entries.map(([cat, w]) =>
          `<span class="badge score">${cat} +${w.toFixed(2)}</span>`
        ).join(' ');
      }
      const ul = $('#recent-clicks');
      ul.innerHTML = (features.recent_clicks || []).map(rc =>
        `<li><code>${rc.id}</code> ${rc.name}</li>`
      ).join('') || '<li>(none)</li>';
    }

    function renderIndex(info) {
      $('#index-state').innerHTML = `
        <dl>
          <dt>Indexed documents</dt><dd>${info.num_docs}</dd>
          <dt>Index name</dt><dd><code>${info.index_name}</code></dd>
          <dt>Indexing failures</dt><dd>${info.indexing_failures}</dd>
          <dt>Vector index size</dt><dd>${info.vector_index_size_mb} MB</dd>
          <dt>Embedding model</dt><dd><code>${info.model}</code></dd>
        </dl>
      `;
    }

    function renderResult(c) {
      const stockBadge = c.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      // c.score is a cosine distance (0 = identical), optionally
      // reduced by a category-affinity bonus at rerank time. Lower
      // means more relevant. When the rerank actually pulled the score
      // down by more than a token amount, surface the size of the
      // bonus so the boost is visible.
      const boost = c.vector_distance - c.score;
      const boostBadge = boost > 0.005
        ? ` <span class="badge boost">−${boost.toFixed(3)} affinity</span>`
        : '';
      return `
        <tr>
          <td><code>${c.id}</code></td>
          <td>
            <strong>${c.name}</strong> ${stockBadge}<br>
            <span class="meta">${c.brand} · ${c.category} · $${c.price.toFixed(2)} · ★ ${c.rating.toFixed(1)}</span>
          </td>
          <td>
            <span class="badge score">${c.score.toFixed(3)}</span>${boostBadge}
          </td>
          <td><button class="small" data-click-id="${c.id}">Click</button></td>
        </tr>
      `;
    }

    function renderSearch(payload) {
      const meta = $('#search-meta');
      meta.innerHTML = `
        Returned ${payload.candidates.length} candidate(s) in
        <code>${payload.timing_ms.toFixed(2)} ms</code>
        (embed: <code>${payload.embed_ms.toFixed(2)} ms</code>,
        search: <code>${payload.search_ms.toFixed(2)} ms</code>,
        rerank: <code>${payload.rerank_ms.toFixed(2)} ms</code>).
        Filter: <code>${payload.filter_clause}</code>.
        Session blended: ${payload.used_session ? 'yes' : 'no'};
        re-ranked: ${payload.used_rerank ? 'yes' : 'no'}.
      `;
      const rows = payload.candidates.map(renderResult).join('');
      $('#search-results').innerHTML = `
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Product</th>
              <th>Score <span class="meta">(cosine distance, lower = closer)</span></th>
              <th></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      `;
    }

    function productCard(p) {
      const stockBadge = p.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      return `
        <div class="card">
          <span class="name">${p.name} ${stockBadge}</span>
          <span class="meta">${p.brand} · ${p.category}</span>
          <span class="meta">★ ${p.rating.toFixed(1)}</span>
          <span class="price">$${p.price.toFixed(2)}</span>
          <button class="small" data-click-id="${p.id}">Click</button>
        </div>
      `;
    }

    function renderCatalog(products) {
      $('#catalog-cards').innerHTML = products.map(productCard).join('');
      const refresh = $('#refresh-product');
      refresh.innerHTML = products.map(p =>
        `<option value="${p.id}">${p.id} — ${p.name}</option>`
      ).join('');
    }

    function populateSelect(id, values) {
      const sel = document.querySelector(id);
      const current = sel.value;
      sel.innerHTML = '<option value="">(any)</option>'
        + values.map(v => `<option value="${v}">${v}</option>`).join('');
      sel.value = current;
    }

    async function refreshState() {
      const state = await getJson('/state');
      renderUser(state.user);
      renderIndex(state.index);
      renderCatalog(state.products);
      populateSelect('#q-category', state.categories);
      populateSelect('#q-brand', state.brands);
    }

    async function search() {
      const params = {
        query: $('#q-text').value,
        category: $('#q-category').value,
        brand: $('#q-brand').value,
        min_price: $('#q-min-price').value,
        max_price: $('#q-max-price').value,
        min_rating: $('#q-min-rating').value,
        k: $('#q-k').value,
        in_stock_only: $('#q-in-stock').checked ? '1' : '',
        use_session: $('#q-use-session').checked ? '1' : '',
        rerank: $('#q-rerank').checked ? '1' : '',
      };
      try {
        const payload = await postForm('/search', params);
        renderSearch(payload);
      } catch (exc) {
        showStatus('Search failed: ' + exc.message, 'error');
      }
    }

    async function recordClick(productId) {
      try {
        const payload = await postForm('/click', {product_id: productId});
        showStatus(`Click recorded: ${productId} (${payload.category})`, 'ok');
        renderUser(payload.user);
      } catch (exc) {
        showStatus('Click failed: ' + exc.message, 'error');
      }
    }

    document.body.addEventListener('click', e => {
      const id = e.target?.dataset?.clickId;
      if (id) recordClick(id);
    });

    $('#search-button').onclick = search;
    $('#reset-user-button').onclick = async () => {
      await postForm('/reset-user', {});
      await refreshState();
      $('#search-results').innerHTML = '';
      $('#search-meta').textContent = '';
      showStatus('Session cleared', 'ok');
    };
    $('#reset-index-button').onclick = async () => {
      await postForm('/reset-index', {});
      await refreshState();
      showStatus('Re-indexed catalogue from catalog.json', 'ok');
    };
    $('#refresh-button').onclick = async () => {
      const productId = $('#refresh-product').value;
      const text = $('#refresh-text').value;
      try {
        const payload = await postForm('/refresh-embedding',
          {product_id: productId, text});
        $('#refresh-meta').innerHTML =
          `Refreshed <code>${payload.product_id}</code>. ` +
          `Embedding wrote in <code>${payload.embed_ms.toFixed(2)} ms</code>; ` +
          `next FT.SEARCH will see the new vector.`;
        showStatus(`Re-embedded ${payload.product_id}`, 'ok');
      } catch (exc) {
        showStatus('Refresh failed: ' + exc.message, 'error');
      }
    };

    refreshState();
  </script>
</body>
</html>
"""


class RecommendationDemo:
    """Demo state: catalogue ingestion, click history, helper accessors."""

    def __init__(
        self,
        recommender: RedisRecommender,
        embedder: LocalEmbedder,
        catalog_path: Path,
        user_id: str = DEMO_USER_ID,
    ) -> None:
        self.recommender = recommender
        self.embedder = embedder
        self.catalog_path = catalog_path
        self.user_id = user_id
        self._catalog_data: dict | None = None
        self._recent_clicks: list[dict] = []
        self._recent_lock = Lock()

    def _load_catalog(self) -> dict:
        if self._catalog_data is None:
            self._catalog_data = json.loads(self.catalog_path.read_text())
        return self._catalog_data

    def model_name(self) -> str:
        return self._load_catalog().get("model", self.embedder.model_name)

    def seed_index(self) -> int:
        """Drop and rebuild the index from ``catalog.json``."""
        self.recommender.drop_index(delete_documents=True)
        self.recommender.create_index()
        data = self._load_catalog()
        n = self.recommender.index_products(data["products"])
        return n

    def reset_user(self) -> None:
        self.recommender.reset_user(self.user_id)
        with self._recent_lock:
            self._recent_clicks.clear()

    def record_click(self, product_id: str) -> dict:
        result = self.recommender.record_click(self.user_id, product_id)
        # Pull the product name to display in the recent-clicks list.
        name = self._product_name(product_id)
        with self._recent_lock:
            self._recent_clicks.insert(0, {"id": product_id, "name": name})
            del self._recent_clicks[6:]
        return result

    def _product_name(self, product_id: str) -> str:
        raw = self.recommender.redis.hget(
            self.recommender.product_key(product_id), "name",
        )
        if raw is None:
            return product_id
        return raw.decode("utf-8") if isinstance(raw, bytes) else raw

    def user_state(self) -> dict:
        features = self.recommender.get_user_features(self.user_id)
        with self._recent_lock:
            recent = list(self._recent_clicks)
        return {
            "clicks": features["clicks"],
            "last_clicked_id": features["last_clicked_id"],
            "last_clicked_category": features["last_clicked_category"],
            "affinities": features["affinities"],
            "has_session_vec": features["session_vec"] is not None,
            "session_vec_dim":
                int(features["session_vec"].shape[0])
                if features["session_vec"] is not None else 0,
            "recent_clicks": recent,
        }


class RecommenderDemoHandler(BaseHTTPRequestHandler):
    """HTTP handler. Server-state lives on class attributes."""

    recommender: RedisRecommender | None = None
    embedder: LocalEmbedder | None = None
    demo: RecommendationDemo | None = None
    default_topk: int = 10

    # ------------------------------------------------------------------
    # GET
    # ------------------------------------------------------------------

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return
        if parsed.path == "/state":
            self._send_json(self._build_state(), 200)
            return
        self.send_error(404)

    # ------------------------------------------------------------------
    # POST
    # ------------------------------------------------------------------

    def do_POST(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path == "/search":
            self._handle_search()
            return
        if parsed.path == "/click":
            self._handle_click()
            return
        if parsed.path == "/reset-user":
            self.demo.reset_user()
            self._send_json({"ok": True}, 200)
            return
        if parsed.path == "/reset-index":
            seeded = self.demo.seed_index()
            self.demo.reset_user()
            self._send_json({"seeded": seeded}, 200)
            return
        if parsed.path == "/refresh-embedding":
            self._handle_refresh_embedding()
            return
        self.send_error(404)

    # ---- handlers ---------------------------------------------------

    def _handle_search(self) -> None:
        params = self._read_form()
        query_text = params.get("query", [""])[0].strip()
        if not query_text:
            self._send_json({"error": "query is required"}, 400)
            return

        # Embed the query string. This is the only place in the demo
        # where the live model gets called on the request path; in a
        # production pipeline this often runs in the API gateway and
        # the embedding is reused across the whole pipeline.
        import time as _time
        t0 = _time.perf_counter()
        query_vec = self.embedder.encode_one(query_text)
        embed_ms = (_time.perf_counter() - t0) * 1000

        use_session = bool(params.get("use_session", [""])[0])
        do_rerank = bool(params.get("rerank", [""])[0])
        features = self.recommender.get_user_features(self.demo.user_id)
        session_vec = features["session_vec"] if use_session else None

        k = int(params.get("k", [str(self.default_topk)])[0] or self.default_topk)
        k = max(1, min(40, k))

        kwargs = {
            "category": params.get("category", [""])[0] or None,
            "brand": params.get("brand", [""])[0] or None,
            "min_price": self._float_or_none(params, "min_price"),
            "max_price": self._float_or_none(params, "max_price"),
            "min_rating": self._float_or_none(params, "min_rating"),
            "in_stock_only": bool(params.get("in_stock_only", [""])[0]),
        }
        # Echo the actual filter clause back to the UI so the docs page
        # doesn't have to guess what the server built.
        filter_clause = RedisRecommender._build_filter_clause(
            category=kwargs["category"],
            brand=kwargs["brand"],
            min_price=kwargs["min_price"],
            max_price=kwargs["max_price"],
            in_stock_only=kwargs["in_stock_only"],
            min_rating=kwargs["min_rating"],
        )

        t1 = _time.perf_counter()
        candidates = self.recommender.candidate_retrieve(
            query_vec, k=k, session_vec=session_vec, **kwargs,
        )
        search_ms = (_time.perf_counter() - t1) * 1000

        t2 = _time.perf_counter()
        if do_rerank:
            candidates = self.recommender.rerank(candidates, features)
        rerank_ms = (_time.perf_counter() - t2) * 1000

        self._send_json(
            {
                "candidates": [c.to_dict() for c in candidates],
                "filter_clause": filter_clause,
                "used_session": session_vec is not None,
                "used_rerank": do_rerank and bool(features["affinities"]),
                "embed_ms": embed_ms,
                "search_ms": search_ms,
                "rerank_ms": rerank_ms,
                "timing_ms": embed_ms + search_ms + rerank_ms,
            },
            200,
        )

    def _handle_click(self) -> None:
        params = self._read_form()
        product_id = params.get("product_id", [""])[0].strip()
        if not product_id:
            self._send_json({"error": "product_id is required"}, 400)
            return
        try:
            result = self.demo.record_click(product_id)
        except KeyError:
            self._send_json({"error": f"unknown product {product_id}"}, 404)
            return
        self._send_json(
            {
                **result,
                "user": self.demo.user_state(),
            },
            200,
        )

    def _handle_refresh_embedding(self) -> None:
        params = self._read_form()
        product_id = params.get("product_id", [""])[0].strip()
        text = params.get("text", [""])[0].strip()
        if not product_id or not text:
            self._send_json(
                {"error": "product_id and text are required"}, 400,
            )
            return
        import time as _time
        t0 = _time.perf_counter()
        vec = self.embedder.encode_one(text)
        embed_ms = (_time.perf_counter() - t0) * 1000
        self.recommender.refresh_embedding(product_id, vec)
        self._send_json(
            {"product_id": product_id, "embed_ms": embed_ms}, 200,
        )

    # ---- state assembly ---------------------------------------------

    def _build_state(self) -> dict:
        info = self.recommender.index_info()
        info["index_name"] = self.recommender.index_name
        info["model"] = self.demo.model_name()
        return {
            "user": self.demo.user_state(),
            "index": info,
            "products": self.recommender.list_products(limit=200),
            "categories": self.recommender.list_categories(),
            "brands": self.recommender.list_brands(),
        }

    # ---- HTTP plumbing ----------------------------------------------

    def _read_form(self) -> dict[str, list[str]]:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length).decode("utf-8") if length else ""
        return parse_qs(raw)

    @staticmethod
    def _float_or_none(params: dict[str, list[str]], key: str) -> float | None:
        raw = params.get(key, [""])[0].strip()
        if raw == "":
            return None
        try:
            return float(raw)
        except ValueError:
            return None

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
            .replace("__INDEX_NAME__", self.recommender.index_name)
            .replace("__USER_KEY__", self.recommender.user_key(self.demo.user_id))
            .replace("__TOPK__", str(self.default_topk))
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
        description="Run the Redis recommendation engine demo server.",
    )
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8084, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    parser.add_argument(
        "--index-name",
        default="recommend:idx",
        help="Redis Search index name",
    )
    parser.add_argument(
        "--key-prefix",
        default="product:",
        help="Hash key prefix for indexed products",
    )
    parser.add_argument(
        "--catalog",
        default=None,
        help="Path to catalog.json (defaults to the file next to this script)",
    )
    parser.add_argument(
        "--topk",
        type=int,
        default=10,
        help="Default KNN top-K shown in the UI",
    )
    parser.add_argument(
        "--no-reset",
        dest="reset_on_start",
        action="store_false",
        help=(
            "Keep any existing index and documents instead of dropping"
            " and re-seeding on startup."
        ),
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    catalog_path = (
        Path(args.catalog) if args.catalog
        else Path(__file__).resolve().parent / "catalog.json"
    )
    if not catalog_path.exists():
        print(f"Error: catalog file not found at {catalog_path}")
        print("Generate it first with: python build_catalog.py")
        sys.exit(1)

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

    recommender = RedisRecommender(
        redis_client=redis_client,
        index_name=args.index_name,
        key_prefix=args.key_prefix,
    )

    print("Loading embedding model (first run downloads ~80 MB)...")
    embedder = LocalEmbedder()

    demo = RecommendationDemo(
        recommender=recommender,
        embedder=embedder,
        catalog_path=catalog_path,
    )

    if args.reset_on_start:
        print(
            f"Dropping any existing index '{args.index_name}' and"
            " re-seeding from catalog.json (pass --no-reset to keep)."
        )
        seeded = demo.seed_index()
        demo.reset_user()
        print(f"Indexed {seeded} products.")
    else:
        # Make sure the index exists even when we don't re-seed.
        recommender.create_index()

    RecommenderDemoHandler.recommender = recommender
    RecommenderDemoHandler.embedder = embedder
    RecommenderDemoHandler.demo = demo
    RecommenderDemoHandler.default_topk = args.topk

    print(
        f"Redis recommendation engine demo listening on "
        f"http://{args.host}:{args.port}"
    )
    print(
        f"Using Redis at {args.redis_host}:{args.redis_port}"
        f" with index '{args.index_name}'"
    )

    server = ThreadingHTTPServer((args.host, args.port), RecommenderDemoHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

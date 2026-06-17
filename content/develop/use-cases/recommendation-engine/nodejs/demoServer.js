#!/usr/bin/env node
"use strict";

/**
 * Redis recommendation-engine demo server (Node.js).
 *
 * Run this file and visit http://localhost:8085 to drive a small
 * product catalog indexed by Redis Search. The UI lets you:
 *
 *  * Type a natural-language query, optionally with TAG / NUMERIC /
 *    TEXT filters, and watch FT.SEARCH retrieve top-k candidates with
 *    a KNN pre-filter in a single round trip.
 *  * Click any product card to feed a "click" into the user session.
 *    Each click writes a new exponentially weighted session vector and
 *    bumps a per-category affinity counter in the user features hash;
 *    the next request reads that hash and folds them in.
 *  * Toggle session-blended retrieval and category-affinity re-ranking
 *    independently to see what each layer contributes.
 *  * Refresh a product's embedding live to demonstrate that the HNSW
 *    index reflects the new vector on the next query, with no downtime.
 *
 * The server holds a single ``LocalEmbedder`` and reuses it for every
 * query-embed step; ``catalog.json`` carries the item vectors
 * pre-computed by ``buildCatalog.js`` so startup stays fast.
 */

import { createServer } from "node:http";
import { performance } from "node:perf_hooks";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient } from "redis";

import { LocalEmbedder } from "./embeddings.js";
import { RedisRecommender, buildFilterClause } from "./recommender.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEMO_USER_ID = "demo";

const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Recommendation Engine Demo (Node.js)</title>
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
    #status {
      margin-top: 18px; padding: 12px 14px;
      border-radius: 12px; display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
  </style>
</head>
<body>
  <main>
    <div class="pill">node-redis + @xenova/transformers + Node.js http module</div>
    <h1>Redis Recommendation Engine Demo</h1>
    <p class="lede">
      A small product catalog is indexed by Redis Search at
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
        the catalog, then handed to <code>FT.SEARCH</code> as the
        <code>$vec</code> parameter inside a
        <code>KNN __TOPK__ @embedding</code> clause. Filters become
        TAG / NUMERIC / TEXT predicates in front of the KNN, applied
        in one round trip.</p>
        <div class="row">
          <div style="flex: 2 1 360px;">
            <label for="q-text">Query</label>
            <input id="q-text" type="text"
                   value="insulated down jacket for cold weather"
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
          <div style="flex: 2 1 280px;">
            <label for="q-description-contains">
              Description contains
              <span class="meta">(TEXT pre-filter on the description field)</span>
            </label>
            <input id="q-description-contains" type="text"
                   placeholder='e.g. "waterproof", "fleece"'>
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
        <p>Each click updates the user features hash (<code>__USER_KEY__</code>):
        a new session vector blended via EWMA over the clicked item
        vectors, plus an atomic <code>HINCRBYFLOAT</code> on the
        per-category affinity counter. The next request reads the
        updated hash and passes the session vector to
        <code>FT.SEARCH</code> as the <code>$vec</code> parameter — no
        batch cycle.</p>
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
        <h2>Catalog</h2>
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
    const $ = (sel) => document.querySelector(sel);
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
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
      });
      if (!res.ok) throw new Error(\`\${res.status}: \${await res.text()}\`);
      return res.json();
    }

    async function getJson(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(\`\${res.status}\`);
      return res.json();
    }

    function renderUser(features) {
      $('#user-features').innerHTML = \`
        <dt>Clicks</dt><dd>\${features.clicks}</dd>
        <dt>Last clicked</dt>
        <dd>\${features.last_clicked_id ? features.last_clicked_id + ' (' + features.last_clicked_category + ')' : '—'}</dd>
        <dt>Session vector</dt>
        <dd>\${features.has_session_vec ? '✓ stored, ' + features.session_vec_dim + ' floats' : '—'}</dd>
      \`;
      const aff = $('#user-affinities');
      const entries = Object.entries(features.affinities || {});
      if (!entries.length) {
        aff.textContent = '(none yet)';
      } else {
        entries.sort((a, b) => b[1] - a[1]);
        aff.innerHTML = entries.map(([cat, w]) =>
          \`<span class="badge score">\${cat} +\${w.toFixed(2)}</span>\`
        ).join(' ');
      }
      const ul = $('#recent-clicks');
      ul.innerHTML = (features.recent_clicks || []).map(rc =>
        \`<li><code>\${rc.id}</code> \${rc.name}</li>\`
      ).join('') || '<li>(none)</li>';
    }

    function renderIndex(info) {
      $('#index-state').innerHTML = \`
        <dl>
          <dt>Indexed documents</dt><dd>\${info.num_docs}</dd>
          <dt>Index name</dt><dd><code>\${info.index_name}</code></dd>
          <dt>Indexing failures</dt><dd>\${info.indexing_failures}</dd>
          <dt>Vector index size</dt><dd>\${info.vector_index_size_mb} MB</dd>
          <dt>Embedding model</dt><dd><code>\${info.model}</code></dd>
        </dl>
      \`;
    }

    function renderResult(c) {
      const stockBadge = c.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      const boost = c.vector_distance - c.score;
      const boostBadge = boost > 0.005
        ? \` <span class="badge boost">−\${boost.toFixed(3)} affinity</span>\`
        : '';
      return \`
        <tr>
          <td><code>\${c.id}</code></td>
          <td>
            <strong>\${c.name}</strong> \${stockBadge}<br>
            <span class="meta">\${c.brand} · \${c.category} · $\${c.price.toFixed(2)} · ★ \${c.rating.toFixed(1)}</span>
          </td>
          <td>
            <span class="badge score">\${c.score.toFixed(3)}</span>\${boostBadge}
          </td>
          <td><button class="small" data-click-id="\${c.id}">Click</button></td>
        </tr>
      \`;
    }

    function renderSearch(payload) {
      $('#search-meta').innerHTML = \`
        Returned \${payload.candidates.length} candidate(s) in
        <code>\${payload.timing_ms.toFixed(2)} ms</code>
        (embed: <code>\${payload.embed_ms.toFixed(2)} ms</code>,
        search: <code>\${payload.search_ms.toFixed(2)} ms</code>,
        rerank: <code>\${payload.rerank_ms.toFixed(2)} ms</code>).
        Filter: <code>\${payload.filter_clause}</code>.
        Session blended: \${payload.used_session ? 'yes' : 'no'};
        re-ranked: \${payload.used_rerank ? 'yes' : 'no'}.
      \`;
      const rows = payload.candidates.map(renderResult).join('');
      $('#search-results').innerHTML = \`
        <table>
          <thead><tr><th>ID</th><th>Product</th>
            <th>Score <span class="meta">(cosine distance, lower = closer)</span></th>
            <th></th></tr></thead>
          <tbody>\${rows}</tbody>
        </table>
      \`;
    }

    function productCard(p) {
      const stockBadge = p.in_stock
        ? '' : '<span class="badge stockout">out of stock</span>';
      return \`
        <div class="card">
          <span class="name">\${p.name} \${stockBadge}</span>
          <span class="meta">\${p.brand} · \${p.category}</span>
          <span class="meta">★ \${p.rating.toFixed(1)}</span>
          <span class="price">$\${p.price.toFixed(2)}</span>
          <button class="small" data-click-id="\${p.id}">Click</button>
        </div>
      \`;
    }

    function renderCatalog(products) {
      $('#catalog-cards').innerHTML = products.map(productCard).join('');
      $('#refresh-product').innerHTML = products.map(p =>
        \`<option value="\${p.id}">\${p.id} — \${p.name}</option>\`
      ).join('');
    }

    function populateSelect(id, values) {
      const sel = document.querySelector(id);
      const current = sel.value;
      sel.innerHTML = '<option value="">(any)</option>'
        + values.map(v => \`<option value="\${v}">\${v}</option>\`).join('');
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
        text_match: $('#q-description-contains').value,
        k: $('#q-k').value,
        in_stock_only: $('#q-in-stock').checked ? '1' : '',
        use_session: $('#q-use-session').checked ? '1' : '',
        rerank: $('#q-rerank').checked ? '1' : '',
      };
      try {
        renderSearch(await postForm('/search', params));
      } catch (exc) {
        showStatus('Search failed: ' + exc.message, 'error');
      }
    }

    async function recordClick(productId) {
      try {
        const payload = await postForm('/click', { product_id: productId });
        showStatus(\`Click recorded: \${productId} (\${payload.category})\`, 'ok');
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
      showStatus('Re-indexed catalog from catalog.json', 'ok');
    };
    $('#refresh-button').onclick = async () => {
      const productId = $('#refresh-product').value;
      const text = $('#refresh-text').value;
      try {
        const payload = await postForm('/refresh-embedding',
          { product_id: productId, text });
        $('#refresh-meta').innerHTML =
          \`Refreshed <code>\${payload.product_id}</code>. \` +
          \`Embedding wrote in <code>\${payload.embed_ms.toFixed(2)} ms</code>; \` +
          \`next FT.SEARCH will see the new vector.\`;
        showStatus(\`Re-embedded \${payload.product_id}\`, 'ok');
      } catch (exc) {
        showStatus('Refresh failed: ' + exc.message, 'error');
      }
    };

    refreshState();
  </script>
</body>
</html>
`;

// ---------------------------------------------------------------------
// Demo state
// ---------------------------------------------------------------------

class RecommendationDemo {
  constructor({ recommender, embedder, catalogPath, userId = DEMO_USER_ID }) {
    this.recommender = recommender;
    this.embedder = embedder;
    this.catalogPath = catalogPath;
    this.userId = userId;
    this._catalogData = null;
    this._recentClicks = [];
  }

  async _loadCatalog() {
    if (this._catalogData === null) {
      const raw = await fs.readFile(this.catalogPath, "utf8");
      this._catalogData = JSON.parse(raw);
    }
    return this._catalogData;
  }

  async modelName() {
    const data = await this._loadCatalog();
    return data.model || this.embedder.modelName;
  }

  async seedIndex() {
    await this.recommender.dropIndex({ deleteDocuments: true });
    await this.recommender.createIndex();
    const data = await this._loadCatalog();
    await this.recommender.indexProducts(data.products);
    return data.products.length;
  }

  async resetUser() {
    await this.recommender.resetUser(this.userId);
    this._recentClicks = [];
  }

  async recordClick(productId) {
    const result = await this.recommender.recordClick(this.userId, productId);
    const name = await this._productName(productId);
    this._recentClicks.unshift({ id: productId, name });
    this._recentClicks.length = Math.min(this._recentClicks.length, 6);
    return result;
  }

  async _productName(productId) {
    const raw = await this.recommender.redis.hGet(
      this.recommender.productKey(productId),
      "name",
    );
    return raw || productId;
  }

  async userState() {
    const features = await this.recommender.getUserFeatures(this.userId);
    return {
      clicks: features.clicks,
      last_clicked_id: features.last_clicked_id,
      last_clicked_category: features.last_clicked_category,
      affinities: features.affinities,
      has_session_vec: features.session_vec !== null,
      session_vec_dim: features.session_vec ? features.session_vec.length : 0,
      recent_clicks: [...this._recentClicks],
    };
  }
}

// ---------------------------------------------------------------------
// HTTP handlers
// ---------------------------------------------------------------------

function htmlPage({ indexName, userKey, topK }) {
  return HTML_TEMPLATE.replaceAll("__INDEX_NAME__", indexName)
    .replaceAll("__USER_KEY__", userKey)
    .replaceAll("__TOPK__", String(topK));
}

function send(res, status, body, contentType = "application/json") {
  res.statusCode = status;
  res.setHeader("Content-Type", contentType);
  res.end(typeof body === "string" ? body : JSON.stringify(body));
}

async function readForm(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return Object.fromEntries(new URLSearchParams(raw));
}

function floatOrUndefined(v) {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function intOrDefault(v, fallback) {
  if (v === undefined || v === null || v === "") return fallback;
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function makeHandler({ demo, embedder, recommender, defaultTopK }) {
  return async function (req, res) {
    try {
      const url = new URL(req.url, "http://localhost");
      if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/index.html")) {
        send(
          res, 200,
          htmlPage({
            indexName: recommender.indexName,
            userKey: recommender.userKey(demo.userId),
            topK: defaultTopK,
          }),
          "text/html; charset=utf-8",
        );
        return;
      }
      if (req.method === "GET" && url.pathname === "/state") {
        const [info, products, categories, brands, user, model] = await Promise.all([
          recommender.indexInfo(),
          recommender.listProducts(200),
          recommender.listCategories(),
          recommender.listBrands(),
          demo.userState(),
          demo.modelName(),
        ]);
        send(res, 200, {
          user,
          index: { ...info, index_name: recommender.indexName, model },
          products,
          categories,
          brands,
        });
        return;
      }
      if (req.method === "POST" && url.pathname === "/search") {
        const params = await readForm(req);
        const queryText = (params.query || "").trim();
        if (!queryText) return send(res, 400, { error: "query is required" });
        const tEmbed = performance.now();
        const queryVec = await embedder.encodeOne(queryText);
        const embedMs = performance.now() - tEmbed;

        const useSession = !!params.use_session;
        const doRerank = !!params.rerank;
        const features = await recommender.getUserFeatures(demo.userId);
        const sessionVec = useSession ? features.session_vec : null;

        const k = Math.max(1, Math.min(40, intOrDefault(params.k, defaultTopK)));
        const opts = {
          category: params.category || undefined,
          brand: params.brand || undefined,
          minPrice: floatOrUndefined(params.min_price),
          maxPrice: floatOrUndefined(params.max_price),
          minRating: floatOrUndefined(params.min_rating),
          inStockOnly: !!params.in_stock_only,
          textMatch: (params.text_match || "").trim() || undefined,
          k,
          sessionVec,
        };
        const filterClause = buildFilterClause({
          category: opts.category,
          brand: opts.brand,
          minPrice: opts.minPrice,
          maxPrice: opts.maxPrice,
          inStockOnly: opts.inStockOnly,
          minRating: opts.minRating,
          textMatch: opts.textMatch,
        });

        const tSearch = performance.now();
        let candidates = await recommender.candidateRetrieve(queryVec, opts);
        const searchMs = performance.now() - tSearch;

        const tRerank = performance.now();
        if (doRerank) candidates = recommender.rerank(candidates, features);
        const rerankMs = performance.now() - tRerank;

        send(res, 200, {
          candidates: candidates.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            category: c.category,
            brand: c.brand,
            price: c.price,
            rating: c.rating,
            in_stock: c.in_stock,
            vector_distance: round4(c.vectorDistance),
            score: round4(c.score),
          })),
          filter_clause: filterClause,
          used_session: sessionVec !== null,
          used_rerank: doRerank && Object.keys(features.affinities).length > 0,
          embed_ms: embedMs,
          search_ms: searchMs,
          rerank_ms: rerankMs,
          timing_ms: embedMs + searchMs + rerankMs,
        });
        return;
      }
      if (req.method === "POST" && url.pathname === "/click") {
        const params = await readForm(req);
        const productId = (params.product_id || "").trim();
        if (!productId) return send(res, 400, { error: "product_id is required" });
        let result;
        try {
          result = await demo.recordClick(productId);
        } catch (err) {
          if (err?.code === "UNKNOWN_PRODUCT") {
            return send(res, 404, { error: err.message });
          }
          throw err;
        }
        send(res, 200, { ...result, user: await demo.userState() });
        return;
      }
      if (req.method === "POST" && url.pathname === "/reset-user") {
        await demo.resetUser();
        send(res, 200, { ok: true });
        return;
      }
      if (req.method === "POST" && url.pathname === "/reset-index") {
        const seeded = await demo.seedIndex();
        await demo.resetUser();
        send(res, 200, { seeded });
        return;
      }
      if (req.method === "POST" && url.pathname === "/refresh-embedding") {
        const params = await readForm(req);
        const productId = (params.product_id || "").trim();
        const text = (params.text || "").trim();
        if (!productId || !text) {
          return send(res, 400, { error: "product_id and text are required" });
        }
        const tEmbed = performance.now();
        const vec = await embedder.encodeOne(text);
        const embedMs = performance.now() - tEmbed;
        try {
          await recommender.refreshEmbedding(productId, vec);
        } catch (err) {
          if (err?.code === "UNKNOWN_PRODUCT") {
            return send(res, 404, { error: err.message });
          }
          return send(res, 400, { error: err.message });
        }
        send(res, 200, { product_id: productId, embed_ms: embedMs });
        return;
      }
      send(res, 404, { error: "not found" });
    } catch (err) {
      console.error("[demo]", err);
      send(res, 500, { error: err?.message || String(err) });
    }
  };
}

function round4(n) {
  return Math.round(n * 10000) / 10000;
}

// ---------------------------------------------------------------------
// CLI / startup
// ---------------------------------------------------------------------

function parseArgs(argv) {
  const out = {
    host: "127.0.0.1",
    port: 8085,
    redisUrl: undefined,
    indexName: "recommend:idx",
    keyPrefix: "product:",
    catalog: undefined,
    topk: 10,
    resetOnStart: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--host") out.host = argv[++i];
    else if (a === "--port") out.port = Number.parseInt(argv[++i], 10);
    else if (a === "--redis-url") out.redisUrl = argv[++i];
    else if (a === "--index-name") out.indexName = argv[++i];
    else if (a === "--key-prefix") out.keyPrefix = argv[++i];
    else if (a === "--catalog") out.catalog = argv[++i];
    else if (a === "--topk") out.topk = Number.parseInt(argv[++i], 10);
    else if (a === "--no-reset") out.resetOnStart = false;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const catalogPath = path.resolve(
    args.catalog || path.join(__dirname, "catalog.json"),
  );
  try {
    await fs.access(catalogPath);
  } catch {
    console.error(`Error: catalog file not found at ${catalogPath}`);
    console.error("Generate it first with: node buildCatalog.js");
    process.exit(1);
  }

  const client = createClient(
    args.redisUrl ? { url: args.redisUrl } : undefined,
  );
  client.on("error", (err) => console.error("[redis]", err));
  await client.connect();

  const recommender = new RedisRecommender({
    redisClient: client,
    indexName: args.indexName,
    keyPrefix: args.keyPrefix,
  });

  console.log("Loading embedding model (first run downloads ~80 MB)...");
  const embedder = new LocalEmbedder();
  // Warm the pipeline so the first user request doesn't pay the cost.
  await embedder.encodeOne("warmup");

  const demo = new RecommendationDemo({
    recommender,
    embedder,
    catalogPath,
  });

  if (args.resetOnStart) {
    console.log(
      `Dropping any existing index '${args.indexName}' and re-seeding from catalog.json` +
        ` (pass --no-reset to keep).`,
    );
    const seeded = await demo.seedIndex();
    await demo.resetUser();
    console.log(`Indexed ${seeded} products.`);
  } else {
    await recommender.createIndex();
  }

  const handler = makeHandler({
    demo,
    embedder,
    recommender,
    defaultTopK: args.topk,
  });

  const server = createServer(handler);
  server.listen(args.port, args.host, () => {
    console.log(
      `Redis recommendation engine demo listening on http://${args.host}:${args.port}`,
    );
    console.log(
      `Using Redis at ${args.redisUrl || "redis://127.0.0.1:6379"} with index '${args.indexName}'`,
    );
  });

  const shutdown = async () => {
    server.close();
    try {
      await client.quit();
    } catch {
      /* ignore */
    }
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

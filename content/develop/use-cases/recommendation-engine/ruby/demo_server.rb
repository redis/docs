#!/usr/bin/env ruby
# Redis recommendation-engine demo server.
#
# Run this file and visit http://localhost:8085 to drive a small product
# catalogue indexed by Redis Search. The UI lets you:
#
# * Type a natural-language query, optionally with TAG / NUMERIC /
#   TEXT filters, and watch `FT.SEARCH` retrieve top-k candidates with
#   a KNN pre-filter in a single round trip.
# * Click any product card to feed a "click" into the user session.
#   Each click writes a new exponentially weighted session vector and
#   bumps a per-category affinity counter in the user features hash;
#   the next request reads that hash and folds them in.
# * Toggle session-blended retrieval and category-affinity re-ranking
#   independently to see what each layer contributes.
# * Refresh a product's embedding live to demonstrate that the HNSW
#   index reflects the new vector on the next query, with no downtime.
#
# The server holds a single `LocalEmbedder` and reuses it for every
# query-embed step; `catalog.json` carries the item vectors pre-computed
# by `build_catalog.rb` so startup stays fast.

require 'json'
require 'optparse'
require 'redis'
require 'uri'
require 'webrick'

require_relative 'embeddings'
require_relative 'recommender'

DEMO_USER_ID = 'demo'.freeze

HTML_TEMPLATE = <<~'HTML'.freeze
  <!DOCTYPE html>
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
      <div class="pill">redis-rb + informers + WEBrick</div>
      <h1>Redis Recommendation Engine Demo</h1>
      <p class="lede">
        A small product catalogue is indexed by Redis Search at
        <code>__INDEX_NAME__</code>: each item is a Hash holding its
        metadata plus a 384-dimensional embedding. One <code>FT.SEARCH</code>
        with a <code>KNN</code> clause does similarity retrieval and
        structured pre-filtering in the same call. Click a product card
        to feed a click into the session &mdash; Redis updates the user-features
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
          <code>FT.SEARCH</code> as the <code>$vec</code> parameter &mdash; no
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
          change on the very next query &mdash; production embedding rollouts
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
          <dd>${features.last_clicked_id ? features.last_clicked_id + ' (' + features.last_clicked_category + ')' : '&mdash;'}</dd>
          <dt>Session vector</dt>
          <dd>${features.has_session_vec ? '&#10003; stored, ' + features.session_vec_dim + ' floats' : '&mdash;'}</dd>
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
          ? ` <span class="badge boost">&minus;${boost.toFixed(3)} affinity</span>`
          : '';
        return `
          <tr>
            <td><code>${c.id}</code></td>
            <td>
              <strong>${c.name}</strong> ${stockBadge}<br>
              <span class="meta">${c.brand} &middot; ${c.category} &middot; $${c.price.toFixed(2)} &middot; &#9733; ${c.rating.toFixed(1)}</span>
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
            <span class="meta">${p.brand} &middot; ${p.category}</span>
            <span class="meta">&#9733; ${p.rating.toFixed(1)}</span>
            <span class="price">$${p.price.toFixed(2)}</span>
            <button class="small" data-click-id="${p.id}">Click</button>
          </div>
        `;
      }

      function renderCatalog(products) {
        $('#catalog-cards').innerHTML = products.map(productCard).join('');
        const refresh = $('#refresh-product');
        refresh.innerHTML = products.map(p =>
          `<option value="${p.id}">${p.id} &mdash; ${p.name}</option>`
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
          text_match: $('#q-description-contains').value,
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
HTML

# ---------------------------------------------------------------------
# Demo state: catalogue ingestion, click history, helper accessors.
# ---------------------------------------------------------------------
class RecommendationDemo
  attr_reader :user_id

  def initialize(recommender:, embedder:, catalog_path:, user_id: DEMO_USER_ID)
    @recommender = recommender
    @embedder = embedder
    @catalog_path = catalog_path
    @user_id = user_id
    @catalog_data = nil
    @recent_clicks = []
    @recent_lock = Mutex.new
  end

  def load_catalog
    @catalog_data ||= JSON.parse(File.read(@catalog_path))
  end

  def model_name
    load_catalog['model'] || @embedder.model_name
  end

  # Drop and rebuild the index from catalog.json.
  def seed_index
    @recommender.drop_index(delete_documents: true)
    @recommender.create_index
    @recommender.index_products(load_catalog['products'])
  end

  def reset_user
    @recommender.reset_user(@user_id)
    @recent_lock.synchronize { @recent_clicks.clear }
  end

  def record_click(product_id)
    result = @recommender.record_click(@user_id, product_id)
    name = product_name(product_id)
    @recent_lock.synchronize do
      @recent_clicks.unshift({ 'id' => product_id, 'name' => name })
      @recent_clicks = @recent_clicks.first(6)
    end
    result
  end

  def product_name(product_id)
    @recommender.redis.hget(@recommender.product_key(product_id), 'name') || product_id
  end

  def user_state
    features = @recommender.get_user_features(@user_id)
    recent = @recent_lock.synchronize { @recent_clicks.dup }
    {
      'clicks' => features[:clicks],
      'last_clicked_id' => features[:last_clicked_id],
      'last_clicked_category' => features[:last_clicked_category],
      'affinities' => features[:affinities],
      'has_session_vec' => !features[:session_vec].nil?,
      'session_vec_dim' => features[:session_vec] ? features[:session_vec].length : 0,
      'recent_clicks' => recent,
    }
  end
end

# ---------------------------------------------------------------------
# CLI / HTTP helpers
# ---------------------------------------------------------------------

def parse_args(argv)
  opts = {
    host: '127.0.0.1',
    port: 8085,
    redis_host: 'localhost',
    redis_port: 6379,
    index_name: 'recommend:idx',
    key_prefix: 'product:',
    catalog: nil,
    topk: 10,
    reset_on_start: true,
  }
  OptionParser.new do |o|
    o.banner = 'Usage: demo_server.rb [options]'
    o.on('--host HOST', 'HTTP bind host') { |v| opts[:host] = v }
    o.on('--port PORT', Integer, 'HTTP bind port') { |v| opts[:port] = v }
    o.on('--redis-host HOST', 'Redis host') { |v| opts[:redis_host] = v }
    o.on('--redis-port PORT', Integer, 'Redis port') { |v| opts[:redis_port] = v }
    o.on('--index-name NAME', 'Redis Search index name') { |v| opts[:index_name] = v }
    o.on('--key-prefix PREFIX', 'Hash key prefix for indexed products') { |v| opts[:key_prefix] = v }
    o.on('--catalog PATH', 'Path to catalog.json') { |v| opts[:catalog] = v }
    o.on('--topk N', Integer, 'Default KNN top-K shown in the UI') { |v| opts[:topk] = v }
    o.on('--no-reset', 'Keep existing index and documents on startup') { opts[:reset_on_start] = false }
  end.parse!(argv)
  opts
end

# Parse `application/x-www-form-urlencoded` request bodies. Returns a
# `{ name => [values...] }` hash so a repeated field name keeps every
# value, matching what `CGI.parse` used to do before it was dropped
# from Ruby's standard library in Ruby 4.
def parse_form(body)
  out = Hash.new { |h, k| h[k] = [] }
  URI.decode_www_form(body.to_s).each { |k, v| out[k] << v }
  out
rescue ArgumentError
  {}
end

def first_or_empty(params, key)
  v = params[key]
  return '' if v.nil? || v.empty?
  (v.first || '').to_s
end

def float_or_nil(params, key)
  s = first_or_empty(params, key).strip
  return nil if s.empty?
  Float(s) rescue nil
end

def int_or_default(params, key, default)
  s = first_or_empty(params, key).strip
  return default if s.empty?
  Integer(s) rescue default
end

# ---------------------------------------------------------------------
# Servlet
# ---------------------------------------------------------------------

class RecommenderServlet < WEBrick::HTTPServlet::AbstractServlet
  def initialize(server, recommender, embedder, demo, default_topk)
    super(server)
    @recommender = recommender
    @embedder = embedder
    @demo = demo
    @default_topk = default_topk
  end

  def do_GET(req, res)
    case req.path
    when '/', '/index.html' then send_html(res, html_page)
    when '/state' then send_json(res, build_state)
    else
      res.status = 404
      res.body = 'not found'
    end
  end

  def do_POST(req, res)
    case req.path
    when '/search'            then handle_search(req, res)
    when '/click'             then handle_click(req, res)
    when '/reset-user'        then @demo.reset_user; send_json(res, { 'ok' => true })
    when '/reset-index'       then handle_reset_index(res)
    when '/refresh-embedding' then handle_refresh(req, res)
    else
      res.status = 404
      res.body = 'not found'
    end
  end

  private

  # ---- handlers --------------------------------------------------

  def handle_search(req, res)
    params = parse_form(req.body)
    query_text = first_or_empty(params, 'query').strip
    if query_text.empty?
      return send_json(res, { 'error' => 'query is required' }, status: 400)
    end

    # Embed the query string. This is the only place in the demo
    # where the live model gets called on the request path; in a
    # production pipeline this often runs at the API gateway and the
    # embedding is reused across the whole pipeline.
    t0 = monotonic_ms
    query_vec = @embedder.encode_one(query_text)
    embed_ms = monotonic_ms - t0

    use_session = !first_or_empty(params, 'use_session').empty?
    do_rerank = !first_or_empty(params, 'rerank').empty?
    features = @recommender.get_user_features(@demo.user_id)
    session_vec = use_session ? features[:session_vec] : nil

    k = int_or_default(params, 'k', @default_topk).clamp(1, 40)

    opts = {
      category: first_or_empty(params, 'category').strip.empty? ? nil : first_or_empty(params, 'category').strip,
      brand: first_or_empty(params, 'brand').strip.empty? ? nil : first_or_empty(params, 'brand').strip,
      min_price: float_or_nil(params, 'min_price'),
      max_price: float_or_nil(params, 'max_price'),
      min_rating: float_or_nil(params, 'min_rating'),
      in_stock_only: !first_or_empty(params, 'in_stock_only').empty?,
      text_match: first_or_empty(params, 'text_match').strip.empty? ? nil : first_or_empty(params, 'text_match').strip,
    }
    # Echo the actual filter clause back to the UI so the docs page
    # doesn't have to guess what the server built.
    filter_clause = RedisRecommender.build_filter_clause(**opts)

    t1 = monotonic_ms
    candidates = @recommender.candidate_retrieve(
      query_vec, **opts, k: k, session_vec: session_vec,
    )
    search_ms = monotonic_ms - t1

    t2 = monotonic_ms
    candidates = @recommender.rerank(candidates, features) if do_rerank
    rerank_ms = monotonic_ms - t2

    send_json(res, {
      'candidates' => candidates.map(&:to_h_payload),
      'filter_clause' => filter_clause,
      'used_session' => !session_vec.nil?,
      'used_rerank' => do_rerank && !features[:affinities].empty?,
      'embed_ms' => embed_ms,
      'search_ms' => search_ms,
      'rerank_ms' => rerank_ms,
      'timing_ms' => embed_ms + search_ms + rerank_ms,
    })
  end

  def handle_click(req, res)
    params = parse_form(req.body)
    product_id = first_or_empty(params, 'product_id').strip
    if product_id.empty?
      return send_json(res, { 'error' => 'product_id is required' }, status: 400)
    end
    begin
      result = @demo.record_click(product_id)
    rescue KeyError
      return send_json(res, { 'error' => "unknown product #{product_id}" }, status: 404)
    end
    send_json(res, result.merge('user' => @demo.user_state))
  end

  def handle_reset_index(res)
    seeded = @demo.seed_index
    @demo.reset_user
    send_json(res, { 'seeded' => seeded })
  end

  def handle_refresh(req, res)
    params = parse_form(req.body)
    product_id = first_or_empty(params, 'product_id').strip
    text = first_or_empty(params, 'text').strip
    if product_id.empty? || text.empty?
      return send_json(res, { 'error' => 'product_id and text are required' }, status: 400)
    end
    t0 = monotonic_ms
    vec = @embedder.encode_one(text)
    embed_ms = monotonic_ms - t0
    begin
      @recommender.refresh_embedding(product_id, vec)
    rescue KeyError
      return send_json(res, { 'error' => "unknown product #{product_id}" }, status: 404)
    rescue ArgumentError => exc
      return send_json(res, { 'error' => exc.message }, status: 400)
    end
    send_json(res, { 'product_id' => product_id, 'embed_ms' => embed_ms })
  end

  # ---- state assembly -------------------------------------------

  def build_state
    info = @recommender.index_info
    info['index_name'] = @recommender.index_name
    info['model'] = @demo.model_name
    {
      'user' => @demo.user_state,
      'index' => info,
      'products' => @recommender.list_products(limit: 200),
      'categories' => @recommender.list_categories,
      'brands' => @recommender.list_brands,
    }
  end

  # ---- HTTP plumbing --------------------------------------------

  def send_html(res, body)
    res.status = 200
    res['Content-Type'] = 'text/html; charset=utf-8'
    res.body = body
  end

  def send_json(res, payload, status: 200)
    res.status = status
    res['Content-Type'] = 'application/json'
    res.body = JSON.generate(payload)
  end

  def html_page
    HTML_TEMPLATE
      .gsub('__INDEX_NAME__', @recommender.index_name)
      .gsub('__USER_KEY__', @recommender.user_key(@demo.user_id))
      .gsub('__TOPK__', @default_topk.to_s)
  end

  def monotonic_ms
    Process.clock_gettime(Process::CLOCK_MONOTONIC) * 1000
  end
end

# ---------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------

def main
  args = parse_args(ARGV)
  catalog_path = args[:catalog] || File.join(__dir__, 'catalog.json')
  unless File.exist?(catalog_path)
    warn "Error: catalog file not found at #{catalog_path}"
    warn 'Generate it first with: bundle exec ruby build_catalog.rb'
    exit 1
  end

  redis = Redis.new(host: args[:redis_host], port: args[:redis_port])
  begin
    redis.ping
  rescue Redis::CannotConnectError => exc
    warn "Error: cannot reach Redis at #{args[:redis_host]}:#{args[:redis_port]}"
    warn "  (#{exc})"
    exit 1
  end

  recommender = RedisRecommender.new(
    redis: redis,
    index_name: args[:index_name],
    key_prefix: args[:key_prefix],
  )

  warn 'Loading embedding model (first run downloads ~80 MB)...'
  embedder = LocalEmbedder.new

  demo = RecommendationDemo.new(
    recommender: recommender,
    embedder: embedder,
    catalog_path: catalog_path,
  )

  if args[:reset_on_start]
    warn "Dropping any existing index '#{args[:index_name]}' and re-seeding from catalog.json (pass --no-reset to keep)."
    seeded = demo.seed_index
    demo.reset_user
    warn "Indexed #{seeded} products."
  else
    recommender.create_index
  end

  server = WEBrick::HTTPServer.new(
    BindAddress: args[:host],
    Port: args[:port],
    Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
    AccessLog: [],
  )
  server.mount('/', RecommenderServlet, recommender, embedder, demo, args[:topk])

  trap('INT') { server.shutdown }
  trap('TERM') { server.shutdown }

  puts "Redis recommendation engine demo listening on http://#{args[:host]}:#{args[:port]}"
  puts "Using Redis at #{args[:redis_host]}:#{args[:redis_port]} with index '#{args[:index_name]}'"

  server.start
end

main if $PROGRAM_NAME == __FILE__

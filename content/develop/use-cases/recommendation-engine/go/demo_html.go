// HTML template for the demo page. Held as a Go string constant rather
// than a separate ``.html`` asset so the binary stays self-contained
// and ``go run`` works out of any directory.

package recommendationengine

const htmlTemplate = `<!DOCTYPE html>
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
    <div class="pill">go-redis + Hugot (pure-Go ONNX) + net/http</div>
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
        TAG / NUMERIC / TEXT predicates in front of the KNN, applied in
        one round trip.</p>
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
        throw new Error(res.status + ': ' + text);
      }
      return res.json();
    }

    async function getJson(path) {
      const res = await fetch(path);
      if (!res.ok) throw new Error(String(res.status));
      return res.json();
    }

    function renderUser(features) {
      const dl = $('#user-features');
      dl.innerHTML =
        '<dt>Clicks</dt><dd>' + features.clicks + '</dd>' +
        '<dt>Last clicked</dt><dd>' +
          (features.last_clicked_id
            ? features.last_clicked_id + ' (' + features.last_clicked_category + ')'
            : '—') +
        '</dd>' +
        '<dt>Session vector</dt><dd>' +
          (features.has_session_vec
            ? '✓ stored, ' + features.session_vec_dim + ' floats'
            : '—') +
        '</dd>';
      const aff = $('#user-affinities');
      const entries = Object.entries(features.affinities || {});
      if (!entries.length) {
        aff.textContent = '(none yet)';
      } else {
        entries.sort((a, b) => b[1] - a[1]);
        aff.innerHTML = entries.map(([cat, w]) =>
          '<span class="badge score">' + cat + ' +' + w.toFixed(2) + '</span>'
        ).join(' ');
      }
      const ul = $('#recent-clicks');
      ul.innerHTML = (features.recent_clicks || []).map(rc =>
        '<li><code>' + rc.id + '</code> ' + rc.name + '</li>'
      ).join('') || '<li>(none)</li>';
    }

    function renderIndex(info) {
      $('#index-state').innerHTML =
        '<dl>' +
        '<dt>Indexed documents</dt><dd>' + info.num_docs + '</dd>' +
        '<dt>Index name</dt><dd><code>' + info.index_name + '</code></dd>' +
        '<dt>Indexing failures</dt><dd>' + info.indexing_failures + '</dd>' +
        '<dt>Vector index size</dt><dd>' + info.vector_index_size_mb + ' MB</dd>' +
        '<dt>Embedding model</dt><dd><code>' + info.model + '</code></dd>' +
        '</dl>';
    }

    function renderResult(c) {
      const stockBadge = c.in_stock ? '' : '<span class="badge stockout">out of stock</span>';
      const boost = c.vector_distance - c.score;
      const boostBadge = boost > 0.005
        ? ' <span class="badge boost">−' + boost.toFixed(3) + ' affinity</span>'
        : '';
      return '<tr>' +
        '<td><code>' + c.id + '</code></td>' +
        '<td><strong>' + c.name + '</strong> ' + stockBadge + '<br>' +
          '<span class="meta">' + c.brand + ' · ' + c.category +
          ' · $' + c.price.toFixed(2) + ' · ★ ' + c.rating.toFixed(1) + '</span></td>' +
        '<td><span class="badge score">' + c.score.toFixed(3) + '</span>' + boostBadge + '</td>' +
        '<td><button class="small" data-click-id="' + c.id + '">Click</button></td>' +
      '</tr>';
    }

    function renderSearch(payload) {
      const meta = $('#search-meta');
      meta.innerHTML =
        'Returned ' + payload.candidates.length + ' candidate(s) in <code>' +
        payload.timing_ms.toFixed(2) + ' ms</code> (embed: <code>' +
        payload.embed_ms.toFixed(2) + ' ms</code>, search: <code>' +
        payload.search_ms.toFixed(2) + ' ms</code>, rerank: <code>' +
        payload.rerank_ms.toFixed(2) + ' ms</code>). Filter: <code>' +
        payload.filter_clause + '</code>. Session blended: ' +
        (payload.used_session ? 'yes' : 'no') + '; re-ranked: ' +
        (payload.used_rerank ? 'yes' : 'no') + '.';
      const rows = payload.candidates.map(renderResult).join('');
      $('#search-results').innerHTML =
        '<table><thead><tr><th>ID</th><th>Product</th>' +
        '<th>Score <span class="meta">(cosine distance, lower = closer)</span></th>' +
        '<th></th></tr></thead><tbody>' + rows + '</tbody></table>';
    }

    function productCard(p) {
      const stockBadge = p.in_stock ? '' : '<span class="badge stockout">out of stock</span>';
      return '<div class="card">' +
        '<span class="name">' + p.name + ' ' + stockBadge + '</span>' +
        '<span class="meta">' + p.brand + ' · ' + p.category + '</span>' +
        '<span class="meta">★ ' + p.rating.toFixed(1) + '</span>' +
        '<span class="price">$' + p.price.toFixed(2) + '</span>' +
        '<button class="small" data-click-id="' + p.id + '">Click</button>' +
      '</div>';
    }

    function renderCatalog(products) {
      $('#catalog-cards').innerHTML = products.map(productCard).join('');
      const refresh = $('#refresh-product');
      refresh.innerHTML = products.map(p =>
        '<option value="' + p.id + '">' + p.id + ' — ' + p.name + '</option>'
      ).join('');
    }

    function populateSelect(id, values) {
      const sel = document.querySelector(id);
      const current = sel.value;
      sel.innerHTML = '<option value="">(any)</option>' +
        values.map(v => '<option value="' + v + '">' + v + '</option>').join('');
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
        showStatus('Click recorded: ' + productId + ' (' + payload.category + ')', 'ok');
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
          {product_id: productId, text});
        $('#refresh-meta').innerHTML =
          'Refreshed <code>' + payload.product_id + '</code>. Embedding wrote in <code>' +
          payload.embed_ms.toFixed(2) + ' ms</code>; next FT.SEARCH will see the new vector.';
        showStatus('Re-embedded ' + payload.product_id, 'ok');
      } catch (exc) {
        showStatus('Refresh failed: ' + exc.message, 'error');
      }
    };

    refreshState();
  </script>
</body>
</html>
`

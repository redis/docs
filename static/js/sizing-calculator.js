/* =========================================================================
   Sizing calculator (layouts/shortcodes/sizing-calculator.html)

   The reader describes one record and how many keys they'll have; the
   calculator shows the memory as a hash, a JSON document and a string, using
   the model in js/sizing-model.js. Everything runs in the browser.
   ========================================================================= */
(function () {
  'use strict';
  if (window.__redisSizingLoaded) return;
  window.__redisSizingLoaded = true;

  var EXAMPLES = [
    {
      id: 'profile', label: 'User profile', key: 'user:1000001', keys: 10e6, ttl: false,
      text: '{\n  "name": "Alice Liddell",\n  "email": "alice@example.com",\n  "age": 31,\n  "city": "Oslo",\n  "country": "NO",\n  "plan": "pro",\n  "signup": "2024-03-01",\n  "verified": true,\n  "score": 87.5,\n  "bio": "Loves hiking, coffee and distributed systems. Based in Oslo."\n}',
    },
    {
      id: 'session', label: 'Session', key: 'session:8f3a2c1e9b7d4e21', keys: 1e6, ttl: true,
      text: '{\n  "user_id": "1001",\n  "created": 1730000000,\n  "ip": "203.0.113.5",\n  "agent": "Mozilla/5.0 (Macintosh)"\n}',
    },
    {
      id: 'product', label: 'Product', key: 'product:B-1234', keys: 200e3, ttl: false,
      text: '{\n  "sku": "B-1234",\n  "name": "Noise-cancelling headphones",\n  "price": 199.99,\n  "stock": 42,\n  "brand": {"name": "Acme", "country": "US"},\n  "colors": ["black", "silver", "blue"],\n  "ratings": [5, 4, 5, 3, 5],\n  "description": "Over-ear headphones with active noise cancelling and 30 hours of battery."\n}',
    },
    {
      id: 'cart', label: 'Shopping cart', key: 'cart:1000001', keys: 1e6, ttl: true,
      text: '{\n  "cart_id": "c-00000001",\n  "items": [\n    {"sku": "SKU-000001", "qty": 2, "price": 9.99},\n    {"sku": "SKU-000002", "qty": 1, "price": 24.5}\n  ],\n  "total": 44.48,\n  "currency": "EUR",\n  "updated": "2026-11-03T10:15:00Z"\n}',
    },
    {
      id: 'counter', label: 'Counter', key: 'views:page:4711', keys: 5e6, ttl: false,
      text: '42',
    },
  ];

  var SHAPES = [
    { id: 'hash', title: 'Hash', data: 'of field names and values' },
    { id: 'json', title: 'JSON document', data: 'of JSON text' },
    { id: 'string', title: 'String', data: 'of JSON text' },
  ];

  var ENCODINGS = {
    listpack: 'Fields and values packed in one block.',
    hashtable: 'Each field and value stored on its own.',
    json: 'A tree of JSON values.',
    raw: 'The text in its own block.',
    embstr: 'The text stored with the key, in one block.',
    int: 'A number, stored with the key.',
  };

  var PARTS = [['value', 'Value'], ['object', 'Key and object header'], ['space', 'Index of keys']];

  var fmt = new Intl.NumberFormat('en-US');
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function bytesPerKey(n) { return fmt.format(Math.round(n)) + (Math.round(n) === 1 ? ' byte' : ' bytes'); }
  function size(n) {
    var units = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB'], u = 0;
    while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
    if (u === 0) return fmt.format(Math.round(n)) + ' bytes';
    var digits = n >= 100 ? 0 : n >= 10 ? 1 : 2;
    return n.toFixed(digits) + ' ' + units[u];
  }
  function keysLabel(n) {
    if (n >= 1e9) return trim(n / 1e9) + ' billion';
    if (n >= 1e6) return trim(n / 1e6) + ' million';
    return fmt.format(n);
  }
  function trim(x) { return (Math.round(x * 100) / 100).toString(); }

  // "10M", "2.5 billion", "1,000,000" -> number of keys.
  function parseCount(s) {
    var m = /^\s*([\d.,]+)\s*(k|thousand|m|million|b|billion|t|trillion)?\s*$/i.exec(s || '');
    if (!m) return null;
    var n = parseFloat(m[1].replace(/,/g, ''));
    if (!isFinite(n)) return null;
    var mult = { k: 1e3, thousand: 1e3, m: 1e6, million: 1e6, b: 1e9, billion: 1e9, t: 1e12, trillion: 1e12 }[(m[2] || '').toLowerCase()] || 1;
    return Math.round(n * mult);
  }

  var counter = 0;

  function init(root) {
    if (root.__rszReady || !window.RedisSizing) return;
    root.__rszReady = true;
    var M = window.RedisSizing;
    var id = 'rsz-' + (++counter);
    root.innerHTML =
      '<p class="rsz-lede">Paste one record from your data, or start from an example. The calculator works out how much memory Redis needs for it as a hash, a JSON document and a string, and multiplies by the number of keys.</p>' +
      '<div class="rsz-examples" role="group" aria-label="Examples">' +
        '<span class="rsz-examples-label">Examples:</span>' +
        EXAMPLES.map(function (e) { return '<button type="button" class="rsz-chip" data-example="' + e.id + '">' + esc(e.label) + '</button>'; }).join('') +
      '</div>' +
      '<div class="rsz-layout">' +
        '<div class="rsz-inputs">' +
          '<label class="rsz-label" for="' + id + '-record">Your record, as JSON</label>' +
          '<textarea id="' + id + '-record" class="rsz-record" rows="12" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea>' +
          '<p class="rsz-error" id="' + id + '-error" hidden></p>' +
          '<div class="rsz-fields">' +
            '<label class="rsz-field"><span class="rsz-label">Key name</span>' +
              '<input class="rsz-key" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-describedby="' + id + '-key-hint">' +
              '<span class="rsz-hint" id="' + id + '-key-hint">A typical key. Its length counts.</span></label>' +
            '<label class="rsz-field"><span class="rsz-label">Number of keys</span>' +
              '<input class="rsz-count" type="text" inputmode="decimal" spellcheck="false" autocomplete="off" aria-describedby="' + id + '-count-hint">' +
              '<span class="rsz-hint" id="' + id + '-count-hint">Such as 250000, 10M or 2.5B.</span></label>' +
          '</div>' +
          '<input class="rsz-slider" type="range" min="3" max="10" step="0.01" aria-label="Number of keys, on a scale from one thousand to ten billion">' +
          '<div class="rsz-checks">' +
            '<label class="rsz-check"><input type="checkbox" class="rsz-ttl"> Keys have an expiry (TTL)</label>' +
            '<label class="rsz-check"><input type="checkbox" class="rsz-repl"> Replication (doubles the memory limit)</label>' +
          '</div>' +
        '</div>' +
        '<div class="rsz-out">' +
          '<p class="rsz-summary"></p>' +
          '<div class="rsz-rows"></div>' +
          '<p class="rsz-legend" aria-hidden="true">' +
            PARTS.map(function (p) { return '<span><span class="rsz-dot rsz-seg-' + p[0] + '"></span>' + p[1] + '</span>'; }).join('') +
          '</p>' +
          '<ul class="rsz-tips"></ul>' +
        '</div>' +
      '</div>' +
      '<p class="rsz-sr" aria-live="polite"></p>' +
      '<details class="rsz-how"><summary>How the estimate is worked out</summary>' +
        '<p>The calculator follows how Redis 8.10 stores each type with its default settings. That includes when a hash switches from a compact listpack to a hashtable (more than 512 fields, or a field or value longer than 64 bytes), the room each key takes in Redis\'s index of keys, and how the memory allocator rounds each block up.</p>' +
        '<p>For JSON documents, it assumes that the documents have the same field names and different values. Redis stores each string of 8 bytes or more once for all the documents that contain it, so values that repeat, such as a status or a country code, take less than the estimate.</p>' +
        '<p>We checked the calculator against Redis 8.10.3 by loading 2,000 to 120,000 keys of 96 kinds of records and measuring the memory used. For 9 in 10 of them, the estimate was within 1%, and the largest difference was 4%.</p>' +
        '<p>It doesn\'t include indexes for Redis Search, about 1.5 MB that Redis uses when it starts, memory fragmentation, or client buffers. It also leaves out <a href="' + esc(root.dataset.compactHashes || '') + '">compact hashes</a>, which store the field names of hashes that have the same fields once, because they\'re off by default. To check a sample of your own data, load a few thousand keys and compare <code>used_memory</code> in <code>INFO memory</code> before and after.</p>' +
        '<p class="rsz-next">To price a Redis Cloud database of this size, use the <a href="' + esc(root.dataset.pricing || 'https://redis.io/pricing/calculator/') + '">Redis Cloud pricing calculator</a>. For Redis Software, see <a href="' + esc(root.dataset.memoryLimit || '') + '">Database memory limits</a>.</p>' +
      '</details>';

    var q = function (sel) { return root.querySelector(sel); };
    var record = q('.rsz-record'), error = q('.rsz-error'), key = q('.rsz-key'), count = q('.rsz-count'),
      slider = q('.rsz-slider'), ttl = q('.rsz-ttl'), repl = q('.rsz-repl'), rows = q('.rsz-rows'),
      tips = q('.rsz-tips'), summary = q('.rsz-summary'), sr = q('.rsz-sr');
    var keys = 10e6;

    function setKeys(n, from) {
      keys = Math.max(0, Math.min(1e12, n));
      if (from !== 'count') count.value = fmt.format(keys);
      if (from !== 'slider') slider.value = keys > 0 ? Math.min(10, Math.max(3, Math.log10(keys))) : 3;
    }

    function load(e) {
      record.value = e.text;
      key.value = e.key;
      ttl.checked = e.ttl;
      setKeys(e.keys);
      root.querySelectorAll('.rsz-chip').forEach(function (c) { c.setAttribute('aria-pressed', String(c.dataset.example === e.id)); });
      update();
    }

    // One row per shape. Bars share a scale, so their lengths compare the shapes.
    function row(shape, r, best, largest) {
      if (!r) {
        return '<div class="rsz-row rsz-row-off"><div class="rsz-row-head"><span class="rsz-row-title">' + shape.title + '</span></div>' +
          '<p class="rsz-detail">A ' + (shape.id === 'hash' ? 'hash' : 'JSON document') + ' needs a JSON object, with fields in <code>{ }</code>.</p></div>';
      }
      var amounts = { value: r.value, object: r.object, space: r.keyspace };
      var width = largest ? 100 * r.perKey / largest : 0;
      var ratio = r.data >= 8 ? Math.round(10 * r.perKey / r.data) / 10 : 0;
      return '<div class="rsz-row' + (best ? ' rsz-best' : '') + '">' +
        '<div class="rsz-row-head">' +
          '<span class="rsz-row-title">' + shape.title + '</span>' +
          '<span class="rsz-badge">' + esc(r.encoding) + '</span>' +
          (best ? '<span class="rsz-tag">Smallest</span>' : '') +
          '<span class="rsz-row-total">' + size(r.total) + '</span>' +
        '</div>' +
        '<div class="rsz-bar" aria-hidden="true" style="width:' + Math.max(width, 2).toFixed(2) + '%">' +
          PARTS.map(function (p) {
            return '<span class="rsz-seg rsz-seg-' + p[0] + '" style="width:' + (100 * amounts[p[0]] / r.perKey).toFixed(2) + '%"></span>';
          }).join('') +
        '</div>' +
        '<p class="rsz-detail">' + esc(ENCODINGS[r.encoding] || '') + ' ' + bytesPerKey(r.perKey) + ' per key: ' +
          (r.value ? bytesPerKey(r.value).replace(/ bytes?$/, '') + ' for the value, ' : '') +
          bytesPerKey(r.object).replace(/ bytes?$/, '') + ' for the key and object header' + (r.value ? ',' : ', which holds the number,') +
          ' and ' + bytesPerKey(r.keyspace).replace(/ bytes?$/, '') + ' for the index of keys' +
          (ttl.checked ? ' and expiries' : '') + '.' +
          (ratio ? ' That\'s ' + ratio + ' times the ' + bytesPerKey(r.data) + ' ' + shape.data + '.' : '') +
          (repl.checked ? ' With replication, the memory limit is ' + size(r.total * 2) + '.' : '') +
        '</p>' +
        '</div>';
    }

    function tipsFor(est) {
      var out = [], s = est.shapes, h = s.hash;
      if (h && h.encoding === 'hashtable') {
        var lpPerKey = h.perKey - h.value + h.listpackValue;
        var parts = h.reason.split(':'), field = parts.slice(1).join(':');
        var why = parts[0] === 'fields'
          ? 'This hash has ' + fmt.format(Object.keys(M.hashFields(est.doc)).length) + ' fields. Redis stores a hash with more than 512 fields as a hashtable'
          : 'The ' + (parts[0] === 'field-name' ? 'field name' : 'value of') + ' <code>' + esc(field) + '</code> is ' +
            bytesPerKey(M.bytes(parts[0] === 'field-name' ? field : M.hashFields(est.doc)[field])) +
            ' long. Redis stores a hash with any field name or value longer than 64 bytes as a hashtable';
        out.push(why + ', which takes ' + bytesPerKey(h.perKey) + ' per key here. As a listpack, the same hash would take about ' +
          bytesPerKey(lpPerKey) + ', or ' + size(lpPerKey * keys) + ' in total.');
      }
      var j = s.json;
      if (j && j.boxedNumbers) {
        out.push('In a JSON document, each number with a decimal point takes 8 more bytes than a whole number. This record has ' +
          j.boxedNumbers + (j.boxedNumbers === 1 ? ' such number.' : ' such numbers.'));
      }
      if (ttl.checked) {
        var without = M.estimate({ text: record.value, keyName: key.value, keys: keys, ttl: false });
        var best = Object.keys(est.shapes).reduce(function (a, b) { return est.shapes[a].total <= est.shapes[b].total ? a : b; });
        var extra = est.shapes[best].perKey - without.shapes[best].perKey;
        out.push('The expiry adds ' + bytesPerKey(extra) + ' per key, or ' + size(extra * keys) + ' in total.');
      }
      if (est.keyLen >= 40) {
        out.push('The key name is ' + bytesPerKey(est.keyLen) + ' long, and every key stores it. Each byte you cut from it saves about ' + size(keys) + ' in total.');
      }
      return out;
    }

    function update() {
      var est = M.estimate({ text: record.value, keyName: key.value, keys: keys, ttl: ttl.checked });
      if (est.error && record.value.trim()) {
        error.hidden = false;
        error.textContent = 'This isn\'t valid JSON (' + est.error.message + '), so it\'s sized as a string of text.';
      } else {
        error.hidden = true;
      }
      var ids = SHAPES.map(function (s) { return s.id; }).filter(function (k) { return est.shapes[k]; });
      var best = ids.reduce(function (a, b) { return est.shapes[a].total <= est.shapes[b].total ? a : b; });
      var largest = Math.max.apply(null, ids.map(function (k) { return est.shapes[k].perKey; }));
      rows.innerHTML = SHAPES.map(function (s) { return row(s, est.shapes[s.id], ids.length > 1 && s.id === best, largest); }).join('');
      summary.textContent = 'For ' + keysLabel(keys) + (keys === 1 ? ' key' : ' keys') + ' like this one:';
      tips.innerHTML = tipsFor(est).map(function (t) { return '<li>' + t + '</li>'; }).join('');
      tips.hidden = !tips.children.length;
      sr.textContent = ids.map(function (k) {
        return SHAPES.filter(function (s) { return s.id === k; })[0].title + ' ' + size(est.shapes[k].total);
      }).join(', ');
    }

    var timer = 0;
    function later() { clearTimeout(timer); timer = setTimeout(update, 120); }
    record.addEventListener('input', function () {
      root.querySelectorAll('.rsz-chip').forEach(function (c) { c.setAttribute('aria-pressed', 'false'); });
      later();
    });
    key.addEventListener('input', later);
    count.addEventListener('input', function () {
      var n = parseCount(count.value);
      count.setAttribute('aria-invalid', String(n === null));
      if (n !== null) { setKeys(n, 'count'); later(); }
    });
    count.addEventListener('blur', function () { count.value = fmt.format(keys); count.removeAttribute('aria-invalid'); });
    slider.addEventListener('input', function () {
      var raw = Math.pow(10, parseFloat(slider.value));
      var step = Math.pow(10, Math.floor(Math.log10(raw)) - 1);
      setKeys(Math.round(raw / step) * step, 'slider');
      update();
    });
    ttl.addEventListener('change', update);
    repl.addEventListener('change', update);
    root.querySelectorAll('.rsz-chip').forEach(function (c) {
      c.addEventListener('click', function () {
        load(EXAMPLES.filter(function (e) { return e.id === c.dataset.example; })[0]);
      });
    });
    load(EXAMPLES[0]);
  }

  function start() { document.querySelectorAll('[data-sizing]').forEach(init); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();

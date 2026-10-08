/* =========================================================================
   RedisVL scripted demo: queries
   Dependency-free. Everything runs in the browser against recorded data;
   no Redis server or embedding model is called.
   Step 1: a vector query finds the restaurants closest in meaning to a
   phrase. Step 2: filter expressions narrow the candidates first, or
   replace the vector with a filter-only query. Step 3: a range query
   returns everything within a distance threshold instead of a fixed count.
   Each step shows the RedisVL code, the FT.SEARCH command RedisVL sends,
   and the results.
   Observed, not modelled: the distances are what Redis 7.4 returned for
   embeddings from sentence-transformers/all-mpnet-base-v2, and the query
   strings and FT.SEARCH arguments are what RedisVL 0.27.1 builds. A test
   replays every filter combination, phrase, and threshold against them.
   Restaurants and their keys come from the food delivery sample data in
   context-retriever-demo.js; the descriptions are this demo's, so there's
   something to search by meaning. Keep the IDs and names in sync.
   Base styles come from context-retriever-demo.css; redisvl-demo.css adds
   the pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";
  if (window.RedisVLDemo) return;   // loaded twice: the first copy already booted every widget

  /* ------------------------------------------------------------- the data */

  var RESTAURANTS = [
    ["r201", "Bangkok Street Kitchen", "thai", "austin", 4.7, 2, 30, "Thai street food: pad thai, green and red curries, and tofu dishes, made spicy on request."],
    ["r202", "Smokehouse 512", "bbq", "austin", 4.4, 3, 40, "Texas barbecue: slow-smoked brisket, ribs, and mac and cheese."],
    ["r203", "Green Bowl", "vegan", "seattle", 4.8, 2, 25, "Plant-based bowls, salads, and smoothies. Everything on the menu is vegan."],
    ["r204", "Sakura Sushi Bar", "sushi", "denver", 4.6, 3, 35, "Fresh sushi and sashimi, nigiri sets, and miso soup."],
    ["r205", "Nonna's Trattoria", "italian", "seattle", 4.5, 3, 45, "Homemade pasta, risotto, and tiramisu from family recipes."],
    ["r206", "Slice Society", "pizza", "denver", 4.2, 1, 30, "New York-style pizza by the slice or the whole pie, made for sharing."],
    ["r207", "Olive & Za'atar", "mediterranean", "austin", 4.6, 2, 30, "Falafel, shawarma, hummus, and fresh salads from the eastern Mediterranean."],
    ["r208", "Spice Route", "indian", "seattle", 4.3, 2, 40, "Indian curries, chana masala, and tandoori, with plenty of fiery vegetarian dishes."],
    ["r209", "Lotus Thai", "thai", "austin", 4.1, 1, 25, "Thai curries and noodle dishes, known for its spicy green curry. Most dishes can be made vegetarian."]
  ];
  var PHRASES = ["something spicy and vegetarian", "a vegan meal", "hearty Italian comfort food", "smoky barbecue", "pizza to share with friends", "fresh fish"];
  /* Cosine distance from each phrase to each restaurant, in the order above, as Redis returned it. */
  var DISTANCES = {
    "something spicy and vegetarian": ["0.500951945782", "0.504721283913", "0.471800982952", "0.555808722973", "0.527691364288", "0.695688843727", "0.482797503471", "0.361548006535", "0.421411812305"],
    "a vegan meal": ["0.693807721138", "0.670636057854", "0.342716932297", "0.629679203033", "0.672355651855", "0.686301708221", "0.541450381279", "0.559521436691", "0.566758811474"],
    "hearty Italian comfort food": ["0.637662172318", "0.635473310947", "0.709024071693", "0.561040401459", "0.376667678356", "0.540597856045", "0.57206004858", "0.579591870308", "0.630612909794"],
    "smoky barbecue": ["0.716876983643", "0.319605350494", "0.876318275928", "0.75595241785", "0.767811655998", "0.717524647713", "0.739396870136", "0.621323406696", "0.765022099018"],
    "pizza to share with friends": ["0.763711810112", "0.685174703598", "0.804882764816", "0.710479140282", "0.598811030388", "0.291933596134", "0.755990028381", "0.755494058132", "0.820141434669"],
    "fresh fish": ["0.683335185051", "0.67333984375", "0.765836238861", "0.471675872803", "0.692221105099", "0.722851574421", "0.636697292328", "0.68673658371", "0.692828536034"]
  };
  /* With SORTBY rating DESC, Redis's order for the filter query over every restaurant; ties keep this order. */
  var RATING_ORDER = ["restaurant:r203", "restaurant:r201", "restaurant:r207", "restaurant:r204", "restaurant:r205", "restaurant:r202", "restaurant:r208", "restaurant:r206", "restaurant:r209"];
  /* The first values of each stored embedding, exactly as JSON.GET returns them. */
  var EMB_HEAD = {"r201": ["0.04439988732337952", "0.002344636945053935", "-0.02102598361670971"], "r202": ["-0.009474989026784897", "0.04411104694008827", "0.015289615839719772"], "r203": ["0.05515208840370178", "0.04495057091116905", "-0.0338861346244812"], "r204": ["0.050080303102731705", "-0.04551943391561508", "-0.021016927435994148"], "r205": ["-0.0047023845836520195", "-0.02009732648730278", "-0.02908134832978249"], "r206": ["-0.0132148377597332", "0.022801263257861137", "0.01718839816749096"], "r207": ["0.006638871040195227", "0.0655502900481224", "-0.027398202568292614"], "r208": ["0.0015139051247388124", "0.0566369891166687", "-0.034058827906847"], "r209": ["0.02532639168202877", "-0.03698892146348953", "-0.02113431505858898"]};
  var SCHEMA_YAML = "version: \"0.1.0\"\n\nindex:\n  name: restaurants\n  prefix: restaurant\n  storage_type: json\n\nfields:\n  - name: name\n    type: text\n  - name: description\n    type: text\n  - name: cuisine\n    type: tag\n  - name: city\n    type: tag\n  - name: rating\n    type: numeric\n  - name: price_level\n    type: numeric\n  - name: avg_delivery_min\n    type: numeric\n  - name: description_embedding\n    type: vector\n    attrs:\n      algorithm: hnsw\n      dims: 768\n      distance_metric: cosine\n      datatype: float32\n";
  var INDEX = "restaurants", PREFIX = "restaurant", VECTOR_FIELD = "description_embedding", K = 3, RANGE_LIMIT = 10, FILTER_LIMIT = 10;   // K: num_results until the reader changes it
  var RETURN = ["name", "cuisine", "city", "rating", "price_level", "avg_delivery_min"];
  var MODEL = "sentence-transformers/all-mpnet-base-v2";
  var CITIES = ["austin", "seattle", "denver"];
  var THRESHOLDS = [0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8];

  /* --------------------------------------------------------------- helpers */

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function code(s) { return "<code>" + esc(s) + "</code>"; }
  function py(s) { return JSON.stringify(s); }   // a Python string literal for the plain strings here
  function rest(id) { return RESTAURANTS.filter(function (r) { return PREFIX + ":" + r[0] === id; })[0]; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  /* ------------------------------------------------- the queries RedisVL builds */

  /* One filter per control, in a fixed order: the RedisVL expression and the query syntax it becomes. */
  function filterParts(f) {
    var p = [];
    if (f.city) p.push({ py: 'Tag("city") == ' + py(f.city), rq: "@city:{" + f.city + "}", test: function (r) { return r[3] === f.city; }, why: "city " + f.city + "" });
    if (f.price) p.push({ py: 'Num("price_level") <= ' + f.price, rq: "@price_level:[-inf " + f.price + "]", test: function (r) { return r[5] <= f.price; }, why: "price level over " + f.price });
    if (f.rating) p.push({ py: 'Num("rating") >= ' + f.rating, rq: "@rating:[" + f.rating + " +inf]", test: function (r) { return r[4] >= f.rating; }, why: "rating under " + f.rating });
    if (f.fast) p.push({ py: 'Num("avg_delivery_min") <= ' + f.fast, rq: "@avg_delivery_min:[-inf " + f.fast + "]", test: function (r) { return r[6] <= f.fast; }, why: "delivery over " + f.fast + " min" });
    return p;
  }
  /* RedisVL combines expressions pairwise, left to right, and each & wraps its two sides in parentheses. */
  function filterString(parts) {
    if (!parts.length) return null;
    var s = parts[0].rq;
    for (var i = 1; i < parts.length; i++) s = "(" + s + " " + parts[i].rq + ")";
    return s;
  }
  /* A query as RedisVL builds it: the query string, FT.SEARCH's arguments, and what Redis returns. */
  function build(q) {
    var parts = filterParts(q.filters), fs = filterString(parts), k = q.k || K, qs, args, res;
    var pass = RESTAURANTS.filter(function (r) { return parts.every(function (p) { return p.test(r); }); });
    var byDist = function (a, b) { return a.d - b.d; };
    var scored = function () {
      var dist = DISTANCES[q.phrase];
      return pass.map(function (r) { var i = RESTAURANTS.indexOf(r); return { id: PREFIX + ":" + r[0], ds: dist[i], d: parseFloat(dist[i]) }; }).sort(byDist);
    };
    var ret = RETURN.concat(q.type === "filter" ? [] : ["vector_distance"]);
    var tail = ["RETURN", String(ret.length)].concat(ret);
    if (q.type === "vector") {
      qs = (fs ? "(" + fs + ")" : "*") + "=>[KNN " + k + " @" + VECTOR_FIELD + " $vector AS vector_distance]";
      tail = tail.concat(["SORTBY", "vector_distance", "ASC", "DIALECT", "2", "LIMIT", "0", String(k), "PARAMS", "2", "vector", "<vector>"]);
      res = scored().slice(0, k);
    } else if (q.type === "range") {
      qs = "@" + VECTOR_FIELD + ":[VECTOR_RANGE $distance_threshold $vector]=>{$YIELD_DISTANCE_AS: vector_distance}" + (fs ? " (" + fs + ")" : "");
      tail = tail.concat(["SORTBY", "vector_distance", "ASC", "DIALECT", "2", "LIMIT", "0", String(RANGE_LIMIT), "PARAMS", "4", "vector", "<vector>", "distance_threshold", String(q.threshold)]);
      res = scored().filter(function (x) { return x.d <= q.threshold; }).slice(0, RANGE_LIMIT);
    } else {
      qs = fs || "*";
      tail = tail.concat(["SORTBY", "rating", "DESC", "DIALECT", "2", "LIMIT", "0", String(FILTER_LIMIT)]);
      res = pass.slice().sort(function (a, b) { return (b[4] - a[4]) || (RATING_ORDER.indexOf(PREFIX + ":" + a[0]) - RATING_ORDER.indexOf(PREFIX + ":" + b[0])); })
        .slice(0, FILTER_LIMIT).map(function (r) { return { id: PREFIX + ":" + r[0] }; });
    }
    var str = qs + " " + tail.filter(function (a, i) { return tail.indexOf("PARAMS") < 0 || i < tail.indexOf("PARAMS"); }).join(" ");
    return { parts: parts, filterString: fs, queryString: qs, str: str, args: ["FT.SEARCH", INDEX, qs].concat(tail), results: res, pass: pass };
  }

  /* The RedisVL code for a query: what you'd run against the restaurants index. */
  function pythonFor(q, built) {
    var cls = { vector: "VectorQuery", range: "VectorRangeQuery", filter: "FilterQuery" }[q.type];
    var names = built.parts.map(function (p) { return p.py.split("(")[0]; }).filter(function (n, i, a) { return a.indexOf(n) === i; }).sort();
    var lines = ["from redisvl.index import SearchIndex", "from redisvl.query import " + cls];
    if (names.length) lines.push("from redisvl.query.filter import " + names.join(", "));
    if (q.type !== "filter") lines.push("from redisvl.utils.vectorize import HFTextVectorizer");
    lines.push("", 'index = SearchIndex.from_yaml("restaurants.yaml", redis_url="redis://localhost:6379")');
    if (q.type !== "filter") lines.push('vectorizer = HFTextVectorizer(model="' + MODEL + '")');
    lines.push("", "query = " + cls + "(");
    if (q.type !== "filter") lines.push("    vector=vectorizer.embed(" + py(q.phrase) + "),", '    vector_field_name="' + VECTOR_FIELD + '",');
    lines.push("    return_fields=[" + RETURN.map(py).join(", ") + "],");
    if (built.parts.length) lines.push("    filter_expression=" + (built.parts.length === 1 ? built.parts[0].py : built.parts.map(function (p) { return "(" + p.py + ")"; }).join(" & ")) + ",");
    if (q.type === "vector") lines.push("    num_results=" + (q.k || K) + ",");
    if (q.type === "range") lines.push("    distance_threshold=" + q.threshold + ",");
    if (q.type === "filter") lines.push('    sort_by=("rating", "DESC"),');
    lines.push(")", "results = index.query(query)");
    return lines.join("\n");
  }
  /* FT.SEARCH as you'd read it: one clause per line, with the vector shown as a placeholder. */
  function commandFor(built) {
    var a = built.args, out = [a[0] + " " + a[1], '  "' + a[2] + '"'], i = 3;
    while (i < a.length) {
      var w = a[i], n = w === "RETURN" || w === "PARAMS" ? +a[i + 1] + 2 : w === "SORTBY" ? 3 : 2;
      if (w === "LIMIT") n = 3;
      out.push("  " + a.slice(i, i + n).join(" ").replace("<vector>", "<768-dim float32 embedding, 3072 bytes>"));
      i += n;
    }
    return out.join("\n");
  }

  /* A restaurant's document as JSON.GET returns it, pretty-printed, with the embedding cut to its first values. */
  function docHtml(r) {
    var key = function (k) { return '<span class="rcr-jk">"' + k + '"</span>: '; };
    var str = function (v) { return '<span class="rcr-js">' + esc(JSON.stringify(v)) + "</span>"; };
    var num = function (v) { return '<span class="rcr-jn">' + v + "</span>"; };
    var f = [["id", str(r[0])], ["name", str(r[1])], ["cuisine", str(r[2])], ["city", str(r[3])], ["rating", num(r[4])], ["price_level", num(r[5])],
      ["avg_delivery_min", num(r[6])], ["description", str(r[7])],
      [VECTOR_FIELD, "[" + EMB_HEAD[r[0]].map(num).join(", ") + ', <span class="rvd-more">… 765 more</span>]']];
    return "{\n" + f.map(function (x, i) { return "  " + key(x[0]) + x[1] + (i < f.length - 1 ? "," : ""); }).join("\n") + "\n}";
  }
  /* The schema fields a query reads: its vector, its filters, and what it sorts by. */
  function fieldsUsed(q, built) {
    var used = q.type === "filter" ? ["rating"] : [VECTOR_FIELD];
    built.parts.forEach(function (p) { used.push(p.rq.split(":")[0].slice(1)); });
    return used.filter(function (f, i, a) { return a.indexOf(f) === i; });
  }
  /* restaurants.yaml, with the blocks for the fields in use highlighted. */
  function schemaHtml(used) {
    var cur = null;
    return SCHEMA_YAML.replace(/\n$/, "").split("\n").map(function (line) {
      var m = line.match(/^  - name: (\S+)/);
      if (m) cur = m[1];
      else if (!/^ {4}/.test(line)) cur = null;
      return used.indexOf(cur) >= 0 ? '<span class="rvd-hl">' + esc(line) + "</span>" : esc(line);
    }).join("\n");
  }
  /* Code with "restaurants.yaml" as a link to the schema. */
  function withYamlLink(text) {
    return esc(text).replace(/&quot;restaurants\.yaml&quot;/g, '<button type="button" class="rvd-yaml" title="Show restaurants.yaml">&quot;restaurants.yaml&quot;</button>');
  }

  /* --------------------------------------------------------------- the widget */

  var STEPS = [
    { key: "vector", n: "1", label: "Vector query", lede: "A vector query embeds a phrase with the same model that embedded each restaurant's description, then returns the restaurants closest in meaning, up to the number you ask for, even when they share no words with the phrase. Add filters to limit which restaurants it can return." },
    { key: "filter", n: "2", label: "Filter query", lede: "A filter query matches restaurants on their fields alone, with no vector. Tag and numeric conditions combine with &, the same expressions a vector query uses." },
    { key: "range", n: "3", label: "Range query", lede: "A range query returns every restaurant within a distance threshold, up to ten, instead of a fixed number." }
  ];

  function init(root) {
    var st = { tab: "vector", phrase: PHRASES[0], filters: { city: null, price: null, rating: null, fast: null }, k: K, threshold: 0.5, view: "python",
      open: null, dataKey: PREFIX + ":" + RESTAURANTS[0][0] };   // open: the result row showing its document
    root.innerHTML = "";
    var tabs = el("div", "rcr-tabs");
    tabs.setAttribute("role", "tablist");
    STEPS.forEach(function (t, i) {
      var b = el("button", "rcr-tab", '<span class="rcr-n">' + t.n + "</span>" + esc(t.label));
      b.type = "button"; b.setAttribute("role", "tab"); b.dataset.tab = t.key;
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () { st.tab = t.key; render(); });
      tabs.appendChild(b);
    });
    root.appendChild(tabs);
    var panel = el("div", "rcr-panel");
    panel.setAttribute("role", "tabpanel");
    root.appendChild(panel);

    function query() {
      if (st.tab === "vector") return { type: "vector", phrase: st.phrase, filters: st.filters, k: st.k };
      if (st.tab === "filter") return { type: "filter", filters: st.filters };
      return { type: "range", phrase: st.phrase, filters: st.filters, threshold: st.threshold, k: st.k };   // k: for comparing with a vector query
    }

    function render() {
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === st.tab ? "true" : "false"); });
      var step = STEPS.filter(function (t) { return t.key === st.tab; })[0], q = query(), built = build(q);
      panel.innerHTML = "";
      panel.appendChild(el("div", "rcr-lede", esc(step.lede)));   // a div, so the site's paragraph styles stay out
      panel.appendChild(controls(q));
      panel.appendChild(resultsCard(q, built));
      panel.appendChild(codeCard(q, built));
      var i = STEPS.indexOf(step), nxt = STEPS[i + 1];
      if (nxt) {
        var row = el("div", "rcr-next"), b = el("button", "rcr-btn rcr-btn-primary", "Next: " + esc(nxt.label) + " →");
        b.type = "button";
        b.addEventListener("click", function () { st.tab = nxt.key; render(); root.scrollIntoView({ block: "start", behavior: "smooth" }); });
        row.appendChild(b);
        panel.appendChild(row);
      }
    }

    /* A row of options where one is chosen: phrases, filter values, query types. */
    function choice(label, opts, value, onPick, cls, literal) {
      var g = el("div", "rvd-choice" + (cls ? " " + cls : ""));
      g.appendChild(el("span", "rvd-lblrow", '<span class="rcr-lbl">' + esc(label) + "</span>" + (literal ? " " + code(literal) : "")));   // the literal keeps its case
      var row = el("div", "rvd-opts");
      row.setAttribute("role", "radiogroup");
      row.setAttribute("aria-label", label);
      opts.forEach(function (o) {
        var b = el("button", "rcr-chip rvd-opt" + (o[0] === value ? " is-on" : ""), esc(o[1]));
        b.type = "button";
        b.setAttribute("role", "radio");
        b.setAttribute("aria-checked", o[0] === value ? "true" : "false");
        b.addEventListener("click", function () { onPick(o[0]); render(); });
        row.appendChild(b);
      });
      g.appendChild(row);
      return g;
    }
    function controls(q) {
      var box = el("div", "rvd-controls");
      if (q.type !== "filter") box.appendChild(choice("Search for", PHRASES.map(function (p) { return [p, "“" + p + "”"]; }), st.phrase, function (v) { st.phrase = v; }, "rvd-phrases"));
      if (q.type === "vector") box.appendChild(choice("Results to return", RESTAURANTS.map(function (r, i) { return [i + 1, String(i + 1)]; }), st.k, function (v) { st.k = v; }, "rvd-k", "num_results"));
      /* The filters carry across tabs. In a vector or range query they're optional; a filter query is nothing but them. */
      {
        var f = el("div", "rvd-filters");
        f.appendChild(el("div", "rvd-filtershead", '<span class="rcr-lbl">Filters</span>' + (q.type === "filter" ? "" : '<span class="rcr-faint">optional</span>')));
        f.appendChild(choice("City", [[null, "Any"]].concat(CITIES.map(function (c) { return [c, cap(c)]; })), st.filters.city, function (v) { st.filters.city = v; }));
        f.appendChild(choice("Price level", [[null, "Any"], [2, "2 or less"], [1, "1"]], st.filters.price, function (v) { st.filters.price = v; }));
        f.appendChild(choice("Rating", [[null, "Any"], [4.5, "4.5 or more"]], st.filters.rating, function (v) { st.filters.rating = v; }));
        f.appendChild(choice("Delivery", [[null, "Any"], [30, "30 min or less"]], st.filters.fast, function (v) { st.filters.fast = v; }));
        box.appendChild(f);
      }
      if (st.tab === "range") {
        var g = el("div", "rvd-choice rvd-threshold");
        g.appendChild(el("label", "rcr-lbl", 'Distance threshold <b class="rcr-mono">' + st.threshold.toFixed(2) + "</b>"));
        var r = el("input");
        r.type = "range"; r.min = "0"; r.max = String(THRESHOLDS.length - 1); r.step = "1";
        r.value = String(THRESHOLDS.indexOf(st.threshold));
        r.setAttribute("aria-label", "Distance threshold");
        r.setAttribute("aria-valuetext", st.threshold.toFixed(2));
        r.addEventListener("input", function () { st.threshold = THRESHOLDS[+r.value]; render(); var again = panel.querySelector(".rvd-threshold input"); if (again) again.focus(); });
        g.appendChild(r);
        box.appendChild(g);
      }
      return box;
    }

    /* Every restaurant, closest first: what the query returns, and why the rest don't make it. */
    function resultsCard(q, built) {
      var card = el("div", "rcr-card rvd-results");
      var returned = built.results.map(function (x) { return x.id; });
      card.appendChild(el("div", "rcr-cardhead", "<span>Results</span>" + '<span class="rcr-count">' + returned.length + " returned</span>"));
      var vector = q.type !== "filter", dist = vector ? DISTANCES[q.phrase] : null;
      var rows = RESTAURANTS.map(function (r, i) { return { r: r, id: PREFIX + ":" + r[0], d: vector ? parseFloat(dist[i]) : null, ds: vector ? dist[i] : null }; });
      if (vector) rows.sort(function (a, b) { return a.d - b.d; });
      else rows.sort(function (a, b) { var x = returned.indexOf(a.id), y = returned.indexOf(b.id); return (x < 0 ? 99 : x) - (y < 0 ? 99 : y) || (b.r[4] - a.r[4]); });
      var list = el("div", "rvd-list");
      list.appendChild(el("div", "rvd-axis", "<span>" + esc((vector ? (q.type === "range" ? "Within the threshold first. Bars show cosine distance: shorter is closer. " : "Closest first. Bars show cosine distance: shorter is closer. ") : "") +
        "Select a restaurant to see its document in Redis.") + "</span>"));
      rows.forEach(function (x) {
        var r = x.r, failed = built.parts.filter(function (p) { return !p.test(r); });
        var state = returned.indexOf(x.id) >= 0 ? "is-hit" : failed.length ? "is-filtered" : "is-miss";
        var why = failed.length ? "filtered out: " + failed.map(function (p) { return p.why; }).join(", ") :
          state === "is-miss" ? (q.type === "range" ? "beyond the threshold" : q.k === 1 ? "not the closest" : "not in the top " + q.k) : "returned";
        var row = el("div", "rvd-row " + state + (st.open === x.id ? " is-open" : ""));
        row.setAttribute("role", "button");
        row.setAttribute("tabindex", "0");
        row.setAttribute("aria-expanded", st.open === x.id ? "true" : "false");
        row.title = "Show " + x.id + " as stored";
        var toggle = function () { st.open = st.open === x.id ? null : x.id; render(); var again = panel.querySelector('.rvd-row[data-id="' + x.id + '"]'); if (again) again.focus(); };
        row.dataset.id = x.id;
        row.addEventListener("click", toggle);
        row.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
        row.innerHTML = '<span class="rvd-name"><b>' + esc(r[1]) + '</b><span class="rvd-meta">' + esc(cap(r[3])) + " · " + esc(r[2]) + " · ★ " + r[4] + " · price " + r[5] + " · " + r[6] + " min</span></span>" +
          (vector ? '<span class="rvd-bar" aria-hidden="true"><span style="width:' + Math.min(100, x.d * 100).toFixed(1) + '%"></span>' +
            (q.type === "range" ? '<i style="left:' + (q.threshold * 100) + '%"></i>' : "") + "</span>" +
            '<span class="rvd-dist rcr-mono" title="vector_distance ' + esc(x.ds) + '">' + x.d.toFixed(3) + "</span>" : "") +
          '<span class="rvd-why">' + esc(why) + "</span>";
        list.appendChild(row);
        if (st.open === x.id) list.appendChild(docBox(r));
      });
      card.appendChild(list);
      card.appendChild(el("div", "rvd-note", note(q, built, rows)));
      return card;
    }
    function docBox(r) {
      var box = el("div", "rvd-doc");
      box.appendChild(el("div", "rvd-dochead", '<span class="rcr-mono">JSON.GET ' + esc(PREFIX + ":" + r[0]) + '</span><span class="rcr-faint">the embedding is shortened here</span>'));
      box.appendChild(el("pre", "rcr-code rvd-pre", docHtml(r)));
      return box;
    }
    /* What to notice about this result. */
    function note(q, built, rows) {
      var hits = built.results.map(function (x) { return rest(x.id)[1]; });
      if (q.type === "filter") return built.parts.length ? hits.length + " restaurant" + (hits.length === 1 ? " matches" : "s match") + " the filters, sorted by rating. No embedding is involved, so the order says nothing about meaning." :
        "With no filters, a filter query matches every restaurant. Add filters to narrow it down.";
      var best = rows[0], bestOut = built.parts.some(function (p) { return !p.test(best.r); });
      if (q.type === "vector") {
        if (!built.parts.length) return best.r[1] + " is the closest match, at a cosine distance of " + best.d.toFixed(3) + ". Distance runs from 0, the same meaning, to 2, the opposite.";
        if (!hits.length) return "No restaurant passes every filter, so there's nothing to rank.";
        return (bestOut ? best.r[1] + " is the closest match overall, but it doesn't pass the filters, so it isn't a candidate. " : "") +
          (built.pass.length < q.k ? "Only " + built.pass.length + " restaurant" + (built.pass.length === 1 ? " passes" : "s pass") + " the filters, so the query returns " + built.pass.length + " instead of " + q.k + "." :
            "Only the " + built.pass.length + " restaurants that pass the filters are candidates, and the query returns the closest " + (q.k === 1 ? "one" : q.k) + ".");
      }
      if (!hits.length) return "Nothing is within " + q.threshold.toFixed(2) + " of “" + q.phrase + "”. Raise the threshold, or remove a filter.";
      var knnFar = rows.filter(function (x) { return !built.parts.some(function (p) { return !p.test(x.r); }); }).slice(0, q.k).filter(function (x) { return x.d > q.threshold; });
      return hits.length + " restaurant" + (hits.length === 1 ? " is" : "s are") + " within " + q.threshold.toFixed(2) + "." +
        (knnFar.length ? " A vector query would still return " + knnFar.map(function (x) { return x.r[1]; }).join(" and ") + ", at " + knnFar.map(function (x) { return x.d.toFixed(3); }).join(" and ") + "." : "");
    }

    /* The code behind the results: RedisVL, the command it sends, and the index schema. */
    function codeCard(q, built) {
      var card = el("div", "rcr-card rvd-code");
      var head = el("div", "rcr-cardhead rvd-codehead", "<span>Code</span>");
      var sub = el("div", "rcr-subtabs");
      sub.setAttribute("role", "tablist");
      [["python", "RedisVL"], ["redis", "FT.SEARCH"], ["schema", "Schema"], ["data", "Data"]].forEach(function (t) {
        var b = el("button", "rcr-subtab", esc(t[1]));
        b.type = "button"; b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", st.view === t[0] ? "true" : "false");
        b.addEventListener("click", function () { st.view = t[0]; render(); });
        sub.appendChild(b);
      });
      head.appendChild(sub);
      card.appendChild(head);
      var used = fieldsUsed(q, built);
      if (st.view !== "data") {
        var pre = el("pre", "rcr-code rvd-pre", st.view === "python" ? withYamlLink(pythonFor(q, built)) : st.view === "redis" ? esc(commandFor(built)) : schemaHtml(used));
        pre.addEventListener("click", function (e) { if (e.target.closest(".rvd-yaml")) { st.view = "schema"; render(); } });
        card.appendChild(pre);
      }
      card.appendChild(el("div", "rcr-faint", st.view === "python" ? "The query RedisVL builds: " + code(built.queryString) :
        st.view === "redis" ? "What RedisVL sends for " + code("index.query(query)") + ". The embedding goes in as binary." :
          st.view === "schema" ? code("restaurants.yaml") + ". Highlighted: the fields this query uses, " + used.map(code).join(", ") + "." :
            "Each restaurant is a JSON document under " + code("restaurant:{id}") + ", the same keys as the other demos. Select a key to see what it holds."));
      if (st.view === "data") {
        var keys = el("div", "rvd-keys");
        RESTAURANTS.forEach(function (r) {
          var k = PREFIX + ":" + r[0], b = el("button", "rcr-chip rvd-opt rcr-mono" + (st.dataKey === k ? " is-on" : ""), esc(k));
          b.type = "button";
          b.setAttribute("aria-pressed", st.dataKey === k ? "true" : "false");
          b.addEventListener("click", function () { st.dataKey = k; render(); });
          keys.appendChild(b);
        });
        card.appendChild(keys);
        card.appendChild(docBox(rest(st.dataKey)));
      }
      return card;
    }

    render();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rvd[data-redisvl]"), init); }
  window.RedisVLDemo = { build: build, pythonFor: pythonFor, commandFor: commandFor, docHtml: docHtml, fieldsUsed: fieldsUsed, data: { RESTAURANTS: RESTAURANTS, PHRASES: PHRASES, DISTANCES: DISTANCES } };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();
})();

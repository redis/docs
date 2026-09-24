/* =========================================================================
   Redis Context Retriever scripted demo
   Dependency-free. Everything runs in the browser against an in-memory
   sample dataset; no Context Retriever service is called.

   Tool names, argument shapes, descriptions, and response envelopes mirror
   what a live Context Retriever MCP server returned (Sep 2026). Two parts are
   modelled rather than observed: relationship names, and text_query /
   numeric_conditions on the per-entity filter tool (observed on the set
   tools only).
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------------------------------------------ data */

  /* A fictional food delivery app: customers, restaurants, and orders. */
  function ts(y, m, d, h) { return Math.floor(Date.UTC(y, m - 1, d, h == null ? 12 : h) / 1000); }

  var CUSTOMERS = [
    ["u101", "Maya Chen", "austin", "vegetarian", "thai", 1240, ts(2024, 5, 3)],
    ["u102", "Liam Ortiz", "austin", "none", "bbq", 860, ts(2025, 1, 19)],
    ["u103", "Priya Nair", "seattle", "vegan", "indian", 2310, ts(2023, 9, 12)],
    ["u104", "Noah Williams", "denver", "none", "pizza", 410, ts(2025, 11, 2)],
    ["u105", "Sofia Rossi", "seattle", "vegetarian", "italian", 1780, ts(2024, 2, 27)],
    ["u106", "Ethan Brooks", "denver", "gluten_free", "sushi", 950, ts(2024, 8, 14)],
    ["u107", "Aisha Khan", "austin", "halal", "mediterranean", 1530, ts(2023, 12, 6)],
    ["u108", "Lucas Meyer", "denver", "none", "burgers", 120, ts(2026, 7, 21)]
  ].map(function (r) {
    return { id: r[0], name: r[1], email: r[1].toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com",
      city: r[2], dietary: r[3], favorite_cuisine: r[4], loyalty_points: r[5], joined_ts: r[6] };
  });

  var RESTAURANTS = [
    ["r201", "Bangkok Street Kitchen", "thai", "austin", 4.7, 2, 30],
    ["r202", "Smokehouse 512", "bbq", "austin", 4.4, 3, 40],
    ["r203", "Green Bowl", "vegan", "seattle", 4.8, 2, 25],
    ["r204", "Sakura Sushi Bar", "sushi", "denver", 4.6, 3, 35],
    ["r205", "Nonna's Trattoria", "italian", "seattle", 4.5, 3, 45],
    ["r206", "Slice Society", "pizza", "denver", 4.2, 1, 30],
    ["r207", "Olive & Za'atar", "mediterranean", "austin", 4.6, 2, 30],
    ["r208", "Spice Route", "indian", "seattle", 4.3, 2, 40],
    ["r209", "Lotus Thai", "thai", "austin", 4.1, 1, 25]
  ].map(function (r) {
    return { id: r[0], name: r[1], cuisine: r[2], city: r[3], rating: r[4], price_level: r[5], avg_delivery_min: r[6] };
  });

  var ORDERS = [
    ["o3001", "u101", "r201", "delivered", 34.5, ts(2026, 9, 2, 19), "Pad thai with tofu, spring rolls"],
    ["o3002", "u101", "r207", "delivered", 28, ts(2026, 9, 10, 13), "Falafel wrap, hummus"],
    ["o3003", "u101", "r209", "on_the_way", 22.75, ts(2026, 9, 24, 18), "Green curry without fish sauce, jasmine rice"],
    ["o3004", "u102", "r202", "delivered", 61.2, ts(2026, 9, 5, 20), "Brisket platter, mac and cheese"],
    ["o3005", "u102", "r201", "cancelled", 19.9, ts(2026, 8, 28, 12), "Pad see ew"],
    ["o3006", "u103", "r203", "delivered", 24, ts(2026, 9, 12, 12), "Buddha bowl, oat latte"],
    ["o3007", "u103", "r208", "delivered", 38.4, ts(2026, 9, 18, 19), "Chana masala, garlic naan"],
    ["o3008", "u104", "r206", "delivered", 42, ts(2026, 9, 6, 20), "Two large pizzas"],
    ["o3009", "u104", "r204", "delivered", 67.8, ts(2026, 9, 20, 19), "Omakase set for two"],
    ["o3010", "u105", "r205", "delivered", 54.3, ts(2026, 9, 8, 20), "Mushroom risotto, tiramisu"],
    ["o3011", "u105", "r203", "preparing", 21.5, ts(2026, 9, 24, 18), "Vegan lasagna"],
    ["o3012", "u106", "r204", "delivered", 48.9, ts(2026, 9, 14, 19), "Salmon nigiri, miso soup"],
    ["o3013", "u107", "r207", "delivered", 36.2, ts(2026, 9, 11, 13), "Chicken shawarma plate"],
    ["o3014", "u107", "r201", "delivered", 26, ts(2026, 8, 30, 19), "Pad thai with chicken"],
    ["o3015", "u108", "r206", "delivered", 18.5, ts(2026, 9, 15, 12), "Pepperoni slice combo"],
    ["o3016", "u108", "r204", "on_the_way", 29.4, ts(2026, 9, 24, 18), "Spicy tuna roll, edamame"],
    ["o3017", "u106", "r206", "delivered", 26, ts(2026, 9, 21, 20), "Gluten-free margherita"],
    ["o3018", "u101", "r201", "delivered", 31, ts(2026, 9, 19, 19), "Pad thai with tofu, mango sticky rice"],
    ["o3019", "u105", "r205", "delivered", 47.6, ts(2026, 9, 22, 20), "Eggplant parmigiana, focaccia"],
    ["o3020", "u102", "r209", "delivered", 25.3, ts(2026, 9, 16, 13), "Drunken noodles, Thai iced tea"]
  ].map(function (r) {
    return { id: r[0], customer_id: r[1], restaurant_id: r[2], status: r[3], total: r[4], placed_ts: r[5], items: r[6] };
  });

  var RECORDS = { Customer: CUSTOMERS, Restaurant: RESTAURANTS, Order: ORDERS };

  /* Keys that exist in the sample database, including some that are not entities. */
  var KEYS = [];
  CUSTOMERS.forEach(function (c) { KEYS.push({ key: "customer:" + c.id, type: "JSON", entity: "Customer", doc: c }); });
  RESTAURANTS.forEach(function (r) { KEYS.push({ key: "restaurant:" + r.id, type: "JSON", entity: "Restaurant", doc: r }); });
  ORDERS.forEach(function (o) { KEYS.push({ key: "order:" + o.id, type: "JSON", entity: "Order", doc: o }); });
  KEYS.push({ key: "cart:u104", type: "hash", doc: null });
  KEYS.push({ key: "stats:orders:hourly", type: "TSDB-TYPE", doc: null });

  function defaultModel() {
    return [
      { name: "Customer", template: "customer:{id}", desc: "A person who orders food through the app.", fields: [
        { name: "id", type: "string", pk: true, index: "tag", desc: "Customer ID." },
        { name: "name", type: "string", index: "text", desc: "Full name." },
        { name: "email", type: "string", index: "none", desc: "Contact email." },
        { name: "city", type: "string", index: "tag", desc: "Delivery city." },
        { name: "dietary", type: "string", index: "tag", desc: "Dietary preference: none, vegetarian, vegan, gluten_free, or halal." },
        { name: "favorite_cuisine", type: "string", index: "tag", desc: "Most-ordered cuisine." },
        { name: "loyalty_points", type: "number", index: "numeric", desc: "Loyalty points balance." },
        { name: "joined_ts", type: "number", index: "numeric", desc: "Signup time, Unix seconds." }
      ] },
      { name: "Restaurant", template: "restaurant:{id}", desc: "A restaurant that delivers through the app.", fields: [
        { name: "id", type: "string", pk: true, index: "tag", desc: "Restaurant ID." },
        { name: "name", type: "string", index: "text", desc: "Restaurant name." },
        { name: "cuisine", type: "string", index: "tag", desc: "Cuisine type." },
        { name: "city", type: "string", index: "tag", desc: "City the restaurant delivers in." },
        { name: "rating", type: "number", index: "numeric", desc: "Average rating, 1 to 5." },
        { name: "price_level", type: "number", index: "numeric", desc: "Price level, 1 to 4." },
        { name: "avg_delivery_min", type: "number", index: "numeric", desc: "Average delivery time in minutes." }
      ] },
      { name: "Order", template: "order:{id}", desc: "A delivery order placed by a customer at a restaurant.", fields: [
        { name: "id", type: "string", pk: true, index: "tag", desc: "Order ID." },
        { name: "customer_id", type: "string", index: "tag", rel: "Customer", desc: "Customer who placed the order." },
        { name: "restaurant_id", type: "string", index: "tag", rel: "Restaurant", desc: "Restaurant that made the order." },
        { name: "status", type: "string", index: "tag", desc: "preparing, on_the_way, delivered, or cancelled." },
        { name: "total", type: "number", index: "numeric", desc: "Order total in USD." },
        { name: "placed_ts", type: "number", index: "numeric", desc: "Order time, Unix seconds." },
        { name: "items", type: "string", index: "text", desc: "What was ordered." }
      ] }
    ];
  }

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
  function lower(s) { return s.charAt(0).toLowerCase() + s.slice(1); }
  function snake(s) { return s.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase(); }
  function fmtDate(t) { return new Date(t * 1000).toISOString().slice(0, 10); }
  function hash8(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }

  /* Pretty JSON with light syntax colouring. */
  function jsonHtml(v) {
    var s = JSON.stringify(v, null, 2);
    return esc(s).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
      function (m, str, colon, lit, num) {
        if (str) return colon ? '<span class="rcr-jk">' + str + "</span>" + colon : '<span class="rcr-js">' + str + "</span>";
        if (lit) return '<span class="rcr-jl">' + lit + "</span>";
        return '<span class="rcr-jn">' + num + "</span>";
      });
  }

  function templateRegex(t) {
    if (t.indexOf("{id}") === -1) return null;
    var parts = t.split("{id}").map(function (p) { return p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    return new RegExp("^" + parts.join("([^:]+)") + "$");
  }

  /* ---------------------------------------------------- model -> tool list */

  function fieldsBy(ent, idx) { return ent.fields.filter(function (f) { return !f.pk && f.index === idx; }).map(function (f) { return f.name; }); }

  function relationships(model) {
    var rels = [];
    model.forEach(function (e) {
      e.fields.forEach(function (f) {
        if (!f.rel) return;
        var target = model.filter(function (t) { return t.name === f.rel; })[0];
        if (!target) return;
        rels.push({ name: e.name + "." + lower(f.rel), from: e.name, to: f.rel, via: f.name, reverse: false });
        rels.push({ name: f.rel + "." + snake(e.name) + "s", from: f.rel, to: e.name, via: f.name, reverse: true });
      });
    });
    return rels;
  }

  function limitProps(max) {
    return {
      limit: { description: "Maximum number of results to return (default: 10, max: " + max + "). A larger request returns " + max + " results; use offset to page through the rest.", type: "number" },
      offset: { description: "Number of results to skip (default: 0)", type: "number" }
    };
  }

  function conditionSchemas(tags, nums, texts) {
    var p = {};
    if (tags.length) p.tag_conditions = {
      description: "Exact-match tag conditions, ANDed with every other condition. Omit the parameter (or pass []) when there are none.",
      type: "array", maxItems: 16,
      items: { type: "object", additionalProperties: false, required: ["field", "value"], properties: {
        field: { description: "The tag field this condition applies to.", type: "string", enum: tags },
        value: { description: "Exact TAG value to match.", type: "string" },
        exclude: { description: "When true, match records where this field is present and does not contain the exact value.", type: "boolean" } } }
    };
    if (nums.length) p.numeric_conditions = {
      description: "Inclusive numeric-range conditions, ANDed together.",
      type: "array", maxItems: 16,
      items: { type: "object", additionalProperties: false, required: ["field"], properties: {
        field: { description: "Numeric field on the entity.", type: "string", enum: nums },
        min_value: { description: "Inclusive lower bound; omit for unbounded.", type: "number" },
        max_value: { description: "Inclusive upper bound; omit for unbounded.", type: "number" } } }
    };
    if (texts.length) {
      p.text_query = { description: "Lexical text to match on the entity's text fields (" + texts.join(", ") + ").", type: "string" };
      p.text_match_mode = { description: "How text_query terms combine: any (default), all, or phrase.", type: "string", enum: ["any", "all", "phrase"] };
    }
    return p;
  }

  function buildTools(model) {
    var tools = [];
    var rels = relationships(model);
    var names = model.map(function (e) { return e.name; });
    model.forEach(function (e) {
      var pk = e.fields.filter(function (f) { return f.pk; })[0];
      var tags = fieldsBy(e, "tag"), nums = fieldsBy(e, "numeric"), texts = fieldsBy(e, "text");
      var sn = snake(e.name);
      var sample = (RECORDS[e.name] && RECORDS[e.name][0] || {}).id || "3";
      if (pk) tools.push({ name: "get_" + sn + "_by_id", entity: e.name, kind: "get",
        description: "Get " + e.name + " by ID using a key lookup. " + e.desc + " ID field " + pk.name + ": " + pk.desc,
        inputSchema: { type: "object", required: ["id"], properties: { id: {
          description: "The ID of the " + e.name + " to retrieve. Pass only the key component, for example id=\"" + sample + "\"; do not pass the full Redis key " + e.template.replace("{id}", sample) + ".",
          type: "string" } } } });
      if (tags.length || nums.length || texts.length) {
        var parts = [];
        if (tags.length) parts.push("tag_conditions");
        if (nums.length) parts.push("numeric_conditions");
        if (texts.length) parts.push("text_query");
        var lines = [];
        if (tags.length) lines.push("Tag fields (tag_conditions, exact match): " + tags.join(", ") + ".");
        if (nums.length) lines.push("Numeric fields (numeric_conditions, inclusive range): " + nums.join(", ") + ".");
        if (texts.length) lines.push("Text fields (text_query, full-text): " + texts.join(", ") + ".");
        var props = conditionSchemas(tags, nums, texts);
        var lp = limitProps(100); props.limit = lp.limit; props.offset = lp.offset;
        tools.push({ name: "filter_" + sn, entity: e.name, kind: "filter",
          description: "Filter " + e.name + " by one or MORE field conditions in a single call; a record is returned only if it satisfies ALL conditions (AND) across " + parts.join(", ") + ". " + e.desc + " " + lines.join(" "),
          inputSchema: { type: "object", properties: props } });
      }
      if (tags.length || nums.length) {
        var agg = tags.concat(nums);
        var cp = { function: { description: "Aggregation function to execute. count takes no field; count_distinct requires one eligible field.", type: "string", enum: ["count", "count_distinct"] },
          field: { description: "Scalar TAG or NUMERIC field whose distinct values should be counted.", type: "string", enum: agg } };
        if (tags.length) cp.group_by = { description: "Optional scalar TAG field to group counts by.", type: "string", enum: tags };
        cp.limit = { description: "Maximum number of groups to return (default: 10)", type: "integer", minimum: 1, maximum: 100, default: 10 };
        tools.push({ name: "count_" + sn, entity: e.name, kind: "count",
          description: "Count " + e.name + " records without retrieving individual records. " + e.desc,
          inputSchema: { type: "object", additionalProperties: false, required: ["function"], properties: cp } });
      }
    });
    var relText = rels.length ? rels.map(function (r) { return r.name; }).join(", ") : "this data model declares none";
    var setItem = { type: "object", additionalProperties: false, required: ["entity"], properties: {
      entity: { description: "Which entity this set selects.", type: "string", enum: names },
      tag_conditions: { description: "Exact-match tag conditions, ANDed together.", type: "array" },
      numeric_conditions: { description: "Inclusive numeric-range conditions, ANDed together.", type: "array" },
      text_query: { description: "Lexical text to match on the entity's text fields.", type: "string" },
      expand_to: { description: "Optional relationship to follow after retrieving this set, bringing it to the related entity. Declared: " + relText + ".", type: "string" } } };
    var common = "Each set states which records it selects: the entity (" + names.join(", ") + ") plus tag_conditions, numeric_conditions or text_query. The whole matching set is used, not a page of it.";
    function setTool(name, what) {
      var p = { sets: { description: "Two or more sets to combine (at most 8), all resolving to the same entity.", type: "array", minItems: 2, maxItems: 8, items: setItem } };
      var lp = limitProps(100); p.limit = lp.limit; p.offset = lp.offset;
      return { name: name, kind: "set", description: what + " All sets must resolve to the same entity; use expand_to on one of them to bring it to the same entity first. " + common,
        inputSchema: { type: "object", additionalProperties: false, required: ["sets"], properties: p } };
    }
    tools.push(setTool("intersect_results", "Return the records present in EVERY given set (AND) -- the conjunctive filter the per-entity tools cannot express."));
    tools.push(setTool("union_results", "Return the records present in ANY given set (OR)."));
    tools.push(setTool("except_results", "Return the records in the FIRST set that are not in any of the others (set difference)."));
    var ep = { set: setItem, relationship: { description: "Relationship to follow. Declared hops: " + relText + ".", type: "string" } };
    var elp = limitProps(100); ep.limit = elp.limit; ep.offset = elp.offset;
    tools.push({ name: "expand_results", kind: "expand",
      description: "Follow a declared relationship from one set to the related entity and return that entity's records. This is the only tool here that changes entity; use it when a question joins two entities. Relationships you can follow: " + relText + ".",
      inputSchema: { type: "object", additionalProperties: false, required: ["set", "relationship"], properties: ep } });
    return tools;
  }

  function indexCommands(model, surface) {
    return model.filter(function (e) { return e.fields.some(function (f) { return f.index !== "none"; }); }).map(function (e) {
      var prefix = e.template.split("{id}")[0];
      var schema = e.fields.filter(function (f) { return f.index !== "none"; }).map(function (f) {
        return "'$." + f.name + "' AS " + f.name + " " + f.index.toUpperCase() + " INDEXMISSING";
      });
      return "FT.CREATE idx:" + surface + ":" + hash8(e.name + e.template) + ":" + lower(e.name) +
        " ON JSON PREFIX 1 " + prefix + " SCHEMA \\\n    " + schema.join(" \\\n    ");
    });
  }

  /* ------------------------------------------------------- query execution */

  function entityOf(model, name) { return model.filter(function (e) { return e.name === name; })[0]; }

  /* Records an entity can see: JSON documents whose key matches its key template. */
  function rowsFor(ent) {
    var re = templateRegex(ent.template);
    if (!re) return [];
    return KEYS.filter(function (k) { return k.type === "JSON" && re.test(k.key); }).map(function (k) { return k.doc; });
  }

  function McpError(msg) { this.message = msg; }

  function checkEnum(path, val, en) {
    if (!en || en.indexOf(val) === -1)
      throw new McpError("invalid params: validating \"arguments\": validating " + path + ": enum: " + val + " does not equal any of: [" + (en || []).join(" ") + "]");
  }

  function selectSet(model, set, pathRoot) {
    var e = entityOf(model, set.entity);
    if (!e) throw new McpError("invalid params: unknown entity " + set.entity);
    var tags = fieldsBy(e, "tag");
    var nums = fieldsBy(e, "numeric"), texts = fieldsBy(e, "text");
    var rows = rowsFor(e).slice();
    (set.tag_conditions || []).forEach(function (c) {
      checkEnum(pathRoot + "/tag_conditions/items/properties/field", c.field, tags);
      rows = rows.filter(function (r) { return c.exclude ? r[c.field] !== c.value : r[c.field] === c.value; });
    });
    (set.numeric_conditions || []).forEach(function (c) {
      checkEnum(pathRoot + "/numeric_conditions/items/properties/field", c.field, nums);
      rows = rows.filter(function (r) {
        return (c.min_value == null || r[c.field] >= c.min_value) && (c.max_value == null || r[c.field] <= c.max_value);
      });
    });
    if (set.text_query) {
      if (!texts.length) throw new McpError("invalid params: validating \"arguments\": validating " + pathRoot + ": unexpected additional properties [\"text_query\"]");
      var q = set.text_query.toLowerCase(), mode = set.text_match_mode || "any";
      if (/^".*"$/.test(q)) { mode = "phrase"; q = q.slice(1, -1); }
      var terms = q.split(/\s+/).filter(Boolean);
      rows = rows.filter(function (r) {
        var hay = texts.map(function (f) { return String(r[f] || ""); }).join(" ").toLowerCase();
        var words = hay.split(/[^a-z0-9]+/);
        if (mode === "phrase") return (" " + words.join(" ") + " ").indexOf(" " + terms.join(" ") + " ") !== -1;
        var hit = function (t) { return words.indexOf(t) !== -1; };
        return mode === "all" ? terms.every(hit) : terms.some(hit);
      });
    }
    return { entity: e, rows: rows };
  }

  function follow(model, sel, relName, rels) {
    var rel = rels.filter(function (r) { return r.name === relName; })[0];
    if (!rel || rel.from !== sel.entity.name)
      throw new McpError("invalid params: relationship " + relName + " is not declared from " + sel.entity.name + ". Declared hops: " + (rels.map(function (r) { return r.name; }).join(", ") || "none"));
    var target = entityOf(model, rel.to), rows;
    if (!rel.reverse) {
      var ids = sel.rows.map(function (r) { return r[rel.via]; });
      rows = rowsFor(target).filter(function (t) { return ids.indexOf(t.id) !== -1; });
    } else {
      var src = sel.rows.map(function (r) { return r.id; });
      rows = rowsFor(target).filter(function (t) { return src.indexOf(t[rel.via]) !== -1; });
    }
    return { entity: target, rows: rows };
  }

  function stamp(rec, surface) {
    var out = { _retrieval: { source: surface, retrieved_at: new Date().toISOString(), source_version: 1 } };
    Object.keys(rec).sort().forEach(function (k) { out[k] = rec[k]; });
    return out;
  }

  function page(rows, args) {
    var limit = Math.min(args.limit || 10, 100), offset = args.offset || 0;
    return { rows: rows.slice(offset, offset + limit), limit: limit, offset: offset, has_more: rows.length > offset + limit };
  }

  function execute(model, tools, surface, name, args) {
    var tool = tools.filter(function (t) { return t.name === name; })[0];
    if (!tool) throw new McpError("unknown tool \"" + name + "\"");
    var rels = relationships(model);
    if (tool.kind === "get") {
      var ent = entityOf(model, tool.entity);
      var rec = rowsFor(ent).filter(function (r) { return r.id === args.id; })[0];
      if (!rec) return { error: "not found: " + ent.template.replace("{id}", args.id) };
      return stamp(rec, surface);
    }
    if (tool.kind === "filter") {
      var props = tool.inputSchema.properties;
      Object.keys(args).forEach(function (k) {
        if (!props[k]) throw new McpError("invalid params: validating \"arguments\": validating root: unexpected additional properties [\"" + k + "\"]");
      });
      var sel = selectSet(model, { entity: tool.entity, tag_conditions: args.tag_conditions, numeric_conditions: args.numeric_conditions, text_query: args.text_query, text_match_mode: args.text_match_mode }, "/properties");
      var pg = page(sel.rows, args);
      return { count: pg.rows.length, has_more: pg.has_more, limit: pg.limit, offset: pg.offset,
        results: pg.rows.map(function (r) { return stamp(r, surface); }), total_count: sel.rows.length };
    }
    if (tool.kind === "count") {
      var ce = entityOf(model, tool.entity), rows = rowsFor(ce);
      if (args.group_by) {
        checkEnum("/properties/group_by", args.group_by, tool.inputSchema.properties.group_by && tool.inputSchema.properties.group_by.enum);
        var g = {};
        rows.forEach(function (r) { g[r[args.group_by]] = (g[r[args.group_by]] || 0) + 1; });
        return { function: "count", group_by: args.group_by,
          groups: Object.keys(g).sort().map(function (k) { return { value: g[k], group_value: k }; }), has_more: false };
      }
      return { function: "count", value: rows.length };
    }
    if (tool.kind === "set") {
      var resolved = args.sets.map(function (s, i) {
        var sl = selectSet(model, s, "/properties/sets/items/" + i);
        return s.expand_to ? follow(model, sl, s.expand_to, rels) : sl;
      });
      var ename = resolved[0].entity.name;
      resolved.forEach(function (r) {
        if (r.entity.name !== ename) throw new McpError("invalid params: all sets must resolve to the same entity (got " + ename + " and " + r.entity.name + ")");
      });
      var idLists = resolved.map(function (r) { return r.rows.map(function (x) { return x.id; }); });
      var ids;
      if (name === "intersect_results") ids = idLists[0].filter(function (id) { return idLists.every(function (l) { return l.indexOf(id) !== -1; }); });
      else if (name === "union_results") { ids = []; idLists.forEach(function (l) { l.forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); }); }); }
      else ids = idLists[0].filter(function (id) { return idLists.slice(1).every(function (l) { return l.indexOf(id) === -1; }); });
      var pr = page(ids, args), tpl = resolved[0].entity.template;
      return { complete: true, count: ids.length, entity: ename, has_more: pr.has_more,
        ids: pr.rows.map(function (id) { return tpl.replace("{id}", id); }), limit: pr.limit, offset: pr.offset };
    }
    if (tool.kind === "expand") {
      var from = selectSet(model, args.set, "/properties/set");
      var to = follow(model, from, args.relationship, rels);
      var pe = page(to.rows, args);
      return { complete: true, count: to.rows.length, entity: to.entity.name, has_more: pe.has_more,
        ids: pe.rows.map(function (r) { return to.entity.template.replace("{id}", r.id); }), limit: pe.limit, offset: pe.offset };
    }
    throw new McpError("unsupported tool");
  }

  /* ------------------------------------------------------ scripted agent */

  function idFromKey(k) { return k.slice(k.lastIndexOf(":") + 1); }
  function usd2(n) { return "$" + Number(n).toFixed(2); }
  var SEPT_START = ts(2026, 9, 1, 0), SEPT_END = ts(2026, 10, 1, 0) - 1;
  function label(s) { return String(s).replace(/_/g, " "); }
  function city(s) { return String(s).charAt(0).toUpperCase() + String(s).slice(1); }

  /* Look up each distinct restaurant once, the way an agent would. */
  function restaurantNames(call, orders) {
    var names = {};
    orders.forEach(function (o) {
      if (!names[o.restaurant_id]) names[o.restaurant_id] = call("get_restaurant_by_id", { id: o.restaurant_id }).name;
    });
    return names;
  }

  /* Each question drives tool calls through `call(name, args)` and returns the answer. */
  var QUESTIONS = [
    { q: "How many customers follow each diet?",
      run: function (call) {
        var r = call("count_customer", { function: "count", group_by: "dietary" });
        if (!r.groups.length) return "I found no customers. Check that the Customer key template matches your keys.";
        return "Here's the split by dietary preference: " + r.groups.slice().sort(function (a, b) { return b.value - a.value; })
          .map(function (g) { return "**" + g.value + "** " + (g.group_value === "none" ? "with no restriction" : label(g.group_value)); }).join(", ") + ".";
      } },
    { q: "Which Thai restaurants in Austin are rated 4.5 or higher?",
      run: function (call) {
        var r = call("filter_restaurant", { tag_conditions: [{ field: "cuisine", value: "thai" }, { field: "city", value: "austin" }],
          numeric_conditions: [{ field: "rating", min_value: 4.5 }] });
        if (!r.total_count) return "No Thai restaurants in Austin are rated 4.5 or higher.";
        return r.results.map(function (x) {
          return "**" + x.name + "** is rated " + x.rating + ", with an average delivery time of " + x.avg_delivery_min + " minutes.";
        }).join("\n");
      } },
    { q: "What has Maya Chen ordered this month?",
      run: function (call) {
        var c = call("filter_customer", { text_query: "Maya Chen", text_match_mode: "all" });
        if (!c.total_count) return "I couldn't find a customer called Maya Chen.";
        var cust = c.results[0];
        var o = call("filter_order", { tag_conditions: [{ field: "customer_id", value: cust.id }],
          numeric_conditions: [{ field: "placed_ts", min_value: SEPT_START, max_value: SEPT_END }] });
        if (!o.total_count) return cust.name + " hasn't ordered anything this month.";
        var names = restaurantNames(call, o.results);
        o.results.sort(function (a, b) { return a.placed_ts - b.placed_ts; });
        return cust.name + " has placed **" + o.total_count + "** orders this month:\n" + o.results.map(function (x) {
          return "- " + fmtDate(x.placed_ts) + ": " + x.items + " from " + names[x.restaurant_id] + ", " + usd2(x.total) + " (" + label(x.status) + ")";
        }).join("\n") + "\n\nHer profile says she's " + label(cust.dietary) + " and her favorite cuisine is " + label(cust.favorite_cuisine) + ".";
      } },
    { q: "Which vegetarian customers have ordered from Green Bowl?",
      run: function (call) {
        var r = call("filter_restaurant", { text_query: "Green Bowl", text_match_mode: "phrase" });
        if (!r.total_count) return "I couldn't find a restaurant called Green Bowl.";
        var rest = r.results[0];
        var s = call("intersect_results", { sets: [
          { entity: "Order", tag_conditions: [{ field: "restaurant_id", value: rest.id }], expand_to: "Order.customer" },
          { entity: "Customer", tag_conditions: [{ field: "dietary", value: "vegetarian" }] }] });
        if (!s.count) return "No vegetarian customers have ordered from " + rest.name + ".";
        var people = s.ids.slice(0, 3).map(function (k) { var c = call("get_customer_by_id", { id: idFromKey(k) }); return "- " + c.name + " (" + city(c.city) + ", " + c.loyalty_points + " loyalty points)"; });
        return "**" + s.count + "** vegetarian customer" + (s.count === 1 ? " has" : "s have") + " ordered from " + rest.name + ":\n" + people.join("\n");
      } },
    { q: "Find orders that include pad thai.",
      run: function (call) {
        var r = call("filter_order", { text_query: "pad thai", text_match_mode: "phrase" });
        if (!r.total_count) return "No orders include pad thai.";
        return "**" + r.total_count + "** orders include pad thai:\n" + r.results.map(function (x) {
          return "- " + x.id + ": " + x.items + ", " + usd2(x.total) + " (" + fmtDate(x.placed_ts) + ")";
        }).join("\n");
      } },
    { q: "Which orders are being prepared or on the way right now?",
      run: function (call) {
        var s = call("union_results", { sets: [
          { entity: "Order", tag_conditions: [{ field: "status", value: "preparing" }] },
          { entity: "Order", tag_conditions: [{ field: "status", value: "on_the_way" }] }] });
        if (!s.count) return "No orders are in progress.";
        var orders = s.ids.slice(0, 5).map(function (k) { return call("get_order_by_id", { id: idFromKey(k) }); });
        var names = restaurantNames(call, orders);
        return "**" + s.count + "** orders are in progress:\n" + orders.map(function (x) {
          return "- " + x.id + ": " + x.items + " from " + names[x.restaurant_id] + " (" + label(x.status) + ")";
        }).join("\n");
      } }
  ];

    function mdLite(s) {
    return s.split("\n").map(function (line) {
      var h = esc(line).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return line.indexOf("- ") === 0 ? "<li>" + h.slice(2) + "</li>" : (h ? "<p>" + h + "</p>" : "");
    }).join("").replace(/(<li>.*?<\/li>)+/g, function (m) { return "<ul>" + m + "</ul>"; });
  }

  /* ------------------------------------------------------------------- UI */

  function init(root) {
    var state = { model: defaultModel(), tools: [], surface: "3f8c2a1e-demo", selectedKey: null, selectedTool: null, busy: false, connected: false };
    state.tools = buildTools(state.model);
    var ENDPOINT = "https://<region>.context-surfaces.redis.io/mcp";

    root.innerHTML = "";
    var tabs = el("div", "rcr-tabs");
    tabs.setAttribute("role", "tablist");
    var TABS = [["keys", "1", "Keys in Redis"], ["model", "2", "Data model to tools"], ["ask", "3", "Ask over MCP"]];
    var panels = {};
    TABS.forEach(function (t, i) {
      var b = el("button", "rcr-tab", '<span class="rcr-n">' + t[1] + "</span>" + esc(t[2]));
      b.type = "button"; b.setAttribute("role", "tab"); b.dataset.tab = t[0];
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () { show(t[0]); });
      tabs.appendChild(b);
      panels[t[0]] = el("div", "rcr-panel");
      panels[t[0]].setAttribute("role", "tabpanel");
      if (i) panels[t[0]].hidden = true;
    });
    root.appendChild(tabs);
    Object.keys(panels).forEach(function (k) { root.appendChild(panels[k]); });

    function show(name) {
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === name ? "true" : "false"); });
      Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== name; });
      if (name === "keys") renderKeys();
      if (name === "model") renderModel();
      if (name === "ask") renderAsk();
    }

    function next(label, target) {
      var b = el("button", "rcr-btn rcr-btn-primary", esc(label));
      b.type = "button";
      b.addEventListener("click", function () { show(target); });
      var w = el("div", "rcr-next"); w.appendChild(b); return w;
    }

    /* ---- step 1: keys ---- */
    function renderKeys() {
      var p = panels.keys; p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "This sample database belongs to a food delivery app. It stores customers, restaurants, and orders as JSON documents. Each business object is one key, and the key name starts with the object type. Select a key to see its document."));
      var grid = el("div", "rcr-split");
      var list = el("div", "rcr-card rcr-keylist");
      var groups = {};
      KEYS.forEach(function (k) { var pre = k.key.split(":")[0]; (groups[pre] = groups[pre] || []).push(k); });
      Object.keys(groups).forEach(function (pre) {
        var g = groups[pre];
        var d = el("details", "rcr-group");
        if (!state.selectedKey && pre === "customer") d.open = true;
        if (state.selectedKey && state.selectedKey.key.indexOf(pre + ":") === 0) d.open = true;
        d.appendChild(el("summary", "", '<span class="rcr-mono">' + esc(pre) + ":*</span><span class=\"rcr-count\">" + g.length + "</span><span class=\"rcr-type rcr-type-" + esc(g[0].type.toLowerCase().replace(/[^a-z]/g, "")) + "\">" + esc(g[0].type) + "</span>"));
        g.forEach(function (k) {
          var b = el("button", "rcr-key" + (state.selectedKey === k ? " is-on" : ""), '<span class="rcr-mono">' + esc(k.key) + "</span>");
          b.type = "button";
          b.addEventListener("click", function () { state.selectedKey = k; renderKeys(); });
          d.appendChild(b);
        });
        list.appendChild(d);
      });
      var view = el("div", "rcr-card rcr-docview");
      var k = state.selectedKey || KEYS[0];
      view.appendChild(el("div", "rcr-cardhead", '<span class="rcr-mono">' + esc(k.key) + '</span><span class="rcr-type">' + esc(k.type) + "</span>"));
      if (k.doc && k.type === "JSON") {
        view.appendChild(el("pre", "rcr-code", jsonHtml(k.doc)));
        view.appendChild(el("p", "rcr-note", "Entity <b>" + esc(k.entity) + "</b>. Key template <code>" + esc(k.entity.toLowerCase()) + ":{id}</code> matches this key with <code>{id}</code> = <code>" + esc(k.doc.id) + "</code>."));
      } else {
        view.appendChild(el("p", "rcr-note", "This key is a " + esc(k.type) + ", not a JSON document. Context Retriever entities are JSON documents, so it isn't part of the data model."));
      }
      grid.appendChild(list); grid.appendChild(view); p.appendChild(grid);
      p.appendChild(next("Next: define the data model", "model"));
    }

    /* ---- step 2: model -> tools ---- */
    function renderModel() {
      var p = panels.model; p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "You describe each entity once: a key template that finds its keys, and the fields an agent can use. Context Retriever turns that description into MCP tools. Change a key template or an index type and watch the tools change."));
      if (!state.entityTab) state.entityTab = state.model[0].name;
      var sub = el("div", "rcr-subtabs");
      sub.setAttribute("role", "tablist");
      state.model.forEach(function (ent) {
        var b = el("button", "rcr-subtab", esc(ent.name) + ' <span class="rcr-faint rcr-mono">' + esc(ent.template) + "</span>");
        b.type = "button"; b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", ent.name === state.entityTab ? "true" : "false");
        b.addEventListener("click", function () { state.entityTab = ent.name; renderModel(); });
        sub.appendChild(b);
      });
      p.appendChild(sub);
      var ent = entityOf(state.model, state.entityTab);
      p.appendChild(entityCard(ent));
      var right = el("div", "rcr-card rcr-tools");
      p.appendChild(right);
      renderTools(right);
      var idx = el("details", "rcr-card rcr-behind");
      idx.appendChild(el("summary", "", "Behind the scenes: the search indexes the service creates"));
      idx.appendChild(el("pre", "rcr-code", esc(indexCommands(state.model, state.surface).join("\n\n") || "No indexed fields, so no index is created.")));
      idx.appendChild(el("p", "rcr-note", "Indexes use the <code>INDEXMISSING</code> option, so the database must run Redis 7.4 or later. The index names are illustrative."));
      p.appendChild(idx);
      p.appendChild(next("Next: ask questions over MCP", "ask"));
    }

    function refreshTools() {
      state.tools = buildTools(state.model);
      state.connected = false;
      var right = panels.model.querySelector(".rcr-tools");
      if (right) { renderTools(right); right.classList.remove("rcr-flash"); void right.offsetWidth; right.classList.add("rcr-flash"); }
      var beh = panels.model.querySelector(".rcr-behind pre");
      if (beh) beh.textContent = indexCommands(state.model, state.surface).join("\n\n") || "No indexed fields, so no index is created.";
    }

    function entityCard(ent) {
      var card = el("div", "rcr-card rcr-entity");
      var head = el("div", "rcr-enthead");
      head.appendChild(el("span", "rcr-entname", esc(ent.name)));
      var tplWrap = el("label", "rcr-tpl", '<span class="rcr-lbl">Key template</span>');
      var inp = el("input", "rcr-input rcr-mono");
      inp.value = ent.template; inp.spellcheck = false; inp.setAttribute("aria-label", ent.name + " key template");
      var match = el("span", "rcr-match");
      function updateMatch() {
        var re = templateRegex(inp.value);
        var n = re ? KEYS.filter(function (k) { return re.test(k.key); }).length : 0;
        match.className = "rcr-match " + (re && n ? "is-ok" : "is-bad");
        match.textContent = !re ? "Missing {id}" : n ? "Matches " + n + " keys" : "Matches no keys";
      }
      inp.addEventListener("input", function () {
        ent.template = inp.value; updateMatch(); refreshTools();
        var on = panels.model.querySelector('.rcr-subtab[aria-selected="true"] .rcr-mono');
        if (on) on.textContent = inp.value;
      });
      updateMatch();
      tplWrap.appendChild(inp); head.appendChild(tplWrap); head.appendChild(match);
      card.appendChild(head);
      var tbl = el("table", "rcr-fields");
      tbl.innerHTML = "<thead><tr><th>Field</th><th>PK</th><th>Type</th><th>Index</th><th>Related</th></tr></thead>";
      var tb = el("tbody");
      ent.fields.forEach(function (f) {
        var tr = el("tr");
        tr.appendChild(el("td", "rcr-mono", esc(f.name)));
        tr.appendChild(el("td", "", f.pk ? '<span class="rcr-pk" title="Primary key">PK</span>' : ""));
        tr.appendChild(el("td", "", esc(f.type)));
        var td = el("td");
        if (f.pk) td.appendChild(el("span", "rcr-faint", "key lookup"));
        else {
          var sel = el("select", "rcr-select");
          sel.setAttribute("aria-label", ent.name + " " + f.name + " index type");
          (f.type === "number" ? ["none", "numeric"] : ["none", "tag", "text"]).forEach(function (o) {
            var op = el("option", "", o); op.value = o; if (o === f.index) op.selected = true; sel.appendChild(op);
          });
          sel.addEventListener("change", function () { f.index = sel.value; refreshTools(); });
          td.appendChild(sel);
        }
        tr.appendChild(td);
        tr.appendChild(el("td", "", f.rel ? '<span class="rcr-rel">' + esc(f.rel) + "</span>" : ""));
        tb.appendChild(tr);
      });
      tbl.appendChild(tb); card.appendChild(tbl);
      return card;
    }

    function renderTools(box) {
      box.innerHTML = "";
      box.appendChild(el("div", "rcr-cardhead", "<span>Generated MCP tools</span><span class=\"rcr-count\">" + state.tools.length + "</span>"));
      var list = el("div", "rcr-toollist");
      if (!state.selectedTool || !state.tools.some(function (t) { return t.name === state.selectedTool; })) state.selectedTool = state.tools[0].name;
      var groups = [["Per entity", state.tools.filter(function (t) { return t.entity; })], ["Across entities", state.tools.filter(function (t) { return !t.entity; })]];
      groups.forEach(function (g) {
        list.appendChild(el("div", "rcr-toolgroup", esc(g[0])));
        g[1].forEach(function (t) {
          var b = el("button", "rcr-tool" + (t.name === state.selectedTool ? " is-on" : "") + (t.entity && t.entity === state.entityTab ? " is-mine" : ""), '<span class="rcr-mono">' + esc(t.name) + "</span>" + (t.entity ? '<span class="rcr-faint">' + esc(t.entity) + "</span>" : ""));
          b.type = "button";
          b.addEventListener("click", function () { state.selectedTool = t.name; renderTools(box); });
          list.appendChild(b);
        });
      });
      var body = el("div", "rcr-toolsbody");
      body.appendChild(list);
      box.appendChild(body);
      var t = state.tools.filter(function (x) { return x.name === state.selectedTool; })[0];
      var det = el("div", "rcr-tooldetail");
      det.appendChild(el("p", "rcr-tooldesc", esc(t.description)));
      det.appendChild(el("pre", "rcr-code rcr-code-sm", jsonHtml(t.inputSchema)));
      body.appendChild(det);
    }

    /* ---- step 3: ask ---- */
    /* Built once, so a replay keeps playing and the conversation survives tab
       switches. On return, reconnect only if the data model changed the tools. */
    function renderAsk() {
      var p = panels.ask;
      if (p.dataset.built) {
        if (!state.connected) handshake(p.querySelector(".rcr-connlog"));
        return;
      }
      p.dataset.built = "1";
      p.appendChild(el("p", "rcr-lede", "An agent connects to the service's MCP endpoint with an agent key, lists the tools, and picks the right ones for each question. The agent never connects to Redis. Pick a question to watch the calls."));
      var conn = el("div", "rcr-card rcr-conn");
      conn.appendChild(el("div", "rcr-connrow", '<span class="rcr-lbl">MCP endpoint</span><code class="rcr-mono">' + esc(ENDPOINT) + '</code><span class="rcr-lbl">Header</span><code class="rcr-mono">X-API-Key: &lt;your-agent-key&gt;</code>'));
      var log = el("div", "rcr-connlog");
      conn.appendChild(log);
      p.appendChild(conn);
      var chips = el("div", "rcr-chips");
      QUESTIONS.forEach(function (q) {
        var b = el("button", "rcr-chip", esc(q.q)); b.type = "button";
        b.addEventListener("click", function () { ask(q); });
        chips.appendChild(b);
      });
      p.appendChild(chips);
      var chat = el("div", "rcr-chat"); chat.setAttribute("aria-live", "polite");
      p.appendChild(chat);
      handshake(log);
    }

    function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); }); }
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function handshake(log) {
      if (state.connected) { log.innerHTML = connectedLine(); return; }
      log.innerHTML = '<span class="rcr-dot is-wait"></span> <span class="rcr-mono">initialize</span> ...';
      wait(450).then(function () {
        log.innerHTML = '<span class="rcr-dot is-ok"></span> <span class="rcr-mono">initialize</span> 200 OK, protocol 2025-06-18 &nbsp; <span class="rcr-dot is-wait"></span> <span class="rcr-mono">tools/list</span> ...';
        return wait(450);
      }).then(function () { state.connected = true; log.innerHTML = connectedLine(); });
    }
    function connectedLine() {
      return '<span class="rcr-dot is-ok"></span> Connected. <span class="rcr-mono">tools/list</span> returned <b>' + state.tools.length + "</b> tools: " +
        state.tools.map(function (t) { return '<code class="rcr-mono">' + esc(t.name) + "</code>"; }).join(" ");
    }

    function curlFor(name, args, id) {
      var body = JSON.stringify({ jsonrpc: "2.0", id: id, method: "tools/call", params: { name: name, arguments: args } });
      return "curl -X POST " + ENDPOINT + " \\\n  -H \"X-API-Key: <your-agent-key>\" \\\n  -H \"Content-Type: application/json\" \\\n  -H \"Accept: application/json, text/event-stream\" \\\n  -d '" + body + "'";
    }

    function ask(q) {
      if (state.busy) return;
      state.busy = true;
      var chips = panels.ask.querySelectorAll(".rcr-chip");
      Array.prototype.forEach.call(chips, function (c) { c.disabled = true; });
      var chat = panels.ask.querySelector(".rcr-chat");
      chat.innerHTML = "";
      chat.appendChild(el("div", "rcr-msg rcr-user", esc(q.q)));
      var thinking = el("div", "rcr-msg rcr-agent rcr-thinking", "<span></span><span></span><span></span>");
      chat.appendChild(thinking);

      /* Run the script synchronously to get the calls, then replay with timing. */
      var calls = [], answer, rpcId = 3;
      try {
        answer = q.run(function (name, args) {
          var entry = { name: name, args: args, id: rpcId++ };
          calls.push(entry);
          try { entry.result = execute(state.model, state.tools, state.surface, name, args); }
          catch (e) { if (e instanceof McpError) { entry.error = e.message; throw e; } throw e; }
          return entry.result;
        });
      } catch (e) {
        if (!(e instanceof McpError)) throw e;
        var last = calls[calls.length - 1];
        answer = "I couldn't answer that. The server rejected my call to `" + last.name + "`: the data model doesn't index the field I needed. Go back to step 2, index it, and ask again.";
      }

      var chain = wait(700);
      calls.forEach(function (c) {
        chain = chain.then(function () {
          if (!thinking.parentNode) chat.appendChild(thinking);
          chat.insertBefore(callCard(c), thinking);
          return wait(650);
        });
      });
      chain.then(function () {
        thinking.remove();
        chat.appendChild(el("div", "rcr-msg rcr-agent", mdLite(answer).replace(/`([^`]+)`/g, "<code>$1</code>")));
        state.busy = false;
        Array.prototype.forEach.call(chips, function (c) { c.disabled = false; });
      });
    }

    function callCard(c) {
      var d = el("details", "rcr-call" + (c.error ? " is-err" : ""));
      var status = c.error ? '<span class="rcr-dot is-bad"></span> error' : '<span class="rcr-dot is-ok"></span> ok';
      d.appendChild(el("summary", "", '<span class="rcr-lbl">tools/call</span> <span class="rcr-mono rcr-callname">' + esc(c.name) + '</span> <span class="rcr-faint rcr-mono rcr-callargs">' + esc(JSON.stringify(c.args)) + "</span><span class=\"rcr-status\">" + status + "</span>"));
      var body = el("div", "rcr-callbody");
      var req = { jsonrpc: "2.0", id: c.id, method: "tools/call", params: { name: c.name, arguments: c.args } };
      var res = c.error ? { jsonrpc: "2.0", id: c.id, error: { code: -32602, message: c.error } }
        : { jsonrpc: "2.0", id: c.id, result: { content: [{ type: "text", text: JSON.stringify(c.result) }] } };
      body.appendChild(el("div", "rcr-lbl", "Request"));
      body.appendChild(el("pre", "rcr-code rcr-code-sm", jsonHtml(req)));
      body.appendChild(el("div", "rcr-lbl", c.error ? "Response" : "Response (the tool result, parsed from content[0].text)"));
      body.appendChild(el("pre", "rcr-code rcr-code-sm", jsonHtml(c.error ? res : c.result)));
      var cd = el("details", "rcr-curl");
      cd.appendChild(el("summary", "", "Run this call yourself with curl"));
      cd.appendChild(el("pre", "rcr-code rcr-code-sm", esc(curlFor(c.name, c.args, c.id))));
      body.appendChild(cd);
      d.appendChild(body);
      return d;
    }

    renderKeys();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rcr[data-rcr]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.ContextRetrieverDemo = { buildTools: buildTools, execute: execute, defaultModel: defaultModel, QUESTIONS: QUESTIONS, McpError: McpError };
})();

/* =========================================================================
   Redis Data Integration (RDI) scripted demo
   Dependency-free. Everything runs in the browser against a scripted
   PostgreSQL database; no RDI pipeline or database is called.

   Step 1 deploys a pipeline for three PostgreSQL tables and plays the
   initial sync into Redis, with default keys. Step 2 runs SQL statements the
   reader picks and follows each change through the pipeline. Step 3 deploys
   a job file for one table, then shows what changes when a row is updated,
   when the pipeline is reset, and when the target is flushed.

   What follows the docs (content/integrate/redis-data-integration and
   content/operate/rc/rdi): the default key pattern
   tablename:primarykeyname:primarykeyvalue, hashes storing every value as a
   string and JSON keeping numbers, opcodes r/c/u/d, the stream name
   data:{rdi}:<source>.<schema>.<table>, the config.yaml and job file
   syntax, the redis-di status layout and its statistics columns, that a job
   only affects newly captured data until a reset, that a reset doesn't
   delete records from the target, and that flushing needs a stopped
   pipeline. Modelled rather than observed: the data and the timings.

   Customers, restaurants, and orders are the food delivery sample data
   from context-retriever-demo.js, as PostgreSQL rows. Keep them in sync.

   Base styles come from context-retriever-demo.css; rdi-demo.css adds the
   pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";
  if (window.RdiDemo) return;   // loaded twice: the first copy already booted every widget

  /* ------------------------------------------------------------- constants */

  var SOURCE = "postgresql", DB = "fooddelivery", SCHEMA = "public", PIPELINE = "default";
  var T0 = Date.UTC(2026, 8, 30, 9, 0, 0);   // the pipeline is deployed at 09:00 UTC

  function ts(y, m, d, h) { return Math.floor(Date.UTC(y, m - 1, d, h == null ? 12 : h) / 1000); }
  function rowsOf(columns, list) {
    return list.map(function (r) { var o = {}; columns.forEach(function (c, i) { o[c[0]] = r[i]; }); return o; });
  }
  function email(name) { return name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com"; }

  var CUSTOMER_COLUMNS = [["id", "text"], ["name", "text"], ["email", "text"], ["city", "text"], ["dietary", "text"],
    ["favorite_cuisine", "text"], ["loyalty_points", "integer"], ["joined_ts", "bigint"]];
  var RESTAURANT_COLUMNS = [["id", "text"], ["name", "text"], ["cuisine", "text"], ["city", "text"],
    ["rating", "double precision"], ["price_level", "integer"], ["avg_delivery_min", "integer"]];
  var ORDER_COLUMNS = [["id", "text"], ["customer_id", "text"], ["restaurant_id", "text"], ["status", "text"],
    ["total", "double precision"], ["placed_ts", "bigint"], ["items", "text"]];

  var TABLES = [
    { name: "customers", columns: CUSTOMER_COLUMNS, rows: rowsOf(CUSTOMER_COLUMNS, [
      ["u101", "Maya Chen", "austin", "vegetarian", "thai", 1240, ts(2024, 5, 3)],
      ["u102", "Liam Ortiz", "austin", "none", "bbq", 860, ts(2025, 1, 19)],
      ["u103", "Priya Nair", "seattle", "vegan", "indian", 2310, ts(2023, 9, 12)],
      ["u104", "Noah Williams", "denver", "none", "pizza", 410, ts(2025, 11, 2)],
      ["u105", "Sofia Rossi", "seattle", "vegetarian", "italian", 1780, ts(2024, 2, 27)],
      ["u106", "Ethan Brooks", "denver", "gluten_free", "sushi", 950, ts(2024, 8, 14)],
      ["u107", "Aisha Khan", "austin", "halal", "mediterranean", 1530, ts(2023, 12, 6)],
      ["u108", "Lucas Meyer", "denver", "none", "burgers", 120, ts(2026, 7, 21)]
    ].map(function (r) { return [r[0], r[1], email(r[1])].concat(r.slice(2)); })) },
    { name: "restaurants", columns: RESTAURANT_COLUMNS, rows: rowsOf(RESTAURANT_COLUMNS, [
      ["r201", "Bangkok Street Kitchen", "thai", "austin", 4.7, 2, 30],
      ["r202", "Smokehouse 512", "bbq", "austin", 4.4, 3, 40],
      ["r203", "Green Bowl", "vegan", "seattle", 4.8, 2, 25],
      ["r204", "Sakura Sushi Bar", "sushi", "denver", 4.6, 3, 35],
      ["r205", "Nonna's Trattoria", "italian", "seattle", 4.5, 3, 45],
      ["r206", "Slice Society", "pizza", "denver", 4.2, 1, 30],
      ["r207", "Olive & Za'atar", "mediterranean", "austin", 4.6, 2, 30],
      ["r208", "Spice Route", "indian", "seattle", 4.3, 2, 40],
      ["r209", "Lotus Thai", "thai", "austin", 4.1, 1, 25]
    ]) },
    { name: "orders", columns: ORDER_COLUMNS, rows: rowsOf(ORDER_COLUMNS, [
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
    ]) }
  ];
  var NUMERIC = { integer: true, bigint: true, "double precision": true };

  /* ---- step 2: statements the reader runs against PostgreSQL ---- */

  var REORDER = { id: "o3021", customer_id: "u101", restaurant_id: "r209", status: "preparing", total: 22.75,
    placed_ts: ts(2026, 9, 30, 18), items: "Green curry without fish sauce, jasmine rice" };
  function sqlValue(v) { return typeof v === "number" ? String(v) : "'" + String(v).replace(/'/g, "''") + "'"; }
  var STATEMENTS = [
    { key: "deliver", table: "orders", op: "u", id: "o3003", set: { status: "delivered" }, what: "Maya's green curry arrives." },
    { key: "reorder", table: "orders", op: "c", id: REORDER.id, row: REORDER, what: "Maya orders the curry again." },
    { key: "busy", table: "restaurants", op: "u", id: "r201", set: { avg_delivery_min: 45 }, what: "Bangkok Street Kitchen gets busy." },
    { key: "purge", table: "orders", op: "d", id: "o3005", what: "The app deletes a cancelled order." }
  ];
  /* ---- step 3: the customers job, then applying it to existing data ---- */
  var POINTS = { key: "points", table: "customers", op: "u", id: "u101", set: { loyalty_points: 1290 }, what: "Maya earns 50 loyalty points." };
  /* In this order: each step answers the question the one before leaves open. */
  var ACTIONS = [
    { key: "points", label: "Update a customer", question: "Does the job change keys that already exist?",
      detail: "UPDATE customers SET loyalty_points = 1290 WHERE id = 'u101';" },
    { key: "reset", label: "Reset the pipeline", question: "Does a new snapshot through the job clean up the old keys?",
      detail: "RDI takes a new snapshot of every table." },
    { key: "flush", label: "Flush the target and reset", question: "How do you end up with only the new keys?",
      detail: "Stop the pipeline, delete everything in the target database, then reset." }
  ];
  function sqlOf(s) {
    if (s.op === "c") return "INSERT INTO " + s.table + " VALUES (" + tableOf(s.table).columns.map(function (c) { return sqlValue(s.row[c[0]]); }).join(", ") + ");";
    if (s.op === "d") return "DELETE FROM " + s.table + " WHERE id = " + sqlValue(s.id) + ";";
    return "UPDATE " + s.table + " SET " + Object.keys(s.set).map(function (k) { return k + " = " + sqlValue(s.set[k]); }).join(", ") +
      " WHERE id = " + sqlValue(s.id) + ";";
  }
  /* RDI's opcodes use Debezium's operation names: c is create, which is
     what an INSERT produces. The letters appear only where the demo shows
     RDI's own data; everywhere else the operation is spelled out. */
  var OPCODES = { r: "read, for a snapshot row", c: "create, for an INSERT", u: "update", d: "delete" };
  var OPERATIONS = { r: "Snapshot", c: "Insert", u: "Update", d: "Delete" };
  var STATUS = { deploying: "Deploying", initial: "Initial sync", streaming: "Streaming", updating: "Updating",
    resetting: "Resetting", stopped: "Stopped" };

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
  function byKey(list, key) { return list.filter(function (x) { return x.key === key; })[0]; }
  function tableOf(name) { return TABLES.filter(function (t) { return t.name === name; })[0]; }
  function clone(o) { var c = {}; Object.keys(o).forEach(function (k) { c[k] = o[k]; }); return c; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function hhmmss(ms) { return new Date(ms).toISOString().slice(11, 19); }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 19) + "Z"; }
  function code(s) { return "<code>" + esc(s) + "</code>"; }
  function streamName(table) { return "data:{rdi}:" + SOURCE + "." + SCHEMA + "." + table; }
  function qualified(table) { return SOURCE + "." + SCHEMA + "." + table; }

  /* Pretty JSON with light syntax colouring (same as the other Iris demos). */
  function jsonHtml(v) {
    var s = JSON.stringify(v, null, 2);
    return esc(s).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
      function (m, str, colon, lit, num) {
        if (str) return colon ? '<span class="rcr-jk">' + str + "</span>" + colon : '<span class="rcr-js">' + str + "</span>";
        if (lit) return '<span class="rcr-jl">' + lit + "</span>";
        return '<span class="rcr-jn">' + num + "</span>";
      });
  }

  /* ------------------------------------------------------------ the model */

  /* With no job file, the key is tablename:primarykeyname:primarykeyvalue.
     The customers job writes customer:{id} instead. */
  function keyFor(table, id, job) { return job && table === "customers" ? "customer:" + id : table + ":id:" + id; }
  /* Hashes store every value as a string; JSON keeps numbers as numbers. */
  function rowValue(table, row, type, dropEmail) {   // dropEmail: the customers job's remove_field step
    var v = {};
    tableOf(table).columns.forEach(function (c) {
      if (dropEmail && c[0] === "email") return;
      v[c[0]] = type === "hash" ? String(row[c[0]]) : row[c[0]];
    });
    return v;
  }

  /* Everything the pipeline has done, as a list of records, from the
     reader's choices so far. Rendering replays the first n of them, which is
     also how the animations step through. */
  function records(st) {
    var out = [], ids = {}, clock = T0;
    TABLES.forEach(function (t) { ids[t.name] = t.rows.map(function (r) { return r.id; }); });
    function push(r, gap) { clock += gap; r.at = clock; out.push(r); }
    function snapshot() {
      push({ k: "status", v: "initial" }, 1500);
      TABLES.forEach(function (t) { ids[t.name].forEach(function (id) { push({ k: "snap", table: t.name, id: id }, 90); }); });
      push({ k: "status", v: "streaming" }, 400);
    }
    function run(s) {
      push({ k: "commit", stmt: s }, 0);
      push({ k: "capture", stmt: s }, 180);
      push({ k: "apply", stmt: s }, 240);
      push({ k: "settled", stmt: s }, 0);
      if (s.op === "c") ids[s.table].push(s.id);
      if (s.op === "d") ids[s.table] = ids[s.table].filter(function (id) { return id !== s.id; });
    }
    if (!st.deployed) return out;
    push({ k: "status", v: "deploying" }, 0);
    snapshot();
    st.ran.forEach(function (key, i) { clock = T0 + (12 + 3 * i) * 60000; run(byKey(STATEMENTS, key)); });
    if (st.jobDeployed) {
      clock = T0 + 30 * 60000;
      push({ k: "status", v: "updating" }, 0);
      push({ k: "job" }, 2000);
      push({ k: "status", v: "streaming" }, 1500);
    }
    st.actions.forEach(function (key, i) {
      clock = T0 + (35 + 4 * i) * 60000;
      if (key === "points") { run(POINTS); return; }
      if (key === "flush") { push({ k: "status", v: "stopped" }, 0); push({ k: "flush" }, 3000); }
      push({ k: "status", v: "resetting" }, key === "flush" ? 2000 : 0);
      push({ k: "reset" }, 1000);
      snapshot();
    });
    return out;
  }
  function zeroStats() { return { incoming: 0, pending: 0, inserted: 0, updated: 0, deleted: 0, filtered: 0, rejected: 0, last: null }; }
  /* Replay the first n records: the source tables, the Redis target, the
     counters, and the pipeline status at that point. */
  function apply(recs, n, opts) {
    var src = {}, redis = {}, order = [], stats = {}, gone = {}, status = null, job = false, last = n ? recs[n - 1] : null, wrote = null;
    var changes = {};   // per statement: the key it writes, the old values it replaces, and the row as captured
    TABLES.forEach(function (t) { src[t.name] = t.rows.map(clone); stats[t.name] = zeroStats(); });
    function rowOf(table, id) { return src[table].filter(function (r) { return r.id === id; })[0]; }
    function count(table, field, at) { var s = stats[table]; s.incoming++; s[field]++; s.last = at; }
    function write(table, id, op, at) {
      var key = keyFor(table, id, job), prev = redis[key] ? redis[key].value : null;
      if (!redis[key]) order.push(key);
      redis[key] = { key: key, table: table, id: id, type: opts.structure, op: op, at: at, prev: prev,
        value: rowValue(table, rowOf(table, id), opts.structure, job && table === "customers") };
      wrote = key;
    }
    for (var i = 0; i < n; i++) {
      var r = recs[i], s = r.stmt;
      if (r.k === "status") status = r.v;
      else if (r.k === "reset") TABLES.forEach(function (t) { stats[t.name] = zeroStats(); });
      else if (r.k === "job") job = true;
      else if (r.k === "flush") { redis = {}; order = []; }
      else if (r.k === "snap") { write(r.table, r.id, "r", r.at); count(r.table, "inserted", r.at); }
      else if (r.k === "commit") {
        var ch = changes[s.key] = { key: keyFor(s.table, s.id, job), job: job, before: {}, after: null };
        ch.existed = !!redis[ch.key];   // false when a job's new key pattern means this is the key's first write
        if (s.op === "u") Object.keys(s.set).forEach(function (k) { ch.before[k] = rowOf(s.table, s.id)[k]; });
        if (s.op === "c") src[s.table].push(clone(s.row));
        else if (s.op === "d") { gone[s.table + ":" + s.id] = rowOf(s.table, s.id); src[s.table] = src[s.table].filter(function (x) { return x.id !== s.id; }); }
        else { var row = rowOf(s.table, s.id); Object.keys(s.set).forEach(function (k) { row[k] = s.set[k]; }); }
        if (s.op !== "d") ch.after = clone(rowOf(s.table, s.id));
      } else if (r.k === "apply") {
        if (s.op === "d") {
          var dk = keyFor(s.table, s.id, job);
          delete redis[dk];
          order = order.filter(function (k) { return k !== dk; });
          count(s.table, "deleted", r.at);
        } else {
          write(s.table, s.id, s.op, r.at);
          count(s.table, s.op === "c" ? "inserted" : "updated", r.at);
        }
      }
    }
    var keys = order.map(function (k) { return redis[k]; });
    keys.forEach(function (e) { e.leftover = job && e.table === "customers" && e.key.indexOf("customers:id:") === 0; });
    return { src: src, redis: redis, keys: keys, stats: stats, status: status, job: job, last: last, wrote: wrote, gone: gone, changes: changes };
  }
  /* The latest statement, and how far through the pipeline it has got. */
  function latestStatement(recs, n) {
    for (var i = n - 1; i >= 0; i--) {
      var r = recs[i];
      if (r.stmt) return { stmt: r.stmt, stage: r.k === "commit" ? 1 : r.k === "capture" ? 2 : 3, settled: r.k === "settled" };
      if (r.k !== "status") return null;
    }
    return null;
  }

  /* ---- configuration and status, as RDI shows them ---- */

  function configYaml(structure) {
    return [
      "sources:",
      "  " + SOURCE + ":",
      "    type: cdc",
      "    logging:",
      "      level: info",
      "    connection:",
      "      type: postgresql",
      "      host: <POSTGRESQL_DB_HOST>",
      "      port: 5432",
      "      database: " + DB,
      "      user: ${POSTGRESQL_DB_USERNAME}",
      "      password: ${POSTGRESQL_DB_PASSWORD}",
      "    schemas:",
      "      - " + SCHEMA,
      "    tables:"
    ].concat(TABLES.map(function (t) { return "      " + SCHEMA + "." + t.name + ": {}"; })).concat([
      "targets:",
      "  target:",
      "    connection:",
      "      type: redis",
      "      host: <TARGET_DB_HOST>",
      "      port: 6379",
      "      password: ${TARGET_DB_PASSWORD}",
      "processors:",
      "  target_data_type: " + structure
    ]).join("\n");
  }
  function jobYaml(structure) {
    return ["name: customers", "source:", "  schema: " + SCHEMA, "  table: customers",
      "transform:", "  - uses: remove_field", "    with:", "      fields:", "        - field: email",
      "output:", "  - uses: redis.write", "    with:", "      connection: target", "      data_type: " + structure,
      "      key:", "        expression: concat(['customer:', id])", "        language: jmespath"].join("\n");
  }
  function pad(s, n) { s = String(s); while (s.length < n) s += " "; return s; }
  function tableText(head, rows) {
    var w = head.map(function (h, i) { return Math.max(h.length, Math.max.apply(null, rows.map(function (r) { return String(r[i]).length; }).concat([0]))); });
    function line(r) { return "  " + r.map(function (c, i) { return pad(c, w[i]); }).join("  ").replace(/\s+$/, ""); }
    return [line(head), line(head.map(function (h) { return h.replace(/./g, "-"); }))].concat(rows.map(line)).join("\n");
  }
  /* The same sections and columns as `redis-di status` in the CLI reference. */
  function statusText(S) {
    var mode = S.status === "streaming" ? "streaming" : S.status === "initial" ? "initial-sync" : "-";
    var out = ["Name:     " + PIPELINE, "Active:   yes", "Status:   " + (S.status === "stopped" ? "stopped" : "started"), "Current:  yes", "",
      "Sources:", tableText(["Name", "Type", "Db Type", "Connection", "Sync Mode", "Connected"],
        [[SOURCE, "cdc", "postgresql", "<postgresql-host>:5432", mode, "yes"]]), "",
      "Targets:", tableText(["Name", "Db Type", "Connection", "Connected"], [["target", "redis", "<redis-target-host>:12000", "yes"]]), ""];
    if (S.job) {
      out.push("Jobs:", tableText(["Name", "Server Name", "Db / Schema", "Table", "Transformations", "Outputs", "Connections"],
        [["customers", SOURCE, SCHEMA, "customers", "1", "1", "target"]]), "");
    }
    out.push("Statistics:", tableText(["Name", "Incoming", "Pending", "Inserted", "Updated", "Deleted", "Filtered", "Rejected", "Last Arrival"],
      TABLES.map(function (t) { var s = S.stats[t.name];
        return [qualified(t.name), s.incoming, s.pending, s.inserted, s.updated, s.deleted, s.filtered, s.rejected, s.last ? iso(s.last) : "-"]; })));
    return out.join("\n");
  }

  /* ----------------------------------------------------------------- notes */

  function structureNote(structure) {
    return structure === "json" ?
      "JSON keeps numbers as numbers, so a rating of 4.7 stays 4.7. Context Retriever reads JSON documents, so choose JSON if your agents use it." :
      "Hashes store every value as a string, so a rating of 4.7 is stored as " + code('"4.7"') + ". Context Retriever reads only JSON documents.";
  }
  function syncNotes(st, S, done) {
    if (!st.deployed) return ["RDI reads the tables you select and writes each row to Redis under its own key. Choose the default data structure, then deploy the pipeline.",
      structureNote(st.structure)];
    if (!done && S.status === "deploying") return ["RDI validates the configuration, then starts the collector and the stream processor."];
    if (!done) return ["Initial sync: the collector reads a snapshot of every selected table, and the stream processor writes each row to Redis. " +
      "Snapshot records have the opcode " + code("r") + "."];
    var rows = TABLES.reduce(function (n, t) { return n + t.rows.length; }, 0);
    return ["Initial sync is done: " + rows + " rows became " + rows + " keys. With no job file, each key is the table name, the primary key column, " +
      "and its value, such as " + code("restaurants:id:r201") + ".",
      "The pipeline is now streaming. The collector captures every change committed to the selected tables, and RDI applies it to Redis, usually within a few seconds."];
  }
  /* The three steps of one change, as the Changes card shows them. */
  function fieldValue(v, structure) { return structure === "hash" ? '"' + String(v) + '"' : JSON.stringify(v); }
  function changeSteps(s, ch, structure) {
    var key = code(ch.key), diff = s.op === "u" ? Object.keys(s.set).map(function (k) { return { field: k, from: ch.before[k], to: s.set[k] }; }) : [];
    var first = s.op === "u" && !ch.existed;   // an update that lands on a key the job's pattern creates
    return [
      { stage: "PostgreSQL", title: "PostgreSQL commits the change.", sql: sqlOf(s),
        diff: diff.map(function (d) { return { field: d.field, from: String(d.from), to: String(d.to) }; }),
        text: s.op === "c" ? "A new row, " + code(s.id) + ", in " + code(s.table) + "." : s.op === "d" ? "Row " + code(s.id) + " is gone from " + code(s.table) + "." : "" },
      { stage: "Collector", title: "The collector captures it.", diff: [],
        text: "It reads the change through PostgreSQL logical replication and adds it to the RDI stream " + code(streamName(s.table)) +
          " with the opcode " + code(s.op) + " (" + OPCODES[s.op] + ").",
        record: { opcode: s.op, db: DB, schema: SCHEMA, table: s.table, key: { id: s.id }, after: ch.after },
        note: ch.job && s.table === "customers" ? "The captured row still has " + code("email") + ": the job's " + code("remove_field") +
          " step drops it before RDI writes the key." : "" },
      { stage: "Stream processor", title: "The stream processor writes it to Redis.",
        text: first ? "It writes a new key, " + key + ", because the job changed the key pattern and removes " + code("email") + ". The old key " +
            code(keyFor(s.table, s.id, false)) + " isn't touched." :
          (s.op === "c" ? "It writes a new key, " + key + "." : s.op === "d" ? "It deletes the key " + key + "." : "It writes the row's new values to " + key + ".") +
          (ch.job && s.table === "customers" ? " The job sets the key pattern and removes " + code("email") + "." : ""),
        diff: first ? [] : diff.map(function (d) { return { field: d.field, from: fieldValue(d.from, structure), to: fieldValue(d.to, structure) }; }) }
    ];
  }
  function cdcNotes(st, L, done) {
    if (!L) return ["The pipeline is streaming. Run a statement against PostgreSQL and follow it through the three steps in the Changes card. " +
      "The app and its agents read only from Redis."];
    if (!done) return ["The highlighted step in the Changes card matches the highlighted box at the top. A change usually reaches Redis within a few seconds."];
    var s = L.stmt, notes = [s.op === "c" ? "A new row is a new key." : s.op === "d" ? "Deleting the row deletes its key: it's gone from Redis." :
      "Only " + Object.keys(s.set).map(code).join(" and ") + " changed in PostgreSQL, so only that changed in Redis."];
    if (st.ran.length === STATEMENTS.length) notes.push("The counters in the pipeline card show what RDI applied to each table: " +
      "inserts (snapshot reads count here too), updates, and deletes.");
    return notes;
  }
  function jobNotes(st, S, done, L) {
    var left = S.keys.filter(function (e) { return e.leftover; }).length;
    if (!st.jobDeployed) return ["With no job file, every table gets default keys. A job file customizes one table. This one gives customers the key " +
      "pattern " + code("customer:{id}") + ", the key template the Context Retriever demo reads." +
      " It also removes the email column, so email addresses never reach Redis."];
    var lastAction = st.actions[st.actions.length - 1];
    if (!done) {
      if (L && L.stmt === POINTS) return ["The update goes through the same three steps as in step 2, but now the stream processor applies the job."];
      if (S.status === "updating") return ["RDI validates the job and updates the stream processor."];
      if (S.status === "stopped") return ["Flushing needs a stopped pipeline. It deletes everything in the target database, including data written outside RDI."];
      return ["Reset: RDI clears its internal state and takes a new snapshot of every table, through the current job."];
    }
    if (!lastAction) return ["The job is deployed, but all 8 customer keys are unchanged. A job only affects data captured after you deploy it, unless you reset the pipeline."];
    var notes, old = S.redis["customers:id:u101"];
    if (lastAction === "points") {
      notes = ["The update went through the job, so RDI wrote " + code("customer:u101") + "." + (old ? " The old key " + code("customers:id:u101") +
        " still has " + old.value.loyalty_points + " points, and nothing updates it anymore." : "")];
    } else if (lastAction === "reset") {
      notes = ["The reset took a new snapshot through the job, so every customer has a " + code("customer:{id}") + " key. " + (left ?
        "A reset doesn't delete records from the target, so the " + left + " old " + code("customers:id:") + (left === 1 ? " key is" : " keys are") +
          " still there, out of date and with email addresses." :
        "No old " + code("customers:id:") + " keys are left, because the target was flushed earlier.")];
    } else {
      notes = ["The pipeline was stopped, the target flushed, and the reset reloaded every table, so only the new customer keys are left. " +
        "Flushing deletes everything in the target database, including data written outside RDI."];
    }
    if (lastAction === "flush" || st.actions.length === ACTIONS.length) {
      notes.push("Give restaurants and orders a job too, with keys like " + code("restaurant:{id}") + ", and " + (st.structure === "json" ?
        "the documents match the keys the Context Retriever demo reads." : "with JSON as the data structure, the documents match what the Context Retriever demo reads."));
    }
    return notes;
  }

  /* ------------------------------------------------------------------ view */

  function init(root) {
    var st = { tab: "sync", structure: "json", deployed: false, ran: [], jobDeployed: false, actions: [],
      srcTab: "customers", sel: null, open: {}, anim: 0, busy: false, view: null };
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); }); }
    function opts() { return { structure: st.structure }; }

    root.innerHTML = "";
    var tabs = el("div", "rcr-tabs");
    tabs.setAttribute("role", "tablist");
    var TABS = [["sync", "1", "Initial sync"], ["cdc", "2", "Change data capture"], ["jobs", "3", "Job files"]];
    var panels = {};
    TABS.forEach(function (t, i) {
      var b = el("button", "rcr-tab", '<span class="rcr-n">' + t[1] + "</span>" + esc(t[2]));
      b.type = "button"; b.setAttribute("role", "tab"); b.dataset.tab = t[0];
      b.setAttribute("aria-selected", i === 0 ? "true" : "false");
      b.addEventListener("click", function () { show(t[0]); });
      tabs.appendChild(b);
      panels[t[0]] = el("div", "rcr-panel");
      panels[t[0]].setAttribute("role", "tabpanel");
      panels[t[0]].setAttribute("aria-live", "polite");
      if (i) panels[t[0]].hidden = true;
    });
    root.appendChild(tabs);
    Object.keys(panels).forEach(function (k) { root.appendChild(panels[k]); });

    /* Animations replay records one at a time; the last step renders the
       final state. Anything that changes the story bumps st.anim, so a
       replay in flight stops and the panel shows the final state instead. */
    function cancel() { st.anim++; st.busy = false; st.view = null; }
    function play(steps) {
      var id = ++st.anim;
      st.busy = true;
      syncTabs();
      var chain = Promise.resolve();
      steps.forEach(function (s, i) {
        chain = chain.then(function () { return wait(s[0]); }).then(function () {
          if (id !== st.anim) return;
          if (i === steps.length - 1) st.busy = false;
          s[1]();
        });
      });
    }
    var GAP = { status: 700, snap: 70, commit: 0, capture: 1300, apply: 1300, settled: 1000, job: 1100, flush: 900, reset: 700 };
    /* Step from `from` records to all of them, following each record's
       affected key and source table. `end.land` selects a key when the
       replay finishes. `end.collapsed` selects nothing, so every key group
       stays closed, as after the first deploy. */
    function replay(from, end) {
      end = end || {};
      var R = records(st), steps = [];
      for (var n = from + 1; n <= R.length; n++) {
        (function (n) {
          var r = R[n - 1], gap = GAP[r.k];
          if (r.k === "snap" && (n - from) % 3 && n !== R.length) return;   // snapshots draw three rows at a time
          /* The first frame draws at once, so a click shows a response straight away. */
          steps.push([steps.length ? gap * (r.k === "snap" ? 3 : 1) : 0, function () {
            if (r.stmt) st.srcTab = r.stmt.table;
            var S = apply(R, n, opts());
            if (r.k === "apply" && r.stmt.op === "d") st.sel = keyFor(r.stmt.table, r.stmt.id, S.job);
            else if (r.k === "apply" || (r.k === "snap" && !end.collapsed)) st.sel = S.wrote;
            if (n === R.length && end.land) st.sel = end.land;   // end on the key the notes talk about
            if (st.sel && (r.k === "apply" || r.k === "snap" || n === R.length)) delete st.open["g:" + prefixOf(st.sel)];
            draw(n === R.length ? null : { n: n });
          }]);
        })(n);
      }
      play(steps);
    }
    function draw(view) { st.view = view; renderCurrent(); }

    /* Steps unlock in order. */
    function lockReason(name) {
      var synced = st.deployed && !(st.busy && st.tab === "sync");
      if (name === "cdc" && !synced) return "Deploy the pipeline first.";
      if (name === "jobs" && (!synced || st.ran.length < STATEMENTS.length || (st.busy && st.tab === "cdc"))) return "Run all four statements first.";
      return null;
    }
    function syncTabs() {
      root.setAttribute("data-busy", st.busy ? "true" : "false");
      Array.prototype.forEach.call(tabs.children, function (b) {
        var why = lockReason(b.dataset.tab);
        b.classList.toggle("is-locked", !!why);
        if (why) { b.setAttribute("aria-disabled", "true"); b.title = why; }
        else { b.removeAttribute("aria-disabled"); b.removeAttribute("title"); }
      });
    }
    function show(name) {
      if (lockReason(name)) return;
      cancel();
      st.tab = name;
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === name ? "true" : "false"); });
      Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== name; });
      renderCurrent();
    }
    /* The Next and Restart buttons sit at the bottom of a long step, and the
       step they open starts at the top. Scroll the tabs to just under the
       site's sticky header, and move keyboard focus to the new tab so it isn't
       lost with the replaced button. */
    function advance(name) {
      show(name);
      var header = document.querySelector("header");
      var under = header && /sticky|fixed/.test(getComputedStyle(header).position) ? header.getBoundingClientRect().bottom : 0;
      window.scrollTo({ top: window.pageYOffset + tabs.getBoundingClientRect().top - under - 16, behavior: reduced ? "instant" : "smooth" });
      tabs.querySelector('[data-tab="' + name + '"]').focus({ preventScroll: true });
    }
    function renderCurrent() {
      var R = records(st), n = st.view ? st.view.n : R.length, S = apply(R, n, opts()), done = !st.view;
      if (st.sel && !S.redis[st.sel] && done && !(S.last && S.last.stmt && S.last.stmt.op === "d")) st.sel = null;
      var ctx = { R: R, n: n, S: S, done: done, L: latestStatement(R, n) };
      if (st.tab === "sync") renderSync(ctx);
      else if (st.tab === "cdc") renderCdc(ctx);
      else renderJobs(ctx);
      reveal(panels[st.tab]);
      syncTabs();
    }
    /* The key list and the source rows scroll inside their cards, so bring
       the selected key, and the row and cell the latest statement changed,
       into view without moving the page. */
    function reveal(p) {
      Array.prototype.forEach.call(p.querySelectorAll(".rdi-keylist"), function (list) {
        var b = list.querySelector(".rcr-key.is-on");
        if (b) into(list, b, null);
      });
      Array.prototype.forEach.call(p.querySelectorAll(".rdi-rowswrap"), function (w) {
        var r = w.querySelector("tr.is-changed, tr.is-new, tr.is-deleted");
        if (r) into(w, r, w.querySelector("td.is-set"));
      });
    }
    function into(box, item, cell) {
      var b = box.getBoundingClientRect(), e = item.getBoundingClientRect(), head = box.querySelector("thead");
      var top = head ? head.offsetHeight : 0;
      if (e.top < b.top + top || e.bottom > b.bottom) box.scrollTop += e.top - b.top - top - (box.clientHeight - top - e.height) / 2;
      if (cell) {
        var c = cell.getBoundingClientRect();
        if (c.left < b.left || c.right > b.right) box.scrollLeft += c.left - b.left - (box.clientWidth - c.width) / 2;
      }
    }
    function restart() {
      cancel();
      st.structure = "json"; st.deployed = false; st.ran = []; st.jobDeployed = false; st.actions = [];
      st.srcTab = "customers"; st.sel = null; st.open = {};
      advance("sync");
    }

    /* ---- shared pieces ---- */

    function callout(notes) {
      var c = el("div", "rdi-callout");
      notes.forEach(function (n) { c.appendChild(el("p", "", n)); });
      return c;
    }
    function controlsRow(primary) {
      var row = el("div", "rdi-controls");
      var r = el("button", "rcr-btn", "Restart");
      r.type = "button";
      r.disabled = !st.deployed && st.tab === "sync";
      r.addEventListener("click", restart);
      row.appendChild(r);
      if (primary) {
        /* `wait` keeps the button in view but disabled, with a hint saying why. */
        var end = el("div", "rdi-next");
        if (primary.wait) end.appendChild(el("span", "rcr-faint", esc(primary.wait)));
        var b = el("button", "rcr-btn rcr-btn-primary", esc(primary.label));
        b.type = "button";
        b.disabled = st.busy || !!primary.wait;
        b.addEventListener("click", primary.fn);
        end.appendChild(b);
        row.appendChild(end);
      }
      return row;
    }
    function remember(d, key, dflt) {
      d.open = st.open[key] != null ? st.open[key] : !!dflt;
      d.addEventListener("toggle", function () { st.open[key] = d.open; });
      return d;
    }
    function grid(a, b) { var g = el("div", "rdi-grid"); g.appendChild(a); g.appendChild(b); return g; }
    function codeBlock(text) { return el("pre", "rcr-code rcr-code-sm", esc(text)); }

    /* The pipeline: status, the four stages, the counters, and its files. */
    function pipelineCard(ctx) {
      var S = ctx.S, r = ctx.done ? null : S.last;
      var card = el("div", "rcr-card rdi-pipe");
      var status = S.status || "none";
      card.appendChild(el("div", "rcr-cardhead", '<span>Pipeline <span class="rcr-mono">' + PIPELINE + "</span></span>" +
        '<span class="rdi-status is-' + status + '"><span class="rcr-dot ' + (status === "streaming" ? "is-ok" : status === "none" ? "" : "is-wait") +
        '"></span> ' + (STATUS[status] || "Not deployed") + "</span>"));
      /* Which stages light up, by index. A single change lights the stage it
         has reached, and the arrows up to it. During a snapshot, rows pass
         through every stage at once; the highlight steps through the stages
         in order, one per frame, to show the direction the rows travel. */
      var on = {}, into = {};
      if (r && (r.k === "snap" || (r.k === "status" && r.v === "initial"))) {
        /* Snapshot frames are three records apart, so count them from where
           this snapshot started: its "initial" status draws PostgreSQL, and
           each frame after it moves the highlight one stage on. */
        var start = ctx.n - 1;
        while (start > 0 && !(ctx.R[start].k === "status" && ctx.R[start].v === "initial")) start--;
        var k = r.k === "status" ? 0 : (1 + Math.floor((ctx.n - start - 2) / 3)) % 4;
        on[k] = true;
        into[k] = true;
      } else if (r) {
        var at = { commit: [0], capture: [1], apply: [2, 3], flush: [3] }[r.k] || [];
        at.forEach(function (i) { on[i] = true; });
        for (var j = 1; j <= Math.max.apply(null, at.concat([0])); j++) into[j] = true;
      }
      var table = r && (r.stmt ? r.stmt.table : r.table);
      /* Fixed text, so the boxes keep their size while records flow through.
         The exact stream is named in the captured change and the notes. */
      var stages = [
        ["pg", "PostgreSQL", DB + "." + SCHEMA],
        ["col", "Collector", "Debezium"],
        ["proc", "Stream processor", streamName("*")],
        ["redis", "Redis", "target"]
      ];
      var flow = el("div", "rdi-flow");
      stages.forEach(function (s, i) {
        if (i) flow.appendChild(el("span", "rdi-arrow" + (into[i] ? " is-on" : ""), "→"));
        flow.appendChild(el("div", "rdi-stage" + (on[i] ? " is-on" : ""),
          '<span class="rdi-stagename">' + esc(s[1]) + '</span><span class="rdi-stagesub rcr-mono">' + esc(s[2]) + "</span>"));
      });
      card.appendChild(flow);
      var wrap = el("div", "rdi-statswrap");
      /* Pending and Filtered stay at 0 here, so the card leaves them out; redis-di status shows every column. */
      var t = "<table class=\"rdi-stats\"><thead><tr><th>Table</th><th>Incoming</th><th>Inserted</th><th>Updated</th>" +
        "<th>Deleted</th><th>Rejected</th></tr></thead><tbody>";
      TABLES.forEach(function (tb) {
        var s = S.stats[tb.name], hot = table === tb.name && r && (r.k === "apply" || r.k === "snap");
        t += "<tr" + (hot ? ' class="is-hot"' : "") + '><td class="rcr-mono" title="' + esc(qualified(tb.name)) + '">' + esc(tb.name) + "</td><td>" + s.incoming +
          "</td><td>" + s.inserted + "</td><td>" + s.updated + "</td><td>" + s.deleted + "</td><td>" + s.rejected + "</td></tr>";
      });
      wrap.innerHTML = t + "</tbody></table>";
      card.appendChild(wrap);
      var files = el("div", "rdi-files");
      var cfg = remember(el("details", "rdi-file"), "config");
      cfg.appendChild(el("summary", "", "Show " + code("config.yaml")));
      cfg.appendChild(el("pre", "rcr-code rdi-yaml", '<span class="rdi-yamlbody">' + configYaml(st.structure).split("\n").map(function (l) {
        return '<span class="rdi-line">' + esc(l) + "</span>"; }).join("") + "</span>"));
      files.appendChild(cfg);
      if (st.deployed && ctx.done) {
        var stx = remember(el("details", "rdi-file"), "status");
        stx.appendChild(el("summary", "", "Show " + code("redis-di status")));
        stx.appendChild(el("pre", "rcr-code rdi-cli", esc(statusText(S))));
        files.appendChild(stx);
      }
      card.appendChild(files);
      return card;
    }

    /* The source tables, with the latest statement's row highlighted. */
    function sourceCard(ctx) {
      var S = ctx.S, L = ctx.L, card = el("div", "rcr-card rdi-source");
      card.appendChild(el("div", "rcr-cardhead", '<span>PostgreSQL</span><span class="rdi-chip rcr-mono">' + DB + "." + SCHEMA + "</span>"));
      var sub = el("div", "rcr-subtabs");
      sub.setAttribute("role", "tablist");
      TABLES.forEach(function (t) {
        var b = el("button", "rcr-subtab", esc(t.name) + ' <span class="rdi-count">' + S.src[t.name].length + "</span>");
        b.type = "button"; b.setAttribute("role", "tab");
        b.setAttribute("aria-selected", st.srcTab === t.name ? "true" : "false");
        b.addEventListener("click", function () { st.srcTab = t.name; renderCurrent(); });
        sub.appendChild(b);
      });
      card.appendChild(sub);
      var t = tableOf(st.srcTab), rows = S.src[t.name].slice();
      var hot = L && L.stmt.table === t.name ? L.stmt : null;
      if (hot && hot.op === "d" && L.stage < 3 && S.gone[t.name + ":" + hot.id]) {
        var at = tableOf(t.name).rows.map(function (r) { return r.id; }).indexOf(hot.id);
        rows.splice(Math.max(0, at), 0, S.gone[t.name + ":" + hot.id]);
      }
      var html = '<table class="rdi-rows"><thead><tr>' + t.columns.map(function (c) {
        return '<th title="' + esc(c[1]) + '">' + esc(c[0]) + '<span class="rdi-ctype">' + esc(c[1]) + "</span></th>"; }).join("") + "</tr></thead><tbody>";
      rows.forEach(function (r) {
        var isHot = hot && r.id === hot.id, cls = isHot ? (hot.op === "d" ? "is-deleted" : hot.op === "c" ? "is-new" : "is-changed") : "";
        html += "<tr" + (cls ? ' class="' + cls + '"' : "") + ">" + t.columns.map(function (c) {
          var changed = isHot && hot.op === "u" && hot.set[c[0]] != null;
          return "<td" + (NUMERIC[c[1]] ? ' class="is-num' + (changed ? " is-set" : "") + '"' : changed ? ' class="is-set"' : "") + ">" + esc(r[c[0]]) + "</td>";
        }).join("") + "</tr>";
      });
      var scroll = el("div", "rdi-rowswrap", html + "</tbody></table>");
      card.appendChild(scroll);
      return card;
    }

    /* Redis: keys grouped by pattern, and the selected key's value. */
    function prefixOf(key) { return key.replace(/[^:]+$/, ""); }
    function redisCard(ctx) {
      var S = ctx.S, card = el("div", "rcr-card rdi-redis");
      card.appendChild(el("div", "rcr-cardhead", '<span>Redis</span><span class="rdi-chip">' + plural(S.keys.length, "key") + "</span>"));
      if (!S.keys.length) {
        card.appendChild(el("p", "rdi-empty", st.deployed ? "The target database is empty." : "Empty. Deploy the pipeline to sync the tables."));
        return card;
      }
      var groups = [], byPrefix = {};
      S.keys.forEach(function (e) {
        var p = prefixOf(e.key);
        if (!byPrefix[p]) { byPrefix[p] = { prefix: p, keys: [] }; groups.push(byPrefix[p]); }
        byPrefix[p].keys.push(e);
      });
      var list = el("div", "rcr-keylist rdi-keylist");
      groups.forEach(function (g) {
        var d = el("details", "rcr-group");
        var mine = st.sel && prefixOf(st.sel) === g.prefix, k = "g:" + g.prefix;
        d.open = st.open[k] != null ? st.open[k] : mine;
        var left = g.keys.some(function (e) { return e.leftover; });
        var sum = el("summary", "", '<span class="rcr-mono">' + esc(g.prefix) + "*</span> " + '<span class="rcr-count">' + g.keys.length + "</span>" +
          (left ? '<span class="rdi-flag">left over</span>' : "") + '<span class="rcr-type rcr-type-' + g.keys[0].type + '">' + g.keys[0].type.toUpperCase() + "</span>");
        sum.addEventListener("click", function () { st.open[k] = !d.open; });
        d.appendChild(sum);
        g.keys.forEach(function (e) {
          var b = el("button", "rcr-key rcr-mono" + (e.key === st.sel ? " is-on" : "") + (!ctx.done && e.key === S.wrote ? " rdi-fresh" : ""), esc(e.key));
          b.type = "button";
          b.addEventListener("click", function () { st.sel = e.key; st.open["g:" + g.prefix] = true; renderCurrent(); });
          d.appendChild(b);
        });
        list.appendChild(d);
      });
      card.appendChild(list);
      card.appendChild(valueView(ctx));
      return card;
    }
    function valueView(ctx) {
      var S = ctx.S, box = el("div", "rdi-value"), e = st.sel ? S.redis[st.sel] : null;
      var L = ctx.L;
      if (!e) {
        var gone = L && L.stmt.op === "d" && L.stage === 3 ? keyFor(L.stmt.table, L.stmt.id, S.job) : null;
        box.appendChild(el("p", "rdi-empty", gone ? code(gone) + " was deleted with its row." : "Select a key to see its value."));
        return box;
      }
      var latest = S.wrote === e.key && (ctx.L ? ctx.L.stage === 3 : true);
      box.appendChild(el("div", "rdi-valuehead", '<span class="rcr-mono rdi-valuekey">' + esc(e.key) + '</span><span class="rcr-type rcr-type-' + e.type + '">' +
        e.type.toUpperCase() + '</span><span class="rcr-faint">written ' + hhmmss(e.at) + " UTC · " + OPERATIONS[e.op].toLowerCase() +
        " (opcode " + e.op + ")</span>" +
        (e.leftover ? '<span class="rdi-flag">left over</span>' : "")));
      var changed = {};
      if (latest && e.prev) Object.keys(e.value).forEach(function (k) { if (e.prev[k] !== e.value[k]) changed[k] = true; });
      if (e.type === "json") {
        var keys = Object.keys(e.value);
        box.appendChild(el("pre", "rcr-code rcr-code-sm rdi-json", "{\n" + keys.map(function (k, i) {
          var line = '  <span class="rcr-jk">&quot;' + esc(k) + "&quot;</span>: " + jsonHtml(e.value[k]) + (i < keys.length - 1 ? "," : "");
          return changed[k] ? '<span class="rdi-chg">' + line + "</span>" : line;
        }).join("\n") + "\n}"));
      } else {
        box.appendChild(el("table", "rdi-hash", Object.keys(e.value).map(function (k) {
          return "<tr" + (changed[k] ? ' class="rdi-chg"' : "") + '><td class="rcr-mono">' + esc(k) + '</td><td class="rcr-mono">"' + esc(e.value[k]) + '"</td></tr>';
        }).join("")));
      }
      return box;
    }
    /* Every change so far, one row each. The latest row is open and shows
       the three steps, with the step the change has reached highlighted, in
       step with the pipeline card. Earlier rows collapse to one line. */
    function changesCard(ctx, list, total, settled) {   // settled: the latest change isn't the latest thing that happened
      var L = ctx.L, card = el("div", "rcr-card rdi-changes");
      card.appendChild(el("div", "rcr-cardhead", "<span>Changes</span>" + (total ? '<span class="rdi-chip">' + list.length + " of " + total + "</span>" : "")));
      list.forEach(function (s, i) {
        var ch = ctx.S.changes[s.key];
        if (!ch) return;
        var current = i === list.length - 1 && !settled;
        var stage = current && L && L.stmt === s && !ctx.done ? L.stage : 0;
        card.appendChild(changeRow(s, ch, stage, current));
      });
      return card;
    }
    function changeRow(s, ch, stage, current) {
      var k = s.key, d = el("details", "rdi-crow" + (current ? " is-current" : ""));
      var sum = el("summary", "", '<span class="rdi-op rdi-op-' + s.op + '" title="opcode ' + s.op + '">' + OPERATIONS[s.op] + "</span>" +
        '<span class="rdi-cwhat">' + esc(s.what) + '</span><span class="rcr-mono rdi-ckey">' + esc(ch.key) + "</span>" +
        (stage ? '<span class="rcr-dot is-wait"></span>' : ""));
      d.appendChild(sum);
      /* Plain blocks, not a list or paragraphs, so the site's content styles
         for numbered lists and paragraphs don't apply. */
      var steps = el("div", "rdi-steps");
      changeSteps(s, ch, st.structure).forEach(function (x, i) {
        var state = !stage || i + 1 < stage ? "done" : i + 1 === stage ? "active" : "pending";
        var li = el("div", "rdi-step is-" + state);
        li.appendChild(el("div", "rdi-stephead", '<span class="rdi-stepnum">' + (i + 1) + '</span><span class="rdi-stepstage">' + esc(x.stage) +
          "</span>" + esc(x.title)));
        var body = el("div", "rdi-stepbody");
        if (x.sql) body.appendChild(el("code", "rdi-stepsql", esc(x.sql)));
        if (x.text) body.appendChild(el("div", "rdi-steptext", x.text));
        if (x.diff.length) body.appendChild(el("div", "rdi-diff", x.diff.map(function (f) {
          return '<div><span class="rcr-mono rdi-dfield">' + esc(f.field) + '</span> <span class="rcr-mono rdi-from">' + esc(f.from) +
            '</span> → <span class="rcr-mono rdi-to">' + esc(f.to) + "</span></div>";
        }).join("")));
        if (x.note) body.appendChild(el("div", "rdi-stepnote", x.note));
        if (x.record) {
          var rec = remember(el("details", "rdi-rec"), "rec:" + k);
          rec.appendChild(el("summary", "", "Show the captured change"));
          rec.appendChild(el("pre", "rcr-code rcr-code-sm", jsonHtml(x.record)));
          rec.appendChild(el("div", "rdi-stepnote", "A job with " + code("row_format: full") + " reads these fields. " + code("after") + " is " +
            code("null") + " for a delete."));
          body.appendChild(rec);
        }
        li.appendChild(body);
        steps.appendChild(li);
      });
      d.appendChild(steps);
      /* The latest row records only the reader's own clicks, so it collapses
         like the others when the next change arrives. */
      if (current) {
        d.open = st.open["now:" + k] !== false;
        sum.addEventListener("click", function () { st.open["now:" + k] = !d.open; });
      } else remember(d, "chg:" + k);
      return d;
    }
    /* The choices stay in place: finished ones are ticked and disabled, and
       all of them are disabled while a change plays, so nothing jumps. With
       `ordered`, they're numbered and only the next one can be chosen. */
    function optionsCard(label, items, isDone, render, pick, ordered) {
      var c = el("div", "rcr-card rdi-composer");
      c.appendChild(el("span", "rcr-lbl", esc(label)));
      var list = el("div", "rdi-options");
      var next = ordered ? items.filter(function (it) { return !isDone(it); })[0] : null;
      items.forEach(function (it, i) {
        var done = isDone(it), later = ordered && !done && it !== next;
        var mark = done ? '<span class="rdi-tick" aria-hidden="true">✓</span>' : ordered ? '<span class="rdi-stepnum">' + (i + 1) + "</span>" : "";
        var b = el("button", "rcr-chip rdi-option" + (done ? " is-done" : "") + (later ? " is-later" : ""), '<span class="rdi-optwhat">' +
          mark + esc(it.label || it.what) + (done ? '<span class="rdi-sr"> (done)</span>' : "") + "</span>" + render(it));
        b.type = "button";
        b.disabled = done || later || st.busy;
        if (later) b.title = "Do step " + (items.indexOf(next) + 1) + " first.";
        b.addEventListener("click", function () { pick(it.key); });
        list.appendChild(b);
      });
      c.appendChild(list);
      return c;
    }

    /* ---- tab 1: initial sync ---- */

    function renderSync(ctx) {
      var p = panels.sync;
      p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "The food delivery app keeps its customers, restaurants, and orders in PostgreSQL. RDI copies them into Redis " +
        "and keeps them in sync, so the app and its agents read from Redis instead. Choose how RDI stores each row, then deploy the pipeline."));
      p.appendChild(pipelineCard(ctx));
      var pick = el("div", "rdi-pick");
      pick.appendChild(el("span", "rcr-lbl", "Default data structure"));
      [["json", "JSON"], ["hash", "Hash"]].forEach(function (o) {
        var b = el("button", "rcr-chip" + (st.structure === o[0] ? " is-on" : ""), o[1]);
        b.type = "button";
        b.setAttribute("aria-pressed", st.structure === o[0] ? "true" : "false");
        b.disabled = st.deployed;
        b.addEventListener("click", function () { st.structure = o[0]; renderCurrent(); });
        pick.appendChild(b);
      });
      if (st.deployed) pick.appendChild(el("span", "rcr-faint", "Set when the pipeline was deployed. Restart to change it."));
      p.appendChild(pick);
      p.appendChild(grid(sourceCard(ctx), redisCard(ctx)));
      p.appendChild(callout(syncNotes(st, ctx.S, ctx.done)));
      p.appendChild(controlsRow(!st.deployed ? { label: "Deploy pipeline", fn: deploy } :
        ctx.done ? { label: "Next: change data capture", fn: function () { advance("cdc"); } } : null));
    }
    function deploy() {
      if (st.busy || st.deployed) return;
      st.deployed = true;
      st.sel = null;
      replay(0, { collapsed: true });
    }

    /* ---- tab 2: change data capture ---- */

    function renderCdc(ctx) {
      var p = panels.cdc;
      p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "The pipeline is streaming. Run statements against PostgreSQL, in any order, and follow each change " +
        "through the pipeline into Redis."));
      p.appendChild(pipelineCard(ctx));
      p.appendChild(optionsCard("Run a statement in PostgreSQL", STATEMENTS, function (s) { return st.ran.indexOf(s.key) >= 0; },
        function (s) { return "<code>" + esc(sqlOf(s)) + "</code>"; }, runStatement));
      var ran = st.ran.map(function (k) { return byKey(STATEMENTS, k); });
      if (ran.length) p.appendChild(changesCard(ctx, ran, STATEMENTS.length));
      p.appendChild(grid(sourceCard(ctx), redisCard(ctx)));
      var L = ctx.L && ctx.L.stmt !== POINTS ? ctx.L : null;
      p.appendChild(callout(cdcNotes(st, L, ctx.done)));
      var left = STATEMENTS.length - st.ran.length;
      p.appendChild(controlsRow({ label: "Next: job files", fn: function () { advance("jobs"); },
        wait: left ? "Run " + (left === STATEMENTS.length ? "all four statements" : left === 1 ? "the last statement" : "the other " + ["", "one", "two", "three"][left] + " statements") + " first." : null }));
    }
    function runStatement(key) {
      if (st.busy || st.ran.indexOf(key) >= 0) return;
      var from = records(st).length;
      st.ran.push(key);
      replay(from);
    }

    /* ---- tab 3: job files ---- */

    function renderJobs(ctx) {
      var p = panels.jobs;
      p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "Default keys like " + code("customers:id:u101") + " work, but your app may expect " + code("customer:u101") +
        ". A job file customizes how RDI writes one table: its key, its data structure, and its fields."));
      p.appendChild(pipelineCard(ctx));
      var job = el("div", "rcr-card rdi-job");
      job.appendChild(el("div", "rcr-cardhead", '<span class="rcr-mono">jobs/customers.yaml</span><span class="rdi-chip">' +
        (st.jobDeployed ? "deployed" : "not deployed") + "</span>"));
      job.appendChild(jobFile(st.structure));
      p.appendChild(job);
      if (st.jobDeployed) {
        p.appendChild(optionsCard("Apply the job to existing data", ACTIONS, function (a) { return st.actions.indexOf(a.key) >= 0; }, function (a) {
          return '<span class="rdi-optq">' + esc(a.question) + "</span>" +
            (a.key === "points" ? "<code>" + esc(a.detail) + "</code>" : '<span class="rdi-optdetail">' + esc(a.detail) + "</span>");
        }, runAction, true));
      }
      /* Once the reset or flush runs, the update is history, so its row collapses. */
      if (st.actions.indexOf("points") >= 0) p.appendChild(changesCard(ctx, [POINTS], 0, st.actions[st.actions.length - 1] !== "points"));
      p.appendChild(grid(sourceCard(ctx), redisCard(ctx)));
      p.appendChild(callout(jobNotes(st, ctx.S, ctx.done, ctx.L)));
      p.appendChild(controlsRow(!st.jobDeployed ? { label: "Deploy the job", fn: deployJob } : null));
    }
    /* The job file, with the two parts that differ from the default
       highlighted and numbered, and what each one does underneath. */
    function jobFile(structure) {
      var box = el("div", "rdi-jobfile"), block = 0, html = "";
      jobYaml(structure).split("\n").forEach(function (line) {
        var start = /^transform:/.test(line) ? 1 : /^      key:/.test(line) ? 2 : 0;
        if (start) block = start;
        else if (/^output:/.test(line)) block = 0;
        html += '<span class="rdi-line' + (block ? " rdi-ann" : "") + '">' + (start ? '<span class="rdi-annmark">' + start + "</span>" : "") + esc(line) + "</span>";
      });
      /* YAML depends on indentation, so lines never wrap: the file scrolls
         sideways instead, and the body spans the widest line so the
         highlighted blocks reach across it. */
      box.appendChild(el("pre", "rcr-code rdi-yaml", '<span class="rdi-yamlbody">' + html + "</span>"));
      box.appendChild(el("div", "rdi-annlist",
        '<div><span class="rdi-annmark">1</span><span>' + code("remove_field") + " drops the " + code("email") +
          " column before RDI writes the row, so email addresses never reach Redis.</span></div>" +
        '<div><span class="rdi-annmark">2</span><span>' + code("key") + " builds each key from the text " + code("customer:") + " and the row's " +
          code("id") + ", so Maya's key is " + code("customer:u101") + ". Without a " + code("key") + " block, RDI uses its default pattern, " +
          code("customers:id:u101") + ".</span></div>"));
      return box;
    }
    function deployJob() {
      if (st.busy || st.jobDeployed) return;
      var from = records(st).length;
      st.jobDeployed = true;
      st.srcTab = "customers";
      replay(from);
    }
    function runAction(key) {
      if (st.busy || st.actions.indexOf(key) >= 0) return;
      var from = records(st).length;
      st.actions.push(key);
      st.srcTab = "customers";
      if (key !== "points") st.sel = null;
      replay(from, { land: key === "points" ? null : "customer:u101" });
    }

    renderCurrent();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rdi[data-rdi]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.RdiDemo = { TABLES: TABLES, STATEMENTS: STATEMENTS, ACTIONS: ACTIONS, POINTS: POINTS, records: records, apply: apply,
    keyFor: keyFor, rowValue: rowValue, sqlOf: sqlOf, configYaml: configYaml, jobYaml: jobYaml, statusText: statusText,
    syncNotes: syncNotes, cdcNotes: cdcNotes, jobNotes: jobNotes, latestStatement: latestStatement, changeSteps: changeSteps };
})();

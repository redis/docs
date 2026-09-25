/* =========================================================================
   Redis Agent Memory scripted demo
   Dependency-free. Everything runs in the browser against a scripted
   conversation; no Agent Memory service is called.

   Request bodies, response envelopes, session summaries, memory records, and
   the 404 for a missing session mirror what a live Agent Memory service and
   its OpenAPI spec returned (Sep 2026). Two parts are modelled rather than
   observed: the extracted memory texts, and the similarity scores, which come
   from small hand-made vectors (the real service doesn't return scores).

   The customer (u101 Maya Chen), restaurants (r209 Lotus Thai, r201 Bangkok
   Street Kitchen), and order (o3003) come from the food delivery sample data
   in context-retriever-demo.js. Keep the IDs and names in sync.

   Base styles come from context-retriever-demo.css; agent-memory-demo.css
   adds the pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";

  /* ------------------------------------------------------------- constants */

  var OWNER = "u101";
  var ASSISTANT = "food-assistant";
  var S1 = "maya-0924-dinner";
  var S2 = "maya-0926-lunch";
  var SUMMARIZE_AFTER = 6;
  var KEEP_RECENT = 2;
  var SUMMARY_AT = "2026-09-24T18:00:09.772Z";
  var EXTRACTION_AT = "2026-09-24T18:03:07.314Z";
  var LATER_AT = "2026-09-26T12:30:00Z";
  var LONG_TTL_DAYS = 365;

  var TTLS = [
    { key: "1h", label: "1 hour", adj: "1-hour", seconds: 3600, isDefault: true },
    { key: "24h", label: "24 hours", adj: "24-hour", seconds: 86400 },
    { key: "7d", label: "7 days", adj: "7-day", seconds: 604800 }
  ];
  var EXCLUSIONS = [
    { key: "semantic", label: "Semantic exclusion" },
    { key: "detector", label: "Custom detector" },
    { key: "off", label: "Off" }
  ];

  /* ---------------------------------------------------------------- script */

  /* Thursday dinner: the conversation that places order o3003 at Lotus Thai.
     `mem` marks text an extracted memory comes from; `out` explains the
     extraction outcome for the event, per exclusion setting where it varies. */
  var S1_SCRIPT = [
    { role: "USER", at: "2026-09-24T17:58:05Z", ms: 412, out: "Kept as {1} and {2}.", parts: [
      { t: "Hi! Can you find me dinner tonight? " }, { t: "I'm vegetarian", mem: 1 }, { t: " and " },
      { t: "I love spicy Thai food", mem: 2 }, { t: "." }] },
    { role: "ASSISTANT", at: "2026-09-24T17:58:09Z", ms: 87, out: "Part of {6}, a record of what happened.", parts: [
      { t: "Lotus Thai has a green curry you might like, and I can ask for it extra spicy.", mem: 6 },
      { t: " Is there anything you can't eat?" }] },
    { role: "USER", at: "2026-09-24T17:58:41Z", ms: 230, out: "Kept as {3} and {4}.", parts: [
      { t: "I'm allergic to peanuts", mem: 3 }, { t: ". And " }, { t: "no fish sauce", mem: 4 }, { t: ", please." }] },
    { role: "ASSISTANT", at: "2026-09-24T17:58:45Z", ms: 655, out: "Part of {6}.", parts: [
      { t: "Got it. " }, { t: "Extra spicy green curry with no peanuts and no fish sauce.", mem: 6 },
      { t: " Shall I add " }, { t: "jasmine rice", mem: 6 }, { t: " and place the order?" }] },
    { role: "USER", at: "2026-09-24T17:59:20Z", ms: 518, out: {
      semantic: "Kept as {5}. The semantic exclusion left out the gate code, and the small talk isn't worth keeping.",
      detector: "Kept as {5}, and the gate_code detector replaced the code with [REDACTED]. The small talk isn't worth keeping.",
      off: "Kept as {5}, gate code included. The small talk isn't worth keeping." }, parts: [
      { t: "Yes please! " }, { t: "Leave it at the door", mem: 5 }, { t: ", " },
      { t: "the gate code is 4417", sensitive: true }, { t: ". " }, { t: "It's been a long day.", skip: "small talk" }] },
    { role: "ASSISTANT", at: "2026-09-24T18:00:02Z", ms: 341, out: "Completes {6}.", parts: [
      { t: "Done. Order o3003 is placed with Lotus Thai", mem: 6 }, { t: " and should arrive in about 25 minutes." }] }
  ];

  var SUMMARY_TEXT = "Maya asked for a vegetarian, spicy Thai dinner. She is allergic to peanuts and doesn't want fish sauce. " +
    "The assistant suggested Lotus Thai's green curry, extra spicy, with no peanuts or fish sauce, and offered to add jasmine rice and place the order.";

  /* Saturday lunch: a new session. The reply draws only on recalled memories;
     the restaurant itself comes from the app's own data. */
  var S2_SCRIPT = [
    { role: "USER", at: "2026-09-26T12:30:10Z", ms: 208, parts: [{ t: "I'm hungry. What should I get for lunch?" }] },
    { role: "ASSISTANT", at: "2026-09-26T12:30:16Z", ms: 590, parts: [{ t: "Welcome back, Maya! You had Lotus Thai's green curry on Thursday, " +
      "so how about something different: a vegetarian pad thai from Bangkok Street Kitchen, extra spicy, with no peanuts and no fish sauce?" }] }
  ];

  /* Memories the extraction run produces. `at` is the index of the event that
     completes each one. Vector dimensions: taste, diet, avoid, delivery,
     order history, other. */
  var MEMORY_DEFS = [
    { num: 1, at: 0, type: "semantic", text: "User is vegetarian.", vec: [0.25, 1.0, 0.35, 0, 0.1, 0.05] },
    { num: 2, at: 0, type: "semantic", text: "User loves spicy Thai food.", vec: [1.0, 0.25, 0.05, 0, 0.3, 0.05] },
    { num: 3, at: 2, type: "semantic", text: "User is allergic to peanuts.", vec: [0.1, 0.35, 1.0, 0, 0, 0.05] },
    { num: 4, at: 2, type: "semantic", text: "User avoids fish sauce.", vec: [0.35, 0.5, 0.8, 0, 0.05, 0.05] },
    { num: 5, at: 4, type: "semantic", text: null, vec: [0, 0, 0, 1.0, 0.15, 0.1] },
    { num: 6, at: 5, type: "episodic", text: "On September 24, 2026, the assistant ordered an extra spicy green curry with jasmine rice " +
      "from Lotus Thai for the user, with no peanuts or fish sauce.", vec: [0.75, 0.3, 0.35, 0.15, 1.0, 0.05] }
  ];
  var DOOR_TEXT = {
    off: "User wants deliveries left at the door. Gate code: 4417.",
    semantic: "User wants deliveries left at the door.",
    detector: "User wants deliveries left at the door. [REDACTED]."
  };

  var QUERIES = [
    { key: "lunch", text: "I'm hungry. What should I get for lunch?", vec: [0.9, 0.35, 0.1, 0.1, 0.6, 0.1] },
    { key: "allergy", text: "Food allergies and ingredients to avoid", vec: [0.15, 0.45, 0.9, 0, 0.1, 0.15] },
    { key: "delivery", text: "Where should the driver leave my order?", vec: [0, 0, 0, 1.0, 0.25, 0.2] },
    { key: "last", text: "What did I order last time?", vec: [0.35, 0.05, 0.05, 0.15, 1.0, 0.1] },
    { key: "car", text: "What car do I drive?", vec: [0, 0, 0, 0.1, 0.05, 1.0] }
  ];
  var SCRIPTED_LIMIT = 3;

  var NOT_FOUND = { detail: "The requested session was not found", status: 404, title: "Session Not Found", type: "/errors/resource-not-found" };

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
  function hash8(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return ("00000000" + (h >>> 0).toString(16)).slice(-8);
  }
  function id32(seed) { return hash8(seed + "#a") + hash8(seed + "#b") + hash8(seed + "#c") + hash8(seed + "#d"); }
  function b64(s) {
    var c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", out = "", i = 0;
    while (i < s.length) {
      var a = s.charCodeAt(i++), b = s.charCodeAt(i++), d = s.charCodeAt(i++);
      var n = (a << 16) | ((b || 0) << 8) | (d || 0);
      out += c[(n >> 18) & 63] + c[(n >> 12) & 63] + (isNaN(b) ? "=" : c[(n >> 6) & 63]) + (isNaN(d) ? "=" : c[n & 63]);
    }
    return out;
  }

  var DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  var ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth"];
  function dayLabel(iso) { var d = new Date(iso); return DAYS[d.getUTCDay()] + ", " + MONTHS[d.getUTCMonth()] + " " + d.getUTCDate(); }
  function dateLabel(iso) { var d = new Date(iso); return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(); }
  function hhmm(iso) { return iso.slice(11, 16); }
  function hhmmss(iso) { return iso.slice(11, 19); }
  function plus(iso, seconds) { return new Date(Date.parse(iso) + seconds * 1000).toISOString(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function ttlOf(key) { return TTLS.filter(function (t) { return t.key === key; })[0]; }
  function textOf(def) { return def.parts.map(function (p) { return p.t; }).join(""); }

  /* Pretty JSON with light syntax colouring (same as the Context Retriever demo). */
  function jsonHtml(v) {
    var s = JSON.stringify(v, null, 2);
    return esc(s).replace(/(&quot;(?:[^&]|&(?!quot;))*?&quot;)(\s*:)?|\b(true|false|null)\b|(-?\d+(?:\.\d+)?)/g,
      function (m, str, colon, lit, num) {
        if (str) return colon ? '<span class="rcr-jk">' + str + "</span>" + colon : '<span class="rcr-js">' + str + "</span>";
        if (lit) return '<span class="rcr-jl">' + lit + "</span>";
        return '<span class="rcr-jn">' + num + "</span>";
      });
  }

  /* ------------------------------------------------ API shapes (REST API) */

  function eventJson(def, i, sessionId) {
    return { actorId: def.role === "USER" ? OWNER : ASSISTANT, content: [{ text: textOf(def) }], createdAt: def.at,
      eventId: id32(sessionId + ":" + i), role: def.role, sessionId: sessionId,
      systemTimestamp: def.at.replace("Z", "." + ("00" + def.ms).slice(-3) + "Z") };
  }
  function addEventRequest(ev) {
    return { sessionId: ev.sessionId, actorId: ev.actorId, role: ev.role, content: ev.content, createdAt: ev.createdAt };
  }
  function summaryJson(upToEventId, count) {
    return { createdAt: SUMMARY_AT, metadata: {}, summarizedEvents: count, summarizedUpToEventId: upToEventId,
      text: SUMMARY_TEXT, updatedAt: SUMMARY_AT };
  }

  /* What GET /session-memory/{sessionId} returns after the first n events. */
  function sessionView(script, sessionId, n, summarize) {
    var all = script.slice(0, n).map(function (d, i) { return eventJson(d, i, sessionId); });
    if (summarize && script === S1_SCRIPT && n >= SUMMARIZE_AFTER) {
      var cut = n - KEEP_RECENT;
      return { all: all, events: all.slice(cut), summary: summaryJson(all[cut - 1].eventId, cut) };
    }
    return { all: all, events: all, summary: null };
  }
  function sessionResponse(sessionId, view) {
    var r = { events: view.events, ownerId: OWNER, sessionId: sessionId };
    if (view.summary) r.summary = view.summary;
    return r;
  }

  /* Long-term memories after the extraction run has processed `processed` events. */
  function memories(settings, processed) {
    var p = processed == null ? S1_SCRIPT.length : processed;
    return MEMORY_DEFS.filter(function (d) { return d.at < p; }).map(function (d) {
      return { key: "m" + d.num, num: d.num, type: d.type, vec: d.vec, at: d.at,
        text: d.num === 5 ? DOOR_TEXT[settings.exclusion] : d.text,
        sensitive: d.num === 5 && settings.exclusion === "off", id: id32("memory:m" + d.num) };
    });
  }
  function recordJson(m) {
    return { createdAt: EXTRACTION_AT, id: m.id, memoryType: m.type, ownerId: OWNER, sessionId: S1,
      text: m.text, topics: [], updatedAt: EXTRACTION_AT };
  }

  function cosine(a, b) {
    var d = 0, x = 0, y = 0;
    for (var i = 0; i < a.length; i++) { d += a[i] * b[i]; x += a[i] * a[i]; y += b[i] * b[i]; }
    return d / Math.sqrt(x * y);
  }
  function searchRequest(query, limit, threshold) {
    var r = { text: query.text, filter: { ownerId: { eq: OWNER } }, limit: limit };
    if (threshold) r.similarityThreshold = threshold;
    return r;
  }
  /* Ranks every memory, then applies the threshold and the limit like the API. */
  function runSearch(query, limit, threshold, mems) {
    var ranked = mems.map(function (m) { return { mem: m, score: Math.round(cosine(query.vec, m.vec) * 100) / 100 }; })
      .sort(function (a, b) { return b.score - a.score || a.mem.num - b.mem.num; });
    var passing = ranked.filter(function (r) { return !threshold || r.score >= threshold; });
    var returned = passing.slice(0, limit);
    ranked.forEach(function (r) {
      r.status = returned.indexOf(r) !== -1 ? "returned" : (threshold && r.score < threshold ? "below" : "limit");
    });
    var body = { items: returned.map(function (r) { return recordJson(r.mem); }) };
    if (passing.length > limit) body.nextPageToken = b64(String(limit));
    return { ranked: ranked, returned: returned, body: body };
  }

  var BASE = "$AGENT_MEMORY_URL/v1/stores/$STORE_ID";
  function shellQuote(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }
  function curl(method, path, body) {
    var lines = ["curl" + (method === "GET" ? "" : " -X " + method) + " \"" + BASE + path + "\" \\",
      "  -H \"Authorization: Bearer $API_KEY\""];
    if (body) {
      lines[1] += " \\";
      lines.push("  -H \"Content-Type: application/json\" \\");
      lines.push("  -d " + shellQuote(JSON.stringify(body)));
    }
    return lines.join("\n");
  }

  /* -------------------------------------------------------------------- UI */

  function init(root) {
    var st = {
      tab: "chat", turn: 0, extracted: false, lunch: false,
      settings: { ttl: "1h", summarize: true, exclusion: "semantic" },
      search: { q: "lunch", limit: SCRIPTED_LIMIT, threshold: 0 },
      open: {}, anim: 0, busy: false
    };
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); }); }

    root.innerHTML = "";
    root.appendChild(buildSettings());
    var tabs = el("div", "rcr-tabs");
    tabs.setAttribute("role", "tablist");
    var TABS = [["chat", "1", "Conversation"], ["extract", "2", "Background extraction"], ["later", "3", "Two days later"]];
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

    /* Animations run as timed steps; the last step renders the final state.
       Anything that changes the story bumps st.anim, so a replay in flight
       stops and the panel shows the final state instead. */
    function cancel() { st.anim++; st.busy = false; }
    function play(steps) {
      var id = ++st.anim;
      st.busy = true;
      var chain = Promise.resolve();
      steps.forEach(function (s, i) {
        chain = chain.then(function () { return wait(s[0]); }).then(function () {
          if (id !== st.anim) return;
          if (i === steps.length - 1) st.busy = false;
          s[1]();
        });
      });
    }

    function show(name) {
      cancel();
      if (name === "extract" && st.turn < 3) st.turn = 3;
      if (name === "later") { st.turn = 3; st.extracted = true; }
      st.tab = name;
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.tab === name ? "true" : "false"); });
      Object.keys(panels).forEach(function (k) { panels[k].hidden = k !== name; });
      renderCurrent();
    }
    function renderCurrent() {
      if (st.tab === "chat") renderChat();
      else if (st.tab === "extract") renderExtract();
      else renderLater();
    }
    function restart() {
      cancel();
      st.turn = 0; st.extracted = false; st.lunch = false;
      st.search = { q: "lunch", limit: SCRIPTED_LIMIT, threshold: 0 };
      st.open = {};
      show("chat");
    }

    /* ---- settings ---- */

    function buildSettings() {
      var d = el("details", "rcr-card ram-settings");
      var sum = el("summary", "", '<span class="ram-settings-title">Service settings</span><span class="rcr-faint ram-settings-sum"></span>');
      d.appendChild(sum);
      var grid = el("div", "ram-setgrid");
      var ttlSel = select(TTLS.map(function (t) { return [t.key, t.label + (t.isDefault ? " (default)" : "")]; }), st.settings.ttl, "Short-term TTL");
      grid.appendChild(setRow("Short-term TTL", ttlSel, "How long session memory is kept."));
      grid.appendChild(setRow("Long-term TTL", el("span", "", LONG_TTL_DAYS + " days"), "The default."));
      grid.appendChild(setRow("Extraction cadence", el("span", "", "5 minutes"), "The default. The pipeline runs this often while a session is active."));
      var sumBox = el("input", "");
      sumBox.type = "checkbox"; sumBox.checked = st.settings.summarize;
      var sumLbl = el("label", "ram-check");
      sumLbl.appendChild(sumBox);
      sumLbl.appendChild(el("span", "", "Summarize after " + SUMMARIZE_AFTER + " messages, keep the " + KEEP_RECENT + " most recent"));
      grid.appendChild(setRow("Automatic summarization", sumLbl, null));
      var exSel = select(EXCLUSIONS.map(function (e) { return [e.key, e.label]; }), st.settings.exclusion, "Sensitive-data exclusions");
      var exNote = el("span", "rcr-faint");
      grid.appendChild(setRow("Sensitive-data exclusions", exSel, exNote));
      d.appendChild(grid);
      d.appendChild(el("p", "rcr-note", "Changes apply to the whole story, as if the service had been set up that way. " +
        "Sensitive-data exclusions are an early-stage feature, enabled for selected accounts."));

      function sync() {
        var ex = EXCLUSIONS.filter(function (e) { return e.key === st.settings.exclusion; })[0];
        sum.querySelector(".ram-settings-sum").textContent = "Short-term TTL " + ttlOf(st.settings.ttl).label +
          " · summarization " + (st.settings.summarize ? "on" : "off") + " · exclusions: " + ex.label.toLowerCase();
        exNote.innerHTML = {
          semantic: "Exclusion prompt: “Never keep door, gate, or building access codes.” It steers the extraction model, so it's advisory.",
          detector: "Detector <code>gate_code</code> matches <code>(?i)gate code:?\\s*\\d+</code> and redacts the match. Detector matches are applied deterministically.",
          off: "Nothing is kept out of long-term memory."
        }[st.settings.exclusion];
      }
      function changed() { sync(); cancel(); renderCurrent(); }
      ttlSel.addEventListener("change", function () { st.settings.ttl = ttlSel.value; changed(); });
      sumBox.addEventListener("change", function () { st.settings.summarize = sumBox.checked; changed(); });
      exSel.addEventListener("change", function () { st.settings.exclusion = exSel.value; changed(); });
      sync();
      return d;
    }
    function setRow(label, control, note) {
      var r = el("div", "ram-set");
      r.appendChild(el("span", "rcr-lbl", esc(label)));
      r.appendChild(control);
      if (note) r.appendChild(typeof note === "string" ? el("span", "rcr-faint", esc(note)) : note);
      return r;
    }
    function select(options, value, label) {
      var s = el("select", "rcr-select");
      s.setAttribute("aria-label", label);
      options.forEach(function (o) {
        var op = el("option", "", esc(o[1])); op.value = o[0];
        if (o[0] === value) op.selected = true;
        s.appendChild(op);
      });
      return s;
    }

    /* ---- shared pieces ---- */

    function headRow(iso) {
      var h = el("div", "ram-head");
      h.appendChild(el("span", "ram-clock", "<b>" + dayLabel(iso) + '</b> <span class="rcr-mono">' + hhmm(iso) + " UTC</span>"));
      h.appendChild(el("span", "rcr-faint", "Customer u101 · Maya Chen"));
      return h;
    }
    function callout(notes) {
      var c = el("div", "ram-callout");
      notes.forEach(function (n) { c.appendChild(el("p", "", n)); });
      return c;
    }
    function controlsRow(primary) {
      var row = el("div", "ram-controls");
      var r = el("button", "rcr-btn", "Restart");
      r.type = "button";
      r.disabled = st.turn === 0 && !st.extracted && !st.lunch && st.tab === "chat";
      r.addEventListener("click", restart);
      row.appendChild(r);
      if (primary) {
        var b = el("button", "rcr-btn rcr-btn-primary", esc(st.busy && primary.busy ? primary.busy : primary.label));
        b.type = "button";
        b.disabled = st.busy;
        b.addEventListener("click", primary.fn);
        row.appendChild(b);
      }
      return row;
    }
    function pre(obj) { return el("pre", "rcr-code rcr-code-sm", jsonHtml(obj)); }
    function detailsEl(key, label, build) {
      var d = el("details", "ram-api");
      if (st.open[key]) d.open = true;
      d.appendChild(el("summary", "", esc(label)));
      var body = el("div", "ram-apibody");
      build(body);
      d.appendChild(body);
      d.addEventListener("toggle", function () { st.open[key] = d.open; });
      return d;
    }
    function apiBlock(body, title, method, path, request, status, response) {
      body.appendChild(el("div", "ram-apititle", '<span class="rcr-lbl">' + method + '</span> <span class="rcr-mono">' + esc(path) +
        '</span> <span class="rcr-faint">' + esc(title) + " · " + status + "</span>"));
      if (request) { body.appendChild(el("div", "rcr-lbl", "Request body")); body.appendChild(pre(request)); }
      body.appendChild(el("div", "rcr-lbl", "Response"));
      body.appendChild(pre(response));
      body.appendChild(el("pre", "rcr-code rcr-code-sm", esc(curl(method, path, request))));
    }
    function chatCard(defs, n, extra) {
      var card = el("div", "rcr-card ram-chatcard");
      var chat = el("div", "rcr-chat");
      for (var i = 0; i < n; i++) {
        chat.appendChild(el("div", "rcr-msg " + (defs[i].role === "USER" ? "rcr-user" : "rcr-agent"), esc(textOf(defs[i]))));
        if (extra && extra[i]) extra[i].forEach(function (x) { chat.appendChild(x); });
      }
      if (!n) chat.appendChild(el("p", "ram-empty", "Maya hasn't sent anything yet."));
      card.appendChild(chat);
      return { card: card, chat: chat };
    }
    function thinking() { return el("div", "rcr-msg rcr-agent rcr-thinking", "<span></span><span></span><span></span>"); }

    /* ---- the two memory tiers ---- */

    function tierHead(title, sub, chips) {
      return el("div", "ram-tierhead", '<div class="ram-tiertitle">' + esc(title) + '</div><div class="ram-tiersub">' + esc(sub) +
        '</div><div class="ram-chips">' + chips.map(function (c) { return '<span class="ram-chip">' + esc(c) + "</span>"; }).join("") + "</div>");
    }
    function sessionCard(blocks, api) {
      var card = el("div", "rcr-card ram-tier ram-tier-short");
      card.appendChild(tierHead("Short-term memory", "Session memory: each conversation, as sent", ["TTL " + ttlOf(st.settings.ttl).label]));
      blocks.forEach(function (b) { card.appendChild(sessionBlock(b)); });
      if (api) card.appendChild(api);
      return card;
    }
    function sessionBlock(s) {
      var b = el("div", "ram-sess" + (s.expired ? " is-expired" : ""));
      var chip;
      if (s.expired) chip = '<span class="ram-chip ram-status-expired">expired</span>';
      else chip = '<span class="ram-chip">' + plural(s.view.all.length, "event") +
        (s.view.summary ? ", " + s.view.summary.summarizedEvents + " summarized" : "") + "</span>";
      b.appendChild(el("div", "ram-sesshead", '<span class="rcr-mono">' + esc(s.id) + "</span>" + chip));
      if (s.expired) { b.appendChild(el("p", "ram-expired", s.expired)); return b; }
      if (s.summarizing) {
        b.appendChild(el("div", "ram-working", '<span class="rcr-dot is-wait"></span> Summarizing the ' +
          (s.view.all.length - KEEP_RECENT) + " oldest messages…"));
      }
      if (s.view.summary) {
        b.appendChild(el("div", "ram-summary" + (s.freshSummary ? " ram-fresh" : ""), '<span class="rcr-lbl">Summary of ' +
          s.view.summary.summarizedEvents + " earlier messages</span>" + esc(s.view.summary.text)));
      }
      if (!s.view.all.length) b.appendChild(el("p", "ram-empty", s.emptyText || "No events yet."));
      s.view.events.forEach(function (e) {
        var r = el("div", "ram-ev" + (s.fresh === e.eventId ? " ram-fresh" : ""));
        r.appendChild(el("span", "ram-role ram-role-" + e.role.toLowerCase(), e.role));
        r.appendChild(el("span", "ram-evtext", esc(e.content[0].text)));
        r.appendChild(el("span", "ram-evtime rcr-mono", hhmmss(e.createdAt) + " · " + esc(e.actorId)));
        b.appendChild(r);
      });
      return b;
    }
    function ltmCard(mems, opts) {
      opts = opts || {};
      var card = el("div", "rcr-card ram-tier ram-tier-long");
      card.appendChild(tierHead("Long-term memory", "Facts and events worth keeping, from any session",
        ["TTL " + LONG_TTL_DAYS + " days", plural(mems.length, "memory", "memories")]));
      if (!mems.length) card.appendChild(el("p", "ram-empty", opts.empty || "No memories yet."));
      mems.forEach(function (m) {
        var used = opts.used && opts.used[m.key];
        var r = el("div", "ram-mem" + (used ? " is-used" : "") + (m.sensitive ? " is-sensitive" : "") +
          (opts.fresh && opts.fresh[m.key] ? " ram-fresh" : ""));
        r.appendChild(el("span", "ram-num", String(m.num)));
        r.appendChild(el("div", "", '<div class="ram-memtext">' + esc(m.text) + '</div><div class="ram-memmeta"><span class="ram-type ram-type-' +
          m.type + '">' + m.type + "</span>from " + S1 + (used ? ' <span class="ram-used">used in reply</span>' : "") + "</div>"));
        card.appendChild(r);
      });
      if (mems.length) {
        card.appendChild(detailsEl("ltm", "Show the memory records", function (body) {
          body.appendChild(el("p", "rcr-note ram-mt0", "Each record, in the shape the search endpoint returns it. It's kept until " +
            dateLabel(plus(EXTRACTION_AT, LONG_TTL_DAYS * 86400)) + "."));
          body.appendChild(pre(mems.map(recordJson)));
        }));
      }
      return card;
    }
    function grid(a, b) { var g = el("div", "ram-grid"); g.appendChild(a); g.appendChild(b); return g; }

    /* ---- tab 1: the conversation ---- */

    function renderChat(view) {
      view = view || { n: 2 * st.turn };
      var n = view.n, p = panels.chat;
      p.innerHTML = "";
      p.appendChild(headRow(n ? S1_SCRIPT[n - 1].at : S1_SCRIPT[0].at));
      p.appendChild(el("p", "rcr-lede", "Maya Chen, a customer of the food delivery app, asks its assistant for dinner. " +
        "Every message goes into session memory the moment it's sent."));
      var c = chatCard(S1_SCRIPT, n);
      if (view.thinking) c.chat.appendChild(thinking());
      p.appendChild(c.card);
      var sv = sessionView(S1_SCRIPT, S1, n, st.settings.summarize && !view.summarizing);
      var api = n ? detailsEl("chat-api", "Show the API calls", function (body) {
        var last = sv.all[n - 1];
        apiBlock(body, "Add the latest event", "POST", "/session-memory/events", addEventRequest(last), "201", { event: last });
        apiBlock(body, "Fetch the session", "GET", "/session-memory/" + S1, null, "200", sessionResponse(S1, sv));
      }) : null;
      p.appendChild(grid(
        sessionCard([{ id: S1, view: sv, summarizing: view.summarizing, freshSummary: view.freshSummary,
          fresh: view.fresh && n ? sv.all[n - 1].eventId : null, emptyText: "No events yet. The session starts with Maya's first message." }], api),
        ltmCard([], { empty: "Empty for now. The extraction pipeline runs in the background every 5 minutes, so replies never wait for it." })));
      p.appendChild(callout(chatNotes(n, view)));
      p.appendChild(controlsRow(st.turn < 3 ?
        { label: st.turn ? "Send the next message" : "Send Maya's first message", busy: "Sending…", fn: sendNext } :
        { label: "Next: background extraction", fn: function () { show("extract"); } }));
    }
    function chatNotes(n, view) {
      if (view.summarizing) return ["The session just reached " + SUMMARIZE_AFTER + " messages, so summarization starts in the background."];
      if (n === 0) return ["Session memory is empty. Send Maya's first message to start the conversation."];
      if (n === 1) return ["Maya's message is in session memory the moment she sends it, before the assistant replies."];
      if (n === 2) return ["Each message is stored word for word, in order. Before every reply, your app fetches the session by its ID, so the assistant knows what was just said."];
      if (n < 5) return ["Long-term memory is still empty. Extraction runs in the background every 5 minutes, so the conversation never waits for it."];
      if (n === 5) return ["Maya just shared her gate code. Session memory stores it exactly as she sent it."];
      if (!st.settings.summarize) return ["Automatic summarization is off, so the session returns all 6 messages in full. Turn it on in Service settings to compare."];
      return ["The session reached " + SUMMARIZE_AFTER + " messages, so the " + (SUMMARIZE_AFTER - KEEP_RECENT) +
        " oldest were condensed into a summary. The session now returns the summary and the " + KEEP_RECENT +
        " most recent messages in full, which keeps the model's prompt short.",
        "The gate code is still in session memory, exactly as Maya sent it."];
    }
    function sendNext() {
      if (st.busy || st.turn >= 3) return;
      var t = st.turn;
      st.turn = t + 1;
      var nUser = 2 * t + 1, nFull = 2 * t + 2;
      var summarizes = st.settings.summarize && nFull >= SUMMARIZE_AFTER;
      var steps = [
        [0, function () { renderChat({ n: nUser, thinking: true, fresh: true }); }],
        [900, function () { renderChat({ n: nFull, fresh: true, summarizing: summarizes }); }]
      ];
      if (summarizes) steps.push([1200, function () { renderChat({ n: nFull, freshSummary: true }); }]);
      play(steps);
    }

    /* ---- tab 2: background extraction ---- */

    function renderExtract(view) {
      view = view || { processed: st.extracted ? S1_SCRIPT.length : 0 };
      var k = view.processed, p = panels.extract, done = k >= S1_SCRIPT.length;
      p.innerHTML = "";
      p.appendChild(headRow(k || view.running ? EXTRACTION_AT : S1_SCRIPT[5].at));
      p.appendChild(el("p", "rcr-lede", "Five minutes after the conversation started, the extraction pipeline reads the new session events " +
        "in the background. It saves what's worth remembering as long-term memories."));
      p.appendChild(extractionCard(k, view.running));
      var fresh = {};
      memories(st.settings, k).forEach(function (m) { if (view.running && m.at === k - 1) fresh[m.key] = true; });
      p.appendChild(grid(
        sessionCard([{ id: S1, view: sessionView(S1_SCRIPT, S1, 6, st.settings.summarize) }], null),
        ltmCard(memories(st.settings, k), { fresh: fresh, empty: "Empty until the extraction pipeline runs." })));
      p.appendChild(callout(extractNotes(k, view.running)));
      p.appendChild(controlsRow(!st.extracted || view.running ?
        { label: "Run the extraction", busy: "Extracting…", fn: runExtraction } :
        { label: "Next: two days later", fn: function () { show("later"); } }));
      return done;
    }
    function extractionCard(k, running) {
      var card = el("div", "rcr-card ram-extract");
      var status = running ? '<span class="rcr-dot is-wait"></span> running' :
        k >= S1_SCRIPT.length ? '<span class="rcr-dot is-ok"></span> done' : "waiting";
      card.appendChild(el("div", "rcr-cardhead", "<span>Extraction run at " + hhmm(EXTRACTION_AT) + " UTC</span>" +
        '<span class="ram-chip">' + status + "</span>"));
      S1_SCRIPT.forEach(function (def, i) {
        var seen = i < k;
        var row = el("div", "ram-xrow" + (seen ? "" : " is-pending") + (running && i === k - 1 ? " is-active" : ""));
        row.appendChild(el("div", "", '<span class="ram-role ram-role-' + def.role.toLowerCase() + '">' + def.role + "</span> " +
          (seen ? annotate(def) : esc(textOf(def)))));
        if (seen) row.appendChild(el("div", "ram-xout", badges(typeof def.out === "string" ? def.out : def.out[st.settings.exclusion])));
        card.appendChild(row);
      });
      var legend = ['<span><span class="ram-hl">highlighted</span> saved as a memory</span>', '<span><span class="ram-left">struck through</span> left out</span>'];
      if (st.settings.exclusion === "off") legend.push('<span><span class="ram-sens">red</span> sensitive, and kept</span>');
      card.appendChild(el("div", "ram-legend", legend.join("")));
      return card;
    }
    function annotate(def) {
      return def.parts.map(function (p) {
        if (p.mem) return '<span class="ram-hl">' + esc(p.t) + '</span><sup class="ram-tag">' + p.mem + "</sup>";
        if (p.skip) return '<span class="ram-left" title="Left out: ' + esc(p.skip) + '">' + esc(p.t) + "</span>";
        if (p.sensitive) {
          if (st.settings.exclusion === "off") return '<span class="ram-sens">' + esc(p.t) + '</span><sup class="ram-tag ram-tag-bad">5</sup>';
          return '<span class="ram-left" title="' + (st.settings.exclusion === "detector" ? "Redacted by the gate_code detector" :
            "Left out by the semantic exclusion") + '">' + esc(p.t) + "</span>";
        }
        return esc(p.t);
      }).join("");
    }
    function badges(text) { return esc(text).replace(/\{(\d)\}/g, '<span class="ram-num ram-num-sm">$1</span>'); }
    function extractNotes(k, running) {
      if (running) return ["The pipeline reads each new event and decides what's worth keeping."];
      if (k < S1_SCRIPT.length) return ["The extraction pipeline hasn't run yet. Run it to see which parts of the conversation become long-term memories."];
      var notes = ["Six messages became six memories: five facts about Maya and one record of the order. The small talk wasn't kept."];
      notes.push({
        semantic: "The semantic exclusion kept the gate code out of long-term memory. Session memory still has it, because exclusions never change session memory. " +
          "Semantic exclusions are advisory, so don't rely on them alone for real secrets.",
        detector: "The gate_code detector replaced the code with [REDACTED] in long-term memory. Detector matches are applied deterministically. " +
          "Session memory still has the code, because exclusions never change session memory.",
        off: "With exclusions off, the gate code is now in long-term memory, where it's kept for " + LONG_TTL_DAYS + " days. " +
          "Pick an exclusion in Service settings to compare."
      }[st.settings.exclusion]);
      notes.push("Each memory records its owner, u101, and the session it came from, so the app can find it after the session is gone.");
      return notes;
    }
    function runExtraction() {
      if (st.busy || st.extracted) return;
      st.extracted = true;
      var steps = [[0, function () { renderExtract({ processed: 0, running: true }); }]];
      S1_SCRIPT.forEach(function (d, i) {
        steps.push([550, function () { renderExtract({ processed: i + 1, running: i + 1 < S1_SCRIPT.length }); }]);
      });
      play(steps);
    }

    /* ---- tab 3: two days later ---- */

    function renderLater(view) {
      view = view || { step: st.lunch ? 5 : 0 };
      var step = view.step, p = panels.later;
      var ttl = ttlOf(st.settings.ttl);
      var gap = (Date.parse(LATER_AT) - Date.parse(S1_SCRIPT[S1_SCRIPT.length - 1].at)) / 1000;
      var s1Gone = ttl.seconds < gap;
      var mems = memories(st.settings);
      var lunch = runSearch(QUERIES[0], SCRIPTED_LIMIT, 0, mems);
      var safety = runSearch(QUERIES[1], SCRIPTED_LIMIT, 0, mems);
      var n2 = step >= 5 ? 2 : step >= 1 ? 1 : 0;
      var s2 = sessionView(S2_SCRIPT, S2, n2, false);
      var s1v = sessionView(S1_SCRIPT, S1, 6, st.settings.summarize);

      p.innerHTML = "";
      p.appendChild(headRow(n2 ? S2_SCRIPT[n2 - 1].at : LATER_AT));
      p.appendChild(el("p", "rcr-lede", "Two days later, Maya opens the app and starts a new conversation. " +
        (s1Gone ? "The Thursday session is past its short-term TTL, but long-term memory still has what she shared." :
          "The Thursday session is still within its short-term TTL, but the new conversation gets a new session.")));

      var extra = {};
      if (step >= 1) extra[0] = [callCard("Store Maya's message", "POST", "/session-memory/events", addEventRequest(s2.all[0]), "201", { event: s2.all[0] })];
      if (step >= 2) extra[0].push(callCard("Search for the question", "POST", "/long-term-memory/search", searchRequest(QUERIES[0], SCRIPTED_LIMIT, 0), "200", lunch.body));
      if (step >= 3) extra[0].push(callCard("Search again for allergies", "POST", "/long-term-memory/search", searchRequest(QUERIES[1], SCRIPTED_LIMIT, 0), "200", safety.body));
      if (step >= 5) extra[1] = [callCard("Store the reply", "POST", "/session-memory/events", addEventRequest(s2.all[1]), "201", { event: s2.all[1] })];
      var c = chatCard(S2_SCRIPT, step >= 4 ? 2 : Math.min(step, 1), extra);
      if (step >= 1 && step < 4) c.chat.appendChild(thinking());
      p.appendChild(c.card);

      var used = {};
      if (step >= 2) lunch.returned.forEach(function (r) { used[r.mem.key] = true; });
      if (step >= 3) safety.returned.forEach(function (r) { used[r.mem.key] = true; });
      var blocks = [
        s1Gone ? { id: S1, expired: "Past its " + ttl.adj + " short-term TTL, so the session is gone. Fetching it returns 404." } : { id: S1, view: s1v },
        { id: S2, view: s2, fresh: view.fresh && n2 ? s2.all[n2 - 1].eventId : null, emptyText: "No events yet. The session starts with Maya's first message." }
      ];
      var api = detailsEl("later-api", "Show the API calls", function (body) {
        apiBlock(body, "Fetch the Thursday session", "GET", "/session-memory/" + S1, null, s1Gone ? "404" : "200", s1Gone ? NOT_FOUND : sessionResponse(S1, s1v));
        if (n2) apiBlock(body, "Fetch the new session", "GET", "/session-memory/" + S2, null, "200", sessionResponse(S2, s2));
      });
      p.appendChild(grid(sessionCard(blocks, api), ltmCard(mems, { used: used })));
      p.appendChild(callout(laterNotes(step, s1Gone, ttl, lunch)));
      if (step >= 5) p.appendChild(searchCard(mems));
      p.appendChild(controlsRow(!st.lunch || view.step < 5 ? { label: "Send Maya's message", busy: "Replying…", fn: sendLunch } : null));
    }
    function laterNotes(step, s1Gone, ttl, lunch) {
      if (step === 0) {
        return [s1Gone ? "The Thursday session is gone: it's past its " + ttl.adj + " short-term TTL, so fetching it returns 404." :
          "With a " + ttl.adj + " short-term TTL, the Thursday session is still stored. But a new conversation starts a new session, and sessions are fetched by ID, not searched.",
          "Long-term memory still has all six memories. They're kept for " + LONG_TTL_DAYS + " days."];
      }
      if (step < 5) return ["Before replying, the assistant searches long-term memory for Maya's preferences."];
      var rank = 0;
      lunch.ranked.forEach(function (r, i) { if (r.mem.num === 3) rank = i; });
      return ["Maya didn't repeat any of her preferences. The assistant knows them because it searched long-term memory before it replied.",
        "Search ranks memories by how similar they are to the query. For the lunch question with a limit of " + SCRIPTED_LIMIT +
        ", the peanut allergy ranks " + ORDINALS[rank] + " and isn't returned. That's why this assistant also runs a targeted search for allergies before it suggests food.",
        "The restaurant suggestion comes from the app's own data, for example through Context Retriever."];
    }
    function sendLunch() {
      if (st.busy || st.lunch) return;
      st.lunch = true;
      play([
        [0, function () { renderLater({ step: 1, fresh: true }); }],
        [800, function () { renderLater({ step: 2 }); }],
        [900, function () { renderLater({ step: 3 }); }],
        [900, function () { renderLater({ step: 4 }); }],
        [700, function () { renderLater({ step: 5, fresh: true }); }]
      ]);
    }
    function callCard(label, method, path, request, status, response) {
      var d = el("details", "rcr-call");
      d.appendChild(el("summary", "", '<span class="rcr-lbl">' + method + '</span> <span class="rcr-mono rcr-callname">' + esc(path) +
        '</span> <span class="rcr-faint rcr-callargs">' + esc(label) + '</span><span class="rcr-status"><span class="rcr-dot is-ok"></span> ' + status + "</span>"));
      var body = el("div", "rcr-callbody");
      if (request) { body.appendChild(el("div", "rcr-lbl", "Request body")); body.appendChild(pre(request)); }
      body.appendChild(el("div", "rcr-lbl", "Response"));
      body.appendChild(pre(response));
      var cd = el("details", "rcr-curl");
      cd.appendChild(el("summary", "", "Run this call yourself with curl"));
      cd.appendChild(el("pre", "rcr-code rcr-code-sm", esc(curl(method, path, request))));
      body.appendChild(cd);
      d.appendChild(body);
      return d;
    }

    /* ---- search playground ---- */

    function searchCard(mems) {
      var card = el("div", "rcr-card ram-search");
      card.appendChild(el("div", "rcr-cardhead", '<span>Try a search</span><span class="ram-chip">illustrative scores</span>'));
      card.appendChild(el("p", "rcr-note ram-mt0", "Pick a query, then change the limit and the similarity threshold to see which memories come back."));
      var chips = el("div", "rcr-chips");
      QUERIES.forEach(function (q) {
        var b = el("button", "rcr-chip" + (q.key === st.search.q ? " is-on" : ""), esc(q.text));
        b.type = "button";
        b.addEventListener("click", function () {
          st.search.q = q.key;
          Array.prototype.forEach.call(chips.children, function (x) { x.classList.toggle("is-on", x === b); });
          refresh();
        });
        chips.appendChild(b);
      });
      card.appendChild(chips);
      var ctl = el("div", "ram-searchctl");
      var lim = select([1, 2, 3, 4, 5, 6].map(function (n) { return [String(n), String(n)]; }), String(st.search.limit), "Limit");
      var limWrap = el("label", "ram-ctl", '<span class="rcr-lbl">Limit</span>');
      limWrap.appendChild(lim);
      var thr = el("input", "ram-range");
      thr.type = "range"; thr.min = "0"; thr.max = "0.9"; thr.step = "0.05"; thr.value = String(st.search.threshold);
      thr.setAttribute("aria-label", "Similarity threshold");
      var thrVal = el("span", "rcr-mono ram-thrval");
      var thrWrap = el("label", "ram-ctl", '<span class="rcr-lbl">Similarity threshold</span>');
      thrWrap.appendChild(thr); thrWrap.appendChild(thrVal);
      ctl.appendChild(limWrap); ctl.appendChild(thrWrap);
      card.appendChild(ctl);
      var results = el("div", "ram-results");
      card.appendChild(results);
      var api = el("div", "");
      card.appendChild(api);
      card.appendChild(el("p", "rcr-note", "Scores come from small hand-made vectors so you can see the ranking. The real service ranks by " +
        "embedding similarity and doesn't return scores. At 0, the request doesn't set <code>similarityThreshold</code>."));
      lim.addEventListener("change", function () { st.search.limit = +lim.value; refresh(); });
      thr.addEventListener("input", function () { st.search.threshold = Math.round(+thr.value * 100) / 100; refresh(); });

      function refresh() {
        var q = QUERIES.filter(function (x) { return x.key === st.search.q; })[0];
        var r = runSearch(q, st.search.limit, st.search.threshold, mems);
        thrVal.textContent = st.search.threshold ? st.search.threshold.toFixed(2) : "off";
        results.innerHTML = "";
        r.ranked.forEach(function (x) {
          var row = el("div", "ram-res" + (x.status === "returned" ? "" : " is-out"));
          row.innerHTML = '<span class="ram-num ram-num-sm">' + x.mem.num + "</span>" +
            '<span class="ram-score"><span class="ram-bar"><span style="width:' + Math.round(x.score * 100) + '%"></span></span>' +
            '<span class="rcr-mono">' + x.score.toFixed(2) + "</span></span>" +
            '<span class="ram-restext">' + esc(x.mem.text) + "</span>" +
            '<span class="ram-resstat">' + { returned: "returned", below: "below threshold", limit: "past the limit" }[x.status] + "</span>";
          results.appendChild(row);
        });
        api.innerHTML = "";
        api.appendChild(detailsEl("search-api", "Show the request and response", function (body) {
          apiBlock(body, "Search long-term memory", "POST", "/long-term-memory/search", searchRequest(q, st.search.limit, st.search.threshold), "200", r.body);
        }));
      }
      refresh();
      return card;
    }

    renderChat();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".ram[data-ram]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.AgentMemoryDemo = { runSearch: runSearch, searchRequest: searchRequest, memories: memories, sessionView: sessionView,
    sessionResponse: sessionResponse, recordJson: recordJson, curl: curl, b64: b64, QUERIES: QUERIES, S1_SCRIPT: S1_SCRIPT,
    S2_SCRIPT: S2_SCRIPT, TTLS: TTLS, textOf: textOf };
})();

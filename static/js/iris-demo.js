/* =========================================================================
   Redis Iris scripted demo: a guided tour of one request
   Dependency-free. Everything runs in the browser against a scripted
   request; no Iris service, database, or model is called.

   One idea per step, on an animated isometric drawing after the Iris
   architecture diagram, where packets show each step's data moving:
   data enters through Data Integration (a change in PostgreSQL reaches
   Redis), Maya asks the food delivery app's assistant to reorder last
   week's curry within 30 minutes and asks about the delivery fee, then
   LangCache, Agent Memory, and Context Retriever each add one part of the
   answer, and the model writes the reply. The last step takes one service
   away and shows only the part of the reply it changes. Each step links
   to that service's own demo, which covers it in depth; this page doesn't
   repeat their API detail.

   trace() models every combination of services: the request's steps and
   API shapes (matching agent-memory-demo.js, langcache-demo.js,
   context-retriever-demo.js, and rdi-demo.js), the reply credited by
   source, and the scorecard. The tour shows the full trace, and the last
   step compares it with one service missing. Modelled rather than
   observed: the similarity score, the agent's reasoning and reply, and
   the timings and token counts.

   Customers, restaurants, orders, and Maya's memories come from the same
   sample data as those demos. Keep them in sync.

   Base styles come from context-retriever-demo.css; iris-demo.css adds the
   pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";
  if (window.IrisDemo) return;   // loaded twice: the first copy already booted every widget

  /* ------------------------------------------------------------- the story */

  var OWNER = "u101", ASSISTANT = "food-assistant", SESSION = "maya-1002-dinner", PAST_SESSION = "maya-0924-dinner";
  var EXTRACTION_AT = "2026-09-24T18:03:07.314Z";
  var SYNC_AT = "2026-10-02T18:20:03Z", ASK_AT = "2026-10-02T18:24:10Z", REPLY_AT = "2026-10-02T18:24:13Z";
  var WITHIN = 30;   // minutes Maya can wait
  var MESSAGE = "Can you order the curry I had last week again? It needs to be here within 30 minutes. And how much is delivery these days?";
  var QUESTION = "How much is delivery these days?";
  var SURFACE = "3f8c2a1e-demo";

  function ts(y, m, d, h) { return Math.floor(Date.UTC(y, m - 1, d, h == null ? 12 : h) / 1000); }
  var LOTUS = { id: "r209", name: "Lotus Thai", cuisine: "thai", city: "austin", rating: 4.1, price_level: 1, avg_delivery_min: 25 };
  var BUSY = 45;   // Lotus Thai's delivery time tonight, after the kitchen got busy
  var BSK = { id: "r201", name: "Bangkok Street Kitchen", cuisine: "thai", city: "austin", rating: 4.7, price_level: 2, avg_delivery_min: 30 };
  var CURRY = { id: "o3003", customer_id: "u101", restaurant_id: "r209", status: "delivered", total: 22.75, placed_ts: ts(2026, 9, 24, 18),
    items: "Green curry without fish sauce, jasmine rice" };
  var PAD_THAI = [
    { id: "o3001", customer_id: "u101", restaurant_id: "r201", status: "delivered", total: 34.5, placed_ts: ts(2026, 9, 2, 19), items: "Pad thai with tofu, spring rolls" },
    { id: "o3018", customer_id: "u101", restaurant_id: "r201", status: "delivered", total: 31, placed_ts: ts(2026, 9, 19, 19), items: "Pad thai with tofu, mango sticky rice" }
  ];
  /* What the Agent Memory demo's default story extracted on Thursday, Sep 24. */
  var MEMORIES = [
    { key: "order", type: "episodic", text: "On September 24, 2026, the assistant ordered an extra spicy green curry with jasmine rice from Lotus Thai for the user, with no peanuts or fish sauce." },
    { key: "peanut", type: "semantic", text: "User is allergic to peanuts." },
    { key: "fish", type: "semantic", text: "User avoids fish sauce." },
    { key: "spicy", type: "semantic", text: "User loves spicy Thai food." },
    { key: "veg", type: "semantic", text: "User is vegetarian." }
  ];
  /* The LangCache demo's cached answer to the delivery fee question. */
  var FEE_PROMPT = "How much is the delivery fee?";
  var FEE = "Delivery costs $1.99 to $4.99, depending on distance, and you see the exact fee at checkout. Plus members get free delivery on orders over $15.";
  var FEE_SIM = 0.92;

  /* In the order data flows through Iris: in through Data Integration, then the services the agent calls. */
  var SERVICES = [
    { key: "rdi", name: "Data Integration", role: "Brings business data in from PostgreSQL and keeps it in sync" },
    { key: "retriever", name: "Context Retriever", role: "Gives the agent governed tools to read that data" },
    { key: "memory", name: "Agent Memory", role: "Remembers Maya across conversations" },
    { key: "cache", name: "LangCache", role: "Answers questions it has seen before" }
  ];
  var NAMES = { cache: "LangCache", memory: "Agent Memory", retriever: "Context Retriever", rdi: "Data Integration", model: "Model" };
  /* Modelled timings (ms) and token counts. */
  var MS = { cache: 41, memory: 190, tool: [74, 88, 81], answer: 1620, reply: 1480 };
  var TOKENS = { answer: 61 };

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
  function code(s) { return "<code>" + esc(s) + "</code>"; }
  function hhmm(iso) { return iso.slice(11, 16); }
  function seconds(ms) { return (ms / 1000).toFixed(2) + " s"; }
  function shellQuote(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

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

  /* ------------------------------------------------ API shapes (per service) */

  function curlRest(url, key, body) {
    return ["curl -s -X POST \"" + url + "\" \\", "  -H \"Authorization: Bearer " + key + "\" \\", "  -H \"Content-Type: application/json\" \\",
      "  -d " + shellQuote(JSON.stringify(body))].join("\n");
  }
  var MCP = "https://<region>.context-surfaces.redis.io/mcp";
  function curlMcp(body) {
    return ["curl -X POST " + MCP + " \\", "  -H \"X-API-Key: <your-agent-key>\" \\", "  -H \"Content-Type: application/json\" \\",
      "  -H \"Accept: application/json, text/event-stream\" \\", "  -d " + shellQuote(JSON.stringify(body))].join("\n");
  }
  function cacheSearch() {
    var request = { prompt: QUESTION };
    return { method: "POST", path: "/entries/search", status: "200", request: request,
      response: { data: [{ id: id32(FEE_PROMPT + "|{}"), prompt: FEE_PROMPT, response: FEE, attributes: {}, similarity: FEE_SIM, searchStrategy: "semantic" }] },
      curl: curlRest("https://$LANGCACHE_HOST/v1/caches/$CACHE_ID/entries/search", "$LANGCACHE_API_KEY", request) };
  }
  function memoryRecord(m) {
    return { createdAt: EXTRACTION_AT, id: id32("memory:" + m.key), memoryType: m.type, ownerId: OWNER, sessionId: PAST_SESSION,
      text: m.text, topics: [], updatedAt: EXTRACTION_AT };
  }
  function memorySearch() {
    var request = { text: "The curry the user ordered last week, and their food preferences and allergies", filter: { ownerId: { eq: OWNER } }, limit: 5 };
    return { method: "POST", path: "/long-term-memory/search", status: "200", request: request, response: { items: MEMORIES.map(memoryRecord) },
      curl: curlRest("$AGENT_MEMORY_URL/v1/stores/$STORE_ID/long-term-memory/search", "$AGENT_MEMORY_API_KEY", request) };
  }
  function sessionEvent(i, role, text, at) {
    var ev = { actorId: role === "USER" ? OWNER : ASSISTANT, content: [{ text: text }], createdAt: at, eventId: id32(SESSION + ":" + i),
      role: role, sessionId: SESSION, systemTimestamp: at.replace("Z", ".2" + (i ? "61" : "04") + "Z") };
    var request = { sessionId: SESSION, actorId: ev.actorId, role: role, content: ev.content, createdAt: at };
    return { method: "POST", path: "/session-memory/events", status: "201", request: request, response: { event: ev },
      curl: curlRest("$AGENT_MEMORY_URL/v1/stores/$STORE_ID/session-memory/events", "$AGENT_MEMORY_API_KEY", request) };
  }
  /* Context Retriever results carry a _retrieval stamp, with fields sorted (as the Context Retriever demo returns them). */
  function stamp(rec) {
    var out = { _retrieval: { source: SURFACE, retrieved_at: ASK_AT.replace("Z", ".318Z"), source_version: 1 } };
    Object.keys(rec).sort().forEach(function (k) { out[k] = rec[k]; });
    return out;
  }
  function toolCall(n, name, args, result) {
    var request = { jsonrpc: "2.0", id: n, method: "tools/call", params: { name: name, arguments: args } };
    return { method: "tools/call", path: name, status: "ok", args: args, request: request,
      response: { jsonrpc: "2.0", id: n, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }, result: result, curl: curlMcp(request) };
  }
  function filterResult(rows) { return { count: rows.length, has_more: false, limit: 10, offset: 0, results: rows.map(stamp), total_count: rows.length }; }

  /* ------------------------------------------------------------ the model */

  /* Everything that happens for one combination of services: the change
     Data Integration syncs beforehand, the steps of the request, the reply
     (as segments, each credited to the service it came from), and the
     scorecard. */
  function trace(on) {
    var steps = [], ms = 0, tokens = 0, n = 0;
    var lotusMin = on.rdi ? BUSY : LOTUS.avg_delivery_min;
    var lotusRow = clone(LOTUS);
    lotusRow.avg_delivery_min = lotusMin;
    function add(s) { steps.push(s); if (s.ms && s.phase !== "record") ms += s.ms; if (s.tokens) tokens += s.tokens; return s; }

    var background = on.rdi ? {
      on: true, at: SYNC_AT,
      sql: "UPDATE restaurants SET avg_delivery_min = 45 WHERE id = 'r209';",
      text: "Lotus Thai's kitchen gets busy, and the app updates its delivery time in PostgreSQL. A second later, Data Integration has written the change to " +
        code("restaurant:r209") + ", through a job file that uses the key template Context Retriever reads.",
      record: { opcode: "u", db: "fooddelivery", schema: "public", table: "restaurants", key: { id: "r209" }, after: lotusRow }
    } : {
      on: false, at: SYNC_AT,
      sql: "UPDATE restaurants SET avg_delivery_min = 45 WHERE id = 'r209';",
      text: "Lotus Thai's kitchen gets busy, and the app updates its delivery time in PostgreSQL. Without Data Integration, Redis gets restaurant data from a nightly export at 02:00, so " +
        code("restaurant:r209") + " still says 25 minutes."
    };

    /* Recall */
    if (on.cache) add({ phase: "recall", service: "cache", ms: MS.cache, title: "Checks the cache for the general question",
      text: "The agent sends the general part of Maya's message to LangCache, " + code(QUESTION) + ". A similar question, " + code(FEE_PROMPT) +
        ", scores " + FEE_SIM.toFixed(2) + ", so the cached answer comes back without a model call. The personal part isn't cached, because its answer is Maya's alone.",
      calls: [cacheSearch()] });
    else add({ phase: "recall", service: "cache", off: true, title: "No cache to check", text: "LangCache is off, so the model has to answer the general question too." });
    if (on.memory) add({ phase: "recall", service: "memory", ms: MS.memory, title: "Recalls last week's order and Maya's preferences",
      text: "A long-term memory search, scoped to Maya, returns what the assistant learned in last week's conversation: the order she means, her peanut allergy, and how she likes her food.",
      calls: [memorySearch()], memories: MEMORIES });
    else add({ phase: "recall", service: "memory", off: true, title: "Nothing to recall", text: "Agent Memory is off, so the assistant doesn't remember last week's conversation." });

    /* Retrieve */
    var alt = false;
    if (on.retriever) {
      if (!on.memory) add({ phase: "retrieve", service: "retriever", ms: MS.tool[0], title: "Looks for a curry in Maya's orders",
        text: "Without memory, the agent searches her order history instead and finds order " + code("o3003") + " from Lotus Thai. The order record doesn't say how spicy she likes it, or that she's allergic to peanuts.",
        calls: [toolCall(++n, "filter_order", { tag_conditions: [{ field: "customer_id", value: OWNER }], text_query: "curry" }, filterResult([CURRY]))] });
      add({ phase: "retrieve", service: "retriever", ms: MS.tool[1], fresh: on.rdi, title: "Checks Lotus Thai's delivery time",
        text: on.rdi ? "The restaurant record says " + BUSY + " minutes: Data Integration synced tonight's change four minutes ago. That's too slow for Maya." :
          "The restaurant record says 25 minutes, from last night's export. The agent takes it at face value.",
        calls: [toolCall(++n, "get_restaurant_by_id", { id: LOTUS.id }, stamp(lotusRow))] });
      if (lotusMin > WITHIN) {
        alt = true;
        add({ phase: "retrieve", service: "retriever", ms: MS.tool[2], title: "Finds a Thai restaurant that can make it",
          text: "Thai restaurants in Austin that deliver within " + WITHIN + " minutes: Bangkok Street Kitchen.",
          calls: [toolCall(++n, "filter_restaurant", { tag_conditions: [{ field: "city", value: "austin" }, { field: "cuisine", value: "thai" }],
            numeric_conditions: [{ field: "avg_delivery_min", max_value: WITHIN }] }, filterResult([BSK]))] });
        add({ phase: "retrieve", service: "retriever", ms: MS.tool[0], title: "Checks what Maya has ordered there",
          text: "She's had their pad thai with tofu twice.",
          calls: [toolCall(++n, "filter_order", { tag_conditions: [{ field: "customer_id", value: OWNER }, { field: "restaurant_id", value: BSK.id }] }, filterResult(PAD_THAI))] });
      }
    } else add({ phase: "retrieve", service: "retriever", off: true, title: "No tools to call",
      text: "Context Retriever is off, so the agent has no way to read restaurants or orders." + (on.rdi ? " Data Integration still keeps Redis up to date, but nothing reads it." : "") });

    /* The reply, as segments credited to their source. */
    var R = [];
    function say(t, src) { R.push({ t: t, src: src || null }); }
    var memLine = "Last week you had the extra spicy green curry from Lotus Thai, with no peanuts or fish sauce. ";
    if (on.memory) say(memLine, "memory");
    else if (on.retriever) say("Your last curry order was the green curry without fish sauce from Lotus Thai. ", "retriever");
    if (on.retriever && alt) {
      say("Lotus Thai is taking about " + BUSY + " minutes tonight", "rdi");
      say(", so it wouldn't arrive in time. ");
      say("Bangkok Street Kitchen can deliver in about 30 minutes, and you've ordered their pad thai with tofu twice. ", "retriever");
      say("Should I order that");
      if (on.memory) { say(", "); say("extra spicy, with no peanuts or fish sauce", "memory"); }
      say("? ");
    } else if (on.retriever) {
      say("Lotus Thai can deliver in about 25 minutes. ", "stale");
      say("Should I order it again? ");
    } else if (on.memory) {
      say("I can't check delivery times right now, so I can't promise it'll arrive within 30 minutes. Should I order it anyway? ");
    } else {
      say("I don't have a record of what you had last week, and I can't look up your orders right now. What would you like to order? ");
    }
    say(FEE, on.cache ? "cache" : null);
    var reply = R.map(function (x) { return x.t; }).join("").trim();

    /* Model call */
    if (!on.cache) add({ phase: "model", service: "model", ms: MS.answer, tokens: TOKENS.answer, title: "Answers the general question",
      text: "A separate model call writes the delivery fee answer that LangCache would have returned." });
    var replyTokens = Math.round(reply.split(/\s+/).length * 1.3);   // about 1.3 tokens a word
    add({ phase: "model", service: "model", ms: MS.reply, tokens: replyTokens, title: "Writes the reply",
      text: "The model gets Maya's message plus the context gathered so far" + (on.memory || on.retriever ? "" : ", which is nothing") + ", and writes the reply." });

    /* Record */
    if (on.memory) add({ phase: "record", service: "memory", ms: 25, title: "Stores the message and the reply",
      text: "Both go into session memory as events. Background extraction later decides what's worth keeping long term, such as the restaurant Maya picks tonight.",
      calls: [sessionEvent(0, "USER", MESSAGE, ASK_AT), sessionEvent(1, "ASSISTANT", reply, REPLY_AT)] });
    else add({ phase: "record", service: "memory", off: true, title: "Nothing is remembered", text: "Agent Memory is off, so next time the assistant starts from nothing again." });
    if (on.cache) add({ phase: "record", service: "cache", note: true, title: "Nothing new to cache",
      text: "The general question was a cache hit, and the reply is personal, so the app doesn't store it." });

    /* The scorecard. */
    var checks = [
      { key: "time", label: "Arrives within 30 minutes",
        state: on.retriever && on.rdi ? "ok" : on.retriever ? "bad" : "warn",
        text: on.retriever && on.rdi ? "Lotus Thai is too slow tonight, so it offers Bangkok Street Kitchen" : on.retriever ? "Promises 25 minutes, but Lotus Thai is taking 45" : "Can't check delivery times" },
      { key: "order", label: "Knows what Maya had last week",
        state: on.memory ? "ok" : on.retriever ? "warn" : "bad",
        text: on.memory ? "Recalled from Agent Memory, with how she likes it" : on.retriever ? "Found in her order history, without how spicy she likes it" : "Doesn't know" },
      { key: "peanut", label: "Keeps her away from peanuts",
        state: on.memory ? "ok" : alt ? "bad" : "warn",
        text: on.memory ? "Knows about her allergy" : alt ? "Suggests pad thai without knowing about her allergy" : "Doesn't know about her allergy" },
      { key: "fee", label: "Answers the delivery fee question",
        state: on.cache ? "ok" : "slow",
        text: on.cache ? "From LangCache in " + MS.cache + " ms" : "From the model: " + seconds(MS.answer) + " and " + TOKENS.answer + " output tokens" }
    ];
    return { on: on, background: background, steps: steps, reply: R, replyText: reply, checks: checks, ms: ms, tokens: tokens, alt: alt };
  }

  /* ------------------------------------------------------------- the tour */

  /* What changes when one service is missing: the part of the reply it
     supplied, with and without it (both are excerpts of trace() replies,
     which the tests check), and the scorecard check it moves. */
  var WHAT_IF = {
    rdi: { check: "time",
      with: "Lotus Thai is taking about 45 minutes tonight, so it wouldn't arrive in time. Bangkok Street Kitchen can deliver in about 30 minutes",
      without: "Lotus Thai can deliver in about 25 minutes. Should I order it again?",
      why: "Without Data Integration, Redis only has last night's export, where Lotus Thai still says 25 minutes. The agent promises a delivery that will take 45." },
    retriever: { check: "time",
      with: "Lotus Thai is taking about 45 minutes tonight, so it wouldn't arrive in time. Bangkok Street Kitchen can deliver in about 30 minutes",
      without: "I can't check delivery times right now, so I can't promise it'll arrive within 30 minutes. Should I order it anyway?",
      why: "Without Context Retriever, the agent has no tools to read restaurants or orders. The data in Redis is fresh, but nothing reads it." },
    memory: { check: "peanut",
      with: "you've ordered their pad thai with tofu twice. Should I order that, extra spicy, with no peanuts or fish sauce?",
      without: "you've ordered their pad thai with tofu twice. Should I order that?",
      why: "Without Agent Memory, the agent finds the curry in Maya's order history, but nothing there says she's allergic to peanuts, so it suggests pad thai without a warning." },
    cache: { check: "fee",
      with: "Delivery costs $1.99 to $4.99, depending on distance",
      without: "Delivery costs $1.99 to $4.99, depending on distance",
      why: "Without LangCache, the reply says the same thing, but a second model call writes the fee answer: " + seconds(MS.answer) + " and " + TOKENS.answer + " output tokens that the cache would have saved." }
  };
  /* The tour, one idea per step. `lit` lists the map nodes the step is about;
     `adds` is what the agent knows after it. */
  var STEPS = [
    { key: "rdi", at: "18:20", title: "Data enters through Data Integration", lit: ["pg", "rdi", "redis"],
      text: "Lotus Thai's kitchen gets busy, so the app updates its delivery time in PostgreSQL. Data Integration captures the change and writes it to Redis about a second later. The services the agent calls read from that Redis database. Select POSTGRES or the Redis logo in the diagram to see the data in each.",
      adds: [{ src: "rdi", t: "Lotus Thai: 45 minutes tonight" }] },
    { key: "ask", at: "18:24", title: "Maya asks the assistant", lit: ["agent"],
      text: "Four minutes later, Maya asks for last week's curry. To answer, the agent needs what she had and what she can't eat, a restaurant that can deliver in time, and the delivery fee, which is the same for everyone." },
    { key: "cache", at: "18:24", title: "LangCache answers the general question", lit: ["cache", "redis", "agent"],
      text: "The delivery fee doesn't depend on who's asking, so the agent checks LangCache first. Another customer asked something similar earlier, and the cached answer comes back in " + MS.cache + " ms, without a model call. The rest of Maya's message is personal, so it isn't cached.",
      adds: [{ src: "cache", t: "Delivery fee: $1.99 to $4.99" }] },
    { key: "memory", at: "18:24", title: "Agent Memory recalls last week", lit: ["memory", "redis", "agent"],
      text: "This is a new conversation, but Agent Memory kept what the assistant learned from Maya last week. A search scoped to her returns the order she means and the food she can't eat.",
      adds: [{ src: "memory", t: "Last week: extra spicy green curry from Lotus Thai" }, { src: "memory", t: "Allergic to peanuts, avoids fish sauce" }] },
    { key: "retriever", at: "18:24", title: "Context Retriever checks live data", lit: ["retriever", "redis", "agent"],
      text: "Context Retriever gives the agent governed tools for the restaurant and order data that Data Integration keeps in sync. Lotus Thai is too slow tonight, so the agent finds a Thai restaurant that can make it, and checks what Maya has ordered there.",
      adds: [{ src: "retriever", t: "Bangkok Street Kitchen: 30 minutes" }, { src: "retriever", t: "She's had their pad thai with tofu twice" }] },
    { key: "reply", at: "18:24", title: "The model writes one reply", lit: ["agent"],
      text: "The model gets Maya's message and everything the agent gathered, and writes the reply. Each highlighted part came from a different service. Afterward, Agent Memory stores the conversation, so next time the assistant remembers tonight too." },
    { key: "whatif", title: "What if a service were missing?", lit: [],
      text: "Pick a service to take away. Only the part of the reply it supplied changes." }
  ];
  var DEPTH = { rdi: "Data Integration", retriever: "Context Retriever", memory: "Agent Memory", cache: "LangCache" };

  /* ---- the PostgreSQL sample data, shown when the reader selects POSTGRES ----
     The same rows as the RDI demo (rdi-demo.js), on the evening of this tour:
     Maya's curry order has been delivered, and Lotus Thai's delivery time
     changes from 25 to 45 minutes at 18:20. Keep the rows in sync. */
  function pgEmail(name) { return name.toLowerCase().replace(/[^a-z]+/g, ".") + "@example.com"; }
  var PG = [
    { name: "restaurants", columns: ["id", "name", "avg_delivery_min", "cuisine", "city", "rating", "price_level"], rows: [
      ["r201", "Bangkok Street Kitchen", 30, "thai", "austin", 4.7, 2], ["r202", "Smokehouse 512", 40, "bbq", "austin", 4.4, 3],
      ["r203", "Green Bowl", 25, "vegan", "seattle", 4.8, 2], ["r204", "Sakura Sushi Bar", 35, "sushi", "denver", 4.6, 3],
      ["r205", "Nonna's Trattoria", 45, "italian", "seattle", 4.5, 3], ["r206", "Slice Society", 30, "pizza", "denver", 4.2, 1],
      ["r207", "Olive & Za'atar", 30, "mediterranean", "austin", 4.6, 2], ["r208", "Spice Route", 40, "indian", "seattle", 4.3, 2],
      ["r209", "Lotus Thai", 45, "thai", "austin", 4.1, 1]
    ] },
    { name: "customers", columns: ["id", "name", "email", "city", "dietary", "favorite_cuisine", "loyalty_points", "joined_ts"], rows: [
      ["u101", "Maya Chen", "austin", "vegetarian", "thai", 1240, ts(2024, 5, 3)], ["u102", "Liam Ortiz", "austin", "none", "bbq", 860, ts(2025, 1, 19)],
      ["u103", "Priya Nair", "seattle", "vegan", "indian", 2310, ts(2023, 9, 12)], ["u104", "Noah Williams", "denver", "none", "pizza", 410, ts(2025, 11, 2)],
      ["u105", "Sofia Rossi", "seattle", "vegetarian", "italian", 1780, ts(2024, 2, 27)], ["u106", "Ethan Brooks", "denver", "gluten_free", "sushi", 950, ts(2024, 8, 14)],
      ["u107", "Aisha Khan", "austin", "halal", "mediterranean", 1530, ts(2023, 12, 6)], ["u108", "Lucas Meyer", "denver", "none", "burgers", 120, ts(2026, 7, 21)]
    ].map(function (r) { return [r[0], r[1], pgEmail(r[1])].concat(r.slice(2)); }) },
    { name: "orders", columns: ["id", "customer_id", "restaurant_id", "status", "total", "placed_ts", "items"], rows: [
      ["o3001", "u101", "r201", "delivered", 34.5, ts(2026, 9, 2, 19), "Pad thai with tofu, spring rolls"],
      ["o3002", "u101", "r207", "delivered", 28, ts(2026, 9, 10, 13), "Falafel wrap, hummus"],
      ["o3003", "u101", "r209", "delivered", 22.75, ts(2026, 9, 24, 18), "Green curry without fish sauce, jasmine rice"],
      ["o3004", "u102", "r202", "delivered", 61.2, ts(2026, 9, 5, 20), "Brisket platter, mac and cheese"],
      ["o3005", "u102", "r201", "cancelled", 19.9, ts(2026, 8, 28, 12), "Pad see ew"],
      ["o3006", "u103", "r203", "delivered", 24, ts(2026, 9, 12, 12), "Buddha bowl, oat latte"],
      ["o3007", "u103", "r208", "delivered", 38.4, ts(2026, 9, 18, 19), "Chana masala, garlic naan"],
      ["o3008", "u104", "r206", "delivered", 42, ts(2026, 9, 6, 20), "Two large pizzas"],
      ["o3009", "u104", "r204", "delivered", 67.8, ts(2026, 9, 20, 19), "Omakase set for two"],
      ["o3010", "u105", "r205", "delivered", 54.3, ts(2026, 9, 8, 20), "Mushroom risotto, tiramisu"],
      ["o3011", "u105", "r203", "delivered", 21.5, ts(2026, 9, 24, 18), "Vegan lasagna"],
      ["o3012", "u106", "r204", "delivered", 48.9, ts(2026, 9, 14, 19), "Salmon nigiri, miso soup"],
      ["o3013", "u107", "r207", "delivered", 36.2, ts(2026, 9, 11, 13), "Chicken shawarma plate"],
      ["o3014", "u107", "r201", "delivered", 26, ts(2026, 8, 30, 19), "Pad thai with chicken"],
      ["o3015", "u108", "r206", "delivered", 18.5, ts(2026, 9, 15, 12), "Pepperoni slice combo"],
      ["o3016", "u108", "r204", "delivered", 29.4, ts(2026, 9, 24, 18), "Spicy tuna roll, edamame"],
      ["o3017", "u106", "r206", "delivered", 26, ts(2026, 9, 21, 20), "Gluten-free margherita"],
      ["o3018", "u101", "r201", "delivered", 31, ts(2026, 9, 19, 19), "Pad thai with tofu, mango sticky rice"],
      ["o3019", "u105", "r205", "delivered", 47.6, ts(2026, 9, 22, 20), "Eggplant parmigiana, focaccia"],
      ["o3020", "u102", "r209", "delivered", 25.3, ts(2026, 9, 16, 13), "Drunken noodles, Thai iced tea"]
    ] }
  ];
  /* The rows this tour uses, and what each table's note says about them. */
  var PG_FOCUS = { restaurants: ["r209", "r201"], customers: ["u101"], orders: ["o3003", "o3001", "o3018"] };
  var PG_NOTES = {
    restaurants: "At 18:20, Lotus Thai's avg_delivery_min goes from 25 to 45. The agent offers Bangkok Street Kitchen instead.",
    customers: "Maya Chen is asking tonight. Her peanut allergy isn't in this table: Agent Memory has it from last week.",
    orders: "Maya's past orders: last week's green curry (o3003), and pad thai with tofu twice (o3001, o3018)."
  };
  /* The POSTGRES pill, copied from the published drawing: its outline, its bounding box, and that outline as a
     clip path for the button, in percent of the box. */
  var PG_PILL = "M132.663 127.145C137.158 127.145 141.635 128.149 145.084 130.141C146.062 130.705 147.288 131.625 148.282 132.806C149.215 133.914 149.927 135.23 150.068 136.685L150.089 136.978C150.089 137.819 150.139 138.739 150.163 139.593C150.188 140.465 150.187 141.278 150.093 141.952C149.783 144.171 148.18 146.209 145.084 147.996L96.3457 176.133C92.8977 178.123 88.3554 179.129 83.7939 179.129C79.2326 179.129 74.6911 178.123 71.2432 176.133C67.9454 174.229 65.9868 172.028 65.8174 169.705C65.7931 169.372 65.747 168.393 65.7305 167.413C65.7222 166.923 65.7212 166.438 65.7334 166.034C65.7461 165.615 65.7729 165.327 65.8057 165.205C66.3598 163.15 67.433 160.319 71.0928 158.286L71.0967 158.284L120.241 130.142L120.243 130.141C123.692 128.15 128.169 127.145 132.663 127.145Z";
  var PG_BOX = [65.7, 127.1, 84.5, 52];
  var PG_CLIP = "polygon(79.3% 0, 94% 5.8%, 100% 18.4%, 100% 28.5%, 94% 40.1%, 36.3% 94.2%, 21.4% 100%, 6.6% 94.2%, 0 81.8%, 0 74.6%, 6.3% 59.7%, 64.6% 5.8%)";

  /* ---- the same rows in Redis, shown when the reader selects the Redis logo ----
     Data Integration writes each row as a JSON document. Its job files give each table the key template
     Context Retriever reads ({table}:{id}), and the customers job leaves out email, as in the RDI demo. */
  function rdTable(t, prefix, drop) {
    var keep = t.columns.map(function (c, i) { return i > 0 && drop.indexOf(c) < 0 ? i : -1; }).filter(function (i) { return i > 0; });
    return { name: t.name, columns: ["key"].concat(keep.map(function (i) { return t.columns[i]; })),
      rows: t.rows.map(function (r) { return [prefix + r[0]].concat(keep.map(function (i) { return r[i]; })); }) };
  }
  var RD = [rdTable(PG[0], "restaurant:", []), rdTable(PG[1], "customer:", ["email"]), rdTable(PG[2], "order:", [])];
  var RD_FOCUS = { restaurants: ["restaurant:r209", "restaurant:r201"], customers: ["customer:u101"], orders: ["order:o3003", "order:o3001", "order:o3018"] };
  var RD_NOTES = {
    restaurants: "About a second after PostgreSQL changes, Data Integration writes Lotus Thai's new time to restaurant:r209.",
    customers: "The Data Integration job leaves out email, so addresses never reach Redis.",
    orders: "Maya's past orders. Context Retriever's filter_order tool finds them by customer_id."
  };
  /* The two data windows, and where to select each in the drawing: a button over the shape, and a ring on
     the shape's own outline that pulses on the step where the data changes. `changed` is Lotus Thai's row. */
  var DATA = {
    pg: { name: "Postgres", sub: "fooddelivery · public schema", label: "PostgreSQL", tables: PG, focus: PG_FOCUS, notes: PG_NOTES, changed: "r209", flipMs: 900,
      box: PG_BOX, clip: PG_CLIP, ring: '<path d="' + PG_PILL + '"/>' },
    redis: { name: "Redis", sub: "one JSON document per row", label: "Redis", tables: RD, focus: RD_FOCUS, notes: RD_NOTES, changed: "restaurant:r209", flipMs: 1400,
      box: [391.062, 172.175, 44.697, 45.2752], round: true,   // the Redis logo
      ring: '<rect x="388.062" y="169.175" width="50.697" height="51.2752" rx="25.3485"/>' }   // just outside the logo, which is the ring's red
  };

  /* --------------------------------------------------------------- the stage */

  /* The Iris architecture diagram from redis.io/iris, as published: four
     versions of the same 893 x 570 drawing, each with one service
     highlighted (static/images/ai/context-engine/iris-diagram/). A step
     shows one version, or blends several: "lighten" keeps whatever is lit
     in any of them, so it can light three services at once, and "darken"
     keeps only what's lit in all of them, which leaves the agent and the
     database. Packets ride an overlay in the same coordinates, along
     routes traced from the centres of the drawing's dashes. */
  var ART_W = 893, ART_H = 570;
  var ART = { rdi: "data-integration.svg", retriever: "context-retriever.svg", cache: "langcache.svg", memory: "agent-memory.svg" };
  var ROUTES = {
    pg: "M 126.9 162.7 L 127.9 163.4 L 128.7 163.9 L 131.6 165.4 L 133.5 166.6 L 134.9 167.5 L 137.8 169.0 L 139.7 170.2 L 141.1 171.0 L 144.0 172.6 L 145.9 173.7 L 147.3 174.6 L 150.2 176.2 L 151.2 176.8 L 152.9 177.6 L 154.1 178.0 L 158.3 178.0 L 159.7 177.6 L 161.4 176.7 L 162.2 176.3 L 164.7 174.8 L 166.6 173.7 L 168.0 173.0 L 170.5 171.4 L 172.3 170.4 L 173.7 169.6 L 176.2 168.1 L 178.1 167.1 L 179.5 166.3 L 182.0 164.8 L 183.8 163.8 L 185.3 163.0 L 187.7 161.5 L 189.6 160.4 L 191.0 159.7 L 193.5 158.1 L 195.3 157.1 L 196.8 156.3 L 199.2 154.8 L 201.1 153.8 L 202.5 153.0 L 205.0 151.5 L 206.9 150.5 L 208.3 149.7 L 210.8 148.2 L 212.6 147.1 L 214.1 146.4 L 216.5 144.8 L 217.6 144.3 L 219.2 143.5 L 220.4 143.2 L 224.7 143.1 L 226.0 143.5 L 227.0 143.9 L 227.6 144.3 L 228.4 144.8 L 230.9 146.1 L 232.5 147.1 L 233.9 148.0 L 236.3 149.3 L 238.0 150.3 L 239.4 151.1 L 241.8 152.4 L 243.5 153.4 L 244.8 154.2 L 247.1 155.5 L 247.3 155.5 L 248.3 156.2",
    rdi: "M 296.6 177.5 L 297.4 177.9 L 298.4 178.5 L 301.0 180.1 L 302.4 180.9 L 304.3 181.9 L 306.8 183.5 L 308.2 184.3 L 310.1 185.4 L 312.6 186.9 L 314.1 187.7 L 316.0 188.8 L 318.5 190.3 L 319.9 191.1 L 321.8 192.2 L 324.3 193.8 L 325.8 194.6 L 327.6 195.6 L 330.1 197.2 L 331.6 198.0 L 333.5 199.0 L 336.0 200.6 L 337.4 201.4 L 339.3 202.5 L 341.8 204.0 L 343.3 204.8 L 345.1 205.9 L 347.6 207.5 L 349.1 208.3 L 351.0 209.3 L 353.5 210.9 L 354.9 211.7 L 356.8 212.7 L 359.3 214.3 L 359.3 214.3 L 360.1 214.7",
    dbcr: "M 461.0 271.6 L 461.7 272.1 L 462.7 272.7 L 465.3 274.1 L 466.6 274.9 L 468.4 275.9 L 470.9 277.3 L 472.3 278.1 L 474.0 279.2 L 476.6 280.6 L 477.9 281.4 L 479.7 282.4 L 482.3 283.8 L 483.6 284.6 L 485.4 285.7 L 487.9 287.1 L 489.3 287.9 L 491.0 288.9 L 493.6 290.3 L 495.0 291.1 L 496.7 292.2 L 499.3 293.6 L 500.6 294.4 L 502.4 295.4 L 504.8 296.8 L 505.0 296.8 L 505.7 297.3",
    amdb: "M 748.4 276.7 L 744.0 274.2 L 738.1 270.8 L 732.2 267.4 L 726.3 264.0 L 720.5 260.6 L 714.6 257.2 L 708.7 253.8 L 702.8 250.4 L 696.9 247.0 L 691.1 243.6 L 685.2 240.2 L 679.3 236.9 L 673.4 233.5 L 667.6 230.1 L 661.7 226.7 L 655.8 223.3 L 649.9 219.9 L 644.0 216.5 L 638.2 213.1 L 632.3 209.7 L 626.4 206.3 L 620.5 202.9 L 614.7 199.5 L 608.8 196.1 L 602.9 192.7 L 597.0 189.3 L 591.1 186.0 L 585.3 182.6 L 579.4 179.2 L 573.5 175.8 L 570.4 173.9 L 563.9 171.3 L 556.7 169.6 L 548.9 168.9 L 541.1 169.2 L 533.6 170.4 L 526.7 172.7 L 521.6 175.3 L 516.2 178.4 L 510.2 181.9 L 504.2 185.3 L 498.2 188.8 L 492.2 192.2 L 486.2 195.7 L 480.2 199.2 L 474.2 202.6 L 468.2 206.1 L 464.1 208.5",
    dblc: "M 362.6 275.7 L 359.3 277.7 L 353.4 281.1 L 347.5 284.5 L 341.7 287.9 L 335.8 291.2 L 330.0 294.6 L 324.1 298.0 L 318.2 301.4 L 312.4 304.8 L 309.2 306.6 L 304.7 310.3 L 301.7 314.5 L 300.5 319.0 L 300.9 323.5 L 303.2 327.8 L 307.0 331.8 L 311.6 334.7 L 316.8 337.8 L 322.7 341.2 L 328.6 344.6 L 334.5 348.0 L 340.4 351.4 L 346.3 354.8 L 352.2 358.2 L 358.0 361.6 L 363.9 365.0 L 369.8 368.4 L 375.7 371.8 L 381.6 375.2 L 387.5 378.6 L 393.4 382.0 L 399.3 385.4 L 405.2 388.8 L 411.1 392.2 L 416.9 395.6 L 422.8 399.0 L 428.7 402.4 L 434.6 405.8 L 440.5 409.2 L 446.4 412.6 L 452.3 416.0 L 458.2 419.4 L 464.1 422.8 L 470.0 426.2 L 475.8 429.6 L 481.7 433.0 L 486.8 435.9",
    cragent: "M 582.0 334.6 L 598.0 343.9 L 617.6 355.1",
    cragent2: "M 610.2 361.2 L 588.8 348.9 L 574.6 340.7",
    amagent: "M 728.8 334.6 L 711.2 344.7 L 689.7 357.1",
    amagent2: "M 697.6 364.2 L 721.0 350.8 L 736.8 341.7",
    lcagent: "M 572.3 436.8 L 595.2 423.6 L 610.7 414.7",
    lcagent2: "M 602.9 407.7 L 585.6 417.6 L 564.5 429.8",
    maya: "M 719.7 437.5 L 703.7 428.2 L 684.1 417.0",
    maya2: "M 691.5 410.9 L 712.9 423.2 L 727.1 431.4"
  };
  /* Where to select each part of the drawing, and where each value tag sits:
     x, y (the tag's bottom edge), and which side it hangs from. */
  var HITS = { rdi: [292, 180, 52], redis: [413, 230, 44], retriever: [540, 318, 36],
    memory: [773, 307, 36], agent: [651, 385, 36], cache: [526, 469, 36], maya: [761, 455, 36] };
  var TAG_SPOTS = { cache: [484, 470, "r"], memory: [872, 262, "r"] };
  /* What each step shows: which versions of the drawing, how they blend,
     and what moves. Groups run in order; the routes in a group run together.
     A tag appears when the group it belongs to arrives. */
  var FLOWS = {
    rdi: { layers: ["rdi"], groups: [[["pg"]], [["rdi"]]] },   // no tag: the step card shows the change that lands
    ask: { layers: ["rdi", "retriever", "cache", "memory"], blend: "darken", groups: [[["maya"]]] },   // no tag: the step card shows her message
    cache: { layers: ["cache"], groups: [[["lcagent2"]], [["dblc", 1]], [["dblc"]], [["lcagent"]]], tags: [[2, "cache", "cache hit · 0.92 · 41 ms"]] },
    memory: { layers: ["memory"], groups: [[["amagent2"]], [["amdb"]], [["amdb", 1]], [["amagent"]]], tags: [[2, "memory", "5 memories"]] },
    retriever: { layers: ["retriever"],
      groups: [[["cragent2"]], [["dbcr"]], [["cragent"]], [["cragent2"]], [["dbcr"]], [["cragent"]], [["cragent2"]], [["dbcr"]], [["cragent"]]] },   // no tags: the step card lists the three calls
    reply: { layers: ["retriever", "memory", "cache"], groups: [[["cragent"], ["amagent"], ["lcagent"]], [["maya2"]]] }   // no tag: the step card shows the reply
  };
  var STEP_OF = { rdi: 0, redis: 0, maya: 1, cache: 2, memory: 3, retriever: 4, agent: 5 };
  /* ---- Maya, the user, drawn in the diagram's own style ----
     The drawing has no user, so the stage adds one: the agent's disc and
     label box, moved to the empty lower right, with a person where the
     agent has a robot. Her link to the agent is the Context Retriever's pair
     of arrows turned half a turn about the agent's disc; both discs look the
     same that way round, so the arrows meet them as the drawing's do. The
     link is lit on the steps she's part of. */
  var MAYA = {
    move: [110.06, 69.065],   // from the agent's disc to Maya's
    rim: "M626.802 419.618C621.381 416.488 617.95 409.911 617.794 400.63C617.482 382.067 630.387 359.713 646.62 350.702C654.736 346.197 662.147 345.88 667.568 349.009L674.93 352.459C680.351 355.589 683.782 362.166 683.938 371.447C684.25 390.01 671.345 412.364 655.112 421.375C646.996 425.88 639.585 426.197 634.164 423.067L626.802 419.618Z",
    face: "M655.897 421.803C671.75 412.649 684.602 390.389 684.602 372.083C684.603 353.777 671.752 346.358 655.899 355.511C640.046 364.664 627.193 386.924 627.193 405.23C627.192 423.536 640.044 430.956 655.897 421.803Z",
    icon: [28.7085, -16.5775, 0, 33.1498, 765.955, 457.72],   // the disc face's plane, in units of its radius
    link: [-1, 0, 0, -1, 1301.74, 772.07],   // half a turn about the agent's disc
    arrows: ["M619.301 356.381C619.585 356.381 619.815 356.247 619.814 356.083L619.804 353.41C619.804 353.246 619.573 353.114 619.289 353.114C619.005 353.114 618.775 353.248 618.776 353.412L618.784 355.788L614.669 355.793C614.385 355.793 614.155 355.926 614.155 356.09C614.156 356.254 614.387 356.387 614.671 356.387L619.301 356.381ZM582.472 334.495C582.271 334.379 581.945 334.38 581.745 334.496C581.544 334.612 581.545 334.8 581.746 334.916L582.109 334.706L582.472 334.495ZM582.109 334.706L581.746 334.916L618.937 356.294L619.3 356.084L619.663 355.874L582.472 334.495L582.109 334.706Z",
      "M609.695 361.335C609.896 361.45 610.222 361.45 610.422 361.334C610.623 361.217 610.622 361.029 610.421 360.914L610.058 361.124L609.695 361.335ZM572.866 339.449C572.582 339.449 572.352 339.582 572.353 339.746L572.363 342.419C572.363 342.583 572.594 342.716 572.878 342.716C573.162 342.715 573.392 342.582 573.392 342.418L573.383 340.042L577.498 340.037C577.782 340.037 578.012 339.903 578.012 339.739C578.011 339.575 577.78 339.443 577.496 339.443L572.866 339.449ZM572.867 339.746L572.504 339.956L609.695 361.335L610.058 361.124L610.421 360.914L573.23 339.535L572.867 339.746Z"],
    dots: [[589.669, 338.86], [600.591, 355.661]],
    label: [800, 442.7, 38.3, 24.751]
  };

  var MISSING_ROUTES = { rdi: ["pg", "rdi"], retriever: ["dbcr", "cragent", "cragent2"], memory: ["amdb", "amagent", "amagent2"], cache: ["dblc", "lcagent", "lcagent2"] };

  /* ---- the Data Integration gear turns, as it does on redis.io/iris ----
     The published drawing is still, so the stage draws its own gear over it:
     the drawing's own outline, turned in the gear's plane and extruded along
     its axis. The numbers are fitted to the drawing: c and A map the gear's
     plane to the page, with the hole as a unit circle; d is the extrusion;
     outer and hole are the outline in the plane, and corner lists the sharp
     corners of outer; front is the front face as path data in the plane. At
     angle 0 the gear matches the drawing. Over the area the gear sweeps
     (clip), the stage repaints the background and then the dashes and dots
     the drawing has in front of the gear, copied from the drawing itself:
     GEAR_AHEAD lists them by position in data-integration.svg, where the
     gear is lit, and in context-retriever.svg, where it's dimmed. */
  var GEAR = {
    c: [295.664, 181.039], A: [[11.1528, 11.3054], [-19.3183, 6.5268]], d: [-6.186000000000007, -3.5720000000000027],
    outer: [
      -0.422, 2.822, -0.361, 2.83, -0.299, 2.837, -0.237, 2.842, -0.175, 2.846, -0.114, 2.848, -0.051, 2.849, 0.011, 2.849, 0.072, 2.848, 0.134, 2.845, 0.196, 2.842, 0.258, 2.837,
      0.32, 2.83, 0.381, 2.822, 0.611, 1.822, 0.624, 1.802, 0.681, 1.782, 0.736, 1.761, 0.791, 1.738, 0.846, 1.713, 0.857, 1.714, 1.745, 2.267, 1.798, 2.226, 1.85, 2.184,
      1.901, 2.141, 1.952, 2.097, 2.001, 2.051, 2.05, 2.004, 2.104, 1.949, 2.156, 1.893, 2.207, 1.836, 2.256, 1.778, 2.303, 1.72, 1.755, 0.863, 1.753, 0.819, 1.786, 0.748,
      1.815, 0.676, 1.842, 0.604, 1.856, 0.588, 2.876, 0.36, 2.888, 0.266, 2.896, 0.171, 2.901, 0.075, 2.902, -0.02, 2.901, -0.115, 2.896, -0.21, 2.888, -0.306, 2.876, -0.4,
      1.84, -0.631, 1.829, -0.64, 1.827, -0.646, 1.801, -0.712, 1.773, -0.777, 1.742, -0.841, 1.744, -0.886, 2.303, -1.76, 2.256, -1.819, 2.207, -1.877, 2.157, -1.933, 2.104, -1.989,
      2.05, -2.044, 2.001, -2.091, 1.952, -2.137, 1.901, -2.182, 1.85, -2.224, 1.798, -2.266, 1.745, -2.307, 0.82, -1.73, 0.812, -1.729, 0.809, -1.73, 0.751, -1.754, 0.693, -1.777,
      0.634, -1.798, 0.621, -1.818, 0.381, -2.863, 0.32, -2.87, 0.258, -2.877, 0.196, -2.882, 0.134, -2.886, 0.072, -2.888, 0.011, -2.89, -0.051, -2.89, -0.113, -2.888, -0.175, -2.886,
      -0.237, -2.882, -0.299, -2.877, -0.361, -2.87, -0.422, -2.863, -0.665, -1.802, -0.679, -1.783, -0.73, -1.763, -0.782, -1.742, -0.832, -1.719, -0.841, -1.718, -0.844, -1.72, -1.786, -2.307,
      -1.839, -2.266, -1.891, -2.225, -1.942, -2.182, -1.992, -2.137, -2.042, -2.091, -2.091, -2.044, -2.145, -1.99, -2.197, -1.934, -2.248, -1.877, -2.297, -1.819, -2.344, -1.76, -1.761, -0.85,
      -1.759, -0.806, -1.793, -0.731, -1.823, -0.656, -1.833, -0.643, -1.836, -0.641, -2.917, -0.401, -2.929, -0.306, -2.937, -0.211, -2.941, -0.116, -2.943, -0.02, -2.941, 0.075, -2.937, 0.17,
      -2.929, 0.265, -2.917, 0.36, -1.852, 0.598, -1.839, 0.613, -1.806, 0.698, -1.77, 0.783, -1.772, 0.826, -2.344, 1.72, -2.297, 1.778, -2.248, 1.836, -2.197, 1.893, -2.145, 1.949,
      -2.091, 2.004, -2.042, 2.051, -1.992, 2.097, -1.942, 2.141, -1.891, 2.184, -1.839, 2.226, -1.786, 2.266, -0.88, 1.702, -0.869, 1.702, -0.819, 1.725, -0.77, 1.747, -0.719, 1.767,
      -0.669, 1.786, -0.655, 1.806
    ],
    corner: [0, 13, 14, 15, 21, 32, 33, 34, 38, 39, 47, 49, 53, 54, 55, 66, 72, 73, 74, 87, 88, 89, 95, 106, 107, 108, 111, 113, 121, 122, 125, 126, 127, 138, 144, 145],
    hole: [
      0, 1, -0.063, 0.998, -0.127, 0.992, -0.189, 0.982, -0.251, 0.968, -0.313, 0.95, -0.373, 0.928, -0.432, 0.902, -0.49, 0.872, -0.546, 0.838, -0.601, 0.8, -0.653, 0.758,
      -0.703, 0.712, -0.764, 0.645, -0.819, 0.575, -0.866, 0.5, -0.907, 0.422, -0.94, 0.342, -0.966, 0.259, -0.984, 0.174, -0.996, 0.087, -0.999, 0, -0.996, -0.087, -0.984, -0.174,
      -0.966, -0.259, -0.94, -0.342, -0.907, -0.422, -0.866, -0.5, -0.819, -0.575, -0.764, -0.645, -0.703, -0.712, -0.653, -0.758, -0.601, -0.8, -0.546, -0.838, -0.49, -0.872, -0.432, -0.902,
      -0.373, -0.928, -0.313, -0.95, -0.251, -0.968, -0.189, -0.982, -0.127, -0.992, -0.063, -0.998, 0, -1, 0.063, -0.998, 0.127, -0.992, 0.189, -0.982, 0.252, -0.968, 0.313, -0.95,
      0.373, -0.928, 0.432, -0.902, 0.49, -0.872, 0.546, -0.838, 0.601, -0.8, 0.653, -0.758, 0.703, -0.712, 0.764, -0.645, 0.819, -0.575, 0.866, -0.5, 0.907, -0.422, 0.94, -0.342,
      0.966, -0.259, 0.984, -0.174, 0.996, -0.087, 0.999, 0, 0.996, 0.087, 0.984, 0.174, 0.966, 0.259, 0.94, 0.342, 0.907, 0.422, 0.866, 0.5, 0.819, 0.575, 0.764, 0.645,
      0.703, 0.712, 0.653, 0.758, 0.601, 0.8, 0.546, 0.838, 0.49, 0.872, 0.432, 0.902, 0.373, 0.928, 0.313, 0.95, 0.252, 0.968, 0.189, 0.982, 0.127, 0.992, 0.063, 0.998
    ],
    front: "M -0.422 2.822 C -0.156 2.859 0.115 2.859 0.381 2.822 L 0.611 1.822 C 0.613 1.811 0.618 1.804 0.624 1.802 C 0.7 1.777 0.773 1.747 0.846 1.713 C 0.85 " +
      "1.711 0.854 1.711 0.857 1.714 L 1.745 2.267 C 1.851 2.187 1.953 2.1 2.05 2.004 C 2.142 1.914 2.226 1.818 2.303 1.72 L 1.755 0.863 C 1.747 0.852 1.746 " +
      "0.832 1.753 0.819 C 1.787 0.748 1.817 0.676 1.842 0.604 C 1.845 0.595 1.85 0.589 1.856 0.588 L 2.876 0.36 C 2.911 0.108 2.911 -0.148 2.876 -0.4 L " +
      "1.84 -0.631 C 1.836 -0.632 1.832 -0.636 1.829 -0.64 L 1.827 -0.646 C 1.802 -0.712 1.774 -0.777 1.742 -0.841 C 1.735 -0.854 1.736 -0.874 1.744 -0.886 " +
      "L 2.303 -1.76 C 2.226 -1.859 2.142 -1.954 2.05 -2.044 C 1.953 -2.14 1.851 -2.227 1.745 -2.307 L 0.82 -1.73 C 0.818 -1.729 0.815 -1.728 0.812 -1.729 L " +
      "0.809 -1.73 C 0.752 -1.755 0.693 -1.778 0.634 -1.798 C 0.628 -1.8 0.623 -1.808 0.621 -1.818 L 0.381 -2.863 C 0.115 -2.899 -0.156 -2.899 -0.422 -2.863 " +
      "L -0.665 -1.802 C -0.667 -1.792 -0.672 -1.785 -0.679 -1.783 C -0.731 -1.764 -0.782 -1.742 -0.832 -1.719 C -0.835 -1.718 -0.838 -1.718 -0.841 -1.718 L " +
      "-0.844 -1.72 L -1.786 -2.307 C -1.892 -2.227 -1.994 -2.14 -2.091 -2.044 C -2.183 -1.954 -2.267 -1.859 -2.344 -1.76 L -1.761 -0.85 C -1.754 -0.838 " +
      "-1.753 -0.819 -1.759 -0.806 C -1.783 -0.756 -1.804 -0.707 -1.823 -0.656 C -1.825 -0.65 -1.829 -0.645 -1.833 -0.643 L -1.836 -0.641 L -2.917 -0.401 C " +
      "-2.952 -0.148 -2.952 0.108 -2.917 0.36 L -1.852 0.598 C -1.847 0.599 -1.841 0.605 -1.839 0.613 C -1.819 0.67 -1.796 0.727 -1.77 0.783 C -1.764 0.796 " +
      "-1.765 0.815 -1.772 0.826 L -2.344 1.72 C -2.267 1.818 -2.183 1.913 -2.091 2.004 C -1.994 2.099 -1.892 2.187 -1.786 2.266 L -0.88 1.702 C -0.877 1.7 " +
      "-0.873 1.7 -0.869 1.702 C -0.803 1.734 -0.737 1.762 -0.669 1.786 C -0.662 1.789 -0.657 1.796 -0.655 1.806 L -0.422 2.822 Z M 0 1 C -0.253 1 -0.508 " +
      "0.904 -0.703 0.712 C -0.898 0.52 -0.999 0.263 -0.999 0 C -0.999 -0.263 -0.898 -0.52 -0.703 -0.712 C -0.508 -0.904 -0.253 -1 0 -1 C 0.253 -1 0.508 " +
      "-0.904 0.703 -0.712 C 0.898 -0.52 0.999 -0.263 0.999 0 C 0.999 0.263 0.898 0.52 0.703 0.712 C 0.508 0.904 0.253 1 0 1 Z",
    clip: "M240.8 205.2 L241.0 199.6 L241.7 193.7 L242.8 187.7 L244.4 181.6 L246.4 175.5 L248.9 169.4 L251.7 163.4 L254.9 157.5 L258.4 151.8 L262.2 146.3 L266.3 141.2 L270.6 136.4 L275.0 131.9 L279.7 128.0 L284.4 124.5 L289.1 121.5 L293.9 119.0 L298.6 117.2 L303.3 115.9 L307.8 115.2 L312.1 115.0 L316.2 115.5 L320.1 116.6 L323.6 118.3 L329.8 121.9 L333.1 124.1 L335.9 126.9 L338.4 130.2 L340.5 134.0 L342.1 138.3 L343.3 142.9 L344.0 148.0 L344.3 153.3 L344.1 159.0 L343.4 164.8 L342.3 170.8 L340.7 176.9 L338.7 183.0 L336.3 189.1 L333.5 195.1 L330.3 201.0 L326.8 206.7 L323.0 212.2 L318.9 217.3 L314.6 222.2 L310.1 226.6 L305.5 230.5 L300.8 234.0 L296.0 237.0 L291.2 239.5 L286.5 241.3 L281.9 242.6 L277.4 243.4 L273.0 243.5 L268.9 243.0 L265.1 241.9 L261.5 240.2 L255.3 236.6 L252.1 234.4 L249.2 231.6 L246.7 228.3 L244.7 224.5 L243.0 220.2 L241.8 215.6 L241.1 210.5Z"
  };
  var GEAR_AHEAD = { lit: [13, 14, 25, 46, 47, 48, 50], dim: [11, 12, 39, 40, 41] };
  var GEAR_SPEED = 45;   // degrees a second, clockwise: one tooth a second, as on redis.io/iris

  function buildMaya(NS) {
    var g = document.createElementNS(NS, "g"), L = MAYA.label;
    g.setAttribute("class", "iris-maya");
    g.innerHTML = '<g class="iris-maya-link" transform="matrix(' + MAYA.link.join(" ") + ')">' +
        MAYA.arrows.map(function (d) { return '<path fill="#5C707A" d="' + d + '"/>'; }).join("") +
        MAYA.dots.map(function (c) { return '<circle fill="#B9C2C6" r="2.52025" cx="' + c[0] + '" cy="' + c[1] + '"/>'; }).join("") + "</g>" +
      '<g transform="translate(' + MAYA.move.join(" ") + ')">' +
        '<path stroke-width="0.840082" stroke="#5C707A" fill="#091A23" fill-rule="evenodd" clip-rule="evenodd" d="' + MAYA.rim + '"/>' +
        '<path stroke-width="0.840082" stroke="#5C707A" fill="#163341" d="' + MAYA.face + '"/></g>' +
      '<g class="iris-maya-icon" transform="matrix(' + MAYA.icon.join(" ") + ')" fill="none" stroke="#fff" stroke-width="0.042" stroke-linecap="round" stroke-linejoin="round">' +
        '<circle cx="0" cy="-0.3" r="0.17"/><path d="M -0.38 0.44 C -0.38 0.16 -0.2 0.02 0 0.02 C 0.2 0.02 0.38 0.16 0.38 0.44 Z"/></g>' +
      '<rect fill="#163341" stroke="#8A99A0" stroke-width="0.840082" rx="3.78037" x="' + L[0] + '" y="' + L[1] + '" width="' + L[2] + '" height="' + L[3] + '"/>' +
      '<text class="iris-maya-name" x="' + (L[0] + L[2] / 2 + 0.15) + '" y="' + (L[1] + 16.07) + '" text-anchor="middle">MAYA</text>';
    return g;
  }

  /* The turning gear, drawn into the stage's overlay once the copies of what's in front of it arrive.
     Without them it stays out, and the drawing's own still gear shows. */
  function buildGear(over, artBase, uid) {
    var NS = "http://www.w3.org/2000/svg", c = GEAR.c, A = GEAR.A, d = GEAR.d, front = GEAR.front.split(" ");
    var corner = {};
    GEAR.corner.forEach(function (i) { corner[i] = true; });
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "iris-gear is-lit");
    g.setAttribute("clip-path", "url(#" + uid + "-gear)");
    g.innerHTML = '<path class="iris-gear-patch" d="' + GEAR.clip + '"/>' +
      '<g class="iris-gear-body"><path class="iris-gear-back"/><g class="iris-gear-walls"></g><path class="iris-gear-face"/></g>' +
      '<g class="iris-gear-ahead is-lit"></g><g class="iris-gear-ahead is-dim"></g>';
    var back = g.querySelector(".iris-gear-back"), face = g.querySelector(".iris-gear-face"), walls = g.querySelector(".iris-gear-walls"), pool = [];

    /* A point in the gear's plane, turned, then placed on the page (and moved by ox, oy). */
    function pt(x, y, cs, sn, ox, oy) {
      var u = x * cs - y * sn, v = x * sn + y * cs;
      return [c[0] + A[0][0] * u + A[0][1] * v + ox, c[1] + A[1][0] * u + A[1][1] * v + oy];
    }
    function facePath(cs, sn, ox, oy) {
      var out = "", p;
      for (var i = 0; i < front.length; i++) {
        if (isNaN(front[i])) { out += front[i]; continue; }
        p = pt(+front[i], +front[i + 1], cs, sn, ox, oy);
        out += p[0].toFixed(2) + " " + p[1].toFixed(2) + " ";
        i++;
      }
      return out;
    }
    /* The side walls you can see: runs of outline edges whose outward normal points along d, split at
       sharp corners. Each run is drawn as the strip between its edges and their copy moved by d. */
    function addRuns(U, isHole, cs, sn, list) {
      var n = U.length / 2, P = [], vis = [], area = 0, i, k = 0, run = null;
      for (i = 0; i < n; i++) P.push(pt(U[2 * i], U[2 * i + 1], cs, sn, 0, 0));
      for (i = 0; i < n; i++) area += P[i][0] * P[(i + 1) % n][1] - P[(i + 1) % n][0] * P[i][1];
      var side = (area > 0 ? 1 : -1) * (isHole ? -1 : 1);   // the solid's outward normal, for this winding
      for (i = 0; i < n; i++) {
        var ex = P[(i + 1) % n][0] - P[i][0], ey = P[(i + 1) % n][1] - P[i][1];
        vis.push(side * (ey * d[0] - ex * d[1]) > 0);
      }
      function starts(i) { return vis[i] !== vis[(i + n - 1) % n] || (!isHole && corner[i]); }
      for (i = 0; i < n; i++) if (starts(i)) { k = i; break; }
      for (var m = 0; m <= n; m++) {
        i = (k + m) % n;
        if (run && (m === n || starts(i))) { list.push(run); run = null; }
        if (m === n) break;
        if (vis[i]) { if (!run) run = [P[i]]; run.push(P[(i + 1) % n]); }
      }
    }
    function draw(deg) {
      var r = deg * Math.PI / 180, cs = Math.cos(r), sn = Math.sin(r), list = [], i, j;
      back.setAttribute("d", facePath(cs, sn, d[0], d[1]));
      face.setAttribute("d", facePath(cs, sn, 0, 0));
      addRuns(GEAR.outer, false, cs, sn, list);
      /* Far walls first. In the gear's plane, the side d points to is nearer the viewer. */
      list.forEach(function (w) {
        var sum = 0;
        w.forEach(function (p) { sum += (p[0] - c[0]) * d[0] + (p[1] - c[1]) * d[1]; });
        w.key = sum / w.length;
      });
      list.sort(function (a, b) { return a.key - b.key; });
      addRuns(GEAR.hole, true, cs, sn, list);
      for (i = 0; i < list.length; i++) {
        var w = list[i], s = "M";
        for (j = 0; j < w.length; j++) s += w[j][0].toFixed(2) + " " + w[j][1].toFixed(2) + " L";
        for (j = w.length - 1; j >= 0; j--) s += (w[j][0] + d[0]).toFixed(2) + " " + (w[j][1] + d[1]).toFixed(2) + (j ? " L" : "Z");
        if (!pool[i]) pool[i] = walls.appendChild(document.createElementNS(NS, "path"));
        pool[i].setAttribute("d", s);
        pool[i].style.display = "";
      }
      for (; i < pool.length; i++) pool[i].style.display = "none";
    }

    /* Turn only while the stage is on screen and the tab is visible. */
    var angle = 0, last = null, raf = 0, inView = true;
    function frame(now) {
      if (last !== null) angle = (angle + Math.min(100, now - last) / 1000 * GEAR_SPEED) % 360;
      last = now;
      draw(angle);
      raf = requestAnimationFrame(frame);
    }
    function run() {
      var go = inView && !document.hidden;
      if (go && !raf) raf = requestAnimationFrame(frame);
      else if (!go && raf) { cancelAnimationFrame(raf); raf = 0; last = null; }
    }
    function copy(file, idx, into) {
      return fetch(artBase + file).then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.text();
      }).then(function (txt) {
        var kids = new DOMParser().parseFromString(txt, "image/svg+xml").documentElement.children;
        idx.forEach(function (i) { if (!kids[i]) throw new Error("drawing changed"); into.appendChild(document.importNode(kids[i], true)); });
      });
    }
    Promise.all([copy(ART.rdi, GEAR_AHEAD.lit, g.querySelector(".iris-gear-ahead.is-lit")),
      copy(ART.retriever, GEAR_AHEAD.dim, g.querySelector(".iris-gear-ahead.is-dim"))]).then(function () {
      draw(0);
      over.insertBefore(g, over.querySelector(".iris-ring"));
      if (window.IntersectionObserver) new IntersectionObserver(function (es) { inView = es[0].isIntersecting; run(); }).observe(over);
      document.addEventListener("visibilitychange", run);
      run();
    }).catch(function () { /* the still drawing stays */ });
    return {
      /* Lit when the step's drawing lights Data Integration; "darken" keeps only what every version lights. */
      setLit: function (on) { g.classList.toggle("is-lit", on); }
    };
  }

  function buildStage(artBase, onPick, onData) {
    var uid = "iris" + Math.random().toString(36).slice(2, 8);
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var box = el("div", "iris-stage");
    box.setAttribute("role", "img");
    /* Two stacks of the four versions. A step blends its versions in the stack that isn't showing, then
       fades that stack in over the other, so a half-faded version never blends the wrong way. */
    var sets = [0, 1].map(function () {
      var set = el("div", "iris-artset"), layers = {};
      ["rdi", "retriever", "cache", "memory"].forEach(function (k) {
        var img = el("img", "iris-art");
        img.src = artBase + ART[k];
        img.alt = "";
        img.decoding = "async";
        img.draggable = false;
        set.appendChild(img);
        layers[k] = img;
      });
      box.appendChild(set);
      return { el: set, layers: layers };
    });
    var cur = sets[1];
    var NS = "http://www.w3.org/2000/svg";
    var over = document.createElementNS(NS, "svg");
    over.setAttribute("class", "iris-over");
    over.setAttribute("viewBox", "0 0 " + ART_W + " " + ART_H);
    over.setAttribute("aria-hidden", "true");
    over.innerHTML = '<defs><filter id="' + uid + '-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.4"/></filter>' +
      '<clipPath id="' + uid + '-gear"><path d="' + GEAR.clip + '"/></clipPath></defs>' +
      Object.keys(ROUTES).map(function (k) { return '<path id="' + uid + "-" + k + '" class="iris-route" d="' + ROUTES[k] + '"/>'; }).join("") +
      Object.keys(HITS).map(function (k) {
        var h = HITS[k];
        return '<circle class="iris-hit" data-node="' + k + '" cx="' + h[0] + '" cy="' + h[1] + '" r="' + h[2] + '"><title>' + esc(k === "redis" ? "Redis" : k === "maya" ? "Maya" :
          k === "agent" ? "Agent" : DEPTH[k]) + "</title></circle>";
      }).join("") + Object.keys(DATA).map(function (k) {
        return ["iris-ring", "iris-ring iris-pulse"].map(function (cls) { return DATA[k].ring.replace(/^<(\w+)/, '<$1 class="' + cls + '" data-src="' + k + '"'); }).join("");
      }).join("") + '<g class="iris-packets"></g>';
    box.appendChild(over);
    var maya = buildMaya(NS);
    over.insertBefore(maya, over.querySelector(".iris-route"));
    var mayaLink = maya.querySelector(".iris-maya-link");
    var packets = over.querySelector(".iris-packets");
    var gear = reduced ? null : buildGear(over, artBase, uid);
    /* Real buttons over POSTGRES and the Redis logo, so the data is reachable by keyboard too. They sit outside
       the drawing (role img) so assistive tech still finds them, and the data window opens over the drawing. */
    var wrap = el("div", "iris-stagewrap");
    wrap.appendChild(box);
    var dataBtns = {};
    Object.keys(DATA).forEach(function (k) {
      var D = DATA[k], b = el("button", "iris-databtn iris-" + k + "btn");
      b.type = "button";
      b.setAttribute("aria-label", "Show the sample data in " + D.label);
      b.title = "Show the sample data in " + D.label;
      b.style.left = (D.box[0] / ART_W * 100) + "%";
      b.style.top = (D.box[1] / ART_H * 100) + "%";
      b.style.width = (D.box[2] / ART_W * 100) + "%";
      b.style.height = (D.box[3] / ART_H * 100) + "%";
      if (D.clip) b.style.clipPath = D.clip;
      if (D.round) b.style.borderRadius = "50%";
      b.addEventListener("click", function () { onData(b, k); });
      wrap.appendChild(b);
      dataBtns[k] = b;
    });
    var tag = el("span", "iris-tag");
    tag.setAttribute("aria-hidden", "true");
    box.appendChild(tag);
    /* Selecting a part of the drawing jumps to the step about it. */
    Array.prototype.forEach.call(over.querySelectorAll(".iris-hit"), function (c) {
      c.addEventListener("click", function () { onPick(STEP_OF[c.getAttribute("data-node")]); });
    });
    var token = 0;

    /* Show some versions of the drawing: the first one as is, the rest blended onto it. */
    function compose(keys, blend) {
      var first = true, next = cur === sets[0] ? sets[1] : sets[0];
      ["rdi", "retriever", "cache", "memory"].forEach(function (k) {
        var on = keys.indexOf(k) >= 0, img = next.layers[k];
        img.classList.toggle("is-on", on);
        img.style.mixBlendMode = on && !first ? (blend || "lighten") : "normal";
        if (on) first = false;
      });
      /* The showing stack stays put underneath; the new one starts clear on top and fades in. */
      cur.el.style.transition = "none";
      cur.el.style.opacity = "1";
      cur.el.classList.remove("is-current");
      next.el.style.transition = "none";
      next.el.style.opacity = "0";
      box.insertBefore(next.el, cur.el.nextSibling);
      void next.el.offsetWidth;
      next.el.style.transition = "";
      next.el.style.opacity = "1";
      next.el.classList.add("is-current");
      cur = next;
      if (gear) gear.setLit(keys.indexOf("rdi") >= 0 && (keys.length === 1 || blend !== "darken"));
    }
    function setTag(node, text) {
      if (!node) { tag.classList.remove("is-on"); return; }
      var p = TAG_SPOTS[node];
      tag.textContent = text;
      tag.style.left = (p[0] / ART_W * 100) + "%";
      tag.style.top = (p[1] / ART_H * 100) + "%";
      tag.style.transform = "translate(" + { c: "-50%", r: "-100%", l: "0" }[p[2]] + ", -100%)";
      tag.classList.add("is-on");
    }
    function travel(key, back, tok) {
      return new Promise(function (resolve) {
        var path = over.querySelector("#" + uid + "-" + key);
        if (!path || tok !== token) return resolve();
        var len = path.getTotalLength(), dur = Math.max(560, len * 5.2), start = null;
        var g = document.createElementNS(NS, "g");
        g.setAttribute("class", "iris-pk");
        g.innerHTML = '<circle r="8" class="iris-pk-glow" filter="url(#' + uid + '-glow)"/><circle r="3.6" class="iris-pk-core"/>';
        packets.appendChild(g);
        function frame(now) {
          if (tok !== token) { g.remove(); return resolve(); }
          if (start === null) start = now;
          var t = Math.min(1, (now - start) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          var pt = path.getPointAtLength(back ? len * (1 - e) : len * e);
          g.setAttribute("transform", "translate(" + pt.x.toFixed(1) + " " + pt.y.toFixed(1) + ")");
          if (t < 1) requestAnimationFrame(frame);
          else { g.remove(); resolve(); }
        }
        requestAnimationFrame(frame);
      });
    }
    function wait(ms, tok) { return new Promise(function (r) { setTimeout(r, tok === token ? ms : 0); }); }
    /* Play a step's groups in order, then pause and loop, until the step changes. */
    function loop(flow, skip, tok) {
      var chain = Promise.resolve();
      flow.groups.forEach(function (g, i) {
        var live = g.filter(function (f) { return !skip[f[0]]; });
        chain = chain.then(function () {
          if (tok !== token || !live.length) return;
          return Promise.all(live.map(function (f) { return travel(f[0], !!f[1], tok); })).then(function () {
            (flow.tags || []).forEach(function (t) { if (t[0] === i && tok === token) setTag(t[1], t[2]); });
          });
        });
      });
      chain.then(function () { return wait(1400, tok); }).then(function () {
        if (tok !== token) return;
        setTag(null);
        return wait(350, tok).then(function () { if (tok === token) loop(flow, skip, tok); });
      });
    }

    return {
      el: wrap,
      art: box,
      dataBtns: dataBtns,
      show: function (stepKey, missing) {
        var tok = ++token;
        box.classList.toggle("is-step-rdi", stepKey === "rdi");   // POSTGRES and the Redis logo pulse on the step where the data changes
        mayaLink.classList.toggle("is-lit", stepKey === "ask" || stepKey === "reply" || stepKey === "whatif");
        setTag(null);
        Array.prototype.forEach.call(packets.childNodes, function (n) { n.remove(); });
        var flow = stepKey === "whatif" ? null : FLOWS[stepKey];
        var skip = {};
        if (stepKey === "whatif") {
          /* Every service, or every service but the missing one, with the reply flowing in. */
          var keys = ["rdi", "retriever", "cache", "memory"].filter(function (k) { return k !== missing; });
          compose(keys, "lighten");
          if (!missing) return;
          (MISSING_ROUTES[missing] || []).forEach(function (k) { skip[k] = true; });
          flow = FLOWS.reply;
        } else compose(flow.layers, flow.blend);
        if (reduced) {
          /* No movement: the tag for what the step produces shows at once. */
          var t = flow.tags && flow.tags[flow.tags.length - 1];
          if (t) setTag(t[1], t[2]);
          return;
        }
        loop(flow, skip, tok);
      }
    };
  }

  /* ------------------------------------------------------------------ view */

  function init(root) {
    var links = { rdi: root.getAttribute("data-link-rdi"), retriever: root.getAttribute("data-link-retriever"),
      memory: root.getAttribute("data-link-memory"), cache: root.getAttribute("data-link-cache") };
    var st = { step: 0, missing: null };
    var full = trace({ rdi: true, retriever: true, memory: true, cache: true });
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function go(i) {
      st.step = Math.max(0, Math.min(STEPS.length - 1, i));
      render();
      /* Keep the top of the tour in view, just under the site's sticky header, when a step changes its height. */
      var header = document.querySelector("header");
      var under = header && /sticky|fixed/.test(getComputedStyle(header).position) ? header.getBoundingClientRect().bottom : 0;
      var top = root.getBoundingClientRect().top;
      if (top < under) window.scrollTo({ top: window.pageYOffset + top - under - 16, behavior: reduced ? "instant" : "smooth" });
    }

    /* The one thing each step shows. */
    function fact(step) {
      var f = el("div", "iris-fact");
      if (step.key === "rdi") {
        f.innerHTML = '<div class="iris-factrow"><span class="iris-factlbl">PostgreSQL</span><code>UPDATE restaurants SET avg_delivery_min = 45 WHERE id = \'r209\';</code></div>' +
          '<div class="iris-factrow"><span class="iris-factlbl">Redis</span><span><code>restaurant:r209</code> <span class="iris-kv">avg_delivery_min: <b>45</b></span></span></div>';
      } else if (step.key === "ask") {
        f.appendChild(el("div", "rcr-msg rcr-user iris-askmsg", esc(MESSAGE)));
      } else if (step.key === "cache") {
        f.innerHTML = '<div class="iris-factrow"><span class="iris-factlbl">Asked</span><span>' + esc("“" + QUESTION + "”") + "</span></div>" +
          '<div class="iris-factrow"><span class="iris-factlbl">Matched</span><span>' + esc("“" + FEE_PROMPT + "”") + ' <span class="iris-kv">similarity ' + FEE_SIM.toFixed(2) + " · " + MS.cache + " ms</span></span></div>" +
          '<div class="iris-factrow"><span class="iris-factlbl">Answer</span><span>' + esc(FEE) + "</span></div>";
      } else if (step.key === "memory") {
        f.innerHTML = MEMORIES.slice(0, 3).map(function (m) {
          return '<div class="iris-factrow"><span class="iris-memtype">' + m.type + "</span><span>" + esc(m.text) + "</span></div>"; }).join("") +
          '<div class="iris-factrow iris-more"><span class="iris-factlbl"></span><span>and ' + (MEMORIES.length - 3) + " more, such as " + esc(MEMORIES[3].text.charAt(0).toLowerCase() + MEMORIES[3].text.slice(1).replace(/\.$/, "")) + "</span></div>";
      } else if (step.key === "retriever") {
        f.innerHTML = [
          ["get_restaurant_by_id", "id: r209", "Lotus Thai · " + BUSY + " minutes"],
          ["filter_restaurant", "austin · thai · up to " + WITHIN + " minutes", "Bangkok Street Kitchen · 30 minutes"],
          ["filter_order", "u101 · r201", "pad thai with tofu · 2 orders"]
        ].map(function (r) {
          return '<div class="iris-factrow iris-tool"><code class="iris-toolname">' + r[0] + '</code><span class="iris-kv">' + esc(r[1]) + '</span><span class="iris-toolres">→ ' + esc(r[2]) + "</span></div>";
        }).join("");
      } else if (step.key === "reply") {
        f.appendChild(replyBubble(full.reply));
        f.appendChild(el("div", "iris-totals", '<span><b class="rcr-mono">' + seconds(full.ms) + "</b> to reply</span>" +
          '<span><b class="rcr-mono">' + full.tokens + "</b> model output tokens</span>" + '<span class="rcr-faint">Illustrative timings and counts.</span>'));
      }
      return f;
    }
    var SOURCES = { rdi: "Data Integration", retriever: "Context Retriever", memory: "Agent Memory", cache: "LangCache" };
    function replyBubble(segments) {
      var wrap = el("div", "iris-reply");
      wrap.appendChild(el("div", "rcr-msg rcr-agent iris-replymsg", segments.map(function (x) {
        return x.src ? '<span class="iris-src iris-src-' + x.src + '" title="From ' + SOURCES[x.src] + '">' + esc(x.t.trim()) + "</span>" + (/\s$/.test(x.t) ? " " : "") : esc(x.t);
      }).join("")));
      wrap.appendChild(el("div", "iris-legend", ["rdi", "retriever", "memory", "cache"].map(function (k) {
        return '<span class="iris-key iris-src-' + k + '">From ' + SOURCES[k] + "</span>"; }).join("")));
      return wrap;
    }
    /* What the agent knows so far, one chip per fact, in its service's colour. */
    function tray(upTo) {
      var t = el("div", "iris-tray");
      t.appendChild(el("div", "rcr-lbl", "What the agent knows so far"));
      var chips = el("div", "iris-chips");
      var any = false;
      STEPS.slice(0, upTo + 1).forEach(function (s, i) {
        (s.adds || []).forEach(function (a) {
          any = true;
          chips.appendChild(el("span", "iris-chip iris-src-" + a.src + (i === upTo ? " is-new" : ""), esc(a.t)));
        });
      });
      if (!any) chips.appendChild(el("span", "rcr-faint", "Nothing yet."));
      t.appendChild(chips);
      return t;
    }
    function whatIf() {
      var box = el("div", "iris-whatif");
      var picks = el("div", "iris-picks");
      ["rdi", "retriever", "memory", "cache"].forEach(function (k) {
        var b = el("button", "rcr-chip iris-pick iris-svc-" + k + (st.missing === k ? " is-on" : ""), "Without " + esc(SOURCES[k]));
        b.type = "button";
        b.setAttribute("aria-pressed", st.missing === k ? "true" : "false");
        b.addEventListener("click", function () { st.missing = st.missing === k ? null : k; render(); });
        picks.appendChild(b);
      });
      box.appendChild(picks);
      if (!st.missing) { box.appendChild(el("p", "iris-pickhint rcr-faint", "Pick a service.")); return box; }
      var w = WHAT_IF[st.missing], on = { rdi: true, retriever: true, memory: true, cache: true };
      on[st.missing] = false;
      var c = trace(on).checks.filter(function (x) { return x.key === w.check; })[0];
      /* Excerpts start mid-reply, and get a trailing ellipsis only when they stop mid-sentence. */
      function excerpt(t) { return "…" + esc(t) + (/[.?!]$/.test(t) ? "" : "…"); }
      box.appendChild(el("div", "iris-compare",
        '<div class="iris-with"><span class="iris-cmplbl">With ' + esc(SOURCES[st.missing]) + "</span>" + excerpt(w.with) + "</div>" +
        '<div class="iris-without"><span class="iris-cmplbl">Without it</span>' + excerpt(w.without) + "</div>"));
      box.appendChild(el("div", "iris-check is-" + c.state, '<span class="iris-checkmark" aria-hidden="true">' + { ok: "✓", warn: "!", bad: "✗", slow: "✓" }[c.state] +
        '</span><span><span class="iris-checklabel">' + esc(c.label) + '</span><span class="iris-checktext">' + esc(c.text) + "</span></span>"));
      box.appendChild(el("p", "iris-why", esc(w.why)));
      return box;
    }

    /* ---- the data windows: PostgreSQL and Redis ---- */

    /* It opens over the drawing only, so the step stays readable and usable below it. */
    var modal = null, opener = null, dataSrc, dataTab, flipTimer = 0;
    function openData(from, src) {
      if (modal) return;
      opener = from;
      dataSrc = DATA[src];
      dataTab = "restaurants";
      modal = el("div", "iris-modal");
      var backdrop = el("div", "iris-backdrop");
      backdrop.addEventListener("click", function () { closeData(); });
      modal.appendChild(backdrop);
      var win = el("div", "iris-window");
      win.setAttribute("role", "dialog");
      win.setAttribute("aria-label", "Sample data in " + dataSrc.label);
      var head = el("div", "iris-winhead", '<span class="iris-winlbl">' + esc(dataSrc.name) + '</span><span class="iris-winsub">' + esc(dataSrc.sub) + "</span>");
      var close = el("button", "iris-close", "×");
      close.type = "button";
      close.setAttribute("aria-label", "Close");
      close.addEventListener("click", function () { closeData(); });
      head.appendChild(close);
      win.appendChild(head);
      var tabs = el("div", "iris-wintabs");
      tabs.setAttribute("role", "tablist");
      var body = el("div", "iris-winbody");
      dataSrc.tables.forEach(function (t) {
        var b = el("button", "iris-wintab", esc(t.name) + ' <span class="iris-wincount">' + t.rows.length + "</span>");
        b.type = "button";
        b.setAttribute("role", "tab");
        b.dataset.table = t.name;
        b.addEventListener("click", function () { dataTab = t.name; drawTable(body, tabs); b.focus(); });
        tabs.appendChild(b);
      });
      win.appendChild(tabs);
      win.appendChild(body);
      modal.appendChild(win);
      stage.el.appendChild(modal);
      stage.el.classList.add("is-data");
      drawTable(body, tabs);
      close.focus();
      document.addEventListener("keydown", onKey, true);
    }
    function drawTable(body, tabs) {
      clearTimeout(flipTimer);
      Array.prototype.forEach.call(tabs.children, function (b) { b.setAttribute("aria-selected", b.dataset.table === dataTab ? "true" : "false"); });
      var t = dataSrc.tables.filter(function (x) { return x.name === dataTab; })[0], focus = dataSrc.focus[t.name];
      /* On step 1 the change happens while you watch: Lotus Thai's time flips from 25 to 45. */
      var live = STEPS[st.step].key === "rdi" && !reduced;
      var html = '<div class="iris-tablewrap" tabindex="0" role="region" aria-label="' + esc(t.name) + ' table"><table class="iris-pgtable"><thead><tr>' + t.columns.map(function (c, i) { return "<th" + (typeof t.rows[0][i] === "number" ? ' class="is-num"' : "") + ">" + esc(c) + "</th>"; }).join("") + "</tr></thead><tbody>";
      t.rows.forEach(function (r) {
        var used = focus.indexOf(r[0]) >= 0, changed = r[0] === dataSrc.changed;
        html += "<tr" + (used ? ' class="is-used' + (changed ? " is-changed" : "") + '"' : "") + ">" + r.map(function (v, i) {
          var num = typeof v === "number";
          if (changed && t.columns[i] === "avg_delivery_min") {
            return '<td class="is-num iris-flip"><span class="iris-old">25</span> <span class="iris-new">' + (live ? "25" : "45") + "</span></td>";
          }
          return "<td" + (num ? ' class="is-num"' : "") + ">" + esc(v) + "</td>";
        }).join("") + "</tr>";
      });
      body.innerHTML = html + '</tbody></table></div><div class="iris-winnote">' + esc(dataSrc.notes[t.name]) + "</div>";
      /* The first column (id or key) stays pinned while the table scrolls sideways, and the name column too when there's room. */
      var wrap = body.querySelector(".iris-tablewrap"), table = wrap.firstChild, th = wrap.querySelectorAll("th");
      var two = th[0].offsetWidth + th[1].offsetWidth <= wrap.clientWidth * 0.55;
      table.classList.toggle("is-pin2", two);
      if (two) Array.prototype.forEach.call(wrap.querySelectorAll("tr > :nth-child(2)"), function (c) { c.style.left = th[0].offsetWidth + "px"; });
      wrap.addEventListener("scroll", function () { wrap.classList.toggle("is-scrolled", wrap.scrollLeft > 0); });
      /* On a narrow screen, scroll the changing cell into view, to a column edge so no column shows half hidden. */
      var cell = body.querySelector(".iris-flip");
      if (cell && cell.offsetLeft + cell.offsetWidth > wrap.clientWidth) {
        /* Header cells are sticky, so their offsets count from the window, not the table, as the cell's do. */
        var pinned = th[0].offsetWidth + (two ? th[1].offsetWidth : 0), left = cell.offsetLeft - pinned, x0 = th[0].offsetLeft;
        for (var k = two ? 2 : 1; k < th.length; k++) {
          if (cell.offsetLeft + cell.offsetWidth - (th[k].offsetLeft - x0 - pinned) <= wrap.clientWidth) { left = th[k].offsetLeft - x0 - pinned; break; }
        }
        wrap.scrollLeft = left;
        wrap.classList.add("is-scrolled");
      }
      /* And scroll down to the changing row when the window is short. */
      var row = cell && cell.parentNode;
      if (row && row.offsetTop + row.offsetHeight > wrap.clientHeight) wrap.scrollTop = row.offsetTop + row.offsetHeight - wrap.clientHeight;
      if (cell && live) {
        cell.classList.add("is-before");
        flipTimer = setTimeout(function () { cell.classList.remove("is-before"); cell.querySelector(".iris-new").textContent = "45"; cell.classList.add("is-flipped"); }, dataSrc.flipMs);
      }
    }
    /* keepFocus: the step changed, so focus stays on whatever changed it. */
    function closeData(keepFocus) {
      if (!modal) return;
      clearTimeout(flipTimer);
      document.removeEventListener("keydown", onKey, true);
      var inside = modal.contains(document.activeElement);
      modal.remove();
      modal = null;
      stage.el.classList.remove("is-data");
      if (opener && (!keepFocus || inside)) opener.focus();
    }
    function onKey(e) {
      if (modal && e.key === "Escape") { e.preventDefault(); closeData(); }
    }

    root.innerHTML = "";
    var stage = buildStage(root.getAttribute("data-art") || "", function (i) { if (i != null) go(i); }, openData);
    root.appendChild(stage.el);
    var below = el("div", "iris-below");
    root.appendChild(below);
    function render() {
      var step = STEPS[st.step];
      closeData(true);   // the drawing is what each step is about
      stage.show(step.key, step.key === "whatif" ? st.missing : null);
      stage.art.setAttribute("aria-label", "Step " + (st.step + 1) + ": " + step.title);
      below.innerHTML = "";
      var card = el("div", "rcr-card iris-stepcard" + (DEPTH[step.key] ? " iris-svc-" + step.key : ""));
      card.appendChild(el("div", "iris-stephead", '<span class="iris-count">Step ' + (st.step + 1) + " of " + STEPS.length + "</span>" +
        (step.at ? '<span class="iris-clock rcr-mono">Fri, Oct 2 · ' + step.at + " UTC</span>" : "")));
      card.appendChild(el("div", "iris-title", esc(step.title)));   // a div, not a heading, so the site's heading styles and anchors stay out
      card.appendChild(el("div", "iris-text", esc(step.text)));
      if (step.key === "whatif") card.appendChild(whatIf());
      else card.appendChild(fact(step));
      if (DEPTH[step.key] && links[step.key]) {
        var depth = el("a", "iris-depth", "See " + esc(DEPTH[step.key]) + " in depth →");
        depth.href = links[step.key];
        card.appendChild(depth);
      }
      below.appendChild(card);
      if (step.key !== "whatif" && step.key !== "reply") below.appendChild(tray(st.step));
      var nav = el("div", "iris-nav");
      var back = el("button", "rcr-btn", "Back");
      back.type = "button";
      back.disabled = st.step === 0;
      back.addEventListener("click", function () { go(st.step - 1); });
      var dots = el("div", "iris-dots");
      STEPS.forEach(function (s, i) {
        var d = el("button", "iris-dot" + (i === st.step ? " is-on" : "") + (i < st.step ? " is-done" : ""));
        d.type = "button";
        d.setAttribute("aria-label", "Step " + (i + 1) + ": " + s.title);
        if (i === st.step) d.setAttribute("aria-current", "step");
        d.addEventListener("click", function () { go(i); });
        dots.appendChild(d);
      });
      var last = st.step === STEPS.length - 1;
      var next = el("button", "rcr-btn rcr-btn-primary", last ? "Start over" : "Next");
      next.type = "button";
      next.addEventListener("click", function () { if (last) st.missing = null; go(last ? 0 : st.step + 1); });
      nav.appendChild(back);
      nav.appendChild(dots);
      nav.appendChild(next);
      below.appendChild(nav);
    }
    render();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".iris[data-iris]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.IrisDemo = { trace: trace, STEPS: STEPS, WHAT_IF: WHAT_IF, SERVICES: SERVICES, MEMORIES: MEMORIES, MESSAGE: MESSAGE, FEE: FEE };
})();

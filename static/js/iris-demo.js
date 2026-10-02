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
      text: "Lotus Thai's kitchen gets busy, so the app updates its delivery time in PostgreSQL. Data Integration captures the change and writes it to Redis about a second later. The services the agent calls read from that Redis database.",
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
    maya: "M 893 545 L 790 486 L 690 426"
  };
  /* Where to select each part of the drawing, and where each value tag sits:
     x, y (the tag's bottom edge), and which side it hangs from. */
  var HITS = { pg: [104, 158, 40], rdi: [292, 180, 52], redis: [413, 230, 44], retriever: [540, 318, 36],
    memory: [773, 307, 36], agent: [651, 385, 36], cache: [526, 469, 36] };
  var TAG_SPOTS = { redis: [413, 158, "c"], agent: [886, 548, "r"], cache: [484, 470, "r"], memory: [872, 262, "r"],
    retriever: [222, 470, "c"], maya: [886, 548, "r"] };
  /* What each step shows: which versions of the drawing, how they blend,
     and what moves. Groups run in order; the routes in a group run together.
     A tag appears when the group it belongs to arrives. */
  var FLOWS = {
    rdi: { layers: ["rdi"], groups: [[["pg"]], [["rdi"]]], tags: [[1, "redis", "restaurant:r209 · 45 min"]] },
    ask: { layers: ["rdi", "retriever", "cache", "memory"], blend: "darken", groups: [[["maya"]]], tags: [[0, "agent", "Maya: “…the curry I had last week…”"]] },
    cache: { layers: ["cache"], groups: [[["lcagent2"]], [["dblc", 1]], [["dblc"]], [["lcagent"]]], tags: [[2, "cache", "cache hit · 0.92 · 41 ms"]] },
    memory: { layers: ["memory"], groups: [[["amagent2"]], [["amdb"]], [["amdb", 1]], [["amagent"]]], tags: [[2, "memory", "5 memories"]] },
    retriever: { layers: ["retriever"],
      groups: [[["cragent2"]], [["dbcr"]], [["cragent"]], [["cragent2"]], [["dbcr"]], [["cragent"]], [["cragent2"]], [["dbcr"]], [["cragent"]]],
      tags: [[1, "retriever", "get_restaurant_by_id → 45 min"], [4, "retriever", "filter_restaurant → Bangkok St. Kitchen"], [7, "retriever", "filter_order → pad thai ×2"]] },
    reply: { layers: ["retriever", "memory", "cache"], groups: [[["cragent"], ["amagent"], ["lcagent"]], [["maya", 1]]], tags: [[1, "maya", "the reply, to Maya"]] }
  };
  var STEP_OF = { pg: 0, rdi: 0, redis: 0, cache: 2, memory: 3, retriever: 4, agent: 5 };
  var MISSING_ROUTES = { rdi: ["pg", "rdi"], retriever: ["dbcr", "cragent", "cragent2"], memory: ["amdb", "amagent", "amagent2"], cache: ["dblc", "lcagent", "lcagent2"] };

  function buildStage(artBase, onPick) {
    var uid = "iris" + Math.random().toString(36).slice(2, 8);
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var box = el("div", "iris-stage");
    box.setAttribute("role", "img");
    var layers = {};
    ["rdi", "retriever", "cache", "memory"].forEach(function (k) {
      var img = el("img", "iris-art");
      img.src = artBase + ART[k];
      img.alt = "";
      img.decoding = "async";
      img.draggable = false;
      box.appendChild(img);
      layers[k] = img;
    });
    var NS = "http://www.w3.org/2000/svg";
    var over = document.createElementNS(NS, "svg");
    over.setAttribute("class", "iris-over");
    over.setAttribute("viewBox", "0 0 " + ART_W + " " + ART_H);
    over.setAttribute("aria-hidden", "true");
    over.innerHTML = '<defs><filter id="' + uid + '-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.4"/></filter></defs>' +
      Object.keys(ROUTES).map(function (k) { return '<path id="' + uid + "-" + k + '" class="iris-route" d="' + ROUTES[k] + '"/>'; }).join("") +
      Object.keys(HITS).map(function (k) {
        var h = HITS[k];
        return '<circle class="iris-hit" data-node="' + k + '" cx="' + h[0] + '" cy="' + h[1] + '" r="' + h[2] + '"><title>' + esc(k === "redis" ? "Redis" : k === "pg" ? "PostgreSQL" :
          k === "agent" ? "Agent" : DEPTH[k]) + "</title></circle>";
      }).join("") + '<g class="iris-packets"></g>';
    box.appendChild(over);
    var packets = over.querySelector(".iris-packets");
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
      var first = true;
      ["rdi", "retriever", "cache", "memory"].forEach(function (k) {
        var on = keys.indexOf(k) >= 0, img = layers[k];
        img.classList.toggle("is-on", on);
        img.style.mixBlendMode = on && !first ? (blend || "lighten") : "normal";
        if (on) first = false;
      });
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
      el: box,
      show: function (stepKey, missing) {
        var tok = ++token;
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

    root.innerHTML = "";
    var stage = buildStage(root.getAttribute("data-art") || "", function (i) { if (i != null) go(i); });
    root.appendChild(stage.el);
    var below = el("div", "iris-below");
    root.appendChild(below);
    function render() {
      var step = STEPS[st.step];
      stage.show(step.key, step.key === "whatif" ? st.missing : null);
      stage.el.setAttribute("aria-label", "Step " + (st.step + 1) + ": " + step.title);
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

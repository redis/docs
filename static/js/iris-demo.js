/* =========================================================================
   Redis Iris scripted demo: a guided tour of one request
   Dependency-free. Everything runs in the browser against a scripted
   request; no Iris service, database, or model is called.

   One idea per step, on an animated isometric drawing after the Iris
   architecture diagram, where packets show each step's data moving:
   Maya asks the food delivery app's assistant to reorder last
   week's curry within 30 minutes and asks about the delivery fee, then
   Intent Router matches it to intents, Agent Playbooks, Agent Memory, and
   Context Gateway each add one part of the answer, and the model writes
   the reply. Lens then shows the request as it ran. The last step takes one
   service away and shows only the part of the reply it changes. Each step
   links to that service's docs or own demo, which cover it in depth; this
   page doesn't repeat their API detail.

   trace() models every combination of services: the request's steps and
   API shapes (matching the Intent Router match API, the Agent Playbooks discovery API, the Context
   Gateway MCP endpoint, and agent-memory-demo.js), the reply
   credited by source, and the scorecard. The tour shows the full trace,
   the Lens step shows its steps as Lens records them, and the last step
   compares it with one service missing. Modelled rather
   than observed: the similarity score, the agent's reasoning and reply,
   and the timings and token counts.

   Internal keys predate the current services and stay as they are, because
   the drawing, routes, and styles use them: "cache" is Agent Playbooks and
   "retriever" is Context Gateway. The drawing still shows the published
   LangCache and Context Retriever labels, so the stage draws the current
   names over them (RELABEL). The drawing also shows Data Integration,
   which the tour leaves out, so the stage covers that corner (COVER).

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
  var ASK_AT = "2026-10-02T18:24:10Z", REPLY_AT = "2026-10-02T18:24:13Z";
  var WITHIN = 30;   // minutes Maya can wait
  var MESSAGE = "Can you order the curry I had last week again? It needs to be here within 30 minutes. And how much is delivery these days?";
  var QUESTION = "How much is delivery these days?";
  var SURFACE = "3f8c2a1e-demo";

  function ts(y, m, d, h) { return Math.floor(Date.UTC(y, m - 1, d, h == null ? 12 : h) / 1000); }
  var LOTUS = { id: "r209", name: "Lotus Thai", cuisine: "thai", city: "austin", rating: 4.1, price_level: 1, avg_delivery_min: 25 };
  var BUSY = 45;   // Lotus Thai's delivery time tonight, after the kitchen got busy, as it stands in Redis
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
  /* The support playbook's published FAQ on the delivery fee. Discovery returns FAQs scored at or above the
     playbook's threshold, 0.7 by default. */
  var FEE_PROMPT = "How much is the delivery fee?";
  var FEE = "Delivery costs $1.99 to $4.99, depending on distance, and you see the exact fee at checkout. Plus members get free delivery on orders over $15.";
  /* Without the FAQ, the model answers the fee question on its own, in the same call that writes the reply. It doesn't
     know the app's fees, so its answer is vague. */
  var VAGUE = "Delivery fees depend on the restaurant and the distance, and you see the exact fee at checkout.";
  var FEE_SIM = 0.92, FEE_VERSION = 3, FEE_KEY = "delivery-fee";
  var FEE_INTENTS = ["What does delivery cost?", "Is delivery free for Plus members?"];
  /* The agent's Router matches Maya's message to two of its intents, best first. Each target tells the agent what to
     do: handle the reorder itself (food-assistant is the agent's ID), and call the support playbook's discovery tool for the fee question. */
  var INTENTS = [
    { name: "reorder", description: "The customer wants to order something they had before.", score: 0.86,
      target: { type: "agent", ref: "food-assistant.reorder" } },
    { name: "delivery_fee", description: "A general question about what delivery costs.", score: 0.78,
      target: { type: "tool", ref: "playbooks.discover_entries", args: { playbook: "support" } } }
  ];

  /* In the order the agent uses them. */
  var SERVICES = [
    { key: "router", name: "Intent Router", role: "Decides what each part of a message needs, without a model call" },
    { key: "retriever", name: "Context Gateway", role: "Gives the agent governed tools to read that data" },
    { key: "memory", name: "Agent Memory", role: "Remembers Maya across conversations" },
    { key: "cache", name: "Agent Playbooks", role: "Answers recurring questions with answers your business approved" }
  ];
  var NAMES = { router: "Intent Router", cache: "Agent Playbooks", memory: "Agent Memory", retriever: "Context Gateway", model: "Model" };
  /* Modelled timings (ms) and token counts. */
  var MS = { route: 12, plan: 1100, cache: 41, memory: 190, tool: [74, 88, 81], assemble: 1, reply: 1480, record: 25 };
  var TOKENS = { plan: 38 };

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
  function took(ms) { return ms >= 1000 ? seconds(ms) : ms + " ms"; }
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
  /* The Gateway serves each Upstream's tools under its namespace: fooddelivery.filter_order. */
  var GATEWAY_NS = "fooddelivery";
  function curlMcp(body) {
    return ["curl -X POST \"$IRIS_CONTEXT_GATEWAY_URL\" \\", "  -H \"Authorization: Bearer $IRIS_CONTEXT_GATEWAY_API_KEY\" \\", "  -H \"Content-Type: application/json\" \\",
      "  -H \"Accept: application/json, text/event-stream\" \\", "  -d " + shellQuote(JSON.stringify(body))].join("\n");
  }
  function playbookDiscover() {
    var request = { query: QUESTION, limit: 3 };
    return { method: "POST", path: "/discover", status: "200", request: request,
      response: { pinnedEntries: [], discoveredEntries: [{ entryId: "ent_" + id32("faq:" + FEE_KEY), entryKey: FEE_KEY, entryType: "faq", version: FEE_VERSION,
        intents: FEE_INTENTS, faq: { question: FEE_PROMPT, answer: FEE }, score: FEE_SIM }], truncated: false },
      curl: curlRest("$PLAYBOOK_URL/v1/playbooks/$PLAYBOOK_ID/discover", "$PLAYBOOK_API_KEY", request) };
  }
  function routerMatch() {
    var request = { query: MESSAGE, limit: 3 };
    return { method: "POST", path: "/match", status: "200", request: request, response: { items: INTENTS },
      curl: curlRest("$IRIS_INTENT_ROUTER_URL/iris/v2/intent/routers/$IRIS_INTENT_ROUTER_ID/match", "$IRIS_INTENT_ROUTER_API_KEY", request) };
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
  /* Context Surface results carry a _retrieval stamp, with fields sorted (as the Context Retriever demo returns them). */
  function stamp(rec) {
    var out = { _retrieval: { source: SURFACE, retrieved_at: ASK_AT.replace("Z", ".318Z"), source_version: 1 } };
    Object.keys(rec).sort().forEach(function (k) { out[k] = rec[k]; });
    return out;
  }
  function toolCall(n, name, args, result) {
    name = GATEWAY_NS + "." + name;
    var request = { jsonrpc: "2.0", id: n, method: "tools/call", params: { name: name, arguments: args } };
    return { method: "tools/call", path: name, status: "ok", args: args, request: request,
      response: { jsonrpc: "2.0", id: n, result: { content: [{ type: "text", text: JSON.stringify(result) }] } }, result: result, curl: curlMcp(request) };
  }
  function filterResult(rows) { return { count: rows.length, has_more: false, limit: 10, offset: 0, results: rows.map(stamp), total_count: rows.length }; }

  /* ------------------------------------------------------------ the model */

  /* Everything that happens for one combination of services: the steps of the request, each with its start
     (at) in ms from the message, the reply (as segments, each credited to the service it came from), and the
     scorecard. opts.drop names a memory that the app's code leaves out of the prompt, the bug the Lens step shows. */
  function trace(on, opts) {
    opts = opts || {};
    var steps = [], ms = 0, end = 0, tokens = 0, n = 0;
    var lotusRow = clone(LOTUS);
    lotusRow.avg_delivery_min = BUSY;
    var used = {};   // the memories that enter the prompt
    if (on.memory) MEMORIES.forEach(function (m) { if (m.key !== opts.drop) used[m.key] = true; });
    function add(s) {
      steps.push(s);
      if (s.ms) { s.at = end; end += s.ms; }
      if (s.ms && s.phase !== "record") ms += s.ms;
      if (s.tokens) tokens += s.tokens;
      return s;
    }

    /* Route */
    if (on.router) add({ phase: "route", service: "router", ms: MS.route, title: "Matches the message to intents",
      text: "Intent Router compares Maya's message with the example phrasings of the agent's intents, and finds two matches. " + code("reorder") +
        " points back to the agent, and " + code("delivery_fee") + " points at the support playbook. No model call decides this.",
      calls: [routerMatch()] });
    else {
      add({ phase: "route", service: "router", off: true, title: "No intents to match", text: "Intent Router is off, so nothing has sorted out what Maya's message needs." });
      add({ phase: "model", service: "model", ms: MS.plan, tokens: TOKENS.plan, title: "Plans the request",
        text: "A model call reads Maya's message first and works out what each part needs, which Intent Router would have matched without one." });
    }

    /* Recall */
    if (on.cache) add({ phase: "recall", service: "cache", ms: MS.cache, title: "Checks the support playbook for the general question",
      text: "The agent sends the general part of Maya's message to Agent Playbooks, " + code(QUESTION) + ". The published FAQ " + code(FEE_PROMPT) +
        " scores " + FEE_SIM.toFixed(2) + ", above the playbook's threshold, so its approved answer comes back without a model call. The personal part isn't sent, because no FAQ can answer it.",
      calls: [playbookDiscover()] });
    else add({ phase: "recall", service: "cache", off: true, title: "No playbook to check", text: "Agent Playbooks is off, so the model answers the fee question on its own, without the app's fees." });
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
      add({ phase: "retrieve", service: "retriever", ms: MS.tool[1], title: "Checks Lotus Thai's delivery time",
        text: "The restaurant record says " + BUSY + " minutes tonight. That's too slow for Maya.",
        calls: [toolCall(++n, "get_restaurant_by_id", { id: LOTUS.id }, stamp(lotusRow))] });
      if (BUSY > WITHIN) {
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
      text: "Context Gateway is off, so the agent has no way to read restaurants or orders." });

    /* The reply, as segments credited to their source. */
    var R = [];
    function say(t, src) { R.push({ t: t, src: src || null }); }
    /* How Maya likes it, from the memories that reached the prompt. */
    function prefs() {
      var no = ["peanut", "fish"].filter(function (k) { return used[k]; }).map(function (k) { return k === "peanut" ? "peanuts" : "fish sauce"; });
      return [used.spicy ? "extra spicy" : "", no.length ? "with no " + no.join(" or ") : ""].filter(Boolean).join(", ");
    }
    var memLine = "Last week you had the extra spicy green curry from Lotus Thai, with no peanuts or fish sauce. ";
    if (on.memory) say(memLine, "memory");
    else if (on.retriever) say("Your last curry order was the green curry without fish sauce from Lotus Thai. ", "retriever");
    if (on.retriever && alt) {
      say("Lotus Thai is taking about " + BUSY + " minutes tonight", "retriever");
      say(", so it wouldn't arrive in time. ");
      say("Bangkok Street Kitchen can deliver in about 30 minutes, and you've ordered their pad thai with tofu twice. ", "retriever");
      say("Should I order that");
      if (on.memory) { say(", "); say(prefs(), "memory"); }
      say("? ");
    } else if (on.memory) {
      say("I can't check delivery times right now, so I can't promise it'll arrive within 30 minutes. Should I order it anyway? ");
    } else {
      say("I don't have a record of what you had last week, and I can't look up your orders right now. What would you like to order? ");
    }
    if (on.cache) say(FEE, "cache");
    else say(VAGUE);
    var reply = R.map(function (x) { return x.t; }).join("").trim();

    /* Model call */
    add({ phase: "model", service: "app", ms: MS.assemble, title: "Assembles the prompt",
      text: "The app puts Maya's message and everything the agent gathered into the prompt.",
      used: Object.keys(used).length, of: on.memory ? MEMORIES.length : 0, dropped: MEMORIES.filter(function (m) { return on.memory && !used[m.key]; }) });
    var replyTokens = Math.round(reply.split(/\s+/).length * 1.3);   // about 1.3 tokens a word
    add({ phase: "model", service: "model", ms: MS.reply, tokens: replyTokens, title: "Writes the reply",
      text: "The model gets Maya's message plus the context gathered so far" + (on.memory || on.retriever ? "" : ", which is nothing") + ", and writes the reply." });

    /* Record */
    if (on.memory) add({ phase: "record", service: "memory", ms: MS.record, title: "Stores the message and the reply",
      text: "Both go into session memory as events. Background extraction later decides what's worth keeping long term, such as the restaurant Maya picks tonight.",
      calls: [sessionEvent(0, "USER", MESSAGE, ASK_AT), sessionEvent(1, "ASSISTANT", reply, REPLY_AT)] });
    else add({ phase: "record", service: "memory", off: true, title: "Nothing is remembered", text: "Agent Memory is off, so next time the assistant starts from nothing again." });
    if (on.cache) add({ phase: "record", service: "cache", note: true, title: "Nothing to publish",
      text: "The fee answer came from a published FAQ, and the rest of the reply is personal. Agents don't publish to a playbook: new FAQs arrive as proposals, and a reviewer publishes them." });

    /* The scorecard. */
    var checks = [
      { key: "route", label: "Decides what to do without a model call",
        state: on.router ? "ok" : "slow",
        text: on.router ? "Intent Router matched 2 intents in " + MS.route + " ms" : "A planning model call: " + seconds(MS.plan) + " and " + TOKENS.plan + " output tokens" },
      { key: "time", label: "Arrives within 30 minutes",
        state: on.retriever ? "ok" : "warn",
        text: on.retriever ? "Lotus Thai is too slow tonight, so it offers Bangkok Street Kitchen" : "Can't check delivery times" },
      { key: "order", label: "Knows what Maya had last week",
        state: on.memory ? "ok" : on.retriever ? "warn" : "bad",
        text: on.memory ? "Recalled from Agent Memory, with how she likes it" : on.retriever ? "Found in her order history, without how spicy she likes it" : "Doesn't know" },
      { key: "peanut", label: "Keeps her away from peanuts",
        state: used.peanut ? "ok" : alt ? "bad" : "warn",
        text: used.peanut ? "Knows about her allergy" : alt ? "Suggests pad thai without knowing about her allergy" : "Doesn't know about her allergy" },
      { key: "fee", label: "Answers the delivery fee question",
        state: on.cache ? "ok" : "warn",
        text: on.cache ? "With the answer the support team approved" : "Gives a vague answer, because the model doesn't know the app's fees" }
    ];
    return { on: on, steps: steps, reply: R, replyText: reply, checks: checks, ms: ms, end: end, tokens: tokens, alt: alt, used: used };
  }

  /* ------------------------------------------------------------- the tour */

  /* What changes when one service is missing: the part of the reply it
     supplied, with and without it (both are excerpts of trace() replies,
     which the tests check), and the scorecard check it moves. */
  var WHAT_IF = {
    router: { check: "route",
      with: "Last week you had the extra spicy green curry from Lotus Thai, with no peanuts or fish sauce.",
      without: "Last week you had the extra spicy green curry from Lotus Thai, with no peanuts or fish sauce.",
      why: "Without Intent Router, the reply says the same thing, but a model call has to work out what Maya wants first: " + seconds(MS.plan) + " and " + TOKENS.plan +
        " output tokens. Intent Router matched the same two intents in " + MS.route + " ms." },
    retriever: { check: "time",
      with: "Lotus Thai is taking about 45 minutes tonight, so it wouldn't arrive in time. Bangkok Street Kitchen can deliver in about 30 minutes",
      without: "I can't check delivery times right now, so I can't promise it'll arrive within 30 minutes. Should I order it anyway?",
      why: "Without Context Gateway, the agent has no tools to read restaurants or orders. The data is in Redis, but nothing reads it." },
    memory: { check: "peanut",
      with: "you've ordered their pad thai with tofu twice. Should I order that, extra spicy, with no peanuts or fish sauce?",
      without: "you've ordered their pad thai with tofu twice. Should I order that?",
      why: "Without Agent Memory, the agent finds the curry in Maya's order history, but nothing there says she's allergic to peanuts, so it suggests pad thai without a warning." },
    cache: { check: "fee",
      with: "Delivery costs $1.99 to $4.99, depending on distance, and you see the exact fee at checkout.",
      without: "Delivery fees depend on the restaurant and the distance, and you see the exact fee at checkout.",
      why: "Without Agent Playbooks, the model answers the fee question on its own. It doesn't know the app's fees, so it gives a vague answer, or it could make one up. Agent Playbooks gives it the answer the support team approved." }
  };
  /* The tour, one idea per step. `lit` lists the map nodes the step is about;
     `adds` is what the agent knows after it. */
  var STEPS = [
    { key: "ask", at: "18:24", title: "Maya asks the assistant", lit: ["agent"],
      text: "Maya asks for last week's curry. To answer, the agent needs what she had and what she can't eat, a restaurant that can deliver in time, and the delivery fee, which is the same for everyone." },
    { key: "router", at: "18:24", title: "Intent Router matches the message", lit: ["router", "agent"],
      text: "First, the agent sends Maya's message to Intent Router. Intent Router compares it with the app's intents, which are the kinds of requests the app expects. It finds two matches. The best match is reorder, which tells the agent to handle the reorder itself. The other is delivery_fee, which tells the agent to look up the delivery fee in the support playbook. Matching takes " + MS.route + " ms and doesn't need a model call. Intent Router only returns the matches. The agent decides what to do with them.",
      adds: [{ src: "router", t: "reorder → agent" }, { src: "router", t: "delivery_fee → support playbook" }] },
    { key: "cache", at: "18:24", title: "Agent Playbooks answers the general question", lit: ["cache", "redis", "agent"],
      text: "Intent Router pointed the fee question at the support playbook, so the agent checks it first. The support team published an approved answer to this question, and discovery returns it in " + MS.cache + " ms, without a model call. The rest of Maya's message is personal, so no FAQ covers it.",
      adds: [{ src: "cache", t: "Delivery fee: $1.99 to $4.99" }] },
    { key: "memory", at: "18:24", title: "Agent Memory recalls last week", lit: ["memory", "redis", "agent"],
      text: "This is a new conversation, but Agent Memory kept what the assistant learned from Maya last week. A search scoped to her returns the order she means and the food she can't eat.",
      adds: [{ src: "memory", t: "Last week: extra spicy green curry from Lotus Thai" }, { src: "memory", t: "Allergic to peanuts, avoids fish sauce" }] },
    { key: "retriever", at: "18:24", title: "Context Gateway checks live data", lit: ["retriever", "redis", "agent"],
      text: "Context Gateway gives the agent governed tools, through one Model Context Protocol (MCP) endpoint, for the restaurant and order data in Redis. Lotus Thai is too slow tonight, so the agent finds a Thai restaurant that can make it, and checks what Maya has ordered there.",
      adds: [{ src: "retriever", t: "Bangkok Street Kitchen: 30 minutes" }, { src: "retriever", t: "She's had their pad thai with tofu twice" }] },
    { key: "reply", at: "18:24", title: "The model writes one reply", lit: ["agent"],
      text: "The model gets Maya's message and everything the agent gathered, and writes the reply. Each highlighted part came from a different service. Afterward, Agent Memory stores the conversation, so next time the assistant remembers tonight too." },
    { key: "lens", title: "Lens shows how the request ran", lit: ["lens", "agent"], preview: true,
      text: "Lens records how the agent handled Maya's message. For each step, it records what the step found and how long it took. For example, it shows which memories Agent Memory returned, and which of them made it into the prompt. If the agent gives a wrong answer, you can see which step caused it. Select a step to see what Lens recorded about it. To see Lens find a bug, select “A request with a bug”." },
    { key: "whatif", title: "What if a service were missing?", lit: [],
      text: "Pick a service to take away. Only the part of the reply it supplied changes." }
  ];
  var DEPTH = { router: "Intent Router", retriever: "Context Gateway", memory: "Agent Memory", cache: "Agent Playbooks", lens: "Lens" };

  /* ---- the sample data, as table rows ----
     The same rows as the RDI demo (rdi-demo.js), on the evening of this tour:
     Maya's curry order has been delivered, and Lotus Thai is taking 45
     minutes tonight. Keep the rows in sync. The tour shows them as they
     sit in Redis (RD). */
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
  /* ---- the rows in Redis, shown when the reader selects the Redis logo ----
     Each row is a JSON document under the key template the Context Surface reads ({table}:{id}). Customer
     records leave out email, as in the RDI demo. */
  function rdTable(t, prefix, drop) {
    var keep = t.columns.map(function (c, i) { return i > 0 && drop.indexOf(c) < 0 ? i : -1; }).filter(function (i) { return i > 0; });
    return { name: t.name, columns: ["key"].concat(keep.map(function (i) { return t.columns[i]; })),
      rows: t.rows.map(function (r) { return [prefix + r[0]].concat(keep.map(function (i) { return r[i]; })); }) };
  }
  var RD = [rdTable(PG[0], "restaurant:", []), rdTable(PG[1], "customer:", ["email"]), rdTable(PG[2], "order:", [])];
  var RD_FOCUS = { restaurants: ["restaurant:r209", "restaurant:r201"], customers: ["customer:u101"], orders: ["order:o3003", "order:o3001", "order:o3018"] };
  var RD_NOTES = {
    restaurants: "Lotus Thai's avg_delivery_min is 45 tonight, so the agent offers Bangkok Street Kitchen instead.",
    customers: "Maya Chen is asking tonight. Her peanut allergy isn't in this record: Agent Memory has it from last week.",
    orders: "Maya's past orders. Context Gateway's " + GATEWAY_NS + ".filter_order tool finds them by customer_id."
  };
  /* The data window, and where to select it in the drawing: a button over the Redis logo, and a ring on its outline. */
  var DATA = {
    redis: { name: "Redis", sub: "one JSON document per row", label: "Redis", tables: RD, focus: RD_FOCUS, notes: RD_NOTES,
      box: [391.062, 172.175, 44.697, 45.2752], round: true,   // the Redis logo
      ring: '<rect x="388.062" y="169.175" width="50.697" height="51.2752" rx="25.3485"/>' }   // just outside the logo, which is the ring's red
  };

  /* --------------------------------------------------------------- the stage */

  /* The Iris architecture diagram from redis.io/iris, as published:
     versions of the same 893 x 570 drawing, each with one service
     highlighted (static/images/ai/context-engine/iris-diagram/). A step
     shows one version, or blends several: "lighten" keeps whatever is lit
     in any of them, so it can light three services at once, and "darken"
     keeps only what's lit in all of them, which leaves the agent and the
     database. Packets ride an overlay in the same coordinates, along
     routes traced from the centres of the drawing's dashes. */
  var ART_W = 893, ART_H = 570;
  /* The part of the drawing the stage shows: x, y, width, height. The tour leaves Data Integration out, so the
     stage crops the drawing's empty left side and its frame, and positions everything in these units. */
  var VIEW = [278, 145, 613.5, 423.5];
  function vx(x) { return ((x - VIEW[0]) / VIEW[2] * 100) + "%"; }
  function vy(y) { return ((y - VIEW[1]) / VIEW[3] * 100) + "%"; }
  function vw(w) { return (w / VIEW[2] * 100) + "%"; }
  function vh(h) { return (h / VIEW[3] * 100) + "%"; }
  var ART = { retriever: "context-retriever.svg", cache: "langcache.svg", memory: "agent-memory.svg" };
  var ROUTES = {
    dbcr: "M 461.0 271.6 L 461.7 272.1 L 462.7 272.7 L 465.3 274.1 L 466.6 274.9 L 468.4 275.9 L 470.9 277.3 L 472.3 278.1 L 474.0 279.2 L 476.6 280.6 L 477.9 281.4 L 479.7 282.4 L 482.3 283.8 L 483.6 284.6 L 485.4 285.7 L 487.9 287.1 L 489.3 287.9 L 491.0 288.9 L 493.6 290.3 L 495.0 291.1 L 496.7 292.2 L 499.3 293.6 L 500.6 294.4 L 502.4 295.4 L 504.8 296.8 L 505.0 296.8 L 505.7 297.3",
    amdb: "M 748.4 276.7 L 744.0 274.2 L 738.1 270.8 L 732.2 267.4 L 726.3 264.0 L 720.5 260.6 L 714.6 257.2 L 708.7 253.8 L 702.8 250.4 L 696.9 247.0 L 691.1 243.6 L 685.2 240.2 L 679.3 236.9 L 673.4 233.5 L 667.6 230.1 L 661.7 226.7 L 655.8 223.3 L 649.9 219.9 L 644.0 216.5 L 638.2 213.1 L 632.3 209.7 L 626.4 206.3 L 620.5 202.9 L 614.7 199.5 L 608.8 196.1 L 602.9 192.7 L 597.0 189.3 L 591.1 186.0 L 585.3 182.6 L 579.4 179.2 L 573.5 175.8 L 570.4 173.9 L 563.9 171.3 L 556.7 169.6 L 548.9 168.9 L 541.1 169.2 L 533.6 170.4 L 526.7 172.7 L 521.6 175.3 L 516.2 178.4 L 510.2 181.9 L 504.2 185.3 L 498.2 188.8 L 492.2 192.2 L 486.2 195.7 L 480.2 199.2 L 474.2 202.6 L 468.2 206.1 L 464.1 208.5",
    dblc: "M 362.6 275.7 L 359.3 277.7 L 353.4 281.1 L 347.5 284.5 L 341.7 287.9 L 335.8 291.2 L 330.0 294.6 L 324.1 298.0 L 318.2 301.4 L 312.4 304.8 L 309.2 306.6 L 304.7 310.3 L 301.7 314.5 L 300.5 319.0 L 300.9 323.5 L 303.2 327.8 L 307.0 331.8 L 311.6 334.7 L 316.8 337.8 L 322.7 341.2 L 328.6 344.6 L 334.5 348.0 L 340.4 351.4 L 346.3 354.8 L 352.2 358.2 L 358.0 361.6 L 363.9 365.0 L 369.8 368.4 L 375.7 371.8 L 381.6 375.2 L 387.5 378.6 L 393.4 382.0 L 399.3 385.4 L 405.2 388.8 L 411.1 392.2 L 416.9 395.6 L 422.8 399.0 L 428.7 402.4 L 434.6 405.8 L 440.5 409.2 L 446.4 412.6 L 452.3 416.0 L 458.2 419.4 L 464.1 422.8 L 470.0 426.2 L 475.8 429.6 L 481.7 433.0 L 486.8 435.9",
    cragent: "M 582.0 334.6 L 598.0 343.9 L 617.6 355.1",
    cragent2: "M 610.2 361.2 L 588.8 348.9 L 574.6 340.7",
    amagent: "M 728.8 334.6 L 711.2 344.7 L 689.7 357.1",
    amagent2: "M 697.6 364.2 L 721.0 350.8 L 736.8 341.7",
    lcagent: "M 572.3 436.8 L 595.2 423.6 L 610.7 414.7",
    lcagent2: "M 602.9 407.7 L 585.6 417.6 L 564.5 429.8"
    /* maya, maya2, router, router2, and lens are added with the figures (FIG), from their geometry. */
  };
  /* Where to select each part of the drawing, and where each value tag sits:
     x, y (the tag's bottom edge), and which side it hangs from. */
  var HITS = { redis: [413, 230, 44], retriever: [540, 318, 36],
    memory: [773, 307, 36], agent: [651, 385, 36], cache: [526, 469, 36] };   // maya, router, and lens: with the figures
  var TAG_SPOTS = { cache: [484, 470, "r"], memory: [872, 262, "r"] };   // router: with the figures
  /* What each step shows: which versions of the drawing, how they blend,
     and what moves. Groups run in order; the routes in a group run together.
     A tag appears when the group it belongs to arrives. */
  var FLOWS = {
    ask: { layers: ["retriever", "cache", "memory"], blend: "darken", groups: [[["maya"]]] },   // no tag: the step card shows her message
    /* The agent sends the message to Intent Router, which sends back the intents that match. */
    router: { layers: ["retriever", "cache", "memory"], blend: "darken", groups: [[["router2"]], [["router"]]], tags: [[0, "router", "2 intents · 12 ms"]] },
    cache: { layers: ["cache"], groups: [[["lcagent2"]], [["dblc", 1]], [["dblc"]], [["lcagent"]]], tags: [[2, "cache", "FAQ · 0.92 · 41 ms"]] },
    memory: { layers: ["memory"], groups: [[["amagent2"]], [["amdb"]], [["amdb", 1]], [["amagent"]]], tags: [[2, "memory", "5 memories"]] },
    retriever: { layers: ["retriever"],
      groups: [[["cragent2"]], [["dbcr"]], [["cragent"]], [["cragent2"]], [["dbcr"]], [["cragent"]], [["cragent2"]], [["dbcr"]], [["cragent"]]] },   // no tags: the step card lists the three calls
    reply: { layers: ["retriever", "memory", "cache"], groups: [[["cragent"], ["amagent"], ["lcagent"]], [["maya2"]]] },   // no tag: the step card shows the reply
    /* The request again, as Lens records it: each step's record goes to Lens as the step ends. The preview plays this;
       the tour plays the step selected in Lens's timeline instead (LENS_FLOWS). */
    lens: { layers: ["retriever", "memory", "cache"],
      groups: [[["router"], ["lens"]], [["lcagent"], ["lens"]], [["amagent"], ["lens"]], [["cragent"], ["lens"]], [["maya2"], ["lens"]]] }   // no tag: the step card shows the timeline
  };
  /* On the Lens step, the drawing plays only the step selected in the timeline: its trip to its service, and then its
     record going to Lens. Prompt assembly and the model call happen inside the agent, so only their records move. */
  var DIM = ["retriever", "cache", "memory"];   // blended with "darken", every service is dimmed
  var LENS_FLOWS = {
    router: { layers: DIM, blend: "darken", groups: [[["router2"]], [["router"]], [["lens"]]] },
    cache: { layers: ["cache"], groups: [[["lcagent2"]], [["dblc", 1]], [["dblc"]], [["lcagent"]], [["lens"]]] },
    memory: { layers: ["memory"], groups: [[["amagent2"]], [["amdb"]], [["amdb", 1]], [["amagent"]], [["lens"]]] },
    retriever: { layers: ["retriever"], groups: [[["cragent2"]], [["dbcr"]], [["cragent"]], [["lens"]]] },
    app: { layers: DIM, blend: "darken", groups: [[["lens"]]] },
    model: { layers: DIM, blend: "darken", groups: [[["lens"]]] },
    record: { layers: ["memory"], groups: [[["amagent2"]], [["amdb"]], [["lens"]]] }   // Agent Memory stores the conversation
  };
  var STEP_OF = { maya: 0, router: 1, cache: 2, memory: 3, retriever: 4, redis: 4, agent: 5, lens: 6 };
  /* ---- Intent Router, Lens, and Maya, the user, drawn in the diagram's own style ----
     The drawing has none of them, so the stage adds each in an empty place next to the agent, on a line from
     the agent's face centre (C0):
     - Intent Router above the agent, between Context Gateway and Agent Memory: the agent calls it, as it
       calls those services, and gets the matching intents back.
     - Maya down and to the right, on the diagonal the drawing leaves free, so she talks to the agent directly.
     - Lens below the agent's label: the agent sends it a record of each step.
     Each is the agent's own disc, scaled about C0 and moved along its line (dir, by `at` units): Intent Router
     and Lens in the drawing's service colours with their icons, Maya with a person where the agent has a robot.
     Each has a label box, as the agent does; Intent Router's and Lens's show only while they're lit, as the
     drawing shows only a lit service's label. Their links use the drawing's arrow style, one line each way,
     with dots that show while the link is lit. Lens's link has one line, toward Lens. */
  var C0 = [655.895, 388.655], STEP = [110.06, 69.065], STEP_LEN = Math.hypot(STEP[0], STEP[1]);
  var DISC = {
    rim: "M626.802 419.618C621.381 416.488 617.95 409.911 617.794 400.63C617.482 382.067 630.387 359.713 646.62 350.702C654.736 346.197 662.147 345.88 667.568 349.009L674.93 352.459C680.351 355.589 683.782 362.166 683.938 371.447C684.25 390.01 671.345 412.364 655.112 421.375C646.996 425.88 639.585 426.197 634.164 423.067L626.802 419.618Z",
    face: "M655.897 421.803C671.75 412.649 684.602 390.389 684.602 372.083C684.603 353.777 671.752 346.358 655.899 355.511C640.046 364.664 627.193 386.924 627.193 405.23C627.192 423.536 640.044 430.956 655.897 421.803Z",
    icon: [28.7085, -16.5775, 0, 33.1498]   // the face's plane, in units of its radius, at full size
  };
  /* For each figure: its line from C0 (dir) and how far along it (at), its scale (s), where its link starts
     (from C0) and stops (reach, short of the figure's centre, at full size), how far across the line its two
     link lines sit, and its label box, placed from the figure's centre (dx, dy) and w wide. */
  var FIG = {
    router: { dir: [0, -1], at: 120, s: 0.7, from: 47, reach: 41.6, across: [4.5, -4.5],
      label: { lines: ["INTENT", "ROUTER"], dx: 27.1, dy: -0.7, w: 46 } },   // to the right, under the dashes from Redis to Agent Memory
    maya: { dir: [STEP[0] / STEP_LEN, STEP[1] / STEP_LEN], at: STEP_LEN, s: 0.85, from: 44, reach: 44, across: [9, 0],
      label: { lines: ["MAYA"], dx: -19.15, dy: 37, w: 38.3 } },
    lens: { dir: [0, 1], at: 146, s: 0.65, from: 77, reach: 46.8, across: [0, 0],   // its link starts below the agent's label
      label: { lines: ["LENS"], dx: 25.5, dy: -12.4, w: 43.1543 } }
  };
  Object.keys(FIG).forEach(function (k) { var f = FIG[k]; f.c = [C0[0] + f.dir[0] * f.at, C0[1] + f.dir[1] * f.at]; });
  /* A point `a` along a figure's line from C0, and `o` across it (to the right of the line, looking along it). */
  function along(f, a, o) {
    var u = f.dir;
    return [C0[0] + u[0] * a - u[1] * o, C0[1] + u[1] * a + u[0] * o];
  }
  /* A link's two lines: `in` runs toward the agent, `out` away from it. */
  function link(f) {
    var a = f.from, b = f.at - f.s * f.reach;
    return { in: [along(f, b, f.across[0]), along(f, a, f.across[0])], out: [along(f, a, f.across[1]), along(f, b, f.across[1])] };
  }
  var LINKS = { router: link(FIG.router), maya: link(FIG.maya), lens: link(FIG.lens) };
  function routeD(seg) { return "M " + seg[0][0].toFixed(1) + " " + seg[0][1].toFixed(1) + " L " + seg[1][0].toFixed(1) + " " + seg[1][1].toFixed(1); }
  ROUTES.maya = routeD(LINKS.maya.in); ROUTES.maya2 = routeD(LINKS.maya.out);
  ROUTES.router = routeD(LINKS.router.in); ROUTES.router2 = routeD(LINKS.router.out);
  ROUTES.lens = routeD(LINKS.lens.out);
  HITS.router = [FIG.router.c[0], FIG.router.c[1], 24]; HITS.maya = [FIG.maya.c[0], FIG.maya.c[1], 30]; HITS.lens = [FIG.lens.c[0], FIG.lens.c[1], 24];
  TAG_SPOTS.router = [FIG.router.c[0], 236, "c"];   // above it, over the dashes, which are dimmed on its step
  /* The red badge every service disc carries, copied from the Agent Memory disc in agent-memory.svg, with
     that disc's face centre so it can be placed on another disc. */
  var BADGE = { at: [778.549, 309.69], red: "M793.415 291.105C793.414 295.046 790.647 299.839 787.234 301.81C783.821 303.781 781.054 302.183 781.054 298.242C781.054 294.301 783.821 289.508 787.234 287.537C790.648 285.566 793.415 287.164 793.415 291.105Z",
    white: "M789.972 293.216C789.517 294.11 789.027 295.115 788.046 295.682C787.169 296.188 786.843 295.523 786.82 294.843C787.012 295.18 787.387 295.327 787.973 294.972C789.099 294.281 789.872 292.712 789.872 291.689C789.872 290.465 789.045 290.06 787.61 290.888C786.583 291.481 785.311 292.647 784.476 293.811C784.466 294.519 784.821 295.227 784.948 295.053C785.672 294.06 786.247 293.358 786.804 292.85C785.979 294.342 784 297.843 783.758 298.398C783.785 298.764 784.212 299.54 784.421 299.42C784.484 299.383 784.539 299.312 784.603 299.205C785.199 298.12 785.686 297.175 786.118 296.286C786.179 297.188 786.597 298.093 787.764 297.419C788.809 296.816 789.844 295.386 790.317 293.237C790.371 292.975 790.117 292.941 789.972 293.216ZM788.782 292.388C788.782 292.98 788.255 293.575 787.773 293.853C787.516 294.002 787.318 294.041 787.162 294.035C787.449 293.388 787.734 292.73 788.04 292.025C788.58 291.815 788.782 292.029 788.782 292.388Z" };
  /* Intent Router's icon, in the face's plane: a store with requests passing through it, one routed out. */
  var ROUTER_ICON = '<path d="M -0.34 -0.3 C -0.34 -0.42 0.22 -0.42 0.22 -0.3 C 0.22 -0.18 -0.34 -0.18 -0.34 -0.3 Z"/>' +
    '<path d="M -0.34 -0.3 L -0.34 0.32 C -0.34 0.44 0.22 0.44 0.22 0.32 L 0.22 0.22"/><path d="M 0.22 -0.3 L 0.22 -0.2"/>' +
    '<path d="M -0.24 -0.1 L 0.04 -0.1 M -0.03 -0.16 L 0.04 -0.1 L -0.03 -0.04"/>' +
    '<path d="M -0.24 0.14 L 0.04 0.14 M -0.03 0.08 L 0.04 0.14 L -0.03 0.2"/>' +
    '<path d="M -0.28 0.02 L 0.3 0.02 M 0.23 -0.04 L 0.3 0.02 L 0.23 0.08"/><circle cx="0.4" cy="0.02" r="0.07"/>';
  /* Lens's icon, in the face's plane: a magnifier over the agent's robot, as on the Lens landing page. */
  var LENS_ICON = '<circle cx="-0.06" cy="-0.05" r="0.34"/><path d="M 0.18 0.2 L 0.4 0.43"/>' +   // the lens and its handle
    '<rect x="-0.25" y="-0.16" width="0.38" height="0.25" rx="0.08"/><path d="M -0.06 -0.16 L -0.06 -0.24"/>' +   // the robot's head and antenna
    '<circle cx="-0.14" cy="-0.04" r="0.025"/><circle cx="0.02" cy="-0.04" r="0.025"/>';   // its eyes

  /* ---- the current service names, drawn over the drawing's published labels ----
     Each version of the drawing shows its lit service's label box, and data-integration.svg also shows the
     Context Retriever box. The stage draws the same box, with the current name, at the same place, and
     shows it whenever a version in `in` is lit (see compose()). Boxes are x, y, width, height, copied from
     langcache.svg and context-retriever.svg. */
  var RELABEL = {
    cache: { box: [471.578, 518.156, 99.2506, 24.4832], lines: ["AGENT PLAYBOOKS"], in: ["cache"] },
    retriever: { box: [498.461, 235.889, 99.2506, 31.2039], lines: ["CONTEXT", "GATEWAY"], in: ["retriever"] }
  };
  function buildRelabels(NS) {
    var out = {};
    Object.keys(RELABEL).forEach(function (k) {
      var R = RELABEL[k], b = R.box, g = document.createElementNS(NS, "g");
      var mid = b[1] + b[3] / 2, gap = 10, first = mid - (R.lines.length - 1) * gap / 2 + 2.95;   // 2.95: half the glyphs' cap height
      g.setAttribute("class", "iris-relabel");
      g.innerHTML = '<rect fill="#163341" stroke="#8A99A0" stroke-width="0.719233" rx="3.23655" x="' + b[0] + '" y="' + b[1] + '" width="' + b[2] + '" height="' + b[3] + '"/>' +
        R.lines.map(function (t, i) {
          return '<text class="iris-relabel-name" x="' + (b[0] + b[2] / 2) + '" y="' + (first + i * gap).toFixed(2) + '" text-anchor="middle">' + esc(t) + "</text>";
        }).join("");
      out[k] = g;
    });
    return out;
  }

  /* ---- Agent Playbooks' icon on its disc ----
     The drawing's Agent Playbooks disc still carries LangCache's sparkles, so the stage redraws the disc's face
     with the Agent Playbooks icon (an open book with a star), and the disc's badge back on top. The drawing dims
     an unlit service by drawing it at 40% opacity, so the stage does the same over a patch in the background
     colour, which hides the old icon either way. The face and badge are copied from langcache.svg; the icon
     sits in the face's plane, in units of its radius, as the agent's robot does. */
  var PLAYBOOK_DISC = {
    face: "M530.721 503.29C546.574 494.136 559.426 471.876 559.426 453.57C559.427 435.264 546.576 427.845 530.723 436.998C514.87 446.152 502.018 468.412 502.017 486.718C502.016 505.024 514.868 512.444 530.721 503.29Z",
    center: [530.721, 470.142],
    badge: ["M544.839 452.34C544.839 456.217 542.119 460.934 538.756 462.876C538.075 463.269 537.418 463.519 536.81 463.629L536.8 463.634C536.474 463.693 536.163 463.716 535.866 463.702C535.847 463.702 535.822 463.699 535.798 463.696C535.029 463.646 534.363 463.351 533.847 462.834C533.55 462.533 533.297 462.168 533.107 461.727C532.83 461.078 532.674 460.286 532.674 459.364C532.674 455.487 535.399 450.767 538.757 448.829C542.114 446.89 544.839 448.464 544.839 452.34Z",
      "M542.017 454.35C541.511 455.328 540.967 456.434 539.873 457.065C538.9 457.627 538.537 456.902 538.51 456.163C538.724 456.526 539.142 456.683 539.791 456.29C541.044 455.523 541.902 453.8 541.902 452.684C541.902 451.351 540.984 450.915 539.389 451.835C538.246 452.495 536.833 453.785 535.904 455.063C535.893 455.836 536.289 456.604 536.432 456.41C537.235 455.323 537.872 454.55 538.493 453.985C537.575 455.625 535.376 459.468 535.107 460.079C535.135 460.48 535.613 461.32 535.844 461.187C535.915 461.145 535.976 461.067 536.047 460.951C536.707 459.76 537.251 458.723 537.729 457.748C537.801 458.729 538.262 459.715 539.56 458.966C540.72 458.297 541.874 456.72 542.396 454.368C542.462 454.081 542.176 454.046 542.017 454.35ZM540.692 453.457C540.692 454.106 540.104 454.763 539.571 455.071C539.285 455.236 539.065 455.282 538.889 455.278C539.214 454.567 539.527 453.844 539.868 453.073C540.467 452.833 540.692 453.065 540.692 453.457Z"],
    icon: '<g transform="translate(-0.1 0.12) scale(0.78)">' +
      '<path d="M 0 -0.22 C -0.1 -0.3 -0.3 -0.3 -0.42 -0.28 L -0.42 0.34 C -0.3 0.32 -0.1 0.32 0 0.4 C 0.1 0.32 0.3 0.32 0.42 0.34 L 0.42 -0.28 C 0.3 -0.3 0.1 -0.3 0 -0.22 Z M 0 -0.22 L 0 0.4"/>' +
      '<path d="M -0.21 -0.1 Q -0.19 0.02 -0.09 0.04 Q -0.19 0.06 -0.21 0.18 Q -0.23 0.06 -0.33 0.04 Q -0.23 0.02 -0.21 -0.1 Z"/>' +
      '<path d="M 0.1 0.0 L 0.32 0.0 M 0.1 0.12 L 0.26 0.12"/></g>'
  };
  function playbookDiscMarkup() {
    var P = PLAYBOOK_DISC, I = DISC.icon, c = P.center;
    return '<path class="iris-pbdisc-base" fill="#0D212C" stroke="#0D212C" stroke-width="0.840082" d="' + P.face + '"/>' +
      '<g class="iris-pbdisc-art"><path fill="#89302E" stroke="#FF4438" stroke-width="0.840082" d="' + P.face + '"/>' +
        '<g transform="matrix(' + I.concat(c).join(" ") + ')" fill="none" stroke="#fff" stroke-width="0.042" stroke-linecap="round" stroke-linejoin="round">' + P.icon + "</g>" +
        '<path fill="#FF4438" d="' + P.badge[0] + '"/><path fill="white" d="' + P.badge[1] + '"/></g>';
  }

  /* The drawing's Data Integration corner (the source database pills, the gear, and their dashes into Redis),
     which the tour leaves out: x, y, width, height of a patch in the drawing's background colour, inside its
     rounded border. */
  var COVER = [1.2, 1.2, 372, 262];

  var MISSING_ROUTES = { router: [], retriever: ["dbcr", "cragent", "cragent2"], memory: ["amdb", "amagent", "amagent2"], cache: ["dblc", "lcagent", "lcagent2"] };

  /* The figures' markup: each link, then each disc with its icon and label. Kept as strings so the tests can draw it. */
  function figuresMarkup() {
    function n(v) { return (+v).toFixed(2); }
    function arrow(seg) {
      var a = seg[0], b = seg[1], l = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / l, uy = (b[1] - a[1]) / l;
      return '<path d="M' + n(a[0]) + " " + n(a[1]) + " L" + n(b[0]) + " " + n(b[1]) +
        " M" + n(b[0] - ux * 3.2 - uy * 2.2) + " " + n(b[1] - uy * 3.2 + ux * 2.2) + " L" + n(b[0]) + " " + n(b[1]) +
        " L" + n(b[0] - ux * 3.2 + uy * 2.2) + " " + n(b[1] - uy * 3.2 - ux * 2.2) + '"/>';
    }
    function mid(seg) { return '<circle r="2.52025" cx="' + n((seg[0][0] + seg[1][0]) / 2) + '" cy="' + n((seg[0][1] + seg[1][1]) / 2) + '"/>'; }
    function linkG(k, oneWay) {
      var L = LINKS[k];
      return '<g class="iris-maya-link iris-link-' + k + '"><g fill="none" stroke="#5C707A" stroke-width="0.72" stroke-linecap="round" stroke-linejoin="round">' +
        (oneWay ? "" : arrow(L.in)) + arrow(L.out) + '</g><g fill="#B9C2C6">' + (oneWay ? "" : mid(L.in)) + mid(L.out) + "</g></g>";
    }
    function disc(f, colors, icon, iconStroke) {
      var c = f.c, s = f.s, I = DISC.icon;
      return '<g transform="matrix(' + [s, 0, 0, s, n(c[0] - s * C0[0]), n(c[1] - s * C0[1])].join(" ") + ')" stroke-width="' + n(0.840082 / s) + '">' +
          '<path stroke="' + colors[1] + '" fill="' + colors[0] + '" fill-rule="evenodd" clip-rule="evenodd" d="' + DISC.rim + '"/>' +
          '<path stroke="' + colors[1] + '" fill="' + colors[2] + '" d="' + DISC.face + '"/></g>' +
        '<g transform="matrix(' + [I[0] * s, I[1] * s, I[2] * s, I[3] * s, n(c[0]), n(c[1])].map(function (v) { return typeof v === "number" ? n(v) : v; }).join(" ") +
          ')" fill="none" stroke="#fff" stroke-width="' + iconStroke + '" stroke-linecap="round" stroke-linejoin="round">' + icon + "</g>";
    }
    function badge(f) {
      var s = f.s, c = f.c;
      return '<g transform="matrix(' + [s, 0, 0, s, n(c[0] - s * BADGE.at[0]), n(c[1] - s * BADGE.at[1])].join(" ") + ')">' +
        '<path fill="#FF4438" d="' + BADGE.red + '"/><path fill="white" d="' + BADGE.white + '"/></g>';
    }
    /* A one-line box is the agent label's size and style, and a two-line box Agent Memory's. */
    function label(f, cls) {
      var L = f.label, two = L.lines.length > 1, x = f.c[0] + L.dx, y = f.c[1] + L.dy, h = two ? 31.2039 : 24.751;
      return '<g class="' + cls + '"><rect fill="#163341" stroke="#8A99A0" stroke-width="' + (two ? 0.719233 : 0.840082) + '" rx="' + (two ? 3.23655 : 3.78037) +
          '" x="' + n(x) + '" y="' + n(y) + '" width="' + L.w + '" height="' + h + '"/>' +
        L.lines.map(function (t, i) {
          return '<text class="iris-maya-name" x="' + n(x + L.w / 2 + 0.15) + '" y="' + n(y + h / 2 + 3.69 + (i - (L.lines.length - 1) / 2) * 10) + '" text-anchor="middle">' + t + "</text>";
        }).join("") + "</g>";
    }
    var SERVICE = ["#3A2227", "#FF4438", "#89302E"];   // the drawing's colours for a service disc: rim, outline, face
    return {
      links: linkG("router") + linkG("maya") + linkG("lens", true),
      router: '<g class="iris-router-disc">' + disc(FIG.router, SERVICE, '<g transform="scale(1.3)">' + ROUTER_ICON + "</g>", 0.04) + badge(FIG.router) + "</g>" + label(FIG.router, "iris-router-label"),
      lens: '<g class="iris-lensfig-disc">' + disc(FIG.lens, SERVICE, '<g transform="scale(1.2)">' + LENS_ICON + "</g>", 0.04) + badge(FIG.lens) + "</g>" + label(FIG.lens, "iris-lensfig-label"),
      maya: disc(FIG.maya, ["#091A23", "#5C707A", "#163341"],
        '<circle cx="0" cy="-0.3" r="0.17"/><path d="M -0.38 0.44 C -0.38 0.16 -0.2 0.02 0 0.02 C 0.2 0.02 0.38 0.16 0.38 0.44 Z"/>', 0.042) + label(FIG.maya, "")
    };
  }
  function buildFigures(NS) {
    var m = figuresMarkup(), g = document.createElementNS(NS, "g");
    g.setAttribute("class", "iris-maya");
    g.innerHTML = m.links + '<g class="iris-router">' + m.router + '</g><g class="iris-lensfig">' + m.lens + "</g>" + m.maya;
    return g;
  }

  function buildStage(artBase, onPick, onData) {
    var uid = "iris" + Math.random().toString(36).slice(2, 8);
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var box = el("div", "iris-stage");
    box.setAttribute("role", "img");
    /* Two stacks of the versions. A step blends its versions in the stack that isn't showing, then
       fades that stack in over the other, so a half-faded version never blends the wrong way. */
    var sets = [0, 1].map(function () {
      var set = el("div", "iris-artset"), layers = {};
      ["retriever", "cache", "memory"].forEach(function (k) {
        var img = el("img", "iris-art");
        img.style.left = vx(0); img.style.top = vy(0); img.style.width = vw(ART_W); img.style.height = vh(ART_H);
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
    box.style.aspectRatio = VIEW[2] + " / " + VIEW[3];
    over.setAttribute("viewBox", VIEW.join(" "));
    over.setAttribute("aria-hidden", "true");
    over.innerHTML = '<defs><filter id="' + uid + '-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="3.4"/></filter>' +
      '</defs><rect class="iris-cover" x="' + COVER[0] + '" y="' + COVER[1] + '" width="' + COVER[2] + '" height="' + COVER[3] + '" rx="10.5"/>' +
      Object.keys(ROUTES).map(function (k) { return '<path id="' + uid + "-" + k + '" class="iris-route" d="' + ROUTES[k] + '"/>'; }).join("") +
      Object.keys(HITS).map(function (k) {
        var h = HITS[k];
        return '<circle class="iris-hit" data-node="' + k + '" cx="' + h[0] + '" cy="' + h[1] + '" r="' + h[2] + '"><title>' + esc(k === "redis" ? "Redis" : k === "maya" ? "Maya" :
          k === "agent" ? "Agent" : DEPTH[k]) + "</title></circle>";
      }).join("") + Object.keys(DATA).map(function (k) {
        return ["iris-ring", "iris-ring iris-pulse"].map(function (cls) { return DATA[k].ring.replace(/^<(\w+)/, '<$1 class="' + cls + '" data-src="' + k + '"'); }).join("");
      }).join("") + '<g class="iris-packets"></g>';
    box.appendChild(over);
    var figs = buildFigures(NS);
    over.insertBefore(figs, over.querySelector(".iris-route"));
    var mayaLink = figs.querySelector(".iris-link-maya"), routerLink = figs.querySelector(".iris-link-router"), router = figs.querySelector(".iris-router");
    var lensLink = figs.querySelector(".iris-link-lens"), lens = figs.querySelector(".iris-lensfig");
    var relabels = buildRelabels(NS);
    Object.keys(relabels).forEach(function (k) { over.insertBefore(relabels[k], over.querySelector(".iris-route")); });
    var pbDisc = document.createElementNS(NS, "g");
    pbDisc.setAttribute("class", "iris-pbdisc");
    pbDisc.innerHTML = playbookDiscMarkup();
    over.insertBefore(pbDisc, over.querySelector(".iris-route"));
    var packets = over.querySelector(".iris-packets");
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
      b.style.left = vx(D.box[0]);
      b.style.top = vy(D.box[1]);
      b.style.width = vw(D.box[2]);
      b.style.height = vh(D.box[3]);
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
      ["retriever", "cache", "memory"].forEach(function (k) {
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
      /* Agent Playbooks' disc is lit where its version is, as its label is. */
      pbDisc.classList.toggle("is-lit", keys.indexOf("cache") >= 0 && (keys.length === 1 || blend !== "darken"));
      /* A label shows where a version that has it is lit; "darken" keeps only what every version lights, which no label is. */
      Object.keys(relabels).forEach(function (k) {
        var shown = RELABEL[k].in.some(function (v) { return keys.indexOf(v) >= 0; });
        relabels[k].classList.toggle("is-on", shown && (keys.length === 1 || blend !== "darken"));
      });
    }
    function setTag(node, text) {
      if (!node) { tag.classList.remove("is-on"); return; }
      var p = TAG_SPOTS[node];
      tag.textContent = text;
      tag.style.left = vx(p[0]);
      tag.style.top = vy(p[1]);
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
      /* focus: on the Lens step, the part of the drawing that the step selected in its timeline is about (a LENS_FLOWS key).
         Without one, as in the preview, the Lens step plays the whole request. */
      show: function (stepKey, missing, focus) {
        var tok = ++token, lensStep = stepKey === "lens";
        /* Intent Router and its link are lit on its own step, on Lens's while its match is selected (or without a selection),
           and on the what-if, where it's one of the services to take away. It writes no part of the reply, so the reply step
           leaves it dimmed. */
        var routerLit = stepKey === "router" || (lensStep && (!focus || focus === "router")) || (stepKey === "whatif" && missing !== "router");
        mayaLink.classList.toggle("is-lit", stepKey === "ask" || stepKey === "reply" || (lensStep && !focus) || stepKey === "whatif");
        routerLink.classList.toggle("is-lit", routerLit);
        router.classList.toggle("is-lit", routerLit);
        lensLink.classList.toggle("is-lit", lensStep);
        lens.classList.toggle("is-lit", lensStep);
        setTag(null);
        Array.prototype.forEach.call(packets.childNodes, function (n) { n.remove(); });
        var flow = stepKey === "whatif" ? null : lensStep && focus ? LENS_FLOWS[focus] : FLOWS[stepKey];
        var skip = {};
        if (stepKey === "whatif") {
          /* Every service, or every service but the missing one, with the reply flowing in. */
          var keys = ["retriever", "cache", "memory"].filter(function (k) { return k !== missing; });
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
    var links = { router: root.getAttribute("data-link-router"), retriever: root.getAttribute("data-link-retriever"),
      memory: root.getAttribute("data-link-memory"), cache: root.getAttribute("data-link-cache"), lens: root.getAttribute("data-link-lens") };
    var st = { step: 0, missing: null, lensBug: false, lensRow: 0 };
    var full = trace({ router: true, retriever: true, memory: true, cache: true });
    var bug = trace({ router: true, retriever: true, memory: true, cache: true }, { drop: "peanut" });   // the Lens step's turn with a bug
    var lensTurns = { ran: lensRows(full), bug: lensRows(bug) };
    /* The part of the drawing that the step selected in Lens's timeline is about (a LENS_FLOWS key). */
    function lensFocus() {
      var rows = st.lensBug ? lensTurns.bug : lensTurns.ran, x = rows[Math.min(st.lensRow, rows.length - 1)];
      return x.focus;
    }
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
      if (step.key === "lens") return lensView();
      var f = el("div", "iris-fact");
      if (step.key === "ask") {
        f.appendChild(el("div", "rcr-msg rcr-user iris-askmsg", esc(MESSAGE)));
      } else if (step.key === "router") {
        f.innerHTML = INTENTS.map(function (it) {
          return '<div class="iris-factrow iris-tool"><code class="iris-toolname">' + esc(it.name) + '</code><span class="iris-kv">score ' + it.score.toFixed(2) +
            '</span><span class="iris-toolres">→ ' + esc(it.target.type + " " + it.target.ref) + "</span></div>";
        }).join("");
      } else if (step.key === "cache") {
        f.innerHTML = '<div class="iris-factrow"><span class="iris-factlbl">Asked</span><span>' + esc("“" + QUESTION + "”") + "</span></div>" +
          '<div class="iris-factrow"><span class="iris-factlbl">FAQ</span><span>' + esc("“" + FEE_PROMPT + "”") + ' <span class="iris-kv">score ' + FEE_SIM.toFixed(2) + " · version " + FEE_VERSION + " · " + MS.cache + " ms</span></span></div>" +
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
          return '<div class="iris-factrow iris-tool"><code class="iris-toolname">' + GATEWAY_NS + "." + r[0] + '</code><span class="iris-kv">' + esc(r[1]) + '</span><span class="iris-toolres">→ ' + esc(r[2]) + "</span></div>";
        }).join("");
      } else if (step.key === "reply") {
        f.appendChild(replyBubble(full.reply));
        f.appendChild(el("div", "iris-totals", '<span><b class="rcr-mono">' + seconds(full.ms) + "</b> to reply</span>" +
          '<span><b class="rcr-mono">' + full.tokens + "</b> model output tokens</span>" + '<span class="rcr-faint">Illustrative timings and counts.</span>'));
      }
      return f;
    }
    var SOURCES = { router: "Intent Router", retriever: "Context Gateway", memory: "Agent Memory", cache: "Agent Playbooks" };
    /* The key comes first, styled like the parts of the reply, so the colors mean something before you read.
       Pointing at a key or at a part of the reply shows only that service's parts; selecting a key keeps it so. */
    function replyBubble(segments) {
      var wrap = el("div", "iris-reply"), legend = el("div", "iris-legend"), keys = {}, pinned = null;
      legend.appendChild(el("div", "rcr-lbl", "Where each part came from"));
      ["retriever", "memory", "cache"].forEach(function (k) {
        var b = keys[k] = el("button", "iris-key iris-src-" + k, esc(SOURCES[k]));
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        legend.appendChild(b);
      });
      var msg = el("div", "rcr-msg rcr-agent iris-replymsg", segments.map(function (x) {
        return x.src ? '<span class="iris-src iris-src-' + x.src + '" data-src="' + x.src + '" title="From ' + SOURCES[x.src] + '">' + esc(x.t.trim()) + "</span>" + (/\s$/.test(x.t) ? " " : "") : esc(x.t);
      }).join(""));
      wrap.appendChild(legend);
      wrap.appendChild(msg);
      function pick(k) {
        wrap.classList.toggle("is-picking", !!k);
        Object.keys(keys).forEach(function (x) { keys[x].classList.toggle("is-on", x === k); });
        Array.prototype.forEach.call(msg.querySelectorAll(".iris-src"), function (n) { n.classList.toggle("is-on", n.getAttribute("data-src") === k); });
      }
      function hover(node, k) {
        node.addEventListener("pointerenter", function (e) { if (e.pointerType === "mouse") pick(k); });
        node.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") pick(pinned); });
      }
      Object.keys(keys).forEach(function (k) {
        keys[k].addEventListener("click", function () {
          pinned = pinned === k ? null : k;
          Object.keys(keys).forEach(function (x) { keys[x].setAttribute("aria-pressed", x === pinned ? "true" : "false"); });
          pick(pinned);
        });
        hover(keys[k], k);
      });
      Array.prototype.forEach.call(msg.querySelectorAll(".iris-src"), function (n) { hover(n, n.getAttribute("data-src")); });
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
      ["router", "retriever", "memory", "cache"].forEach(function (k) {
        var b = el("button", "rcr-chip iris-pick iris-svc-" + k + (st.missing === k ? " is-on" : ""), "Without " + esc(SOURCES[k]));
        b.type = "button";
        b.setAttribute("aria-pressed", st.missing === k ? "true" : "false");
        b.addEventListener("click", function () { st.missing = st.missing === k ? null : k; render(); });
        picks.appendChild(b);
      });
      box.appendChild(picks);
      if (!st.missing) { box.appendChild(el("p", "iris-pickhint rcr-faint", "Pick a service.")); return box; }
      var w = WHAT_IF[st.missing], on = { router: true, retriever: true, memory: true, cache: true };
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

    /* ---- the Lens step: the turn as Lens records it ----
       A timeline of the turn's steps, as Lens shows one, and what Lens recorded for the selected step. The
       other view is the same turn with a bug in the app's code, which leaves the allergy memory out of the
       prompt. Selecting a step redraws only the record, which is a live region, so a screen reader reads
       the new record out. */

    /* A trace's steps as Lens records them. Agent Memory, Agent Playbooks, and Context Gateway record their
       own steps; the app records the Intent Router match (as a custom step) and the prompt assembly. Each row is
       named by its service, with a word only where two rows would read the same (op), and `focus` is the part of
       the drawing it's about (a LENS_FLOWS key). */
    function lensRows(tr) {
      return tr.steps.filter(function (s) { return s.ms && !s.off; }).map(function (s) {
        var row = { svc: s.service, focus: s.service, at: s.at, ms: s.ms, op: "" }, c = s.calls && s.calls[0];
        if (s.service === "router") {
          row.name = "Intent Router"; row.items = c.response.items;
        } else if (s.service === "cache") {
          row.name = "Agent Playbooks"; row.query = c.request.query;
          row.results = c.response.discoveredEntries.map(function (e) { return { label: "FAQ · similarity score " + e.score.toFixed(2), text: e.faq.question, used: true }; });
        } else if (s.service === "memory" && s.phase === "recall") {
          row.name = "Agent Memory"; row.op = "recall"; row.query = c.request.text;
          row.results = MEMORIES.map(function (m) { return { label: m.type, text: m.text, used: !!tr.used[m.key] }; });
        } else if (s.service === "retriever") {
          row.name = "Context Gateway"; row.tool = c.path; row.input = spaced(c.args); row.result = brief(c.result);
        } else if (s.service === "app") {
          row.name = "Prompt assembly"; row.used = s.used; row.of = s.of; row.dropped = s.dropped;
        } else if (s.service === "model") {
          row.name = "Model call"; row.tokens = s.tokens; row.note = s.text;
        } else {
          row.name = "Agent Memory"; row.op = "save"; row.focus = "record";
          row.note = "Stored Maya's message and the reply as events in session " + SESSION + ".";
        }
        return row;
      });
    }
    /* JSON on one line, with a space after each comma and colon, so it wraps between values. */
    function spaced(v) {
      return JSON.stringify(v).replace(/("(?:[^"\\]|\\.)*")|([,:])/g, function (m, str, sep) { return str || sep + " "; });
    }
    /* A tool result in a few words: a restaurant record, or a filter's matches. */
    function brief(r) {
      if (!r.results) return r.name + ", " + r.avg_delivery_min + " minutes";
      return r.count + (r.count === 1 ? " match: " : " matches: ") + r.results.map(function (x) {
        return x.name ? x.name + ", " + x.avg_delivery_min + " minutes" : x.id + ", " + x.items;
      }).join("; ");
    }
    function lensView() {
      var box = el("div", "iris-fact iris-lens"), modes = el("div", "iris-lensmodes"), note = el("div", "iris-lensnote"), head = el("div", "iris-lenshead");
      var list = el("div", "iris-timeline"), info = el("div", "iris-tdetail");
      note.setAttribute("aria-live", "polite");
      list.setAttribute("role", "group");
      list.setAttribute("aria-label", "Steps in this request");
      info.setAttribute("aria-live", "polite");
      [modes, note, head, list, info].forEach(function (x) { box.appendChild(x); });
      var turns = lensTurns;
      function focusStage() { stage.show("lens", null, lensFocus()); }   // the drawing plays the selected step
      [[false, "The request as it ran"], [true, "A request with a bug"]].forEach(function (m) {
        var b = el("button", "rcr-chip iris-lensmode", esc(m[1]));
        b.type = "button";
        b.dataset.mode = m[0] ? "bug" : "ran";
        b.addEventListener("click", function () {
          if (st.lensBug === m[0]) return;
          st.lensBug = m[0];
          st.lensRow = 0;   // either request starts from its first step
          draw();
          focusStage();
        });
        modes.appendChild(b);
      });
      function select(i) {
        st.lensRow = i;
        Array.prototype.forEach.call(list.children, function (b, k) { b.classList.toggle("is-on", k === i); b.setAttribute("aria-pressed", k === i ? "true" : "false"); });
        detail(info, (st.lensBug ? turns.bug : turns.ran)[i]);
      }
      function draw() {
        var rows = st.lensBug ? turns.bug : turns.ran, total = (st.lensBug ? bug : full).end;
        Array.prototype.forEach.call(modes.children, function (b) {
          var on = (b.dataset.mode === "bug") === st.lensBug;
          b.classList.toggle("is-on", on);
          b.setAttribute("aria-pressed", on ? "true" : "false");
        });
        note.innerHTML = st.lensBug ? '<p class="iris-lensbug">' + esc("Suppose a change to the app's code leaves the allergy memory out of the prompt. The reply still suggests the pad thai, " +
          "but doesn't ask to leave out peanuts. Lens shows where it went wrong: Agent Memory returned the allergy, but the app never put it in the prompt. " +
          "So the fix is in the app's code, not in Agent Memory or the model.") + "</p>" : "";
        head.innerHTML = '<span><span class="iris-nw">Session <b class="rcr-mono">' + esc(SESSION) + '</b></span> · <span class="iris-nw">agent <b class="rcr-mono">' + esc(ASSISTANT) + "</b></span></span>" +
          '<span class="iris-nw">Outcome <b class="rcr-mono">completed</b> · ' + seconds(total) + "</span>";
        list.innerHTML = "";
        rows.forEach(function (x, i) {
          var b = el("button", "iris-trow iris-src-" + x.svc);
          b.type = "button";
          b.innerHTML = '<span class="iris-tname">' + esc(x.name) + (x.op ? ' <span class="iris-top">' + esc(x.op) + "</span>" : "") +
            (x.dropped && x.dropped.length ? ' <span class="iris-top iris-bad">' + x.dropped.length + " dropped</span>" : "") + "</span>" +
            '<span class="iris-ttrack" aria-hidden="true"><span class="iris-tbar" style="left:' + (x.at / total * 100).toFixed(2) + "%;width:" + Math.max(x.ms / total * 100, 0.6).toFixed(2) + '%"></span></span>' +
            '<span class="iris-tms rcr-mono">' + took(x.ms) + "</span>";
          b.addEventListener("click", function () { if (i !== st.lensRow) { select(i); focusStage(); } });
          list.appendChild(b);
        });
        select(Math.min(st.lensRow, rows.length - 1));
      }
      draw();
      return box;
    }
    /* What Lens recorded for one step. Results are marked as Lens marks them: Entered prompt, or Not used. */
    function detail(d, x) {
      var body;
      if (x.items) {
        body = "<p>" + esc("The app records this step itself, with the intents that matched, best first.") + '</p><div class="iris-tintents">' + x.items.map(function (it) {
          return "<code>" + esc(it.name) + '</code><span class="iris-kv">score ' + it.score.toFixed(2) + " → " + esc(it.target.type + " " + it.target.ref) + "</span>";
        }).join("") + "</div>";
      } else if (x.results) {
        body = '<div class="iris-kv">Query: ' + esc(x.query) + "</div>" + x.results.map(function (r) {
          return '<div class="iris-tresult' + (r.used ? "" : " is-unused") + '"><span class="iris-mark">' + (r.used ? "Entered prompt" : "Not used") + "</span><span>" +
            '<span class="iris-kv">' + esc(r.label) + "</span> " + esc(r.text) + "</span></div>";
        }).join("");
      } else if (x.tool) {
        body = '<div class="iris-tio"><span class="iris-factlbl">Tool</span><code>' + esc(x.tool) + '</code><span class="iris-factlbl">Input</span><code>' + esc(x.input) +
          '</code><span class="iris-factlbl">Result</span><span>' + esc(x.result) + "</span></div>";
      } else if (x.svc === "app") {
        body = "<p>" + esc("Maya's message, the FAQ's answer, " + (x.used === x.of ? "all " + x.of : x.used + " of the " + x.of) + " memories, and the tool results entered the prompt." +
          x.dropped.map(function (m) { return " The app dropped the memory “" + m.text + "”"; }).join("")) + "</p>";
      } else if (x.svc === "model") {
        body = "<p>" + esc(x.note + " Lens records the prompt, what the model wrote (the completion), and its " + x.tokens + " output tokens.") + "</p>";
      } else body = "<p>" + esc(x.note) + "</p>";
      d.innerHTML = '<div class="iris-tdhead">' + esc(x.name + (x.op ? " · " + x.op : "")) + ' <span class="iris-kv">' + took(x.ms) + "</span></div>" + body;
    }

    /* ---- the data window: Redis ---- */

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
      var live = false;   // no step changes the data while you watch
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
      stage.show(step.key, step.key === "whatif" ? st.missing : null, step.key === "lens" ? lensFocus() : null);
      stage.art.setAttribute("aria-label", "Step " + (st.step + 1) + ": " + step.title);
      below.innerHTML = "";
      var card = el("div", "rcr-card iris-stepcard" + (DEPTH[step.key] ? " iris-svc-" + step.key : ""));
      card.appendChild(el("div", "iris-stephead", '<span class="iris-count">Step ' + (st.step + 1) + " of " + STEPS.length + "</span>" +
        (step.at ? '<span class="iris-clock rcr-mono">Fri, Oct 2 · ' + step.at + " UTC</span>" : "") +
        (step.preview ? '<span class="iris-badge">' + esc(DEPTH[step.key]) + " is in preview</span>" : "")));
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
      if (["reply", "lens", "whatif"].indexOf(step.key) < 0) below.appendChild(tray(st.step));
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
      next.addEventListener("click", function () { if (last) { st.missing = null; st.lensBug = false; st.lensRow = 0; } go(last ? 0 : st.step + 1); });
      nav.appendChild(back);
      nav.appendChild(dots);
      nav.appendChild(next);
      below.appendChild(nav);
    }
    render();
  }

  /* ---- preview: the stage alone, playing the tour's steps by itself ----
     For a page that links to the tour: no step cards, controls, or data windows, so the whole stage can sit
     inside a link. Each step plays for long enough for its packets to arrive, and only while the stage is on
     screen. With reduced motion, the stage shows the reply step, with every service lit, and stays still. */
  var PREVIEW_MS = { retriever: 7600, reply: 5200, lens: 4600 }, PREVIEW_DEFAULT_MS = 4200;
  function initPreview(root) {
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    root.innerHTML = "";
    root.classList.add("iris-preview");
    var stage = buildStage(root.getAttribute("data-art") || "", function () {}, function () {});
    Object.keys(stage.dataBtns).forEach(function (k) { stage.dataBtns[k].remove(); });
    stage.art.setAttribute("aria-label", "An animated preview of the Redis Iris interactive tour");
    root.appendChild(stage.el);
    root.appendChild(el("span", "iris-preview-cue", "Take the interactive tour →"));   // below the drawing, so it never covers a label
    var keys = STEPS.map(function (x) { return x.key; }).filter(function (k) { return k !== "whatif"; });
    if (reduced) { stage.show("reply"); return; }
    var i = 0, timer = 0, inView = true;
    function next() {
      var key = keys[i];
      stage.show(key);
      i = (i + 1) % keys.length;
      timer = setTimeout(function () { if (inView) next(); else timer = 0; }, PREVIEW_MS[key] || PREVIEW_DEFAULT_MS);
    }
    if (window.IntersectionObserver) new IntersectionObserver(function (es) {
      inView = es[0].isIntersecting;
      if (inView && !timer) next();
    }).observe(root);
    next();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll(".iris[data-iris]"), function (root) {
      if (root.hasAttribute("data-preview")) initPreview(root); else init(root);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.IrisDemo = { figuresMarkup: figuresMarkup, playbookDiscMarkup: playbookDiscMarkup, ROUTES: ROUTES, HITS: HITS, trace: trace, STEPS: STEPS, WHAT_IF: WHAT_IF, SERVICES: SERVICES, MEMORIES: MEMORIES, MESSAGE: MESSAGE, FEE: FEE, RELABEL: RELABEL };
})();

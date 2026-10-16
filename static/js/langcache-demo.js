/* =========================================================================
   Redis LangCache scripted demo
   Dependency-free. Everything runs in the browser against scripted
   questions; no LangCache service or LLM is called.

   Step 1: customers of the food delivery app ask its help assistant
   questions, in the order the reader chooses. The app searches the cache
   before it calls its LLM, and stores each new answer. Step 2 replays new
   questions against that cache at a threshold the reader sets, and scores
   each answer. Step 3 runs the same menu questions with and without a
   restaurant attribute, including a recipe change that makes an answer
   stale.

   Request bodies, response envelopes, and status codes follow the LangCache
   OpenAPI spec (content/develop/ai/context-engine/langcache/api-reference/
   api.yaml) and the defaults on the create-service page. Modelled rather
   than observed: the similarity scores (a hand-made table, not embeddings),
   the LLM's answers, and the timings and token counts. When several entries
   clear the threshold, the demo returns all of them, closest first, as the
   spec's "array of cache entries matching the search criteria" describes.

   Customers (u101 Maya Chen and others) and restaurants (r209 Lotus Thai,
   r201 Bangkok Street Kitchen) come from the food delivery sample data in
   context-retriever-demo.js. Keep the IDs and names in sync.

   Base styles come from context-retriever-demo.css; langcache-demo.css adds
   the pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";
  if (window.LangCacheDemo) return;   // loaded twice: the first copy already booted every widget

  /* ------------------------------------------------------------- constants */

  var THRESHOLD = 0.85;              // the service's similarity threshold: the LangCache default
  var MIN_T = 0.7, MAX_T = 0.95;     // the threshold slider's range in step 2
  var SERVICE = "food-app-help";

  var CUSTOMERS = { u101: "Maya Chen", u102: "Liam Ortiz", u103: "Priya Nair", u104: "Noah Williams",
    u105: "Sofia Rossi", u106: "Ethan Brooks", u107: "Aisha Khan", u108: "Lucas Meyer" };
  var RESTAURANTS = { r209: "Lotus Thai", r201: "Bangkok Street Kitchen" };

  /* ---- step 1: the help assistant's questions ---- */

  var ANSWERS = {
    cancel: "You can cancel from Orders > Current order until the restaurant starts preparing your food, and you get a full refund. " +
      "After that, message support and we'll check with the restaurant.",
    fee: "Delivery costs $1.99 to $4.99, depending on distance, and you see the exact fee at checkout. " +
      "Plus members get free delivery on orders over $15.",
    late1: "It depends on the restaurant. Many deliver until 11 pm, and some late-night spots deliver until 2 am. " +
      "Turn on the Open now filter to see who's delivering.",
    late2: "Yes, from restaurants that are open late. Some deliver until 2 am. Turn on the Open now filter to see who's delivering right now."
  };
  var QUESTIONS = [
    { key: "cancel1", intent: "cancel", uid: "u101", text: "How do I cancel my order?", answer: ANSWERS.cancel, llmMs: 1840, tokens: 68, searchMs: 46 },
    { key: "fee1", intent: "fee", uid: "u102", text: "How much is the delivery fee?", answer: ANSWERS.fee, llmMs: 1620, tokens: 61, searchMs: 41 },
    { key: "late1", intent: "late", uid: "u103", text: "Do you deliver after midnight?", answer: ANSWERS.late1, llmMs: 1710, tokens: 57, searchMs: 44 },
    { key: "cancel2", intent: "cancel", uid: "u104", text: "Can I still cancel an order after I've placed it?", answer: ANSWERS.cancel, llmMs: 1930, tokens: 68, searchMs: 52 },
    { key: "fee2", intent: "fee", uid: "u105", text: "What do you charge for delivery?", answer: ANSWERS.fee, llmMs: 1580, tokens: 61, searchMs: 39 },
    { key: "late2", intent: "late", uid: "u106", text: "Can I get food delivered at 1 am?", answer: ANSWERS.late2, llmMs: 1760, tokens: 49, searchMs: 48 }
  ];
  var INTENTS = { cancel: "cancelling an order", fee: "the delivery fee", late: "late-night delivery" };

  /* Similarity scores are modelled: a hand-made table, not embeddings.
     Questions with the same intent score high, except the two late-night
     questions, which score just under the default threshold on purpose. */
  var SAME_INTENT = { cancel: 0.91, fee: 0.94, late: 0.82 };
  var CROSS_INTENT = { "cancel|fee": 0.44, "cancel|late": 0.37, "fee|late": 0.41 };
  function pairKey(a, b) { return [a, b].sort().join("|"); }
  function jitter(a, b) { return (parseInt(hash8(pairKey(a, b)), 16) % 5 - 2) / 100; }
  function questionSim(a, b) {
    if (a.key === b.key) return 1;
    if (a.intent === b.intent) return SAME_INTENT[a.intent];
    return round2(CROSS_INTENT[pairKey(a.intent, b.intent)] + jitter(a.key, b.key));
  }

  /* ---- step 2: new questions, replayed at the reader's threshold ----
     `fits` is the intent whose cached answer is right for the question, or
     null when nothing cached answers it. Scores are per cached question
     (late1, late2) or per intent (either cancel or fee question). */
  var TESTS = [
    { key: "t1", uid: "u107", text: "I need to cancel the order I just placed", fits: "cancel",
      sims: { cancel: 0.92, fee: 0.43, late1: 0.35, late2: 0.33 } },
    { key: "t2", uid: "u108", text: "Is there a service fee too?", fits: null,
      sims: { cancel: 0.4, fee: 0.86, late1: 0.38, late2: 0.36 },
      why: "A service fee isn't the delivery fee, so the cached answer doesn't answer it." },
    { key: "t3", uid: "u101", text: "Is delivery free?", fits: "fee",
      sims: { cancel: 0.39, fee: 0.83, late1: 0.42, late2: 0.4 } },
    { key: "t4", uid: "u103", text: "How do I cancel my Plus membership?", fits: null,
      sims: { cancel: 0.8, fee: 0.47, late1: 0.31, late2: 0.3 },
      why: "Cancelling a membership isn't cancelling an order." },
    { key: "t5", uid: "u105", text: "Are you open late tonight?", fits: "late",
      sims: { cancel: 0.34, fee: 0.37, late1: 0.88, late2: 0.84 } },
    { key: "t6", uid: "u104", text: "Do you deliver to office buildings?", fits: null,
      sims: { cancel: 0.45, fee: 0.61, late1: 0.58, late2: 0.55 } }
  ];

  /* ---- step 3: menu questions, with and without a restaurant attribute ---- */

  var MENU = [
    { key: "m1", kind: "ask", uid: "u101", restaurant: "r209", text: "Is the green curry vegetarian?", action: "Maya asks at Lotus Thai",
      answer: "Not quite. Lotus Thai's green curry has tofu and vegetables, but the curry paste contains fish sauce. You can ask for it without.",
      llmMs: 1690, tokens: 44, searchMs: 43 },
    { key: "m2", kind: "ask", uid: "u102", restaurant: "r201", text: "Is your green curry vegetarian?", action: "Liam asks at Bangkok Street Kitchen",
      answer: "No. Bangkok Street Kitchen makes its green curry with chicken stock. The vegetable red curry is vegetarian.",
      llmMs: 1550, tokens: 35, searchMs: 45 },
    { key: "m3", kind: "change", restaurant: "r209", text: "Lotus Thai switches to a curry paste without fish sauce.", action: "Lotus Thai changes its recipe" },
    { key: "m4", kind: "ask", uid: "u107", restaurant: "r209", text: "Can vegetarians eat the green curry?", action: "Aisha asks at Lotus Thai",
      answer: "Yes. Lotus Thai now makes its green curry paste without fish sauce, so the curry is vegetarian.",
      llmMs: 1610, tokens: 31, searchMs: 47 }
  ];
  var MENU_SIM = { "m1|m2": 0.96, "m1|m4": 0.93, "m2|m4": 0.9 };
  function menuSim(a, b) { return a.key === b.key ? 1 : MENU_SIM[pairKey(a.key, b.key)]; }

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
  function shortId(id) { return id.slice(0, 4) + "…" + id.slice(-4); }
  function round2(x) { return Math.round(x * 100) / 100; }
  function f2(x) { return x.toFixed(2); }
  function byKey(list, key) { return list.filter(function (x) { return x.key === key; })[0]; }
  function bySim(a, b) { return b.sim - a.sim; }
  function atLeast(sim, threshold) { return sim >= threshold - 1e-9; }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function quote(s) { return "“" + esc(s) + "”"; }
  function seconds(ms) { return (ms / 1000).toFixed(2) + " s"; }

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

  /* ------------------------------------------------ API shapes (REST API) */

  function entryJson(entry, sim) {
    return { id: entry.id, prompt: entry.prompt, response: entry.response, attributes: entry.attributes,
      similarity: sim, searchStrategy: "semantic" };
  }
  function newEntry(src, attributes, origin) {
    return { id: id32(src.text + "|" + JSON.stringify(attributes)), src: src, prompt: src.text, response: src.answer,
      attributes: attributes, tokens: src.tokens, origin: origin || null, hits: 0, stale: false, deleted: false };
  }
  function storeRequest(entry) {
    var body = { prompt: entry.prompt, response: entry.response };
    if (Object.keys(entry.attributes).length) body.attributes = entry.attributes;
    return body;
  }

  var BASE = "https://$HOST/v1/caches/$CACHE_ID";
  function shellQuote(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }
  function curl(method, path, body) {
    var lines = ["curl -s -X " + method + " \"" + BASE + path + "\" \\", "  -H \"Authorization: Bearer $API_KEY\""];
    if (body) {
      lines[1] += " \\";
      lines.push("  -H \"Content-Type: application/json\" \\");
      lines.push("  -d " + shellQuote(JSON.stringify(body)));
    }
    return lines.join("\n");
  }

  /* ------------------------------------------------------------ the model */

  /* Step 1: send the questions in the reader's order. Each one searches the
     cache first; a miss calls the LLM and stores the answer. */
  function runQuestions(asked) {
    var entries = [], items = [];
    asked.forEach(function (key) {
      var q = byKey(QUESTIONS, key);
      var ranked = entries.map(function (e) { return { entry: e, sim: questionSim(q, e.src) }; }).sort(bySim);
      var returned = ranked.filter(function (r) { return atLeast(r.sim, THRESHOLD); });
      var item = { src: q, uid: q.uid, near: ranked[0] || null, match: returned[0] || null,
        search: { request: { prompt: q.text }, response: { data: returned.map(function (r) { return entryJson(r.entry, r.sim); }) } } };
      if (item.match) {
        item.match.entry.hits++;
        item.reply = item.match.entry.response;
      } else {
        var e = newEntry(q, {});
        entries.push(e);
        item.stored = e;
        item.reply = q.answer;
        item.store = { request: storeRequest(e), response: { entryId: e.id } };
      }
      items.push(item);
    });
    return { items: items, entries: entries };
  }
  function metrics(items) {
    var hits = items.filter(function (i) { return i.match; });
    var ms = items.reduce(function (s, i) { return s + i.src.searchMs; }, 0);
    return { requests: items.length, hits: hits.length, llm: items.length - hits.length,
      ratio: items.length ? Math.round(100 * hits.length / items.length) : null,
      latency: items.length ? Math.round(ms / items.length) : null,
      saved: hits.reduce(function (s, i) { return s + i.match.entry.tokens; }, 0) };
  }

  /* Step 2: score every replayed question against the step 1 cache. */
  function testSim(t, entry) { var s = t.sims[entry.src.key]; return s != null ? s : t.sims[entry.src.intent]; }
  function evalTests(entries, threshold) {
    var rows = TESTS.map(function (t) {
      var ranked = entries.map(function (e) { return { entry: e, sim: testSim(t, e) }; }).sort(bySim);
      var returned = ranked.filter(function (r) { return atLeast(r.sim, threshold); });
      var best = ranked[0], hit = returned.length > 0;
      var verdict = hit ? (best.entry.src.intent === t.fits ? "right" : "wrong") :
        (t.fits && ranked.some(function (r) { return r.entry.src.intent === t.fits; }) ? "missed" : "none");
      return { t: t, ranked: ranked, best: best, hit: hit, verdict: verdict,
        request: { prompt: t.text, similarityThreshold: threshold },
        response: { data: returned.map(function (r) { return entryJson(r.entry, r.sim); }) } };
    });
    function count(v) { return rows.filter(function (r) { return r.verdict === v; }).length; }
    return { rows: rows, right: count("right"), wrong: count("wrong"), missed: count("missed"), none: count("none"),
      hits: count("right") + count("wrong") };
  }

  /* Step 3: the first n events, in one lane. Without attributes, entries
     carry no restaurant, so a recipe change can't target them and they go
     stale. With them, each search and store names the restaurant. */
  function runMenu(n, scoped) {
    var entries = [], items = [];
    MENU.slice(0, n).forEach(function (m) {
      if (m.kind === "change") {
        var item = { src: m, change: true };
        var live = entries.filter(function (e) { return !e.deleted && e.origin === m.restaurant; });
        if (scoped) {
          live.forEach(function (e) { e.deleted = true; });
          item.del = { request: { attributes: { restaurant: m.restaurant } }, response: { deletedEntriesCount: live.length } };
        } else {
          live.forEach(function (e) { e.stale = true; });
          item.stale = live.length;
        }
        items.push(item);
        return;
      }
      var pool = entries.filter(function (e) { return !e.deleted && (!scoped || e.attributes.restaurant === m.restaurant); });
      var ranked = pool.map(function (e) { return { entry: e, sim: menuSim(m, e.src) }; }).sort(bySim);
      var returned = ranked.filter(function (r) { return atLeast(r.sim, THRESHOLD); });
      var request = { prompt: m.text };
      if (scoped) request.attributes = { restaurant: m.restaurant };
      var it = { src: m, uid: m.uid, match: returned[0] || null,
        search: { request: request, response: { data: returned.map(function (r) { return entryJson(r.entry, r.sim); }) } } };
      if (it.match) {
        var hit = it.match.entry;
        hit.hits++;
        it.reply = hit.response;
        it.verdict = hit.origin !== m.restaurant ? "other" : hit.stale ? "stale" : "right";
      } else {
        var e = newEntry(m, scoped ? { restaurant: m.restaurant } : {}, m.restaurant);
        entries.push(e);
        it.stored = e;
        it.reply = m.answer;
        it.verdict = "llm";
        it.store = { request: storeRequest(e), response: { entryId: e.id } };
      }
      items.push(it);
    });
    var wrong = items.filter(function (i) { return i.verdict === "other" || i.verdict === "stale"; }).length;
    return { items: items, entries: entries, wrong: wrong };
  }

  /* ----------------------------------------------------------------- notes */

  function questionNotes(run, phase) {
    var items = run.items, last = items[items.length - 1];
    if (!last) return ["The cache starts empty, so the first question can't be a hit. Choose a question to send it through the app."];
    if (phase === 1) return ["The app searches the cache before it calls the LLM. It sends the prompt text, and LangCache generates the embedding."];
    var notes = [];
    if (last.match) {
      notes.push("Hit. " + esc(CUSTOMERS[last.uid]) + "'s question is worded differently from " + quote(last.match.entry.prompt) +
        ", but their similarity is " + f2(last.match.sim) + ", above the " + f2(THRESHOLD) + " threshold. The app replies with the cached answer in " +
        last.src.searchMs + " ms and doesn't call the LLM.");
    } else if (phase === 2 || phase === 3) {
      return ["The search returned an empty <code>data</code> array: a miss. The app calls its LLM for an answer."];
    } else if (!last.near) {
      notes.push("Miss: the cache is empty. The app calls its LLM, replies, and stores the prompt and response as the cache's first entry.");
    } else if (last.near.entry.src.intent === last.src.intent) {
      notes.push("Miss, although " + quote(last.near.entry.prompt) + " asks nearly the same thing. Their similarity is " + f2(last.near.sim) +
        ", below the " + f2(THRESHOLD) + " threshold, so the search returns an empty <code>data</code> array. The app calls the LLM again and stores " +
        "a second entry for nearly the same question. Step 2 looks at where to set the threshold.");
    } else {
      notes.push("Miss. Nothing in the cache is similar enough: the closest entry, " + quote(last.near.entry.prompt) + ", scores " + f2(last.near.sim) +
        ". The app calls its LLM, replies, and stores the answer for the next customer who asks something similar.");
    }
    /* Every in-flight frame returned above, so the last request is complete:
       this is its final frame, or a later redraw. */
    if (items.length === QUESTIONS.length) {
      var m = metrics(items);
      notes.push("All six questions are answered: " + m.hits + " from the cache and " + m.llm + " from the LLM, a " + m.ratio +
        "% hit ratio. A new cache starts with misses, and its hit ratio rises as it fills with answers to common questions.");
    }
    return notes;
  }

  function thresholdNotes(ev, t) {
    var notes = [], isDefault = Math.abs(t - THRESHOLD) < 1e-9;
    notes.push("At " + f2(t) + (isDefault ? ", the default," : "") + " the cache answers " + ev.hits + " of " + TESTS.length + " questions" +
      (ev.hits === 0 ? "." : ev.wrong ? ", and " + (ev.wrong === 1 ? "1 answer is" : ev.wrong + " answers are") + " wrong." : ", and every answer is right."));
    ev.rows.forEach(function (r) {
      if (r.verdict === "wrong") notes.push(quote(r.t.text) + " scores " + f2(r.best.sim) + " against " + quote(r.best.entry.prompt) + ". " + esc(r.t.why));
    });
    var missed = ev.rows.filter(function (r) { return r.verdict === "missed"; });
    if (missed.length) {
      notes.push(missed.map(function (r) { return quote(r.t.text) + " (" + f2(r.best.sim) + ")"; }).join(" and ") +
        (missed.length === 1 ? " calls" : " call") + " the LLM, although a cached answer fits.");
    }
    var falseHit = byKey(TESTS, "t2"), weakHit = byKey(TESTS, "t3");
    notes.push("No threshold gets all six right, because a wrong match can score higher than a right one: " + quote(falseHit.text) + " scores " +
      f2(falseHit.sims.fee) + ", and " + quote(weakHit.text) + " scores " + f2(weakHit.sims.fee) + ". LangCache recommends starting between 0.80 and 0.90. " +
      "Start high, then lower the threshold gradually while you check the matches.");
    return notes;
  }

  function menuNotes(n, phase) {
    var m = MENU[n - 1];
    if (!n) return ["Both lanes use the same service and get the same events. Only their requests differ. Start with the first event."];
    if (phase != null && phase < (m.kind === "change" ? 2 : 4)) {
      return [m.kind === "change" ? "The recipe changed, so Lotus Thai's cached answer about its green curry is out of date." :
        "Both lanes get the same question. Only their requests differ."];
    }
    return {
      m1: ["Both searches miss, because nothing about this curry is cached yet. Each lane calls the LLM and stores the answer. " +
        "The lane with attributes stores it with <code>\"restaurant\": \"r209\"</code>."],
      m2: ["Without attributes, Liam gets Lotus Thai's answer. The two questions score " + f2(MENU_SIM["m1|m2"]) + ", and nothing tells the cache " +
        "they're about different restaurants. With the attribute, the search only looks at Bangkok Street Kitchen's entries, finds none, and the app asks the LLM."],
      m3: ["With attributes, one <code>DELETE</code> call removes every Lotus Thai entry and nothing else. Without them, the app can't select " +
        "Lotus Thai's entries. It can delete entries one at a time by ID, if it kept the IDs, or flush the whole cache."],
      m4: ["Without attributes, Aisha gets the old answer, which says the curry has fish sauce. With attributes, the search misses, and the LLM " +
        "answers from the new recipe.",
        "A service can have up to 5 attributes, and you can't change them after you create the service, so plan them first."]
    }[m.key];
  }

  /* ------------------------------------------------------------------ view */

  function init(root) {
    var st = { tab: "questions", asked: [], threshold: THRESHOLD, seen: {}, menu: 0, open: {}, anim: 0, busy: false };
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function wait(ms) { return new Promise(function (r) { setTimeout(r, reduced ? 0 : ms); }); }

    root.innerHTML = "";
    root.appendChild(buildSettings());
    var tabs = el("div", "rcr-tabs");
    tabs.setAttribute("role", "tablist");
    var TABS = [["questions", "1", "Hits and misses"], ["threshold", "2", "Similarity threshold"], ["attributes", "3", "Attributes"]];
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

    /* Steps unlock in order: the threshold once every question has been
       answered, attributes once the threshold step has been opened. */
    function lockReason(name) {
      if (name === "threshold" && (st.asked.length < QUESTIONS.length || (st.busy && st.tab === "questions"))) return "Send all six questions first.";
      if (name === "attributes" && !st.seen.threshold) return "Try the similarity threshold first.";
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
      if (name === "threshold") st.seen.threshold = true;
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
      if (st.tab === "questions") renderQuestions();
      else if (st.tab === "threshold") renderThreshold();
      else renderAttributes();
    }
    function restart() {
      cancel();
      st.asked = []; st.threshold = THRESHOLD; st.seen = {}; st.menu = 0; st.open = {};
      advance("questions");
    }

    /* ---- service settings (read-only) ---- */

    function buildSettings() {
      var d = el("details", "rcr-card rlc-settings");
      d.appendChild(el("summary", "", '<span class="rlc-settings-title">Service settings</span><span class="rcr-faint">' + SERVICE +
        " · threshold " + f2(THRESHOLD) + " · no TTL · attribute: restaurant</span>"));
      var grid = el("div", "rlc-setgrid");
      [
        ["Similarity threshold", f2(THRESHOLD), "The default. A search can override it with <code>similarityThreshold</code>."],
        ["TTL", "No expiration", "The default. Entries stay until they're deleted or the cache is flushed. A store request can set <code>ttlMillis</code> for one entry."],
        ["Embedding provider", "Redis", "LangCache generates the embeddings, so the app sends text."],
        ["Search strategy", "semantic", "The default. Add <code>exact</code> to <code>searchStrategies</code> to also match identical prompts, ignoring case."],
        ["Attributes", "restaurant", "Defined when the service was created. A service can have up to 5, and they can't be changed later."]
      ].forEach(function (r) {
        var row = el("div", "rlc-set");
        row.appendChild(el("span", "rcr-lbl", esc(r[0])));
        row.appendChild(el("span", "rcr-mono", esc(r[1])));
        row.appendChild(el("span", "rcr-faint", r[2]));
        grid.appendChild(row);
      });
      d.appendChild(grid);
      d.appendChild(el("p", "rcr-note", "These settings are fixed in the demo. On Redis Cloud, you can edit the threshold and TTL after you create the service."));
      return d;
    }

    /* ---- shared pieces ---- */

    function callout(notes) {
      var c = el("div", "rlc-callout");
      notes.forEach(function (n) { c.appendChild(el("p", "", n)); });
      return c;
    }
    function controlsRow(primary) {
      var row = el("div", "rlc-controls");
      var r = el("button", "rcr-btn", "Restart");
      r.type = "button";
      r.disabled = !st.asked.length && st.tab === "questions";
      r.addEventListener("click", restart);
      row.appendChild(r);
      if (primary) {
        var b = el("button", "rcr-btn rcr-btn-primary", esc(primary.label));
        b.type = "button";
        b.disabled = st.busy;
        b.addEventListener("click", primary.fn);
        row.appendChild(b);
      }
      return row;
    }
    function pre(obj) { return el("pre", "rcr-code rcr-code-sm", jsonHtml(obj)); }
    function grid(a, b, cls) { var g = el("div", "rlc-grid" + (cls ? " " + cls : "")); g.appendChild(a); g.appendChild(b); return g; }
    function remember(d, key) {
      if (st.open[key]) d.open = true;
      d.addEventListener("toggle", function () { st.open[key] = d.open; });
      return d;
    }

    /* A LangCache API call. With no status it's still in flight. */
    function callCard(label, method, path, request, status, response, tag) {
      var head = (tag ? '<span class="rlc-tag rlc-tag-' + tag.kind + '">' + esc(tag.text) + "</span>" : "") +
        '<span class="rcr-lbl">' + method + '</span> <span class="rcr-mono rcr-callname">' + esc(path) +
        '</span> <span class="rcr-faint rcr-callargs">' + esc(label) + "</span>";
      if (!status) return el("div", "rcr-call rlc-callrow", head + '<span class="rcr-status"><span class="rcr-dot is-wait"></span> …</span>');
      var d = el("details", "rcr-call");
      d.appendChild(el("summary", "", head + '<span class="rcr-status"><span class="rcr-dot is-ok"></span> ' + status + "</span>"));
      var body = el("div", "rcr-callbody");
      if (request) { body.appendChild(el("div", "rcr-lbl", "Request body")); body.appendChild(pre(request)); }
      body.appendChild(el("div", "rcr-lbl", "Response"));
      body.appendChild(response == null ? el("p", "rcr-faint", "No content.") : pre(response));
      var cd = el("details", "rcr-curl");
      cd.appendChild(el("summary", "", "Run this call yourself with curl"));
      cd.appendChild(el("pre", "rcr-code rcr-code-sm", esc(curl(method, path, request))));
      body.appendChild(cd);
      d.appendChild(body);
      return d;
    }
    /* The app's own LLM call: not part of LangCache, so it has no request to show. */
    function llmRow(src, done) {
      return el("div", "rlc-llm", '<span class="rcr-lbl">LLM</span><span class="rcr-faint rcr-callargs">Your app calls its own model</span>' +
        '<span class="rcr-status">' + (done ? '<span class="rcr-dot is-ok"></span> ' + seconds(src.llmMs) + " · " + src.tokens + " output tokens" :
          '<span class="rcr-dot is-wait"></span> generating…') + "</span>");
    }
    function thinking() { return el("div", "rcr-msg rcr-agent rcr-thinking", "<span></span><span></span><span></span>"); }
    function searchTag(item) {
      return item.match ? { kind: "hit", text: "Hit " + f2(item.match.sim) } : { kind: "miss", text: "Miss" };
    }
    var VERDICTS = {
      other: ["bad", "Another restaurant's answer"],
      stale: ["bad", "Out-of-date answer"]
    };
    function reply(item) {
      var wrap = el("div", "rlc-reply");
      wrap.appendChild(el("div", "rcr-msg rcr-agent", esc(item.reply)));
      var src = item.match ?
        '<span class="rlc-src is-cache">From the cache</span> similarity ' + f2(item.match.sim) + " · " + item.src.searchMs + " ms" :
        '<span class="rlc-src is-llm">From the LLM</span> ' + seconds(item.src.searchMs + item.src.llmMs);
      var v = VERDICTS[item.verdict];
      wrap.appendChild(el("div", "rlc-srcline", src + (v ? ' <span class="rlc-verdict is-' + v[0] + '">' + v[1] + "</span>" : "")));
      return wrap;
    }
    /* The row's summary already names the customer, so this shows the ID,
       and in step 3 the restaurant, which the summary leaves out. */
    function whoLine(item) {
      var r = item.src.restaurant;
      return el("div", "rlc-who", '<span class="rcr-mono">' + item.uid + "</span>" + (r ? " at " + esc(RESTAURANTS[r]) : ""));
    }

    /* One request, drawn up to `phase`: 1 searching, 2 search done (a hit is
       complete here), 3 the LLM has answered, 4 the answer is stored. */
    function requestBody(item, phase) {
      var box = el("div", "rlc-req");
      if (item.change) {
        box.appendChild(el("div", "rlc-event", '<span class="rcr-lbl">Menu change</span> ' + esc(item.src.text)));
        if (item.del) {
          box.appendChild(callCard("Delete Lotus Thai's entries", "DELETE", "/entries", item.del.request, phase >= 2 ? "200" : null, item.del.response));
        } else if (phase >= 2) {
          box.appendChild(el("p", "rlc-nocall", "No request. Without an attribute, the app has no way to select Lotus Thai's entries, so " +
            (item.stale ? "the cached answer stays." : "nothing changes.")));
        }
        return box;
      }
      box.appendChild(whoLine(item));
      box.appendChild(el("div", "rcr-msg rcr-user", esc(item.src.text)));
      box.appendChild(callCard("Search the cache", "POST", "/entries/search", item.search.request, phase >= 2 ? "200" : null,
        item.search.response, phase >= 2 ? searchTag(item) : null));
      if (item.match) { if (phase >= 2) box.appendChild(reply(item)); return box; }
      if (phase >= 2) box.appendChild(llmRow(item.src, phase >= 3));
      if (phase === 2) box.appendChild(thinking());
      if (phase >= 3) {
        box.appendChild(reply(item));
        box.appendChild(callCard("Store the answer", "POST", "/entries", item.store.request, phase >= 4 ? "201" : null, item.store.response));
      }
      return box;
    }
    /* Every request is a one-line row that expands. Earlier rows start
       collapsed and the latest starts open; its outcome shows once its search
       is done. Collapsing the latest row holds while its animation plays, and
       it's kept apart from the earlier rows' state, so the row collapses like
       the others when the next request arrives. */
    function logRow(item, key, phase, current) {
      var d = el("details", "rlc-past" + (current ? " is-current" : ""));
      var done = phase >= 2, outcome = "";
      if (item.change) {
        if (done) outcome = '<span class="rlc-tag rlc-tag-miss">' + (item.del ? "Deleted " + item.del.response.deletedEntriesCount : "No request") + "</span>";
      } else {
        outcome = done ? '<span class="rlc-tag rlc-tag-' + searchTag(item).kind + '">' + esc(searchTag(item).text) + "</span>" :
          '<span class="rlc-tag rlc-tag-miss">Searching…</span>';
      }
      var v = done ? VERDICTS[item.verdict] : null;
      var sum = el("summary", "", '<span class="rlc-pastwho">' + esc(item.change ? "Menu change" : CUSTOMERS[item.uid]) + "</span>" +
        '<span class="rlc-pasttext">' + esc(item.src.text) + "</span>" + (v ? '<span class="rlc-verdict is-' + v[0] + '">' + v[1] + "</span>" : "") + outcome);
      d.appendChild(sum);
      d.appendChild(requestBody(item, phase));
      if (current) {
        d.open = st.open["now:" + key] !== false;
        sum.addEventListener("click", function () { st.open["now:" + key] = !d.open; });
      } else remember(d, key);
      return d;
    }
    function requestLog(items, phase, prefix) {
      var log = el("div", "rlc-log");
      items.forEach(function (item, i) {
        var current = i === items.length - 1;
        log.appendChild(logRow(item, prefix + i, current && phase != null ? phase : 4, current));
      });
      return log;
    }

    function entryRow(e, opts) {
      var r = el("div", "rlc-entry" + (opts.fresh ? " rlc-fresh" : "") + (opts.used ? " is-used" : "") +
        (e.stale ? " is-stale" : "") + (e.deleted ? " is-deleted" : ""));
      var attrs = Object.keys(e.attributes).map(function (k) { return '<span class="rlc-attr">' + esc(k) + ": " + esc(e.attributes[k]) + "</span>"; }).join("");
      var state = e.deleted ? '<span class="rlc-verdict is-bad">deleted</span>' : e.stale ? '<span class="rlc-verdict is-bad">out of date</span>' : "";
      r.appendChild(el("div", "rlc-eprompt", quote(e.prompt)));
      r.appendChild(el("div", "rlc-eresp", esc(e.response)));
      r.appendChild(el("div", "rlc-emeta", '<span class="rcr-mono">' + shortId(e.id) + "</span> · " + plural(e.hits, "hit") + attrs + state));
      return r;
    }
    function metricTiles(m) {
      var t = el("div", "rlc-metrics");
      [[m.ratio == null ? "–" : m.ratio + "%", "Cache hit ratio"], [String(m.requests), "Cache search requests"],
        [m.latency == null ? "–" : m.latency + " ms", "Cache latency"], [String(m.saved), "Output tokens saved"]].forEach(function (x) {
        t.appendChild(el("div", "rlc-metric", '<span class="rlc-mval">' + x[0] + '</span><span class="rlc-mlbl">' + x[1] + "</span>"));
      });
      return t;
    }
    function cacheCard(title, entries, opts) {
      var card = el("div", "rcr-card rlc-cache");
      card.appendChild(el("div", "rcr-cardhead", "<span>" + esc(title) + '</span><span class="rlc-chip">' +
        plural(entries.filter(function (e) { return !e.deleted; }).length, "entry", "entries") + "</span>"));
      if (opts.metrics) card.appendChild(opts.metrics);
      if (!entries.length) card.appendChild(el("p", "rlc-empty", opts.empty || "Empty."));
      entries.forEach(function (e) { card.appendChild(entryRow(e, { fresh: opts.fresh === e, used: opts.used === e })); });
      if (opts.note) card.appendChild(el("p", "rcr-note", opts.note));
      return card;
    }

    /* ---- tab 1: hits and misses ---- */

    function renderQuestions(view) {
      var phase = view ? view.phase : null;
      var run = runQuestions(st.asked), items = run.items, last = items[items.length - 1];
      /* While the latest request is in flight, the cache and metrics show
         what the app knows so far. */
      var before = phase === 1 ? runQuestions(st.asked.slice(0, -1)) : run;
      var entries = before.entries.filter(function (e) { return !(last && e === last.stored && phase != null && phase < 4); });
      var m = metrics(phase === 1 ? before.items : items);
      var p = panels.questions;
      p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "Customers of the food delivery app ask its help assistant questions. Before the app calls its LLM, " +
        "it searches LangCache for a similar question that's already been answered. Choose which question arrives next, and watch the cache fill."));

      var log = el("div", "rcr-card rlc-logcard");
      log.appendChild(el("div", "rcr-cardhead", '<span>Help assistant</span><span class="rlc-chip">' + items.length + " of " + QUESTIONS.length + " questions</span>"));
      if (!items.length) log.appendChild(el("p", "rlc-empty", "No questions yet."));
      else log.appendChild(requestLog(items, phase, "q"));
      var left = QUESTIONS.filter(function (q) { return st.asked.indexOf(q.key) < 0; });
      if (!st.busy && left.length) {
        var c = el("div", "rlc-composer");
        c.appendChild(el("span", "rcr-lbl", "Choose the next question"));
        var list = el("div", "rlc-options");
        left.forEach(function (q) {
          var b = el("button", "rcr-chip rlc-option", '<span class="rlc-optwho">' + esc(CUSTOMERS[q.uid]) + "</span>" + esc(q.text));
          b.type = "button";
          b.addEventListener("click", function () { ask(q.key); });
          list.appendChild(b);
        });
        c.appendChild(list);
        log.appendChild(c);
      }
      var used = phase != null && last && last.match ? last.match.entry : null;
      var fresh = phase === 4 && last ? last.stored : null;
      p.appendChild(grid(log, cacheCard("Cache", entries, { metrics: metricTiles(m), fresh: fresh, used: used,
        empty: "Empty. Nothing has been stored yet.",
        note: "The first three figures are the ones on the service's Metrics tab in Redis Cloud. The API searches entries but doesn't list them: the demo shows them so you can follow along." })));
      p.appendChild(callout(questionNotes(run, phase)));
      p.appendChild(controlsRow(!st.busy && !left.length ? { label: "Next: similarity threshold", fn: function () { advance("threshold"); } } : null));
      syncTabs();
    }
    function ask(key) {
      if (st.busy || st.asked.indexOf(key) >= 0) return;
      st.asked.push(key);
      var item = runQuestions(st.asked).items[st.asked.length - 1];
      var steps = [[0, function () { renderQuestions({ phase: 1 }); }]];
      if (item.match) steps.push([700, function () { renderQuestions({ phase: 2 }); }]);
      else {
        steps.push([700, function () { renderQuestions({ phase: 2 }); }]);
        steps.push([1100, function () { renderQuestions({ phase: 3 }); }]);
        steps.push([600, function () { renderQuestions({ phase: 4 }); }]);
      }
      play(steps);
    }

    /* ---- tab 2: similarity threshold ---- */

    var VERDICT_LABEL = {
      right: ["ok", "Hit, right answer"], wrong: ["bad", "Hit, wrong answer"],
      missed: ["warn", "Miss, a cached answer fits"], none: ["none", "Miss, nothing cached fits"]
    };
    function barPos(x) { return Math.max(0, Math.min(100, (x - 0.5) / 0.5 * 100)); }

    function renderThreshold() {
      var run = runQuestions(st.asked);
      var p = panels.threshold;
      p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "Six new questions, replayed against the cache from step 1. Move the threshold to see which ones " +
        "the cache answers and whether each answer is right. The replay only searches, so the cache doesn't change."));

      var card = el("div", "rcr-card rlc-thrcard");
      var ctl = el("div", "rlc-thrctl");
      var lbl = el("label", "rlc-ctl", '<span class="rcr-lbl">Similarity threshold</span>');
      var thr = el("input", "rlc-range");
      thr.type = "range"; thr.min = String(MIN_T); thr.max = String(MAX_T); thr.step = "0.01"; thr.value = String(st.threshold);
      thr.setAttribute("aria-label", "Similarity threshold");
      var val = el("span", "rcr-mono rlc-thrval");
      lbl.appendChild(thr); lbl.appendChild(val);
      ctl.appendChild(lbl);
      var reset = el("button", "rcr-btn rlc-small", "Back to the default");
      reset.type = "button";
      ctl.appendChild(reset);
      card.appendChild(ctl);
      var tiles = el("div", "rlc-metrics rlc-metrics-3");
      card.appendChild(tiles);
      var rows = el("div", "rlc-rows");
      card.appendChild(rows);
      card.appendChild(el("p", "rcr-note", "The bars run from 0.50 to 1.00, and the line marks the threshold. The search request sets " +
        "<code>similarityThreshold</code>, so it overrides the service's default for that search only."));
      p.appendChild(card);
      var notes = el("div", "");
      p.appendChild(notes);
      p.appendChild(controlsRow({ label: "Next: attributes", fn: function () { advance("attributes"); } }));

      /* Redraw only the results, so the slider keeps focus while it's dragged. */
      function refresh() {
        var t = st.threshold, ev = evalTests(run.entries, t);
        val.textContent = f2(t) + (Math.abs(t - THRESHOLD) < 1e-9 ? " (default)" : "");
        reset.hidden = Math.abs(t - THRESHOLD) < 1e-9;
        tiles.innerHTML = "";
        [[ev.hits + " of " + TESTS.length, "Answered from the cache"], [String(ev.wrong), "Wrong answers"],
          [String(ev.missed), "LLM calls a cached answer could have saved"]].forEach(function (x, i) {
          tiles.appendChild(el("div", "rlc-metric" + (i === 1 && ev.wrong ? " is-bad" : ""), '<span class="rlc-mval">' + x[0] + '</span><span class="rlc-mlbl">' + x[1] + "</span>"));
        });
        rows.innerHTML = "";
        ev.rows.forEach(function (r) {
          var v = VERDICT_LABEL[r.verdict];
          var d = remember(el("details", "rlc-row is-" + v[0]), "t:" + r.t.key);
          d.appendChild(el("summary", "",
            '<span class="rlc-rowq"><span class="rlc-rowtext">' + quote(r.t.text) + '</span><span class="rlc-rowmeta">Closest cached prompt: ' +
              quote(r.best.entry.prompt) + ". " + (r.t.fits ? "Its answer fits." : "Nothing cached answers this.") + "</span></span>" +
            '<span class="rlc-score"><span class="rlc-bar"><span class="rlc-fill" style="width:' + barPos(r.best.sim) + '%"></span>' +
              '<span class="rlc-tick" style="left:' + barPos(t) + '%"></span></span><span class="rcr-mono">' + f2(r.best.sim) + "</span></span>" +
            '<span class="rlc-verdict is-' + v[0] + '">' + v[1] + "</span>"));
          var body = el("div", "rcr-callbody");
          body.appendChild(el("div", "rcr-lbl", "Request body"));
          body.appendChild(pre(r.request));
          body.appendChild(el("div", "rcr-lbl", "Response · 200"));
          body.appendChild(pre(r.response));
          var cd = el("details", "rcr-curl");
          cd.appendChild(el("summary", "", "Run this call yourself with curl"));
          cd.appendChild(el("pre", "rcr-code rcr-code-sm", esc(curl("POST", "/entries/search", r.request))));
          body.appendChild(cd);
          d.appendChild(body);
          rows.appendChild(d);
        });
        notes.innerHTML = "";
        notes.appendChild(callout(thresholdNotes(ev, t)));
      }
      thr.addEventListener("input", function () { st.threshold = round2(+thr.value); refresh(); });
      reset.addEventListener("click", function () { st.threshold = THRESHOLD; thr.value = String(THRESHOLD); refresh(); thr.focus(); });
      refresh();
      syncTabs();
    }

    /* ---- tab 3: attributes ---- */

    function lane(scoped, phase) {
      var run = runMenu(st.menu, scoped), items = run.items, last = items[items.length - 1];
      /* While the latest event is in flight, the cache shows what it held before it. */
      var before = phase === 1 ? runMenu(st.menu - 1, scoped) : run;
      var entries = before.entries.filter(function (e) { return !(last && e === last.stored && phase != null && phase < 4); });
      var card = el("div", "rcr-card rlc-lane" + (scoped ? " is-scoped" : ""));
      var wrong = phase != null && last && (last.verdict === "other" || last.verdict === "stale") && phase < 2 ? run.wrong - 1 : run.wrong;
      card.appendChild(el("div", "rlc-lanehead", '<div class="rlc-lanetitle">' + (scoped ? "With a restaurant attribute" : "Without attributes") +
        '</div><div class="rcr-faint">' + (scoped ? "Each search and store names the restaurant." : "Every search looks at the whole cache.") +
        '</div><div class="rlc-chips"><span class="rlc-chip' + (wrong ? " is-bad" : "") + '">' + plural(wrong, "wrong answer") + "</span></div>"));
      if (!items.length) card.appendChild(el("p", "rlc-empty", "No events yet."));
      else card.appendChild(requestLog(items, phase, (scoped ? "b" : "a")));
      var used = phase != null && phase >= 2 && last && last.match ? last.match.entry : null;
      card.appendChild(cacheCard("Menu entries in the cache", entries, { fresh: phase === 4 && last ? last.stored : null, used: used,
        empty: "None yet." }));
      return card;
    }
    function renderAttributes(view) {
      var phase = view ? view.phase : null;
      var p = panels.attributes;
      p.innerHTML = "";
      p.appendChild(el("p", "rcr-lede", "A menu question's answer depends on the restaurant. The service has a <code>restaurant</code> attribute, " +
        "so the app can store each answer with the restaurant it's about, and search only that restaurant's answers. " +
        "Step through the same events with and without it."));
      p.appendChild(grid(lane(false, phase), lane(true, phase), "rlc-lanes"));
      p.appendChild(el("p", "rcr-note", "The FAQ entries from step 1 are still in the cache. They have no restaurant attribute, and they're " +
        "not similar enough to match, so the lanes leave them out."));
      p.appendChild(callout(menuNotes(st.menu, phase)));
      var next = MENU[st.menu];
      p.appendChild(controlsRow(!st.busy && next ? { label: next.action, fn: step } : null));
      syncTabs();
    }
    function step() {
      if (st.busy || st.menu >= MENU.length) return;
      var m = MENU[st.menu++];
      var steps = [[0, function () { renderAttributes({ phase: 1 }); }], [700, function () { renderAttributes({ phase: 2 }); }]];
      if (m.kind === "ask") {
        steps.push([1100, function () { renderAttributes({ phase: 3 }); }]);
        steps.push([600, function () { renderAttributes({ phase: 4 }); }]);
      }
      play(steps);
    }

    renderQuestions();
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".rlc[data-rlc]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.LangCacheDemo = { THRESHOLD: THRESHOLD, QUESTIONS: QUESTIONS, TESTS: TESTS, MENU: MENU, questionSim: questionSim,
    runQuestions: runQuestions, metrics: metrics, evalTests: evalTests, runMenu: runMenu, questionNotes: questionNotes,
    thresholdNotes: thresholdNotes, menuNotes: menuNotes, curl: curl, id32: id32 };
})();

/* =========================================================================
   Redis Agent Memory scripted demo
   Dependency-free. Everything runs in the browser against a scripted
   conversation; no Agent Memory service is called.

   The reader chooses what the customer says at each turn. The assistant's
   replies, the session summary, the extracted memories, the next session's
   recall, and every note follow from those choices.

   Request bodies, response envelopes, session summaries, memory records, and
   the 404 for a missing session mirror what a live Agent Memory service and
   its OpenAPI spec returned (Sep 2026). Two parts are modelled rather than
   observed: the extracted memory texts, and the similarity scores, which come
   from small hand-made vectors (the real service doesn't return scores).

   The customer (u101 Maya Chen), restaurants (r209 Lotus Thai, r201 Bangkok
   Street Kitchen), and order (o3003) come from the food delivery sample data
   in context-retriever-demo.js. Every path still places order o3003, a green
   curry with no fish sauce and jasmine rice. Keep the IDs and names in sync.

   Base styles come from context-retriever-demo.css; agent-memory-demo.css
   adds the pieces this demo needs.
   ========================================================================= */
(function () {
  "use strict";
  if (window.AgentMemoryDemo) return;   // loaded twice: the first copy already booted every widget

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
  var SCRIPTED_LIMIT = 3;

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

  /* Timestamps for the six Thursday events: Maya, assistant, Maya, ... */
  var SLOTS = [
    { at: "2026-09-24T17:58:05Z", ms: 412 }, { at: "2026-09-24T17:58:09Z", ms: 87 },
    { at: "2026-09-24T17:58:41Z", ms: 230 }, { at: "2026-09-24T17:58:45Z", ms: 655 },
    { at: "2026-09-24T17:59:20Z", ms: 518 }, { at: "2026-09-24T18:00:02Z", ms: 341 }
  ];

  /* What Maya can say at each turn. In each message, `mem` marks the text a
     memory comes from, `skip` marks text extraction leaves out, and
     `sensitive` marks the gate code that the exclusion settings act on. */
  var TURNS = [
    { prompt: "Choose Maya's first message", options: [
      [{ t: "Hi! Can you find me dinner tonight? " }, { t: "I'm vegetarian", mem: "veg" }, { t: " and " },
        { t: "I love spicy Thai food", mem: "spicy" }, { t: "." }],
      [{ t: "Hi! " }, { t: "I'm vegetarian", mem: "veg" }, { t: ". " },
        { t: "Something mild tonight, please, spicy food doesn't agree with me", mem: "mild" }, { t: "." }],
      [{ t: "Just get me something quick, " }, { t: "I'm starving", skip: "a passing state" }, { t: "." }]
    ] },
    { prompt: "Choose how Maya answers", options: [
      [{ t: "I'm allergic to peanuts", mem: "peanut" }, { t: ". And " }, { t: "no fish sauce", mem: "fish" }, { t: ", please." }],
      [{ t: "Only " }, { t: "fish sauce", mem: "fish" }, { t: ". Please leave it out." }],
      [{ t: "No fish sauce", mem: "fish" }, { t: ", please. And " },
        { t: "nothing with dairy, I'm lactose intolerant", mem: "lactose" }, { t: "." }]
    ] },
    { prompt: "Choose how Maya confirms the order", options: [
      [{ t: "Yes please! " }, { t: "Leave it at the door", mem: "door" }, { t: ", " },
        { t: "the gate code is 4417", sensitive: true }, { t: ". " }, { t: "It's been a long day.", skip: "small talk" }],
      [{ t: "Yes please! " }, { t: "Just leave it at the door", mem: "door" }, { t: "." }],
      [{ t: "Yes please! " }, { t: "Ring the bell when you get here", mem: "bell" }, { t: "." }]
    ] }
  ];
  var GATE_CODE = 0;       // the third-turn option that shares the gate code
  var NO_FACTS = 2;        // the first-turn option with nothing lasting in it

  /* How the order comes out of the first two answers. */
  function recipe(choices) {
    return {
      spice: choices[0] === 0 ? "extra spicy" : choices[0] === 1 ? "mild" : "",
      avoid: choices[1] === 0 ? ["peanuts", "fish sauce"] : choices[1] === 2 ? ["fish sauce", "dairy"] : ["fish sauce"]
    };
  }
  function noAnd(items) { return items.map(function (x) { return "no " + x; }).join(" and "); }
  function noOr(items) { return "no " + (items.length > 1 ? items.slice(0, -1).join(", ") + " or " + items[items.length - 1] : items[0]); }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  /* "an extra spicy green curry with jasmine rice from Lotus Thai, with no peanuts or fish sauce" */
  function orderPhrase(choices, forWhom) {
    var r = recipe(choices), dish = (r.spice ? r.spice + " " : "") + "green curry";
    return (/^[aeiou]/.test(dish) ? "an " : "a ") + dish + " with jasmine rice from Lotus Thai" + (forWhom || "") + ", with " + noOr(r.avoid);
  }

  function assistantParts(turn, choices) {
    var r = recipe(choices);
    if (turn === 0) {
      return [
        [{ t: "Lotus Thai has a green curry you might like, and I can ask for it extra spicy.", mem: "order" }],
        [{ t: "Lotus Thai's green curry is vegetarian, and I can ask for it mild.", mem: "order" }],
        [{ t: "Lotus Thai can have a green curry at your door in about 25 minutes.", mem: "order" }]
      ][choices[0]].concat([{ t: " Is there anything you can't eat?" }]);
    }
    if (turn === 1) {
      return [{ t: "Got it. " }, { t: (r.spice ? cap(r.spice) + " green curry" : "Green curry") + " with " + noAnd(r.avoid) + ".", mem: "order" },
        { t: " Shall I add " }, { t: "jasmine rice", mem: "order" }, { t: " and place the order?" }];
    }
    return [{ t: "Done. Order o3003 is placed with Lotus Thai", mem: "order" }, { t: " and should arrive in about 25 minutes. " +
      (choices[2] === 2 ? "I'll ask the driver to ring the bell." : "I'll ask the driver to leave it at the door.") }];
  }

  /* The Thursday events for the turns played so far. */
  function s1Script(choices, turns) {
    var out = [];
    for (var t = 0; t < turns; t++) {
      out.push({ role: "USER", turn: t, parts: TURNS[t].options[choices[t]] });
      out.push({ role: "ASSISTANT", turn: t, parts: assistantParts(t, choices) });
    }
    return out.map(function (d, i) { d.at = SLOTS[i].at; d.ms = SLOTS[i].ms; return d; });
  }

  function summaryText(choices) {
    var r = recipe(choices);
    return "Maya asked for " + ["a vegetarian, spicy Thai dinner", "a mild vegetarian dinner", "a quick dinner"][choices[0]] + ". " +
      ["She is allergic to peanuts and doesn't want fish sauce.", "She doesn't want fish sauce.",
        "She is lactose intolerant and doesn't want fish sauce."][choices[1]] +
      " The assistant suggested Lotus Thai's green curry" + (r.spice ? ", " + r.spice + "," : "") + " with " + noOr(r.avoid) +
      ", and offered to add jasmine rice and place the order.";
  }

  /* Memories extraction can produce. Vector dimensions: taste, diet, avoid,
     delivery, order history, other. */
  var DOOR_TEXT = {
    off: "User wants deliveries left at the door. Gate code: 4417.",
    semantic: "User wants deliveries left at the door.",
    detector: "User wants deliveries left at the door. [REDACTED]."
  };
  var MEMS = {
    veg: { type: "semantic", text: "User is vegetarian.", vec: [0.25, 1.0, 0.35, 0, 0.1, 0.05] },
    spicy: { type: "semantic", text: "User loves spicy Thai food.", vec: [1.0, 0.25, 0.05, 0, 0.3, 0.05] },
    mild: { type: "semantic", text: "User prefers mild food because spicy food doesn't agree with them.", vec: [0.9, 0.3, 0.3, 0, 0.2, 0.05] },
    peanut: { type: "semantic", text: "User is allergic to peanuts.", vec: [0.1, 0.35, 1.0, 0, 0, 0.05] },
    fish: { type: "semantic", text: "User avoids fish sauce.", vec: [0.35, 0.5, 0.8, 0, 0.05, 0.05] },
    lactose: { type: "semantic", text: "User is lactose intolerant and avoids dairy.", vec: [0.15, 0.45, 0.95, 0, 0, 0.05] },
    door: { type: "semantic", vec: [0, 0, 0, 1.0, 0.15, 0.1], text: function (settings, choices) {
      return choices[2] === GATE_CODE ? DOOR_TEXT[settings.exclusion] : "User wants deliveries left at the door."; } },
    bell: { type: "semantic", text: "User wants the driver to ring the bell on arrival.", vec: [0, 0, 0, 0.95, 0.1, 0.2] },
    order: { type: "episodic", vec: [0.75, 0.3, 0.35, 0.15, 1.0, 0.05], text: function (settings, choices) {
      return "On September 24, 2026, the assistant ordered " + orderPhrase(choices, " for the user") + "."; } }
  };

  /* Long-term memories once the extraction run has processed `processed`
     events. Numbers follow the order the memories are created in. */
  function memoriesFor(settings, choices, processed) {
    var script = s1Script(choices, 3), p = processed == null ? script.length : processed, keys = [];
    script.forEach(function (d, i) {
      if (d.role !== "USER") return;
      d.parts.forEach(function (part) {
        if (part.mem && keys.every(function (k) { return k.key !== part.mem; })) keys.push({ key: part.mem, at: i });
      });
    });
    keys.push({ key: "order", at: script.length - 1 });
    return keys.map(function (k, i) {
      var d = MEMS[k.key];
      return { key: k.key, num: i + 1, at: k.at, type: d.type, vec: d.vec,
        text: typeof d.text === "function" ? d.text(settings, choices) : d.text,
        sensitive: k.key === "door" && choices[2] === GATE_CODE && settings.exclusion === "off", id: id32("memory:" + k.key) };
    }).filter(function (m) { return m.at < p; });
  }

  /* What the extraction run did with one event, with {n} for memory badges. */
  function outcome(d, mems, settings, choices) {
    var num = {};
    mems.forEach(function (m) { num[m.key] = "{" + m.num + "}"; });
    if (d.role === "ASSISTANT") {
      return ["Part of " + num.order + ", a record of what happened.", "Part of " + num.order + ".", "Completes " + num.order + "."][d.turn];
    }
    if (d.turn === 2 && choices[2] === GATE_CODE) {
      return {
        semantic: "Kept as " + num.door + ". The semantic exclusion left out the gate code, and the small talk isn't worth keeping.",
        detector: "Kept as " + num.door + ", and the gate_code detector replaced the code with [REDACTED]. The small talk isn't worth keeping.",
        off: "Kept as " + num.door + ", gate code included. The small talk isn't worth keeping."
      }[settings.exclusion];
    }
    var kept = d.parts.filter(function (p) { return p.mem; }).map(function (p) { return num[p.mem]; });
    return kept.length ? "Kept as " + kept.join(" and ") + "." : "Nothing kept. Being hungry right now isn't a lasting fact.";
  }

  /* Saturday lunch: what Maya can say, and how the assistant answers from
     whatever long-term memory returns. */
  var QUERIES = [
    { key: "lunch", text: "I'm hungry. What should I get for lunch?", vec: [0.9, 0.35, 0.1, 0.1, 0.6, 0.1] },
    { key: "allergy", text: "Food allergies and ingredients to avoid", vec: [0.15, 0.45, 0.9, 0, 0.1, 0.15] },
    { key: "delivery", text: "Where should the driver leave my order?", vec: [0, 0, 0, 1.0, 0.25, 0.2] },
    { key: "last", text: "What did I order last time?", vec: [0.35, 0.05, 0.05, 0.15, 1.0, 0.1] },
    { key: "car", text: "What car do I drive?", vec: [0, 0, 0, 0.1, 0.05, 1.0] }
  ];
  var SAFETY_QUERY = QUERIES[1];
  var LUNCH = [
    { kind: "suggest", text: "I'm hungry. What should I get for lunch?", vec: QUERIES[0].vec },
    { kind: "reorder", text: "Can you order what I had on Thursday again?", vec: [0.4, 0.05, 0.05, 0.15, 1.0, 0.1] }
  ];
  var S2_SLOTS = [{ at: "2026-09-26T12:30:10Z", ms: 208 }, { at: "2026-09-26T12:30:16Z", ms: 590 }];

  function lunchReply(choice, got, choices) {
    if (LUNCH[choice].kind === "reorder") {
      if (!got.order) return "I couldn't find your last order. What would you like?";
      var s = "Sure! On Thursday you had " + orderPhrase(choices) + ". Want me to order it again?";
      if (got.peanut) s += " It has no peanuts, so it's safe with your allergy.";
      if (got.lactose) s += " It has no dairy, so it's fine for your lactose intolerance.";
      return s;
    }
    var avoid = [];
    if (got.peanut) avoid.push("peanuts");
    if (got.fish) avoid.push("fish sauce");
    if (got.lactose) avoid.push("dairy");
    return "Welcome back, Maya! " + (got.order ? "You had Lotus Thai's green curry on Thursday, so how about something different: " : "How about ") +
      (got.veg ? "a vegetarian pad thai" : "a pad thai") + " from Bangkok Street Kitchen" +
      (got.spicy ? ", extra spicy" : got.mild ? ", made mild" : "") + (avoid.length ? ", with " + noAnd(avoid) : "") + "?";
  }
  /* The two searches the assistant runs before it replies, and the reply. */
  function lunchPlan(choice, mems, choices) {
    var primary = runSearch(LUNCH[choice], SCRIPTED_LIMIT, 0, mems);
    var safety = runSearch(SAFETY_QUERY, SCRIPTED_LIMIT, 0, mems);
    var got = {};
    primary.returned.concat(safety.returned).forEach(function (r) { got[r.mem.key] = true; });
    var reply = lunchReply(choice, got, choices);
    return { kind: LUNCH[choice].kind, query: LUNCH[choice], primary: primary, safety: safety, used: got,
      script: [
        { role: "USER", at: S2_SLOTS[0].at, ms: S2_SLOTS[0].ms, parts: [{ t: LUNCH[choice].text }] },
        { role: "ASSISTANT", at: S2_SLOTS[1].at, ms: S2_SLOTS[1].ms, parts: [{ t: reply }] }
      ] };
  }

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
  var WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight"];
  function dayLabel(iso) { var d = new Date(iso); return DAYS[d.getUTCDay()] + ", " + MONTHS[d.getUTCMonth()] + " " + d.getUTCDate(); }
  function dateLabel(iso) { var d = new Date(iso); return MONTHS[d.getUTCMonth()] + " " + d.getUTCDate() + ", " + d.getUTCFullYear(); }
  function hhmm(iso) { return iso.slice(11, 16); }
  function hhmmss(iso) { return iso.slice(11, 19); }
  function plus(iso, seconds) { return new Date(Date.parse(iso) + seconds * 1000).toISOString(); }
  function plural(n, one, many) { return n + " " + (n === 1 ? one : (many || one + "s")); }
  function ttlOf(key) { return TTLS.filter(function (t) { return t.key === key; })[0]; }
  function textOf(def) { return def.parts.map(function (p) { return p.t; }).join(""); }

  /* Number badges are SVG: a circle and the digit's outline from Geist Bold
     (static/fonts/Geist-Bold.woff2, 1000 units per em, y up), placed so the
     outline's bounding box sits exactly on the circle's centre. Drawing the
     outline instead of text keeps the digit centred in every browser: text
     is snapped to whole pixels, and the site only declares Geist Regular, so
     bold digits would be synthesized differently by each renderer. */
  var DIGITS = {
    "0": { adv: 696, b: [46, -16, 651, 726], d: "M46 354Q46 468 82.5 552Q119 636 187.5 681Q256 726 348 726Q440 726 508.5 681Q577 636 614 552Q651 468 651 354Q651 241 614.5 157.5Q578 74 509.5 29Q441 -16 348 -16Q255 -16 187 28.5Q119 73 82.5 156.5Q46 240 46 354ZM494 354Q494 474 456.5 536Q419 598 348 598Q277 598 239.5 536Q202 474 202 354Q202 235 239.5 173.5Q277 112 348 112Q419 112 456.5 173.5Q494 235 494 354Z" },
    "1": { adv: 449, b: [38, 0, 344, 710], d: "M192 467H38V578H99Q167 578 195 607Q223 636 223 710H344V0H192Z" },
    "2": { adv: 653, b: [58, 0, 596, 726], d: "M310 379Q362 406 389 425Q416 444 428 463.5Q440 483 440 510Q440 550 414 574Q388 598 340 598Q286 598 254.5 566.5Q223 535 215 475L59 484Q69 598 141.5 662Q214 726 338 726Q418 726 476.5 699.5Q535 673 565.5 624.5Q596 576 596 512Q596 457 577.5 419Q559 381 520 349.5Q481 318 410 280Q327 236 284.5 197Q242 158 239 128H596V0H58Q58 92 82.5 158Q107 224 161.5 276.5Q216 329 310 379Z" },
    "3": { adv: 653, b: [46, -16, 607, 726], d: "M46 208 201 214Q211 112 326 112Q382 112 416.5 137Q451 162 451 210Q451 260 416.5 286Q382 312 321 312H257V425H321Q370 425 399 446Q428 467 428 511Q428 553 402.5 575.5Q377 598 324 598Q272 598 243.5 577Q215 556 210 519L57 527Q67 618 137 672Q207 726 324 726Q449 726 516.5 673Q584 620 584 527Q584 472 552 433.5Q520 395 460 376Q531 357 569 311.5Q607 266 607 199Q607 98 531.5 41Q456 -16 326 -16Q196 -16 123.5 43.5Q51 103 46 208Z" },
    "4": { adv: 680, b: [46, 0, 634, 710], d: "M399 135H46V256L370 710H551V263H634V135H551V0H399ZM399 263V523L207 263Z" },
    "5": { adv: 671, b: [56, -16, 615, 710], d: "M56 196 210 203Q218 158 250 135Q282 112 334 112Q393 112 426 145Q459 178 459 236Q459 293 425 327.5Q391 362 333 362Q291 362 260 343.5Q229 325 216 295H64L113 710H566V582H242L221 418Q249 445 288 459.5Q327 474 376 474Q448 474 502 443Q556 412 585.5 358Q615 304 615 236Q615 159 580.5 102Q546 45 482 14.5Q418 -16 334 -16Q206 -16 135 40.5Q64 97 56 196Z" },
    "6": { adv: 661, b: [56, -16, 604, 726], d: "M56 313Q56 500 131.5 613Q207 726 356 726Q457 726 519 677Q581 628 601 540L460 530Q447 565 423 583Q399 601 356 601Q225 601 204 398Q229 429 269.5 447.5Q310 466 364 466Q436 466 490.5 437Q545 408 574.5 355.5Q604 303 604 234Q604 156 570 99.5Q536 43 474.5 13.5Q413 -16 332 -16Q196 -16 126 69.5Q56 155 56 313ZM453 232Q453 288 420.5 323Q388 358 336 358Q279 358 244 323.5Q209 289 209 232Q209 175 242.5 140Q276 105 331 105Q386 105 419.5 139.5Q453 174 453 232Z" },
    "7": { adv: 596, b: [36, 0, 560, 710], d: "M406 582H36V710H560V591Q444 460 389 321.5Q334 183 334 0H180Q180 160 240 309Q300 458 406 582Z" },
    "8": { adv: 668, b: [36, -16, 632, 726], d: "M36 193Q36 262 74.5 311Q113 360 181 381Q128 400 99 438.5Q70 477 70 531Q70 620 139.5 673Q209 726 334 726Q459 726 528 673Q597 620 597 531Q597 477 567.5 438.5Q538 400 485 381Q554 360 593 311Q632 262 632 193Q632 92 552.5 38Q473 -16 334 -16Q196 -16 116 38Q36 92 36 193ZM475 216Q475 265 438 294.5Q401 324 334 324Q267 324 229.5 295Q192 266 192 216Q192 167 230.5 139.5Q269 112 334 112Q399 112 437 139.5Q475 167 475 216ZM442 515Q442 554 414 576.5Q386 599 334 599Q282 599 253.5 576.5Q225 554 225 515Q225 473 253.5 452Q282 431 334 431Q386 431 414 452Q442 473 442 515Z" },
    "9": { adv: 665, b: [56, -16, 609, 726], d: "M68 160 214 169Q236 109 314 109Q383 109 418 155Q453 201 459 304Q403 231 292 231Q222 231 168.5 260.5Q115 290 85.5 344Q56 398 56 469Q56 547 89 605Q122 663 182 694.5Q242 726 322 726Q466 726 537.5 637.5Q609 549 609 380Q609 189 536 86.5Q463 -16 314 -16Q120 -16 68 160ZM448 471Q448 532 415.5 568.5Q383 605 327 605Q272 605 240 569Q208 533 208 472Q208 412 240 376Q272 340 325 340Q382 340 415 375Q448 410 448 471Z" }
  };
  var BADGE = { size: 19, font: 11 }, BADGE_SM = { size: 16, font: 10 };
  function badge(n, small) {
    var b = small ? BADGE_SM : BADGE, half = b.size / 2, s = b.font / 1000, chars = String(n).split(""), x = 0, box = null, paths = [];
    chars.forEach(function (c) {
      var g = DIGITS[c];
      if (!g) return;
      paths.push({ g: g, x: x });
      var gb = [g.b[0] + x, g.b[1], g.b[2] + x, g.b[3]];
      box = box ? [Math.min(box[0], gb[0]), Math.min(box[1], gb[1]), Math.max(box[2], gb[2]), Math.max(box[3], gb[3])] : gb;
      x += g.adv;
    });
    var tx = box ? half - s * (box[0] + box[2]) / 2 : half, ty = box ? half + s * (box[1] + box[3]) / 2 : half;
    return '<span class="ram-num' + (small ? " ram-num-sm" : "") + '" data-num="' + n + '"><svg aria-hidden="true" width="' + b.size +
      '" height="' + b.size + '" viewBox="0 0 ' + b.size + " " + b.size + '"><circle cx="' + half + '" cy="' + half + '" r="' + half + '"/>' +
      paths.map(function (q) {
        return '<path transform="translate(' + (tx + s * q.x).toFixed(4) + " " + ty.toFixed(4) + ") scale(" + s + " " + (-s) + ')" d="' + q.g.d + '"/>';
      }).join("") + '</svg><span class="ram-sr">' + n + "</span></span>";
  }

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
  function summaryJson(upToEventId, count, text) {
    return { createdAt: SUMMARY_AT, metadata: {}, summarizedEvents: count, summarizedUpToEventId: upToEventId,
      text: text, updatedAt: SUMMARY_AT };
  }

  /* What GET /session-memory/{sessionId} returns after the first n events.
     `summary` is the summary text, for sessions that get summarized. */
  function sessionView(script, sessionId, n, summarize, summary) {
    var all = script.slice(0, n).map(function (d, i) { return eventJson(d, i, sessionId); });
    if (summarize && summary && n >= SUMMARIZE_AFTER) {
      var cut = n - KEEP_RECENT;
      return { all: all, events: all.slice(cut), summary: summaryJson(all[cut - 1].eventId, cut, summary) };
    }
    return { all: all, events: all, summary: null };
  }
  function sessionResponse(sessionId, view) {
    var r = { events: view.events, ownerId: OWNER, sessionId: sessionId };
    if (view.summary) r.summary = view.summary;
    return r;
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

  /* ----------------------------------------------------------------- notes */

  function chatNotes(n, view, st) {
    var code = st.choices[2] === GATE_CODE;
    if (view.summarizing) return ["The session just reached " + SUMMARIZE_AFTER + " messages, so summarization starts in the background."];
    if (n === 0) return ["Session memory is empty. Choose what Maya says to start the conversation."];
    if (n === 1) return ["Maya's message is in session memory the moment she sends it, before the assistant replies."];
    if (n === 2) return ["Each message is stored word for word, in order. Before every reply, your app fetches the session by its ID, so the assistant knows what was just said."];
    if (n < 5) return ["Long-term memory is still empty. Extraction runs in the background every 5 minutes, so the conversation never waits for it."];
    if (n === 5) return [code ? "Maya just shared her gate code. Session memory stores it exactly as she sent it." :
      "Session memory stores Maya's delivery instructions exactly as she sent them."];
    if (!st.settings.summarize) return ["Automatic summarization is off, so the session returns all 6 messages in full. Turn it on in Service settings to compare."];
    return ["The session reached " + SUMMARIZE_AFTER + " messages, so the " + (SUMMARIZE_AFTER - KEEP_RECENT) +
      " oldest were condensed into a summary. The session now returns the summary and the " + KEEP_RECENT +
      " most recent messages in full, which keeps the model's prompt short.",
      code ? "The gate code is still in session memory, exactly as Maya sent it." :
        "Her delivery instructions are in the 2 most recent messages, kept word for word."];
  }

  function extractNotes(k, running, st, mems) {
    if (running) return ["The pipeline reads each new event and decides what's worth keeping."];
    if (k < SLOTS.length) return ["The extraction pipeline hasn't run yet. Run it to see which parts of the conversation become long-term memories."];
    var facts = mems.filter(function (m) { return m.type === "semantic"; }).length;
    var first = "Six messages became " + WORDS[mems.length] + " memories: " + WORDS[facts] + " " + (facts === 1 ? "fact" : "facts") +
      " about Maya and one record of the order.";
    if (st.choices[0] === NO_FACTS) first += " Her first message had nothing lasting in it, so nothing was kept from it.";
    if (st.choices[2] === GATE_CODE) first += " The small talk wasn't kept.";
    var notes = [first];
    if (st.choices[2] === GATE_CODE) {
      notes.push({
        semantic: "The semantic exclusion kept the gate code out of long-term memory. Session memory still has it, because exclusions never change session memory. " +
          "Semantic exclusions are advisory, so don't rely on them alone for real secrets.",
        detector: "The gate_code detector replaced the code with [REDACTED] in long-term memory. Detector matches are applied deterministically. " +
          "Session memory still has the code, because exclusions never change session memory.",
        off: "With exclusions off, the gate code is now in long-term memory, where it's kept for " + LONG_TTL_DAYS + " days. " +
          "Pick an exclusion in Service settings to compare."
      }[st.settings.exclusion]);
    } else {
      notes.push("Nothing Maya said this time was sensitive, so the exclusion setting made no difference. Restart and have her share her gate code to see exclusions at work.");
    }
    notes.push("Each memory records its owner, u101, and the session it came from, so the app can find it after the session is gone.");
    return notes;
  }

  function allergyNote(plan, mems) {
    var allergy = mems.filter(function (m) { return m.key === "peanut" || m.key === "lactose"; })[0];
    if (!allergy) {
      return "Maya never mentioned an allergy, so search 2 only turns up the foods she avoids. " +
        "The assistant runs it anyway, because it can't know in advance what it will find.";
    }
    var label = (allergy.key === "peanut" ? "peanut allergy" : "lactose intolerance") + ", memory " + allergy.num + ",", rank = 0;
    plan.primary.ranked.forEach(function (r, i) { if (r.mem.key === allergy.key) rank = i; });
    if (rank >= SCRIPTED_LIMIT) {
      return "Search 1 has a limit of " + SCRIPTED_LIMIT + ", so it returns only the " + SCRIPTED_LIMIT + " memories closest to Maya's message. " +
        "The " + label + " is the " + ORDINALS[rank] + " closest, so search 1 leaves it out. " +
        "That's why the assistant also runs search 2, for allergies and foods to avoid, before it " + (plan.kind === "reorder" ? "reorders." : "suggests food.");
    }
    return "The " + label + " is among the " + SCRIPTED_LIMIT + " memories closest to Maya's message, so search 1 returns it on its own. " +
      "Rankings shift with every question, though, so the assistant always runs search 2, for allergies and foods to avoid, too.";
  }

  function laterNotes(step, s1Gone, ttl, plan, mems) {
    if (step === 0) {
      return [s1Gone ? "The Thursday session is gone: it's past its " + ttl.adj + " short-term TTL, so fetching it returns 404." :
        "With a " + ttl.adj + " short-term TTL, the Thursday session is still stored. But a new conversation starts a new session, and sessions are fetched by ID, not searched.",
        "Long-term memory still has all " + WORDS[mems.length] + " memories. They're kept for " + LONG_TTL_DAYS + " days."];
    }
    if (step < 5) return ["Before replying, the assistant searches long-term memory for what it knows about Maya."];
    if (plan.kind === "reorder") {
      return [s1Gone ? "The assistant found Thursday's order in long-term memory, even though the session it came from is gone." :
        "The assistant found Thursday's order in long-term memory, without reading the Thursday session.",
        allergyNote(plan, mems),
        "Placing the order again would go through the app's own data, for example through Context Retriever."];
    }
    return ["Maya didn't repeat any of her preferences. The assistant knows them because it searched long-term memory before it replied.",
      allergyNote(plan, mems),
      "The restaurant suggestion comes from the app's own data, for example through Context Retriever."];
  }

  /* -------------------------------------------------------------------- UI */

  function init(root) {
    var st = {
      tab: "chat", turn: 0, choices: [], extracted: false, lunch: null,
      settings: { ttl: "1h", summarize: true, exclusion: "semantic" },
      search: { q: "lunch", limit: SCRIPTED_LIMIT, threshold: 0 },
      open: {}, anim: 0, busy: false, focus: null
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

    /* Steps unlock in order: extraction once the conversation has finished
       playing, the later session once extraction has. Unlocked steps stay
       open so readers can go back; Restart locks them again. */
    function lockReason(name) {
      if (name === "extract" && (st.turn < TURNS.length || (st.busy && st.tab === "chat"))) return "Finish the conversation first.";
      if (name === "later" && (!st.extracted || (st.busy && st.tab === "extract"))) return "Run the background extraction first.";
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
    function renderCurrent() {
      if (st.tab === "chat") renderChat();
      else if (st.tab === "extract") renderExtract();
      else renderLater();
    }
    function restart() {
      cancel();
      st.turn = 0; st.choices = []; st.extracted = false; st.lunch = null; st.focus = null;
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
      r.disabled = st.turn === 0 && !st.extracted && st.lunch == null && st.tab === "chat";
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
    /* The reader picks what Maya says next. */
    function composer(label, messages, pick) {
      var c = el("div", "ram-composer");
      c.appendChild(el("span", "rcr-lbl", esc(label)));
      var list = el("div", "ram-options");
      messages.forEach(function (m, i) {
        var b = el("button", "rcr-chip ram-option", esc(m));
        b.type = "button";
        b.addEventListener("click", function () { pick(i); });
        list.appendChild(b);
      });
      c.appendChild(list);
      return c;
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
        r.dataset.mem = m.key;
        r.insertAdjacentHTML("beforeend", badge(m.num, false));
        var found = used ? (used.length > 1 ? "Found by searches 1 and 2" : "Found by search " + used[0]) : "";
        r.appendChild(el("div", "", '<div class="ram-memtext">' + esc(m.text) + '</div><div class="ram-memmeta"><span class="ram-type ram-type-' +
          m.type + '">' + m.type + "</span>from " + S1 + (used ? ' <span class="ram-used">' + found + "</span>" : "") + "</div>"));
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
      var script = s1Script(st.choices, st.turn);
      p.innerHTML = "";
      p.appendChild(headRow(n ? script[n - 1].at : SLOTS[0].at));
      p.appendChild(el("p", "rcr-lede", "Maya Chen, a customer of the food delivery app, asks its assistant for dinner. " +
        "Choose what she says at each step. Every message goes into session memory the moment it's sent, and her choices decide what the service remembers."));
      var c = chatCard(script, n);
      if (view.thinking) c.chat.appendChild(thinking());
      if (!st.busy && st.turn < TURNS.length) {
        c.card.appendChild(composer(TURNS[st.turn].prompt, TURNS[st.turn].options.map(function (o) { return textOf({ parts: o }); }), sendNext));
      }
      p.appendChild(c.card);
      var sv = sessionView(script, S1, n, st.settings.summarize && !view.summarizing, n >= SUMMARIZE_AFTER ? summaryText(st.choices) : null);
      var api = n ? detailsEl("chat-api", "Show the API calls", function (body) {
        var last = sv.all[n - 1];
        apiBlock(body, "Add the latest event", "POST", "/session-memory/events", addEventRequest(last), "201", { event: last });
        apiBlock(body, "Fetch the session", "GET", "/session-memory/" + S1, null, "200", sessionResponse(S1, sv));
      }) : null;
      p.appendChild(grid(
        sessionCard([{ id: S1, view: sv, summarizing: view.summarizing, freshSummary: view.freshSummary,
          fresh: view.fresh && n ? sv.all[n - 1].eventId : null, emptyText: "No events yet. The session starts with Maya's first message." }], api),
        ltmCard([], { empty: "Empty for now. The extraction pipeline runs in the background every 5 minutes, so replies never wait for it." })));
      p.appendChild(callout(chatNotes(n, view, st)));
      p.appendChild(controlsRow(st.turn < TURNS.length ? null :
        { label: "Next: background extraction", fn: function () { show("extract"); } }));
      syncTabs();
    }
    function sendNext(choice) {
      if (st.busy || st.turn >= TURNS.length) return;
      var t = st.turn;
      st.choices[t] = choice;
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
      view = view || { processed: st.extracted ? SLOTS.length : 0 };
      var k = view.processed, p = panels.extract;
      var script = s1Script(st.choices, TURNS.length);
      var all = memoriesFor(st.settings, st.choices), mems = memoriesFor(st.settings, st.choices, k);
      p.innerHTML = "";
      p.appendChild(headRow(k || view.running ? EXTRACTION_AT : SLOTS[SLOTS.length - 1].at));
      p.appendChild(el("p", "rcr-lede", "Five minutes after the conversation started, the extraction pipeline reads the new session events " +
        "in the background. It saves what's worth remembering as long-term memories."));
      p.appendChild(extractionCard(script, all, k, view.running));
      var fresh = {};
      mems.forEach(function (m) { if (view.running && m.at === k - 1) fresh[m.key] = true; });
      p.appendChild(grid(
        sessionCard([{ id: S1, view: sessionView(script, S1, SLOTS.length, st.settings.summarize, summaryText(st.choices)) }], null),
        ltmCard(mems, { fresh: fresh, empty: "Empty until the extraction pipeline runs." })));
      p.appendChild(callout(extractNotes(k, view.running, st, all)));
      p.appendChild(controlsRow(!st.extracted || view.running ?
        { label: "Run the extraction", busy: "Extracting…", fn: runExtraction } :
        { label: "Next: two days later", fn: function () { show("later"); } }));
      applyFocus();
      syncTabs();
    }
    function extractionCard(script, all, k, running) {
      var card = el("div", "rcr-card ram-extract");
      var status = running ? '<span class="rcr-dot is-wait"></span> running' :
        k >= script.length ? '<span class="rcr-dot is-ok"></span> done' : "waiting";
      card.appendChild(el("div", "rcr-cardhead", "<span>Extraction run at " + hhmm(EXTRACTION_AT) + " UTC</span>" +
        '<span class="ram-chip">' + status + "</span>"));
      var num = {};
      all.forEach(function (m) { num[m.key] = m.num; });
      script.forEach(function (def, i) {
        var seen = i < k;
        var row = el("div", "ram-xrow" + (seen ? "" : " is-pending") + (running && i === k - 1 ? " is-active" : ""));
        row.appendChild(el("div", "", '<span class="ram-role ram-role-' + def.role.toLowerCase() + '">' + def.role + "</span> " +
          (seen ? annotate(def, num) : esc(textOf(def)))));
        if (seen) row.appendChild(el("div", "ram-xout", badges(outcome(def, all, st.settings, st.choices))));
        card.appendChild(row);
      });
      var legend = ['<span><span class="ram-hl">highlighted</span> saved as a memory. Select it to find the memory</span>',
        '<span><span class="ram-left">struck through</span> left out</span>'];
      if (st.settings.exclusion === "off" && st.choices[2] === GATE_CODE) legend.push('<span><span class="ram-sens">red</span> sensitive, and kept</span>');
      card.appendChild(el("div", "ram-legend", legend.join("")));
      return card;
    }
    function annotate(def, num) {
      return def.parts.map(function (p) {
        if (p.mem) return link(p.mem, num[p.mem], '<span class="ram-hl">' + esc(p.t) + '</span><sup class="ram-tag">' + num[p.mem] + "</sup>");
        if (p.skip) return '<span class="ram-left" title="Left out: ' + esc(p.skip) + '">' + esc(p.t) + "</span>";
        if (p.sensitive) {
          if (st.settings.exclusion === "off") return link("door", num.door, '<span class="ram-sens">' + esc(p.t) + '</span><sup class="ram-tag ram-tag-bad">' + num.door + "</sup>");
          return '<span class="ram-left" title="' + (st.settings.exclusion === "detector" ? "Redacted by the gate_code detector" :
            "Left out by the semantic exclusion") + '">' + esc(p.t) + "</span>";
        }
        return esc(p.t);
      }).join("");
    }
    function link(key, n, html) {
      return '<span class="ram-link" data-mem="' + key + '" role="button" tabindex="0" aria-pressed="false" title="Show memory ' + n +
        ' in long-term memory">' + html + "</span>";
    }
    /* Selecting highlighted text in the extraction run highlights the memory
       it became, and every other piece of text that went into that memory. */
    function applyFocus() {
      var p = panels.extract;
      Array.prototype.forEach.call(p.querySelectorAll(".ram-link"), function (x) {
        var on = x.dataset.mem === st.focus;
        x.classList.toggle("is-focus", on);
        x.setAttribute("aria-pressed", on ? "true" : "false");
      });
      Array.prototype.forEach.call(p.querySelectorAll(".ram-mem"), function (r) { r.classList.toggle("is-focus", r.dataset.mem === st.focus); });
    }
    function toggleFocus(key) {
      st.focus = st.focus === key ? null : key;
      applyFocus();
      var row = st.focus && panels.extract.querySelector('.ram-mem[data-mem="' + st.focus + '"]');
      if (row && row.scrollIntoView) row.scrollIntoView({ block: "nearest", behavior: reduced ? "auto" : "smooth" });
    }
    panels.extract.addEventListener("click", function (e) {
      var l = e.target.closest && e.target.closest(".ram-link");
      if (l) toggleFocus(l.dataset.mem);
    });
    panels.extract.addEventListener("keydown", function (e) {
      var l = e.target.closest && e.target.closest(".ram-link");
      if (l && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); toggleFocus(l.dataset.mem); }
    });
    function badges(text) { return esc(text).replace(/\{(\d)\}/g, function (m, n) { return badge(+n, true); }); }
    function runExtraction() {
      if (st.busy || st.extracted) return;
      st.extracted = true;
      var steps = [[0, function () { renderExtract({ processed: 0, running: true }); }]];
      SLOTS.forEach(function (d, i) {
        steps.push([550, function () { renderExtract({ processed: i + 1, running: i + 1 < SLOTS.length }); }]);
      });
      play(steps);
    }

    /* ---- tab 3: two days later ---- */

    function renderLater(view) {
      view = view || { step: st.lunch == null ? 0 : 5 };
      var step = view.step, p = panels.later;
      var ttl = ttlOf(st.settings.ttl);
      var gap = (Date.parse(LATER_AT) - Date.parse(SLOTS[SLOTS.length - 1].at)) / 1000;
      var s1Gone = ttl.seconds < gap;
      var mems = memoriesFor(st.settings, st.choices);
      var plan = st.lunch == null ? null : lunchPlan(st.lunch, mems, st.choices);
      var n2 = step >= 5 ? 2 : step >= 1 ? 1 : 0;
      var s2 = sessionView(plan ? plan.script : [], S2, n2, false, null);
      var s1v = sessionView(s1Script(st.choices, TURNS.length), S1, SLOTS.length, st.settings.summarize, summaryText(st.choices));

      p.innerHTML = "";
      p.appendChild(headRow(n2 ? plan.script[n2 - 1].at : LATER_AT));
      p.appendChild(el("p", "rcr-lede", "Two days later, Maya opens the app and starts a new conversation. " +
        (s1Gone ? "The Thursday session is past its short-term TTL, but long-term memory still has what she shared." :
          "The Thursday session is still within its short-term TTL, but the new conversation gets a new session.")));

      var extra = {};
      if (step >= 1) extra[0] = [callCard("Store Maya's message", "POST", "/session-memory/events", addEventRequest(s2.all[0]), "201", { event: s2.all[0] })];
      if (step >= 2) extra[0].push(callCard("Search for her message", "POST", "/long-term-memory/search", searchRequest(plan.query, SCRIPTED_LIMIT, 0), "200", plan.primary.body, "Search 1"));
      if (step >= 3) extra[0].push(callCard("Search for allergies and foods to avoid", "POST", "/long-term-memory/search", searchRequest(SAFETY_QUERY, SCRIPTED_LIMIT, 0), "200", plan.safety.body, "Search 2"));
      if (step >= 5) extra[1] = [callCard("Store the reply", "POST", "/session-memory/events", addEventRequest(s2.all[1]), "201", { event: s2.all[1] })];
      var c = chatCard(plan ? plan.script : [], step >= 4 ? 2 : Math.min(step, 1), extra);
      if (step >= 1 && step < 4) c.chat.appendChild(thinking());
      if (st.lunch == null) c.card.appendChild(composer("Choose Maya's message", LUNCH.map(function (l) { return l.text; }), sendLunch));
      p.appendChild(c.card);

      /* Which of the two searches returned each memory, for the "Found by" labels. */
      var used = {};
      function found(results, n) { results.forEach(function (r) { (used[r.mem.key] = used[r.mem.key] || []).push(n); }); }
      if (step >= 2) found(plan.primary.returned, 1);
      if (step >= 3) found(plan.safety.returned, 2);
      var blocks = [
        s1Gone ? { id: S1, expired: "Past its " + ttl.adj + " short-term TTL, so the session is gone. Fetching it returns 404." } : { id: S1, view: s1v },
        { id: S2, view: s2, fresh: view.fresh && n2 ? s2.all[n2 - 1].eventId : null, emptyText: "No events yet. The session starts with Maya's first message." }
      ];
      var api = detailsEl("later-api", "Show the API calls", function (body) {
        apiBlock(body, "Fetch the Thursday session", "GET", "/session-memory/" + S1, null, s1Gone ? "404" : "200", s1Gone ? NOT_FOUND : sessionResponse(S1, s1v));
        if (n2) apiBlock(body, "Fetch the new session", "GET", "/session-memory/" + S2, null, "200", sessionResponse(S2, s2));
      });
      p.appendChild(grid(sessionCard(blocks, api), ltmCard(mems, { used: used })));
      p.appendChild(callout(laterNotes(step, s1Gone, ttl, plan, mems)));
      if (step >= 5) p.appendChild(searchCard(mems));
      p.appendChild(controlsRow(null));
      syncTabs();
    }
    function sendLunch(choice) {
      if (st.busy || st.lunch != null) return;
      st.lunch = choice;
      play([
        [0, function () { renderLater({ step: 1, fresh: true }); }],
        [800, function () { renderLater({ step: 2 }); }],
        [900, function () { renderLater({ step: 3 }); }],
        [900, function () { renderLater({ step: 4 }); }],
        [700, function () { renderLater({ step: 5, fresh: true }); }]
      ]);
    }
    function callCard(label, method, path, request, status, response, tag) {
      var d = el("details", "rcr-call");
      d.appendChild(el("summary", "", (tag ? '<span class="ram-calltag">' + esc(tag) + "</span>" : "") +
        '<span class="rcr-lbl">' + method + '</span> <span class="rcr-mono rcr-callname">' + esc(path) +
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
          row.innerHTML = badge(x.mem.num, true) +
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
  window.AgentMemoryDemo = { TURNS: TURNS, LUNCH: LUNCH, QUERIES: QUERIES, TTLS: TTLS, s1Script: s1Script, summaryText: summaryText,
    memoriesFor: memoriesFor, outcome: outcome, lunchPlan: lunchPlan, runSearch: runSearch, searchRequest: searchRequest,
    sessionView: sessionView, sessionResponse: sessionResponse, recordJson: recordJson, chatNotes: chatNotes, badge: badge, DIGITS: DIGITS,
    extractNotes: extractNotes, laterNotes: laterNotes, curl: curl, b64: b64, textOf: textOf };
})();

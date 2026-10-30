/* =========================================================================
   Redis Iris request flow: which part of the stack answers which question
   Dependency-free. Everything runs in the browser; no Iris service is called.

   The Iris stack sits on the left and the questions Maya asks the food
   delivery app's assistant on the right, from the same story as the Iris
   tour (iris-demo.js). Selecting a question sends a dot from it to Intent
   Router, then on to the component, or components, that answer it, and
   Lens and Agent Mesh light as they record the turn and stream the reply.
   The point is that the stack isn't a fixed sequence: each question takes
   the parts it needs. Scores, timings, and replies are illustrative.

   Keep the questions, intents, and results in step with iris-demo.js.
   ========================================================================= */
(function () {
  "use strict";
  if (window.IrisRequestFlow) return;   // loaded twice: the first copy already booted every widget

  /* ------------------------------------------------------------- the stack */

  /* Top to bottom. `along` marks the parts that work alongside the request rather than answering it. */
  var STACK = [
    { key: "router", name: "Intent Router", role: "Matches the message to an intent you defined" },   // TODO: add doc: "/develop/ai/context-engine/intent-router" when intent-router-docs-align merges
    { key: "playbooks", name: "Agent Playbooks", role: "Published answers and procedures", doc: "/develop/ai/context-engine/agent-playbook" },
    { key: "memory", name: "Agent Memory", role: "Session and long-term recall", doc: "/develop/ai/context-engine/agent-memory" },
    { key: "gateway", name: "Context Gateway", role: "Governed tools over your data and MCP servers", doc: "/develop/ai/context-engine/context-gateway" },
    { key: "lens", name: "Lens", role: "Traces each turn", doc: "/develop/ai/context-engine/lens", along: true },
    { key: "mesh", name: "Agent Mesh", role: "Keeps the reply stream resumable", along: true }
  ];

  /* ---------------------------------------------------------- the questions */

  /* Each question: the intent Intent Router matches, the components it goes to, what each returns, and whether
     a model call writes the answer. `tag` is the short note on a component when the dot arrives. */
  var QUESTIONS = [
    { key: "fee", text: "How much is delivery these days?",
      intent: "delivery_fee", score: 0.78, target: "tool playbooks.discover_entries",
      to: [{ key: "playbooks", tag: "FAQ · 0.92",
        result: "Returns the support team's published FAQ: delivery costs $1.99 to $4.99, and Plus members get free delivery over $15." }],
      model: "No model call. The published answer is the reply." },
    { key: "reorder", text: "Can you order the curry I had last week again?",
      intent: "reorder", score: 0.86, target: "agent food-assistant.reorder",
      to: [{ key: "memory", tag: "5 memories",
        result: "Recalls last week's order, an extra spicy green curry from Lotus Thai with no peanuts or fish sauce, from a long-term memory search scoped to Maya." }],
      model: "The model writes the reply from what Agent Memory recalled." },
    { key: "time", text: "Can it be here within 30 minutes?",
      intent: "delivery_time", score: 0.81, target: "agent food-assistant.delivery",
      to: [{ key: "gateway", tag: "1 tool call",
        result: "Calls fooddelivery.get_restaurant_by_id through one MCP endpoint. The Context Surface over the restaurant records says Lotus Thai is taking 45 minutes tonight." }],
      model: "The model writes the reply: Lotus Thai can't make it in time." },
    { key: "find", text: "Find me a Thai place that can deliver in time, no peanuts.",
      intent: "find_restaurant", score: 0.83, target: "agent food-assistant.search",
      to: [
        { key: "gateway", tag: "2 tool calls",
          result: "Calls fooddelivery.filter_restaurant for Thai restaurants in Austin within 30 minutes, and finds Bangkok Street Kitchen. Then checks Maya's past orders there." },
        { key: "memory", tag: "peanut allergy",
          result: "Recalls that Maya is allergic to peanuts and loves spicy Thai food, so the reply suggests her usual order without peanuts." }],
      model: "The model writes one reply from both results, which arrived in parallel." }
  ];
  var ALONG = [{ key: "lens", tag: "turn traced" }, { key: "mesh", tag: "reply streamed" }];

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
  function wait(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  /* ------------------------------------------------------------------ view */

  function init(root) {
    var reduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var base = root.getAttribute("data-base") || "/";
    var NS = "http://www.w3.org/2000/svg", token = 0, current = null;

    root.innerHTML = "";
    var board = el("div", "irf-board");
    var stackCol = el("div", "irf-stack");
    stackCol.appendChild(el("div", "rcr-lbl", "The Redis Iris stack"));
    var cards = {};
    STACK.forEach(function (c, i) {
      if (c.along && !STACK[i - 1].along) stackCol.appendChild(el("div", "irf-along", "Alongside every request"));
      var card = el("div", "irf-comp irf-c-" + c.key + (c.along ? " is-along" : ""),
        '<span class="irf-name">' + esc(c.name) + '</span><span class="irf-role">' + esc(c.role) + "</span>" +
        '<span class="irf-tag" aria-hidden="true"></span>');
      cards[c.key] = card;
      stackCol.appendChild(card);
    });
    stackCol.appendChild(el("div", "irf-base", "Redis"));

    var askCol = el("div", "irf-asks");
    askCol.appendChild(el("div", "rcr-lbl", "Questions Maya asks"));
    var asks = {};
    QUESTIONS.forEach(function (q) {
      var b = el("button", "irf-ask", esc(q.text));
      b.type = "button";
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { pick(q.key); });
      asks[q.key] = b;
      askCol.appendChild(b);
    });

    var over = document.createElementNS(NS, "svg");
    over.setAttribute("class", "irf-over");
    over.setAttribute("aria-hidden", "true");
    board.appendChild(stackCol);
    board.appendChild(askCol);
    board.appendChild(over);
    root.appendChild(board);

    var detail = el("div", "rcr-card irf-detail");
    detail.setAttribute("aria-live", "polite");
    root.appendChild(detail);

    /* A point on an element's edge, in the board's coordinates. */
    function at(node, side) {
      var b = board.getBoundingClientRect(), r = node.getBoundingClientRect();
      var x = side === "left" ? r.left : side === "right" ? r.right : r.left + r.width / 2;
      return [x - b.left, r.top + r.height / 2 - b.top];
    }
    /* Side by side, the dot runs from the question's left edge to the router's right edge, then down the
       stack's right side to each component. Stacked (a narrow screen), there's no clear path, so no dot. */
    function sideBySide() { return askCol.getBoundingClientRect().left >= stackCol.getBoundingClientRect().right - 1; }
    function travel(d, tok) {
      return new Promise(function (resolve) {
        if (tok !== token) return resolve();
        over.setAttribute("viewBox", "0 0 " + board.clientWidth + " " + board.clientHeight);
        var path = document.createElementNS(NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "irf-trail");
        var dot = document.createElementNS(NS, "g");
        dot.innerHTML = '<circle r="7" class="irf-glow"/><circle r="3.6" class="irf-core"/>';
        over.appendChild(path);
        over.appendChild(dot);
        var len = path.getTotalLength(), dur = Math.max(450, len * 2.6), start = null;
        function frame(now) {
          if (tok !== token) { path.remove(); dot.remove(); return resolve(); }
          if (start === null) start = now;
          var t = Math.min(1, (now - start) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
          var p = path.getPointAtLength(len * e);
          dot.setAttribute("transform", "translate(" + p.x.toFixed(1) + " " + p.y.toFixed(1) + ")");
          if (t < 1) requestAnimationFrame(frame);
          else { dot.remove(); setTimeout(function () { path.remove(); }, 600); resolve(); }
        }
        requestAnimationFrame(frame);
      });
    }
    function toRouter(q) {
      var a = at(asks[q.key], "left"), r = at(cards.router, "right"), mx = (a[0] + r[0]) / 2;
      return "M " + a[0] + " " + a[1] + " C " + mx + " " + a[1] + " " + mx + " " + r[1] + " " + r[0] + " " + r[1];
    }
    function down(key) {
      var r = at(cards.router, "right"), t = at(cards[key], "right"), x = r[0] + 18;
      return "M " + r[0] + " " + r[1] + " L " + x + " " + r[1] + " L " + x + " " + t[1] + " L " + t[0] + " " + t[1];
    }

    function light(key, tag) {
      cards[key].classList.add("is-lit");
      cards[key].querySelector(".irf-tag").textContent = tag || "";
    }
    function clear() {
      Object.keys(cards).forEach(function (k) {
        cards[k].classList.remove("is-lit");
        cards[k].querySelector(".irf-tag").textContent = "";
      });
      Array.prototype.forEach.call(over.querySelectorAll("path, g"), function (n) { n.remove(); });
    }

    function showDetail(q) {
      var rows = '<div class="irf-row"><span class="irf-rk irf-k-router">Intent Router</span><span>Matches <code>' + esc(q.intent) +
        "</code> (score " + q.score.toFixed(2) + ") and returns its target, <code>" + esc(q.target) + "</code>. No model call decides this.</span></div>";
      q.to.forEach(function (t) {
        rows += '<div class="irf-row"><span class="irf-rk irf-k-' + t.key + '">' + esc(byKey(STACK, t.key).name) + "</span><span>" + esc(t.result) + "</span></div>";
      });
      rows += '<div class="irf-row"><span class="irf-rk">Model</span><span>' + esc(q.model) + "</span></div>" +
        '<div class="irf-row"><span class="irf-rk irf-k-along">Alongside</span><span>Lens traces the turn, and Agent Mesh keeps the reply stream resumable if the connection drops.</span></div>';
      var links = q.to.map(function (t) {
        var c = byKey(STACK, t.key);
        return c.doc ? '<a class="irf-doc" href="' + esc(base.replace(/\/$/, "") + c.doc + "/") + '">' + esc(c.name) + " docs →</a>" : "";
      }).join("");
      detail.innerHTML = '<div class="irf-q">“' + esc(q.text) + "”</div>" + rows + '<div class="irf-links">' + links + "</div>";
    }

    function pick(key) {
      var q = byKey(QUESTIONS, key), tok = ++token;
      current = key;
      Object.keys(asks).forEach(function (k) {
        asks[k].classList.toggle("is-on", k === key);
        asks[k].setAttribute("aria-pressed", k === key ? "true" : "false");
      });
      clear();
      showDetail(q);
      if (reduced || !sideBySide()) {
        light("router", q.intent);
        q.to.forEach(function (t) { light(t.key, t.tag); });
        ALONG.forEach(function (a) { light(a.key, a.tag); });
        return;
      }
      travel(toRouter(q), tok).then(function () {
        if (tok !== token) return;
        light("router", q.intent);
        return Promise.all(q.to.map(function (t) {
          return travel(down(t.key), tok).then(function () { if (tok === token) light(t.key, t.tag); });
        }));
      }).then(function () { return wait(350); }).then(function () {
        if (tok === token) ALONG.forEach(function (a) { light(a.key, a.tag); });
      });
    }

    /* Redraw for the new layout when the width changes, without replaying the animation. */
    var lastWidth = board.clientWidth;
    window.addEventListener("resize", function () {
      if (board.clientWidth === lastWidth || !current) return;
      lastWidth = board.clientWidth;
      token++;
      var q = byKey(QUESTIONS, current);
      clear();
      light("router", q.intent);
      q.to.forEach(function (t) { light(t.key, t.tag); });
      ALONG.forEach(function (a) { light(a.key, a.tag); });
    });

    pick(QUESTIONS[0].key);
  }

  function boot() { Array.prototype.forEach.call(document.querySelectorAll(".irf[data-irf]"), init); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot); else boot();

  /* Exposed for tests. */
  window.IrisRequestFlow = { STACK: STACK, QUESTIONS: QUESTIONS };
})();

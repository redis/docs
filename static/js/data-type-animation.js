/* =========================================================================
   Data type animations
   A short looping animation shown just before the examples on each data
   type page. Each one types a few commands, shows the reply, and draws what
   the command does to the data. Dependency-free; demo-highlight.js colors
   the commands if it is loaded.

   Every command and reply was recorded from Redis 8.12 (release candidate
   2). A drawing shows only what the command on screen did. The drawings of the
   probabilistic types are schematic: Redis doesn't expose which bits,
   buckets, or counters an item uses, so those positions are made up.

   A scene is { label, h, steps, build }:
     build(c)  draws the empty structure in c.canvas and returns the scene's
               state, which each step receives as its second argument. The
               canvas stays hidden until the first step runs, because the
               key doesn't exist before its first command.
     steps     [{ cmd, reply, note, run(c, state) }]. run() changes the
               drawing, and may return a promise that resolves when its
               animation ends. Every step is paced the same way: there is
               no per-step timing to set.
   `c` is the run's context: wait, anim, enter, leave, flip, tween, count,
   mark, and temp. Every one of them does its work without animating when
   the player is fast-forwarding, which is how a click on a step and the
   reduced-motion still frame are drawn.
   ========================================================================= */
(function () {
  "use strict";
  if (window.DataTypeAnimation) return;   // loaded twice: the first copy already runs the page

  const SVGNS = "http://www.w3.org/2000/svg";
  const EASE = "cubic-bezier(.2,.7,.2,1)";
  /* Pacing. Every command takes the same time to type, and every step stays on screen for the same
     time, measured from its reply to the moment the next command starts, whatever its animation does.
     Only the last step differs: it stays longer before the loop starts again. */
  const TYPE = 480;        // ms to type a command, whatever its length
  const TICKS = 24;        // screen updates while typing
  const STEP = 4000;       // ms a step stays on screen
  const MIN_REST = 600;    // a step's animation must end this long before its time is up, or the step runs over
  const END_HOLD = 2300;   // extra ms the last step stays before the loop restarts
  const CANCEL = {};       // thrown inside a run that a newer run has replaced
  const reduced = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  /* A replaced run ends by rejecting with CANCEL. Some of its promises have nobody waiting for them. */
  window.addEventListener("unhandledrejection", function (e) { if (e.reason === CANCEL) e.preventDefault(); });

  /* ---- DOM helpers ---- */

  function h(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function s(tag, attrs, text) {
    const e = document.createElementNS(SVGNS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function t(text) { return document.createTextNode(text); }
  function add(parent) {
    for (let i = 1; i < arguments.length; i++) if (arguments[i]) parent.appendChild(arguments[i]);
    return parent;
  }
  function esc(x) { return String(x).replace(/[&<>]/g, function (ch) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch]; }); }
  function hlCmd(x) { return window.DemoHL ? window.DemoHL.redis(x) : esc(x); }
  function hlReply(x) { return window.DemoHL ? window.DemoHL.reply(x) : esc(x); }

  const ICON = {
    pause: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>',
    play: '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true"><path d="M4 2.6v10.8a.6.6 0 0 0 .92.5l8.4-5.4a.6.6 0 0 0 0-1L4.92 2.1a.6.6 0 0 0-.92.5z"/></svg>',
  };

  /* ---- player ---- */

  function Player(root, scene) {
    const p = this;
    p.root = root; p.scene = scene;
    p.gen = 0;                 // bumped by every play(); a run stops when it sees a newer one
    p.cur = 0;                 // the step on screen
    p.instant = false;         // true while fast-forwarding
    p.userPaused = reduced;    // with reduced motion, nothing moves until the reader presses play
    p.visible = !("IntersectionObserver" in window);

    root.textContent = "";
    root.setAttribute("role", "figure");
    root.setAttribute("aria-label", "Animation of " + scene.label);

    p.cmd = h("span");
    p.reply = h("div", "dta-reply");
    p.term = add(h("div", "dta-term"), add(h("div", "dta-cmd"), h("span", "dta-prompt", "> "), p.cmd, h("span", "dta-caret")), p.reply);
    p.dots = scene.steps.map(function (st, i) {
      const b = h("button", "dta-dot");
      b.type = "button";
      b.setAttribute("aria-label", "Show step " + (i + 1) + " of " + scene.steps.length);
      b.addEventListener("click", function () { p.play(i); });
      return b;
    });
    p.button = h("button", "dta-play");
    p.button.type = "button";
    p.button.addEventListener("click", function () { p.setPaused(!p.userPaused); });
    p.canvas = h("div", "dta-canvas");
    p.note = h("div", "dta-note");
    const stage = add(h("div", "dta-stage"), p.canvas, p.note);
    stage.setAttribute("aria-hidden", "true");
    add(root,
      add(h("div", "dta-console"), p.term, add(h("div", "dta-ctl"), add.apply(null, [h("div", "dta-dots")].concat(p.dots)), p.button)),
      stage);
    p.setPaused(p.userPaused);

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) { p.visible = es[es.length - 1].isIntersecting; }, { threshold: 0.4 }).observe(root);
    }
    /* A scene is laid out in pixels, so a new width means drawing it again, at the step it had reached. */
    let width = root.clientWidth, timer;
    if ("ResizeObserver" in window) {
      new ResizeObserver(function () {
        const w = root.clientWidth;
        if (w === width) return;
        width = w;
        clearTimeout(timer);
        timer = setTimeout(function () { p.play(p.cur); }, 150);
      }).observe(root);
    }
    p.play(reduced ? scene.steps.length - 1 : 0);   // with reduced motion, a still frame of the last step
  }

  Player.prototype.paused = function () { return this.userPaused || !this.visible || document.hidden; };

  Player.prototype.setPaused = function (on) {
    this.userPaused = on;
    this.root.classList.toggle("is-paused", on);
    this.button.innerHTML = on ? ICON.play : ICON.pause;
    this.button.setAttribute("aria-label", on ? "Play animation" : "Pause animation");
  };

  /* Size the canvas for this width, and reserve room for the tallest command, reply, and note, so the
     page below never moves while the animation plays. */
  Player.prototype.layout = function () {
    const p = this, sc = p.scene;
    let term = 0, note = 0;
    p.term.style.minHeight = p.note.style.minHeight = "";
    sc.steps.forEach(function (st) {
      p.cmd.innerHTML = hlCmd(st.cmd);
      p.reply.innerHTML = hlReply(st.reply);
      p.note.textContent = st.note || "";
      term = Math.max(term, p.term.offsetHeight);
      note = Math.max(note, p.note.offsetHeight);
    });
    p.term.style.minHeight = term + "px";
    p.note.style.minHeight = note + "px";
    p.canvas.style.height = (typeof sc.h === "function" ? sc.h(p.canvas.clientWidth) : sc.h || 140) + "px";
  };

  /* The tools a scene draws with. Each belongs to one run and stops working when a newer run starts. */
  Player.prototype.context = function (gen) {
    const p = this, marks = [], temps = [];
    function check() { if (gen !== p.gen) throw CANCEL; }
    const c = {
      canvas: p.canvas,
      W: p.canvas.clientWidth,
      H: p.canvas.clientHeight,
      /* Resolves after `ms` of play time: the clock stops while the animation is paused or off screen. */
      wait: function (ms) {
        check();
        if (p.instant) return Promise.resolve();
        return new Promise(function (resolve, reject) {
          let left = ms, last = performance.now();
          (function tick() {
            if (gen !== p.gen) return reject(CANCEL);
            const now = performance.now(), paused = p.paused();
            if (!paused) left -= now - last;
            last = now;
            if (left <= 0) resolve(); else setTimeout(tick, paused ? 150 : Math.min(left, 50));
          })();
        });
      },
      anim: function (el, frames, ms, opts) {
        check();
        if (p.instant || !el.animate) return Promise.resolve();
        const o = { duration: ms || 360, easing: EASE };
        for (const k in opts) o[k] = opts[k];
        return el.animate(frames, o).finished.catch(function () {});
      },
      enter: function (el, from, ms, delay) {
        return c.anim(el, [{ opacity: 0, transform: from || "scale(.6)" }, { opacity: 1, transform: "none" }], ms || 340,
          delay ? { delay: delay, fill: "backwards" } : null);
      },
      leave: function (el, to, ms) {
        return c.anim(el, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: to || "scale(.6)" }], ms || 280, { fill: "forwards" })
          .then(function () { el.remove(); });
      },
      /* Change the layout with mutate(), then slide `els` from where they were to where they are now. */
      flip: function (els, mutate, ms) {
        check();
        const first = els.map(function (e) { return e.getBoundingClientRect(); });
        mutate();
        if (p.instant) return Promise.resolve();
        return Promise.all(els.map(function (e, i) {
          if (!e.isConnected) return null;
          const r = e.getBoundingClientRect(), dx = first[i].left - r.left, dy = first[i].top - r.top;
          if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) return null;
          return c.anim(e, [{ transform: "translate(" + dx + "px," + dy + "px)" }, { transform: "none" }], ms || 440);
        }));
      },
      tween: function (from, to, ms, fn) {
        check();
        if (p.instant) { fn(to); return Promise.resolve(); }
        return new Promise(function (resolve, reject) {
          const t0 = performance.now();
          (function frame() {
            if (gen !== p.gen) return reject(CANCEL);
            const k = Math.min(1, (performance.now() - t0) / ms);
            fn(from + (to - from) * (1 - Math.pow(1 - k, 3)));
            if (k < 1) requestAnimationFrame(frame); else resolve();
          })();
        });
      },
      count: function (el, from, to, ms) { return c.tween(from, to, ms || 450, function (v) { el.textContent = Math.round(v); }); },
      /* Highlight an element until the next step: "read", "write", "no" (looked for and not found), or "dim". */
      mark: function (el, kind) { el.classList.add("is-" + kind); marks.push([el, "is-" + kind]); return el; },
      /* Keep an element until the next step. */
      temp: function (el) { temps.push(el); return el; },
      clear: function () {
        marks.forEach(function (m) { m[0].classList.remove(m[1]); });
        temps.forEach(function (el) { el.remove(); });
        marks.length = temps.length = 0;
      },
    };
    return c;
  };

  Player.prototype.step = async function (i, c) {
    const p = this, st = p.scene.steps[i];
    p.cur = i;
    c.clear();
    p.dots.forEach(function (d, k) { d.classList.toggle("is-on", k === i); d.classList.toggle("is-done", k < i); });
    if (p.note.textContent !== (st.note || "")) p.note.classList.remove("is-on");
    p.reply.innerHTML = "";
    if (p.instant) p.cmd.innerHTML = hlCmd(st.cmd);
    else {
      p.root.classList.add("is-typing");
      for (let k = 1; k <= TICKS; k++) {
        p.cmd.innerHTML = hlCmd(st.cmd.slice(0, Math.ceil(st.cmd.length * k / TICKS)));
        await c.wait(TYPE / TICKS);
      }
      p.root.classList.remove("is-typing");
      await c.wait(160);
    }
    p.reply.innerHTML = hlReply(st.reply);
    p.note.textContent = st.note || "";
    p.note.classList.toggle("is-on", !!st.note);
    if (!i) {   // the first command creates the key, so the whole drawing appears with it
      p.canvas.style.opacity = "";
      c.anim(p.canvas, [{ opacity: 0 }, { opacity: 1 }], 300);
    }
    const hold = c.wait(STEP);   // counts play time from the reply, so time spent paused doesn't use it up
    if (st.run) await st.run(c, c.state);
    await Promise.all([hold, c.wait(MIN_REST)]);
  };

  /* Play in a loop, starting with step `from`. The steps before it are drawn without animation. When
     the reader has paused the animation, `from` is drawn that way too, and the loop waits there. */
  Player.prototype.play = function (from) {
    const p = this, gen = ++p.gen, steps = p.scene.steps;
    (async function () {
      for (;;) {
        p.layout();
        p.canvas.textContent = p.note.textContent = "";
        p.note.classList.remove("is-on");
        p.cmd.innerHTML = p.reply.innerHTML = "";
        p.canvas.style.opacity = "0";   // until the first step runs
        const c = p.context(gen);
        if (c.W < 40) return;   // not laid out yet; the resize observer plays again once it is
        c.state = p.scene.build(c) || {};
        const still = p.userPaused ? Math.min(from + 1, steps.length) : from;
        p.instant = true;
        for (let i = 0; i < still; i++) await p.step(i, c);
        p.instant = false;
        if (still > from) await c.wait(STEP);
        for (let i = still; i < steps.length; i++) await p.step(i, c);
        await c.wait(END_HOLD);
        p.note.classList.remove("is-on");
        p.canvas.style.opacity = "0";
        await c.anim(p.canvas, [{ opacity: 1 }, { opacity: 0 }], 260);
        from = 0;
      }
    })().catch(function (e) { if (e !== CANCEL) console.error(e); });
  };

  /* ---- shared drawing ---- */

  function cell(text, cls) { return h("div", "dta-cell" + (cls ? " " + cls : ""), text); }
  function slot(c, idx) { return add(h("div", "dta-slot"), c, h("div", "dta-idx", idx)); }
  function keyed(key, body, cls) { return add(h("div", "dta-col" + (cls ? " " + cls : "")), h("div", "dta-key", key), body); }

  /* A card titled with the key name, with room for `rows` rows laid out in `cols` grid columns. */
  function card(title, cols, rows, width) {
    const body = h("div", "dta-rows"), el = add(h("div", "dta-card"), h("div", "dta-card-h", title), body);
    body.style.setProperty("--dta-cols", cols);
    body.style.minHeight = rows * 27 + "px";
    el.style.width = width + "px";
    return { el: el, body: body };
  }
  function row() {
    const r = h("div", "dta-r");
    for (let i = 0; i < arguments.length; i++) r.appendChild(arguments[i]);
    return r;
  }

  function canvasSvg(c) {
    const svg = s("svg", { class: "dta-svg", width: c.W, height: c.H });
    c.canvas.appendChild(svg);
    return svg;
  }
  /* A rounded label centered on (x, y). Returns the inner group, which is the part to animate and mark. */
  function chip(parent, x, y, text) {
    const inner = s("g", { class: "dta-chip" }), label = s("text", { "text-anchor": "middle", dy: ".35em" }, text), box = s("rect", { y: -11, height: 22, rx: 6 });
    add(parent, add(s("g", { transform: "translate(" + x + "," + y + ")" }), add(inner, box, label)));
    const w = Math.ceil(label.getComputedTextLength()) + 14;
    box.setAttribute("x", -w / 2);
    box.setAttribute("width", w);
    return inner;
  }
  /* An item at the top of the drawing with a line to each place it hashes to. Gone at the next step. */
  function probe(c, svg, text, x, targets, kind) {
    const lines = s("g", { class: "dta-probe is-" + kind });
    targets.forEach(function (p) { lines.appendChild(s("path", { d: "M" + x + " 25L" + p[0] + " " + p[1], pathLength: 1 })); });
    svg.appendChild(lines);
    const item = chip(svg, x, 13, text);
    c.temp(lines);
    c.temp(item.parentNode);
    return Promise.all([c.enter(item), c.anim(lines, [{ strokeDashoffset: 1 }, { strokeDashoffset: 0 }], 420, { delay: 160, fill: "backwards" })]);
  }
  function shake(c, el) {
    return c.anim(el, [0, -4, 4, -3, 3, 0].map(function (x) { return { transform: "translateX(" + x + "px)" }; }), 420, { easing: "linear" });
  }

  /* ---- scenes ---- */

  const SCENES = {};

  SCENES.string = {
    label: "Redis string commands",
    h: 88,
    steps: [
      { cmd: 'SET bike:1 "Deimos"', reply: "OK", note: "A key holds one string value.",
        run: function (c, st) { return st.set(c, "bike:1", '"Deimos"'); } },
      { cmd: "GET bike:1", reply: '"Deimos"', note: "GET reads the value back.",
        run: function (c, st) { c.mark(st.val["bike:1"], "read"); } },
      { cmd: "SET total_crashes 0", reply: "OK", note: "A string can also hold a number.",
        run: function (c, st) { return st.set(c, "total_crashes", "0"); } },
      { cmd: "INCR total_crashes", reply: "(integer) 1", note: "INCR adds 1 in a single atomic step.",
        run: function (c, st) { return st.put(c, "total_crashes", "1"); } },
      { cmd: "INCRBY total_crashes 10", reply: "(integer) 11", note: "INCRBY adds any amount.",
        run: function (c, st) { return st.put(c, "total_crashes", "11"); } },
    ],
    build: function (c) {
      const grid = h("div", "dta-kv"), st = { val: {} };
      c.canvas.appendChild(grid);
      st.set = function (c, key, value) {
        const k = h("div", "dta-key", key), arrow = h("div", "dta-arrow", "→"), v = cell(value), olds = [].slice.call(grid.children);
        st.val[key] = v;
        c.mark(v, "write");
        return Promise.all([c.flip(olds, function () { add(grid, k, arrow, v); }), c.enter(k, "translateX(-8px)"), c.enter(arrow, "translateX(-8px)"), c.enter(v)]);
      };
      st.put = function (c, key, value) {
        st.val[key].textContent = value;
        c.mark(st.val[key], "write");
        return c.anim(st.val[key], [{ transform: "scale(1.3)" }, { transform: "none" }], 320);
      };
      return st;
    },
  };

  SCENES.hash = {
    label: "Redis hash commands",
    steps: [
      { cmd: "HSET bike:1 model Deimos brand Ergonom price 4972", reply: "(integer) 3", note: "A hash holds field-value pairs under one key.",
        run: async function (c, st) {
          for (const f of [["model", "Deimos"], ["brand", "Ergonom"], ["price", "4972"]]) { st.add(c, f[0], f[1]); await c.wait(110); }
        } },
      { cmd: "HGET bike:1 model", reply: '"Deimos"', note: "HGET reads a single field.",
        run: function (c, st) { c.mark(st.rows.model, "read"); } },
      { cmd: "HINCRBY bike:1 price 100", reply: "(integer) 5072", note: "HINCRBY updates a number in place.",
        run: function (c, st) { c.mark(st.rows.price, "write"); return c.count(st.vals.price, 4972, 5072, 500); } },
      { cmd: 'HSET bike:1 type "Enduro bikes"', reply: "(integer) 1", note: "You can add a field at any time.",
        run: function (c, st) { return st.add(c, "type", "Enduro bikes"); } },
    ],
    build: function (c) {
      const k = card("bike:1", "76px 1fr", 4, 240), st = { rows: {}, vals: {} };
      c.canvas.appendChild(k.el);
      st.add = function (c, f, v) {
        st.vals[f] = h("span", "dta-v", v);
        st.rows[f] = row(h("span", "dta-f", f), st.vals[f]);
        k.body.appendChild(st.rows[f]);
        c.mark(st.rows[f], "write");
        return c.enter(st.rows[f], "translateY(-6px)");
      };
      return st;
    },
  };

  SCENES.list = {
    label: "Redis list commands",
    h: 88,
    steps: [
      { cmd: "LPUSH bikes:repairs bike:1", reply: "(integer) 1", note: "LPUSH adds a value at the head of the list.",
        run: function (c, st) { return st.push(c, "bike:1"); } },
      { cmd: "LPUSH bikes:repairs bike:2", reply: "(integer) 2", note: "LPUSH adds a value at the head of the list.",
        run: function (c, st) { return st.push(c, "bike:2"); } },
      { cmd: "LPUSH bikes:repairs bike:3", reply: "(integer) 3", note: "LPUSH adds a value at the head of the list.",
        run: function (c, st) { return st.push(c, "bike:3"); } },
      { cmd: "RPOP bikes:repairs", reply: '"bike:1"', note: "RPOP takes the oldest value from the tail.",
        run: function (c, st) { return st.pop(c); } },
      { cmd: "LRANGE bikes:repairs 0 -1", reply: '1) "bike:3"\n2) "bike:2"', note: "LRANGE reads values by position.",
        run: function (c, st) { st.slots().forEach(function (w) { c.mark(w.firstChild, "read"); }); } },
    ],
    build: function (c) {
      const zone = h("div", "dta-list"), st = {};
      c.canvas.appendChild(keyed("bikes:repairs", add(h("div", "dta-ends"), h("span", "dta-end", "head"), zone, h("span", "dta-end", "tail"))));
      st.slots = function () { return [].slice.call(zone.children); };
      function renumber() { st.slots().forEach(function (w, i) { w.lastChild.textContent = i; }); }
      st.push = function (c, v) {
        const ce = cell(v), w = slot(ce, 0), olds = st.slots();
        c.mark(ce, "write");
        return Promise.all([c.flip(olds, function () { zone.insertBefore(w, zone.firstChild); renumber(); }), c.enter(w, "translateX(-28px)")]);
      };
      st.pop = async function (c) {
        const w = zone.lastChild, rest = st.slots().slice(0, -1);
        c.mark(w.firstChild, "read");
        await c.wait(380);
        await c.anim(w, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(28px)" }], 280, { fill: "forwards" });
        await c.flip(rest, function () { w.remove(); });
      };
      return st;
    },
  };

  SCENES.set = {
    label: "Redis set commands",
    h: 152,
    steps: [
      { cmd: "SADD bikes:racing:france bike:1 bike:2 bike:3", reply: "(integer) 3", note: "A set holds unique members in no particular order.",
        run: function (c, st) { return Promise.all([st.circle(c, 0), st.member(c, "france bike:1", 180), st.member(c, "france bike:2", 280), st.member(c, "france bike:3", 380)]); } },
      { cmd: "SADD bikes:racing:france bike:1", reply: "(integer) 0", note: "bike:1 is already a member, so nothing changes.",
        run: function (c, st) { c.mark(st.chips["france bike:1"], "no"); return shake(c, st.chips["france bike:1"]); } },
      { cmd: "SADD bikes:racing:usa bike:1 bike:4", reply: "(integer) 2", note: "bike:1 is now a member of both sets.",
        run: function (c, st) { return Promise.all([st.circle(c, 1), st.member(c, "usa bike:1", 180), st.member(c, "usa bike:4", 280)]); } },
      { cmd: "SINTER bikes:racing:france bikes:racing:usa", reply: '1) "bike:1"', note: "SINTER returns the members that are in both sets.",
        run: async function (c, st) {
          await st.overlap(c);
          st.chips["france bike:1"].style.visibility = "hidden";   // the two copies of bike:1 now sit on the same spot
          c.mark(st.lens, "read");
          c.mark(st.chips["usa bike:1"], "read");
        } },
    ],
    build: function (c) {
      /* The sets are drawn side by side. Only SINTER draws them overlapping, with the member they share in the overlap. */
      const svg = canvasSvg(c), mid = Math.round(c.W / 2), r = Math.min(62, (c.H - 22) / 2), cy = 20 + r;
      const apart = r + 6, d = r, hh = Math.sqrt(r * r - d * d / 4);
      const back = s("g"), front = s("g"), st = { chips: {}, rings: [] };
      st.lens = s("path", { class: "dta-lens", d: "M" + mid + " " + (cy - hh) + "A" + r + " " + r + " 0 0 0 " + mid + " " + (cy + hh) + "A" + r + " " + r + " 0 0 0 " + mid + " " + (cy - hh) });
      add(svg, back, st.lens, front);
      const names = ["bikes:racing:france", "bikes:racing:usa"];
      /* For each member: where it sits while the sets are apart, and where it sits once they overlap. */
      const places = {
        "france bike:1": [[mid - apart + 16, cy], [mid, cy]],
        "france bike:2": [[mid - apart - 14, cy - 24], [mid - r * 0.9, cy - 20]],
        "france bike:3": [[mid - apart - 14, cy + 24], [mid - r * 0.9, cy + 20]],
        "usa bike:1": [[mid + apart - 12, cy - 14], [mid, cy]],
        "usa bike:4": [[mid + apart + 12, cy + 14], [mid + r, cy]],
      };
      st.circle = function (c, i) {
        st.rings[i] = s("circle", { class: "dta-ring", cx: mid + (i ? apart : -apart), cy: cy, r: r });
        const name = s("text", { x: mid + (i ? 7 : -7), y: 11, "text-anchor": i ? "start" : "end" }, names[i]);
        add(back, st.rings[i], name);
        return Promise.all([c.enter(st.rings[i], "scale(.8)", 420), c.anim(name, [{ opacity: 0 }, { opacity: 1 }], 420)]);
      };
      st.member = function (c, id, delay) {
        st.chips[id] = chip(front, places[id][0][0], places[id][0][1], id.split(" ")[1]);
        c.mark(st.chips[id], "write");
        return c.enter(st.chips[id], "scale(.4)", 340, delay);
      };
      st.overlap = function (c) {
        const moves = st.rings.map(function (ring, i) {
          const from = +ring.getAttribute("cx"), to = mid + (i ? d / 2 : -d / 2);
          ring.setAttribute("cx", to);
          return c.anim(ring, [{ transform: "translateX(" + (from - to) + "px)" }, { transform: "none" }], 700);
        });
        for (const id in st.chips) {
          const a = places[id][0], b = places[id][1];
          st.chips[id].parentNode.setAttribute("transform", "translate(" + b[0] + "," + b[1] + ")");
          moves.push(c.anim(st.chips[id], [{ transform: "translate(" + (a[0] - b[0]) + "px," + (a[1] - b[1]) + "px)" }, { transform: "none" }], 700));
        }
        return Promise.all(moves);
      };
      return st;
    },
  };

  SCENES["sorted-set"] = {
    label: "Redis sorted set commands",
    steps: [
      { cmd: "ZADD racer_scores 10 Norem 12 Castilla 8 Sam-Bodden", reply: "(integer) 3", note: "Each member has a score, and members stay sorted by score.",
        run: async function (c, st) {
          for (const m of [["Norem", 10], ["Castilla", 12], ["Sam-Bodden", 8]]) { st.add(c, m[0], m[1]); await c.wait(260); }
        } },
      { cmd: "ZADD racer_scores 11 Royce", reply: "(integer) 1", note: "A new member goes straight to its place in the order.",
        run: function (c, st) { return st.add(c, "Royce", 11); } },
      { cmd: "ZINCRBY racer_scores 5 Sam-Bodden", reply: '"13"', note: "When a score changes, the member moves.",
        run: async function (c, st) {
          const r = st.rows.find(function (x) { return x.name === "Sam-Bodden"; });
          c.mark(r.el, "write");
          await c.count(r.val, 8, 13, 450);
          r.score = 13;
          await c.flip(st.rows.map(function (x) { return x.el; }), st.sort, 560);
        } },
      { cmd: "ZRANGE racer_scores 0 1", reply: '1) "Norem"\n2) "Royce"', note: "ZRANGE reads members by rank.",
        run: function (c, st) { c.mark(st.rows[0].el, "read"); c.mark(st.rows[1].el, "read"); } },
    ],
    build: function (c) {
      const k = card("racer_scores", "26px 1fr auto", 4, 230), st = { rows: [] };
      c.canvas.appendChild(k.el);
      st.sort = function () {
        st.rows.sort(function (a, b) { return a.score - b.score; });
        st.rows.forEach(function (r, i) { k.body.appendChild(r.el); r.rank.textContent = i; });
      };
      st.add = function (c, name, score) {
        const r = { name: name, score: score, rank: h("span", "dta-rank"), val: h("span", "dta-v", score) }, olds = st.rows.map(function (x) { return x.el; });
        r.el = row(r.rank, h("span", "dta-m", name), r.val);
        st.rows.push(r);
        c.mark(r.el, "write");
        return Promise.all([c.flip(olds, st.sort), c.enter(r.el, "translateX(-10px)")]);
      };
      return st;
    },
  };

  SCENES.stream = {
    label: "Redis stream commands",
    h: 112,
    steps: [
      { cmd: "XADD race:france * rider Castilla speed 30.2", reply: '"1794406870964-0"', note: "Each entry gets a unique ID based on the time.",
        run: function (c, st) { return st.add(c, "1794406870964-0", "Castilla", "30.2"); } },
      { cmd: "XADD race:france * rider Norem speed 28.8", reply: '"1794406870977-0"', note: "New entries always go at the end.",
        run: function (c, st) { return st.add(c, "1794406870977-0", "Norem", "28.8"); } },
      { cmd: "XADD race:france * rider Prickett speed 29.7", reply: '"1794406870996-0"', note: "New entries always go at the end.",
        run: function (c, st) { return st.add(c, "1794406870996-0", "Prickett", "29.7"); } },
      { cmd: "XRANGE race:france - + COUNT 2", reply: '1) 1) "1794406870964-0"\n   2) 1) "rider"\n      2) "Castilla"\n…', note: "XRANGE reads entries in ID order.",
        run: function (c, st) { c.mark(st.entries[0], "read"); c.mark(st.entries[1], "read"); } },
      { cmd: "XTRIM race:france MAXLEN 2", reply: "(integer) 1", note: "XTRIM removes the oldest entries.",
        run: async function (c, st) {
          const e = st.entries.shift();
          c.mark(e, "no");
          await c.wait(380);
          await c.anim(e, [{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateX(-24px)" }], 280, { fill: "forwards" });
          await c.flip(st.entries, function () { e.remove(); });
        } },
    ],
    build: function (c) {
      const k = card("race:france", "auto 1fr 1fr", 3, 420), st = { entries: [] };
      k.el.classList.add("dta-stream");
      c.canvas.appendChild(k.el);
      function pair(f, v) { return add(h("span"), h("span", "dta-f", f + " "), t(v)); }
      st.add = function (c, id, rider, speed) {
        const e = row(add(h("span", "dta-id"), h("span", "dta-id-start", id.slice(0, 8)), t(id.slice(8))), pair("rider", rider), pair("speed", speed));
        k.body.appendChild(e);
        st.entries.push(e);
        c.mark(e, "write");
        return c.enter(e, "translateY(10px)");
      };
      return st;
    },
  };

  SCENES.geospatial = {
    label: "Redis geospatial commands",
    h: 170,
    steps: [
      { cmd: "GEOADD bikes:rentable -122.27652 37.805186 station:1", reply: "(integer) 1", note: "Each member is stored with its longitude and latitude.",
        run: function (c, st) { return st.pin(c, 0); } },
      { cmd: "GEOADD bikes:rentable -122.2674626 37.8062344 station:2", reply: "(integer) 1", note: "Each member is stored with its longitude and latitude.",
        run: function (c, st) { return st.pin(c, 1); } },
      { cmd: "GEOADD bikes:rentable -122.2469854 37.8104049 station:3", reply: "(integer) 1", note: "Each member is stored with its longitude and latitude.",
        run: function (c, st) { return st.pin(c, 2); } },
      { cmd: "GEOSEARCH bikes:rentable FROMLONLAT -122.2612767 37.7936847 BYRADIUS 2 km WITHDIST",
        reply: '1) 1) "station:1"\n   2) "1.8523"\n2) 1) "station:2"\n   2) "1.4979"', note: "GEOSEARCH finds the members within 2 km of a point.",
        run: function (c, st) { return st.search(c); } },
    ],
    build: function (c) {
      /* Drawn to scale: Redis measures distance on a sphere of radius 6372.797560856 km. */
      const svg = canvasSvg(c), W = c.W, H = c.H, km = (H - 18) / 4.2, cx = Math.round(W / 2), cy = Math.round(H / 2) + 5;
      const LON = -122.2612767, LAT = 37.7936847, DEG = 6372.797560856 * Math.PI / 180, COS = Math.cos(LAT * Math.PI / 180);
      const places = [["station:1", -122.27652, 37.805186, "1.8523", -1], ["station:2", -122.2674626, 37.8062344, "1.4979", 1], ["station:3", -122.2469854, 37.8104049, null, 1]];
      const grid = s("g"), area = s("g"), pins = s("g"), st = { pins: [] };
      for (let x = cx - Math.floor(cx / km) * km; x <= W; x += km) grid.appendChild(s("line", { class: "dta-grid", x1: x, x2: x, y1: 0, y2: H }));
      for (let y = cy - Math.floor(cy / km) * km; y <= H; y += km) grid.appendChild(s("line", { class: "dta-grid", x1: 0, x2: W, y1: y, y2: y }));
      add(grid, s("text", { x: 4, y: 11 }, "bikes:rentable"),
        s("path", { class: "dta-axis", d: "M6 " + (H - 12) + "v5h" + km + "v-5" }), s("text", { x: 6 + km / 2, y: H - 12, "text-anchor": "middle" }, "1 km"));
      add(svg, grid, area, pins);
      st.pin = function (c, i) {
        const p = places[i], x = cx + (p[1] - LON) * DEG * COS * km, y = cy - (p[2] - LAT) * DEG * km, side = p[4];
        const dot = s("g", { class: "dta-pin" }), g = s("g", { class: "dta-place", transform: "translate(" + x + "," + y + ")" });
        const name = s("text", { x: side * 9, y: 0, dy: ".35em", "text-anchor": side < 0 ? "end" : "start" }, p[0]);
        const dist = s("text", { class: "dta-dist", x: side * 9, y: 13, dy: ".35em", "text-anchor": side < 0 ? "end" : "start", opacity: 0 }, p[3] ? p[3] + " km" : "");
        add(pins, add(g, add(dot, s("circle", { r: 4.5 })), name, dist));
        st.pins.push({ g: g, dist: dist, hit: !!p[3] });
        c.mark(g, "write");
        return Promise.all([c.enter(dot, "translateY(-14px)"), c.anim(name, [{ opacity: 0 }, { opacity: 1 }], 340)]);
      };
      st.search = async function (c) {
        const ring = s("circle", { class: "dta-range", cx: cx, cy: cy, r: 2 * km }), center = s("g", { class: "dta-center" });
        add(center, s("circle", { cx: cx, cy: cy, r: 3 }), s("path", { d: "M" + (cx - 8) + " " + cy + "h16M" + cx + " " + (cy - 8) + "v16" }));
        add(area, ring, center);
        c.enter(center, "scale(.3)");
        await c.anim(ring, [{ opacity: 0, transform: "scale(.05)" }, { opacity: 1, transform: "none" }], 700);
        st.pins.forEach(function (p) {
          c.mark(p.g, p.hit ? "read" : "dim");
          if (p.hit) { p.dist.setAttribute("opacity", 1); c.anim(p.dist, [{ opacity: 0 }, { opacity: 1 }], 300); }
        });
      };
      return st;
    },
  };

  SCENES.bitmap = {
    label: "Redis bitmap commands",
    h: 88,
    steps: [
      { cmd: "SETBIT pings:2024-01-01-00:00 3 1", reply: "(integer) 0", note: "A bitmap is a string that you address one bit at a time.",
        run: function (c, st) { return st.set(c, 3); } },
      { cmd: "SETBIT pings:2024-01-01-00:00 9 1", reply: "(integer) 0", note: "A bitmap is a string that you address one bit at a time.",
        run: function (c, st) { return st.set(c, 9); } },
      { cmd: "GETBIT pings:2024-01-01-00:00 3", reply: "(integer) 1", note: "GETBIT reads one bit.",
        run: function (c, st) { c.mark(st.bits[3], "read"); } },
      { cmd: "GETBIT pings:2024-01-01-00:00 5", reply: "(integer) 0", note: "A bit that was never set is 0.",
        run: function (c, st) { c.mark(st.bits[5], "read"); } },
      { cmd: "BITCOUNT pings:2024-01-01-00:00", reply: "(integer) 2", note: "BITCOUNT counts the bits set to 1.",
        run: function (c, st) { c.mark(st.bits[3], "read"); c.mark(st.bits[9], "read"); } },
    ],
    build: function (c) {
      const strip = h("div", "dta-bits"), st = { bits: [] };
      for (let i = 0; i < 16; i++) {
        st.bits.push(h("div", "dta-bit", "0"));
        strip.appendChild(add(h("div", "dta-bitslot"), st.bits[i], h("div", "dta-idx", i)));
      }
      c.canvas.appendChild(keyed("pings:2024-01-01-00:00", strip, "dta-wide"));
      st.set = function (c, i) {
        st.bits[i].textContent = "1";
        st.bits[i].classList.add("is-on");
        c.mark(st.bits[i], "write");
        return c.anim(st.bits[i], [{ transform: "scale(1.5)" }, { transform: "none" }], 320);
      };
      return st;
    },
  };

  SCENES.bitfield = {
    label: "Redis bitfield commands",
    h: function (w) { return w < 420 ? 148 : 96; },
    steps: [
      { cmd: "BITFIELD bike:1:stats SET u32 #0 1000", reply: "1) (integer) 0", note: "A bitfield packs several integers into one string.",
        run: function (c, st) { return st.set(c, 0, 1000); } },
      { cmd: "BITFIELD bike:1:stats INCRBY u32 #0 -50 INCRBY u32 #1 1", reply: "1) (integer) 950\n2) (integer) 1", note: "One command can update several integers atomically.",
        run: function (c, st) { return Promise.all([st.set(c, 0, 950), st.set(c, 1, 1)]); } },
      { cmd: "BITFIELD bike:1:stats INCRBY u32 #0 500 INCRBY u32 #1 1", reply: "1) (integer) 1450\n2) (integer) 2", note: "One command can update several integers atomically.",
        run: function (c, st) { return Promise.all([st.set(c, 0, 1450), st.set(c, 1, 2)]); } },
      { cmd: "BITFIELD bike:1:stats GET u32 #0 GET u32 #1", reply: "1) (integer) 1450\n2) (integer) 2", note: "GET reads the integers back.",
        run: function (c, st) { c.mark(st.f[0].el, "read"); c.mark(st.f[1].el, "read"); } },
    ],
    build: function (c) {
      const wrap = h("div", "dta-bfs"), st = { f: [] };
      [0, 1].forEach(function (i) {
        const f = { n: 0, val: h("div", "dta-bf-v", "0"), cells: [] }, bits = h("div", "dta-bf-bits");
        for (let b = 0; b < 32; b++) { f.cells.push(h("i")); bits.appendChild(f.cells[b]); }
        f.el = add(h("div", "dta-bf"), h("div", "dta-bf-l", "u32 #" + i), f.val, bits);
        wrap.appendChild(f.el);
        st.f.push(f);
      });
      c.canvas.appendChild(keyed("bike:1:stats", wrap));
      st.set = function (c, i, n) {
        const f = st.f[i], from = f.n;
        f.n = n;
        c.mark(f.el, "write");
        return c.tween(from, n, 480, function (v) {
          v = Math.round(v);
          f.val.textContent = v;
          f.cells.forEach(function (x, b) { x.classList.toggle("is-on", !!((v >>> (31 - b)) & 1)); });   // most significant bit first, as Redis stores it
        });
      };
      return st;
    },
  };

  SCENES.json = {
    label: "Redis JSON commands",
    steps: [
      { cmd: 'JSON.SET bike:1 $ \'{"model":"Deimos","price":4972,"colors":["black","silver"]}\'', reply: "OK", note: "Store a JSON document under one key.",
        run: function (c, st) { return st.set(c); } },
      { cmd: "JSON.GET bike:1 $.model", reply: '"[\\"Deimos\\"]"', note: "Read one part of it with a JSONPath.",
        run: function (c, st) { c.mark(st.model, "read"); } },
      { cmd: "JSON.NUMINCRBY bike:1 $.price 100", reply: '"[5072]"', note: "Update a number in place.",
        run: function (c, st) { c.mark(st.price, "write"); return c.count(st.price, 4972, 5072, 500); } },
      { cmd: "JSON.ARRAPPEND bike:1 $.colors '\"red\"'", reply: "1) (integer) 3", note: "Append to an array inside the document.",
        run: function (c, st) {
          const red = h("span", "dta-js", '"red"');
          add(st.colors, t(", "), red);
          c.mark(red, "write");
          return c.enter(red);
        } },
    ],
    build: function (c) {
      const body = h("div", "dta-json-b"), st = {};
      c.canvas.appendChild(add(h("div", "dta-card dta-json"), h("div", "dta-card-h", "bike:1"), body));
      st.set = function (c) {
        st.model = h("span", "dta-js", '"Deimos"');
        st.price = h("span", "dta-jn", "4972");
        st.colors = add(h("span"), h("span", "dta-js", '"black"'), t(", "), h("span", "dta-js", '"silver"'));
        return Promise.all([
          [t("{")], [t('  "model": '), st.model, t(",")], [t('  "price": '), st.price, t(",")], [t('  "colors": ['), st.colors, t("]")], [t("}")],
        ].map(function (parts, i) {
          const line = add.apply(null, [h("div")].concat(parts));
          body.appendChild(line);
          return c.enter(line, "translateX(-8px)", 280, i * 70);
        }));
      };
      return st;
    },
  };

  SCENES.timeseries = {
    label: "Redis time series commands",
    h: 150,
    steps: [
      { cmd: "TS.ADD thermometer:1 1 9.2", reply: "(integer) 1", note: "Each sample is a timestamp and a value.",
        run: function (c, st) { return st.add(c, 1, 9.2); } },
      { cmd: "TS.ADD thermometer:1 2 9.9", reply: "(integer) 2", note: "Each sample is a timestamp and a value.",
        run: function (c, st) { return st.add(c, 2, 9.9); } },
      { cmd: "TS.MADD thermometer:1 3 10.4 thermometer:1 4 11.1 thermometer:1 5 10.8", reply: "1) (integer) 3\n2) (integer) 4\n3) (integer) 5", note: "TS.MADD adds several samples in one command.",
        run: async function (c, st) {
          for (const p of [[3, 10.4], [4, 11.1], [5, 10.8]]) { st.add(c, p[0], p[1]); await c.wait(170); }
        } },
      { cmd: "TS.RANGE thermometer:1 - + AGGREGATION avg 3", reply: "1) 1) (integer) 0\n   2) 9.55\n2) 1) (integer) 3\n   2) 10.766666666666666", note: "TS.RANGE can average the samples in fixed time buckets.",
        run: function (c, st) { return st.buckets(c); } },
    ],
    build: function (c) {
      const svg = canvasSvg(c), W = Math.min(c.W, 500), xa = (c.W - W) / 2 + 30, xb = (c.W + W) / 2 - 10, ya = c.H - 20, yb = 8;
      const X = function (ts) { return xa + ts / 6 * (xb - xa); }, Y = function (v) { return ya - (v - 8.5) / 2.9 * (ya - yb); };
      const back = s("g"), line = s("polyline", { class: "dta-ts-line", points: "" }), dots = s("g"), pts = [], st = {};
      add(svg, back, line, dots);
      back.appendChild(s("line", { class: "dta-axis", x1: xa, x2: xb, y1: ya, y2: ya }));
      [9, 10, 11].forEach(function (v) {
        add(back, s("line", { class: "dta-grid", x1: xa, x2: xb, y1: Y(v), y2: Y(v) }), s("text", { x: xa - 7, y: Y(v), dy: ".35em", "text-anchor": "end" }, v));
      });
      for (let ts = 0; ts <= 6; ts++) {
        add(back, s("line", { class: "dta-axis", x1: X(ts), x2: X(ts), y1: ya, y2: ya + 4 }), s("text", { x: X(ts), y: ya + 15, "text-anchor": "middle" }, ts));
      }
      back.appendChild(s("text", { x: xa + 6, y: yb + 5 }, "thermometer:1"));
      st.add = function (c, ts, v) {
        const dot = s("circle", { class: "dta-ts-dot", cx: X(ts), cy: Y(v), r: 3.5 });
        pts.push(X(ts) + "," + Y(v));
        line.setAttribute("points", pts.join(" "));
        dots.appendChild(dot);
        c.mark(dot, "write");
        return c.enter(dot, "scale(.2)");
      };
      st.buckets = function (c) {
        return Promise.all([[0, 3, 9.55, "9.55"], [3, 6, 10.766666666666666, "10.77"]].map(function (b, i) {
          const g = add(s("g", { class: "dta-ts-bucket" }),
            s("rect", { x: X(b[0]) + 1.5, y: yb, width: X(b[1]) - X(b[0]) - 3, height: ya - yb, rx: 4 }),
            s("line", { x1: X(b[0]) + 6, x2: X(b[1]) - 6, y1: Y(b[2]), y2: Y(b[2]) }),
            s("text", { x: (X(b[0]) + X(b[1])) / 2, y: ya - 7, "text-anchor": "middle" }, "avg " + b[3]));
          back.appendChild(g);
          return c.anim(g, [{ opacity: 0 }, { opacity: 1 }], 420, { delay: i * 220, fill: "backwards" });
        }));
      };
      return st;
    },
  };

  SCENES["vector-set"] = {
    label: "Redis vector set commands",
    h: 150,
    steps: [
      { cmd: "VADD points VALUES 2 1.0 1.0 pt:A", reply: "(integer) 1", note: "Each element is stored with a vector.",
        run: function (c, st) { return st.add(c, "pt:A", 1, 1); } },
      { cmd: "VADD points VALUES 2 -1.0 -1.0 pt:B", reply: "(integer) 1", note: "Each element is stored with a vector.",
        run: function (c, st) { return st.add(c, "pt:B", -1, -1); } },
      { cmd: "VADD points VALUES 2 -1.0 1.0 pt:C", reply: "(integer) 1", note: "Each element is stored with a vector.",
        run: function (c, st) { return st.add(c, "pt:C", -1, 1); } },
      { cmd: "VADD points VALUES 2 1.0 -1.0 pt:D", reply: "(integer) 1", note: "Each element is stored with a vector.",
        run: function (c, st) { return st.add(c, "pt:D", 1, -1); } },
      { cmd: "VADD points VALUES 2 1.0 0 pt:E", reply: "(integer) 1", note: "Each element is stored with a vector.",
        run: function (c, st) { return st.add(c, "pt:E", 1, 0); } },
      { cmd: "VSIM points VALUES 2 0.9 0.1 COUNT 2 WITHSCORES", reply: '1) "pt:E"\n2) "0.9969418649561703"\n3) "pt:A"\n4) "0.8901269808411598"',
        note: "VSIM returns the elements most similar to a query vector.",
        run: function (c, st) { return st.query(c, 0.9, 0.1, ["pt:E", "pt:A"]); } },
    ],
    build: function (c) {
      const svg = canvasSvg(c), ox = Math.round(c.W / 2), oy = Math.round(c.H / 2), u = Math.min(50, (c.H - 46) / 2), st = { v: {} };
      add(svg, s("line", { class: "dta-grid", x1: ox - u - 28, x2: ox + u + 28, y1: oy, y2: oy }), s("line", { class: "dta-grid", x1: ox, x2: ox, y1: oy - u - 18, y2: oy + u + 18 }),
        s("text", { x: ox - u - 34, y: oy, dy: ".35em", "text-anchor": "end" }, "points"));
      st.add = function (c, name, x, y) {
        const px = ox + x * u, py = oy - y * u, g = s("g", { class: "dta-vec" }), dot = s("circle", { cx: px, cy: py, r: 4 });
        add(svg, add(g, s("line", { x1: ox, y1: oy, x2: px, y2: py }), dot,
          s("text", { x: px + (x < 0 ? -8 : 8), y: py + (y > 0 ? -4 : 12), "text-anchor": x < 0 ? "end" : "start" }, name)));
        st.v[name] = g;
        c.mark(g, "write");
        return Promise.all([c.anim(g, [{ opacity: 0 }, { opacity: 1 }], 300), c.enter(dot, "scale(.2)")]);
      };
      st.query = async function (c, x, y, hits) {
        const ex = ox + x * u * 1.5, ey = oy - y * u * 1.5;
        const q = add(s("g", { class: "dta-query" }), s("line", { x1: ox, y1: oy, x2: ex, y2: ey }), s("text", { x: ex + 6, y: ey, dy: ".35em" }, "query"));
        svg.appendChild(q);
        await c.anim(q, [{ opacity: 0 }, { opacity: 1 }], 400);
        for (const name in st.v) c.mark(st.v[name], hits.indexOf(name) < 0 ? "dim" : "read");
      };
      return st;
    },
  };

  SCENES.array = {
    label: "Redis array commands",
    h: 88,
    steps: [
      { cmd: 'ARSET events:1 0 "login" "click" "purchase"', reply: "(integer) 3", note: "An array stores values by index.",
        run: function (c, st) {
          return Promise.all(["login", "click", "purchase"].map(function (v, i) {
            const w = st.make(c, i, v);
            st.zone.appendChild(w);
            return c.enter(w, "scale(.6)", 340, i * 110);
          }));
        } },
      { cmd: "ARGET events:1 1", reply: '"click"', note: "ARGET reads any index directly.",
        run: function (c, st) { c.mark(st.cells[1], "read"); } },
      { cmd: 'ARSET events:1 1000000 "refund"', reply: "(integer) 1", note: "You can set any index without allocating the gap before it.",
        run: function (c, st) {
          const olds = [].slice.call(st.zone.children);
          st.hole = cell("· · ·", "dta-gap");
          const gap = slot(st.hole, "3 … 999999"), last = st.make(c, 1000000, "refund");
          return Promise.all([c.flip(olds, function () { add(st.zone, gap, last); }), c.enter(gap, "scale(.6)", 340, 120), c.enter(last, "scale(.6)", 340, 240)]);
        } },
      { cmd: "ARGET events:1 999", reply: "(nil)", note: "An index that was never set returns nil.",
        run: function (c, st) { c.mark(st.hole, "no"); } },
      { cmd: "ARCOUNT events:1", reply: "(integer) 4", note: "ARCOUNT counts only the indexes that hold a value.",
        run: function (c, st) { st.cells.forEach(function (x) { c.mark(x, "read"); }); } },
    ],
    build: function (c) {
      const st = { zone: h("div", "dta-arr"), cells: [] };
      c.canvas.appendChild(keyed("events:1", st.zone, "dta-wide"));
      st.make = function (c, idx, v) {
        const ce = cell(v);
        st.cells.push(ce);
        c.mark(ce, "write");
        return slot(ce, idx);
      };
      return st;
    },
  };

  /* A row of `n` boxes along the bottom of an SVG canvas, each `rows` slots tall. */
  function boxes(c, svg, n, maxW, rows, key) {
    const w = Math.min(maxW, Math.floor((c.W - 4) / n)), x0 = Math.round((c.W - n * w) / 2), y = c.H - 22 - rows * 22, out = [];
    for (let i = 0; i < n; i++) {
      const b = { x: x0 + i * w + w / 2, y: y - 3, slots: [] };
      for (let k = 0; k < rows; k++) {
        const g = s("g", { class: "dta-box" }), label = s("text", { x: b.x, y: y + k * 22 + 11, dy: ".35em", "text-anchor": "middle" });
        add(svg, add(g, s("rect", { x: x0 + i * w + 1.5, y: y + k * 22 + 1.5, width: w - 3, height: 19, rx: 4 }), label));
        b.slots.push({ g: g, label: label });
      }
      out.push(b);
    }
    svg.appendChild(s("text", { x: c.W / 2, y: c.H - 5, "text-anchor": "middle" }, key));
    return out;
  }
  function points(list, idxs) { return idxs.map(function (i) { return [list[i].x, list[i].y]; }); }

  SCENES.bloom = {
    label: "Redis Bloom filter commands",
    h: 120,
    steps: [
      { cmd: 'BF.ADD bikes:models "Smoky Mountain Striker"', reply: "(integer) 1", note: "Each item sets a few bits, chosen by hash functions.",
        run: function (c, st) { return st.addItem(c, '"Smoky Mountain Striker"', [2, 7, 12]); } },
      { cmd: 'BF.ADD bikes:models "Rocky Mountain Racer"', reply: "(integer) 1", note: "Different items can share a bit.",
        run: function (c, st) { return st.addItem(c, '"Rocky Mountain Racer"', [4, 7, 14]); } },
      { cmd: 'BF.EXISTS bikes:models "Smoky Mountain Striker"', reply: "(integer) 1", note: "All of the item's bits are set, so it was probably added.",
        run: function (c, st) { return st.check(c, '"Smoky Mountain Striker"', [2, 7, 12]); } },
      { cmd: 'BF.EXISTS bikes:models "Terrible Bike Name"', reply: "(integer) 0", note: "One of the item's bits is 0, so it was never added.",
        run: function (c, st) { return st.check(c, '"Terrible Bike Name"', [2, 9, 14]); } },
    ],
    build: function (c) {
      const svg = canvasSvg(c), bits = boxes(c, svg, 16, 30, 1, "bikes:models"), st = {};
      svg.classList.add("dta-bloom");
      bits.forEach(function (b) { b.slots[0].label.textContent = "0"; });
      st.addItem = async function (c, item, idxs) {
        await probe(c, svg, item, c.W / 2, points(bits, idxs), "write");
        idxs.forEach(function (i) {
          const bit = bits[i].slots[0];
          bit.label.textContent = "1";
          bit.g.classList.add("is-on");
          c.mark(bit.g, "write");
        });
      };
      st.check = async function (c, item, idxs) {
        await probe(c, svg, item, c.W / 2, points(bits, idxs), "read");
        idxs.forEach(function (i) {
          const bit = bits[i].slots[0];
          c.mark(bit.g, bit.g.classList.contains("is-on") ? "read" : "no");
        });
      };
      return st;
    },
  };

  SCENES.cuckoo = {
    label: "Redis cuckoo filter commands",
    h: 126,
    steps: [
      { cmd: 'CF.ADD bikes:models "Smoky Mountain Striker"', reply: "(integer) 1", note: "Each item leaves a short fingerprint in one of two possible buckets.",
        run: function (c, st) { return st.addItem(c, '"Smoky Mountain Striker"', "a7", [1, 5]); } },
      { cmd: 'CF.ADD bikes:models "Rocky Mountain Racer"', reply: "(integer) 1", note: "The filter keeps the fingerprints, not the items.",
        run: function (c, st) { return st.addItem(c, '"Rocky Mountain Racer"', "3c", [3, 6]); } },
      { cmd: 'CF.EXISTS bikes:models "Smoky Mountain Striker"', reply: "(integer) 1", note: "CF.EXISTS looks for the fingerprint in both buckets.",
        run: function (c, st) { return st.check(c, '"Smoky Mountain Striker"', "a7", [1, 5]); } },
      { cmd: 'CF.DEL bikes:models "Smoky Mountain Striker"', reply: "(integer) 1", note: "Unlike a Bloom filter, a cuckoo filter lets you delete an item.",
        run: async function (c, st) {
          const sl = st.buckets[1].slots[0];
          await probe(c, st.svg, '"Smoky Mountain Striker" → a7', c.W / 2, points(st.buckets, [1, 5]), "write");
          c.mark(sl.g, "write");
          await c.anim(sl.label, [{ opacity: 1 }, { opacity: 0 }], 300);
          sl.label.textContent = "";
        } },
      { cmd: 'CF.EXISTS bikes:models "Smoky Mountain Striker"', reply: "(integer) 0", note: "Neither bucket holds the fingerprint now.",
        run: function (c, st) { return st.check(c, '"Smoky Mountain Striker"', "a7", [1, 5]); } },
    ],
    build: function (c) {
      const svg = canvasSvg(c), st = { svg: svg, buckets: boxes(c, svg, 8, 50, 2, "bikes:models") };
      st.addItem = async function (c, item, fp, idxs) {
        const sl = st.buckets[idxs[0]].slots[0];
        await probe(c, svg, item + " → " + fp, c.W / 2, points(st.buckets, idxs), "write");
        sl.label.textContent = fp;
        c.mark(sl.g, "write");
        await c.enter(sl.label, "scale(.4)");
      };
      st.check = async function (c, item, fp, idxs) {
        await probe(c, svg, item + " → " + fp, c.W / 2, points(st.buckets, idxs), "read");
        idxs.forEach(function (i) {
          const slots = st.buckets[i].slots, found = slots.filter(function (sl) { return sl.label.textContent === fp; });
          (found.length ? found : slots).forEach(function (sl) { c.mark(sl.g, found.length ? "read" : "no"); });
        });
      };
      return st;
    },
  };

  /* A stand-in for the HyperLogLog hash: an item picks one of 12 registers and a value for it. */
  function register(item) {
    let x = 2166136261;
    for (let i = 0; i < item.length; i++) x = Math.imul(x ^ item.charCodeAt(i), 16777619);
    x >>>= 0;
    return [x % 12, 1 + (x >>> 8) % 5];
  }

  SCENES.hyperloglog = {
    label: "Redis HyperLogLog commands",
    h: 124,
    steps: [
      { cmd: "PFADD bikes Hyperion Deimos Phoebe Quaoar", reply: "(integer) 1", note: "The items aren't stored. Each one only updates a small sketch.",
        run: function (c, st) { return st.feed(c, 0, ["Hyperion", "Deimos", "Phoebe", "Quaoar"]); } },
      { cmd: "PFCOUNT bikes", reply: "(integer) 4", note: "PFCOUNT estimates how many unique items were added.",
        run: function (c, st) { return st.count(c, 0, 4); } },
      { cmd: "PFADD commuter_bikes Salacia Mimas Quaoar", reply: "(integer) 1", note: "The items aren't stored. Each one only updates a small sketch.",
        run: function (c, st) { return st.feed(c, 1, ["Salacia", "Mimas", "Quaoar"]); } },
      { cmd: "PFMERGE all_bikes bikes commuter_bikes", reply: "OK", note: "PFMERGE combines sketches.",
        run: function (c, st) {
          st.sk[2].el.style.visibility = "";
          st.paint(2, st.sk[0].reg.map(function (v, i) { return Math.max(v, st.sk[1].reg[i]); }));   // a merge keeps the larger of each pair of registers
          c.mark(st.sk[2].box, "write");
          return c.enter(st.sk[2].el, "scale(.8)");
        } },
      { cmd: "PFCOUNT all_bikes", reply: "(integer) 6", note: "Quaoar was added to both, but it counts once.",
        run: function (c, st) { return st.count(c, 2, 6); } },
    ],
    build: function (c) {
      const wrap = h("div", "dta-hll"), st = { sk: [] };
      ["bikes", "commuter_bikes", "all_bikes"].forEach(function (key, i) {
        const sk = { reg: [], bars: [], box: h("div", "dta-sk-box"), inbox: h("div", "dta-sk-in"), n: h("div", "dta-sk-n", " ") };
        for (let b = 0; b < 12; b++) { sk.reg.push(0); sk.bars.push(h("i")); sk.box.appendChild(sk.bars[b]); }
        sk.el = add(h("div", "dta-sk"), sk.inbox, sk.box, h("div", "dta-key", key), sk.n);
        if (i) sk.el.style.visibility = "hidden";   // each key appears with the command that creates it
        wrap.appendChild(sk.el);
        st.sk.push(sk);
      });
      c.canvas.appendChild(wrap);
      st.paint = function (i, reg) {
        st.sk[i].reg = reg;
        reg.forEach(function (v, b) { st.sk[i].bars[b].style.height = 3 + v * 7 + "px"; });
      };
      st.feed = async function (c, i, items) {
        const sk = st.sk[i], reg = sk.reg.slice(), drops = [];
        if (sk.el.style.visibility) { sk.el.style.visibility = ""; c.enter(sk.el, "scale(.8)"); }
        for (const item of items) {
          const el = h("div", "dta-sk-item", item), r = register(item);
          reg[r[0]] = Math.max(reg[r[0]], r[1]);
          sk.inbox.appendChild(el);
          drops.push(c.anim(el, [
            { opacity: 0, transform: "translate(-50%, -8px)" }, { opacity: 1, transform: "translate(-50%, 0)", offset: 0.3 },
            { opacity: 1, transform: "translate(-50%, 0)", offset: 0.55 }, { opacity: 0, transform: "translate(-50%, 30px) scale(.4)" },
          ], 700, { easing: "ease-in-out" }).then(function () { el.remove(); }));
          await c.wait(260);
          st.paint(i, reg.slice());
        }
        c.mark(sk.box, "write");
        await Promise.all(drops);
      };
      st.count = function (c, i, n) {
        st.sk[i].n.textContent = "≈ " + n;
        c.mark(st.sk[i].box, "read");
        return c.enter(st.sk[i].n, "translateY(-6px)");
      };
      return st;
    },
  };

  SCENES["count-min-sketch"] = {
    label: "Redis count-min sketch commands",
    h: 116,
    steps: [
      { cmd: "CMS.INITBYDIM bikes:profit 8 3", reply: "OK", note: "A count-min sketch is a small grid of counters.",
        run: function (c, st) { st.grid.style.visibility = ""; return c.enter(st.grid, "scale(.9)"); } },
      { cmd: 'CMS.INCRBY bikes:profit "Smoky Mountain Striker" 100', reply: "1) (integer) 100", note: "Each item adds to one counter in every row.",
        run: function (c, st) { return st.incr(c, [1, 4, 6], 100); } },
      { cmd: 'CMS.INCRBY bikes:profit "Rocky Mountain Racer" 200', reply: "1) (integer) 200", note: "Two items can land on the same counter.",
        run: function (c, st) { return st.incr(c, [5, 4, 2], 200); } },
      { cmd: 'CMS.QUERY bikes:profit "Smoky Mountain Striker"', reply: "1) (integer) 100", note: "The estimate is the smallest of the item's counters.",
        run: function (c, st) { [1, 4, 6].forEach(function (col, r) { c.mark(st.cells[r][col].el, st.cells[r][col].n === 100 ? "read" : "no"); }); } },
    ],
    build: function (c) {
      const st = { grid: h("div", "dta-cms"), cells: [] };
      for (let r = 0; r < 3; r++) {
        st.cells.push([]);
        for (let k = 0; k < 8; k++) {
          st.cells[r].push({ n: 0, el: h("div", "dta-ctr is-zero", "0") });
          st.grid.appendChild(st.cells[r][k].el);
        }
      }
      st.grid.style.visibility = "hidden";
      c.canvas.appendChild(keyed("bikes:profit", st.grid));
      st.incr = function (c, cols, by) {
        return Promise.all(cols.map(function (col, r) {
          const x = st.cells[r][col], from = x.n;
          x.n += by;
          x.el.classList.remove("is-zero");
          c.mark(x.el, "write");
          return c.count(x.el, from, x.n, 450);
        }));
      };
      return st;
    },
  };

  SCENES["t-digest"] = {
    label: "Redis t-digest commands",
    h: 116,
    steps: [
      { cmd: "TDIGEST.CREATE racer_ages", reply: "OK", note: "TDIGEST.CREATE makes an empty t-digest." },
      { cmd: "TDIGEST.ADD racer_ages 45.88 44.2 58.03 19.76 39.84 69.28 50.97 25.41 19.27 85.71 42.63", reply: "OK", note: "A t-digest keeps a compact summary of the numbers you add.",
        run: function (c, st) { return st.fill(c); } },
      { cmd: "TDIGEST.QUANTILE racer_ages 0.5", reply: '1) "44.2"', note: "Half of the values are 44.2 or lower.",
        run: function (c, st) { return st.split(c, 44.2, "44.2"); } },
      { cmd: "TDIGEST.CDF racer_ages 50", reply: '1) "0.6363636363636364"', note: "About 64% of the values are 50 or lower.",
        run: function (c, st) { return st.split(c, 50, "50"); } },
    ],
    build: function (c) {
      const svg = canvasSvg(c), W = Math.min(c.W, 480), xa = (c.W - W) / 2 + 14, xb = (c.W + W) / 2 - 14, ya = c.H - 30, st = { dots: [] };
      const X = function (v) { return xa + (v - 10) / 85 * (xb - xa); };
      const back = s("g"), dots = s("g");
      add(svg, back, dots);
      add(back, s("line", { class: "dta-axis", x1: xa, x2: xb, y1: ya, y2: ya }), s("text", { x: xa, y: 11 }, "racer_ages"));
      [20, 40, 60, 80].forEach(function (v) {
        add(back, s("line", { class: "dta-axis", x1: X(v), x2: X(v), y1: ya, y2: ya + 4 }), s("text", { x: X(v), y: ya + 16, "text-anchor": "middle" }, v));
      });
      const ages = [45.88, 44.2, 58.03, 19.76, 39.84, 69.28, 50.97, 25.41, 19.27, 85.71, 42.63];
      st.fill = function (c) {
        const placed = [];
        return Promise.all(ages.map(function (v, i) {
          /* Values too close to tell apart on the axis are stacked. */
          let level = 0;
          while (placed.some(function (p) { return p[1] === level && Math.abs(p[0] - X(v)) < 9; })) level++;
          placed.push([X(v), level]);
          const dot = s("circle", { class: "dta-td-dot", cx: X(v), cy: ya - 8 - level * 10, r: 4 });
          dots.appendChild(dot);
          st.dots.push({ v: v, el: dot });
          return c.enter(dot, "translateY(-40px)", 420, i * 60);
        }));
      };
      st.split = function (c, v, label) {
        const g = add(s("g", { class: "dta-td-split" }),
          s("rect", { x: xa - 6, y: 20, width: X(v) - xa + 6, height: ya - 20 }),
          s("line", { x1: X(v), x2: X(v), y1: 20, y2: ya }),
          s("text", { x: X(v) + 6, y: 28 }, label));
        back.appendChild(c.temp(g));
        st.dots.forEach(function (d) { if (d.v <= v) c.mark(d.el, "read"); });
        return c.anim(g, [{ opacity: 0 }, { opacity: 1 }], 400);
      };
      return st;
    },
  };

  SCENES["top-k"] = {
    label: "Redis Top-K commands",
    h: 112,
    steps: [
      { cmd: "TOPK.RESERVE bikes:keywords 3", reply: "OK", note: "This Top-K keeps track of the 3 most frequent items." },
      { cmd: "TOPK.ADD bikes:keywords store seat pedals", reply: "1) (nil)\n2) (nil)\n3) (nil)", note: "Each item is counted as it arrives.",
        run: async function (c, st) {
          for (const name of ["store", "seat", "pedals"]) { st.bump(c, name, 1); await c.wait(140); }
        } },
      { cmd: "TOPK.ADD bikes:keywords store seat store", reply: "1) (nil)\n2) (nil)\n3) (nil)", note: "Each item is counted as it arrives.",
        run: function (c, st) { return Promise.all([st.bump(c, "store", 3), st.bump(c, "seat", 2)]); } },
      { cmd: "TOPK.ADD bikes:keywords tires tires", reply: '1) "pedals"\n2) (nil)', note: "Now tires is more frequent than pedals, so pedals drops out.",
        run: async function (c, st) {
          const r = st.rows[2];
          c.mark(r.el, "no");
          await c.wait(420);
          await Promise.all([r.item, r.val].map(function (el) { return c.anim(el, [{ opacity: 1 }, { opacity: 0 }], 260); }));
          r.name = r.item.textContent = r.val.textContent = "";
          c.clear();
          await st.bump(c, "tires", 2);
        } },
      { cmd: "TOPK.LIST bikes:keywords", reply: '1) "store"\n2) "seat"\n3) "tires"', note: "TOPK.LIST returns the current top 3.",
        run: function (c, st) { st.rows.forEach(function (r) { c.mark(r.el, "read"); }); } },
    ],
    build: function (c) {
      const k = card("bikes:keywords", "26px 1fr auto", 3, 220), st = { rows: [] };
      c.canvas.appendChild(k.el);
      for (let i = 1; i <= 3; i++) {
        const r = { name: "", n: 0, item: h("span", "dta-m"), val: h("span", "dta-v") };
        r.el = row(h("span", "dta-rank", i), r.item, r.val);
        st.rows.push(r);
        k.body.appendChild(r.el);
      }
      /* Set an item's count. A new item takes the first free slot. */
      st.bump = function (c, name, n) {
        let r = st.rows.find(function (x) { return x.name === name; });
        if (r) { c.mark(r.el, "write"); return c.count(r.val, r.n, r.n = n, 400); }
        r = st.rows.find(function (x) { return !x.name; });
        r.name = r.item.textContent = name;
        r.val.textContent = r.n = n;
        c.mark(r.el, "write");
        return Promise.all([c.enter(r.item, "translateX(-10px)"), c.enter(r.val, "translateX(-10px)")]);
      };
      return st;
    },
  };

  /* ---- start ---- */

  const players = [];
  function mount(root) {
    const scene = SCENES[root.getAttribute("data-dta")];
    if (!scene || root.dtaPlayer) return null;
    root.dtaPlayer = new Player(root, scene);
    players.push(root.dtaPlayer);
    return root.dtaPlayer;
  }
  function start() {
    document.querySelectorAll(".dta[data-dta]").forEach(mount);
    /* Labels are measured as they are drawn, so draw again if the code font arrives late. */
    const font = '12px "Space Mono"';
    if (document.fonts && document.fonts.load && !document.fonts.check(font)) {
      document.fonts.load(font).then(function () { players.forEach(function (p) { p.play(p.cur); }); }, function () {});
    }
  }
  window.DataTypeAnimation = { scenes: SCENES, players: players, mount: mount };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

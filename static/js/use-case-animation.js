/* =========================================================================
   Use case animations
   A short looping animation for a use case page. It draws the application
   and Redis, types each command the application sends, shows the reply,
   and draws what the command did. The scenes run on the data type
   animation player, so data-type-animation.js must load first.

   Every command and reply was recorded from Redis 8.12 (release candidate
   2). A scene follows the same rules as the data type animations: nothing
   is drawn before the first command has its reply, a step draws only what
   its own command caused, and every step stays on screen for the same time.
   Something that happens outside Redis, such as a worker crashing, is a
   step of its own with no command.
   ========================================================================= */
(function () {
  "use strict";
  const D = window.DataTypeAnimation;
  if (!D || D.useCases) return;   // the player didn't load, or this file already ran
  D.useCases = true;
  const h = D.kit.h, s = D.kit.s, add = D.kit.add, row = D.kit.row, cell = D.kit.cell, shake = D.kit.shake;
  const CROSS = 900;   // ms a message takes to cross a wire, long enough to read what it says

  /* ---- the stage ---- */

  /* A scene's drawing: a box `w` pixels wide in which everything is placed in pixels. A drawing that
     needs more room than the column has is made smaller to fit. */
  function stage(c, w) {
    const el = h("div", "dta-uc"), svg = s("svg", { class: "dta-svg dta-uc-wires", width: w, height: c.H });
    const g = {};
    el.style.width = w + "px";
    el.style.height = c.H + "px";
    if (w > c.W) el.style.transform = "scale(" + c.W / w + ")";
    c.canvas.appendChild(add(el, svg));

    function place(e, x, y, w2, h2) {
      e.style.left = x + "px";
      e.style.top = y + "px";
      if (w2 != null) e.style.width = w2 + "px";
      if (h2 != null) e.style.height = h2 + "px";
      return el.appendChild(e);
    }
    /* A frame around actors that belong together, such as the workers of one group, with a label that
       names them. Place it before the actors, so that it is drawn behind them. */
    g.group = function (label, x, y, w2, h2) { return place(add(h("div", "dta-uc-group"), h("div", "dta-uc-label", label)), x, y, w2, h2); };
    /* A label over a part of the drawing that says what it is, in the style of a store's label. */
    g.label = function (text, x, y) { return place(h("div", "dta-uc-label dta-uc-over", text), x, y); };
    /* Whoever sends the commands, such as the application or a worker. `l` and `r` are the middles of
       its left and right sides, where a wire attaches. say() writes a second line under its name. */
    g.actor = function (name, x, y, w2, h2) {
      const a = { el: place(h("div", "dta-uc-app", name), x, y, w2, h2), l: [x, y + h2 / 2], r: [x + w2, y + h2 / 2] };
      a.say = function (text) {
        if (!a.line) a.line = a.el.appendChild(h("div", "dta-uc-line"));
        a.line.textContent = text;
      };
      return a;
    };
    /* Something that holds data: a card titled with a key name, under a label that says where the key
       lives. `cols` are the grid columns of its rows, `rows` is how many rows to keep room for, and
       `extra` is the height of anything else in the card, in pixels. A card with no `title` holds
       something other than one key's rows, such as several lists. A card with no `label` sits under
       another card. */
    g.store = function (label, title, x, y, w2, cols, rows, extra) {
      const body = h("div", "dta-rows"), card = h("div", "dta-card"), box = h("div", "dta-uc-store");
      const tall = rows * 27 + (extra || 0), top = label ? 18 : 0, bar = title ? 25 : 0;
      if (label) box.appendChild(h("div", "dta-uc-label", label));
      if (title) card.appendChild(add(h("div", "dta-card-h"), h("span", "dta-uc-title", title)));
      body.style.setProperty("--dta-cols", cols);
      body.style.minHeight = tall + "px";
      const mid = y + top + (bar + tall + 2) / 2;   // the label, then the card: its title bar, body, and border
      return { el: place(add(box, add(card, body)), x, y, w2), body: body, l: [x, mid], r: [x + w2, mid] };
    };
    g.wire = function (a, b) { return svg.appendChild(s("path", { class: "dta-uc-wire", d: "M" + a + "L" + b })); };
    /* A message crosses from point `a` to point `b`: a command going out, or its answer coming back.
       `kind` is "write" or "read", as for a mark. */
    g.send = function (c, a, b, text, kind) {
      const m = el.appendChild(h("div", "dta-uc-msg is-" + kind, text));
      function at(p) { return "translate(" + p[0] + "px," + p[1] + "px) translate(-50%,-50%)"; }
      return c.anim(m, [{ transform: at(a), opacity: 0 }, { opacity: 1, offset: 0.12 }, { opacity: 1, offset: 0.88 }, { transform: at(b), opacity: 0 }],
        CROSS, { easing: "ease-in-out", fill: "forwards" }).then(function () { m.remove(); });
    };
    return g;
  }

  /* ---- leaderboard ---- */

  D.scenes.leaderboard = {
    label: "a leaderboard with a Redis sorted set",
    h: 153,
    steps: [
      { cmd: "ZADD leaderboard:demo 1225 player-1 1180 player-2 1105 player-3 1040 player-4", reply: "(integer) 4", note: "A sorted set holds every player with a score. Redis keeps them in order.",
        run: async function (c, st) {
          await st.ask(c, "ZADD", "write");
          for (const p of [["player-1", 1225], ["player-2", 1180], ["player-3", 1105], ["player-4", 1040]]) {
            c.enter(c.mark(st.add(p[0], p[1]), "write"), "translateX(-10px)");
            await c.wait(120);
          }
        } },
      { cmd: "ZINCRBY leaderboard:demo 150 player-3", reply: '"1255"', note: "When a player scores, ZINCRBY adds the points. Redis moves the player to the new rank by itself.",
        run: async function (c, st) {
          await st.ask(c, "ZINCRBY", "write");
          const p = st.players["player-3"];
          c.mark(p.el, "write");
          st.score(p, 1255);
          await c.count(p.val, 1105, 1255, 450);
          await c.flip(st.all().map(function (x) { return x.el; }), st.sort, 560);
        } },
      { cmd: "ZRANGE leaderboard:demo 0 2 REV", reply: '1) "player-3"\n2) "player-1"\n3) "player-2"', note: "ZRANGE with REV reads the top of the board in one command.",
        run: async function (c, st) {
          await st.ask(c, "ZRANGE", "read");
          st.all().slice(0, 3).forEach(function (p) { c.mark(p.el, "read"); });
          await st.answer(c, "top 3", "read");
        } },
      { cmd: "ZREVRANK leaderboard:demo player-2", reply: "(integer) 2", note: "ZREVRANK finds one player's place. It counts from 0, so 2 means third.",
        run: async function (c, st) {
          await st.ask(c, "ZREVRANK", "read");
          c.mark(st.players["player-2"].el, "read");
          await st.answer(c, "2", "read");
        } },
      { cmd: "ZREMRANGEBYRANK leaderboard:demo 0 -4", reply: "(integer) 1", note: "The game trims the board so that only the top three stay.",
        run: async function (c, st) {
          await st.ask(c, "ZREMRANGEBYRANK", "write");
          const p = st.players["player-4"];
          c.mark(p.el, "write");
          await c.wait(260);
          await c.leave(p.el, "translateX(14px)");
          delete st.players["player-4"];
        } },
    ],
    build: function (c) {
      const narrow = c.W < 430, aw = narrow ? 46 : 72, gap = narrow ? 30 : 72;
      const cw = Math.min(330, c.W - aw - gap), x = aw + (narrow ? gap : Math.min(130, c.W - aw - cw));
      const g = stage(c, x + cw), card = g.store("Redis", "leaderboard:demo", x, 0, cw, narrow ? "10px 58px 1fr 32px" : "12px 66px 1fr 36px", 4);
      const game = g.actor("Game", 0, Math.round(card.l[1]) - 26, aw, 52), st = { players: {} };
      g.wire(game.r, card.l);

      /* The players, best score first. */
      st.all = function () { return Object.keys(st.players).map(function (k) { return st.players[k]; }).sort(function (a, b) { return b.n - a.n; }); };
      st.score = function (p, n) {
        p.n = n;
        p.bar.style.width = n / 13 + "%";   // a full bar is 1300 points
      };
      st.add = function (name, n) {
        const p = st.players[name] = { rank: h("span", "dta-rank"), val: h("span", "dta-v", n), bar: h("i") };
        p.el = card.body.appendChild(row(p.rank, h("span", "dta-m", name), add(h("span", "dta-uc-bar"), p.bar), p.val));
        st.score(p, n);
        st.sort();
        return p.el;
      };
      /* Put the rows in rank order and number them. */
      st.sort = function () {
        st.all().forEach(function (p, i) {
          p.rank.textContent = i + 1;
          card.body.appendChild(p.el);
        });
      };
      st.ask = function (c, text, kind) { return g.send(c, game.r, card.l, text, kind); };
      st.answer = function (c, text, kind) { return g.send(c, card.l, game.r, text, kind); };
      return st;
    },
  };

  /* ---- job queue ---- */

  /* A worker claims the oldest pending job. When the list is empty, it waits up to 5 seconds for one. */
  const CLAIM = "BLMOVE queue:jobs:pending queue:jobs:processing RIGHT LEFT 5";
  D.scenes["job-queue"] = {
    label: "a job queue with Redis lists",
    h: 136,
    steps: [
      { cmd: "LPUSH queue:jobs:pending 9a4f 7c21", reply: "(integer) 2", note: "The app adds two jobs to the pending list. 9a4f and 7c21 are their IDs.",
        run: async function (c, st) {
          await st.send(c, st.app.r, st.card.l, "LPUSH", "write");
          for (const id of ["9a4f", "7c21"]) {
            const job = st.jobs[id] = cell(id);
            c.mark(job, "write");
            await Promise.all([st.move(c, job, st.pending, 440), c.enter(job, "translateX(-14px)")]);
          }
        } },
      { cmd: CLAIM, reply: '"9a4f"', note: "Worker 1 asks for a job with BLMOVE. Redis moves the oldest job to the processing list and answers with its ID.",
        run: function (c, st) { return st.claim(c, 0, "9a4f"); } },
      { cmd: CLAIM, reply: '"7c21"', note: "Worker 2 asks the same way and gets the next job. Each job goes to only one worker.",
        run: function (c, st) { return st.claim(c, 1, "7c21"); } },
      { cmd: "LREM queue:jobs:processing 1 7c21", reply: "(integer) 1", note: "Worker 2 finishes its job and removes it from the processing list with LREM.",
        run: async function (c, st) {
          const w = st.workers[1], job = st.jobs["7c21"];
          await st.send(c, w.l, w.at, "LREM", "write");
          c.mark(job, "write");
          await c.wait(200);
          await c.leave(job);
          w.say("done");
        } },
      { event: "Worker 1 crashes", note: "Worker 1 crashes before it finishes its job. The job is still in the processing list, so it isn't lost.",
        run: function (c, st) {
          const w = st.workers[0];
          w.el.classList.add("is-down");
          w.say("crashed");
          c.mark(st.jobs["9a4f"], "no");
          return shake(c, w.el);
        } },
      { cmd: "LMOVE queue:jobs:processing queue:jobs:pending RIGHT LEFT", reply: '"9a4f"', note: "The job has been in the processing list for too long. Worker 2 moves it back to the pending list, where a worker can claim it again.",
        run: async function (c, st) {
          const w = st.workers[1], job = st.jobs["9a4f"];
          await st.send(c, w.l, w.at, "LMOVE", "write");
          c.mark(job, "write");
          await st.move(c, job, st.pending, 520);
        } },
    ],
    build: function (c) {
      /* The app, then the queue's two lists in Redis, then the workers. */
      const narrow = c.W < 430, aw = narrow ? 44 : 72, g1 = narrow ? 14 : 60, rw = narrow ? 66 : 96, g2 = narrow ? 14 : 60;
      const cw = Math.min(250, c.W - aw - g1 - g2 - rw), x = aw + g1, rx = x + cw + g2, g = stage(c, rx + rw);
      const st = { jobs: {}, send: g.send, card: g.store("Redis", null, x, 0, cw, null, 0, 116) };
      /* A list: its key name, then its elements side by side, with the newest on the left. */
      function lane(key) {
        const l = h("div", "dta-uc-lane");
        add(st.card.body, add(h("div", "dta-card-h dta-uc-lane-h"), h("span", "dta-uc-title", key)), l);
        return l;
      }
      st.pending = lane("queue:jobs:pending");
      st.processing = lane("queue:jobs:processing");
      st.app = g.actor("App", 0, Math.round(st.card.l[1]) - 22, aw, 44);
      g.wire(st.app.r, st.card.l);
      /* Each worker has a wire to the point `at` on the side of the card. */
      st.workers = [26, 84].map(function (y, i) {
        const w = g.actor("Worker " + (i + 1), rx, y, rw, 44);
        w.at = [x + cw, w.l[1]];
        g.wire(w.l, w.at);
        return w;
      });

      /* Put a job at the head of a list, and slide the jobs on screen to their new places. */
      st.move = function (c, job, list, ms) {
        const shown = Object.keys(st.jobs).map(function (k) { return st.jobs[k]; }).filter(function (e) { return e.isConnected; });
        return c.flip(shown, function () { list.insertBefore(job, list.firstChild); }, ms);
      };
      st.claim = async function (c, i, id) {
        const w = st.workers[i], job = st.jobs[id];
        await g.send(c, w.l, w.at, "BLMOVE", "write");
        c.mark(job, "write");
        await st.move(c, job, st.processing, 520);
        await g.send(c, w.at, w.l, id, "read");
        w.say("runs " + id);
      };
      return st;
    },
  };

  /* ---- streaming ---- */

  const PLACED = "1795430033234-0", PAID = "1795430033731-0";   // the IDs that Redis gave the two events
  /* A worker asks for one event that no worker in its group has had yet, which is what `>` means. */
  function readGroup(group, worker) { return "XREADGROUP GROUP " + group + " " + worker + " COUNT 1 STREAMS demo:events:orders >"; }
  /* The reply: the stream's name, then the event's ID and its fields. */
  function delivered(id, type) { return '1) 1) "demo:events:orders"\n   2) 1) 1) "' + id + '"\n         2) 1) "type"\n            2) "' + type + '"'; }
  D.scenes.streaming = {
    label: "event streaming with a Redis stream",
    h: 160,
    steps: [
      { cmd: "XADD demo:events:orders * type order.placed", reply: '"' + PLACED + '"', note: "A stream is a log of events. The shop adds an event with XADD. The * lets Redis choose the ID.",
        run: function (c, st) { return st.append(c, PLACED, "order.placed"); } },
      { cmd: "XADD demo:events:orders * type order.paid", reply: '"' + PAID + '"', note: "The next event goes at the end. A stream keeps its events in the order they were added.",
        run: function (c, st) { return st.append(c, PAID, "order.paid"); } },
      { cmd: "XGROUP CREATE demo:events:orders notifications 0", reply: "OK", note: "Workers in a consumer group split a stream's events. The 0 starts the group at the first event.",
        run: function (c, st) { return st.create(c, 0, "notifications"); } },
      { cmd: readGroup("notifications", "worker-a"), reply: delivered(PLACED, "order.placed"), note: "worker-a asks for one event. The > at the end means an event that its group hasn't had yet.",
        run: function (c, st) { return st.read(c, 0, "notifications"); } },
      { cmd: readGroup("notifications", "worker-b"), reply: delivered(PAID, "order.paid"), note: "worker-b gets the next event the same way. Each event goes to only one worker in a group.",
        run: function (c, st) { return st.read(c, 1, "notifications"); } },
      { cmd: "XACK demo:events:orders notifications " + PLACED, reply: "(integer) 1", note: "worker-a sends XACK when its event is done. If it crashes before that, worker-b can take over.",
        run: function (c, st) { return st.ack(c, 0); } },
      { cmd: "XGROUP CREATE demo:events:orders analytics 0", reply: "OK", note: "The analytics group does its own work with the same events. It also starts at the first event.",
        run: function (c, st) { return st.create(c, 2, "analytics"); } },
      { cmd: readGroup("analytics", "worker-c"), reply: delivered(PLACED, "order.placed"), note: "worker-c gets order.placed too, because analytics is another group. Every group gets every event.",
        run: function (c, st) { return st.read(c, 2, "analytics"); } },
    ],
    build: function (c) {
      /* The shop, then the stream in Redis, then the workers of the two consumer groups. The gaps between
         them get the room that the card doesn't need. */
      const W = Math.max(c.W, 300), narrow = W < 430, aw = narrow ? 36 : 72, rw = narrow ? 88 : 112, pad = narrow ? 4 : 5;   // 300 is the least it fits in
      const fw = rw + 2 * pad, gap = Math.max(narrow ? 8 : 20, Math.min(56, Math.floor((W - aw - fw - 300) / 2)));
      const cw = Math.min(300, W - aw - fw - 2 * gap), x = aw + gap, fx = x + cw + gap, rx = fx + pad, g = stage(c, fx + fw);
      const card = g.store("Redis stream", "demo:events:orders", x, 12, cw, "auto 1fr", 2, 36);   // room for two events and a line for each group
      if (cw < 280) card.el.classList.add("is-tight");   // too narrow for a whole event, so it shows the end of its ID and no field name
      const shop = g.actor("Shop", 0, Math.round(card.l[1]) - 22, aw, 44), st = { events: [] };
      g.wire(shop.r, card.l);
      /* The workers of each group stand in a frame under the group's name. The frame is only an outline
         until the group is created. Each worker has a wire to the point `at` on the side of the card. */
      st.groups = { notifications: { frame: g.group("notifications", fx, 0, fw, 96) }, analytics: { frame: g.group("analytics", fx, 101, fw, 58) } };
      for (const k in st.groups) st.groups[k].frame.classList.add("is-off");
      st.workers = [["worker-a", 20], ["worker-b", 58], ["worker-c", 121]].map(function (p) {
        const w = g.actor(p[0], rx, p[1], rw, 34);
        w.at = [x + cw, w.l[1]];
        g.wire(w.l, w.at);
        return w;
      });

      /* The shop adds an event at the end of the stream. */
      st.append = async function (c, id, type) {
        await g.send(c, shop.r, card.l, "XADD", "write");
        const e = row(add(h("span", "dta-uc-id"), h("span", "dta-uc-id-start", id.slice(0, 10)), h("span", "", id.slice(10))),
          add(h("span", "dta-v"), h("span", "dta-f dta-uc-field", "type "), h("span", "", type)));
        st.events.push({ el: card.body.appendChild(e), type: type });
        return c.enter(c.mark(e, "write"), "translateY(10px)");
      };
      /* Put a group's line before event `k`, and slide what the card already shows to its new place. */
      function put(c, line, k) {
        const shown = [].slice.call(card.body.children);
        return c.flip(shown, function () { card.body.insertBefore(line, st.events[k] ? st.events[k].el : null); }, 440);
      }
      /* Redis keeps a place in the stream for each group: the next event it will give to one of the
         group's workers. `had` counts the events the group has had so far. */
      st.create = async function (c, i, group) {
        const w = st.workers[i], grp = st.groups[group];
        grp.line = add(h("div", "dta-uc-next"), h("span", "", "↓ next for "), h("b", "", group));
        grp.had = 0;
        await g.send(c, w.l, w.at, "XGROUP CREATE", "write");
        grp.frame.classList.remove("is-off");
        c.mark(grp.frame, "write");
        c.mark(grp.line, "write");
        await Promise.all([put(c, grp.line, 0), c.enter(grp.line, "translateY(-6px)")]);
      };
      /* A worker asks for one event and gets its group's next one. The event stays in the stream. */
      st.read = async function (c, i, group) {
        const w = st.workers[i], grp = st.groups[group], e = st.events[grp.had++];
        await g.send(c, w.l, w.at, "XREADGROUP", "read");
        c.mark(e.el, "read");
        c.mark(grp.line, "read");
        await put(c, grp.line, grp.had);
        await g.send(c, w.at, w.l, e.type, "read");
        w.say(w.has = e.type);
      };
      /* A worker tells Redis that it has handled its event. Redis keeps the list of events that each
         worker has yet to acknowledge, and the drawing shows that as the line under the worker's name. */
      st.ack = async function (c, i) {
        const w = st.workers[i];
        await g.send(c, w.l, w.at, "XACK", "write");
        w.say(w.has + " ✓");
        w.line.classList.add("is-ok");
        return c.enter(w.line, "scale(.8)");
      };
      return st;
    },
  };

  /* ---- pub/sub ---- */

  /* What Redis answers when a client subscribes: the kind of subscription, its channel or pattern, and
     how many subscriptions that client now has. */
  function subscribed(kind, to) { return '1) "' + kind + '"\n2) "' + to + '"\n3) (integer) 1'; }
  D.scenes["pub-sub"] = {
    label: "pub/sub messaging with Redis",
    h: 165,
    steps: [
      { who: "dashboard", cmd: "SUBSCRIBE orders:new", reply: subscribed("subscribe", "orders:new"), note: "The dashboard subscribes to the channel orders:new. It's a name to send messages to, not a key.",
        run: function (c, st) { return st.subscribe(c, 0); } },
      { who: "notifier", cmd: "SUBSCRIBE orders:new", reply: subscribed("subscribe", "orders:new"), note: "Now orders:new has two subscribers. The 1 in the reply counts the notifier's own subscriptions.",
        run: function (c, st) { return st.subscribe(c, 1); } },
      { who: "live-feed", cmd: "PSUBSCRIBE orders:*", reply: subscribed("psubscribe", "orders:*"), note: "The pattern orders:* is not a channel. It matches every channel whose name starts with orders:.",
        run: function (c, st) { return st.subscribe(c, 2); } },
      { who: "shop", cmd: 'PUBLISH orders:new "order 42"', reply: "(integer) 3", note: "The shop publishes a message to orders:new. All three subscribers get it, and Redis replies 3.",
        run: function (c, st) { return st.publish(c, "orders:new", "order 42"); } },
      { who: "shop", cmd: 'PUBLISH orders:shipped "order 17"', reply: "(integer) 1", note: "Only the live feed's pattern matches orders:shipped. Every message carries its channel's name.",
        run: function (c, st) { return st.publish(c, "orders:shipped", "order 17"); } },
      { event: "The dashboard goes offline", note: "The dashboard goes offline, and its subscription ends with its connection.",
        run: function (c, st) { return st.drop(c, 0); } },
      { who: "shop", cmd: 'PUBLISH orders:new "order 43"', reply: "(integer) 2", note: "The notifier and the live feed get order 43. Redis keeps no copy, so the dashboard misses it.",
        run: function (c, st) { return st.publish(c, "orders:new", "order 43"); } },
      { who: "dashboard", cmd: "SUBSCRIBE orders:new", reply: subscribed("subscribe", "orders:new"), note: "The dashboard is back and subscribes again. It will get later messages, but never order 43.",
        run: function (c, st) { return st.subscribe(c, 0); } },
    ],
    build: function (c) {
      /* The shop, then Redis, then the services that subscribe. Redis holds no messages, only who has
         subscribed to what. */
      const W = Math.max(c.W, 288), narrow = W < 430, aw = narrow ? 44 : 72, cw = narrow ? 104 : 160, rw = narrow ? 100 : 112;   // 288 is the least it fits in
      const gap = Math.max(20, Math.min(narrow ? 40 : 84, Math.floor((W - aw - cw - rw) / 2)));
      const x = aw + gap, rx = x + cw + gap, g = stage(c, rx + rw), P = 40, top = 44;   // each subscriber gets P pixels of height, from where the card's body starts
      const card = g.store("Redis", "subscriptions", x, 0, cw, null, 0, 3 * P);
      const shop = g.actor("Shop", 0, Math.round(card.l[1]) - 22, aw, 44), st = { held: {} };
      card.body.classList.add("dta-uc-subs");
      g.label("Publisher", 0, 0);
      g.label("Subscribers", rx, 0);
      g.wire(shop.r, card.l);
      /* Each subscriber has a wire to the point `at` on the side of the card. Subscribers of the same
         channel stand next to each other. */
      st.subs = [["Dashboard", "orders:new"], ["Notifier", "orders:new"], ["Live feed", "orders:*"]].map(function (d, i) {
        const y = top + P * i + P / 2, a = g.actor(d[0], rx, y - 17, rw, 34), at = [x + cw, y];
        return { a: a, to: d[1], row: i, at: at, wire: g.wire(a.l, at) };
      });
      /* A subscription to a pattern matches every channel whose name starts with the text before the *. */
      function matches(sub, channel) { return sub.to === channel || (sub.to.slice(-1) === "*" && channel.indexOf(sub.to.slice(0, -1)) === 0); }

      /* Redis keeps each channel or pattern for as long as it has subscribers. The drawing shows it as a
         box on the side of the card, which reaches from the wire of its first subscriber to the wire of
         its last. Call this after a subscriber of `to` has come or gone. It marks the box when `kind`
         is given. */
      function hold(c, to, kind) {
        const rows = st.subs.filter(function (s) { return s.on && s.to === to; }).map(function (s) { return s.row; });
        let box = st.held[to];
        if (!rows.length) {
          delete st.held[to];
          return c.leave(box);
        }
        const now = { top: P * rows[0] + 6 + "px", height: P * (rows[rows.length - 1] - rows[0] + 1) - 12 + "px" }, was = box && { top: box.style.top, height: box.style.height };
        if (!box) {
          box = st.held[to] = card.body.appendChild(cell(to, "dta-uc-sub"));
          box.setAttribute("data-kind", to.slice(-1) === "*" ? "pattern" : "channel");
        }
        box.style.top = now.top;
        box.style.height = now.height;
        if (kind) c.mark(box, kind);
        return was ? c.anim(box, [was, now], 400) : c.enter(box, "translateX(8px)");
      }
      /* A service subscribes to a channel, or to a pattern. One that was offline has connected again
         to do it. */
      st.subscribe = async function (c, i) {
        const sub = st.subs[i];
        if (sub.off) sub.a.say("");
        sub.off = false;
        sub.a.el.classList.remove("is-down");
        sub.wire.classList.remove("is-off");
        await g.send(c, sub.a.l, sub.at, sub.to.slice(-1) === "*" ? "PSUBSCRIBE" : "SUBSCRIBE", "write");
        sub.on = true;
        sub.a.say("no messages yet");   // the line under its name is the last message it has received
        return hold(c, sub.to, "write");
      };
      /* The shop publishes a message to a channel. Redis sends a copy to every service whose subscription
         matches the channel, and answers the shop with how many that was. It keeps nothing, so a service
         that is offline misses the message. */
      st.publish = async function (c, channel, text) {
        const to = st.subs.filter(function (sub) { return sub.on && matches(sub, channel); });
        await g.send(c, shop.r, card.l, "PUBLISH", "write");
        to.forEach(function (sub) { c.mark(st.held[sub.to], "read"); });
        await Promise.all(to.map(function (sub) { return g.send(c, sub.at, sub.a.l, text, "read"); }));
        to.forEach(function (sub) {
          c.mark(sub.a.el, "read");
          sub.a.say(text);
        });
        st.subs.forEach(function (sub) {
          if (!sub.off || !matches(sub, channel)) return;
          sub.a.say("missed " + text);
          shake(c, sub.a.el);
        });
        await g.send(c, card.l, shop.r, String(to.length), "read");
      };
      /* A service's connection closes, and its subscription goes with it. */
      st.drop = function (c, i) {
        const sub = st.subs[i];
        sub.on = false;
        sub.off = true;
        sub.a.el.classList.add("is-down");
        sub.a.say("offline");
        sub.wire.classList.add("is-off");
        return hold(c, sub.to);
      };
      return st;
    },
  };

  /* ---- start ---- */

  function start() { document.querySelectorAll(".dta[data-dta]").forEach(D.mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

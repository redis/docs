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

  /* A scene's drawing: a box `w` pixels wide in which everything is placed in pixels. */
  function stage(c, w) {
    const el = h("div", "dta-uc"), svg = s("svg", { class: "dta-svg dta-uc-wires", width: w, height: c.H });
    const g = {};
    el.style.width = w + "px";
    el.style.height = c.H + "px";
    c.canvas.appendChild(add(el, svg));

    function place(e, x, y, w2, h2) {
      e.style.left = x + "px";
      e.style.top = y + "px";
      if (w2 != null) e.style.width = w2 + "px";
      if (h2 != null) e.style.height = h2 + "px";
      return el.appendChild(e);
    }
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

  /* ---- start ---- */

  function start() { document.querySelectorAll(".dta[data-dta]").forEach(D.mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

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
   ========================================================================= */
(function () {
  "use strict";
  const D = window.DataTypeAnimation;
  if (!D || D.useCases) return;   // the player didn't load, or this file already ran
  D.useCases = true;
  const h = D.kit.h, s = D.kit.s, add = D.kit.add, row = D.kit.row;
  const CROSS = 320;   // ms a message takes to cross a wire

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
      e.style.width = w2 + "px";
      if (h2 != null) e.style.height = h2 + "px";
      return el.appendChild(e);
    }
    /* Whoever sends the commands, such as the application. `l` and `r` are the middles of its left and
       right sides, where a wire attaches. */
    g.actor = function (name, x, y, w2, h2) {
      return { el: place(h("div", "dta-uc-app", name), x, y, w2, h2), l: [x, y + h2 / 2], r: [x + w2, y + h2 / 2] };
    };
    /* Something that holds data: a card titled with a key name, under a label that says where the key
       lives. `cols` are the grid columns of its rows, and `rows` is how many rows to keep room for. */
    g.store = function (label, title, x, y, w2, cols, rows) {
      const body = h("div", "dta-rows"), card = add(h("div", "dta-card"), add(h("div", "dta-card-h"), h("span", "dta-uc-title", title)), body);
      body.style.setProperty("--dta-cols", cols);
      body.style.minHeight = rows * 27 + "px";
      const mid = y + 18 + (25 + rows * 27 + 2) / 2;   // the label, then the card: its title bar, rows, and border
      return { el: place(add(h("div", "dta-uc-store"), h("div", "dta-uc-label", label), card), x, y, w2), body: body, l: [x, mid], r: [x + w2, mid] };
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

  /* ---- start ---- */

  function start() { document.querySelectorAll(".dta[data-dta]").forEach(D.mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start); else start();
})();

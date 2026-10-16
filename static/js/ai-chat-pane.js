/* =========================================================================
   Redis Copilot, beside the page
   -------------------------------------------------------------------------
   "Ask AI to explain this page" (layouts/partials/meta-links.html) used to
   navigate to redis.io/chat. With this script, a plain click asks the same
   question in a pane docked to the right of the page, so the reader keeps the
   page in view and can follow up without leaving it. The link keeps its
   /chat?q= href, so a new-tab click still opens the full chat page.

   The pane is a client of the chat app's own endpoints, the ones its page
   script (redis.io/chat/static/js/bubble.js) calls:

     POST /chat/ask         form q, tags  -> the answer, HTML-escaped Markdown,
                                             streamed while it is generated
     GET  /chat/references  query q, tags -> [{category, title, url}]
     POST /chat/reset                     -> forget the conversation
     POST /docusight/api/rate/copilot/    -> a thumbs up (5) or down (1) on an
                                             answer; a downvote carries a
                                             Turnstile token and a comment

   q is URI-encoded once more before the form encoding, because that is what
   the chat page sends. The conversation lives server side, against the chat
   app's session cookie, which is what lets a follow-up say "it".

   The pane keeps its own copy of the transcript in sessionStorage, so it can
   follow the reader to the next page. A pane that starts empty resets the
   server side first, so the bot never answers from context the reader can't
   see.

   /chat only exists on redis.io, and it sends no CORS headers. Staging builds
   are on redis.io too, so the pane works there as is. A local build needs a
   proxy in front of hugo server that forwards /chat to redis.io.
   ========================================================================= */
(function () {
  'use strict';

  if (window.AIChatPane) return;
  window.AIChatPane = {};

  var ASK = '/chat/ask';
  var REFS = '/chat/references';
  var RESET = '/chat/reset';
  var FULL = '/chat/';
  var KEY = 'aiChatPane.v1';
  var DEFAULT_WIDTH = 440;
  var KEEP = 40;          // messages kept in the stored transcript
  var MAX_SOURCES = 4;
  var TIMEOUT = 90000;    // end to end, for one answer
  var NOTICE = 'Redis Copilot is powered by OpenAI API and is for general info only; ' +
    'avoid inputting confidential or personal data.';

  /* Ratings go where the chat page sends its own, but only from redis.io: like
     the chat page, a local build sends nothing, and logs what it would have
     sent. The site key is the chat page's, which the endpoint checks downvote
     tokens against. It only works on redis.io, so elsewhere the downvote form
     uses Cloudflare's always-pass test key. */
  var RATE = '/docusight/api/rate/copilot/';
  var LIVE = location.hostname === 'redis.io';
  var SITEKEY = LIVE ? '0x4AAAAAAB0a8ZJzBy7OAdPg' : '1x00000000000000000000AA';
  var TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  /* Links in answers point at production. Off redis.io they are pointed at this
     build instead, and links to docs pages open in this tab, so the reader
     takes the pane along. */
  var DOCS = 'https://redis.io/docs/latest/';
  var BASE = basePath();

  var THUMB = '<path d="M3 10h4v11H3z"/>' +
    '<path d="M7 10l4-7a2 2 0 0 1 3.6 1.6L13.6 9H19a2 2 0 0 1 2 2.4l-1.4 7.2a3 3 0 0 1-2.9 2.4H7"/>';
  var ICONS = {
    sparkles: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" aria-hidden="true">' +
      '<path d="M4 8L4.5 6L6 5.5L4.5 5L4 3L3.5 5L2 5.5L3.5 6L4 8Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M12 15L13 11L15 10L13 9L12 5L11 9L9 10L11 11L12 15Z" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    external: svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>'),
    compose: svg('<path d="M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6"/><path d="M18.4 3.6a2 2 0 0 1 2.9 2.9L12 15.8l-3.6.8.8-3.6Z"/>'),
    collapse: svg('<path d="M13 17l5-5-5-5"/><path d="M6 17l5-5-5-5"/>'),
    send: svg('<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>'),
    stop: '<svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><rect x="1" y="1" width="10" height="10" rx="2" fill="currentColor"/></svg>',
    up: svg(THUMB),
    down: svg('<g transform="rotate(180 12 12)">' + THUMB + '</g>')
  };

  var html = document.documentElement;
  var layout = window.aiChatPaneLayout || function () { return DEFAULT_WIDTH; };
  var state = load();
  var ui = null;        // built on first use
  var busy = null;      // { ctrl, bot } while an answer streams
  var opener = null;    // where focus goes back to on collapse
  var owners = new WeakMap();   // answer node -> its message

  /* ------------------------------------------------------------- state -- */

  function load() {
    var s = null;
    try { s = JSON.parse(sessionStorage.getItem(KEY)); } catch (e) {}
    if (!s || typeof s !== 'object') s = {};
    var messages = (Array.isArray(s.messages) ? s.messages : []).filter(function (m) {
      return m && typeof m.text === 'string' && (m.role === 'user' || m.role === 'assistant');
    });
    /* An answer still streaming when the reader left the page stopped there. */
    messages.forEach(function (m) { if (m.status === 'streaming') m.status = 'interrupted'; });
    return { open: !!s.open, width: Number(s.width) || DEFAULT_WIDTH, messages: messages };
  }

  function save() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({
        open: state.open, width: state.width, messages: state.messages.slice(-KEEP)
      }));
    } catch (e) {}
  }

  /* ---------------------------------------------------------------- UI -- */

  function build() {
    var pane = el('aside', 'aicp');
    pane.id = 'ai-chat-pane';
    pane.hidden = true;
    pane.setAttribute('aria-label', 'Redis Copilot');
    pane.innerHTML =
      '<div class="aicp-resize" title="Drag to resize. Double-click to reset."></div>' +
      '<div class="aicp-head">' +
        '<h2 class="aicp-title">' + ICONS.sparkles + 'Redis Copilot</h2>' +
        '<a class="aicp-btn" href="' + FULL + '" target="_blank" rel="noopener" title="Continue in the full chat page">' +
          ICONS.external + '<span class="aicp-sr">Continue in the full chat page</span></a>' +
        '<button type="button" class="aicp-btn" data-act="reset" title="New chat">' +
          ICONS.compose + '<span class="aicp-sr">New chat</span></button>' +
        '<button type="button" class="aicp-btn" data-act="collapse" title="Collapse (Esc)">' +
          ICONS.collapse + '<span class="aicp-sr">Collapse</span></button>' +
      '</div>' +
      '<div class="aicp-log" aria-live="polite"></div>' +
      '<form class="aicp-form">' +
        '<div class="aicp-field">' +
          '<textarea class="aicp-input" rows="1" placeholder="Ask a follow-up question" aria-label="Message Redis Copilot"></textarea>' +
          '<button type="submit" class="aicp-send" disabled></button>' +
        '</div>' +
        '<p class="aicp-foot">Verify any information from Redis Copilot before using it.</p>' +
      '</form>';

    var tab = el('button', 'aicp-tab');
    tab.type = 'button';
    tab.hidden = true;
    tab.title = 'Open Redis Copilot';
    tab.setAttribute('aria-controls', pane.id);
    tab.setAttribute('aria-expanded', 'false');
    tab.innerHTML = ICONS.sparkles + '<span>Redis Copilot</span>';

    document.body.appendChild(pane);
    document.body.appendChild(tab);
    ui = {
      pane: pane,
      tab: tab,
      log: pane.querySelector('.aicp-log'),
      form: pane.querySelector('.aicp-form'),
      input: pane.querySelector('.aicp-input'),
      send: pane.querySelector('.aicp-send'),
      handle: pane.querySelector('.aicp-resize')
    };
    wire();
    renderAll();
    sync();
    updateTab();
  }

  function wire() {
    ui.form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (busy) { stop(); return; }
      var q = ui.input.value.trim();
      if (!q) return;
      ui.input.value = '';
      grow();
      ask(q);
    });

    ui.input.addEventListener('input', function () { grow(); sync(); });
    ui.input.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
      e.preventDefault();
      /* Enter sends; it never stops an answer that is still arriving. */
      if (busy) return;
      if (ui.form.requestSubmit) ui.form.requestSubmit();
      else ui.form.dispatchEvent(new Event('submit', { cancelable: true }));
    });

    /* The search modal opens on "/" and Cmd+K from a document-level listener,
       wherever they are typed. Keep the pane's keystrokes to the pane. */
    ['keydown', 'keyup', 'keypress'].forEach(function (type) {
      ui.pane.addEventListener(type, function (e) {
        if (type === 'keydown' && e.key === 'Escape') {
          e.preventDefault();
          /* In a downvote's comment box, Escape backs out of the form only. */
          var form = e.target.closest('.aicp-rate-form');
          if (form) form.querySelector('[data-act="cancel-rating"]').click();
          else collapse();
        }
        e.stopPropagation();
      });
    });

    ui.pane.addEventListener('click', function (e) {
      var t = e.target.closest('[data-act]');
      if (!t) return;
      var act = t.getAttribute('data-act');
      if (act === 'collapse') collapse();
      else if (act === 'reset') reset();
      else if (act === 'copy') copy(t);
      else if (act === 'explain') explain(pageLink());
      else if (act === 'up' || act === 'down') vote(t.closest('.aicp-bot'), act);
    });

    ui.tab.addEventListener('click', function () {
      opener = ui.tab;
      open({ focus: true });
      pinLast(true);
    });

    wireResize();
  }

  function wireResize() {
    var frame = 0, x = 0;
    ui.handle.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      e.preventDefault();
      ui.handle.setPointerCapture(e.pointerId);
      html.classList.add('ai-pane-resizing');

      function move(ev) {
        x = ev.clientX;
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = 0;
          state.width = layout({ open: true, width: ui.pane.getBoundingClientRect().right - x });
        });
      }
      function done() {
        ui.handle.removeEventListener('pointermove', move);
        ui.handle.removeEventListener('pointerup', done);
        ui.handle.removeEventListener('pointercancel', done);
        html.classList.remove('ai-pane-resizing');
        save();
      }
      ui.handle.addEventListener('pointermove', move);
      ui.handle.addEventListener('pointerup', done);
      ui.handle.addEventListener('pointercancel', done);
    });
    ui.handle.addEventListener('dblclick', function () {
      state.width = DEFAULT_WIDTH;
      layout(state);
      save();
    });
  }

  function open(opts) {
    opts = opts || {};
    if (!ui) build();
    state.open = true;
    save();
    layout(state);
    ui.pane.hidden = false;
    if (!ui.pane.classList.contains('is-in')) {
      /* Shown from display: none, the pane has no style to transition from.
         Reading layout first gives it one, so it slides in. */
      if (!opts.instant) ui.pane.getBoundingClientRect();
      ui.pane.classList.add('is-in');
    }
    updateTab();
    if (opts.focus) ui.input.focus({ preventScroll: true });
  }

  function collapse() {
    if (!ui || !state.open) return;
    var hadFocus = ui.pane.contains(document.activeElement);
    state.open = false;
    save();
    layout(state);
    ui.pane.classList.remove('is-in');
    setTimeout(function () { if (!state.open) ui.pane.hidden = true; }, reducedMotion() ? 0 : 220);
    updateTab();
    if (hadFocus) {
      /* Back to whatever opened the pane, else the tab that reopens it, but
         only to one that's on screen. Below 1280px the link's rail is hidden,
         and focusing a hidden element leaves focus nowhere. */
      var back = [opener, ui.tab].filter(function (t) {
        return t && document.contains(t) && t.getClientRects().length > 0;
      })[0];
      if (back) back.focus({ preventScroll: true });
    }
  }

  function updateTab() {
    if (!ui) return;
    ui.tab.hidden = state.open || !state.messages.length;
    ui.tab.setAttribute('aria-expanded', String(state.open));
  }

  /* Send turns into Stop while an answer streams. */
  function sync() {
    if (!ui) return;
    var streaming = !!busy;
    var label = streaming ? 'Stop' : 'Send';
    ui.send.disabled = !streaming && !ui.input.value.trim();
    ui.send.title = label;
    ui.send.innerHTML = (streaming ? ICONS.stop : ICONS.send) + '<span class="aicp-sr">' + label + '</span>';
    ui.log.setAttribute('aria-busy', String(streaming));
  }

  function grow() {
    ui.input.style.height = 'auto';
    ui.input.style.height = Math.min(ui.input.scrollHeight, 160) + 'px';
  }

  /* ------------------------------------------------------------ render -- */

  function renderAll() {
    ui.log.innerHTML = '';
    ui.log.appendChild(el('p', 'aicp-notice', NOTICE));
    if (!state.messages.length) {
      ui.log.appendChild(emptyState());
      return;
    }
    var turn = null;
    state.messages.forEach(function (m) {
      if (m.role === 'user' || !turn) turn = ui.log.appendChild(el('div', 'aicp-turn'));
      turn.appendChild(m.role === 'user' ? el('div', 'aicp-user', m.label || m.text) : botNode(m));
    });
  }

  function emptyState() {
    var box = el('div', 'aicp-empty');
    box.appendChild(el('p', null, 'Ask anything about Redis.'));
    if (pageLink()) {
      var chip = el('button', 'aicp-chip');
      chip.type = 'button';
      chip.setAttribute('data-act', 'explain');
      chip.innerHTML = ICONS.sparkles + 'Explain this page';
      box.appendChild(chip);
    }
    return box;
  }

  function botNode(m) {
    var node = el('div', 'aicp-bot');
    node.appendChild(el('div', 'aicp-answer'));
    owners.set(node, m);
    paint(node, m);
    return node;
  }

  /* Runs on every streamed chunk. The rating row sits outside what it
     rewrites, so a downvote comment being typed survives a late repaint:
     sources can arrive after the answer has finished. */
  function paint(node, m) {
    var body = m.text ? md(m.text)
      : m.status === 'streaming' ? '<span class="aicp-dots" role="img" aria-label="Thinking"><i></i><i></i><i></i></span>'
      : '';
    node.firstChild.innerHTML = '<div class="aicp-md">' + body + '</div>' + statusLine(m) + sources(m);
    if (m.status === 'done' && !node.querySelector('.aicp-rate')) node.appendChild(rateRow(m));
  }

  function statusLine(m) {
    if (m.status === 'stopped') return '<p class="aicp-status">Stopped.</p>';
    if (m.status === 'interrupted') return '<p class="aicp-status">This answer stopped when you left the page.</p>';
    if (m.status !== 'error') return '';
    var retry = FULL + '?' + new URLSearchParams({ q: m.q || '' });
    return '<p class="aicp-status is-error">' + esc(m.error || "Couldn't get an answer.") +
      ' <a href="' + esc(retry) + '" target="_blank" rel="noopener">Ask in the full chat page</a>.</p>';
  }

  function sources(m) {
    if (m.status !== 'done' || !m.refs || !m.refs.length) return '';
    var links = m.refs.map(function (r) {
      var href = safeHref(r.url);
      return href ? anchor(href, esc(r.title), 'aicp-source', r.title) : '';
    }).join('');
    return links ? '<div class="aicp-sources"><span class="aicp-sources-label">Sources</span>' + links + '</div>' : '';
  }

  /* Puts a turn's question at the top of the pane, so its answer reads from
     the start while it arrives. The last turn is at least the pane's height
     (see .aicp-turn:last-child), so there is always room to scroll that far. */
  function pin(turn, instant) {
    /* The first question stays below the notice about what the bot is. */
    var first = ui.log.querySelector('.aicp-turn') === turn;
    var top = first ? 0 : Math.max(0, turn.offsetTop - 16);
    if (instant || reducedMotion()) ui.log.scrollTop = top;
    else ui.log.scrollTo({ top: top, behavior: 'smooth' });
  }

  function pinLast(instant) {
    var turns = ui.log.querySelectorAll('.aicp-turn');
    if (turns.length) pin(turns[turns.length - 1], instant);
  }

  /* -------------------------------------------------------------- rate --
     The chat page's thumbs, under each finished answer. Up is sent at once.
     Down first opens a box for an optional comment and a Turnstile check,
     because the endpoint wants a token with a downvote. */

  function rateRow(m) {
    var row = el('div', 'aicp-rate');
    if (m.rating) {
      row.innerHTML = voteButton(m.rating, true) + '<span class="aicp-rate-note" tabindex="-1">' +
        (LIVE ? 'Thanks for your feedback.' : 'Thanks. This is a local build, so nothing was sent.') + '</span>';
    } else {
      row.innerHTML = '<span class="aicp-rate-label">How was this answer?</span>' + voteButton('up') + voteButton('down') +
        (m.rateFailed ? '<span class="aicp-rate-note is-error" tabindex="-1">Couldn\'t send your feedback. Try again.</span>' : '');
    }
    return row;
  }

  function voteButton(kind, chosen) {
    var label = kind === 'up' ? 'Good answer' : 'Bad answer';
    return '<button type="button" class="aicp-vote"' +
      (chosen ? ' aria-pressed="true" disabled' : ' data-act="' + kind + '" aria-pressed="false"') +
      ' title="' + label + '" aria-label="' + label + '">' + ICONS[kind] + '</button>';
  }

  function vote(node, kind) {
    var m = node && owners.get(node);
    if (!m || m.rating) return;
    if (kind === 'up') rate(node, m, 'up', '', '');
    else downvoteForm(node, m);
  }

  function downvoteForm(node, m) {
    var row = node.querySelector('.aicp-rate');
    if (row.querySelector('.aicp-rate-form')) return;
    var up = row.querySelector('[data-act="up"]');
    var down = row.querySelector('[data-act="down"]');
    var form = el('div', 'aicp-rate-form');
    form.innerHTML =
      '<label class="aicp-rate-ask"><span>What was wrong with it? <i>Optional</i></span>' +
        '<textarea rows="3" maxlength="500"></textarea></label>' +
      '<div class="aicp-check"></div>' +
      '<div class="aicp-rate-actions">' +
        '<button type="button" class="aicp-rate-send" disabled>Send feedback</button>' +
        '<button type="button" class="aicp-rate-cancel" data-act="cancel-rating">Cancel</button>' +
      '</div>';
    row.appendChild(form);
    down.setAttribute('aria-pressed', 'true');
    up.disabled = true;

    var comment = form.querySelector('textarea');
    var send = form.querySelector('.aicp-rate-send');
    var check = form.querySelector('.aicp-check');
    var token = '', widget = null;

    function close() {
      if (widget !== null && window.turnstile) {
        try { window.turnstile.remove(widget); } catch (e) {}
      }
      form.remove();
    }
    send.addEventListener('click', function () {
      if (!token) return;
      var text = comment.value.trim();
      close();
      rate(node, m, 'down', text, token);
    });
    form.querySelector('.aicp-rate-cancel').addEventListener('click', function () {
      close();
      up.disabled = false;
      down.setAttribute('aria-pressed', 'false');
      down.focus({ preventScroll: true });
    });

    comment.focus({ preventScroll: true });
    turnstile().then(function (ts) {
      if (!form.isConnected) return;
      widget = ts.render(check, {
        sitekey: SITEKEY,
        theme: 'light',
        callback: function (t) { token = t; send.disabled = false; },
        'expired-callback': function () { token = ''; send.disabled = true; },
        'error-callback': function () {
          token = '';
          send.disabled = true;
          check.textContent = "Couldn't check that you're not a bot. Try again later.";
        }
      });
    }, function () {
      check.textContent = "Couldn't load the check that you're not a bot.";
    });
  }

  /* Thanks straight away, as the chat page does. If the send fails, the
     buttons come back with a note, so the vote isn't silently lost. */
  function rate(node, m, kind, comment, token) {
    m.rating = kind;
    delete m.rateFailed;
    save();
    redrawRating(node, m);
    sendRating(m, kind, comment, token).catch(function (err) {
      console.error('[ai-chat-pane] Feedback not sent:', err);
      delete m.rating;
      m.rateFailed = true;
      save();
      if (node.isConnected) redrawRating(node, m);
    });
  }

  function redrawRating(node, m) {
    var old = node.querySelector('.aicp-rate'), row = rateRow(m);
    var focusLost = !document.activeElement || document.activeElement === document.body ||
      (old && old.contains(document.activeElement));
    if (old) old.replaceWith(row); else node.appendChild(row);
    var note = row.querySelector('.aicp-rate-note');
    if (note && focusLost) note.focus({ preventScroll: true });
  }

  /* The fields the chat page sends. origin is the page the rating was given
     on, as for the docs' own page ratings (feedback.html); the chat page sends
     its own URL there. */
  function sendRating(m, kind, comment, token) {
    var data = {
      origin: location.origin + location.pathname,
      question: m.q || '',
      answer: decode(m.text),
      comment: comment,
      rating: kind === 'up' ? 5 : 1,
      'cf-turnstile-response': token
    };
    if (!LIVE) {
      console.info('[ai-chat-pane] Feedback not sent from a local build:', data);
      return Promise.resolve();
    }
    return fetch(RATE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: new URLSearchParams(data)
    }).then(function (r) { if (!r.ok) throw httpError(r.status); });
  }

  var turnstileLoading = null;

  /* Docs pages already load Turnstile for the page rating form, and loading it
     twice makes it complain, so wait for that copy when there is one. */
  function turnstile() {
    if (window.turnstile) return Promise.resolve(window.turnstile);
    if (!turnstileLoading) {
      if (!document.querySelector('script[src*="challenges.cloudflare.com/turnstile/"]')) {
        var script = document.createElement('script');
        script.src = TURNSTILE;
        script.async = true;
        document.head.appendChild(script);
      }
      turnstileLoading = new Promise(function (resolve, reject) {
        var tries = 0;
        (function wait() {
          if (window.turnstile) resolve(window.turnstile);
          else if (++tries > 150) { turnstileLoading = null; reject(new Error('Turnstile did not load')); }
          else setTimeout(wait, 100);
        })();
      });
    }
    return turnstileLoading;
  }

  /* --------------------------------------------------------------- ask -- */

  function pageLink() {
    return document.querySelector('a[data-ai-chat-open]');
  }

  function promptOf(link) {
    try { return new URL(link.href, location.href).searchParams.get('q'); } catch (e) { return null; }
  }

  function explain(link) {
    var q = link && promptOf(link);
    if (!q) return;
    var title = link.getAttribute('data-ai-chat-title');
    ask(q, title ? 'Explain this page: ' + title : 'Explain this page');
  }

  function ask(q, label) {
    if (busy || !q) return;
    if (!ui) build();
    var fresh = !state.messages.length;
    var user = { role: 'user', text: q };
    if (label) user.label = label;
    var bot = { role: 'assistant', q: q, text: '', status: 'streaming', refs: [] };
    state.messages.push(user, bot);
    save();

    if (fresh) renderAll();
    else {
      var t = el('div', 'aicp-turn');
      t.appendChild(el('div', 'aicp-user', label || q));
      t.appendChild(botNode(bot));
      ui.log.appendChild(t);
    }
    var turn = ui.log.lastElementChild;
    var node = turn.lastElementChild;
    pin(turn, fresh);
    updateTab();

    var ctrl = new AbortController();
    busy = { ctrl: ctrl, bot: bot };
    sync();
    var timedOut = false;
    var timer = setTimeout(function () { timedOut = true; ctrl.abort(); }, TIMEOUT);
    var frame = 0;
    function repaint() {
      if (frame) return;
      frame = requestAnimationFrame(function () { frame = 0; paint(node, bot); });
    }

    (fresh ? post(RESET).catch(function () {}) : Promise.resolve())
      .then(function () {
        references(q, ctrl.signal).then(function (refs) {
          bot.refs = refs;
          if (bot.status === 'done') { paint(node, bot); save(); }
        });
        return fetch(ASK, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'X-Requested-With': 'XMLHttpRequest' },
          body: new URLSearchParams({ q: encodeURIComponent(q), tags: '' }),
          signal: ctrl.signal
        });
      })
      .then(function (res) {
        if (!res.ok) throw httpError(res.status);
        /* A Cloudflare challenge is an HTML page where the answer should be. */
        if (/text\/html/i.test(res.headers.get('content-type') || '')) throw httpError(403);
        if (!res.body || !res.body.getReader) return res.text().then(function (t) { bot.text = t; });
        var reader = res.body.getReader();
        var decoder = new TextDecoder();
        return (function pump() {
          return reader.read().then(function (r) {
            if (r.done) { bot.text += decoder.decode(); return; }
            bot.text += decoder.decode(r.value, { stream: true });
            repaint();
            return pump();
          });
        })();
      })
      .then(function () {
        if (bot.text.trim()) bot.status = 'done';
        else { bot.status = 'error'; bot.error = 'Redis Copilot sent an empty answer.'; }
      }, function (err) {
        if (ctrl.signal.aborted && !timedOut) { bot.status = 'stopped'; return; }
        bot.status = 'error';
        bot.error = timedOut ? 'Redis Copilot took too long to answer.' : describe(err);
      })
      .then(function () {
        clearTimeout(timer);
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        if (busy && busy.bot === bot) busy = null;
        paint(node, bot);
        save();
        sync();
      });
  }

  function stop() {
    if (busy) busy.ctrl.abort();
  }

  function reset() {
    stop();
    busy = null;
    state.messages = [];
    save();
    renderAll();
    updateTab();
    sync();
    post(RESET).catch(function () {});
    ui.input.focus({ preventScroll: true });
  }

  function references(q, signal) {
    var url = REFS + '?' + new URLSearchParams({ q: encodeURIComponent(q), tags: '' });
    return fetch(url, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: signal })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        var seen = {}, out = [];
        (Array.isArray(list) ? list : []).forEach(function (r) {
          if (!r || !r.url || !r.title || out.length >= MAX_SOURCES) return;
          /* The same page often comes back once per product version. */
          var title = String(r.title), key = title.toLowerCase();
          if (seen[key] || seen[r.url]) return;
          seen[key] = seen[r.url] = true;
          out.push({ title: title, url: String(r.url) });
        });
        return out;
      })
      .catch(function () { return []; });
  }

  function post(url) {
    return fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { if (!r.ok) throw httpError(r.status); return r; });
  }

  function httpError(status) {
    var e = new Error('HTTP ' + status);
    e.status = status;
    return e;
  }

  function describe(err) {
    var status = err && err.status;
    if (status === 404 && /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) {
      return 'This local site has no /chat endpoint. Browse it through a proxy that forwards /chat to redis.io.';
    }
    if (status === 403 || status === 429) return 'Redis Copilot turned this request away (HTTP ' + status + ').';
    if (status) return "Redis Copilot couldn't answer (HTTP " + status + ').';
    return "Couldn't reach Redis Copilot.";
  }

  function copy(button) {
    var code = button.closest('.aicp-code').querySelector('code').textContent;
    var done = function (label) {
      button.textContent = label;
      setTimeout(function () { button.textContent = 'Copy'; }, 1500);
    };
    if (!navigator.clipboard) { done('Copy failed'); return; }
    navigator.clipboard.writeText(code).then(function () { done('Copied'); }, function () { done('Copy failed'); });
  }

  /* ---------------------------------------------------------- Markdown --
     Answers are Markdown. This renders the subset the bot writes: fenced code,
     headings, lists nested by indentation, tables, quotes, rules, links,
     emphasis and inline code. Text is escaped before any tag is added, and only
     these tags are ever produced, so nothing in an answer reaches the page as
     markup. It runs on every streamed chunk, so half-written constructs, such
     as a code fence not closed yet, have to render sensibly too. */

  var LIST_ITEM = /^([ \t]*)([-*+]|\d{1,9}[.)])[ \t]+(.*)$/;
  var TABLE_RULE = /^[ \t]*\|?[ \t]*:?-+:?[ \t]*(\|[ \t]*:?-+:?[ \t]*)+\|?[ \t]*$/;

  function md(src) {
    /* NUL is the placeholder inline() uses; an answer has no business with it. */
    return blocks(decode(src).replace(/\u0000/g, '').replace(/\r\n?/g, '\n').split('\n'));
  }

  function indentOf(line) {
    return line.match(/^[ \t]*/)[0].replace(/\t/g, '    ').length;
  }

  function blocks(lines) {
    var out = [], para = [], lists = [], i = 0, m, afterBlank = false;

    function flushPara() {
      if (para.length) out.push('<p>' + inline(para.join('\n')) + '</p>');
      para = [];
    }
    function closeLists(indent) {
      while (lists.length && lists[lists.length - 1].indent > indent) {
        out.push('</li></' + lists.pop().tag + '>');
      }
    }
    function flush() { flushPara(); closeLists(-1); }

    while (i < lines.length) {
      var line = lines[i];
      var indent = indentOf(line);
      var inItem = lists.length && indent > lists[lists.length - 1].indent;

      if ((m = /^[ \t]*(`{3,}|~{3,})[ \t]*([^`\s]*)/.exec(line))) {
        flushPara();
        if (!inItem) closeLists(-1);
        var close = new RegExp('^[ \\t]*\\' + m[1][0] + '{' + m[1].length + ',}[ \\t]*$');
        var code = [];
        for (i++; i < lines.length && !close.test(lines[i]); i++) {
          code.push(lines[i].slice(Math.min(indent, indentOf(lines[i]))));
        }
        i++;
        out.push(codeBlock(code.join('\n'), m[2]));
        afterBlank = false;
        continue;
      }

      if (!line.trim()) {
        flushPara();
        /* A list carries on past a blank line if what follows still belongs to it. */
        var next = '';
        for (var j = i + 1; j < lines.length && !next; j++) next = lines[j].trim() ? lines[j] : '';
        if (lists.length && !(next && (LIST_ITEM.test(next) || indentOf(next) > lists[0].indent))) closeLists(-1);
        afterBlank = true;
        i++;
        continue;
      }

      if ((m = /^[ \t]*(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/.exec(line))) {
        flush();
        var level = m[1].length <= 2 ? 3 : m[1].length === 3 ? 4 : 5;
        out.push('<h' + level + '>' + inline(m[2]) + '</h' + level + '>');
      } else if (/^[ \t]*([-*_])([ \t]*\1){2,}[ \t]*$/.test(line)) {
        flush();
        out.push('<hr>');
      } else if (line.indexOf('|') !== -1 && i + 1 < lines.length && TABLE_RULE.test(lines[i + 1])) {
        flush();
        var head = cells(line), rows = [];
        for (i += 2; i < lines.length && lines[i].indexOf('|') !== -1 && lines[i].trim(); i++) rows.push(cells(lines[i]));
        out.push(table(head, rows));
        afterBlank = false;
        continue;
      } else if (/^[ \t]*>/.test(line)) {
        flush();
        var quote = [];
        for (; i < lines.length && /^[ \t]*>/.test(lines[i]); i++) quote.push(lines[i].replace(/^[ \t]*> ?/, ''));
        out.push('<blockquote>' + blocks(quote) + '</blockquote>');
        afterBlank = false;
        continue;
      } else if ((m = LIST_ITEM.exec(line))) {
        flushPara();
        var tag = /\d/.test(m[2]) ? 'ol' : 'ul';
        closeLists(indent);
        var top = lists[lists.length - 1];
        if (top && top.indent === indent && top.tag !== tag) {
          out.push('</li></' + lists.pop().tag + '>');
          top = lists[lists.length - 1];
        }
        if (!top || indent > top.indent) {
          var start = tag === 'ol' ? parseInt(m[2], 10) : 1;
          out.push('<' + tag + (start > 1 ? ' start="' + start + '"' : '') + '>');
          lists.push({ tag: tag, indent: indent });
        } else {
          out.push('</li>');
        }
        out.push('<li>' + inline(m[3]));
      } else if (lists.length && (inItem || !afterBlank)) {
        /* More of the current list item. */
        out.push((afterBlank ? '<br><br>' : ' ') + inline(line.trim()));
      } else {
        para.push(line.trim());
      }
      afterBlank = false;
      i++;
    }
    flush();
    return out.join('');
  }

  function cells(row) {
    var escaped = '\u0001';
    return row.trim().replace(/^\|/, '').replace(/\|$/, '').replace(/\\\|/g, escaped).split('|').map(function (c) {
      return c.trim().split(escaped).join('|');
    });
  }

  function table(head, rows) {
    return '<div class="aicp-table"><table><thead><tr>' +
      head.map(function (c) { return '<th>' + inline(c) + '</th>'; }).join('') +
      '</tr></thead><tbody>' +
      rows.map(function (r) {
        return '<tr>' + head.map(function (_, k) { return '<td>' + inline(r[k] || '') + '</td>'; }).join('') + '</tr>';
      }).join('') +
      '</tbody></table></div>';
  }

  function codeBlock(code, lang) {
    return '<div class="aicp-code"><div class="aicp-code-bar"><span>' + esc(lang || 'code') + '</span>' +
      '<button type="button" class="aicp-copy" data-act="copy">Copy</button></div>' +
      '<pre><code>' + esc(code) + '</code></pre></div>';
  }

  function inline(text) {
    var slots = [];
    function keep(markup) {
      slots.push(markup);
      return '\u0000' + (slots.length - 1) + '\u0000';
    }
    text = text
      .replace(/(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/g, function (_, ticks, code) {
        return keep('<code>' + esc(code.replace(/^ ([\s\S]*) $/, '$1')) + '</code>');
      })
      .replace(/\[([^\]\n]+)\]\(\s*<?([^\s<>()]+(?:\([^\s<>()]*\)[^\s<>()]*)*)>?(?:\s+["'][^"'\n]*["'])?\s*\)/g, function (all, label, url) {
        var href = safeHref(url);
        return href ? keep(anchor(href, emphasis(esc(label)))) : label;
      })
      .replace(/<(https?:\/\/[^\s<>\u0000]+)>|\bhttps?:\/\/[^\s<>()[\]"'`\u0000]*[^\s<>()[\]"'`\u0000.,;:!?*_]/g, function (all, bracketed) {
        var url = bracketed || all, href = safeHref(url);
        return href ? keep(anchor(href, esc(url))) : all;
      });
    text = emphasis(esc(text))
      .replace(/(?: {2,}|\\)\n/g, '<br>')
      .replace(/\n/g, ' ');
    /* Slots can hold slots (a code span in a link's text). */
    while (/\u0000\d+\u0000/.test(text)) {
      text = text.replace(/\u0000(\d+)\u0000/g, function (_, n) { return slots[+n]; });
    }
    return text;
  }

  function emphasis(s) {
    return s
      .replace(/\*\*(?=\S)([\s\S]*?\S)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[^\w])__(?=\S)([\s\S]*?\S)__(?!\w)/g, '$1<strong>$2</strong>')
      .replace(/~~(?=\S)([\s\S]*?\S)~~/g, '<del>$1</del>')
      .replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]*?[^\s*])\*(?![*\w])/g, '$1<em>$2</em>')
      .replace(/(^|[^\w])_(?=[^\s_])([^_\n]*?[^\s_])_(?!\w)/g, '$1<em>$2</em>');
  }

  function anchor(href, label, cls, title) {
    var here = href.indexOf(BASE) === 0 || href.indexOf(DOCS) === 0;
    return '<a href="' + esc(href) + '"' +
      (cls ? ' class="' + cls + '"' : '') +
      (title ? ' title="' + esc(title) + '"' : '') +
      (here ? '' : ' target="_blank" rel="noopener"') + '>' + label + '</a>';
  }

  /* Only web and mail links survive, whatever the bot writes. */
  function safeHref(url) {
    var u;
    try { u = new URL(String(url).trim(), location.href); } catch (e) { return null; }
    if (!/^(https?|mailto):$/.test(u.protocol)) return null;
    if (location.hostname !== 'redis.io' && u.href.indexOf(DOCS) === 0) return BASE + u.href.slice(DOCS.length);
    if (u.origin === location.origin) return u.pathname + u.search + u.hash;
    return u.href;
  }

  var NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };

  /* The answer arrives HTML-escaped. Undo that as text; never by parsing it. */
  function decode(s) {
    return s.replace(/&(#[xX][0-9a-fA-F]+|#[0-9]+|[a-zA-Z]+);/g, function (all, e) {
      if (e[0] !== '#') return Object.prototype.hasOwnProperty.call(NAMED, e.toLowerCase()) ? NAMED[e.toLowerCase()] : all;
      var n = /^#x/i.test(e) ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all;
    });
  }

  /* ------------------------------------------------------------ helpers -- */

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function svg(paths) {
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
      'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + paths + '</svg>';
  }

  function reducedMotion() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function basePath() {
    try { return new URL(window.HUGO_BASEURL || '/', location.href).pathname.replace(/\/?$/, '/'); } catch (e) { return '/'; }
  }

  /* -------------------------------------------------------------- start -- */

  /* The page link. A click that asks for a new tab or window keeps the href. */
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[data-ai-chat-open]');
    if (!link || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var q = promptOf(link);
    if (!q) return;
    e.preventDefault();
    opener = link;
    open({ focus: true });
    /* Asked about this page already: show that answer rather than ask again. */
    var users = state.messages.filter(function (m) { return m.role === 'user'; });
    var last = users[users.length - 1];
    if (busy || (last && last.text === q)) pinLast(false);
    else explain(link);
  });

  window.addEventListener('resize', (function () {
    var frame = 0;
    return function () {
      if (frame) return;
      frame = requestAnimationFrame(function () { frame = 0; layout(state); });
    };
  })());

  /* Keep whatever has arrived of an answer when the reader moves on. */
  window.addEventListener('pagehide', save);

  /* Back/forward cache: another page may have moved the conversation on. */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted || !ui) return;
    stop();
    busy = null;
    state = load();
    renderAll();
    sync();
    if (state.open) { open({ instant: true }); pinLast(true); }
    else { layout(state); ui.pane.classList.remove('is-in'); ui.pane.hidden = true; updateTab(); }
  });

  if (state.open || state.messages.length) build();
  if (state.open) {
    open({ instant: true });
    pinLast(true);
  }
  html.classList.remove('ai-pane-restoring');

  window.AIChatPane.open = open;
  window.AIChatPane.collapse = collapse;
  window.AIChatPane.ask = ask;
  window.AIChatPane.reset = reset;
})();

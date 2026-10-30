/* =========================================================================
   Error lookup: finds the docs page for a pasted Redis error message.

   Two sources, ranked together by how many characters of the text they match:
   - The error pages, from the shortcode's data-errors attribute
     (layouts/shortcodes/error-lookup.html). A `match` phrase found anywhere,
     ignoring case, scores its length. A bare prefix scores only its own
     length, so a longer, more specific phrase beats it. An ERR page's
     phrase doesn't count after another code.
   - The list of all error messages, fetched from data-catalog the first time
     the reader types. Each message is a template: its <placeholders> match
     any text, and it scores the length of its fixed parts, or of the whole
     message when the text has it exactly, code included.
   A message that a page explains counts for that page, and a page wins a
   tie, so such a message leads to its page. A redis-py message that has lost
   its prefix still matches, and a pasted transcript with several errors
   leads with the most specific one.
   ========================================================================= */
(function () {
  'use strict';
  if (window.__errorLookup) return;
  window.__errorLookup = true;

  var MAX_TEXT = 5000;
  var MAX_COMMANDS = 8;
  var EXAMPLES = [
    'WRONGTYPE Operation against a key holding the wrong kind of value',
    "redis.exceptions.ReadOnlyError: You can't write against a read only replica.",
    'SEARCH_INDEX_NOT_FOUND Index not found: idx:products'
  ];

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // An explanation is plain text with `literals` in backticks.
  function prose(s) {
    return esc(s || '').replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

  /* ------------------------------------------------------------ pages -- */

  function preparePage(e) {
    e.phrases = (e.match || []).filter(Boolean).map(function (m) {
      return { length: String(m).length, re: new RegExp(escRe(String(m)), 'gi') };
    });
    /* ERR is on almost every error, so ERR pages match on their phrases only. */
    e.prefixRe = e.prefix && e.prefix !== 'ERR'
      ? new RegExp('(^|[^A-Za-z0-9_])' + e.prefix + '(?![A-Za-z0-9_])')
      : null;
    return e;
  }

  /* The code just before position i of the text, such as SEARCH_SYNTAX, or ''. */
  function codeBefore(text, i) {
    var m = /([A-Z][A-Z_]{2,}) $/.exec(text.slice(Math.max(0, i - 64), i));
    return m ? m[1] : '';
  }

  /* After another code, an ERR page's phrase is part of a different error:
     "SEARCH_SYNTAX Syntax error at offset 5" isn't "ERR syntax error". The
     same rule picks the page for a message in layouts/partials/errors/catalog.html. */
  function hasPhrase(e, p, text) {
    var m;
    p.re.lastIndex = 0;
    while ((m = p.re.exec(text))) {
      var code = codeBefore(text, m.index);
      if (e.prefix !== 'ERR' || !code || code === 'ERR') return true;
    }
    return false;
  }

  function scorePage(e, text) {
    var phrase = 0;
    e.phrases.forEach(function (p) {
      if (p.length > phrase && hasPhrase(e, p, text)) phrase = p.length;
    });
    var prefix = e.prefixRe && e.prefixRe.test(text) ? e.prefix.length : 0;
    if (phrase) return phrase + (prefix ? 1 : 0.5);
    return prefix;
  }

  /* ---------------------------------------------------------- catalog -- */

  var catalog = null;   // { modules, errors } once fetched
  var waiting = null;   // what to run when the fetch ends, one per lookup on the page

  /* A message's fixed parts, in order, without a code prefix that clients may drop. */
  function prepareEntry(e) {
    var text = e.m;
    if (/^[A-Z][A-Z_]+$/.test(e.p) && text.indexOf(e.p + ' ') === 0) text = text.slice(e.p.length + 1);
    /* Without its code, the message starts with fixed text, which can't follow another code. */
    e.bare = text !== e.m && !/^<[^<>\n]{1,40}>/.test(text);
    var parts = text.split(/<[^<>\n]{1,40}>/).map(function (s) { return s.trim(); }).filter(Boolean);
    var fixed = parts.reduce(function (n, s) { return n + s.length; }, 0);
    var longest = parts.reduce(function (a, s) { return s.length > a.length ? s : a; }, '');
    /* Too little fixed text to tell this message apart from others. */
    if (fixed < 10 || longest.length < 8) return null;
    e.score = fixed;
    e.key = longest.toLowerCase();
    e.re = new RegExp(parts.map(escRe).join('[\\s\\S]{0,300}?'), 'i');
    /* The whole message, prefix and case included, scores its full length. So
       "WRONGTYPE Operation against..." leads to its own message rather than to
       "ERR WRONGTYPE Operation against...", and "Bad capacity" and "ERR bad capacity"
       each lead to their own. */
    var whole = e.m.split(/<[^<>\n]{1,40}>/).map(function (s) { return s.trim(); }).filter(Boolean);
    e.exact = new RegExp(whole.map(escRe).join('[\\s\\S]{0,300}?'));
    e.whole = whole.reduce(function (n, s) { return n + s.length; }, 0);
    return e;
  }

  /* Without the catalog, the lookup matches the error pages only, and a miss
     shows the no-match card instead of waiting for it. */
  function loadCatalog(root, then) {
    if (catalog) return;
    if (waiting) { if (waiting.indexOf(then) === -1) waiting.push(then); return; }
    var url = root.getAttribute('data-catalog');
    if (!url || !window.fetch) { catalog = { modules: {}, errors: [] }; return; }
    waiting = [then];
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      return { modules: d.modules || {}, errors: (d.errors || []).map(prepareEntry).filter(Boolean) };
    }).catch(function () {
      return { modules: {}, errors: [] };
    }).then(function (c) {
      catalog = c;
      waiting.forEach(function (f) { f(); });
    });
  }

  /* ------------------------------------------------------------- rank -- */

  function rank(pages, text) {
    text = text.slice(0, MAX_TEXT);
    var lower = text.toLowerCase();
    var byUrl = {};
    var found = pages.map(function (e, i) {
      return (byUrl[e.url] = { kind: 'page', e: e, s: scorePage(e, text), i: i });
    });
    if (catalog) {
      catalog.errors.forEach(function (e, i) {
        if (lower.indexOf(e.key) === -1) return;
        var m = e.re.exec(text);
        var code = m && e.bare ? codeBefore(text, m.index) : '';
        if (!m || (code && code !== e.p)) return;
        var s = e.exact.test(text) ? e.whole + 0.25 : e.score;
        /* A message that a page explains counts for that page, which then
           shows the exact message too. */
        var page = e.f && byUrl[e.f];
        if (!page) found.push({ kind: 'entry', e: e, s: s, i: pages.length + i });
        else if (s + 0.5 > page.s) { page.s = s + 0.5; page.via = e; }
      });
    }
    return found
      .filter(function (m) { return m.s > 0; })
      .sort(function (a, b) { return b.s - a.s || a.i - b.i; });
  }

  /* ----------------------------------------------------------- render -- */

  /* A link the AI chat pane (js/ai-chat-pane.js) turns into a question asked
     beside the page. Without the pane, it opens the chat page. */
  function askLink(text) {
    var first = text.trim().split('\n')[0].trim();
    if (first.length > 80) first = first.slice(0, 77) + '...';
    /* Without a half of an emoji at the end, which encodeURIComponent rejects. */
    var q = 'I got this Redis error:\n\n' + text.trim().slice(0, 1000).replace(/[\uD800-\uDBFF]$/, '') +
      '\n\nWhat does it mean, and how do I fix it?';
    return '<a class="rerr-ask" href="/chat?q=' + encodeURIComponent(q) + '" data-ai-chat-open' +
      ' data-ai-chat-label="' + esc('Explain this error: ' + first) + '">Ask AI about this error</a>';
  }

  function pageCard(e, via) {
    var exact = via && via.m !== e.message
      ? '<p class="rerr-via">Exact message: <code>' + esc(via.m) + '</code>' +
        (via.x ? '<br>' + prose(via.x) : '') +
        (via.c.length ? '<br>Returned by ' + commandList(via.c) + '.' : '') + '</p>'
      : '';
    return '<div class="rerr-card">' +
      '<a class="rerr-title" href="' + esc(e.url) + '">' + esc(e.title) + '</a>' +
      (e.description ? '<p class="rerr-desc">' + esc(e.description) + '</p>' : '') +
      '<pre class="rerr-msg">' + esc(e.message) + '</pre>' + exact +
      '<p class="rerr-actions"><a class="rerr-go" href="' + esc(e.url) + '#how-to-fix-it">How to fix it</a></p>' +
      '</div>';
  }

  function commandList(c) {
    var shown = c.slice(0, MAX_COMMANDS).map(function (x) {
      var code = '<code>' + esc(x.n) + '</code>';
      return x.u ? '<a href="' + esc(x.u) + '">' + code + '</a>' : code;
    }).join(', ');
    return c.length > MAX_COMMANDS ? shown + ', and ' + (c.length - MAX_COMMANDS) + ' more' : shown;
  }

  function entryCard(e) {
    var mod = catalog.modules[e.d] || [e.d, ''];
    var from = mod[1] ? '<a href="' + esc(mod[1]) + '">' + esc(mod[0]) + '</a>' : esc(mod[0]);
    return '<div class="rerr-card">' +
      '<pre class="rerr-msg rerr-msg-lead">' + esc(e.m) + '</pre>' +
      (e.x ? '<p class="rerr-lead">' + prose(e.x) + '</p>' : '') +
      '<p class="rerr-from">From ' + from + '.' +
      (e.c.length ? ' Returned by ' + commandList(e.c) + '.' : '') + '</p>' +
      '<p class="rerr-actions">' +
      (e.f ? '<a class="rerr-go" href="' + esc(e.f) + '#how-to-fix-it">How to fix it</a> ' : '') +
      '<a class="rerr-go rerr-go-quiet" href="' + esc(e.u) + '">See it in the list of ' + esc(mod[0]) + ' errors</a></p>' +
      '</div>';
  }

  function render(root, pages, text) {
    var out = root.querySelector('.rerr-result');
    if (!text.trim()) {
      out.innerHTML = '<p class="rerr-try">Try an example: ' + EXAMPLES.map(function (x, i) {
        return '<button type="button" class="rerr-chip" data-example="' + i + '">' +
          esc(x.length > 44 ? x.slice(0, 41) + '...' : x) + '</button>';
      }).join(' ') + '</p>';
      return;
    }
    var found = rank(pages, text);
    if (found.length) {
      var best = found[0];
      var seen = {};
      seen[best.kind === 'page' ? best.e.url : best.e.f] = true;
      var others = found.slice(1).filter(function (m) {
        if (m.kind !== 'page' || seen[m.e.url]) return false;
        seen[m.e.url] = true;
        return true;
      }).slice(0, 3);
      out.innerHTML = '<p class="rerr-kicker">Best match</p>' +
        (best.kind === 'page' ? pageCard(best.e, best.via) : entryCard(best.e)) +
        (others.length ? '<p class="rerr-also">Also matches: ' + others.map(function (m) {
          return '<a href="' + esc(m.e.url) + '">' + esc(m.e.title) + '</a>';
        }).join(', ') + '</p>' : '') +
        '<p class="rerr-still">' +
        (best.kind === 'entry' && !best.e.f ? 'This error doesn\'t have its own page yet. ' : 'Still stuck? ') +
        askLink(text) + '</p>';
      return;
    }
    if (!catalog) {
      out.innerHTML = '<p class="rerr-try">Searching all error messages...</p>';
      return;
    }
    if (/(^|[^A-Za-z0-9_])ERR(?![A-Za-z0-9_])/.test(text)) {
      out.innerHTML = '<div class="rerr-card rerr-none">' +
        '<p><strong>This is a general <code>ERR</code> error.</strong> The text after <code>ERR</code> ' +
        'describes the problem. It usually comes from the command that failed, so check the syntax on ' +
        'that command\'s page.</p><p>' + askLink(text) + '</p></div>';
      return;
    }
    out.innerHTML = '<div class="rerr-card rerr-none">' +
      '<p><strong>No error message matches this text.</strong> Check that you pasted the error message itself, ' +
      'or browse the <a href="' + esc(root.getAttribute('data-all') || '') + '">list of all error messages</a>.</p><p>' +
      askLink(text) + '</p></div>';
  }

  function init(root) {
    var pages;
    try { pages = JSON.parse(root.getAttribute('data-errors') || '[]').map(preparePage); } catch (e) { return; }
    var input = root.querySelector('.rerr-input');
    var update = function () {
      if (input.value.trim()) loadCatalog(root, update);
      render(root, pages, input.value);
    };
    input.addEventListener('input', update);
    root.addEventListener('click', function (ev) {
      var chip = ev.target.closest('[data-example]');
      if (!chip) return;
      input.value = EXAMPLES[+chip.getAttribute('data-example')];
      input.focus();
      update();
    });
    /* ?error=... fills the box, so another page or a support reply can link to a lookup. */
    try {
      var given = new URLSearchParams(location.search).get('error');
      if (given) input.value = given;
    } catch (e) { /* no URLSearchParams: start empty */ }
    update();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-error-lookup]'), init);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();

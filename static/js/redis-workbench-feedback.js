/* =========================================================================
   Workbench feedback  —  static/js/redis-workbench-feedback.js

   A "Leave feedback" button in the dock's bar. It opens a short form that asks
   whether the workbench is useful, yes or no. A "no" brings up a few reasons;
   the reader can pick one, and it is written into the comment box for them to
   add to. Sending takes a Cloudflare Turnstile token, for a yes as for a no.

   The answer goes to DocuSight, the service the page rating and the chat
   pane's thumbs go to:

     POST /docusight/api/rate/workbench/   form fields origin, rating (5 yes,
                                           1 no), reason, comment, snippet,
                                           error, commands (one per line) and
                                           cf-turnstile-response

   DocuSight checks the token and keeps an answer only if its origin is a
   page under redis.io/docs/latest/. /docusight only exists on redis.io, so a
   local build sends nothing, and logs what it would have sent.

   Built on what the dock and the widget already publish — the dock's bar,
   RedisCli.onExecute and RedisWorkbench.open — so the dock itself is unchanged.
   ========================================================================= */
(function () {
  'use strict';

  /* How many of the reader's commands a report can carry. Enough to show what
     led up to a problem, short enough to read. */
  var MAX_COMMANDS = 10;

  /* DocuSight's limits: a longer value gets the whole answer refused. A command
     past its limit is cut short; the comment box stops at its own. */
  var MAX_COMMAND_LENGTH = 300;
  var MAX_COMMENT_LENGTH = 500;
  var MAX_FIELD_LENGTH = 200;

  /* How long "Thanks" stays up before the form closes. */
  var THANKS_MS = 2200;

  /* What a "no" can pick from. One at most: it becomes the start of the
     comment. */
  var REASONS = [
    'I got an error',
    'The output doesn’t match the page',
    'I didn’t understand the result'
  ];

  /* The site key is the page rating form's (layouts/partials/feedback.html):
     DocuSight checks a workbench token against the same secret. It only works
     on redis.io, so elsewhere the form uses Cloudflare's always-pass test key. */
  var RATE = '/docusight/api/rate/workbench/';
  var LIVE = location.hostname === 'redis.io';
  var SITEKEY = LIVE ? '0x4AAAAAABpkO-YRJzl4qTBW' : '1x00000000000000000000AA';
  var TURNSTILE = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

  /* The narrowest Turnstile's full-width widget goes. In less room than this
     the form asks for the compact one. */
  var WIDGET_MIN_WIDTH = 300;

  var THUMB = '<path d="M3 10h4v11H3z"/>' +
    '<path d="M7 10l4-7a2 2 0 0 1 3.6 1.6L13.6 9H19a2 2 0 0 1 2 2.4l-1.4 7.2a3 3 0 0 1-2.9 2.4H7"/>';

  /* What a report says about the session, gathered as the reader works. */
  var seen = { commands: [], snippet: '', error: '' };

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text) node.textContent = text;
    return node;
  }

  function thumb(down) {
    var node = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    node.setAttribute('viewBox', '0 0 24 24');
    node.setAttribute('class', 'rwbf-icon');
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = down ? '<g transform="rotate(180 12 12)">' + THUMB + '</g>' : THUMB;
    return node;
  }

  function button(className, label, title) {
    var node = el('button', className, label);
    node.type = 'button';
    if (title) node.title = title;
    return node;
  }

  function clip(text, limit) {
    return text.length > limit ? text.slice(0, limit - 1) + '…' : text;
  }

  /* The one place an answer leaves from. The reader's commands and the last
     error go only if they left the box ticked. Resolves once DocuSight has
     taken it, and rejects if it could not be sent or was refused. */
  function send(answer) {
    var data = {
      origin: location.origin + location.pathname,
      rating: answer.rating === 'up' ? 5 : 1,
      reason: answer.reason,
      comment: clip(answer.comment.trim(), MAX_COMMENT_LENGTH),
      snippet: clip(seen.snippet, MAX_FIELD_LENGTH),
      error: answer.includeCommands ? seen.error : '',
      commands: answer.includeCommands
        ? seen.commands.map(function (command) { return clip(command, MAX_COMMAND_LENGTH); }).join('\n')
        : '',
      'cf-turnstile-response': answer.token
    };
    if (!LIVE) {
      console.info('Workbench feedback, not sent from a local build:', data);
      return Promise.resolve();
    }
    return fetch(RATE, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      body: new URLSearchParams(data)
    }).then(function (response) {
      if (!response.ok) throw new Error('DocuSight answered ' + response.status);
    });
  }

  var turnstileLoading = null;

  /* Docs pages already load Turnstile for the page rating form, and loading it
     twice makes it complain, so wait for that copy when there is one. Same as
     the chat pane (ai-chat-pane.js). */
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
          else window.setTimeout(wait, 100);
        })();
      });
    }
    return turnstileLoading;
  }

  /* Which snippet the reader last ran: only the "Try it" button knows. */
  if (window.RedisWorkbench && window.RedisWorkbench.open) {
    var openDock = window.RedisWorkbench.open;
    window.RedisWorkbench.open = function (options) {
      if (options && options.snippet) seen.snippet = String(options.snippet);
      return openDock.apply(this, arguments);
    };
  }

  function start(root) {
    var bar = root.querySelector('.rwb-bar');
    var actions = root.querySelector('.rwb-actions');
    if (!bar || !actions) return;

    var open = button('rwb-btn rwbf-open', '',
      'Tell the docs team what you think of the workbench');
    /* The bar is one line whatever the width, so on the narrowest phones the
       label is the one word. */
    open.appendChild(el('span', 'rwbf-long', 'Leave feedback'));
    open.appendChild(el('span', 'rwbf-short', 'Feedback'));
    open.setAttribute('aria-haspopup', 'dialog');
    open.setAttribute('aria-expanded', 'false');
    /* A dot sets it apart from the dock's own two controls, which act on the
       dock; this one does not. */
    var dot = el('span', 'rwbf-sep');
    dot.setAttribute('aria-hidden', 'true');
    actions.insertBefore(dot, actions.firstChild);
    actions.insertBefore(open, dot);

    /* The open form: {node, widget}, widget being Turnstile's ID for its check. */
    var form = null;

    function dropWidget(which) {
      if (which.widget === null || !window.turnstile) return;
      try { window.turnstile.remove(which.widget); } catch (err) { /* already gone */ }
      which.widget = null;
    }

    function close(refocus) {
      if (!form) return;
      dropWidget(form);
      form.node.remove();
      form = null;
      document.removeEventListener('mousedown', outside, true);
      open.setAttribute('aria-expanded', 'false');
      if (refocus) open.focus();
    }

    function outside(event) {
      if (!form || form.node.contains(event.target) || open.contains(event.target)) return;
      close(false);
    }

    /* Above the dock, where it covers the page rather than the output the reader
       is describing. A maximised dock leaves no room there, so it drops into the
       panel instead. */
    function place(node) {
      var top = root.getBoundingClientRect().top;
      var header = document.querySelector('header');
      var headerBottom = header ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
      if (node.offsetHeight + 16 <= top - headerBottom) return;
      node.classList.add('rwbf-pop-down');
      node.style.top = Math.round(bar.getBoundingClientRect().bottom - top + 8) + 'px';
    }

    function show() {
      var node = el('div', 'rwbf-pop');
      node.setAttribute('role', 'dialog');
      node.setAttribute('aria-labelledby', 'rwbf-title');
      var mine = form = { node: node, widget: null };

      var rating = null;      // 'up' or 'down'
      var reason = '';        // the reason picked for a "no", as written into the comment
      var token = '';         // Turnstile's; nothing is sent without one
      var sending = false;

      var body = el('form', 'rwbf-form');
      body.noValidate = true;

      var head = el('div', 'rwbf-head');
      var title = el('p', 'rwbf-title', 'Is the workbench useful?');
      title.id = 'rwbf-title';
      head.appendChild(title);
      var x = button('rwbf-x', '×', 'Close');
      x.setAttribute('aria-label', 'Close');
      x.addEventListener('click', function () { close(true); });
      head.appendChild(x);
      body.appendChild(head);

      var choice = el('div', 'rwbf-choice');
      choice.setAttribute('role', 'group');
      choice.setAttribute('aria-labelledby', 'rwbf-title');
      var chips = el('div', 'rwbf-chips');
      chips.setAttribute('role', 'group');
      chips.setAttribute('aria-label', 'What went wrong?');
      chips.hidden = true;
      var comment = el('textarea', 'rwbf-text');
      comment.rows = 3;
      comment.maxLength = MAX_COMMENT_LENGTH;
      comment.setAttribute('aria-label', 'Your feedback');
      var sendButton = el('button', 'rwb-btn rwbf-send', 'Send');
      sendButton.type = 'submit';

      /* An answer is a yes or a no, with a passed check: DocuSight takes nothing
         less. */
      function refresh() {
        sendButton.disabled = sending || !token || !rating;
        comment.placeholder = rating === 'down'
          ? 'What went wrong, or what’s missing? (optional)'
          : 'Tell us more (optional)';
      }

      /* The reason picked starts the comment, and what the reader has typed stays
         after it. Picking another swaps the first for it; picking none takes it
         back out. */
      function setReason(label) {
        if (label === reason) return;
        var text = comment.value;
        var rest = reason && text.indexOf(reason) === 0 ? text.slice(reason.length)
          : text.trim() ? ': ' + text.trim() : '';
        comment.value = label ? label + rest : rest.replace(/^[\s:.,;-]+/, '');
        reason = label;
        Array.prototype.forEach.call(chips.children, function (chip) {
          chip.setAttribute('aria-pressed', String(chip.textContent === label));
        });
        refresh();
      }

      [['up', 'Yes'], ['down', 'No']].forEach(function (pair) {
        var pick = button('rwbf-pick');
        pick.setAttribute('aria-pressed', 'false');
        pick.appendChild(thumb(pair[0] === 'down'));
        pick.appendChild(el('span', null, pair[1]));
        pick.addEventListener('click', function () {
          rating = rating === pair[0] ? null : pair[0];
          Array.prototype.forEach.call(choice.children, function (other) {
            other.setAttribute('aria-pressed', String(other === pick && rating !== null));
          });
          /* The reasons are reasons for a "no". */
          chips.hidden = rating !== 'down';
          if (chips.hidden) setReason('');
          refresh();
        });
        choice.appendChild(pick);
      });
      body.appendChild(choice);

      REASONS.forEach(function (label) {
        var chip = button('rwbf-chip', label);
        chip.setAttribute('aria-pressed', 'false');
        chip.addEventListener('click', function () {
          setReason(reason === label ? '' : label);
        });
        chips.appendChild(chip);
      });
      body.appendChild(chips);

      comment.addEventListener('input', refresh);
      comment.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) body.requestSubmit();
      });
      body.appendChild(comment);

      /* Their commands, and the error they last got, go only if they say so, and
         they can see how many. */
      var include = null;
      var count = seen.commands.length;
      if (count) {
        var tick = el('label', 'rwbf-check');
        include = el('input');
        include.type = 'checkbox';
        include.checked = true;
        tick.appendChild(include);
        tick.appendChild(el('span', null, (count === 1
          ? 'Include the last command I ran'
          : 'Include the last ' + count + ' commands I ran') +
          (seen.error ? ' and the last error' : '')));
        body.appendChild(tick);
      }

      /* Where Turnstile draws its check. */
      var bot = el('div', 'rwbf-bot');
      body.appendChild(bot);

      /* Says so when an answer could not be sent. */
      var problem = el('p', 'rwbf-problem');
      problem.setAttribute('role', 'alert');
      problem.hidden = true;
      body.appendChild(problem);

      var foot = el('div', 'rwbf-foot');
      foot.appendChild(el('span', 'rwbf-note', 'Goes to the Redis docs team.'));
      foot.appendChild(sendButton);
      body.appendChild(foot);

      body.addEventListener('submit', function (event) {
        event.preventDefault();
        if (sendButton.disabled) return;
        sending = true;
        problem.hidden = true;
        sendButton.textContent = 'Sending…';
        refresh();
        send({
          rating: rating,
          reason: reason,
          comment: comment.value,
          includeCommands: !!(include && include.checked),
          token: token
        }).then(function () {
          if (form !== mine) return;            // closed while it was on its way
          dropWidget(mine);
          var done = el('p', 'rwbf-done', 'Thanks for the feedback!');
          done.setAttribute('role', 'status');
          node.replaceChildren(done);
          open.focus();
          window.setTimeout(function () {
            if (form === mine) close(false);
          }, THANKS_MS);
        }, function (err) {
          console.error('[workbench feedback] Not sent:', err);
          if (form !== mine) return;
          /* A token is good for one try, so the check runs again and Send comes
             back when it passes. What the reader wrote stays. */
          sending = false;
          token = '';
          sendButton.textContent = 'Send';
          problem.textContent = 'Couldn’t send your feedback. Try again.';
          problem.hidden = false;
          refresh();
          if (mine.widget !== null && window.turnstile) {
            try { window.turnstile.reset(mine.widget); } catch (e) { /* the check's own error shows */ }
          }
        });
      });

      /* Escape closes the form, not the dock under it. */
      node.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
          event.stopPropagation();
          close(true);
        }
      });

      node.appendChild(body);
      root.appendChild(node);
      refresh();
      /* Placed for its tallest state, so a "no" never moves it. */
      chips.hidden = false;
      place(node);
      chips.hidden = true;
      open.setAttribute('aria-expanded', 'true');
      document.addEventListener('mousedown', outside, true);
      choice.firstChild.focus();

      function failed(message) {
        token = '';
        refresh();
        dropWidget(mine);
        var note = el('p', 'rwbf-bot-note', message);
        note.setAttribute('role', 'alert');
        bot.replaceChildren(note);
      }

      turnstile().then(function (ts) {
        if (form !== mine) return;              // closed before the script came
        var compact = bot.clientWidth < WIDGET_MIN_WIDTH;
        bot.classList.toggle('rwbf-bot-compact', compact);
        mine.widget = ts.render(bot, {
          sitekey: SITEKEY,
          theme: 'dark',
          size: compact ? 'compact' : 'flexible',
          callback: function (value) { token = value; refresh(); },
          'expired-callback': function () { token = ''; refresh(); },
          'error-callback': function () {
            failed('Couldn’t check that you’re not a bot. Try again later.');
            return true;
          }
        });
      }, function () {
        if (form === mine) failed('Couldn’t load the check that you’re not a bot.');
      });
    }

    open.addEventListener('click', function () {
      if (form) close(true); else show();
    });

    /* A collapsed dock has no form to show. */
    new MutationObserver(function () {
      if (!root.classList.contains('rwb-open')) close(false);
    }).observe(root, { attributes: true, attributeFilter: ['class'] });

    /* ---- what the reader ran ---------------------------------------------- */

    window.RedisCli.onExecute(function (batch) {
      if (batch.source !== 'tryit' && batch.source !== 'interactive') return;
      seen.commands = seen.commands.concat(batch.commands).slice(-MAX_COMMANDS);
      (batch.replies || []).forEach(function (reply) {
        if (reply && reply.error) seen.error = clip(String(reply.value), MAX_FIELD_LENGTH);
      });
    });
  }

  /* The dock mounts once the widget has loaded, which is after this runs. */
  (function wait(tries) {
    var root = document.querySelector('.rwb');
    if (root && window.RedisCli && window.RedisCli.onExecute) return start(root);
    if (tries > 0) window.setTimeout(function () { wait(tries - 1); }, 200);
  })(150);
})();

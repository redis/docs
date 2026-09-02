/* =========================================================================
   Command completion for the workbench terminal.

   What Redis Insight's Workbench editor does, in a one-line prompt: type the
   start of a command and the matches appear with the syntax each one takes —
   `HGET key field` — arrow keys to choose, Enter to insert.

   Where the list comes from: the docs themselves. Every content/commands/*.md
   carries the syntax line its own page prints (syntax_fmt), a one-line summary
   and a group, so the completion cannot drift from the reference beside it. The
   partial cli-commands-data.html publishes those as one JSON file and passes its
   URL in window.REDIS_COMMANDS_URL; this fetches it on the first keystroke, so a
   reader who never types pays nothing and a reader who does pays once per visit.

   Why a plain popup and not the widget's own editor: the terminal is an <input>
   owned by the /cli backend's widget (see js/cli.js), and this must not fork it.
   Everything here attaches from outside — listeners on that input, a panel
   positioned next to it — so the widget stays the widget.
   ========================================================================= */
(function () {
  "use strict";

  /* How many matches to offer. Insight shows a short list and a hint that there
     are more; a long list in a small dock is a wall, not a menu. */
  var MAX_MATCHES = 8;

  /* Below this there is no list worth drawing — under a row's worth of space. */
  var MIN_PANEL = 24;

  /* Keys that mean "put it in": Enter as in Insight, Tab because a terminal
     reader will try it. */
  var ACCEPT_KEYS = { Enter: true, Tab: true };

  var commands = null;
  var loading = null;

  function load() {
    if (commands) return Promise.resolve(commands);
    if (loading) return loading;
    var url = window.REDIS_COMMANDS_URL;
    if (!url) return Promise.resolve(null);
    loading = fetch(url, { cache: 'force-cache' })
      .then(function (response) { return response.ok ? response.json() : null; })
      .then(function (list) {
        commands = Array.isArray(list) ? list : null;
        return commands;
      }, function () {
        /* No completion is a fine outcome; a broken terminal is not. */
        return null;
      });
    return loading;
  }

  /* The text the reader is completing: everything from the start of the line to
     the caret. A command name can contain a space ("XINFO STREAM") or a dot
     ("JSON.GET"), so the candidate is the whole prefix rather than the last word
     — which is also what makes "xinfo str" complete to "XINFO STREAM". */
  function prefixOf(input) {
    if (input.selectionStart !== input.value.length) return null;
    var typed = input.value.slice(0, input.selectionStart);
    if (/^\s*$/.test(typed)) return null;
    return typed.replace(/^\s+/, '');
  }

  /* Do the letters appear in order? This is what makes typing "hget" offer HMGET
     as Redis Insight does — H·M·G·E·T contains h, g, e, t in sequence, though not
     as a substring. Separators are ignored, so "jsonget" reaches JSON.GET and
     "xinfostr" reaches XINFO STREAM. */
  function subsequence(name, needle) {
    var at = 0;
    for (var i = 0; i < name.length && at < needle.length; i++) {
      if (name[i] === needle[at]) at++;
    }
    return at === needle.length;
  }

  /* Ranked the way a reader reads it: what they typed, then what starts with it,
     then what merely contains those letters in order — the exact match included,
     because seeing "HGET  HGET key field" is how the syntax gets checked, and
     inserting it adds the space that comes next.

     A space changes the question. Once it has been typed, the command has been
     settled and the reader is either naming a subcommand or writing arguments —
     so only names that extend it by a word are offered ("XINFO " → XINFO STREAM,
     XINFO GROUPS…), and nothing at all when there are none: HDEL takes no
     subcommand, so "HDEL " must not re-offer HDEL. That last case is what put the
     picker back on screen every time a space was typed after choosing a command.

     The loose tier is dropped as soon as there is any whitespace, too: it ignores
     separators by design, so "HDEL " would otherwise still match HDEL. */
  function matchesFor(prefix) {
    if (!commands) return { shown: [], total: 0 };
    var settled = /\s$/.test(prefix);
    var needle = prefix.trim().toUpperCase();
    if (!needle) return { shown: [], total: 0 };
    var extending = needle + ' ';
    var bare = needle.replace(/[ ._-]/g, '');
    var exact = [];
    var starts = [];
    var loose = [];
    commands.forEach(function (command) {
      var name = command.n.toUpperCase();
      if (settled) {
        /* Only a subcommand can follow. */
        if (name.indexOf(extending) === 0) starts.push(command);
        return;
      }
      if (name === needle) exact.push(command);
      else if (name.indexOf(needle) === 0) starts.push(command);
      else if (bare && !/\s/.test(needle) && subsequence(name.replace(/[ ._-]/g, ''), bare)) {
        loose.push(command);
      }
    });
    /* Shortest first: the command whose name is closest to what was typed is the
       likeliest, and HGET should not sit below HGETEX. */
    var byName = function (a, b) { return a.n.length - b.n.length || a.n.localeCompare(b.n); };
    var ranked = exact.concat(starts.sort(byName), loose.sort(byName));
    return { shown: ranked.slice(0, MAX_MATCHES), total: ranked.length };
  }

  /* Mark what the reader typed, letter by letter and in order — so HGETALL shows
     HGET marked and ALL plain, and HMGET (matched as a subsequence) marks the H,
     G, E and T it actually contributed. Separators in the typed text are skipped
     rather than hunted for, since "jsonget" is a fair way to ask for JSON.GET. */
  function markMatch(name, typed) {
    var wrap = el('span', 'rwb-complete-name');
    var needle = typed.toUpperCase().replace(/[ ._-]/g, '');
    var upper = name.toUpperCase();
    var at = 0;
    var plain = '';
    var flush = function () {
      if (!plain) return;
      wrap.appendChild(document.createTextNode(plain));
      plain = '';
    };
    for (var i = 0; i < name.length; i++) {
      if (at < needle.length && upper[i] === needle[at]) {
        flush();
        wrap.appendChild(el('b', null, name[i]));
        at++;
      } else {
        plain += name[i];
      }
    }
    flush();
    return wrap;
  }

  /* Which command is being typed, once one is settled. The longest match wins, so
     "XINFO STREAM key" is XINFO STREAM rather than XINFO. */
  function commandAt(text) {
    if (!commands) return null;
    var upper = text.toUpperCase();
    var best = null;
    commands.forEach(function (command) {
      var name = command.n.toUpperCase();
      if (upper === name || upper.indexOf(name + ' ') === 0) {
        if (!best || name.length > best.n.length) best = command;
      }
    });
    return best;
  }

  /* Split a syntax line into the parts a reader steps through, keeping bracketed
     groups whole: "MSET key value [key value ...]" is four tokens, not six, so the
     optional group can be marked as one thing. */
  function syntaxTokens(syntax) {
    var tokens = [];
    var depth = 0;
    var current = '';
    for (var i = 0; i < syntax.length; i++) {
      var ch = syntax[i];
      if (ch === '[' || ch === '<') depth++;
      if (ch === ']' || ch === '>') depth = Math.max(0, depth - 1);
      if (ch === ' ' && !depth) {
        if (current) tokens.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);
    return tokens;
  }

  /* What redis-cli puts after the cursor: the arguments still to come, dimmed.
     It counts what has been typed — a part-typed argument counts, which is why
     `hget bike` hints "field" rather than "key field" — and shows the rest of the
     syntax from there. Nothing left to say means no hint. */
  function inlineHint(text, command) {
    var tokens = syntaxTokens(command.s || command.n);
    var nameWords = command.n.split(' ').length;
    var args = tokens.slice(nameWords);
    if (!args.length) return '';
    var rest = text.slice(command.n.length).trim();
    var consumed = rest ? rest.split(/\s+/).length : 0;
    var remaining = args.slice(consumed);
    if (!remaining.length) return '';
    /* A space of its own when the reader has not typed one yet. */
    return (/\s$/.test(text) ? '' : ' ') + remaining.join(' ');
  }

  /* Measured rather than guessed: the hint has to start exactly where the typed
     text ends, and the terminal's font is the widget's business, not ours. */
  var ruler = null;

  function textWidth(text, font) {
    if (!ruler) ruler = document.createElement('canvas').getContext('2d');
    ruler.font = font;
    return ruler.measureText(text).width;
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function controller(form, input) {
    var host = form.parentNode;
    var panel = el('div', 'rwb-complete');
    panel.setAttribute('role', 'listbox');
    panel.hidden = true;
    host.appendChild(panel);

    var state = { matches: [], index: 0, open: false, prefix: '' };

    function close() {
      if (!state.open) return;
      state.open = false;
      panel.hidden = true;
      panel.replaceChildren();
      input.removeAttribute('aria-activedescendant');
    }

    /* What the last placement measured, so a placement can tell whether the
       column has stopped moving under it. */
    var settledAt = '';

    /* Never over the line being typed. Under the prompt if it fits, above it if it
       fits there, and when neither has room — a dock two lines tall — on whichever
       side has more, capped to that space and scrolling inside itself.

       Capped to the room and not a pixel more. An earlier version kept a floor of
       one row's height, which on a short dock put the top of an above-the-prompt
       list past the top of the column: the column clips, so the best matches
       vanished with no scrollbar to say they were there — a list of SIN* commands
       showing nothing but the loose matches at its end. Whatever cannot be shown
       is now the panel's own scroll, which the reader can reach. */
    function place() {
      var promptRow = input.closest('.prompt') || input;
      var promptTop = promptRow.offsetTop;
      var promptBottom = promptTop + promptRow.offsetHeight;

      /* The line being typed comes first: shrinking the dock can leave the prompt
         below the fold, and a list placed against a prompt that cannot be seen
         has nothing to anchor to — it filled the column with its middle rows and
         clipped the matches at both ends. Bring the prompt back into view, as the
         terminal does when output arrives, and place against where it now is. */
      if (promptBottom > host.scrollTop + host.clientHeight || promptTop < host.scrollTop) {
        host.scrollTop = Math.max(0, promptBottom - host.clientHeight);
      }
      var viewTop = host.scrollTop;
      var viewBottom = viewTop + host.clientHeight;

      /* The natural height, taken from the content rather than by clearing the
         cap and re-measuring: place() runs inside a ResizeObserver, and a style
         change plus a forced re-layout in there is the loop Blink cuts short by
         dropping the notifications that follow — which is what left a dragged
         dock with the cap it had two frames ago. scrollHeight is the content
         either way, and the borders are whatever the box adds to it. */
      var height = panel.scrollHeight + (panel.offsetHeight - panel.clientHeight);
      var gap = 2;
      /* Both measured within the visible slice of the column, never past it. */
      var roomBelow = Math.max(0, viewBottom - (Math.max(promptBottom, viewTop) + gap));
      var roomAbove = Math.max(0, Math.min(promptTop, viewBottom) - gap - viewTop);

      var below = height <= roomBelow || roomBelow >= roomAbove;
      var room = below ? roomBelow : roomAbove;
      /* No room: closed, not merely hidden. Hiding the panel and leaving the list
         open left the prompt's keys captured by a list nobody could see — Enter
         inserted the highlighted command instead of running the line, Tab and the
         arrows likewise. A reader at the dock's minimum height, where the toolbar
         and the tabs have taken the column, could not submit anything.

         Closing is also the behaviour we want: on a window this short the
         suggestions are what gets dropped, not the typing. */
      if (room < MIN_PANEL) return close();

      panel.hidden = false;
      /* Set every time, not only when it bites: a cap left over from a shorter
         dock is what kept the list scrolling after it had been given the room to
         show every match. */
      panel.style.maxHeight = room + 'px';
      var drawn = Math.min(height, room);
      panel.style.top = (below ? promptBottom + gap : promptTop - gap - drawn) + 'px';
      panel.style.left = promptRow.offsetLeft + 'px';
      /* The likeliest match is the first one: a cap must never leave the list
         showing its tail. */
      panel.scrollTop = 0;

      /* A resize does not settle in one frame: the column changes height, and
         then the browser clamps its scroll position to the content that now fits
         — silently, with no scroll event to hear. So each placement records what
         it measured, and if the next frame disagrees it places again, until two
         frames running see the same column. Without it, growing the dock left the
         list with the cap it computed half way through the drag. */
      var seen = viewTop + ':' + host.clientHeight + ':' + promptTop;
      if (seen !== settledAt) {
        settledAt = seen;
        window.requestAnimationFrame(function () { if (state.open) place(); });
      }
    }

    function render() {
      panel.replaceChildren();
      state.matches.forEach(function (command, i) {
        var row = el('div', 'rwb-complete-row' + (i === state.index ? ' rwb-complete-on' : ''));
        row.setAttribute('role', 'option');
        row.setAttribute('aria-selected', String(i === state.index));
        row.id = 'rwb-complete-' + i;

        row.appendChild(markMatch(command.n, state.prefix));
        row.appendChild(el('span', 'rwb-complete-syntax', command.s || command.n));
        if (command.d) row.title = command.d;
        /* mousedown, not click: the input must not lose focus first. */
        row.addEventListener('mousedown', function (event) {
          event.preventDefault();
          accept(i);
        });
        panel.appendChild(row);
      });
      if (state.total > state.matches.length) {
        panel.appendChild(el('div', 'rwb-complete-more',
          state.total - state.matches.length + ' more — keep typing'));
      }
      panel.hidden = false;
      state.open = true;
      input.setAttribute('aria-activedescendant', 'rwb-complete-' + state.index);
      place();
    }

    function move(step) {
      if (!state.matches.length) return;
      state.index = (state.index + step + state.matches.length) % state.matches.length;
      render();
    }

    function accept(index) {
      var command = state.matches[index === undefined ? state.index : index];
      if (!command) return;
      var rest = input.value.slice(input.selectionStart);
      input.value = command.n + ' ' + rest.replace(/^\s+/, '');
      var caret = command.n.length + 1;
      input.setSelectionRange(caret, caret);
      close();
      input.focus({ preventScroll: true });
      /* Straight into the hint for what was just inserted. */
      drawGhost();
    }

    function refresh() {
      var prefix = prefixOf(input);
      if (!prefix) { close(); return Promise.resolve(); }
      return load().then(function () {
        /* The reader may have typed on while the list was fetched. */
        var current = prefixOf(input);
        if (!current || !commands) return close();
        var found = matchesFor(current);
        if (found.shown.length) {
          state.prefix = current;
          state.matches = found.shown;
          state.total = found.total;
          state.index = 0;
          return render();
        }
        close();
      });
    }

    /* ---- the inline hint ----
       A span laid over the prompt line, starting where the typed text ends. An
       <input> cannot hold styled text of its own, so this is the only way to have
       what redis-cli has without replacing the widget's prompt with an editor. */
    var ghost = el('span', 'rwb-ghost');
    ghost.setAttribute('aria-hidden', 'true');       /* the syntax is not content */
    ghost.hidden = true;
    (input.closest('.prompt') || form).appendChild(ghost);

    function drawGhost() {
      var text = input.value;
      var command = text.trim() ? commandAt(text.replace(/^\s+/, '')) : null;
      var hint = command ? inlineHint(text.replace(/^\s+/, ''), command) : '';
      if (!hint) {
        ghost.hidden = true;
        return;
      }
      var style = window.getComputedStyle(input);
      var left = input.offsetLeft + textWidth(text, style.font) - input.scrollLeft;
      /* Past the edge of the line: redis-cli drops its hint rather than wrap. */
      if (left > input.offsetLeft + input.clientWidth - 24) {
        ghost.hidden = true;
        return;
      }
      ghost.textContent = hint;
      ghost.style.left = left + 'px';
      ghost.style.top = input.offsetTop + 'px';
      ghost.style.lineHeight = style.lineHeight;
      ghost.style.font = style.font;
      ghost.hidden = false;
    }

    /* The dock is resizable — dragged, maximised, restored, and its columns
       dragged against each other — and every one of those changes the space the
       list has. Without this it kept whatever cap it was given when it opened: a
       reader who grew the dock to see more got the same short, scrolling list. */
    /* One placement per frame, however many events a drag delivers. */
    var scheduled = false;
    function schedulePlace() {
      if (!state.open || scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(function () {
        scheduled = false;
        if (state.open) place();
      });
    }

    if (window.ResizeObserver) {
      /* Only the column: observing the panel would react to its own cap. */
      new ResizeObserver(schedulePlace).observe(host);
    }

    /* And again when the transcript scrolls. A resize moves the column's scroll
       position too — the terminal keeps its last line in view — and that settles
       a frame after the resize itself: without this the list kept the cap it was
       given against the scroll position the column had on the way there. */
    host.addEventListener('scroll', schedulePlace);

    input.addEventListener('input', function () {
      /* Drawn now from what is already known, and again once the list has
         arrived: the first keystroke of a visit is what fetches it, and without
         the second pass that keystroke would show no hint at all until another
         one followed. */
      drawGhost();
      refresh().then(drawGhost);
    });
    input.addEventListener('keyup', drawGhost);
    input.addEventListener('focus', drawGhost);
    input.addEventListener('blur', function () { ghost.hidden = true; });
    input.addEventListener('blur', function () {
      /* Let a mousedown on a row land first. */
      window.setTimeout(close, 120);
    });

    /* Capture, so Enter chooses a completion instead of submitting the line the
       widget is listening for. */
    input.addEventListener('keydown', function (event) {
      if (!state.open) {
        /* Insight opens its list on Ctrl-Space; so does this. */
        if (event.key === ' ' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          refresh();
        }
        return;
      }
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); return close(); }
      if (event.key === 'ArrowDown') { event.preventDefault(); return move(1); }
      if (event.key === 'ArrowUp') { event.preventDefault(); return move(-1); }
      if (ACCEPT_KEYS[event.key]) {
        event.preventDefault();
        event.stopPropagation();
        accept();
      }
    }, true);

    return { close: close };
  }

  window.RedisCliComplete = {
    /* Called by the dock when it mounts a terminal, and again if it rebuilds one.
       Returns false when there is nothing to complete against, so a caller can
       tell whether it is on. */
    attach: function (form) {
      if (!form || form.dataset.completeAttached) return false;
      var input = form.querySelector('input');
      if (!input) return false;
      form.dataset.completeAttached = 'true';
      controller(form, input);
      return true;
    },

    /* For tests: the matching is the part worth asserting on directly. */
    _match: function (prefix) {
      return matchesFor(prefix);
    },
    _load: load
  };
})();

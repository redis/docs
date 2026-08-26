/* =========================================================================
   Redis workbench — notebook pane  (PROTOTYPE)

   Adds a "Notebook" tab to the workbench dock on pages that carry runnable
   Jupyter cells (the `jupyter-example` shortcode's `.thebe-container` blocks, as
   on /develop/clients/redis-py/), so a reader can run a page's client examples
   in one place — a notebook with a Run all — instead of cell by cell down the
   page, with the dock's key browser alongside.

   ── how it works, and why that way ───────────────────────────────────────
   It does NOT re-drive Thebe. The existing integration (about 1800 lines inline
   in layouts/_default/baseof.html) already owns kernel loading, BinderHub
   sessions, CodeMirror, the `depends` gating between cells and the output
   rendering. This pane ADOPTS the cell elements: at mount it moves each
   `.thebe-container` node into the pane and leaves a plain copy of the block in
   the page. Moving a node keeps its listeners, its editor and Thebe's references
   to it intact, so every one of those 1800 lines keeps working and this file
   stays small enough to delete. The page is then an ordinary page of code
   blocks, each with a "Try it" that opens this pane.

   Kernel state is read, not managed: the driver marks its containers `loading`,
   `kernel-ready` and `reconnecting`, so a MutationObserver on those classes is
   enough to report progress in the dock's status line.

   ── what this prototype does NOT do ──────────────────────────────────────
   The key browser still reads the redis.io/cli sandbox, while these cells talk
   to the Redis inside their BinderHub image — two different databases, so keys a
   cell writes do not appear in the browser. Making that work means running the
   introspection inside the kernel (scan_iter/type/hgetall returning JSON) behind
   the same interface the browser already uses. Until then the pane says so
   rather than letting the two panes imply a connection they don't have.
   ========================================================================= */
(function () {
  "use strict";

  /* How long to wait for a cell's run to finish before giving up on it. A cold
     BinderHub kernel can take a minute to appear, and the first cell carries
     that wait. */
  var FIRST_RUN_TIMEOUT = 120000;
  var RUN_TIMEOUT = 45000;

  /* How long a clicked cell has to show any sign of life — going busy, or writing
     output — before it is reported as not responding. While ANY cell is still
     executing this clock is pushed back, because a cell waiting its turn in the
     kernel's queue is idle and empty through no fault of its own. */
  var START_GRACE = 2500;

  /* Retries of 100ms each, before a cell that has neither a count nor output is
     called silent: the count is written after the execute future resolves, so it
     and its output can both land after the cell's turn looks over. */
  var LATE_COUNT_TRIES = 15;

  /* Gap between the clicks of a Run all. A Jupyter kernel executes what it is
     sent in the order it arrives, so every cell after the first is fired off back
     to back and left to queue server-side instead of waiting for the one before
     it — the difference between a Run all that takes as long as the slowest cell
     and one that takes as long as the sum of them. The gap is only there so the
     driver's per-click bookkeeping (loading class, output observer) happens in
     the same order the cells were clicked. */
  var CLICK_STAGGER = 60;

  /* The dock mounts only once the CLI widget has published its API, so this waits
     the same way the dock itself does rather than racing it. */
  var MOUNT_DEADLINE = 20000;
  var MOUNT_STEP = 150;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function cells() {
    return Array.prototype.slice.call(document.querySelectorAll('.thebe-container'));
  }

  /* The shortcode exposes the step's description as an attribute; the header also
     carries it, but as one of several identically-classed spans (the first is the
     "Language:" label), so the attribute is the reliable source. The id is the
     step name from examples.json. */
  function cellTitle(container) {
    return {
      name: container.id || 'cell',
      description: (container.getAttribute('data-description') || '').trim()
    };
  }

  /* `depends="connect"` on the shortcode names another cell BY ITS STEP ID — the
     same string that becomes that cell's container id — so the page's own
     ordering rule can be read here rather than guessed from document order. The
     docs name a single step today; splitting on separators costs nothing and
     means a cell that later depends on two steps still gates correctly. */
  function dependsOn(container) {
    return (container.getAttribute('data-depends') || '')
      .split(/[\s,]+/)
      .filter(function (name) { return !!name; });
  }

  function runButton(container) {
    return container.querySelector('.thebe-run-btn');
  }

  function outputBox(container) {
    return container.querySelector('.thebe-output-container');
  }

  function isBusy(container) {
    var button = runButton(container);
    return !!(container.classList.contains('loading')
      || (button && button.classList.contains('loading')));
  }

  function kernelUnavailable(container) {
    var button = runButton(container);
    return !!(button && button.classList.contains('thebe-btn-kernel-unavailable'));
  }

  /* Enough of the output area to tell "this changed" from "nothing happened". */
  /* Where a result can show up. The pane's own output container is the usual
     place, but a cell the page declares as printing nothing has no container at
     all — and a kernel can answer anyway: the JavaScript kernel echoes the value
     of an awaited expression, so `await client.quit()` prints OK into Thebe's own
     output area. Reading only the container called that cell silent while its
     result was on screen. */
  function resultBox(container) {
    return outputBox(container)
      || container.querySelector('.thebe-output, .jp-OutputArea');
  }

  function outputSignature(container) {
    var output = resultBox(container);
    return output ? output.textContent.length + ':' + output.children.length : '0:0';
  }

  /* Does this cell's output area hold anything a reader would see? An output
     container is rarely *empty*: the driver moves Thebe's wrapper divs into it
     whether or not the execution printed anything. So "is there output" is a
     question about content — text, or something drawn — not about child nodes,
     and `:empty` in CSS cannot answer it. */
  function hasVisibleOutput(container) {
    var output = outputBox(container);
    if (!output) return false;
    if (output.textContent.replace(/\s+/g, '') !== '') return true;
    return !!output.querySelector('img, svg, canvas, table, iframe, video');
  }

  /* Thebe swaps the static highlight for a real editor while it bootstraps —
     BEFORE it has a server, and even when the launch then fails. So an editor
     says the script loaded, nothing more, and on its own it is not evidence that
     anything ran. */
  function hasEditor(container) {
    return !!(container.querySelector('.CodeMirror') || container.querySelector('.cm-editor'));
  }

  /* True when this page is local and the hub it would launch against is on another
     origin — the one configuration that cannot work, whatever the hub does. */
  function crossOriginHub() {
    try {
      var host = window.location.hostname;
      if (host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]') return false;
      var hub = window.thebeResolvedBinderUrl;
      return !!hub && hub.indexOf(window.location.origin) !== 0;
    } catch (e) {
      return false;
    }
  }

  /* The driver marks its containers `kernel-ready` when a kernel is actually
     connected. That is the only claim worth trusting for "this could have run". */
  function kernelReady() {
    return cells().some(function (container) {
      return container.classList.contains('kernel-ready');
    });
  }

  /* CodeMirror renders blank when it is reparented while hidden; nudging it after
     a move is the documented remedy. */
  function refreshEditors(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.CodeMirror'), function (node) {
      if (node.CodeMirror && typeof node.CodeMirror.refresh === 'function') {
        node.CodeMirror.refresh();
      }
    });
  }

  /* How this stack says an execution never happened. The kernel websocket is
     closed roughly every 30s by whatever sits in front of the hub, and an
     execute_request in flight when that happens is abandoned — Thebe writes
     "Failed to execute. Error: Canceled future for execute_request…" into the
     output. It looks like output, so without this a cancelled cell would be
     stamped with an execution count as though it had run. */
  var NOT_EXECUTED = /Canceled future|Failed to execute/i;

  /* ── the kernel's own answer ────────────────────────────────────────────
     Thebe keeps a cell object per runnable block and sets `executionCount` from
     the kernel's execute_reply — `content.execution_count`, the number a real
     notebook shows in `In [n]`. It is set after the execute future resolves, so
     it is the one signal that means "this cell ran", and the number it carries is
     the one Jupyter would print.

     Everything else available here is weaker than it looks: an output wrapper
     appears when a request is SENT, the container's `loading` class is cleared by
     the driver for every queued cell as soon as any one of them goes idle, and an
     editor exists before a kernel is ever asked for. Those all led to cells being
     ticked off as run when the connection had dropped and nothing had executed.
     The DOM link is `data-thebe-id`, which Thebe puts on the cell node it owns. */
  function thebeCells() {
    var thebe = window.thebe;
    var cells = thebe && thebe.notebook && thebe.notebook.cells;
    return cells && cells.length ? cells : null;
  }

  function thebeCellFor(container) {
    var cells = thebeCells();
    var node = container.querySelector('[data-thebe-id]');
    var id = node && node.getAttribute('data-thebe-id');
    if (!cells || !id) return null;
    for (var i = 0; i < cells.length; i++) {
      if (String(cells[i].id) === id) return cells[i];
    }
    return null;
  }

  /* The kernel's count for this cell, or null when it has never run — and also
     null when Thebe is not loaded at all, which is why callers ask
     kernelCountsAvailable() before reading "null" as "did not run". */
  function kernelCount(container) {
    var cell = thebeCellFor(container);
    return cell && typeof cell.executionCount === 'number' ? cell.executionCount : null;
  }

  function kernelCountsAvailable() {
    return !!thebeCells();
  }

  function thebeIdOf(container) {
    var node = container.querySelector('[data-thebe-id]');
    return node ? node.getAttribute('data-thebe-id') : null;
  }

  function outputText(container) {
    var output = resultBox(container);
    return output ? output.textContent : '';
  }

  function wait(ms) {
    return new Promise(function (resolve) { window.setTimeout(resolve, ms); });
  }

  /* ── the page keeps an ordinary code block ──────────────────────────────
     The runnable cell moves into the workbench and stays there, because Thebe
     rewrites what it activates: the highlighted code becomes a CodeMirror
     editor, with its own run/restart controls. That belongs in a notebook, not
     in the middle of a page of prose.

     So each block is cloned first — while it is still exactly what Hugo
     rendered — and the clone is what the page shows from then on: same markup,
     same highlighting, same copy and expand buttons, minus everything that only
     makes sense with a kernel behind it. The clone is deliberately NOT a
     `.thebe-container`, or the driver and this pane would treat it as a second
     runnable copy of the same cell; it is marked `.thebe-static` instead, which
     the two header helpers in baseof.html know about.

     Snapshotted at load rather than at mount: the dock waits for the CLI widget
     to publish its API, and a page with a saved session can have Thebe
     bootstrapping before that. */
  var snapshots = new WeakMap();

  function snapshotCells() {
    cells().forEach(function (container) {
      if (snapshots.has(container)) return;
      snapshots.set(container, container.cloneNode(true));
    });
  }

  function staticTwin(container) {
    var twin = (snapshots.get(container) || container).cloneNode(true);
    twin.classList.remove('thebe-container');
    twin.classList.add('thebe-static');
    /* One id per cell, and the runnable one keeps it: the driver looks its
       containers up by id. */
    twin.removeAttribute('id');
    /* Nothing in here is wired to a kernel. */
    Array.prototype.forEach.call(twin.querySelectorAll('.thebe-run-btn'), function (node) {
      node.parentNode.removeChild(node);
    });
    Array.prototype.forEach.call(twin.querySelectorAll('.thebe-output-container'), function (node) {
      node.parentNode.removeChild(node);
    });
    Array.prototype.forEach.call(twin.querySelectorAll('.thebe-cell'), function (node) {
      node.classList.remove('thebe-cell');
    });
    return twin;
  }

  function notebook(pane, api) {
    var state = {
      adopted: false,
      slots: [],          /* {container, id, deps, slot, input, prompt, marker, run, count} */
      running: false,
      /* Which steps have run in this kernel, by id. This is what the `depends`
         gating is answered from — not document order, and not the driver's
         button state, which says only "the first cell has run". */
      executed: {},
      execCount: 0
    };

    /* ---- pane chrome ---- */

    var toolbar = el('div', 'rwb-nb-toolbar');
    var runAll = el('button', 'rwb-btn rwb-nb-runall', '▶▶ Run all');
    runAll.type = 'button';
    runAll.title = 'Run every cell on this page, in dependency order';
    toolbar.appendChild(runAll);

    var clearAll = el('button', 'rwb-btn', 'Clear notebook');
    clearAll.type = 'button';
    clearAll.title = 'Clear every output and execution count. The kernel keeps its '
      + 'variables, so cells that have already run stay satisfied.';
    toolbar.appendChild(clearAll);

    /* The way out to the real thing, in the toolbar where a notebook's would be.
       The cells carry the URL as an attribute now that the page no longer shows a
       "Run in browser" link of its own. */
    var firstCell = cells()[0];
    var binderHref = (firstCell && firstCell.getAttribute('data-binder-url'))
      || (document.querySelector('.thebe-container a[href*="/binder/v2/"]') || {}).href;
    if (binderHref) {
      var open = el('a', 'rwb-nb-binder', 'Open in Binder');
      open.href = binderHref;
      open.target = '_blank';
      open.rel = 'noopener noreferrer';
      open.title = 'Open this example as a real notebook on BinderHub';
      toolbar.appendChild(open);
    }

    /* Kernel indicator, in a notebook's usual spot: filled while it works. */
    var kernelDot = el('span', 'rwb-nb-dot');
    var kernelState = el('span', 'rwb-nb-kernel', 'kernel not started');
    var kernelBox = el('span', 'rwb-nb-kernelbox');
    kernelBox.appendChild(kernelState);
    kernelBox.appendChild(kernelDot);
    toolbar.appendChild(kernelBox);
    pane.appendChild(toolbar);

    /* What the driver says about the session, where a reader can see it. Its own
       messages — "please refresh", the rate-limit notice — go into each cell's
       codetabs header, and the pane hides that header along with the rest of the
       page's chrome. So they were being written into the DOM and shown to nobody.
       This mirrors whatever is there, above the cells. */
    var notice = el('p', 'rwb-nb-notice');
    notice.setAttribute('role', 'status');
    notice.hidden = true;
    pane.appendChild(notice);

    function syncNotice() {
      var found = pane.querySelector('.session-expired-message, .thebe-rate-limit-message');
      var text = found ? found.textContent.trim() : '';
      notice.textContent = text;
      notice.hidden = !text;
    }

    /* The cells scroll; the toolbar does not. It used to be a sticky element
       inside the scrolling pane, which held up until the cells ran: Thebe's
       editors and output areas bring their own stacking, and they painted
       straight over the buttons — the toolbar looked transparent, with code
       sliding through it. Nothing outranks a box that isn't in the scroller. */
    var scroller = el('div', 'rwb-nb-scroll');
    pane.appendChild(scroller);

    /* Wheel over a cell, scroll the notebook.

       A cell is a CodeMirror editor once Thebe activates it, and its inner boxes
       overflow their own frames (.CodeMirror is 233px of content in a 199px box,
       with overflow hidden). An element like that is not scrollable by the
       reader, but it is scrollable in the DOM sense, and browsers differ on
       whether a wheel over it is absorbed there or passed to the scroller behind
       it. Headless Chrome passes it on; the reader's did not, which is what makes
       the notebook feel stuck a few cells from the end.

       So the scroller takes the event first and only hands it back if the thing
       under the pointer has room left in that direction. */
    scroller.addEventListener('wheel', function (event) {
      if (event.ctrlKey || !event.deltaY) return;
      var node = event.target;
      while (node && node !== scroller) {
        if (node.scrollHeight > node.clientHeight + 1
          && /auto|scroll/.test(window.getComputedStyle(node).overflowY)) {
          var room = event.deltaY > 0
            ? node.scrollHeight - node.clientHeight - node.scrollTop
            : node.scrollTop;
          if (room > 1) return;
        }
        node = node.parentNode;
      }
      var before = scroller.scrollTop;
      scroller.scrollTop += event.deltaY;
      /* Claimed only if it moved: at either end the page scrolls on, as it would
         anywhere else. */
      if (scroller.scrollTop !== before) event.preventDefault();
    }, { passive: false, capture: true });

    var list = el('div', 'rwb-nb-list');
    scroller.appendChild(list);

    /* The driver inserts and removes those messages as the session changes, so
       this watches for them rather than asking at a moment of its own choosing.
       One check per frame: this observer sees every output line a cell writes,
       and none of those are what it is looking for. */
    if (window.MutationObserver) {
      var noticePending = false;
      new MutationObserver(function () {
        if (noticePending) return;
        noticePending = true;
        window.requestAnimationFrame(function () {
          noticePending = false;
          syncNotice();
        });
      }).observe(pane, { childList: true, subtree: true });
    }

    /* ---- borrowing the page's cells ---- */

    function build() {
      var found = cells();
      list.replaceChildren();
      state.slots = found.map(function (container) {
        var title = cellTitle(container);
        var slot = el('div', 'rwb-nb-slot');

        /* A markdown cell, the way the notebook this page was generated from
           would have one: the step's prose, with its name as a quiet label. */
        var md = el('div', 'rwb-nb-md');
        if (title.description) {
          md.appendChild(el('p', 'rwb-nb-mdtext', title.description));
        }
        var meta = el('div', 'rwb-nb-meta');
        /* The step's name was shown here — "connect", "set_get_string" — and it
           is a build-time identifier, not something a reader needs: the prose
           above the cell already says what the cell does. It stays on the slot as
           an attribute, since the ordering rules are expressed in those names. */
        slot.dataset.cell = title.name;
        var marker = el('span', 'rwb-nb-marker', '');
        meta.appendChild(marker);
        var run = el('button', 'rwb-nb-run', '▶ Run');
        run.type = 'button';
        /* aria-disabled rather than `disabled`: a disabled control swallows
           pointer events, and with them the tooltip that explains why it cannot
           be used — which is the whole point of showing it. */
        run.addEventListener('click', function () {
          var slot = entryFor(container);
          var missing = slot ? missingPrereqs(slot) : [];
          if (missing.length) {
            api.setStatus('Run the first code snippet to start the kernel');
            return;
          }
          runOne(container);
        });
        meta.appendChild(run);
        md.appendChild(meta);
        slot.appendChild(md);

        /* The code cell: prompt gutter on the left, the adopted cell as input.
           Its own header, footer and buttons are hidden by the pane's CSS while
           it lives here, so what shows is the code and its output. */
        var cell = el('div', 'rwb-nb-cell');
        var prompt = el('div', 'rwb-nb-prompt', 'In [ ]:');
        var input = el('div', 'rwb-nb-input');
        cell.appendChild(prompt);
        cell.appendChild(input);
        slot.appendChild(cell);

        list.appendChild(slot);
        return {
          container: container, id: title.name, deps: dependsOn(container),
          slot: slot, input: input, prompt: prompt, marker: marker, run: run,
          count: 0
        };
      });
      adopt();
      watchKernel();
      watchOutputs();
      refreshGating();
    }

    /* Done once, at mount: the page gets the plain copy, the pane gets the cell.
       Moving a node keeps its listeners, its editor and Thebe's references to it
       intact, which is what lets the driver keep working unchanged. */
    function adopt() {
      if (state.adopted) return;
      state.slots.forEach(function (entry) {
        var twin = staticTwin(entry.container);
        entry.container.parentNode.insertBefore(twin, entry.container);
        entry.twin = twin;
        entry.input.appendChild(entry.container);
      });
      state.adopted = true;
    }

    /* ---- output prompts ----
       `Out[n]:` and the rule above it are drawn by CSS from the class and count
       set here, so a cell that printed nothing shows neither — as in a real
       notebook, where an execution with no result has an In line and nothing
       under it. This has to be watched rather than set once: output arrives after
       a run resolves (streams, and the driver's own move into the container), and
       the driver empties these containers when a kernel restarts. */

    function syncOutput(entry) {
      var output = outputBox(entry.container);
      if (!output) return;
      var filled = hasVisibleOutput(entry.container)
        && !NOT_EXECUTED.test(output.textContent);
      output.classList.toggle('rwb-nb-hasout', filled);
      /* The message still needs to be readable, just not dressed as a result. */
      output.classList.toggle('rwb-nb-failed',
        NOT_EXECUTED.test(output.textContent));
      if (filled && entry.count) {
        output.setAttribute('data-exec', String(entry.count));
      } else {
        output.removeAttribute('data-exec');
      }
    }

    function watchOutputs() {
      if (state.outputObserver) state.outputObserver.disconnect();
      state.outputObserver = new MutationObserver(function (records) {
        var touched = [];
        records.forEach(function (record) {
          state.slots.forEach(function (entry) {
            if (touched.indexOf(entry) < 0 && entry.container.contains(record.target)) {
              touched.push(entry);
            }
          });
        });
        touched.forEach(syncOutput);
      });
      state.slots.forEach(function (entry) {
        var output = outputBox(entry.container);
        if (output) {
          state.outputObserver.observe(output,
            { childList: true, subtree: true, characterData: true });
        }
        syncOutput(entry);
      });
    }

    /* ---- ordering ----
       The page declares its own rule — every cell but the first `depends` on
       `connect` — and that rule is exactly what makes running the others in any
       order safe. So a cell is never run before what it depends on: whatever is
       missing runs first, in dependency order, and the status line says so.
       Refusing the click instead would enforce the order by making the notebook
       less useful than the page it came from. */

    /* ── what has run survives a refresh, because the kernel does ──────────
       After a reconnect the variables `connect` defined are still there, so
       re-running it is a wasted execution and a wasted second. But that is only
       true while it is the SAME kernel, so the record is keyed on the kernel's
       id: a different kernel cannot read a record written for another one, and a
       restart — which keeps the id but wipes the variables — clears it below.
       sessionStorage rather than localStorage: it is about this tab's session,
       and it should not outlive it. */
    function kernelId() {
      var notebook = window.thebe && window.thebe.notebook;
      var session = notebook && notebook.session;
      return (session && session.kernel && session.kernel.id) || null;
    }

    function ranKey(id) {
      return 'rwbNotebookRan:' + id;
    }

    function loadExecuted() {
      var id = kernelId();
      if (!id || state.loadedFor === id) return;
      state.loadedFor = id;
      try {
        var stored = JSON.parse(window.sessionStorage.getItem(ranKey(id)) || 'null');
        if (!stored || !stored.length) return;
        stored.forEach(function (name) { state.executed[name] = true; });
        refreshGating();
      } catch (e) {
        /* nothing usable stored */
      }
    }

    function saveExecuted() {
      var id = kernelId();
      if (!id) return;
      try {
        window.sessionStorage.setItem(ranKey(id), JSON.stringify(Object.keys(state.executed)));
      } catch (e) {
        /* storage full or blocked; the pane just forgets across refreshes */
      }
    }

    function forgetExecuted(reason) {
      var id = kernelId();
      state.executed = {};
      state.loadedFor = null;
      if (id) {
        try { window.sessionStorage.removeItem(ranKey(id)); } catch (e) { /* ignore */ }
      }
      console.debug('[workbench] notebook: cleared what-has-run (' + reason + ')');
      refreshGating();
    }

    function entryById(id) {
      return state.slots.filter(function (e) { return e.id === id; })[0];
    }

    function missingPrereqs(entry, seen) {
      seen = seen || {};
      var needed = [];
      entry.deps.forEach(function (id) {
        var dep = entryById(id);
        if (!dep || seen[id] || state.executed[id]) return;
        seen[id] = true;
        missingPrereqs(dep, seen).forEach(function (e) {
          if (needed.indexOf(e) < 0) needed.push(e);
        });
        if (needed.indexOf(dep) < 0) needed.push(dep);
      });
      return needed;
    }

    /* A cell whose prerequisite has not run cannot be run: its variables do not
       exist yet, and the page's own buttons are disabled for the same reason. The
       Run button carries that — inert, and saying why on hover — rather than a
       "needs connect" chip naming a step the reader can no longer see. */
    function refreshGating() {
      state.slots.forEach(function (entry) {
        var missing = missingPrereqs(entry);
        entry.slot.classList.toggle('rwb-nb-gated', missing.length > 0);
        entry.run.classList.toggle('rwb-nb-run-off', missing.length > 0);
        entry.run.setAttribute('aria-disabled', missing.length ? 'true' : 'false');
        entry.run.title = missing.length
          ? 'Run the first code snippet to start the kernel'
          : 'Run this cell';
      });
    }

    /* ---- running ---- */

    function mark(entry, symbol, className) {
      entry.marker.textContent = symbol;
      entry.marker.className = 'rwb-nb-marker' + (className ? ' ' + className : '');
    }

    /* The execution count is the notebook's own record of what ran and in what
       order — the thing that makes `In [3]:` mean something — so it is only
       stamped on a run that actually produced something, and the [*] goes back to
       what it was when one did not. */
    function stampRunning(entry) {
      entry.prompt.textContent = 'In [*]:';
      entry.slot.classList.add('rwb-nb-active');
    }

    function stampDone(entry, ran, count) {
      entry.slot.classList.remove('rwb-nb-active');
      if (!ran) {
        entry.prompt.textContent = entry.count ? 'In [' + entry.count + ']:' : 'In [ ]:';
        return;
      }
      /* A count is only ever stamped on a cell that really ran, so the first one
         is proof that a kernel is live — and unlike `kernel-ready`, which the
         driver strips for the duration of each execution, it stays true. */
      state.kernelProven = true;
      state.executed[entry.id] = true;
      /* The kernel's own number when there is one, so these prompts read the same
         as they would in the notebook this page was generated from. Counting
         clicks is the fallback for when Thebe is not there to ask. */
      state.execCount = Math.max(state.execCount || 0,
        typeof count === 'number' ? count : 0) + (typeof count === 'number' ? 0 : 1);
      entry.count = typeof count === 'number' ? count : state.execCount;
      entry.prompt.textContent = 'In [' + entry.count + ']:';
      syncOutput(entry);
      saveExecuted();
      refreshGating();
    }

    /* Thebe reports per cell: {subject:'cell', id, status:'executing'|'idle'},
       and it emits `idle` from the same place it records the execution count —
       after the execute future resolves. That makes it the one "this cell's turn
       is over" signal that survives the driver's habit of clearing the `loading`
       class on EVERY queued cell as soon as any one of them goes idle.

       With it, a cell whose request was dropped is known the moment its turn
       ends, instead of after a 2.5s grace period — which, at the end of a Run
       all, is 2.5s of the whole notebook looking like it is still working.

       Hooked lazily: Thebe is loaded on the first run, so window.thebe does not
       exist when this pane is built. */
    function watchCellStatus() {
      if (state.statusHooked) return;
      var thebe = window.thebe;
      if (!thebe || typeof thebe.on !== 'function') return;
      state.statusHooked = true;
      state.phase = {};
      thebe.on('status', function (_event, data) {
        if (!data) return;
        /* A restart reuses the kernel id and throws away everything the cells
           defined, so anything remembered about what has run is now wrong. */
        if (data.subject === 'kernel'
          && /restart/i.test(String(data.status) + ' ' + String(data.message))) {
          forgetExecuted('the kernel restarted');
          return;
        }
        if (data.subject !== 'cell' || !data.id) return;
        state.phase[data.id] = { status: data.status, at: Date.now() };
      });
    }

    function cellWentIdle(id, since) {
      var phase = id && state.phase && state.phase[id];
      return !!(phase && phase.status === 'idle' && phase.at > since);
    }

    function entryFor(container) {
      return state.slots.filter(function (e) { return e.container === container; })[0];
    }

    function anyBusy() {
      return state.slots.some(function (e) { return isBusy(e.container); });
    }

    /* Click the cell's own run button — the driver owns what that means — then
       wait for it to stop reporting itself busy.

       options.queued says other cells were clicked alongside this one and the
       kernel is working through them, so "idle with nothing written" is a cell
       waiting its turn rather than one that failed.
       options.skipPrereqs says the caller has already satisfied the ordering. */
    function runOne(container, options) {
      options = options || {};
      watchCellStatus();
      loadExecuted();
      var entry = entryFor(container);
      if (!entry) return Promise.resolve('skipped');

      /* Nothing runs ahead of what it depends on. Until the first cell has run
         there is no kernel and no `r`, and the driver keeps the page's own
         dependent buttons disabled for exactly that reason — so this refuses
         rather than running the prerequisite on the reader's behalf, which would
         mean a click doing more than it said it would. Run all reaches the
         dependent cells by running the openers first, in order. */
      var prereqs = options.skipPrereqs ? [] : missingPrereqs(entry);
      if (prereqs.length) {
        api.setStatus('Run the first code snippet to start the kernel');
        return Promise.resolve('blocked');
      }

      var button = runButton(container);
      if (!button) return Promise.resolve('skipped');
      if (kernelUnavailable(container)) {
        mark(entry, 'kernel unavailable', 'rwb-nb-marker-error');
        api.setStatus('kernel unavailable');
        return Promise.resolve('unavailable');
      }
      if (button.disabled || button.classList.contains('text-slate-500')) {
        /* Its prerequisites have run and the driver still has this disabled: that
           is a kernel that never came up, not an ordering problem. */
        mark(entry, 'not runnable yet', 'rwb-nb-marker-blocked');
        return Promise.resolve('blocked');
      }

      mark(entry, '', 'rwb-nb-marker-running');
      stampRunning(entry);
      var outputBefore = outputSignature(container);
      var countBefore = kernelCount(container);
      /* Retries of 100ms each. */
      var lateTries = 0;
      var haveCounts = kernelCountsAvailable();
      var thebeId = thebeIdOf(container);
      var clickedAt = Date.now();
      button.click();

      /* A cell going busy and then idle is NOT evidence that it ran: when the
         Thebe script itself cannot load, the driver still cycles that state and
         still marks the container "activated", leaving no editor and no output.
         So settle first, then insist on evidence — output that changed, or a live
         editor for the cells declared no_output — and otherwise say the kernel did
         not respond instead of ticking the cell off. */
      var startBy = Date.now() + START_GRACE;
      var deadline = Date.now() + (options.timeout || RUN_TIMEOUT);
      var wentBusy = false;
      return new Promise(function (resolve) {
        (function settle() {
          /* The kernel answered for this cell: done, and with its number. */
          var countNow = kernelCount(container);
          if (countNow !== null && countNow !== countBefore) return finish(countNow);
          /* Output alone only settles the run when there is no count to wait for
             — otherwise the first byte of a stream would end the wait before the
             execution had finished. */
          if (!haveCounts && outputSignature(container) !== outputBefore) return finish();
          /* This cell's turn is over. Either the kernel counted it — read above —
             or it did not, and there is nothing left to wait for. */
          if (haveCounts && cellWentIdle(thebeId, clickedAt)) {
            return finish(kernelCount(container) === countBefore ? undefined : kernelCount(container));
          }
          /* Busy, or queued behind something else that is: either way the cell
             has not had its turn yet, so the grace period starts again. */
          if (isBusy(container) || (options.queued && anyBusy())) {
            if (isBusy(container)) wentBusy = true;
            startBy = Date.now() + START_GRACE;
            if (Date.now() > deadline) {
              mark(entry, 'still running', 'rwb-nb-marker-slow');
              entry.slot.classList.remove('rwb-nb-active');
              return resolve('timeout');
            }
            return window.setTimeout(settle, 250);
          }
          /* Without counts to go on, a cell declared no_output="true" has no
             output container either, so nothing about it can ever "change" and
             waiting out the grace period is 2.5 seconds spent learning nothing —
             2.5 seconds added to the end of a Run all. Its own busy-then-idle is
             the only channel it has left, so once seen, that is the answer. */
          if (!haveCounts && wentBusy && !outputBox(container)) return finish();
          /* Idle and nothing written yet: give it a moment, since a fast kernel
             can idle between the click and its first output. */
          if (Date.now() > startBy) return finish();
          window.setTimeout(settle, 100);
        })();

        function finish(count) {
          /* The kernel counted this execution: it ran, whatever it printed, and
             even if it raised — a traceback is a result. */
          if (typeof count === 'number') {
            state.kernelProven = true;
            mark(entry, '', 'rwb-nb-marker-done');
            stampDone(entry, true, count);
            return resolve('ran');
          }

          var moved = outputSignature(container) !== outputBefore;
          var dropped = moved && NOT_EXECUTED.test(outputText(container));

          /* An abandoned execute_request writes into the output area like a result
             does, so it has to be read before anything is claimed. It gets no
             count and does not satisfy anything that depends on this cell. */
          if (dropped) {
            mark(entry, 'not executed — connection dropped', 'rwb-nb-marker-error');
            stampDone(entry, false);
            report();
            return resolve('cancelled');
          }

          if (haveCounts) {
            /* The count is recorded after the execute future resolves, and both
               it and the output it produced can land a beat after this cell's
               turn looks over — the node-redis notebook printed OK and was
               called silent in the same breath. So nothing is said for another
               second and a half: ask for the number again, and let any output
               that is still on its way arrive. */
            var late = kernelCount(container);
            if (typeof late === 'number' && late !== countBefore) return finish(late);
            if (lateTries < LATE_COUNT_TRIES) {
              lateTries += 1;
              window.setTimeout(function () { finish(); }, 100);
              return;
            }
            /* Output and no number for it: it ran, and this kernel did not count
               it. Saying "no response" about a cell whose result is on screen is
               the report being wrong, not the cell. */
            if (moved) {
              state.kernelProven = true;
              mark(entry, '', 'rwb-nb-marker-done');
              stampDone(entry, true);
              return resolve('ran');
            }
            /* Counts were available, this cell's did not move, and it wrote
               nothing: the kernel never finished it. Reporting that plainly is
               the whole point — the earlier version read an empty output wrapper
               as proof and stamped In[n] on executions dropped mid-flight. */
            mark(entry, 'no response', 'rwb-nb-marker-error');
            stampDone(entry, false);
            state.kernelSilent = true;
            report();
            return resolve('no-response');
          }

          /* No Thebe to ask (an older bundle, or a page where it never loaded):
             fall back to what the DOM shows. Output is evidence, and so is a
             finished run of a cell that has nowhere to put output. */
          if (moved) {
            state.kernelProven = true;
            mark(entry, '', 'rwb-nb-marker-done');
            stampDone(entry, true);
            return resolve('ran');
          }
          if (!outputBox(container) && (kernelReady() || state.kernelProven)) {
            mark(entry, '', 'rwb-nb-marker-done');
            stampDone(entry, true);
            return resolve('ran');
          }
          mark(entry, 'no response', 'rwb-nb-marker-error');
          stampDone(entry, false);
          state.kernelSilent = true;
          report();
          return resolve('no-response');
        }
      });
    }

    /* Run all, the way a notebook's own does it: the kernel is handed the whole
       queue and works through it in order. Only the opening cells are waited for
       — they carry the kernel start, and until the first has run the driver keeps
       every dependent button disabled — after which the rest are clicked back to
       back and each settles on its own. */
    function runEverything() {
      if (state.running) return Promise.resolve();
      state.running = true;
      runAll.disabled = true;
      api.setStatus('running the notebook…');

      var openers = state.slots.filter(function (entry) { return !entry.deps.length; });
      var rest = state.slots.filter(function (entry) { return entry.deps.length > 0; });

      return openers.reduce(function (chain, entry) {
        return chain.then(function () {
          return runOne(entry.container, { timeout: FIRST_RUN_TIMEOUT });
        });
      }, Promise.resolve()).then(function () {
        var pending = [];
        return rest.reduce(function (chain, entry) {
          return chain.then(function () {
            pending.push(runOne(entry.container, { queued: true, skipPrereqs: true }));
            return wait(CLICK_STAGGER);
          });
        }, Promise.resolve()).then(function () { return Promise.all(pending); });
      }).then(function () {
        state.running = false;
        runAll.disabled = false;
        refreshGating();
        api.setStatus(kernelText());
      }, function () {
        state.running = false;
        runAll.disabled = false;
      });
    }

    /* Clear the notebook: every output, every In[]/Out[] count. The kernel is
       left alone — its variables, and so which cells count as run, are exactly as
       they were — which makes this Jupyter's "clear all outputs" rather than a
       restart. A restart means a new pod, which is not something to spend on a
       tidy-up. */
    function clearNotebook() {
      state.slots.forEach(function (entry) {
        /* Ask Thebe to clear, do not empty the DOM.

           attachToDOM() puts Thebe's live OutputArea widget inside a
           `.thebe-output` node in the cell, and the driver moves that node into
           the output container. Emptying the container therefore DETACHES the
           widget Thebe renders into: the kernel still runs, still counts the
           execution, and its result lands in an orphaned node — a cleared
           notebook that appeared to run and print nothing ever after.

           cell.clear() is `this.area.model.clear()`: the outputs go, the widget
           stays attached, and the kernel and its variables are untouched. */
        var cell = thebeCellFor(entry.container);
        var output = outputBox(entry.container);
        if (cell && typeof cell.clear === 'function') {
          cell.clear();
        } else if (output) {
          /* No Thebe to ask: nothing is attached, so the DOM is all there is. */
          output.replaceChildren();
        }
        if (output) {
          output.removeAttribute('data-exec');
          output.classList.remove('rwb-nb-hasout', 'rwb-nb-failed');
        }
        entry.count = 0;
        entry.prompt.textContent = 'In [ ]:';
        entry.slot.classList.remove('rwb-nb-active');
        mark(entry, '', '');
      });
      state.execCount = 0;
      refreshGating();
      report();
    }

    runAll.addEventListener('click', runEverything);
    clearAll.addEventListener('click', clearNotebook);

    /* ---- kernel state, read off the driver's own classes ---- */

    function kernelText() {
      var found = cells();
      if (!found.length) return 'no cells on this page';
      /* A local page pointed at a hub on another origin can never launch: that
         endpoint sends no CORS headers, so the browser discards the build stream.
         Worth saying here, because Thebe can only report a lost connection. */
      if (crossOriginHub()) return 'hub is cross-origin — needs a same-origin proxy';
      if (found.some(kernelUnavailable)) return 'kernel unavailable';
      /* A cell was clicked and did nothing: the driver's own classes cannot tell
         us that, so a run reports it and it outranks them. */
      if (state.kernelSilent) return 'kernel did not respond';
      if (found.some(function (c) { return c.classList.contains('reconnecting'); })) {
        return 'kernel reconnecting…';
      }
      if (found.some(function (c) { return c.classList.contains('loading'); })) {
        return 'starting the kernel…';
      }
      if (kernelReady() || state.kernelProven) return 'kernel ready';
      /* `activated` only means the editors are up: the driver sets it while
         bootstrapping, and it survives a launch that failed. Reporting it as
         "kernel attached" claimed a kernel that was never there. */
      if (found.some(function (c) { return c.classList.contains('activated'); })) {
        return 'editors ready, no kernel yet';
      }
      return 'kernel not started';
    }

    function report() {
      watchCellStatus();
      loadExecuted();
      var text = kernelText();
      kernelState.textContent = text;
      /* Fills the kernel dot while anything is actually working. */
      pane.classList.toggle('rwb-nb-busy',
        !!state.running || cells().some(function (c) { return c.classList.contains('loading'); }));
      /* Only speak for the dock's status line while this pane is the one showing:
         the terminal pane's keyspace counts have the same line. */
      if (state.visible) api.setStatus(text);
    }

    function watchKernel() {
      if (state.observer) state.observer.disconnect();
      state.observer = new MutationObserver(report);
      cells().forEach(function (container) {
        state.observer.observe(container, { attributes: true, attributeFilter: ['class'] });
        var button = runButton(container);
        if (button) {
          state.observer.observe(button, { attributes: true, attributeFilter: ['class'] });
        }
      });
      report();
    }

    build();

    return {
      onShow: function (_pane, shown) {
        state.visible = shown;
        if (shown) {
          /* CodeMirror renders blank if it was reparented or resized while
             hidden; a nudge on the way in is the documented remedy. */
          state.slots.forEach(function (entry) { refreshEditors(entry.container); });
          report();
        }
      },

      /* What "Try it" does: show the notebook, with this cell in view. */
      openCell: function (id) {
        api.open();
        api.show();
        var entry = id ? entryById(id) : null;
        window.setTimeout(function () {
          state.slots.forEach(function (slot) { refreshEditors(slot.container); });
          if (entry) entry.slot.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, 120);
        return true;
      },
      /* For tests: the ordering and the counts are the two things worth asserting
         on, and both are private state otherwise. */
      _state: state
    };
  }

  function mount() {
    if (!cells().length) return;
    var api = window.RedisWorkbench;
    if (!api || !api.addPane) return false;

    var controller = null;
    var entry = api.addPane({
      id: 'notebook',
      label: 'Notebook',
      onMount: function (pane, paneApi) { controller = notebook(pane, paneApi); },
      onShow: function (pane, shown) { if (controller) controller.onShow(pane, shown); }
    });
    if (!entry) return false;
    window.RedisWorkbenchNotebook = controller;
    return true;
  }

  function mountWhenReady() {
    if (!cells().length) return;
    var waited = 0;
    (function poll() {
      if (mount()) return;
      waited += MOUNT_STEP;
      if (waited < MOUNT_DEADLINE) window.setTimeout(poll, MOUNT_STEP);
    })();
  }

  /* Delegated, and installed even where the dock cannot mount: on a backend
     whose CLI widget has no API there is no workbench to open, and the button
     then does what the old "Run in browser" link did rather than nothing. */
  function wireTryIt() {
    document.addEventListener('click', function (event) {
      var button = event.target.closest ? event.target.closest('.thebe-tryit') : null;
      if (!button) return;
      event.preventDefault();
      var notebook = window.RedisWorkbenchNotebook;
      if (notebook && typeof notebook.openCell === 'function') {
        notebook.openCell(button.getAttribute('data-cell'));
        return;
      }
      var fallback = button.getAttribute('data-binder-url');
      if (fallback) window.open(fallback, '_blank', 'noopener');
    });
  }

  function start() {
    snapshotCells();
    wireTryIt();
    mountWhenReady();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

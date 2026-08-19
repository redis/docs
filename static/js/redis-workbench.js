/* =========================================================================
   Redis workbench  —  static/js/redis-workbench.js

   A console docked to the bottom of the page, in the spirit of the developer
   workbenches other API docs carry: a slim "Workbench" bar spanning the window,
   which expands into

     * a live terminal — the same widget the docs embed inline — and
     * a key browser, Redis Insight style, listing the keys in this page's
       sandbox with their type, TTL, size and a type-aware value view.

   The bar is always there (on pages that have Redis examples) and the reader
   expands or collapses it whenever they like, dragging its top edge to resize;
   the state follows them across pages. "Try it" on a code block opens it and
   runs that snippet in it — there is one dock per page, not one per snippet, so
   each "Try it" runs into the same console, on top of what is already there.

   ── how it talks to Redis ────────────────────────────────────────────────
   Everything goes through `window.RedisCli`, the small API published by the
   canonical widget (redis.io/cli/static/js/cli.js, loaded via the js/cli.js
   shim). That is deliberate: the session handshake and the reply renderer live
   there, and re-implementing either here is exactly how the two would drift.
   So this file never fetches, and never formats a reply itself.

   Sharing that session is what makes the browser possible at all: keys are
   namespaced per session on the backend, so introspection commands run here see
   the same keyspace the inline terminals write to.

   ── why keys are discovered, not scanned ─────────────────────────────────
   The obvious implementation — SCAN the keyspace — does not work on this
   backend. The sandbox database is shared by every visitor (~300k keys) and the
   backend rewrites SCAN to `MATCH <session>:*`, which Redis filters *after*
   walking the table: one iteration with COUNT 10000 comes back empty, so
   finding a handful of keys would take dozens of round trips.

   Instead the workbench asks the server where each executed command put its
   keys — `COMMAND GETKEYS <command>` — and tracks those names. That is exact,
   costs one batched round trip, and covers commands typed at the prompt too.
   Indexes come from FT._LIST, which the backend already scopes to the session.

   Nothing is probed until the reader actually opens the dock: batches that run
   while it is closed (every inline example auto-runs on load) are only
   remembered, and discovery catches up on them in one pass at first open.
   ========================================================================= */
(function () {
  "use strict";

  /* Backend limits and budgets ------------------------------------------- */

  /* The backend rejects batches larger than MAX_BATCH_SIZE (20 by default), so
     every multi-command probe here is chunked to that. */
  var MAX_BATCH = 20;

  /* Batch origin label, for the backend's usage metrics. Introspection is not a
     command the reader chose to run, so it is reported separately from
     'interactive'/'preset' and excluded from page attribution. */
  var SOURCE = 'workbench';

  /* How much of a collection / string a value view pulls. Enough to show the
     shape of a docs example, small enough to stay one batch. */
  var PREVIEW_ITEMS = 100;
  var PREVIEW_ENTRIES = 20;      /* stream entries (each is multi-line) */
  var PREVIEW_BYTES = 2048;      /* of a string value */

  /* Every tracked key costs two commands per keyspace sweep, so the list is
     capped; the oldest are forgotten first. */
  var MAX_TRACKED_KEYS = 150;

  /* Commands remembered while the dock is closed, for the catch-up pass at first
     open. Bounded because a long page of examples could otherwise queue a very
     large first probe. */
  var MAX_PENDING_COMMANDS = 120;

  /* Panel geometry, in pixels. The dock opens at DEFAULT_HEIGHT and the reader
     drags its top edge between MIN_HEIGHT and maxHeight(), which is measured
     against the sticky site header — see maxHeight() for why that matters. */
  var DEFAULT_HEIGHT = 380;
  var MIN_HEIGHT = 200;

  /* Breathing room between the top of the dock and the header above it. */
  var HEADER_GAP = 8;

  /* A header taller than this is treated as suspect (a mis-measure, or a page
     with an unusual banner) rather than allowed to squeeze the panel to nothing. */
  var MAX_HEADER_ALLOWANCE = 160;

  /* Where the open/closed state and height are remembered, so the dock follows
     the reader from page to page the way a docked console should. */
  var STORAGE_KEY = 'redisWorkbenchDock';

  /* Commands that never carry a key, so the COMMAND GETKEYS probe is skipped.
     Anything not listed is probed and simply yields nothing if it has no keys —
     the list is an optimisation, not a source of truth. */
  var KEYLESS = {
    ping: 1, echo: 1, info: 1, command: 1, config: 1, client: 1, time: 1,
    dbsize: 1, flushall: 1, flushdb: 1, select: 1, hello: 1, acl: 1, auth: 1,
    'ft._list': 1, 'ft.config': 1, 'ft.create': 1, 'ft.search': 1,
    'ft.aggregate': 1, 'ft.dropindex': 1, 'ft.info': 1, 'ft.explain': 1,
    'ft.profile': 1, 'ft.cursor': 1, 'ft.spellcheck': 1, 'ft.tagvals': 1,
    'ts.queryindex': 1, 'ts.mget': 1, 'ts.mrange': 1, 'ts.mrevrange': 1
  };

  /* Badge label and colour per type, keyed by the TYPE reply. The module names
     are the server's own, read off a live sandbox rather than guessed — e.g.
     top-k answers `TopK-TYPE` and a cuckoo filter `MBbloomCF`. A type missing
     here still lists and opens; it just shows the raw name on a neutral badge. */
  var TYPES = {
    string:        { label: 'string', tone: 'str' },
    list:          { label: 'list', tone: 'list' },
    set:           { label: 'set', tone: 'set' },
    zset:          { label: 'sorted set', tone: 'zset' },
    hash:          { label: 'hash', tone: 'hash' },
    stream:        { label: 'stream', tone: 'stream' },
    'ReJSON-RL':   { label: 'JSON', tone: 'json' },
    'TSDB-TYPE':   { label: 'time series', tone: 'ts' },
    'MBbloom--':   { label: 'Bloom filter', tone: 'probabilistic' },
    'MBbloomCF':   { label: 'cuckoo filter', tone: 'probabilistic' },
    'CMSk-TYPE':   { label: 'count-min sketch', tone: 'probabilistic' },
    'TopK-TYPE':   { label: 'top-k', tone: 'probabilistic' },
    'TDIS-TYPE':   { label: 't-digest', tone: 'probabilistic' },
    vectorset:     { label: 'vector set', tone: 'vector' }
  };

  /* ---------------------------------------------------------------- utils -- */

  function cli() {
    return window.RedisCli;
  }

  /* True when the canonical widget exposes the API this file needs. The docs
     deploy independently of the /cli backend, so a docs build can be live
     against an older backend; callers fall back to the external CLI then. */
  function available() {
    var api = cli();
    return !!(api && api.execute && api.formatReply && api.createCli && api.run);
  }

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  var SVG_NS = 'http://www.w3.org/2000/svg';

  function svgIcon(className, attrs, paths) {
    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 16 16');
    svg.setAttribute('aria-hidden', 'true');
    Object.keys(attrs).forEach(function (name) { svg.setAttribute(name, attrs[name]); });
    if (className) svg.setAttribute('class', className);
    paths.forEach(function (d) {
      var path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      svg.appendChild(path);
    });
    return svg;
  }

  /* Points down as drawn; the CSS rotates it for the other state. */
  var CHEVRON = 'M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06'
    + 'l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z';

  function chevron(className) {
    return svgIcon(className, { fill: 'currentColor' }, [CHEVRON]);
  }

  /* The diagonal double-headed arrow for full height, and its inward twin for the
     way back: a stroked line per direction plus a two-segment head at its tip.
     Drawn from explicit geometry rather than a remembered icon-set path, because
     both states have to be *visibly* different and getting that wrong is silent —
     an outward-pointing "restore" icon looks exactly like a control that does
     nothing. Heads at the outer corners point out; heads at the centre point in. */
  var ARROWS_OUT = [
    'M8.6 7.4 13.6 2.4', 'M9.6 2.4h4v4',      /* to the top-right corner */
    'M7.4 8.6 2.4 13.6', 'M6.4 13.6h-4v-4'    /* to the bottom-left corner */
  ];
  var ARROWS_IN = [
    'M13.6 2.4 8.6 7.4', 'M8.6 3.4v4h4',      /* from the top-right, inward */
    'M2.4 13.6 7.4 8.6', 'M7.4 12.6v-4h-4'    /* from the bottom-left, inward */
  ];

  function resizeArrows(maximized) {
    return svgIcon('rwb-icon', {
      fill: 'none',
      stroke: 'currentColor',
      'stroke-width': '1.3',
      'stroke-linecap': 'round',
      'stroke-linejoin': 'round'
    }, maximized ? ARROWS_IN : ARROWS_OUT);
  }

  /* Quote an argument the way the backend's shlex.split expects. Key names from
     a docs example are usually bare, but they can hold spaces or quotes. */
  function quote(arg) {
    var value = String(arg);
    if (/^[A-Za-z0-9_:.@\-+*$#\/{}\[\]]+$/.test(value)) return value;
    return '"' + value.replace(/([\\"$`])/g, '\\$1') + '"';
  }

  /* Run commands in this page's session, chunked to the backend's batch limit.
     Always resolves: a transport failure becomes error replies, so a probe can
     never leave the UI hanging on a rejected promise. */
  function run(commands) {
    var chunks = [];
    for (var i = 0; i < commands.length; i += MAX_BATCH) {
      chunks.push(commands.slice(i, i + MAX_BATCH));
    }
    return chunks.reduce(function (chain, chunk) {
      return chain.then(function (acc) {
        return cli().execute(chunk, '', SOURCE).then(function (reply) {
          var replies = (reply && reply.replies) ? reply.replies.slice() : [];
          /* A batch the backend refuses outright — over the batch limit, say —
             answers with a single error object and no `replies` array at all.
             Pad to one reply per command so callers that read replies
             positionally can never have their indexes shift underneath them. */
          while (replies.length < chunk.length) {
            replies.push({
              error: true,
              value: (reply && reply.value) || 'no reply for this command'
            });
          }
          return acc.concat(replies);
        }, function (err) {
          return acc.concat(chunk.map(function () {
            return { error: true, value: err && err.message ? err.message : 'request failed' };
          }));
        });
      });
    }, Promise.resolve([]));
  }

  /* The value of a reply, or null when it errored / is missing. */
  function ok(reply) {
    return reply && !reply.error ? reply.value : null;
  }

  /* One cell of a value table. Plain strings and numbers are shown as-is (a
     table reads better unquoted); anything else — nil, binary {$bin}, nested
     arrays — goes through the terminal's own renderer so it looks exactly like
     redis-cli. */
  function cellText(value) {
    if (typeof value === 'string') return value;
    if (typeof value === 'number') return String(value);
    if (value && typeof value === 'object') {
      if (typeof value.$int === 'string') return value.$int;
      if (typeof value.$status === 'string') return value.$status;
    }
    return cli().formatReply(value);
  }

  /* [a, b, c, d] -> [[a, b], [c, d]]; the RESP2 shape of HGETALL, ZRANGE
     WITHSCORES, TS.INFO and friends. */
  function pairs(flat) {
    var out = [];
    if (!Array.isArray(flat)) return out;
    for (var i = 0; i < flat.length - 1; i += 2) {
      out.push([flat[i], flat[i + 1]]);
    }
    return out;
  }

  /* The [cursor, [items]] reply of a *SCAN family command. */
  function scanItems(value) {
    return Array.isArray(value) && Array.isArray(value[1]) ? value[1] : [];
  }

  function plural(n, one, many) {
    return n + ' ' + (n === 1 ? one : (many || one + 's'));
  }

  /* Seconds -> a short human duration, for TTLs. */
  function humanTtl(seconds) {
    if (seconds === -1 || seconds === null) return 'no expiry';
    if (seconds === -2) return 'expired';
    if (typeof seconds !== 'number') return String(seconds);
    if (seconds < 60) return seconds + 's';
    if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
    if (seconds < 86400) return Math.floor(seconds / 3600) + 'h ' + Math.floor((seconds % 3600) / 60) + 'm';
    return Math.floor(seconds / 86400) + 'd ' + Math.floor((seconds % 86400) / 3600) + 'h';
  }

  function humanBytes(bytes) {
    if (typeof bytes !== 'number') return null;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KiB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MiB';
  }

  /* ------------------------------------------------------- key discovery -- */

  /* Ask the server which keys these commands touch. One `COMMAND GETKEYS` per
     command; the server errors with "The command has no key arguments" for
     keyless ones, which is expected and ignored. */
  function discoverKeys(commands) {
    var probes = [];
    var seen = {};
    commands.forEach(function (command) {
      var text = String(command).trim();
      if (!text || seen[text]) return;
      seen[text] = 1;
      var name = text.split(/\s+/)[0].toLowerCase();
      if (KEYLESS[name]) return;
      probes.push('COMMAND GETKEYS ' + text);
    });
    if (!probes.length) return Promise.resolve([]);
    return run(probes).then(function (replies) {
      var found = [];
      replies.forEach(function (reply) {
        var value = ok(reply);
        if (!Array.isArray(value)) return;
        value.forEach(function (key) {
          if (typeof key === 'string' && found.indexOf(key) === -1) found.push(key);
        });
      });
      return found;
    });
  }

  /* Read the whole keyspace view in as few round trips as possible: TYPE and TTL
     for every tracked key plus the session's index list go in one sweep, then a
     second one for the sizes, which can only be asked for once the type is
     known (STRLEN vs LLEN vs ...). Keys whose TYPE is 'none' were deleted or
     expired and are dropped. */
  function readKeyspace(trackedKeys) {
    /* Snapshot the caller's list. Replies are read positionally, and the tracked
       set keeps growing while this is in flight (discovery runs off every batch),
       so holding the live array would shift every index under us: a key created
       mid-sweep used to render with another command's reply as its type. */
    var names = trackedKeys.slice();
    var commands = [];
    names.forEach(function (name) {
      commands.push('TYPE ' + quote(name));
      commands.push('TTL ' + quote(name));
    });
    commands.push('FT._LIST');

    return run(commands).then(function (replies) {
      var listed = ok(replies[names.length * 2]);
      var indexes = Array.isArray(listed) ? listed.filter(function (name) {
        return typeof name === 'string';
      }) : [];

      var described = names.map(function (name, i) {
        var type = ok(replies[i * 2]);
        return {
          name: name,
          /* TYPE answers a simple string; anything else means the reply was an
             error or was not the one asked for, and the key is skipped rather
             than rendered with a nonsense badge. */
          type: typeof type === 'string' ? type : null,
          ttl: ok(replies[i * 2 + 1])
        };
      }).filter(function (key) {
        return key.type && key.type !== 'none';
      });

      var sizers = [];
      described.forEach(function (key) {
        var command = sizeCommand(key.type, key.name);
        if (command) sizers.push({ key: key, command: command });
      });
      if (!sizers.length) return { keys: described, indexes: indexes };
      return run(sizers.map(function (s) { return s.command; })).then(function (sizes) {
        sizers.forEach(function (s, i) {
          s.key.size = ok(sizes[i]);
          s.key.sizeLabel = sizeLabel(s.key.type, s.key.size);
        });
        return { keys: described, indexes: indexes };
      });
    });
  }

  function sizeCommand(type, name) {
    var key = quote(name);
    switch (type) {
      case 'string': return 'STRLEN ' + key;
      case 'list': return 'LLEN ' + key;
      case 'set': return 'SCARD ' + key;
      case 'zset': return 'ZCARD ' + key;
      case 'hash': return 'HLEN ' + key;
      case 'stream': return 'XLEN ' + key;
      case 'ReJSON-RL': return 'JSON.TYPE ' + key;
      default: return null;
    }
  }

  function sizeLabel(type, size) {
    if (size === null || size === undefined) return null;
    switch (type) {
      case 'string': return typeof size === 'number' ? humanBytes(size) : null;
      case 'list': return plural(size, 'item');
      case 'set': return plural(size, 'member');
      case 'zset': return plural(size, 'member');
      case 'hash': return plural(size, 'field');
      case 'stream': return plural(size, 'entry', 'entries');
      case 'ReJSON-RL': return cellText(size);
      default: return null;
    }
  }

  /* -------------------------------------------------------- value views --- */

  /* The commands that populate a key's value view, and how to shape their
     replies. Returns {commands, build(replies) -> view}, where a view is
     {kind, ...} for renderValue below.

     The command list is shown to the reader ("Read with"), which makes the
     choice of command part of what the workbench teaches — so each type reads
     the way someone would read it by hand (GET, HGETALL, SMEMBERS, the whole
     LRANGE) whenever the value fits in the preview. The bounded and cursor forms
     appear only when they are genuinely doing the work of truncating something
     too big to show, and the view then says how much it left out. `size` comes
     from the keyspace sweep (STRLEN, HLEN, ...); when it is unknown the bounded
     form is the safe default. */
  function valueProbe(name, type, size) {
    var key = quote(name);
    var known = typeof size === 'number';
    switch (type) {
      case 'string':
        if (known && size <= PREVIEW_BYTES) {
          return {
            commands: ['GET ' + key],
            build: function (r) {
              return { kind: 'text', text: cellText(ok(r[0])) };
            }
          };
        }
        return {
          commands: ['GETRANGE ' + key + ' 0 ' + (PREVIEW_BYTES - 1)],
          build: function (r) {
            return {
              kind: 'text',
              text: cellText(ok(r[0])),
              limited: known ? { shown: humanBytes(PREVIEW_BYTES), of: humanBytes(size) } : null
            };
          }
        };
      case 'hash':
        if (known && size <= PREVIEW_ITEMS) {
          return {
            commands: ['HGETALL ' + key],
            build: function (r) {
              return { kind: 'table', head: ['Field', 'Value'], rows: pairs(ok(r[0])) };
            }
          };
        }
        return {
          commands: ['HSCAN ' + key + ' 0 COUNT ' + PREVIEW_ITEMS],
          build: function (r) {
            var rows = pairs(scanItems(ok(r[0])));
            return {
              kind: 'table',
              head: ['Field', 'Value'],
              rows: rows,
              /* COUNT is a hint, not a limit: one HSCAN pass often returns more
                 than asked for, sometimes the lot. Only claim a partial view when
                 the reply really is short of the total. */
              limited: known && rows.length < size
                ? { shown: rows.length, of: plural(size, 'field') } : null
            };
          }
        };
      case 'list':
        return {
          commands: ['LRANGE ' + key + ' 0 '
            + (known && size <= PREVIEW_ITEMS ? '-1' : String(PREVIEW_ITEMS - 1))],
          build: function (r) {
            var items = ok(r[0]) || [];
            return {
              kind: 'table',
              head: ['Index', 'Value'],
              rows: items.map(function (item, i) { return [i, item]; }),
              limited: known && size > PREVIEW_ITEMS
                ? { shown: items.length, of: plural(size, 'item') } : null
            };
          }
        };
      case 'set':
        if (known && size <= PREVIEW_ITEMS) {
          return {
            commands: ['SMEMBERS ' + key],
            build: function (r) {
              return {
                kind: 'table',
                head: ['Member'],
                rows: (ok(r[0]) || []).map(function (m) { return [m]; })
              };
            }
          };
        }
        return {
          commands: ['SSCAN ' + key + ' 0 COUNT ' + PREVIEW_ITEMS],
          build: function (r) {
            var rows = scanItems(ok(r[0])).map(function (m) { return [m]; });
            return {
              kind: 'table',
              head: ['Member'],
              rows: rows,
              /* As above: SSCAN's COUNT is a hint, so trust the reply's length. */
              limited: known && rows.length < size
                ? { shown: rows.length, of: plural(size, 'member') } : null
            };
          }
        };
      case 'zset':
        return {
          commands: ['ZRANGE ' + key + ' 0 '
            + (known && size <= PREVIEW_ITEMS ? '-1' : String(PREVIEW_ITEMS - 1))
            + ' WITHSCORES'],
          build: function (r) {
            var rows = pairs(ok(r[0]));
            return {
              kind: 'table',
              head: ['Member', 'Score'],
              rows: rows,
              limited: known && size > PREVIEW_ITEMS
                ? { shown: rows.length, of: plural(size, 'member') } : null
            };
          }
        };
      case 'stream':
        return {
          commands: ['XRANGE ' + key + ' - +'
            + (known && size <= PREVIEW_ENTRIES ? '' : ' COUNT ' + PREVIEW_ENTRIES)],
          build: function (r) {
            var entries = ok(r[0]) || [];
            return {
              kind: 'entries',
              rows: entries.map(function (entry) {
                return { id: cellText(entry[0]), fields: pairs(entry[1]) };
              }),
              limited: known && size > PREVIEW_ENTRIES
                ? { shown: entries.length, of: plural(size, 'entry', 'entries') } : null
            };
          }
        };
      case 'ReJSON-RL':
        return {
          commands: ['JSON.GET ' + key + ' $'],
          build: function (r) {
            var raw = ok(r[0]);
            var text = typeof raw === 'string' ? raw : cellText(raw);
            try {
              text = JSON.stringify(JSON.parse(text), null, 2);
            } catch (err) { /* not parseable: show it as returned */ }
            return { kind: 'text', text: text, mono: true };
          }
        };
      case 'TSDB-TYPE':
        return {
          commands: ['TS.INFO ' + key, 'TS.RANGE ' + key + ' - + COUNT ' + PREVIEW_ITEMS],
          build: function (r) {
            var samples = ok(r[1]) || [];
            return {
              kind: 'sections',
              sections: [
                { title: 'Info', kind: 'table', head: ['Field', 'Value'], rows: pairs(ok(r[0])) },
                {
                  title: 'Samples',
                  kind: 'table',
                  head: ['Timestamp', 'Value'],
                  rows: samples.map(function (s) { return [s[0], s[1]]; })
                }
              ]
            };
          }
        };
      case 'vectorset':
        return {
          commands: ['VINFO ' + key],
          build: function (r) {
            return { kind: 'table', head: ['Field', 'Value'], rows: pairs(ok(r[0])) };
          }
        };
      case 'TopK-TYPE':
        /* Top-k is the one probabilistic type that does keep its members. */
        return {
          commands: ['TOPK.INFO ' + key, 'TOPK.LIST ' + key + ' WITHCOUNT'],
          build: function (r) {
            return {
              kind: 'sections',
              sections: [
                { title: 'Info', kind: 'table', head: ['Field', 'Value'], rows: pairs(ok(r[0])) },
                { title: 'Top items', kind: 'table', head: ['Item', 'Count'], rows: pairs(ok(r[1])) }
              ]
            };
          }
        };
      default:
        /* The remaining probabilistic types (and anything a future module adds)
           have no enumerable value — not storing the members is the point. Their
           INFO reply is the useful view. */
        var infoCommand = {
          'MBbloom--': 'BF.INFO', 'MBbloomCF': 'CF.INFO', 'CMSk-TYPE': 'CMS.INFO',
          'TDIS-TYPE': 'TDIGEST.INFO'
        }[type];
        if (!infoCommand) return null;
        return {
          commands: [infoCommand + ' ' + key],
          build: function (r) {
            return { kind: 'table', head: ['Field', 'Value'], rows: pairs(ok(r[0])) };
          }
        };
    }
  }

  /* ------------------------------------------------------------- the dock -- */

  var dock = {
    root: null,
    isOpen: false,
    height: DEFAULT_HEIGHT,
    maximized: false,
    /* keyspace model */
    keys: [],
    known: [],
    indexes: [],
    selected: null,
    truncated: false,
    /* command batches seen while closed, discovered at first open */
    pending: [],
    caughtUp: false,
    fullCliUrl: '',
    busy: 0
  };

  dock.build = function () {
    var self = this;
    var root = el('div', 'rwb');
    root.setAttribute('role', 'region');
    root.setAttribute('aria-label', 'Redis workbench');
    this.root = root;

    /* The bar: the only part visible when collapsed. Clicking it toggles. */
    var bar = el('div', 'rwb-bar');
    this.bar = bar;

    var toggle = el('button', 'rwb-toggle');
    toggle.type = 'button';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.appendChild(el('span', 'rwb-dot'));
    toggle.appendChild(el('span', 'rwb-title', 'Workbench'));
    this.status = el('span', 'rwb-status', 'sandbox ready');
    this.status.setAttribute('role', 'status');
    toggle.appendChild(this.status);
    toggle.addEventListener('click', function () { self.toggle(); });
    bar.appendChild(toggle);

    var actions = el('div', 'rwb-actions');
    actions.appendChild(this.button('Clear keys',
      'Empty the sandbox (FLUSHDB) — keys, indexes, and the transcript with them',
      function () { self.clearKeys(); }));
    /* Sits next to "Clear keys" and is worded to match it: one drops what the
       browser lists, the other drops the printed history. */
    actions.appendChild(this.button('Clear terminal', 'Clear the terminal transcript',
      function () { cli().clear(self.terminalForm); }));
    this.fullCliLink = el('a', 'rwb-btn rwb-btn-link', 'Full CLI');
    this.fullCliLink.target = '_blank';
    this.fullCliLink.rel = 'noopener noreferrer';
    this.fullCliLink.title = 'Open this snippet in the standalone CLI';
    this.fullCliLink.hidden = true;
    actions.appendChild(this.fullCliLink);
    /* A worded button, not an icon: "Maximise" / "Restore" states plainly which
       way it goes, where a pair of near-identical corner glyphs did not. */
    this.maxButton = this.button('', 'Maximise the workbench',
      function () { self.toggleMax(); });
    this.maxButton.classList.add('rwb-btn-icon', 'rwb-btn-max');
    actions.appendChild(this.maxButton);

    /* The collapse control sits last, at the far edge of the bar, where a docked
       panel's chevron is expected — the bar itself toggles too, so this is the
       explicit affordance rather than the only one. */
    this.collapseButton = this.button('', 'Open the workbench', function () { self.toggle(); });
    this.collapseButton.appendChild(chevron('rwb-chevron'));
    this.collapseButton.classList.add('rwb-btn-icon', 'rwb-btn-collapse');
    actions.appendChild(this.collapseButton);
    bar.appendChild(actions);
    root.appendChild(bar);

    /* The panel: everything below the bar, shown only when open. */
    var panel = el('div', 'rwb-panel');
    this.panel = panel;

    /* Drag handle. A separator so it is reachable by keyboard too, which is the
       only way to resize without a pointer. */
    var grip = el('div', 'rwb-grip');
    grip.setAttribute('role', 'separator');
    grip.setAttribute('aria-orientation', 'horizontal');
    grip.setAttribute('aria-label', 'Resize the workbench');
    grip.setAttribute('tabindex', '0');
    grip.addEventListener('pointerdown', function (event) { self.startDrag(event); });
    grip.addEventListener('keydown', function (event) {
      if (event.key === 'ArrowUp') { self.setHeight(self.height + 40); event.preventDefault(); }
      if (event.key === 'ArrowDown') { self.setHeight(self.height - 40); event.preventDefault(); }
    });
    panel.appendChild(grip);

    var body = el('div', 'rwb-body');

    var side = el('aside', 'rwb-side');
    var sideHead = el('div', 'rwb-side-head');
    sideHead.appendChild(el('span', 'rwb-side-title', 'Keys'));
    this.keyCount = el('span', 'rwb-count', '');
    sideHead.appendChild(this.keyCount);
    side.appendChild(sideHead);
    this.keyList = el('div', 'rwb-keys');
    side.appendChild(this.keyList);
    body.appendChild(side);

    var main = el('section', 'rwb-main');
    var tabs = el('div', 'rwb-tabs');
    tabs.setAttribute('role', 'tablist');
    this.terminalTab = this.tab('Terminal', 'terminal');
    this.valueTab = this.tab('Value', 'value');
    this.valueTab.disabled = true;
    tabs.appendChild(this.terminalTab);
    tabs.appendChild(this.valueTab);

    main.appendChild(tabs);

    this.terminalPane = el('div', 'rwb-pane');
    this.valuePane = el('div', 'rwb-pane rwb-hidden');
    main.appendChild(this.terminalPane);
    main.appendChild(this.valuePane);
    body.appendChild(main);
    panel.appendChild(body);

    panel.appendChild(el('p', 'rwb-note',
      'Sandbox — shared, public, and wiped periodically. Snippets run against '
      + 'whatever is already here and build on it, so running one twice adds to '
      + 'what it made the first time. "Clear keys" empties it.'));
    root.appendChild(panel);

    document.body.appendChild(root);
    document.body.classList.add('rwb-docked');

    /* Escape collapses, rather than destroying: the dock is page furniture. */
    root.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && self.isOpen) {
        self.close();
        self.bar.querySelector('.rwb-toggle').focus();
      }
    });

    /* A shorter window (or a header that grew at a breakpoint) can leave the
       panel taller than it is now allowed to be, which would tuck the bar back
       under the header; re-clamp, keeping a maximised panel maximised. */
    window.addEventListener('resize', function () {
      if (self.isOpen) self.setHeight(self.maximized ? self.maxHeight() : self.height);
    });

    /* Remember every batch that runs in this session. While the dock is closed
       this is all that happens — no probing until the reader opens it. */
    cli().onExecute(function (batch) {
      self.observe(batch.commands);
    });

    this.show('terminal');
    this.restore();
    return this;
  };

  dock.button = function (label, title, onClick) {
    var node = el('button', 'rwb-btn', label || null);
    node.type = 'button';
    node.title = title;
    node.addEventListener('click', onClick);
    return node;
  };

  dock.tab = function (label, pane) {
    var self = this;
    var node = el('button', 'rwb-tab', label);
    node.type = 'button';
    node.setAttribute('role', 'tab');
    node.addEventListener('click', function () { self.show(pane); });
    return node;
  };

  dock.show = function (pane) {
    this.pane = pane;
    var onTerminal = pane === 'terminal';
    this.terminalPane.classList.toggle('rwb-hidden', !onTerminal);
    this.valuePane.classList.toggle('rwb-hidden', onTerminal);
    this.terminalTab.setAttribute('aria-selected', String(onTerminal));
    this.valueTab.setAttribute('aria-selected', String(!onTerminal));
  };

  /* ---- open / close / resize ---- */

  dock.toggle = function () {
    if (this.isOpen) this.close(); else this.open();
  };

  dock.open = function () {
    this.isOpen = true;
    this.root.classList.add('rwb-open');
    this.bar.querySelector('.rwb-toggle').setAttribute('aria-expanded', 'true');
    this.setCollapseLabel('Collapse the workbench');
    this.applyHeight();
    this.persist();
    /* The terminal is created on first open so a reader who never opens the dock
       pays nothing for it, and kept for the dock's lifetime after that. */
    if (!this.terminalForm) this.startTerminal();
    return this.catchUp();
  };

  dock.close = function () {
    this.isOpen = false;
    this.root.classList.remove('rwb-open');
    this.bar.querySelector('.rwb-toggle').setAttribute('aria-expanded', 'false');
    this.setCollapseLabel('Open the workbench');
    this.persist();
  };

  dock.setCollapseLabel = function (text) {
    this.collapseButton.title = text;
    this.collapseButton.setAttribute('aria-label', text);
  };

  /* The tallest the panel may be. The site header is sticky at z-50 and 70px
     tall, so a panel measured against the viewport alone pushes the dock's own
     bar up behind it — and the bar carries every control, including the one that
     brings the height back down. Leaving room for the header (measured, since it
     differs by breakpoint) is what keeps those reachable. */
  dock.maxHeight = function () {
    var header = document.querySelector('header');
    var headerHeight = header ? Math.round(header.getBoundingClientRect().height) : 0;
    var allowance = Math.min(MAX_HEADER_ALLOWANCE, Math.max(0, headerHeight)) + HEADER_GAP;
    var barHeight = this.bar ? Math.round(this.bar.getBoundingClientRect().height) : 36;
    return Math.max(MIN_HEIGHT, window.innerHeight - allowance - barHeight);
  };

  dock.setHeight = function (px) {
    var max = this.maxHeight();
    this.height = Math.min(max, Math.max(MIN_HEIGHT, Math.round(px)));
    this.maximized = this.height >= max - 1;
    this.applyHeight();
    this.persist();
  };

  dock.applyHeight = function () {
    this.panel.style.height = this.height + 'px';
    /* Arrows out to fill the window, in to come back — swapped only when the
       state actually changes, since dragging the panel calls this on every
       pointer move. The label says the same thing for a tooltip and a screen
       reader, so the way back from full height is never a guess. */
    if (this.maxIconState !== this.maximized) {
      this.maxButton.replaceChildren(resizeArrows(this.maximized));
      this.maxIconState = this.maximized;
    }
    this.maxButton.title = this.maximized
      ? 'Restore the workbench to its usual height' : 'Maximise the workbench';
    this.maxButton.setAttribute('aria-label', this.maxButton.title);
  };

  dock.toggleMax = function () {
    if (!this.isOpen) this.open();
    this.setHeight(this.maximized ? DEFAULT_HEIGHT : this.maxHeight());
  };

  dock.startDrag = function (event) {
    var self = this;
    if (!this.isOpen) return;
    event.preventDefault();
    var move = function (e) { self.setHeight(window.innerHeight - e.clientY); };
    var up = function () {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('rwb-dragging');
    };
    document.body.classList.add('rwb-dragging');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  dock.persist = function () {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        open: this.isOpen, height: this.height
      }));
    } catch (err) { /* private mode: the dock just won't be remembered */ }
  };

  dock.restore = function () {
    var saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) { /* ignore malformed state */ }
    this.height = DEFAULT_HEIGHT;
    if (saved && typeof saved.height === 'number') {
      var max = this.maxHeight();
      this.height = Math.min(max, Math.max(MIN_HEIGHT, saved.height));
      this.maximized = this.height >= max - 1;
    }
    this.applyHeight();
    if (saved && saved.open) this.open();
  };

  /* ---- running snippets ---- */

  /* Run a snippet from a "Try it" button into the existing terminal, on top of
     whatever is already in the sandbox. The workbench is a session, not a
     one-shot preview: keys from earlier snippets stay, and the transcript keeps
     its history, so a reader can follow a page's examples in order and watch the
     keyspace build up. "Clear keys" is the deliberate way back to empty.

     The cost of not flushing is that running the same snippet twice accumulates:
     a second run of an RPUSH or XADD example lengthens what is already there,
     and the page's inline terminals have usually run those commands at load. The
     footer note says so, and the counts in the browser make it visible.

     Pressing the same "Try it" again is how a reader repeats a snippet, so the
     dock keeps no per-snippet state and offers no re-run of its own. */
  dock.load = function (options) {
    var self = this;
    this.fullCliUrl = options.fullCliUrl || '';
    this.fullCliLink.hidden = !this.fullCliUrl;
    if (this.fullCliUrl) this.fullCliLink.href = this.fullCliUrl;
    this.open();
    this.show('terminal');
    this.setStatus('running the snippet…');
    /* Discovery is not kicked off here: running the commands through the
       terminal puts them on the onExecute subscription — which tracks them.
       Doing both would probe every command twice. */
    return cli().run(this.terminalForm, options.commands, 'preset')
      .then(null, function () {
        self.setStatus('could not run the snippet');
      });
  };

  /* Empty the sandbox on request, and wipe the transcript with it: the printed
     history is all about keys that no longer exist, so leaving it behind is just
     a screenful of results the reader can no longer act on.

     The flush still goes through the terminal rather than behind its back — that
     disables the prompt for its duration, so a command typed at the wrong moment
     cannot land in front of it. FLUSHDB mints a fresh session on this backend and
     is intercepted before Redis, so the ACL's -flushdb never applies. */
  dock.clearKeys = function () {
    var self = this;
    this.keys = [];
    this.known = [];
    this.indexes = [];
    this.pending = [];
    this.selected = null;
    this.truncated = false;
    this.valueTab.disabled = true;
    this.valuePane.replaceChildren();
    this.renderKeys();
    this.show('terminal');
    this.setStatus('clearing…');
    /* Batches still in flight wrote keys that will not survive the flush, so
       stop tracking until it lands. */
    this.resetting = true;
    return cli().run(this.terminalForm, ['FLUSHDB'], 'interactive').then(function () {
      self.resetting = false;
      cli().clear(self.terminalForm);
      self.setStatus(self.summary());
    }, function () {
      /* The flush never reached the server: keep the transcript, since it is the
         only place that says so. */
      self.resetting = false;
    });
  };

  /* Mount the dock's terminal, once. cli.js owns it from here: it renders the
     transcript and the prompt, and window.RedisCli.run appends later snippets to
     it rather than replacing it — which is what lets the history survive. */
  dock.startTerminal = function () {
    this.terminalPane.replaceChildren();
    var form = el('form', 'redis-cli rwb-terminal');
    form.setAttribute('spellcheck', 'false');
    this.terminalForm = form;
    this.terminalPane.appendChild(form);
    return cli().createCli(form);
  };

  /* ---- keyspace tracking ---- */

  /* Every batch in this session passes through here. Closed, the commands are
     only remembered; open, they are probed straight away. */
  dock.observe = function (commands) {
    if (this.resetting) {
      /* A "Clear keys" flush is in flight, so these keys are about to stop
         existing. Probing them is pure waste. */
      return;
    }
    if (!this.isOpen || !this.caughtUp) {
      this.pending = this.pending.concat(commands).slice(-MAX_PENDING_COMMANDS);
      return;
    }
    this.track(commands);
  };

  /* Bring the browser up to date on open: probe whatever ran while the dock was
     closed, in one pass, so it opens already showing the page's keys.

     Every open, not just the first — a reader who collapses the dock, runs an
     inline example and opens it again has to see those keys, and while closed
     `observe` only buffers. Opening also re-sweeps the keys already tracked,
     which is how a key that expired on its own (nothing ran, so nothing
     triggered a sweep) stops being listed. */
  dock.catchUp = function () {
    var commands = this.pending;
    var firstOpen = !this.caughtUp;
    this.pending = [];
    this.caughtUp = true;
    if (commands.length) return this.track(commands);
    if (firstOpen || this.known.length) return this.refreshSoon();
    return Promise.resolve();
  };

  /* Learn the keys a batch of commands touched, then re-describe the keyspace. */
  dock.track = function (commands) {
    var self = this;
    this.begin('reading keyspace…');
    return discoverKeys(commands).then(function (found) {
      found.forEach(function (name) {
        if (self.known.indexOf(name) === -1) self.known.push(name);
      });
      /* Bound the sweep: every tracked key costs commands on a shared backend,
         and a browser showing hundreds of keys has stopped being useful anyway.
         The newest are the ones the reader just made, so drop from the front. */
      if (self.known.length > MAX_TRACKED_KEYS) {
        self.known = self.known.slice(self.known.length - MAX_TRACKED_KEYS);
        self.truncated = true;
      }
      return self.refreshSoon();
    }).then(function () {
      self.end();
    }, function () {
      self.end();
      self.setStatus('could not read the keyspace');
    });
  };

  /* Serialize keyspace sweeps: one running, at most one pending behind it, so a
     burst of batches costs two sweeps rather than one each. Callers get a promise
     that resolves only after a sweep that started *after* their keys were added,
     which is what lets the status line settle at the truth instead of at some
     intermediate reading. */
  dock.refreshSoon = function () {
    var self = this;
    if (this.sweep) {
      if (!this.nextSweep) {
        this.nextSweep = this.sweep.then(function () {
          self.nextSweep = null;
          return self.startSweep();
        });
      }
      return this.nextSweep;
    }
    return this.startSweep();
  };

  dock.startSweep = function () {
    var self = this;
    this.sweep = this.refresh().then(done, done);
    function done() {
      self.sweep = null;
    }
    return this.sweep;
  };

  /* Re-describe every known key (dropping the ones that are gone) and re-read
     the session's search indexes. Always driven by the dock itself — off a
     command that ran, or off opening the panel — never by the reader: a button
     for it only mattered in the cases those two now cover. */
  dock.refresh = function () {
    var self = this;
    return readKeyspace(this.known).then(function (result) {
      self.keys = result.keys;
      self.indexes = result.indexes;
      self.renderKeys();
      /* Only announce a total once nothing else is in flight: a sweep that
         finishes while discovery is still running, or with another sweep queued
         behind it, is an intermediate reading — reporting it would flicker a
         number that is about to change. */
      if (!self.busy && !self.nextSweep) self.setStatus(self.summary());
      /* A selected key may have been deleted or changed by the last batch. */
      if (self.selected && !self.find(self.selected)) {
        self.selected = null;
        self.valueTab.disabled = true;
        self.valuePane.replaceChildren();
        if (self.pane === 'value') self.show('terminal');
      } else if (self.selected) {
        self.openKey(self.selected, true);
      }
    }, function () {
      /* The next command, or the next time the panel is opened, tries again. */
      self.setStatus('could not read the keyspace');
    });
  };

  dock.find = function (name) {
    return this.keys.filter(function (key) { return key.name === name; })[0] || null;
  };

  dock.summary = function () {
    if (!this.caughtUp) return 'sandbox ready';
    var parts = [this.keys.length ? plural(this.keys.length, 'key') : 'no keys'];
    if (this.indexes.length) parts.push(plural(this.indexes.length, 'index', 'indexes'));
    if (this.truncated) parts.push('newest ' + MAX_TRACKED_KEYS + ' tracked');
    return parts.join(' · ');
  };

  dock.setStatus = function (text) {
    this.status.textContent = text;
  };

  /* A tiny in-flight counter, so overlapping probes don't clear each other's
     "working" state. */
  dock.begin = function (text) {
    this.busy += 1;
    this.root.classList.add('rwb-busy');
    this.setStatus(text);
  };

  dock.end = function () {
    this.busy = Math.max(0, this.busy - 1);
    if (!this.busy) {
      this.root.classList.remove('rwb-busy');
      this.setStatus(this.summary());
    }
  };

  /* ---- key browser ---- */

  dock.renderKeys = function () {
    var self = this;
    var list = this.keyList;
    list.replaceChildren();
    this.keyCount.textContent = this.keys.length ? String(this.keys.length) : '';

    if (!this.keys.length && !this.indexes.length) {
      list.appendChild(el('p', 'rwb-empty',
        'No keys. Commands that write keys show up here as they run.'));
      return;
    }

    this.keys.forEach(function (key) {
      var meta = TYPES[key.type] || { label: key.type, tone: 'other' };
      var item = el('button', 'rwb-key');
      item.type = 'button';
      if (key.name === self.selected) {
        item.classList.add('rwb-key-on');
        item.setAttribute('aria-current', 'true');
      }
      item.appendChild(el('span', 'rwb-badge rwb-tone-' + meta.tone, meta.label));
      var text = el('span', 'rwb-key-text');
      text.appendChild(el('span', 'rwb-key-name', key.name));
      var sub = [];
      if (key.sizeLabel) sub.push(key.sizeLabel);
      if (typeof key.ttl === 'number' && key.ttl >= 0) sub.push('TTL ' + humanTtl(key.ttl));
      text.appendChild(el('span', 'rwb-key-sub', sub.join(' · ')));
      item.appendChild(text);
      item.title = key.name + ' — ' + meta.label;
      item.addEventListener('click', function () { self.openKey(key.name); });
      list.appendChild(item);
    });

    if (this.indexes.length) {
      list.appendChild(el('div', 'rwb-group', 'Indexes'));
      this.indexes.forEach(function (name) {
        var item = el('button', 'rwb-key');
        item.type = 'button';
        if (name === self.selected) item.classList.add('rwb-key-on');
        item.appendChild(el('span', 'rwb-badge rwb-tone-index', 'index'));
        var text = el('span', 'rwb-key-text');
        text.appendChild(el('span', 'rwb-key-name', name));
        item.appendChild(text);
        item.addEventListener('click', function () { self.openIndex(name); });
        list.appendChild(item);
      });
    }
  };

  /* ---- value pane ---- */

  dock.openKey = function (name, quiet) {
    var self = this;
    var key = this.find(name);
    if (!key) return;
    this.selected = name;
    this.valueTab.disabled = false;
    this.renderKeys();
    if (!quiet) this.show('value');

    var probe = valueProbe(name, key.type, key.size);
    /* OBJECT ENCODING and MEMORY USAGE are container-subcommand forms: older
       backends ran them unnamespaced and replied nil, so treat them as optional
       detail and simply omit what comes back empty. */
    var extra = ['OBJECT ENCODING ' + quote(name), 'MEMORY USAGE ' + quote(name)];
    var commands = extra.concat(probe ? probe.commands : []);

    this.begin('reading ' + name + '…');
    return run(commands).then(function (replies) {
      var encoding = ok(replies[0]);
      var memory = ok(replies[1]);
      var view = probe ? probe.build(replies.slice(extra.length)) : null;
      self.renderValue(key, {
        encoding: typeof encoding === 'string' ? encoding : null,
        memory: typeof memory === 'number' ? memory : null,
        view: view,
        commands: probe ? probe.commands : []
      });
      self.end();
    }, function () {
      self.end();
    });
  };

  dock.openIndex = function (name) {
    var self = this;
    this.selected = name;
    this.valueTab.disabled = false;
    this.renderKeys();
    this.show('value');
    this.begin('reading ' + name + '…');
    return run(['FT.INFO ' + quote(name)]).then(function (replies) {
      var info = pairs(ok(replies[0]));
      self.valuePane.replaceChildren();
      var head = el('div', 'rwb-value-head');
      head.appendChild(el('span', 'rwb-badge rwb-tone-index', 'index'));
      head.appendChild(el('code', 'rwb-value-name', name));
      self.valuePane.appendChild(head);
      self.valuePane.appendChild(renderTable(['Field', 'Value'], info.filter(function (row) {
        /* FT.INFO is long and mostly internal counters; show the fields a
           reader of the docs actually cares about. */
        return ['index_name', 'num_docs', 'num_terms', 'num_records', 'indexing',
          'index_definition', 'attributes', 'hash_indexing_failures'
        ].indexOf(cellText(row[0])) !== -1;
      })));
      self.valuePane.appendChild(ranNote(['FT.INFO ' + quote(name)]));
      self.end();
    }, function () { self.end(); });
  };

  dock.renderValue = function (key, detail) {
    var meta = TYPES[key.type] || { label: key.type, tone: 'other' };
    var pane = this.valuePane;
    pane.replaceChildren();

    var head = el('div', 'rwb-value-head');
    head.appendChild(el('span', 'rwb-badge rwb-tone-' + meta.tone, meta.label));
    head.appendChild(el('code', 'rwb-value-name', key.name));
    var facts = el('span', 'rwb-facts');
    if (key.sizeLabel) facts.appendChild(el('span', 'rwb-fact', key.sizeLabel));
    facts.appendChild(el('span', 'rwb-fact', humanTtl(key.ttl)));
    if (detail.encoding) facts.appendChild(el('span', 'rwb-fact', detail.encoding));
    if (detail.memory !== null) facts.appendChild(el('span', 'rwb-fact', humanBytes(detail.memory)));
    head.appendChild(facts);
    pane.appendChild(head);

    if (!detail.view) {
      pane.appendChild(el('p', 'rwb-empty',
        'This type stores no enumerable value, so there is nothing to preview.'));
    } else {
      pane.appendChild(renderView(detail.view));
      /* Say what was left out, so a partial read is never mistaken for the whole
         value — the command above it is bounded for a reason. */
      if (detail.view.limited) {
        pane.appendChild(el('p', 'rwb-limited', 'Showing '
          + detail.view.limited.shown + ' of ' + detail.view.limited.of));
      }
    }
    if (detail.commands.length) pane.appendChild(ranNote(detail.commands));
  };

  function renderView(view) {
    if (view.kind === 'text') {
      return el('pre', 'rwb-text' + (view.mono ? ' rwb-json' : ''), view.text);
    }
    if (view.kind === 'table') {
      return renderTable(view.head, view.rows);
    }
    if (view.kind === 'entries') {
      if (!view.rows.length) return el('p', 'rwb-empty', 'No entries.');
      var wrap = el('div', 'rwb-entries');
      view.rows.forEach(function (entry) {
        var block = el('div', 'rwb-entry');
        block.appendChild(el('code', 'rwb-entry-id', entry.id));
        block.appendChild(renderTable(['Field', 'Value'], entry.fields));
        wrap.appendChild(block);
      });
      return wrap;
    }
    if (view.kind === 'sections') {
      var sections = el('div', 'rwb-sections');
      view.sections.forEach(function (section) {
        sections.appendChild(el('div', 'rwb-group', section.title));
        sections.appendChild(renderTable(section.head, section.rows));
      });
      return sections;
    }
    return el('p', 'rwb-empty', 'Nothing to show.');
  }

  function renderTable(head, rows) {
    if (!rows || !rows.length) return el('p', 'rwb-empty', 'Empty.');
    var table = el('table', 'rwb-table');
    var thead = el('thead');
    var headRow = el('tr');
    head.forEach(function (cell) { headRow.appendChild(el('th', null, cell)); });
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody');
    rows.forEach(function (row) {
      var tr = el('tr');
      row.forEach(function (cell) { tr.appendChild(el('td', null, cellText(cell))); });
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    var wrap = el('div', 'rwb-table-wrap');
    wrap.appendChild(table);
    return wrap;
  }

  /* Show the introspection commands behind a view. The browser is not magic —
     naming the commands is both honest and the most useful thing a reader can
     take away from it. */
  function ranNote(commands) {
    var note = el('p', 'rwb-ran');
    note.appendChild(el('span', 'rwb-ran-label', 'Read with'));
    commands.forEach(function (command) {
      note.appendChild(el('code', null, command));
    });
    return note;
  }

  /* ---------------------------------------------------------------- entry -- */

  /* The dock is built once, lazily, and only where it makes sense: a page with
     no Redis examples has nothing to put in it. */
  function pageHasRedis() {
    return !!document.querySelector('form.redis-cli, .tryit-button');
  }

  function ensureDock() {
    if (dock.root) return dock;
    if (!available() || !pageHasRedis()) return null;
    return dock.build();
  }

  /* The widget is injected by the js/cli.js shim, so window.RedisCli may not
     exist yet when the DOM is ready; wait for it briefly rather than racing it. */
  function mountWhenReady() {
    if (!pageHasRedis()) return;
    var deadline = 15000;
    var waited = 0;
    var step = 100;
    (function poll() {
      if (ensureDock()) return;
      waited += step;
      if (waited < deadline) window.setTimeout(poll, step);
    })();
  }

  window.RedisWorkbench = {
    available: available,

    /* Run a snippet in the dock and open it. Called by the "Try it" buttons;
       returns false when the dock cannot run (an older backend), so the caller
       can fall back to the standalone CLI.
       options: {commands[], fullCliUrl}; the callers also pass `button` and
       `snippet`, which the dock no longer needs — the snippet id was only ever
       an internal handle, and naming it in the UI told a reader nothing. */
    open: function (options) {
      if (!options || !options.commands || !options.commands.length) return false;
      var instance = ensureDock();
      if (!instance) return false;
      instance.load({
        commands: options.commands,
        fullCliUrl: options.fullCliUrl
      });
      return true;
    },

    /* Open, close or toggle the dock without loading a snippet. */
    toggle: function () {
      var instance = ensureDock();
      if (instance) instance.toggle();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWhenReady);
  } else {
    mountWhenReady();
  }
})();

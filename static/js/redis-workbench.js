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

  /* How close to the end counts as "at the end" when deciding whether to follow
     the transcript. A couple of lines of slack: a reader who has scrolled up by
     one line is still reading the end, and a fractional scrollTop should not
     count as having left it. */
  var TERMINAL_FOLLOW_SLACK = 28;

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
    vectorset:     { label: 'vector set', tone: 'vector' },
    array:         { label: 'array', tone: 'array' }
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

  /* The indexes a batch of commands creates, by name — for a setup block that is
     being run a second time and would otherwise fail on its own FT.CREATE. */
  function recreatedIndexes(commands) {
    var names = [];
    commands.forEach(function (command) {
      var match = /^\s*FT\.CREATE\s+("[^"]+"|'[^']+'|\S+)/i.exec(String(command));
      if (!match) return;
      var name = match[1].replace(/^["']|["']$/g, '');
      if (names.indexOf(name) === -1) names.push(name);
    });
    return names;
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

  /* A flat field/value reply — FT.INFO's own, and the nested lists inside it —
     read into a map by field name. */
  function fieldMap(value) {
    var map = {};
    pairs(value).forEach(function (row) { map[cellText(row[0])] = row[1]; });
    return map;
  }

  /* The arguments in an FT.INFO attribute that stand alone rather than naming a
     value after them, so `SORTABLE UNF` is two flags and not a field called
     SORTABLE holding "UNF". The list is Insight's InfoAttributesBoolean
     (redisinsight/ui/src/packages/redisearch/src/constants/constants.ts). */
  var SCHEMA_FLAGS = ['NOSTEM', 'NOINDEX', 'SORTABLE', 'WITHSUFFIXTRIE',
    'CASESENSITIVE', 'UNF', 'INDEXEMPTY', 'INDEXMISSING'];

  /* One entry of FT.INFO's `attributes`: ["identifier", "$.name", "attribute",
     "name", "type", "TEXT", "WEIGHT", "1"] -> {identifier, attribute, type,
     weight, flags: []}. */
  function schemaField(entry) {
    var field = { flags: [] };
    var tokens = Array.isArray(entry) ? entry : [];
    for (var i = 0; i < tokens.length; i++) {
      var token = cellText(tokens[i]);
      if (SCHEMA_FLAGS.indexOf(token.toUpperCase()) !== -1) {
        field.flags.push(token.toUpperCase());
        continue;
      }
      field[token.toLowerCase()] = i + 1 < tokens.length ? cellText(tokens[i + 1]) : '';
      i++;
    }
    return field;
  }

  /* Insight gives each field type its own badge — FIELD_TYPE_BADGE_VARIANT_MAP in
     ui/src/pages/vector-search/components/field-tag/constants.ts maps TEXT to
     "informative", TAG to "notice", NUMERIC to "attention", VECTOR to "success"
     and GEO to "default". Those variants resolve inside the redis-ui package
     rather than in the app, so these are the nearest hues in the palette the dock
     already uses, in the same order of meaning. */
  var FIELD_TONES = {
    TEXT: 'text', TAG: 'tag', NUMERIC: 'numeric', VECTOR: 'vector',
    GEO: 'geo', GEOSHAPE: 'geo'
  };

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
  /* How many of an index's documents to list. Insight pages its browser; the
     dock's key list is a browser of a sandbox and stops being useful long before
     this. */
  var MAX_INDEX_DOCS = 100;

  /* The sandbox namespaces keys as `<session uuid>:<key>` and strips that prefix
     back out of replies. For FT.SEARCH it does so assuming the with-fields
     layout — [total, key, fields, key, fields, ...] — and steps two at a time, so
     a NOCONTENT (or RETURN 0) reply, which is all keys and no fields, comes back
     with every other name still carrying its prefix. Strip whatever is left:
     the shape of that prefix is known, and a name that never had one is
     untouched. */
  var SESSION_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}:/i;

  function documentNames(value) {
    if (!Array.isArray(value)) return [];
    var names = [];
    value.forEach(function (item, i) {
      if (i === 0 || typeof item !== 'string') return;      /* [0] is the total */
      var name = item.replace(SESSION_PREFIX, '');
      if (names.indexOf(name) === -1) names.push(name);
    });
    return names;
  }

  function readKeyspace(trackedKeys, indexName) {
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
    /* One more command while a reader is looking at an index: which documents it
       holds. NOCONTENT because the list only needs their names. */
    if (indexName) {
      commands.push('FT.SEARCH ' + quote(indexName) + ' * NOCONTENT LIMIT 0 '
        + MAX_INDEX_DOCS);
    }

    return run(commands).then(function (replies) {
      var listed = ok(replies[names.length * 2]);
      var indexes = Array.isArray(listed) ? listed.filter(function (name) {
        return typeof name === 'string';
      }) : [];
      /* null, not [], when nothing was asked: "no filter" and "an index with no
         documents in it" are different answers. */
      var docs = indexName
        ? documentNames(ok(replies[names.length * 2 + 1]))
        : null;

      var described = names.map(function (name, i) {
        var type = ok(replies[i * 2]);
        return {
          name: name,
          /* TYPE answers a simple string; anything else means the reply was an
             error or was not the one asked for, and the key is skipped rather
             than rendered with a nonsense badge. */
          type: typeof type === 'string' ? type : null,
          ttl: ok(replies[i * 2 + 1]),
          /* A TTL is only true at the instant it was read, so the reading is
             stamped and what gets displayed is counted down from it. Without
             this, a key with a minute left showed "60s" until something else
             happened to trigger a sweep. */
          readAt: Date.now()
        };
      }).filter(function (key) {
        return key.type && key.type !== 'none';
      });

      var sizers = [];
      described.forEach(function (key) {
        var command = sizeCommand(key.type, key.name);
        if (command) sizers.push({ key: key, command: command });
      });
      if (!sizers.length) return { keys: described, indexes: indexes, docs: docs };
      return run(sizers.map(function (s) { return s.command; })).then(function (sizes) {
        sizers.forEach(function (s, i) {
          s.key.size = ok(sizes[i]);
          s.key.sizeLabel = sizeLabel(s.key.type, s.key.size);
        });
        return { keys: described, indexes: indexes, docs: docs };
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
      /* The logical length — highest set index plus one — which is what Redis
         Insight shows as Length. ARCOUNT (how many slots are actually filled) is
         the other half of the story and the preview asks for it, since the two
         differ wildly for a sparse array: ARLEN 1000001 against ARCOUNT 2. */
      case 'array': return 'ARLEN ' + key;
      case 'vectorset': return 'VCARD ' + key;
      case 'ReJSON-RL': return 'JSON.TYPE ' + key;
      default: return null;
    }
  }

  /* Labelled the way Redis Insight labels it: "<field>: <n>", with the field
     names from its own locale file (browser.keyDetails.length.* on
     redis/RedisInsight@main) — Length by default, Entries for a stream,
     Top-level values for JSON.

     A bare number was the problem. "6 B" for `SET bike:1 Deimos` was read as the
     key's memory footprint — the thing Insight calls Key Size, 40 B for that
     command — when it is the length of the value. The unit went with it: STRLEN
     counts bytes, but "Length: 6" is what Insight shows and it cannot be mistaken
     for a size in memory. */
  function sizeLabel(type, size) {
    if (size === null || size === undefined) return null;
    switch (type) {
      case 'string':
      case 'list':
      case 'set':
      case 'zset':
      case 'hash':
        return typeof size === 'number' ? 'Length: ' + size : null;
      case 'stream':
        return typeof size === 'number' ? 'Entries: ' + size : null;
      case 'array':
      case 'vectorset':
        return typeof size === 'number' ? 'Length: ' + size : null;
      /* Not a length: JSON.TYPE answers what the root is. Insight shows
         "Top-level values" here, which needs a second command per key
         (JSON.OBJLEN or JSON.ARRLEN, depending on that answer). */
      case 'ReJSON-RL': return size === null ? null : 'Root: ' + cellText(size);
      default: return null;
    }
  }

  /* Which command produced it, for the chip's tooltip. */
  function sizeSource(type) {
    var command = sizeCommand(type, 'key');
    if (!command) return null;
    return 'From ' + command.split(' ')[0];
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
      /* ARSCAN, not ARGETRANGE: it returns index-value pairs and skips the empty
         slots, which is the only readable preview of a sparse array — ARGETRANGE
         over `ARSET a 1000000 x` would answer with a million nils. ARCOUNT says
         how many are really there, so a partial view can say what it is showing
         out of what. */
      case 'array':
        return {
          commands: [
            'ARCOUNT ' + key,
            'ARSCAN ' + key + ' 0 ' + (known && size > 0 ? size - 1 : 0)
              + ' LIMIT ' + PREVIEW_ITEMS
          ],
          build: function (r) {
            var count = ok(r[0]);
            var found = ok(r[1]);
            var rows = (Array.isArray(found) ? found : []).map(function (entry) {
              /* Each entry is [index, value]; anything else is passed through
                 rather than guessed at. */
              return Array.isArray(entry) ? [entry[0], entry[1]] : [entry, ''];
            });
            return {
              kind: 'table',
              head: ['Index', 'Value'],
              rows: rows,
              limited: typeof count === 'number' && rows.length < count
                ? { shown: rows.length, of: plural(count, 'element') } : null
            };
          }
        };
      /* A vector set, the way Redis Insight shows one: the quantisation and the
         dimensionality alongside the length, then the elements by name, each of
         which can be opened for its vector and attributes.

         VRANDMEMBER is the only way to enumerate: there is no SCAN for a vector
         set. A positive count returns distinct elements up to that many, so this
         is a sample rather than a page — hence the sort, so the same set does not
         reshuffle every time it is opened, and the count below it. */
      case 'vectorset':
        return {
          commands: ['VINFO ' + key, 'VRANDMEMBER ' + key + ' ' + PREVIEW_ITEMS],
          build: function (r) {
            var info = {};
            pairs(ok(r[0])).forEach(function (row) {
              info[cellText(row[0])] = cellText(row[1]);
            });
            var members = (ok(r[1]) || []).map(cellText).sort();
            var facts = [];
            /* Insight's own field names, from its locale file:
               browser.keyDetails.quantType.full and .vectorDim.full. */
            if (info['quant-type']) {
              facts.push({ text: 'Quant type: ' + info['quant-type'], title: 'From VINFO' });
            }
            if (info['vector-dim']) {
              facts.push({ text: 'Vector dim: ' + info['vector-dim'], title: 'From VINFO' });
            }
            return {
              kind: 'table',
              head: ['Element'],
              rows: members.map(function (member) { return [member]; }),
              facts: facts,
              /* Marks these rows as openable; the dock wires the click, since a
                 probe has no business knowing about the panel. */
              elements: members,
              limited: known && members.length < size
                ? { shown: members.length, of: plural(size, 'element') } : null
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
              /* "Element" is what a list holds, in Redis's own terms and in the
                 docs beside this — lists.md says element or elements about seventy
                 times. The browser should use the page's vocabulary. */
              head: ['Index', 'Element'],
              rows: items.map(function (item, i) { return [i, item]; }),
              limited: known && size > PREVIEW_ITEMS
                ? { shown: items.length, of: plural(size, 'element') } : null
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
      /* Redis Insight declines this one — it says "This is a RedisTimeSeries key.
         Use Redis commands in the Workbench tool to view the value" and shows
         nothing. A docs reader who has just run TS.ADD is better served by seeing
         the samples, so this keeps the fuller view and only borrows Insight's
         label for the count: Samples, from browser.keyDetails.length.samples. */
      case 'TSDB-TYPE':
        return {
          commands: ['TS.INFO ' + key, 'TS.RANGE ' + key + ' - + COUNT ' + PREVIEW_ITEMS],
          build: function (r) {
            var info = pairs(ok(r[0]));
            var samples = ok(r[1]) || [];
            var facts = [];
            var totals = info.filter(function (row) {
              return cellText(row[0]) === 'totalSamples';
            })[0];
            if (totals) {
              facts.push({ text: 'Samples: ' + cellText(totals[1]), title: 'From TS.INFO' });
            }
            return {
              kind: 'sections',
              facts: facts,
              sections: [
                {
                  title: 'Info',
                  kind: 'table',
                  head: ['Field', 'Value'],
                  /* totalSamples is the chip above; memoryUsage is left out for
                     the same reason MEMORY USAGE is — in this sandbox every key
                     carries a session prefix, so the figure cannot match what the
                     same commands report on the reader's own Redis. */
                  rows: info.filter(function (row) {
                    var field = cellText(row[0]);
                    return field !== 'totalSamples' && field !== 'memoryUsage';
                  })
                },
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
    /* The index whose documents the key list is showing, and their names. */
    indexFilter: null,
    indexDocs: null,
    /* Page setups already run in this sandbox session, by name. */
    setupRan: {},
    selected: null,
    truncated: false,
    /* command batches seen while closed, discovered at first open */
    pending: [],
    caughtUp: false,
    ttlNodes: {},
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

    /* The bar carries what belongs to the dock as a whole: what it is, what it is
       doing, and how big it is. Anything that acts on ONE pane's contents lives
       in that pane, next to the thing it affects — "Clear keys" and "Clear
       terminal" are in the Terminal pane, the way "Run all" and "Clear notebook"
       are in the Notebook pane. */
    var actions = el('div', 'rwb-actions');
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

    var main = el('section', 'rwb-main');
    var tabs = el('div', 'rwb-tabs');
    tabs.setAttribute('role', 'tablist');
    this.tabStrip = tabs;
    this.mainSection = main;
    /* Panes live in a registry rather than as two fixed fields, so a consumer can
       add one (see RedisWorkbench.addPane) without reaching into the dock. */
    this.panes = {};
    main.appendChild(tabs);

    this.terminalPane = this.addPane('terminal', 'Terminal').pane;

    /* Kept as a node on the dock, not rebuilt with the terminal: startTerminal()
       empties the pane to mount the transcript, and this has to survive that. */
    var terminalTools = el('div', 'rwb-toolbar');
    terminalTools.appendChild(this.button('Clear keys',
      'Empty the sandbox (FLUSHDB) — keys and indexes. The transcript stays.',
      function () { self.clearKeys(); }));
    /* Its pair: one drops what the browser lists, the other drops the printed
       history. Neither reaches into the other. */
    terminalTools.appendChild(this.button('Clear terminal', 'Clear the terminal transcript',
      function () { cli().clear(self.terminalForm); }));
    this.terminalToolbar = terminalTools;
    this.terminalPane.appendChild(terminalTools);

    /* Under the toolbar, three columns: the CLI, the keys it writes, and the
       value of whichever key is selected.

       They used to be a sidebar and a tab. The sidebar listed keys beside every
       pane, including the notebook's — whose kernel talks to a different Redis
       entirely — and the value hid behind a tab, so reading a key meant leaving
       the terminal that had just written it. Command, effect and contents now sit
       next to each other, and the notebook gets the full width. */
    var split = el('div', 'rwb-split');
    this.split = split;

    var cliColumn = el('div', 'rwb-col rwb-col-cli');
    /* The terminal is mounted into its own column, so rebuilding it leaves the
       toolbar and the other columns alone. */
    this.terminalHost = cliColumn;
    split.appendChild(cliColumn);
    split.appendChild(this.columnDivider('Resize the terminal', 0));

    /* The middle column is itself two sections, stacked: the keys a snippet
       wrote, and the indexes it created. They were one list with a heading in the
       middle of it, which read as a key called "Indexes" and scrolled the two
       against each other — an index on a search page was below the fold of a
       dozen documents it indexed. Each now has its own heading, its own count and
       its own scroll, and the divider between them is draggable like the ones
       between the columns. */
    var keysColumn = el('div', 'rwb-col rwb-col-keys');
    this.keysStack = keysColumn;

    var keysSection = el('div', 'rwb-sect');
    var keysHead = el('div', 'rwb-col-head');
    keysHead.appendChild(el('span', 'rwb-col-title', 'Keys'));
    this.keyCount = el('span', 'rwb-count', '');
    keysHead.appendChild(this.keyCount);
    keysSection.appendChild(keysHead);
    this.keyList = el('div', 'rwb-keys');
    keysSection.appendChild(this.keyList);
    keysColumn.appendChild(keysSection);
    this.keysSection = keysSection;

    this.rowDivider = this.stackDivider('Resize the key list');
    keysColumn.appendChild(this.rowDivider);

    var indexSection = el('div', 'rwb-sect');
    var indexHead = el('div', 'rwb-col-head');
    indexHead.appendChild(el('span', 'rwb-col-title', 'Indexes'));
    this.indexCount = el('span', 'rwb-count', '');
    indexHead.appendChild(this.indexCount);
    indexSection.appendChild(indexHead);
    this.indexList = el('div', 'rwb-keys');
    indexSection.appendChild(this.indexList);
    keysColumn.appendChild(indexSection);
    this.indexSection = indexSection;

    split.appendChild(keysColumn);
    split.appendChild(this.columnDivider('Resize the key list', 1));

    var valueColumn = el('div', 'rwb-col rwb-col-value');
    var valueHead = el('div', 'rwb-col-head');
    valueHead.appendChild(el('span', 'rwb-col-title', 'Value'));
    valueColumn.appendChild(valueHead);
    /* Kept as its own node under the heading: renderValue() replaces the whole
       thing every time a key is opened. */
    this.valuePane = el('div', 'rwb-value-body');
    valueColumn.appendChild(this.valuePane);
    split.appendChild(valueColumn);

    this.terminalPane.appendChild(split);
    this.applyColumns();
    this.applyRows();
    this.clearValue();

    body.appendChild(main);
    panel.appendChild(body);

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
      /* A command the reader ran ends the index filter: what they just wrote is
         the thing they want to see, and a list narrowed to one index would hide a
         SET that has nothing to do with it. The dock's own probes never come
         through here — they run with the 'workbench' source and the widget
         reports only what a reader or a page started — but the guard says which
         batches this is about. */
      if (batch.source !== SOURCE) self.clearIndexFilter();
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

  /* Add a tab and its pane, and return both. `onShow(pane, shown)` is called
     whenever the pane is revealed or hidden, which is how a pane that owns
     something expensive (a kernel, a borrowed piece of the page) can set it up
     late and put it back afterwards. */
  dock.addPane = function (id, label, onShow) {
    var self = this;
    var tab = el('button', 'rwb-tab', label);
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.addEventListener('click', function () { self.show(id); });
    this.tabStrip.appendChild(tab);

    var pane = el('div', 'rwb-pane rwb-pane-' + id);
    if (Object.keys(this.panes).length) pane.classList.add('rwb-hidden');
    this.mainSection.appendChild(pane);

    this.panes[id] = { tab: tab, pane: pane, onShow: onShow };
    return this.panes[id];
  };

  dock.show = function (id) {
    var self = this;
    if (!this.panes[id]) return;
    this.pane = id;
    Object.keys(this.panes).forEach(function (key) {
      var entry = self.panes[key];
      var shown = key === id;
      entry.pane.classList.toggle('rwb-hidden', !shown);
      entry.tab.setAttribute('aria-selected', String(shown));
      if (entry.onShow) entry.onShow(entry.pane, shown);
    });
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
    if (!this.terminalForm) this.terminalReady = this.startTerminal();
    this.startTtlTicker();
    return this.catchUp();
  };

  dock.close = function () {
    this.isOpen = false;
    this.root.classList.remove('rwb-open');
    this.bar.querySelector('.rwb-toggle').setAttribute('aria-expanded', 'false');
    this.setCollapseLabel('Open the workbench');
    this.stopTtlTicker();
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

  /* Resizing changes how much of the transcript fits; if the reader was at the
     end, keep them there rather than leaving the last line under the fold. */
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
    if (this.following) this.scrollTerminal();
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

  /* ---- the three columns ---- */

  /* Widths as percentages of the split, so a resized dock keeps its proportions
     rather than its pixels. The CLI gets most of it: it is where the typing
     happens, and the other two are lists. */
  var DEFAULT_COLUMNS = [54, 22, 24];
  var MIN_COLUMN = 12;

  /* And the two rows inside the key column, the same way. Keys get most of it:
     a session usually has many of them and one or two indexes. */
  var DEFAULT_ROWS = [65, 35];
  var MIN_ROW = 15;

  dock.columnDivider = function (label, index) {
    var self = this;
    var node = el('div', 'rwb-divider');
    node.setAttribute('role', 'separator');
    node.setAttribute('aria-orientation', 'vertical');
    node.setAttribute('aria-label', label);
    node.setAttribute('tabindex', '0');
    node.addEventListener('pointerdown', function (event) {
      self.startColumnDrag(event, index);
    });
    /* Reachable without a pointer, like the height grip. */
    node.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      self.nudgeColumns(index, event.key === 'ArrowLeft' ? -3 : 3);
      event.preventDefault();
    });
    return node;
  };

  /* The divider between the two sections of the keys column. Same behaviour as
     the ones between the columns, one axis over. */
  dock.stackDivider = function (label) {
    var self = this;
    var node = el('div', 'rwb-divider rwb-divider-h');
    node.setAttribute('role', 'separator');
    node.setAttribute('aria-orientation', 'horizontal');
    node.setAttribute('aria-label', label);
    node.setAttribute('tabindex', '0');
    node.addEventListener('pointerdown', function (event) { self.startRowDrag(event); });
    node.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return;
      self.nudgeRows(event.key === 'ArrowUp' ? -4 : 4);
      event.preventDefault();
    });
    return node;
  };

  dock.applyRows = function () {
    if (!this.keysSection) return;
    if (!this.rows) this.rows = DEFAULT_ROWS.slice();
    this.keysSection.style.flex = this.rows[0] + ' 1 0%';
    this.indexSection.style.flex = this.rows[1] + ' 1 0%';
  };

  dock.nudgeRows = function (delta) {
    var top = this.rows[0];
    var bottom = this.rows[1];
    var room = Math.min(delta > 0 ? bottom - MIN_ROW : top - MIN_ROW, Math.abs(delta));
    if (room <= 0) return;
    var step = delta > 0 ? room : -room;
    this.rows = [top + step, bottom - step];
    this.applyRows();
    this.persist();
  };

  dock.startRowDrag = function (event) {
    var self = this;
    var height = this.keysStack.getBoundingClientRect().height;
    if (!height) return;
    var startY = event.clientY;
    var start = this.rows.slice();
    event.preventDefault();

    var move = function (moveEvent) {
      var delta = ((moveEvent.clientY - startY) / height) * 100;
      var top = start[0] + delta;
      var bottom = start[1] - delta;
      if (top < MIN_ROW) { bottom += top - MIN_ROW; top = MIN_ROW; }
      if (bottom < MIN_ROW) { top += bottom - MIN_ROW; bottom = MIN_ROW; }
      self.rows = [top, bottom];
      self.applyRows();
    };
    var up = function () {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('rwb-dragging-y');
      self.persist();
    };
    document.body.classList.add('rwb-dragging-y');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  dock.applyColumns = function () {
    if (!this.split) return;
    /* build() lays the split out before restore() has read anything, so the
       defaults stand in until then. */
    if (!this.columns) this.columns = DEFAULT_COLUMNS.slice();
    var columns = this.split.querySelectorAll('.rwb-col');
    for (var i = 0; i < columns.length; i++) {
      /* Ratios rather than fixed percentages: the dividers take their own width
         out of the split first, and three columns at "0 0 N%" summing to 100 add
         up to more than there is — the last one overflowed past the dock's
         gutter. Growing from a zero basis divides what is actually left. */
      columns[i].style.flex = this.columns[i] + ' 1 0%';
    }
  };

  /* A divider moves the boundary between the two columns it sits between, and
     takes from one to give to the other: the rest of the split keeps its width,
     so dragging one divider never shifts the far column. */
  dock.nudgeColumns = function (index, delta) {
    var left = this.columns[index];
    var right = this.columns[index + 1];
    var room = Math.min(delta > 0 ? right - MIN_COLUMN : left - MIN_COLUMN, Math.abs(delta));
    if (room <= 0) return;
    var step = delta > 0 ? room : -room;
    this.columns[index] = left + step;
    this.columns[index + 1] = right - step;
    this.applyColumns();
    this.persist();
  };

  dock.startColumnDrag = function (event, index) {
    var self = this;
    var width = this.split.getBoundingClientRect().width;
    if (!width) return;
    var startX = event.clientX;
    var start = this.columns.slice();
    event.preventDefault();

    var move = function (moveEvent) {
      var delta = ((moveEvent.clientX - startX) / width) * 100;
      var left = start[index] + delta;
      var right = start[index + 1] - delta;
      if (left < MIN_COLUMN) { right += left - MIN_COLUMN; left = MIN_COLUMN; }
      if (right < MIN_COLUMN) { left += right - MIN_COLUMN; right = MIN_COLUMN; }
      self.columns[index] = left;
      self.columns[index + 1] = right;
      self.applyColumns();
    };
    var up = function () {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      document.body.classList.remove('rwb-dragging-x');
      self.persist();
    };
    document.body.classList.add('rwb-dragging-x');
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  dock.persist = function () {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({
        open: this.isOpen, height: this.height, columns: this.columns,
        rows: this.rows
      }));
    } catch (err) { /* private mode: the dock just won't be remembered */ }
  };

  dock.restore = function () {
    var saved = null;
    try {
      saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (err) { /* ignore malformed state */ }
    this.height = DEFAULT_HEIGHT;
    /* Restored before the split is built, since build() applies them. */
    this.columns = DEFAULT_COLUMNS.slice();
    if (saved && saved.columns && saved.columns.length === 3
      && saved.columns.every(function (n) { return typeof n === 'number' && n >= MIN_COLUMN; })) {
      this.columns = saved.columns.slice();
    }
    this.rows = DEFAULT_ROWS.slice();
    if (saved && saved.rows && saved.rows.length === 2
      && saved.rows.every(function (n) { return typeof n === 'number' && n >= MIN_ROW; })) {
      this.rows = saved.rows.slice();
    }
    if (saved && typeof saved.height === 'number') {
      var max = this.maxHeight();
      this.height = Math.min(max, Math.max(MIN_HEIGHT, saved.height));
      this.maximized = this.height >= max - 1;
    }
    this.applyHeight();
    this.applyColumns();
    this.applyRows();
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
    this.open();
    this.show('terminal');

    /* A snippet in the middle of a tutorial needs what the steps before it did:
       the page keeps those commands in its setup block, and this runs them ahead
       of the snippet the first time they are needed in this sandbox session.
       Once, not per click — the sandbox is a session, and re-creating an index
       and twelve documents on every "Try it" would be a wall of output between
       the reader and the thing they asked for.

       "This session" is this page load: the sandbox mints a new session then, so
       nothing carries over. "Clear keys" empties it, and forgets. */
    var commands = options.commands;
    var setup = options.setup;
    /* What this run makes true, so a failure can take it back. A snippet may
       *be* a part of the setup (provides) and may be prepending the parts it is
       not; either claim is only good if the batch actually runs. */
    var claimed = [];
    var again = false;
    if (options.provides) {
      again = !!this.setupRan[options.provides];
      this.setupRan[options.provides] = true;
      claimed.push(options.provides);
    }
    /* A page's setup can come in parts — the data-modeling step writes product:1
       in the example that introduces JSON.SET and the rest in the block that
       loads them — so each part is remembered on its own, and only the ones this
       sandbox has not had are run. */
    var parts = (setup && setup.parts) ? setup.parts.filter(function (part) {
      return !self.setupRan[part.id];
    }) : [];
    if (parts.length) {
      var before = [];
      parts.forEach(function (part) {
        before = before.concat(part.commands);
        self.setupRan[part.id] = true;
        claimed.push(part.id);
      });
      commands = before.concat(commands);
      this.setStatus('setting this page up first…');
    } else {
      this.setStatus('running the snippet…');
    }

    /* The setup block again, on purpose. It says it re-creates the index, and
       FT.CREATE on an index that is already there is an error — which is what a
       reader got when an earlier "Try it" had already applied the setup for them.
       So the indexes this setup is about to create are dropped first: exactly
       those, parsed from its own commands, and only the ones that exist, so
       neither the drop nor the create has anything to complain about. The
       documents are left to the setup's own writes, which overwrite them. */
    if (again) {
      var drops = recreatedIndexes(commands).filter(function (name) {
        return self.indexes.indexOf(name) !== -1;
      }).map(function (name) { return 'FT.DROPINDEX ' + quote(name); });
      if (drops.length) commands = drops.concat(commands);
    }
    /* Asked for, so shown: wherever the reader had scrolled to, the result of
       this click is what they are waiting for. */
    this.following = true;
    this.scrollTerminal();
    /* Discovery is not kicked off here: running the commands through the
       terminal puts them on the onExecute subscription — which tracks them.
       Doing both would probe every command twice. */
    /* After the terminal has finished starting, not before. createCli is async —
       it runs the widget's own startup batch and only then attaches the submit
       handler — and a first "Try it" used to fire a batch into a form that was
       still mid-init, racing the banner into the same transcript. */
    return (this.terminalReady || Promise.resolve())
      .then(function () { return cli().run(self.terminalForm, commands, 'preset'); })
      .then(function () {
        self.scrollTerminal();
      }, function () {
        /* It did not run, so it did not happen: the next "Try it" must try these
           parts again rather than assume this sandbox has them. */
        claimed.forEach(function (id) { delete self.setupRan[id]; });
        self.setStatus('could not run the snippet');
      });
  };

  /* Empty the sandbox, and nothing else. The transcript is the record of what
     the reader did — including the FLUSHDB itself, since the flush goes through
     the terminal rather than behind its back — and throwing that away is what
     "Clear terminal" is for.

     Going through the terminal also disables the prompt for the flush's duration,
     so a command typed at the wrong moment cannot land in front of it. FLUSHDB
     mints a fresh session on this backend and is intercepted before Redis, so the
     ACL's -flushdb never applies. */
  dock.clearKeys = function () {
    var self = this;
    this.keys = [];
    this.known = [];
    this.indexes = [];
    this.pending = [];
    this.selected = null;
    this.truncated = false;
    this.expiredName = null;
    this.openElement = null;
    /* Nothing left to filter by. */
    this.indexFilter = null;
    this.indexDocs = null;
    /* An emptied sandbox has not had this page's setup either. */
    this.setupRan = {};
    this.clearValue();
    this.renderKeys();
    this.show('terminal');
    this.setStatus('clearing…');
    /* Batches still in flight wrote keys that will not survive the flush, so
       stop tracking until it lands. */
    this.resetting = true;
    return cli().run(this.terminalForm, ['FLUSHDB'], 'interactive').then(function () {
      self.resetting = false;
      self.setStatus(self.summary());
    }, function () {
      /* The flush never reached the server: keep the transcript, since it is the
         only place that says so. */
      self.resetting = false;
    });
  };

  /* Keep the end of the transcript in view.

     The widget scrolls its own box when it is standalone, but in here that box is
     told to grow (height: auto, overflow: visible) and the CLI column does the
     scrolling instead — so nothing was following the output. A snippet appended
     to a transcript that already filled the column landed below the fold, and the
     reader had to scroll to see what their click had done. */
  dock.scrollTerminal = function () {
    var host = this.terminalHost;
    if (!host) return;
    /* Next frame: the lines have to be laid out before scrollHeight means
       anything. */
    window.requestAnimationFrame(function () {
      host.scrollTop = host.scrollHeight;
    });
  };

  /* Mount the dock's terminal, once. cli.js owns it from here: it renders the
     transcript and the prompt, and window.RedisCli.run appends later snippets to
     it rather than replacing it — which is what lets the history survive. */
  dock.startTerminal = function () {
    var self = this;
    this.terminalHost.replaceChildren();
    var form = el('form', 'redis-cli rwb-terminal');
    form.setAttribute('spellcheck', 'false');
    this.terminalForm = form;
    this.terminalHost.appendChild(form);

    /* Follow new output, but only while the reader is already at the end —
       someone who has scrolled up to re-read an earlier reply should not be
       yanked back down by a batch finishing. Clicking "Try it" is the exception:
       that is a request to see the result, so it pins to the end regardless. */
    this.following = true;
    this.terminalHost.addEventListener('scroll', function () {
      var host = self.terminalHost;
      self.following =
        host.scrollHeight - host.scrollTop - host.clientHeight <= TERMINAL_FOLLOW_SLACK;
    });
    if (this.transcriptWatcher) this.transcriptWatcher.disconnect();
    this.transcriptWatcher = new MutationObserver(function () {
      if (self.following) self.scrollTerminal();
    });
    this.transcriptWatcher.observe(form,
      { childList: true, subtree: true, characterData: true });

    return cli().createCli(form).then(function (result) {
      /* Command completion, if it is loaded: the widget builds the prompt, so
         this can only attach once the terminal exists. */
      if (window.RedisCliComplete) window.RedisCliComplete.attach(form);
      return result;
    });
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
    /* Snapshotted, because `known` can grow while the sweep is in flight: a batch
       that lands mid-sweep adds names this reading knows nothing about, and they
       must not be mistaken for keys that have gone. */
    var probed = this.known.slice();
    return readKeyspace(probed, this.indexFilter).then(function (result) {
      self.keys = result.keys;
      self.indexes = result.indexes;
      self.indexDocs = result.docs;
      /* An index the reader is looking at may hold documents the dock never saw
         a command touch — written before it was open, or by the page's own
         inline terminals. Adopt them, so the filtered list is the index's
         documents and not the part of them this session happens to have
         watched. One extra sweep describes them; adopting nothing new sweeps no
         further, which is what stops this recurring. */
      var adopted = false;
      (result.docs || []).forEach(function (name) {
        if (self.known.indexOf(name) === -1) {
          self.known.push(name);
          adopted = true;
        }
      });
      if (self.known.length > MAX_TRACKED_KEYS) {
        self.known = self.known.slice(self.known.length - MAX_TRACKED_KEYS);
        self.truncated = true;
      }
      /* The filter is only as good as the index behind it: if it has gone —
         FLUSHDB, FT.DROPINDEX — the list goes back to everything. */
      if (self.indexFilter && result.indexes.indexOf(self.indexFilter) === -1) {
        self.indexFilter = null;
        self.indexDocs = null;
      }
      /* Forget what no longer exists. Without this a deleted or expired key stays
         on the list of names to describe and is re-probed on every later sweep,
         which costs commands on a shared backend for a key that is not there.
         Only names this sweep actually asked about are candidates for removal. */
      var alive = {};
      result.keys.forEach(function (key) { alive[key.name] = true; });
      self.known = self.known.filter(function (name) {
        return alive[name] || probed.indexOf(name) === -1;
      });
      self.renderKeys();
      /* A sweep can bring in a key with an expiry after the ticker stopped for
         want of one. */
      if (self.isOpen && self.keys.some(function (key) {
        return typeof key.ttl === 'number' && key.ttl >= 0;
      })) self.startTtlTicker();
      /* Only announce a total once nothing else is in flight: a sweep that
         finishes while discovery is still running, or with another sweep queued
         behind it, is an intermediate reading — reporting it would flicker a
         number that is about to change. */
      if (!self.busy && !self.nextSweep) self.setStatus(self.summary());
      /* An open index is re-read: the last batch may have added documents to it,
         and before this a sweep took the index view away — "select a key" in
         place of the schema the reader was reading. */
      if (self.selected && result.indexes.indexOf(self.selected) !== -1) {
        self.showIndex(self.selected);
      /* A selected key may have been deleted or changed by the last batch. */
      } else if (self.selected && !self.find(self.selected)) {
        self.selected = null;
        self.openElement = null;
        self.clearValue();
      } else if (self.openElement && self.openElement.name === self.selected) {
        /* An element is open: keep showing it, with whatever the last batch did
           to it — a VSETATTR on this element should appear, not close the view. */
        self.openVectorElement(self.find(self.selected), self.openElement.element);
      } else if (self.selected) {
        self.openKey(self.selected);
      }
      if (adopted) return self.refreshSoon();
    }, function () {
      /* The next command, or the next time the panel is opened, tries again. */
      self.setStatus('could not read the keyspace');
    });
  };

  /* ---- expiry ----

     Counted on the client, from the TTL the last sweep read and the moment it
     read it. Re-asking the server every second would spend a command per key per
     tick on a shared backend to learn something arithmetic can tell us. When a
     countdown reaches zero the row goes at once — that is when the key is gone —
     and a single sweep follows to confirm it with the server, which also puts the
     row back in the unlikely case it is still there. */

  var TTL_TICK_MS = 1000;

  /* Seconds left, or the raw TTL for the cases that do not count down: -1 is "no
     expiry", -2 is "already gone". */
  dock.remainingTtl = function (key) {
    if (typeof key.ttl !== 'number' || key.ttl < 0) return key.ttl;
    var elapsed = (Date.now() - (key.readAt || Date.now())) / 1000;
    return Math.max(0, Math.round(key.ttl - elapsed));
  };

  dock.startTtlTicker = function () {
    var self = this;
    if (this.ttlTimer) return;
    this.ttlTimer = window.setInterval(function () { self.tickTtls(); }, TTL_TICK_MS);
  };

  dock.stopTtlTicker = function () {
    if (!this.ttlTimer) return;
    window.clearInterval(this.ttlTimer);
    this.ttlTimer = null;
  };

  dock.tickTtls = function () {
    var self = this;
    /* Nothing to show while closed, and no reason to keep counting. */
    if (!this.isOpen) return;
    var expired = [];
    var perishable = false;

    this.keys.forEach(function (key) {
      if (typeof key.ttl !== 'number' || key.ttl < 0) return;
      perishable = true;
      var left = self.remainingTtl(key);
      if (left <= 0) {
        expired.push(key.name);
        return;
      }
      /* Only the text is replaced: rebuilding the row every second would fight
         the pointer and reset the scroll. */
      var node = self.ttlNodes[key.name];
      if (node) node.textContent = 'TTL ' + humanTtl(left);
      if (self.selected === key.name && self.valueTtlNode) {
        self.valueTtlNode.textContent = humanTtl(left);
      }
    });

    if (!perishable) {
      /* Every expiry is accounted for; stop until a sweep brings another. */
      this.stopTtlTicker();
      return;
    }
    if (!expired.length) return;

    this.keys = this.keys.filter(function (key) {
      return expired.indexOf(key.name) === -1;
    });
    if (this.selected && expired.indexOf(this.selected) >= 0) {
      /* Recorded rather than written straight into the panel: the sweep that
         follows re-renders, and renderKeys() resets an unselected value column —
         which would replace this with the generic "select a key". It stays until
         the reader picks something else, because "where did my key go" deserves an
         answer that outlives the next redraw. */
      this.expiredName = this.selected;
      this.selected = null;
      this.openElement = null;
      this.valueTtlNode = null;
      this.clearValue();
    }
    this.renderKeys();
    this.setStatus(this.summary());
    /* `known` is left alone on purpose: the sweep decides whether the key has
       really gone, and if it has not, it is still on the list to re-describe. */
    this.refreshSoon();
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
    /* Rebuilt with the rows they belong to. */
    this.ttlNodes = {};
    var self = this;
    /* "No keys yet" and "pick one" are different messages, and which is true
       changes as keys arrive — so the value column follows the list while nothing
       is selected. */
    if (!this.selected) this.clearValue();
    var list = this.keyList;
    list.replaceChildren();

    /* Filtered to one index's documents, or the whole sandbox. */
    var docs = this.indexFilter && this.indexDocs ? this.indexDocs : null;
    var shown = docs ? this.keys.filter(function (key) {
      return docs.indexOf(key.name) !== -1;
    }) : this.keys;
    this.keyCount.textContent = shown.length ? String(shown.length) : '';
    this.renderIndexChip(shown.length);

    if (!shown.length) {
      list.appendChild(el('p', 'rwb-empty', this.indexFilter
        ? 'No documents in ' + this.indexFilter + ' yet.'
        : 'No keys. Commands that write keys show up here as they run.'));
    }

    shown.forEach(function (key) {
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
      /* Only the expiry under the name. The length is on the value beside it, and
         a list of keys is for finding one, not for reading it twice. */
      var sub = el('span', 'rwb-key-sub');
      if (typeof key.ttl === 'number' && key.ttl >= 0) {
        var ttlNode = el('span', 'rwb-key-ttl',
          'TTL ' + humanTtl(self.remainingTtl(key)));
        /* Held by name so the ticker can rewrite just this text. */
        self.ttlNodes[key.name] = ttlNode;
        sub.appendChild(ttlNode);
      }
      text.appendChild(sub);
      item.appendChild(text);
      item.title = key.name + ' — ' + meta.label;
      item.addEventListener('click', function () { self.openKey(key.name); });
      list.appendChild(item);
    });

    this.renderIndexes();
  };

  /* "in idx:catalog ×" beside the KEYS count while an index is selected: the
     list is showing part of the sandbox, and a list that hides things without
     saying so is a list that has lost the reader's trust. */
  dock.renderIndexChip = function () {
    if (!this.indexFilter) {
      if (this.indexChip) {
        this.indexChip.remove();
        this.indexChip = null;
      }
      return;
    }
    if (!this.indexChip) {
      this.indexChip = el('button', 'rwb-chip');
      this.indexChip.type = 'button';
      var self = this;
      this.indexChip.addEventListener('click', function () {
        self.clearIndexFilter();
      });
      this.keyCount.parentNode.appendChild(this.indexChip);
    }
    this.indexChip.replaceChildren();
    this.indexChip.appendChild(el('span', null, 'in ' + this.indexFilter));
    this.indexChip.appendChild(el('span', 'rwb-chip-x', '\u00d7'));
    this.indexChip.title = 'Showing only the documents in ' + this.indexFilter
      + ' — click to show every key again';
  };

  /* The lower half of the column. Present only once the session has an index in
     it: most pages never create one, and an empty box with a heading would take
     a third of a list that a short dock has little enough of. FT.CREATE puts it
     there, and dragging the divider is then how a reader shares the space out. */
  dock.renderIndexes = function () {
    var self = this;
    var showing = this.indexes.length > 0;
    this.indexSection.hidden = !showing;
    this.rowDivider.hidden = !showing;
    this.indexCount.textContent = showing ? String(this.indexes.length) : '';
    var list = this.indexList;
    list.replaceChildren();
    if (!showing) return;

    this.indexes.forEach(function (name) {
      var item = el('button', 'rwb-key');
      item.type = 'button';
      if (name === self.selected) {
        item.classList.add('rwb-key-on');
        item.setAttribute('aria-current', 'true');
      }
      item.appendChild(el('span', 'rwb-badge rwb-tone-index', 'index'));
      var text = el('span', 'rwb-key-text');
      text.appendChild(el('span', 'rwb-key-name', name));
      item.appendChild(text);
      item.title = name + ' — search index';
      item.addEventListener('click', function () { self.openIndex(name); });
      list.appendChild(item);
    });
  };

  /* ---- value column ---- */

  /* Nothing selected, or nothing left to select. Says which, because "no keys
     yet" and "pick one" are different situations for a reader. */
  dock.clearValue = function () {
    this.valuePane.replaceChildren();
    this.valuePane.appendChild(el('p', 'rwb-empty', this.expiredName
      ? this.expiredName + ' has expired.'
      : (this.keys.length ? 'Select a key to see its value.' : 'No value to show yet.')));
  };


  /* `quiet` is gone: it used to suppress switching to the Value tab, and there is
     no tab to switch to now that the value has a column of its own. */
  dock.openKey = function (name) {
    var self = this;
    var key = this.find(name);
    if (!key) return;
    this.expiredName = null;
    this.openElement = null;
    this.selected = name;
    this.renderKeys();

    var probe = valueProbe(name, key.type, key.size);
    /* Neither MEMORY USAGE nor OBJECT ENCODING. Both describe what is actually
       stored, and what is actually stored here is not what a reader would have on
       their own Redis:

         - the key is namespaced per browser session, so MEMORY USAGE counts 37
           bytes of `<session-uuid>:` prefix — 72 B where Redis Insight and a
           local redis-cli both say 40 B for `SET bike:1 Deimos`;
         - the encoding of that same value comes back `raw` through this backend
           where a plain SET on the very same server gives `embstr` (verified
           against the object itself, so the value really is raw — something in
           the write path, not a mangled reply).

       Either would have a reader comparing notes with their own terminal and
       finding the docs wrong. What is left is true in both places: the value's
       length, its TTL, and the value. */
    var commands = probe ? probe.commands : [];

    this.begin('reading ' + name + '…');
    if (!commands.length) {
      /* Nothing to read: a type with no enumerable value (the probabilistic
         ones). Render what the sweep already knows and spend no commands. */
      this.renderValue(key, { view: null, commands: [] });
      this.end();
      return Promise.resolve();
    }
    return run(commands).then(function (replies) {
      self.renderValue(key, {
        view: probe.build(replies),
        commands: probe.commands
      });
      self.end();
    }, function () {
      self.end();
    });
  };

  /* One element of a vector set: its embedding and its attributes, the pair Redis
     Insight shows behind the magnifier on each row. VEMB answers the vector,
     VGETATTR the metadata — nil when none was ever set, which is not an error and
     is said as such. */
  dock.openVectorElement = function (key, element) {
    var self = this;
    /* Remembered so a sweep can put it back: any command runs one, and the sweep
       re-renders whatever is selected — which used to mean the element view was
       replaced by the key's own the moment the reader typed anything. */
    this.openElement = { name: key.name, element: element };
    var commands = [
      'VEMB ' + quote(key.name) + ' ' + quote(element),
      'VGETATTR ' + quote(key.name) + ' ' + quote(element)
    ];
    this.begin('reading ' + element + '…');
    return run(commands).then(function (replies) {
      self.renderVectorElement(key, element, {
        vector: ok(replies[0]),
        attributes: ok(replies[1]),
        commands: commands
      });
      self.end();
    }, function () {
      self.end();
      self.setStatus('could not read ' + element);
    });
  };

  dock.renderVectorElement = function (key, element, detail) {
    var self = this;
    var pane = this.valuePane;
    pane.replaceChildren();

    var head = el('div', 'rwb-value-head');
    /* Back to the element list, since this replaced it. */
    var back = el('button', 'rwb-back', '← ' + key.name);
    back.type = 'button';
    back.title = 'Back to the elements of ' + key.name;
    back.addEventListener('click', function () { self.openKey(key.name); });
    head.appendChild(back);
    head.appendChild(el('code', 'rwb-value-name', element));
    pane.appendChild(head);

    pane.appendChild(el('div', 'rwb-group', 'Vector'));
    var vector = Array.isArray(detail.vector) ? detail.vector.map(cellText) : null;
    if (vector) {
      pane.appendChild(el('p', 'rwb-hint',
        'The embedding for this element, ' + plural(vector.length, 'dimension') + '.'));
      pane.appendChild(el('pre', 'rwb-text', '[' + vector.join(', ') + ']'));
    } else {
      pane.appendChild(el('p', 'rwb-empty', 'No vector came back for this element.'));
    }

    pane.appendChild(el('div', 'rwb-group', 'Attributes'));
    var attributes = detail.attributes === null || detail.attributes === undefined
      ? null : cellText(detail.attributes);
    if (attributes) {
      pane.appendChild(el('p', 'rwb-hint',
        'Metadata on this element, for filtering a similarity search.'));
      pane.appendChild(el('pre', 'rwb-text rwb-json', attributes));
    } else {
      pane.appendChild(el('p', 'rwb-empty',
        'None set. VSETATTR attaches JSON metadata to an element.'));
    }

    pane.appendChild(ranNote(detail.commands));
  };

  dock.openIndex = function (name) {
    var self = this;
    this.selected = name;
    this.expiredName = null;
    /* Opening an index also narrows the key list to the documents it holds —
       what Insight's index selector does. The reader can then click through the
       documents of one index without the rest of the sandbox in the way, and the
       chip in the KEYS heading is the way back out. */
    this.indexFilter = name;
    this.renderKeys();
    return this.showIndex(name).then(function () {
      /* The documents come with the next sweep, in its batch rather than a round
         trip of their own. */
      return self.refreshSoon();
    });
  };

  /* Read an index and draw it, without touching the filter or asking for a sweep
     — which is what lets a sweep redraw the open index instead of closing it. */
  dock.showIndex = function (name) {
    var self = this;
    this.begin('reading ' + name + '…');
    return run(['FT.INFO ' + quote(name)]).then(function (replies) {
      var info = fieldMap(ok(replies[0]));
      self.renderIndex(name, info);
      self.end();
    }, function () { self.end(); });
  };

  /* Back to the whole sandbox. */
  dock.clearIndexFilter = function () {
    if (!this.indexFilter) return;
    this.indexFilter = null;
    this.indexDocs = null;
    this.renderKeys();
    this.setStatus(this.summary());
  };

  /* What Insight's "View index" panel shows, for the same reason it shows it: an
     index is a schema, and the useful thing about it is what it indexes and how
     — not its internal counters. So: one sentence for the definition, the schema
     as a table of identifier, attribute, type and weight, and the three counts
     Insight puts under it. Everything else FT.INFO returns is left to FT.INFO. */
  dock.renderIndex = function (name, info) {
    var pane = this.valuePane;
    pane.replaceChildren();

    var head = el('div', 'rwb-value-head');
    head.appendChild(el('span', 'rwb-badge rwb-tone-index', 'index'));
    head.appendChild(el('code', 'rwb-value-name', name));

    var facts = el('span', 'rwb-facts');
    var docs = cellText(info['num_docs']);
    var maxDoc = cellText(info['max_doc_id']);
    if (docs !== 'undefined' && docs !== '') {
      var docsFact = el('span', 'rwb-fact',
        'Docs: ' + docs + (maxDoc && maxDoc !== docs ? ' (max ' + maxDoc + ')' : ''));
      docsFact.title = 'Documents indexed, from FT.INFO num_docs';
      facts.appendChild(docsFact);
    }
    [['num_records', 'Records', 'Index entries, from FT.INFO num_records'],
     ['num_terms', 'Terms', 'Distinct terms, from FT.INFO num_terms']
    ].forEach(function (spec) {
      var value = cellText(info[spec[0]]);
      if (value === 'undefined' || value === '') return;
      var fact = el('span', 'rwb-fact', spec[1] + ': ' + value);
      fact.title = spec[2];
      facts.appendChild(fact);
    });
    var failures = Number(cellText(info['hash_indexing_failures']));
    if (failures > 0) {
      /* Worth saying out loud: a schema that does not match its documents indexes
         nothing, and silently. */
      var failed = el('span', 'rwb-fact rwb-fact-warn',
        plural(failures, 'indexing failure'));
      failed.title = 'Documents the schema could not index, from FT.INFO '
        + 'hash_indexing_failures';
      facts.appendChild(failed);
    }
    head.appendChild(facts);
    pane.appendChild(head);

    /* "Indexing JSON documents prefixed by "product:"." — Insight's own sentence,
       read out of index_definition. */
    var definition = fieldMap(info['index_definition']);
    var keyType = cellText(definition['key_type'] || 'HASH');
    var prefixes = (Array.isArray(definition['prefixes'])
      ? definition['prefixes'] : []).map(cellText).filter(function (prefix) {
        return prefix !== '';
      });
    var sentence = 'Indexing ' + (keyType === 'JSON' ? 'JSON documents' : 'hashes');
    sentence += prefixes.length
      ? ' whose keys start with ' + prefixes.map(function (prefix) {
          return '"' + prefix + '"';
        }).join(' or ') + '.'
      : ' anywhere in the keyspace.';
    pane.appendChild(el('p', 'rwb-hint', sentence));

    var filter = definition['filter'] ? cellText(definition['filter']) : '';
    var options = (Array.isArray(info['index_options'])
      ? info['index_options'] : []).map(cellText);
    if (filter) options.push('FILTER ' + filter);
    if (options.length) {
      pane.appendChild(el('p', 'rwb-hint', 'Options: ' + options.join(', ')));
    }

    var fields = (Array.isArray(info['attributes']) ? info['attributes'] : [])
      .map(schemaField);
    if (!fields.length) {
      pane.appendChild(el('p', 'rwb-empty', 'This index has no schema.'));
      pane.appendChild(ranNote(['FT.INFO ' + quote(name)]));
      return;
    }

    /* Insight's four columns, and Weight only when something carries one: a
       column with nothing in it is a column that should not be there. The flags
       — SORTABLE, NOSTEM, CASESENSITIVE — go beside the type they qualify rather
       than into a fifth column, which in a column the reader can narrow would be
       the one that gets pushed off the edge. */
    var hasWeight = fields.some(function (field) { return !!field.weight; });
    var columns = ['Identifier', 'Attribute', 'Type'];
    if (hasWeight) columns.push('Weight');

    var table = el('table', 'rwb-table rwb-table-fit');
    var thead = el('thead');
    var headRow = el('tr');
    columns.forEach(function (label) { headRow.appendChild(el('th', null, label)); });
    thead.appendChild(headRow);
    table.appendChild(thead);

    var body = el('tbody');
    fields.forEach(function (field) {
      var row = el('tr');
      row.appendChild(el('td', null, field.identifier || ''));
      row.appendChild(el('td', null, field.attribute || ''));
      var type = String(field.type || '').toUpperCase();
      var typeCell = el('td');
      typeCell.appendChild(el('span',
        'rwb-badge rwb-field-' + (FIELD_TONES[type] || 'other'), type || '?'));
      field.flags.forEach(function (flag) {
        typeCell.appendChild(el('span', 'rwb-flag', flag));
      });
      row.appendChild(typeCell);
      if (hasWeight) row.appendChild(el('td', null, field.weight || ''));
      body.appendChild(row);
    });
    table.appendChild(body);
    /* Five columns in a column the reader can narrow to nothing: let the table
       scroll sideways rather than clip a flag half way through. */
    var wrap = el('div', 'rwb-table-wrap');
    wrap.appendChild(table);
    pane.appendChild(wrap);

    pane.appendChild(ranNote(['FT.INFO ' + quote(name)]));
  };

  dock.renderValue = function (key, detail) {
    var self = this;
    var meta = TYPES[key.type] || { label: key.type, tone: 'other' };
    var pane = this.valuePane;
    pane.replaceChildren();

    var head = el('div', 'rwb-value-head');
    head.appendChild(el('span', 'rwb-badge rwb-tone-' + meta.tone, meta.label));
    head.appendChild(el('code', 'rwb-value-name', key.name));
    var facts = el('span', 'rwb-facts');
    if (key.sizeLabel) {
      var sizeFact = el('span', 'rwb-fact', key.sizeLabel);
      sizeFact.title = sizeSource(key.type) || 'Size of the value';
      facts.appendChild(sizeFact);
    }
    this.valueTtlNode = el('span', 'rwb-fact', humanTtl(this.remainingTtl(key)));
    this.valueTtlNode.title = 'Time to live, from TTL';
    facts.appendChild(this.valueTtlNode);
    /* A type can carry its own facts — a vector set's quantisation and
       dimensionality, which mean nothing for anything else. */
    if (detail.view && detail.view.facts) {
      detail.view.facts.forEach(function (fact) {
        var node = el('span', 'rwb-fact', fact.text);
        if (fact.title) node.title = fact.title;
        facts.appendChild(node);
      });
    }
    head.appendChild(facts);
    pane.appendChild(head);

    if (!detail.view) {
      pane.appendChild(el('p', 'rwb-empty',
        'This type stores no enumerable value, so there is nothing to preview.'));
    } else {
      pane.appendChild(renderView(detail.view, detail.view.elements
        ? function (element) { self.openVectorElement(key, element); }
        : null));
      /* Say what was left out, so a partial read is never mistaken for the whole
         value — the command above it is bounded for a reason. */
      if (detail.view.limited) {
        pane.appendChild(el('p', 'rwb-limited', 'Showing '
          + detail.view.limited.shown + ' of ' + detail.view.limited.of));
      }
    }
    if (detail.commands.length) pane.appendChild(ranNote(detail.commands));
  };

  function renderView(view, onOpenRow) {
    if (view.kind === 'text') {
      return el('pre', 'rwb-text' + (view.mono ? ' rwb-json' : ''), view.text);
    }
    if (view.kind === 'table') {
      return renderTable(view.head, view.rows, onOpenRow);
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

  function renderTable(head, rows, onOpenRow) {
    if (!rows || !rows.length) return el('p', 'rwb-empty', 'Empty.');
    var table = el('table', 'rwb-table');
    var thead = el('thead');
    var headRow = el('tr');
    head.forEach(function (cell) { headRow.appendChild(el('th', null, cell)); });
    /* The column the open control lives in, unlabelled as in Insight. */
    if (onOpenRow) headRow.appendChild(el('th', 'rwb-col-open', ''));
    thead.appendChild(headRow);
    table.appendChild(thead);
    var tbody = el('tbody');
    rows.forEach(function (row) {
      var tr = el('tr');
      row.forEach(function (cell) { tr.appendChild(el('td', null, cellText(cell))); });
      if (onOpenRow) {
        var cell = el('td', 'rwb-col-open');
        var open = el('button', 'rwb-open-row', 'View');
        open.type = 'button';
        open.title = 'Show this element\'s vector and attributes';
        open.addEventListener('click', function () { onOpenRow(cellText(row[0])); });
        cell.appendChild(open);
        tr.appendChild(cell);
      }
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
    /* `.thebe-container` is in here for the notebook pane: a client page can have
       runnable cells and no CLI terminal at all. */
    return !!document.querySelector('form.redis-cli, .tryit-button, .thebe-container');
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
       options: {commands[]}. The callers also pass `button`, `snippet` and
       `fullCliUrl`, none of which the dock reads: the snippet id was only ever an
       internal handle, and `fullCliUrl` is the caller's own fallback for when
       there is no dock to open — it opens the standalone CLI itself when this
       returns false. */
    open: function (options) {
      if (!options || !options.commands || !options.commands.length) return false;
      var instance = ensureDock();
      if (!instance) return false;
      /* options.setup is the page's setup block — the "Reload the data and
         re-create the index" the tutorials keep in a <details> — and
         options.provides names the setup this snippet *is*. See
         layouts/partials/tryit-script.html. */
      instance.load({
        commands: options.commands,
        setup: options.setup,
        provides: options.provides
      });
      return true;
    },

    /* Open, close or toggle the dock without loading a snippet. */
    toggle: function () {
      var instance = ensureDock();
      if (instance) instance.toggle();
    },

    /* Add a pane of your own beside Terminal and Value, for something the dock
       itself has no business knowing about — the Thebe notebook prototype in
       js/redis-workbench-notebook.js is the first of these.

       spec: {id, label, onMount(pane, api), onShow(pane, shown)}
       api:  {open, isOpen, setStatus, show, dock}

       Returns false when there is no dock on this page (no Redis examples, or a
       backend without the widget API), so a caller can stay quiet. */
    addPane: function (spec) {
      var instance = ensureDock();
      if (!instance || !spec || !spec.id) return false;
      var entry = instance.addPane(spec.id, spec.label, spec.onShow);
      if (spec.onMount) {
        spec.onMount(entry.pane, {
          open: function () { instance.open(); },
          isOpen: function () { return instance.isOpen; },
          setStatus: function (text) { instance.setStatus(text); },
          show: function () { instance.show(spec.id); },
          dock: instance
        });
      }
      return entry;
    },

    /* Mount the dock even when no snippet has been run, so a consumer that has
       something to show (a page of notebook cells) can put its pane up. */
    ensure: function () {
      return !!ensureDock();
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountWhenReady);
  } else {
    mountWhenReady();
  }
})();

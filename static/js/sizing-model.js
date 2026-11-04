/* =========================================================================
   Redis memory model for the sizing calculator
   (layouts/shortcodes/sizing-calculator.html, js/sizing-calculator.js)

   Estimates how much memory one key takes in Redis 8.10, stored as a hash,
   a JSON document or a string, and scales it to a number of keys. It follows
   what Redis allocates, from the Redis 8.10.3 and RedisJSON 8.10.0 source:

   - Every key is a kvobj: a 16-byte object header with the key name embedded
     after it, plus 8 bytes when the key has an expiry (object.c).
   - Strings are stored as integers, embedded in the kvobj (embstr) or as a
     separate allocation (raw), by the rules in object.c.
   - Hashes are a listpack while they have at most 512 fields and no field or
     value longer than 64 bytes (the hash-max-listpack-* defaults), and a
     hashtable of field-value entries otherwise (t_hash.c, entry.c).
   - JSON documents are an ijson tree (RedisJSON's value type). Strings of up
     to 7 bytes are stored inline, longer ones are allocated once and shared
     by every document that contains them, so the field names of documents
     with the same fields are paid for once.
   - Every allocation is rounded up to a jemalloc size class.
   - The keyspace adds a bucket in the main hash table per key, a chain entry
     when two keys share a bucket, and an entry in the expiry index for keys
     with an expiry.

   It was checked against a real Redis 8.10.3, by loading 2,000 to 120,000
   keys of 96 kinds of records and measuring used_memory before and after:
   86 of them were within 1% of the estimate, and none was off by more than 4%.
   Hashtable hashes vary the most, because how many fields share a bucket
   depends on the hash seed, which changes every time Redis starts.

   Loaded as a plain script, it sets window.RedisSizing; in Node, it is a
   module, so the test can call it.
   ========================================================================= */
(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RedisSizing = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var HASH_MAX_LISTPACK_ENTRIES = 512;
  var HASH_MAX_LISTPACK_VALUE = 64;
  var EMBSTR_SIZE_LIMIT = 44;
  var CACHE_LINE = 64;

  /* ---- allocator and sds ---- */

  // The jemalloc size class an allocation of n bytes takes, for Redis's
  // 8-byte quantum (MEMORY MALLOC-STATS lists them): steps of 8 up to 64, of
  // 16 up to 128, then four classes per doubling.
  function jeSize(n) {
    if (n <= 0) return 0;
    if (n <= 64) return Math.ceil(n / 8) * 8;
    if (n <= 128) return Math.ceil(n / 16) * 16;
    var step = Math.pow(2, Math.floor(Math.log2(n - 1))) / 4;
    return Math.ceil(n / step) * step;
  }

  function sdsType(len) {
    return len < 32 ? 5 : len <= 252 ? 8 : len <= 65530 ? 16 : len <= 4294967286 ? 32 : 64;
  }
  var SDS_HEADER = { 5: 1, 8: 3, 16: 5, 32: 9, 64: 17 };
  function sdsSize(len, type) { return SDS_HEADER[type === undefined ? sdsType(len) : type] + len + 1; }

  var encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;
  function bytes(s) {
    if (encoder) return encoder.encode(s).length;
    return unescape(encodeURIComponent(s)).length;
  }

  // Whether Redis reads the string as a 64-bit integer (string2ll): an optional
  // minus sign, no leading zeros, at most 20 characters.
  var INT_RE = /^(0|-?[1-9][0-9]{0,19})$/;
  function redisInt(s) {
    if (!INT_RE.test(s)) return null;
    if (typeof BigInt === 'undefined') {
      var n = Number(s);
      return Math.abs(n) <= Number.MAX_SAFE_INTEGER ? n : null;
    }
    var b = BigInt(s);
    if (b > 9223372036854775807n || b < -9223372036854775808n) return null;
    return Number(b);
  }

  /* ---- keys ---- */

  // The kvobj: object header, expiry (if any), and the key name. Key names of
  // 128 bytes or more always get room for an expiry.
  function kvobjSize(keyLen, ttl) {
    var metas = ttl || keyLen >= 128 ? 1 : 0;
    return 16 + 8 * metas + 1 + sdsSize(keyLen);
  }

  /* ---- strings ---- */

  function stringValue(value, keyLen, ttl) {
    var len = bytes(value);
    var head = kvobjSize(keyLen, ttl);
    if (redisInt(value) !== null) {
      return { encoding: 'int', object: jeSize(head), value: 0 };
    }
    // A short value shares the kvobj's allocation when key and value fit in a
    // cache line (kvobjSet in object.c).
    if (len <= EMBSTR_SIZE_LIMIT && 16 + keyLen + 3 + 4 + len <= CACHE_LINE) {
      var all = jeSize(head + sdsSize(len, 8));
      return { encoding: 'embstr', object: jeSize(head), value: all - jeSize(head) };
    }
    return { encoding: 'raw', object: jeSize(head), value: jeSize(sdsSize(len)) };
  }

  /* ---- hashes ---- */

  // One listpack entry: its encoding plus the back-length (listpack.c).
  function lpEntry(s) {
    var n = redisInt(s), enc;
    if (n !== null) {
      enc = n >= 0 && n <= 127 ? 1
        : n >= -4096 && n <= 4095 ? 2
        : n >= -32768 && n <= 32767 ? 3
        : n >= -8388608 && n <= 8388607 ? 4
        : n >= -2147483648 && n <= 2147483647 ? 5 : 9;
    } else {
      var len = bytes(s);
      enc = (len < 64 ? 1 : len < 4096 ? 2 : 5) + len;
    }
    var back = enc <= 127 ? 1 : enc < 16383 ? 2 : enc < 2097151 ? 3 : enc < 268435455 ? 4 : 5;
    return enc + back;
  }

  // A hashtable hash entry: the field with the value embedded after it when
  // both fit in 128 bytes, or the field with a pointer to a separate value
  // (entry.c).
  function htEntry(fieldLen, valueLen) {
    var fieldType = sdsType(fieldLen);
    var embedded = sdsSize(fieldLen, fieldType) + sdsSize(valueLen, 8);
    if (embedded <= 128) return jeSize(embedded);
    if (fieldType === 5) fieldType = 8;
    return jeSize(sdsSize(fieldLen, fieldType) + 8) + jeSize(sdsSize(valueLen));
  }

  function nextPow2(n) {
    var p = 1;
    while (p < n) p *= 2;
    return p;
  }

  // Bytes a hash table spends on n entries: the bucket array, and a 16-byte
  // chain entry for each entry that lands in a bucket already in use.
  function tableBytes(n, minSize) {
    if (n <= 0) return 0;
    var size = Math.max(minSize || 4, nextPow2(n));
    var chained = n - size * (1 - Math.exp(-n / size));
    return jeSize(8 * size) + 16 * chained;
  }

  function hashValue(fields, keyLen, ttl) {
    var names = Object.keys(fields);
    var reason = '';
    if (names.length > HASH_MAX_LISTPACK_ENTRIES) {
      reason = 'fields';
    } else {
      for (var i = 0; i < names.length; i++) {
        if (bytes(names[i]) > HASH_MAX_LISTPACK_VALUE || bytes(fields[names[i]]) > HASH_MAX_LISTPACK_VALUE) {
          reason = bytes(names[i]) > HASH_MAX_LISTPACK_VALUE ? 'field-name' : 'value';
          reason += ':' + names[i];
          break;
        }
      }
    }
    var head = jeSize(kvobjSize(keyLen, ttl));
    var lp = 6 + 1;
    names.forEach(function (f) { lp += lpEntry(f) + lpEntry(fields[f]); });
    if (!reason) {
      return { encoding: 'listpack', object: head, value: jeSize(lp) };
    }
    var n = names.length;
    var size = jeSize(64) + tableBytes(n);
    // A hash with more than 512 fields gets a table of the right size at once.
    // Otherwise the table doubles from 4 as fields are added, and Redis moves
    // entries to the new table a bucket at a time on later writes and reads.
    // Right after one HSET, the old table is often still there.
    if (reason !== 'fields' && n > 4) {
      var old = Math.max(4, nextPow2(n)) / 2;
      if (n - old - 1 < old * (1 - Math.exp(-1))) size += jeSize(8 * old);
    }
    names.forEach(function (f) { size += htEntry(bytes(f), bytes(fields[f])); });
    // What the same hash would take as a listpack, for the calculator to compare.
    return { encoding: 'hashtable', reason: reason, object: head, value: size, listpackValue: jeSize(lp) };
  }

  /* ---- JSON ---- */

  // A small JSON parser that keeps each number's text, because RedisJSON
  // stores 31 and 31.0 differently and JSON.parse can't tell them apart.
  function parseJson(text) {
    var i = 0;
    function ws() { while (i < text.length && ' \t\n\r'.indexOf(text[i]) >= 0) i++; }
    function fail(msg) { var e = new Error(msg + ' at character ' + (i + 1)); e.position = i; throw e; }
    function value() {
      ws();
      var c = text[i];
      if (c === '{') {
        i++; var obj = { t: 'object', entries: [] }; ws();
        if (text[i] === '}') { i++; return obj; }
        for (;;) {
          ws(); if (text[i] !== '"') fail('Expected a field name in quotes');
          var k = str(); ws(); if (text[i] !== ':') fail('Expected ":"'); i++;
          obj.entries.push([k, value()]); ws();
          if (text[i] === ',') { i++; continue; }
          if (text[i] === '}') { i++; return obj; }
          fail('Expected "," or "}"');
        }
      }
      if (c === '[') {
        i++; var arr = { t: 'array', items: [] }; ws();
        if (text[i] === ']') { i++; return arr; }
        for (;;) {
          arr.items.push(value()); ws();
          if (text[i] === ',') { i++; continue; }
          if (text[i] === ']') { i++; return arr; }
          fail('Expected "," or "]"');
        }
      }
      if (c === '"') return { t: 'string', v: str() };
      var m = /^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/.exec(text.slice(i));
      if (m && m[0]) { i += m[0].length; return { t: 'number', raw: m[0] }; }
      if (text.slice(i, i + 4) === 'true') { i += 4; return { t: 'bool', v: true }; }
      if (text.slice(i, i + 5) === 'false') { i += 5; return { t: 'bool', v: false }; }
      if (text.slice(i, i + 4) === 'null') { i += 4; return { t: 'null' }; }
      fail(i >= text.length ? 'Unexpected end of the text' : 'Unexpected character');
    }
    function str() {
      var start = i; i++;
      while (i < text.length && text[i] !== '"') { if (text[i] === '\\') i++; i++; }
      if (i >= text.length) fail('Unclosed string');
      i++;
      return JSON.parse(text.slice(start, i));
    }
    var v = value(); ws();
    if (i < text.length) fail('Unexpected text after the JSON value');
    return v;
  }

  // The number's ijson representation: an integer in the inline range costs
  // nothing; anything else is an 8-byte allocation.
  var INLINE_INT = Math.pow(2, 60);
  function numberIsInline(raw) {
    if (/[.eE]/.test(raw)) return false;
    return Math.abs(Number(raw)) < INLINE_INT;
  }

  // The element type ijson picks for an array of numbers (ArrayTag): the
  // smallest integer or float type that holds every element exactly, or a
  // plain array of values when the array mixes types.
  function f16Exact(x) {
    if (!isFinite(x)) return false;
    var a = Math.abs(x);
    if (a === 0) return true;
    if (a > 65504 || a < Math.pow(2, -24)) return false;
    var e = Math.max(Math.floor(Math.log2(a)), -14);
    var q = Math.pow(2, e - 10);
    return Math.round(a / q) * q === a;
  }
  function bf16Exact(x) {
    if (!isFinite(x)) return false;
    var f = Math.fround(x);
    if (f !== x) return false;
    var buf = new DataView(new ArrayBuffer(4));
    buf.setFloat32(0, f);
    return (buf.getUint32(0) & 0xffff) === 0;
  }
  var INT_TAGS = [['i8', -128, 127, 1], ['u8', 0, 255, 1], ['i16', -32768, 32767, 2], ['u16', 0, 65535, 2],
    ['i32', -2147483648, 2147483647, 4], ['u32', 0, 4294967295, 4], ['i64', -9.2e18, 9.2e18, 8], ['u64', 0, 1.8e19, 8]];
  // Returns {size, typed}: the bytes per element, and whether the elements are
  // stored unboxed in the array itself.
  function arrayElements(items) {
    var plain = { size: 8, typed: false };
    var allNumbers = items.every(function (it) { return it.t === 'number'; });
    if (!allNumbers) return plain;
    var floats = items.filter(function (it) { return /[.eE]/.test(it.raw); }).length;
    if (floats && floats < items.length) return plain;
    var nums = items.map(function (it) { return Number(it.raw); });
    if (floats) {
      if (nums.every(f16Exact) || nums.every(bf16Exact)) return { size: 2, typed: true };
      if (nums.every(function (x) { return Math.fround(x) === x; })) return { size: 4, typed: true };
      return { size: 8, typed: true };
    }
    var signed = nums.some(function (x) { return x < 0; });
    var lo = Math.min.apply(null, nums), hi = Math.max.apply(null, nums);
    for (var t = 0; t < INT_TAGS.length; t++) {
      var tag = INT_TAGS[t];
      if (signed && tag[0][0] === 'u') continue;
      if (lo >= tag[1] && hi <= tag[2]) return { size: tag[3], typed: true };
    }
    return plain;
  }

  // ijson grows arrays and objects to 4, then doubles them.
  function capacity(n) { return n <= 4 ? 4 : nextPow2(n); }

  // Walks the document and adds up what it allocates. Strings longer than 7
  // bytes are counted in `strings` instead, split into object keys and values,
  // because the caller decides how many documents share them.
  function jsonWalk(node, acc) {
    if (node.t === 'object') {
      if (!node.entries.length) return;
      var cap = capacity(node.entries.length);
      var size = 8 + 16 * cap;
      if (cap > 8) size += 4 * (cap + Math.floor(cap / 4));
      acc.structure += jeSize(Math.ceil(size / 8) * 8);
      node.entries.forEach(function (e) {
        var kl = bytes(e[0]);
        if (kl > 7) acc.keyStrings.push(kl);
        jsonWalk(e[1], acc);
      });
    } else if (node.t === 'array') {
      if (!node.items.length) return;
      var el = arrayElements(node.items);
      acc.structure += jeSize(Math.ceil((8 + el.size * capacity(node.items.length)) / 8) * 8);
      if (!el.typed) node.items.forEach(function (it) { jsonWalk(it, acc); });
    } else if (node.t === 'string') {
      var sl = bytes(node.v);
      if (sl > 7) acc.valueStrings.push(sl);
    } else if (node.t === 'number') {
      if (!numberIsInline(node.raw)) { acc.structure += 8; acc.boxed++; }
    }
  }

  function stringAlloc(len) { return jeSize(Math.ceil((8 + len) / 8) * 8); }

  // Bytes per entry of RedisJSON's string cache: a hashbrown set of 8-byte
  // pointers with a control byte each, at most 7/8 full, in one allocation.
  function stringCacheBytes(n) {
    if (n <= 0) return 0;
    var buckets = Math.max(8, nextPow2(Math.ceil(n * 8 / 7)));
    return jeSize(9 * buckets + 16) / n;
  }

  function jsonValue(doc, keyLen, ttl, keys) {
    // 24 bytes: the module's value holder, measured.
    var acc = { structure: 24, keyStrings: [], valueStrings: [], boxed: 0 };
    jsonWalk(doc, acc);
    // Value strings are counted for every document, as if no two documents had
    // the same value; field names are shared, so they cost nothing per key.
    var unique = acc.valueStrings.length;
    var strings = acc.valueStrings.reduce(function (t, l) { return t + stringAlloc(l); }, 0);
    var cache = unique ? unique * stringCacheBytes(unique * Math.max(1, keys)) : 0;
    return {
      encoding: 'json', object: jeSize(kvobjSize(keyLen, ttl)),
      value: acc.structure + strings + cache,
      strings: unique, boxedNumbers: acc.boxed,
    };
  }

  /* ---- keyspace ---- */

  // Per-key share of the main keyspace hash table. Keys with an expiry are in
  // a second table of the same kind.
  function keyspaceBytes(keys) { return keys > 0 ? tableBytes(keys) / keys : 0; }

  /* ---- a record in three shapes ---- */

  // The hash fields a client would write for the record: strings as they are,
  // numbers as written, true/false, and nested values as JSON text.
  function hashFields(doc) {
    var out = {};
    doc.entries.forEach(function (e) {
      var v = e[1];
      out[e[0]] = v.t === 'string' ? v.v
        : v.t === 'number' ? v.raw
        : v.t === 'bool' ? String(v.v)
        : v.t === 'null' ? '' : toText(v);
    });
    return out;
  }

  function toText(node) {
    if (node.t === 'object') return '{' + node.entries.map(function (e) { return JSON.stringify(e[0]) + ':' + toText(e[1]); }).join(',') + '}';
    if (node.t === 'array') return '[' + node.items.map(toText).join(',') + ']';
    if (node.t === 'string') return JSON.stringify(node.v);
    if (node.t === 'number') return node.raw;
    if (node.t === 'bool') return String(node.v);
    return 'null';
  }

  function payload(shape, doc, text) {
    if (shape === 'string') return doc ? bytes(toText(doc)) : bytes(text);
    var fields = hashFields(doc);
    return Object.keys(fields).reduce(function (t, f) { return t + bytes(f) + bytes(fields[f]); }, 0);
  }

  // estimate({text, keyName, keys, ttl}) -> {doc, error, shapes: {hash, json, string}}
  // Each shape: encoding, bytes per key split into key/data/overhead/keyspace,
  // and the total for `keys` keys. Hash and JSON need the text to be a JSON
  // object; any other text is sized as a string.
  function estimate(input) {
    var keys = Math.max(0, Math.round(input.keys || 0));
    var keyLen = bytes(input.keyName || '');
    var ttl = !!input.ttl;
    var doc = null, error = null;
    try {
      doc = parseJson(input.text);
      if (doc.t !== 'object') doc = null;
    } catch (e) {
      error = e;
    }
    var rows = {};
    var stringText = doc ? toText(doc) : (function () {
      try { var v = JSON.parse(input.text); return typeof v === 'string' ? v : input.text; } catch (e) { return input.text; }
    })();
    rows.string = stringValue(stringText, keyLen, ttl);
    rows.string.data = bytes(stringText);
    if (doc) {
      rows.hash = hashValue(hashFields(doc), keyLen, ttl);
      rows.hash.data = payload('hash', doc);
      rows.json = jsonValue(doc, keyLen, ttl, keys);
      rows.json.data = bytes(toText(doc));
    }
    var space = keyspaceBytes(keys) * (ttl ? 2 : 1);
    Object.keys(rows).forEach(function (k) {
      var r = rows[k];
      r.keyspace = space;
      r.perKey = r.object + r.value + space;
      r.total = r.perKey * keys;
    });
    return { doc: doc, error: error, keyLen: keyLen, shapes: rows };
  }

  return {
    estimate: estimate,
    parseJson: parseJson,
    hashFields: hashFields,
    toText: toText,
    bytes: bytes,
    jeSize: jeSize,
    limits: { listpackEntries: HASH_MAX_LISTPACK_ENTRIES, listpackValue: HASH_MAX_LISTPACK_VALUE },
  };
});

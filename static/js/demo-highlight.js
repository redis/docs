/* =========================================================================
   Syntax highlighting for the scripted demos' code blocks
   Dependency-free and shared: each demo's shortcode loads this before the
   demo itself. Every function takes text exactly as a demo shows it and
   returns it escaped, with spans the shared stylesheet colors. Redis commands
   are colored the way Redis Insight's Workbench colors them, and the other
   languages follow the same roles:
     hl-cmd    a command or language keyword, such as FT.SEARCH, curl, or import
     hl-kw     an option, such as SCHEMA or -H
     hl-key    an index name or URL
     hl-field  an @field
     hl-query  a query, quotes and all
     hl-op     a comparison or logical operator in a query; YAML list dashes
     hl-fn     a function in a query, such as ismissing
     hl-str    a string
     hl-num    a number
     hl-com    a comment
     hl-faint  framing that isn't the point: reply index numbers, (integer),
               line continuations, and <placeholders>
   Anything else, such as a key or a field name, stays plain, as in Insight.
   The text itself never changes: strip the spans and it reads the same.
   ========================================================================= */
(function () {
  "use strict";
  if (window.DemoHL) return;   // loaded twice: the first copy already defined everything

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function span(cls, s) { return cls ? '<span class="' + cls + '">' + esc(s) + "</span>" : esc(s); }
  var NUM = /^(-?\d+(\.\d+)?|[+-]inf)$/;
  var UPPER = /^[A-Z][A-Z0-9_]*$/;

  /* ---- Redis ---- */

  /* One argument of a Redis command, by its role. `t` is the argument as you'd type it, quotes and all.
     As in Insight, options are colored only in FT commands. */
  function arg(argv, i, t) {
    var a = argv[i], cmd = argv[0], ft = /^FT\./i.test(cmd), cls = "";
    if (i === 0) cls = "hl-cmd";
    else if (ft && i === 1) cls = "hl-key";   // the index
    else if (ft && isQuery(cmd, i, argv[i - 1], t !== a)) return query(t);
    else if (t !== a) cls = "hl-str";
    else if (NUM.test(a)) cls = "hl-num";
    else if (a.charAt(0) === "@") cls = "hl-field";
    else if (ft && UPPER.test(a)) cls = "hl-kw";
    return span(cls, t);
  }
  /* Whether an FT command's argument is a query: FT.SEARCH's and FT.AGGREGATE's, or the quoted expression after FILTER or APPLY. */
  function isQuery(cmd, i, prev, quoted) {
    return i === 2 && /^FT\.(SEARCH|AGGREGATE)$/i.test(cmd) || quoted && /^(FILTER|APPLY)$/i.test(prev);
  }
  /* A query, quotes and all. Insight colors it as one, with @fields, comparison and logical operators, and functions picked out,
     and parentheses plain. */
  function query(t) {
    var re = /(@[A-Za-z_$][\w.$]*)|(==|!=|<=|>=|&&|\|\||[<>])|([A-Za-z_]\w*(?=\())|([()])/g, out = "", at = 0, m;
    while ((m = re.exec(t))) {
      if (m.index > at) out += span("hl-query", t.slice(at, m.index));
      out += span(m[1] ? "hl-field" : m[2] ? "hl-op" : m[3] ? "hl-fn" : "", m[0]);
      at = re.lastIndex;
    }
    return out + (at < t.length ? span("hl-query", t.slice(at)) : "");
  }
  /* A reply as redis-cli prints it: index numbers and (integer) faint, strings, integers, OK, and errors colored. */
  function reply(text) {
    return text.split("\n").map(function (ln) {
      var m = ln.match(/^((?:\s*\d+\)\s)*)(.*)$/), idx = m[1], rest = m[2], body;
      if (/^\(integer\) /.test(rest)) body = span("hl-faint", "(integer)") + " " + span("hl-num", rest.slice(10));
      else if (/^\(error\) /.test(rest)) body = span("hl-err", rest);
      else if (/^"/.test(rest)) body = span("hl-str", rest);
      else if (/^\((nil|empty array)\)$/.test(rest)) body = span("hl-faint", rest);
      else if (rest === "OK") body = span("hl-ok", rest);
      else body = esc(rest);
      return (idx ? span("hl-faint", idx) : "") + body;
    }).join("\n");
  }
  /* Redis commands written out as text: one or more, separated by blank lines, with \ continuations and <placeholders>.
     As in Insight, a query that starts a line of its own is colored as a plain string. */
  function redis(text) {
    var re = /(\s+)|(\\(?=\s|$))|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(<[^>\n]*>)|([^\s"']+)|([\s\S])/g, m, out = "", n = 0, cmd = "", ft = false, prev = "", nl = false;
    while ((m = re.exec(text))) {
      if (m[1]) { if (/\n\s*\n/.test(m[1])) n = 0; nl = /\n/.test(m[1]); out += esc(m[1]); continue; }
      if (m[2]) { out += span("hl-faint", m[2]); continue; }
      if (m[6]) { out += esc(m[6]); continue; }   // a quote with no closing quote, kept as it is
      var t = m[0], cls = "";
      if (n === 0) { cmd = t; ft = /^FT\./i.test(t); cls = "hl-cmd"; }
      else if (m[4]) cls = "hl-faint";
      else if (ft && n === 1) cls = "hl-key";
      else if (ft && !nl && isQuery(cmd, n, prev, !!m[3])) { out += query(t); prev = t; n++; continue; }
      else if (m[3]) cls = "hl-str";
      else if (NUM.test(t)) cls = "hl-num";
      else if (t.charAt(0) === "@") cls = "hl-field";
      else if (ft && UPPER.test(t)) cls = "hl-kw";
      out += span(cls, t);
      prev = t;
      nl = false;
      n++;
    }
    return out;
  }

  /* ---- Python ---- */

  var PY_KW = /^(from|import|as|def|return|class|if|elif|else|for|while|in|not|and|or|is|with|try|except|finally|raise|lambda|yield|pass|None|True|False)$/;
  /* Python: keywords, strings, numbers, and comments. */
  function python(text) {
    var re = /(#[^\n]*)|("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|([\s\S])/g, m, out = "";
    while ((m = re.exec(text))) {
      if (m[1]) out += span("hl-com", m[1]);
      else if (m[2]) out += span("hl-str", m[2]);
      else if (m[3]) out += span("hl-num", m[3]);
      else if (m[4]) out += span(PY_KW.test(m[4]) ? "hl-cmd" : "", m[4]);
      else out += esc(m[5]);
    }
    return out;
  }

  /* ---- YAML ---- */

  /* One line of YAML: list dashes, the value after a key, and comments. */
  function yaml(line) {
    var m = line.match(/^(\s*)(- )?(?:([\w.$-]+)(:)(?=\s|$))?(\s*)(.*)$/), out = esc(m[1]);
    if (m[2]) out += span("hl-op", m[2]);
    if (m[3]) out += esc(m[3] + m[4]);
    out += esc(m[5]);
    var v = m[6], c = v.match(/^(.*?)(\s+#.*|^#.*)$/), com = "";
    if (c) { v = c[1]; com = c[2]; }
    if (v) out += span(/^["']/.test(v) ? "hl-str" : NUM.test(v) ? "hl-num" : /^(true|false|null|~)$/.test(v) ? "hl-cmd" : m[3] || m[2] ? "hl-str" : "", v);
    if (com) out += span("hl-com", com);
    return out;
  }

  /* ---- shell and SQL ---- */

  /* A shell command such as curl: the command, its flags and methods, URLs, strings, and \ continuations. */
  function shell(text) {
    var re = /(\s+)|(\\(?=\n|$))|("(?:[^"\\]|\\.)*"|'(?:[^']|'\\'')*')|([^\s"']+)|([\s\S])/g, m, out = "", first = true;
    while ((m = re.exec(text))) {
      if (m[1]) { out += esc(m[1]); continue; }
      if (m[2]) { out += span("hl-faint", m[2]); continue; }
      if (m[5]) { out += esc(m[5]); continue; }   // a quote with no closing quote, kept as it is
      var t = m[0], cls;
      if (m[3]) cls = /^["'](https?:|\$\w+\/)/.test(t) ? "hl-key" : "hl-str";   // a URL, including one that starts with a $VARIABLE
      else if (first) cls = "hl-cmd";
      else if (/^--?[A-Za-z]/.test(t)) cls = "hl-kw";
      else if (/^(GET|POST|PUT|PATCH|DELETE)$/.test(t)) cls = "hl-kw";
      else if (/^https?:/.test(t)) cls = "hl-key";
      else cls = "";
      first = false;
      out += span(cls, t);
    }
    return out;
  }
  var SQL_KW = /^(INSERT|INTO|VALUES|UPDATE|SET|WHERE|DELETE|FROM|SELECT|AND|OR|NOT|NULL|AS|ON|JOIN|ORDER|BY|LIMIT|RETURNING|BEGIN|COMMIT|TRUE|FALSE)$/i;
  /* SQL: keywords, strings, and numbers. */
  function sql(text) {
    var re = /('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][\w]*)|([\s\S])/g, m, out = "";
    while ((m = re.exec(text))) {
      if (m[1]) out += span("hl-str", m[1]);
      else if (m[2]) out += span("hl-num", m[2]);
      else if (m[3]) out += span(SQL_KW.test(m[3]) ? "hl-cmd" : "", m[3]);
      else out += esc(m[4]);
    }
    return out;
  }

  window.DemoHL = { esc: esc, arg: arg, query: query, reply: reply, redis: redis, python: python, yaml: yaml, shell: shell, sql: sql };
})();

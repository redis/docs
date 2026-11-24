// cli.js — docs-site entry point for the interactive redis-cli widget.
//
// Thin shim, intentionally tiny. The widget's logic is owned and served by the
// /cli backend at https://redis.io/cli/static/js/cli.js; this repo deliberately
// keeps NO copy of it, so the docs renderer can never drift from the backend's
// (the class of bug that once left a stale copy without a $status case).
//
// This shim just:
//   1. sets window.REDIS_CLI_CONFIG with the docs overrides, then
//   2. loads the canonical implementation from the backend.
//
// The backend script reads window.REDIS_CLI_CONFIG at load, so it MUST be set
// before that script executes; assigning it synchronously here, before injecting
// the <script>, guarantees that ordering.
//
// NOTE: because the backend script is injected dynamically it may execute after
// DOMContentLoaded has already fired, so it must initialise off document
// .readyState (init immediately when the DOM is already parsed), not solely via a
// DOMContentLoaded listener.

// Which /cli backend serves both the widget and the command batches: the
// deployment, for every page. The workbench needs the window.RedisCli API that
// only an unreleased backend publishes, so until that ships it stays dormant
// against production — the alternative, a hostname-gated local default, is
// local-development plumbing and does not belong in the repo.
const REDIS_CLI_BACKEND = 'https://redis.io/cli';

window.REDIS_CLI_CONFIG = {
  apiUrl: REDIS_CLI_BACKEND,      // POST command batches here
  // Which docs page a batch came from, for usage metrics. The widget used to
  // read this from its own URL (?source=), which only existed because "Try it"
  // opened redis.io/cli in a new tab. Snippets run in the workbench on the page
  // itself now, so the page has to say. The backend format-checks it and caps
  // distinct values.
  page: (function () {
    try { return window.location.pathname; } catch (err) { return ''; }
  })(),
  appendDbId: false,              // docs widgets don't carry a per-widget dbid
  promptPrefix: 'redis> ',        // docs use the bare prompt, not redis:6379>
  enableUrlCommands: false,       // commands come from the code block, not the URL
  showBadge: false,               // no "Powered by" badge in the docs
};

// Whether the canonical widget is still on its way. A "Try it" clicked before it
// lands must wait rather than fall back to another tab: "not here yet" and "this
// backend cannot do it" are different answers, and only the second one is a
// reason to leave the page.
window.REDIS_CLI_LOADING = true;
window.REDIS_CLI_FAILED = false;

(function () {
  const script = document.createElement('script');
  script.src = REDIS_CLI_BACKEND + '/static/js/cli.js';
  script.addEventListener('load', function () {
    window.REDIS_CLI_LOADING = false;
  });
  script.addEventListener('error', function () {
    window.REDIS_CLI_LOADING = false;
    window.REDIS_CLI_FAILED = true;
  });
  document.head.appendChild(script);
})();

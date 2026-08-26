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
  appendDbId: false,              // docs widgets don't carry a per-widget dbid
  promptPrefix: 'redis> ',        // docs use the bare prompt, not redis:6379>
  enableUrlCommands: false,       // commands come from the code block, not the URL
  showBadge: false,               // no "Powered by" badge in the docs
};

(function () {
  const script = document.createElement('script');
  script.src = REDIS_CLI_BACKEND + '/static/js/cli.js';
  document.head.appendChild(script);
})();

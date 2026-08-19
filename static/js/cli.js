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

// Which /cli backend serves both the widget and the command batches.
//
// A locally served docs site talks to a LOCAL backend by default:
//
//   cd redis-clinterwebz && docker compose up --build     # serves :5000
//   cd docs && hugo server                                # serves :1313, uses :5000
//
// TEMPORARY. The reason is the "Try it" workbench (js/redis-workbench.js): it
// needs the window.RedisCli API that the widget only publishes in an unreleased
// backend, so against production the drawer stays dormant and there is no way to
// try it. Once that backend ships, drop `localBackend` below and this default
// goes back to production — at which point a local site with no backend running
// works again out of the box, instead of silently having no terminals.
//
// Meanwhile, to aim a local site elsewhere (a different port, or production):
//   localStorage.setItem('redisCliBackend', 'https://redis.io/cli'); location.reload()
// or ?cli-backend=<url> for a single page load.
//
// Both overrides — and the local default — are gated on the page's own hostname
// being local, so nothing here can point redis.io at another origin's script. A
// backend URL is used verbatim as the POST target, with /static/js/cli.js
// appended for the widget.
const REDIS_CLI_BACKEND = (function () {
  const publicBackend = 'https://redis.io/cli';
  const localBackend = 'http://localhost:5000';
  try {
    const host = window.location.hostname;
    if (host !== 'localhost' && host !== '127.0.0.1' && host !== '[::1]') {
      return publicBackend;
    }
    const override = new URLSearchParams(window.location.search).get('cli-backend')
      || window.localStorage.getItem('redisCliBackend');
    return (override || localBackend).replace(/\/+$/, '');
  } catch (err) {
    return publicBackend;   // no URL/localStorage access (e.g. a sandboxed frame)
  }
})();

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

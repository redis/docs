#!/usr/bin/env python3
"""
Redis pub/sub demo server.

Run this file and visit http://localhost:8095 to publish messages to
named channels, watch in-process subscribers (exact-match and pattern)
receive them in real time, and inspect Redis' own view of the active
channels via PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB NUMPAT.
"""

from __future__ import annotations

import argparse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import sys
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))

try:
    import redis

    from pubsub_hub import RedisPubSubHub
except ImportError as exc:
    print(f"Error: {exc}")
    print("Make sure the 'redis' package is installed: pip install redis")
    sys.exit(1)


# A small set of seed subscriptions so the demo has something to show on
# first load. Users can add or remove subscriptions live from the UI.
DEFAULT_SUBSCRIPTIONS: list[dict] = [
    {"name": "orders-listener", "kind": "channel", "target": "orders:new"},
    {"name": "billing-listener", "kind": "channel", "target": "billing:invoice"},
    {"name": "all-notifications", "kind": "pattern", "target": "notifications:*"},
]


class PubSubDemoHandler(BaseHTTPRequestHandler):
    """Serve the pub/sub demo UI and JSON endpoints."""

    hub: RedisPubSubHub | None = None

    def do_GET(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path in {"/", "/index.html"}:
            self._send_html(self._html_page())
            return

        if parsed.path == "/state":
            self._send_json(self._build_state(), 200)
            return

        self.send_error(404)

    def do_POST(self) -> None:
        parsed = urlparse(self.path)

        if parsed.path == "/publish":
            self._handle_publish()
            return

        if parsed.path == "/subscribe":
            self._handle_subscribe()
            return

        if parsed.path == "/unsubscribe":
            self._handle_unsubscribe()
            return

        if parsed.path == "/reset":
            self.hub.shutdown()
            self.hub.reset_stats()
            seed_default_subscriptions(self.hub)
            self._send_json(self._build_state(), 200)
            return

        self.send_error(404)

    def _handle_publish(self) -> None:
        params = self._read_form_data()
        channel = (params.get("channel", [""])[0] or "").strip()
        body = (params.get("message", [""])[0] or "").strip()
        try:
            count = max(1, min(20, int(params.get("count", ["1"])[0])))
        except ValueError:
            count = 1

        if not channel:
            self._send_json({"error": "channel is required"}, 400)
            return
        if not body:
            self._send_json({"error": "message is required"}, 400)
            return

        # Wrap the user's text in a small envelope so the subscriber
        # side has a stable shape (`sender`, `body`, `seq`) to render.
        results: list[int] = []
        for index in range(count):
            delivered = self.hub.publish(
                channel,
                {
                    "body": body,
                    "seq": index + 1,
                    "of": count,
                },
            )
            results.append(delivered)

        self._send_json(
            {
                "channel": channel,
                "publishes": count,
                "delivered": results,
                "state": self._build_state(),
            },
            200,
        )

    def _handle_subscribe(self) -> None:
        params = self._read_form_data()
        name = (params.get("name", [""])[0] or "").strip()
        kind = (params.get("kind", ["channel"])[0] or "channel").strip()
        targets_raw = (params.get("target", [""])[0] or "").strip()

        if not name:
            self._send_json({"error": "name is required"}, 400)
            return
        if not targets_raw:
            self._send_json({"error": "target is required"}, 400)
            return
        if kind not in {"channel", "pattern"}:
            self._send_json({"error": "kind must be 'channel' or 'pattern'"}, 400)
            return

        # Allow comma-separated targets so one subscription can cover
        # several channels (the helper's binding map keys them).
        targets = [t.strip() for t in targets_raw.split(",") if t.strip()]
        try:
            if kind == "pattern":
                self.hub.psubscribe(name=name, patterns=targets)
            else:
                self.hub.subscribe(name=name, channels=targets)
        except ValueError as exc:
            self._send_json({"error": str(exc)}, 400)
            return

        self._send_json(self._build_state(), 200)

    def _handle_unsubscribe(self) -> None:
        params = self._read_form_data()
        name = (params.get("name", [""])[0] or "").strip()
        if not name:
            self._send_json({"error": "name is required"}, 400)
            return
        removed = self.hub.unsubscribe(name)
        self._send_json({"removed": removed, "state": self._build_state()}, 200)

    def _build_state(self) -> dict:
        subs = self.hub.subscriptions()
        # Collect every exact-match channel mentioned by any subscription
        # so the NUMSUB report is useful in the UI without an extra round
        # trip per channel.
        exact_channels: list[str] = []
        for sub in subs:
            if not sub.is_pattern:
                exact_channels.extend(sub.targets)
        exact_channels = sorted(set(exact_channels))

        return {
            "subscriptions": [
                {
                    **sub.to_dict(),
                    "messages": [m.to_dict() for m in sub.messages(limit=15)],
                }
                for sub in subs
            ],
            "active_channels": self.hub.active_channels(),
            "numsub": self.hub.channel_subscriber_counts(exact_channels),
            "stats": self.hub.stats(),
        }

    def _read_form_data(self) -> dict[str, list[str]]:
        content_length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(content_length).decode("utf-8")
        return parse_qs(raw_body)

    def _send_html(self, html: str, status: int = 200) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.end_headers()
        self.wfile.write(html.encode("utf-8"))

    def _send_json(self, payload: dict, status: int) -> None:
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(payload, default=str).encode("utf-8"))

    def log_message(self, format: str, *args) -> None:  # noqa: A002
        sys.stderr.write(f"[demo] {format % args}\n")

    def _html_page(self) -> str:
        return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Pub/Sub Demo</title>
  <style>
    :root {
      --bg: #f6f1e8;
      --panel: #fffaf2;
      --ink: #1f2933;
      --accent: #b8572f;
      --accent-dark: #8f421f;
      --muted: #5d6b75;
      --line: #e7d9c6;
      --ok: #d7f0de;
      --warn: #f7dfd7;
      --hit: #c9e7d2;
      --miss: #f5d6c6;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%, var(--bg) 100%);
      min-height: 100vh;
    }
    main {
      max-width: 1080px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1 { font-size: clamp(2.2rem, 5vw, 4rem); line-height: 1; margin-bottom: 12px; }
    p.lede { max-width: 56rem; font-size: 1.05rem; color: var(--muted); }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      margin-top: 28px;
    }
    .panel {
      background: rgba(255, 250, 242, 0.92);
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 22px;
      box-shadow: 0 16px 50px rgba(105, 74, 45, 0.08);
    }
    .panel h2 { margin-top: 0; margin-bottom: 10px; }
    .pill {
      display: inline-block;
      border-radius: 999px;
      background: #efe2cf;
      color: var(--accent-dark);
      padding: 6px 10px;
      font-size: 0.9rem;
      margin-bottom: 12px;
    }
    label { display: block; font-weight: bold; margin: 12px 0 6px; }
    input, select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid #cfbca6;
      font: inherit;
      background: white;
    }
    button {
      appearance: none;
      border: 0;
      border-radius: 999px;
      background: var(--accent);
      color: white;
      padding: 11px 18px;
      font: inherit;
      cursor: pointer;
      margin-right: 8px;
      margin-top: 12px;
    }
    button.secondary { background: #38424a; }
    button.tiny {
      padding: 4px 10px;
      font-size: 0.85rem;
      margin: 0 0 0 8px;
    }
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 8px 14px; margin: 0; }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
    .badge {
      display: inline-block;
      border-radius: 6px;
      padding: 3px 8px;
      font-size: 0.85rem;
      font-weight: bold;
    }
    .badge.channel { background: #f4e4c1; color: #5e4514; }
    .badge.pattern { background: var(--miss); color: #6b3220; }
    .badge.alive { background: var(--hit); color: #1d4a2c; }
    .badge.dead { background: #f0c2bc; color: #6b1f1c; }
    .sub-card {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 14px 16px;
      margin-bottom: 14px;
      background: #fffdf8;
    }
    .sub-card h3 { margin: 0 0 6px; font-size: 1.05rem; }
    .sub-card .meta { color: var(--muted); font-size: 0.9rem; margin-bottom: 8px; }
    .message-list { list-style: none; padding: 0; margin: 6px 0 0; max-height: 180px; overflow-y: auto; }
    .message-list li {
      border: 1px dashed #ddccb1;
      border-radius: 8px;
      padding: 6px 10px;
      margin-bottom: 6px;
      background: #fdf6e9;
      font-size: 0.9rem;
    }
    .message-list li .meta { color: var(--muted); font-size: 0.8rem; }
    pre {
      background: #f3eadc;
      border-radius: 12px;
      padding: 14px;
      overflow-x: auto;
      margin: 0;
      font-size: 0.85rem;
    }
    #status {
      margin-top: 20px;
      padding: 14px 16px;
      border-radius: 14px;
      display: none;
    }
    #status.ok { display: block; background: var(--ok); }
    #status.error { display: block; background: var(--warn); }
    @media (max-width: 600px) {
      main { padding-top: 28px; }
      button { width: 100%; }
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">redis-py + Python standard library HTTP server</div>
    <h1>Redis Pub/Sub Demo</h1>
    <p class="lede">
      Publish messages to named channels and watch in-process subscribers receive them in
      real time through Redis. Exact-match subscribers register with <code>SUBSCRIBE</code>;
      pattern subscribers use <code>PSUBSCRIBE</code> with glob syntax
      (<code>notifications:*</code>, <code>orders:*</code>). Redis' own view of active
      subscribers — <code>PUBSUB CHANNELS</code>, <code>PUBSUB NUMSUB</code>,
      <code>PUBSUB NUMPAT</code> — is shown in the inspection panel.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Publish a message</h2>
        <label for="pub-channel">Channel</label>
        <input id="pub-channel" value="orders:new" list="channel-suggestions">
        <datalist id="channel-suggestions">
          <option value="orders:new">
          <option value="billing:invoice">
          <option value="notifications:email">
          <option value="notifications:push">
          <option value="cache:invalidate:products">
          <option value="chat:lobby">
        </datalist>
        <label for="pub-message">Message body</label>
        <input id="pub-message" value="hello, world">
        <label for="pub-count">How many copies</label>
        <input id="pub-count" type="number" value="1" min="1" max="20">
        <button id="publish-button">Publish</button>
      </section>

      <section class="panel">
        <h2>Add a subscriber</h2>
        <label for="sub-name">Name</label>
        <input id="sub-name" value="orders-bot">
        <label for="sub-kind">Subscription kind</label>
        <select id="sub-kind">
          <option value="channel">Exact channel (SUBSCRIBE)</option>
          <option value="pattern">Pattern (PSUBSCRIBE)</option>
        </select>
        <label for="sub-target">Channel or pattern (comma-separated for multiple)</label>
        <input id="sub-target" value="orders:new" placeholder="orders:new or orders:*">
        <button id="subscribe-button">Subscribe</button>
        <button id="reset-button" class="secondary">Reset</button>
      </section>

      <section class="panel">
        <h2>Server-side view</h2>
        <p class="meta" style="margin-top:0;color:var(--muted);">
          From <code>PUBSUB CHANNELS</code> / <code>PUBSUB NUMSUB</code> /
          <code>PUBSUB NUMPAT</code>. Pattern subscribers do not appear in
          <code>PUBSUB CHANNELS</code>; they are counted by <code>PUBSUB NUMPAT</code>.
        </p>
        <div id="server-view">Loading...</div>
      </section>

      <section class="panel">
        <h2>Hub stats</h2>
        <div id="stats-view">Loading...</div>
      </section>

      <section class="panel" style="grid-column: 1 / -1;">
        <h2>Active subscribers <span id="sub-count" class="badge alive">0</span></h2>
        <div id="subscribers"></div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function escapeHtml(value) {
      return String(value ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
      })[c]);
    }

    function renderStats(stats) {
      const view = document.getElementById("stats-view");
      if (!stats) { view.textContent = "(no data)"; return; }
      const perChannel = Object.entries(stats.channel_published || {})
        .map(([ch, n]) => `${escapeHtml(ch)}: ${n}`).join(", ") || "(none)";
      view.innerHTML = `
        <dl>
          <dt>Published total</dt><dd>${stats.published_total}</dd>
          <dt>Redis delivered total</dt><dd>${stats.delivered_total}</dd>
          <dt>Received total (this process)</dt><dd>${stats.received_total}</dd>
          <dt>Active subscriptions</dt><dd>${stats.active_subscriptions}</dd>
          <dt>Pattern subscriptions (server)</dt><dd>${stats.pattern_subscriptions}</dd>
          <dt>Per-channel publishes</dt><dd>${perChannel}</dd>
        </dl>
      `;
    }

    function renderServerView(state) {
      const view = document.getElementById("server-view");
      const channels = state.active_channels || [];
      const numsub = state.numsub || {};
      const channelsHtml = channels.length
        ? channels.map((c) => `<li><strong>${escapeHtml(c)}</strong> &middot; <span class=meta>${numsub[c] ?? 0} subscriber(s)</span></li>`).join("")
        : "<li><span class=meta>(no active exact-match channels)</span></li>";
      view.innerHTML = `
        <ul class="message-list">${channelsHtml}</ul>
      `;
    }

    function renderSubscribers(subscriptions) {
      const wrap = document.getElementById("subscribers");
      const count = document.getElementById("sub-count");
      count.textContent = subscriptions.length;
      if (!subscriptions.length) {
        wrap.innerHTML = "<p class=meta>(no active subscribers — add one to start)</p>";
        return;
      }
      wrap.innerHTML = subscriptions.map((sub) => {
        const kind = sub.is_pattern ? "pattern" : "channel";
        const targets = sub.targets.map((t) => escapeHtml(t)).join(", ");
        const messages = (sub.messages || []).map((m) => {
          const payload = typeof m.payload === "object" ? JSON.stringify(m.payload) : String(m.payload ?? "");
          const ch = m.pattern
            ? `${escapeHtml(m.channel)} <span class=meta>(via ${escapeHtml(m.pattern)})</span>`
            : escapeHtml(m.channel);
          return `<li>
            <strong>${ch}</strong>
            <div class=meta>${escapeHtml(payload)}</div>
          </li>`;
        }).join("");
        return `<div class="sub-card">
          <h3>${escapeHtml(sub.name)}
            <span class="badge ${kind}">${kind}</span>
            <span class="badge ${sub.alive ? "alive" : "dead"}">${sub.alive ? "live" : "stopped"}</span>
            <button class="tiny secondary" data-unsubscribe="${escapeHtml(sub.name)}">Unsubscribe</button>
          </h3>
          <div class=meta>Listening to: ${targets} &middot; received ${sub.received_total} message(s)</div>
          <ul class="message-list">${messages || '<li><span class=meta>(no messages yet)</span></li>'}</ul>
        </div>`;
      }).join("");
      wrap.querySelectorAll("button[data-unsubscribe]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const body = new URLSearchParams({ name: btn.dataset.unsubscribe });
          await fetch("/unsubscribe", { method: "POST", body });
          setStatus(`Unsubscribed ${btn.dataset.unsubscribe}.`, "ok");
          refresh();
        });
      });
    }

    async function refresh() {
      const response = await fetch("/state");
      const state = await response.json();
      renderStats(state.stats);
      renderServerView(state);
      renderSubscribers(state.subscriptions || []);
    }

    document.getElementById("publish-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        channel: document.getElementById("pub-channel").value,
        message: document.getElementById("pub-message").value,
        count: document.getElementById("pub-count").value,
      });
      const response = await fetch("/publish", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Publish failed.", "error"); return; }
      const delivered = (data.delivered || []).reduce((a, b) => a + b, 0);
      setStatus(`Published ${data.publishes} message(s) to ${data.channel}; Redis delivered ${delivered} time(s).`, "ok");
      refresh();
    });

    document.getElementById("subscribe-button").addEventListener("click", async () => {
      const body = new URLSearchParams({
        name: document.getElementById("sub-name").value,
        kind: document.getElementById("sub-kind").value,
        target: document.getElementById("sub-target").value,
      });
      const response = await fetch("/subscribe", { method: "POST", body });
      const data = await response.json();
      if (!response.ok) { setStatus(data.error || "Subscribe failed.", "error"); return; }
      setStatus("Subscriber added.", "ok");
      refresh();
    });

    document.getElementById("reset-button").addEventListener("click", async () => {
      await fetch("/reset", { method: "POST" });
      setStatus("Hub reset — default subscribers re-seeded.", "ok");
      refresh();
    });

    refresh();
    setInterval(refresh, 800);
  </script>
</body>
</html>
"""


def seed_default_subscriptions(hub: RedisPubSubHub) -> None:
    for entry in DEFAULT_SUBSCRIPTIONS:
        try:
            if entry["kind"] == "pattern":
                hub.psubscribe(name=entry["name"], patterns=[entry["target"]])
            else:
                hub.subscribe(name=entry["name"], channels=[entry["target"]])
        except ValueError:
            # Already present from a previous reset cycle.
            continue


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run the Redis pub/sub demo server.")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP bind host")
    parser.add_argument("--port", type=int, default=8095, help="HTTP bind port")
    parser.add_argument("--redis-host", default="localhost", help="Redis host")
    parser.add_argument("--redis-port", type=int, default=6379, help="Redis port")
    return parser.parse_args()


def main() -> None:
    args = parse_args()

    redis_client = redis.Redis(
        host=args.redis_host,
        port=args.redis_port,
        decode_responses=True,
    )
    hub = RedisPubSubHub(redis_client=redis_client)
    seed_default_subscriptions(hub)

    PubSubDemoHandler.hub = hub

    server = ThreadingHTTPServer((args.host, args.port), PubSubDemoHandler)
    print(f"Redis pub/sub demo server listening on http://{args.host}:{args.port}")
    print(f"Using Redis at {args.redis_host}:{args.redis_port}")
    print(f"Seeded {len(DEFAULT_SUBSCRIPTIONS)} default subscription(s)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        hub.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()

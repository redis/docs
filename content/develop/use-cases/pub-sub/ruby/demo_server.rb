#!/usr/bin/env ruby
# frozen_string_literal: true

# Redis pub/sub demo server.
#
# Run this file and visit http://localhost:8102 to publish messages to
# named channels, watch in-process subscribers (exact-match and
# pattern) receive them in real time, and inspect Redis' own view of
# the active channels via PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB
# NUMPAT.

require 'json'
require 'optparse'
require 'uri'
require 'webrick'

require_relative 'pubsub_hub'

DEFAULT_SUBSCRIPTIONS = [
  { name: 'orders-listener', kind: 'channel', target: 'orders:new' },
  { name: 'billing-listener', kind: 'channel', target: 'billing:invoice' },
  { name: 'all-notifications', kind: 'pattern', target: 'notifications:*' }
].freeze

def seed_default_subscriptions(hub)
  DEFAULT_SUBSCRIPTIONS.each do |entry|
    begin
      if entry[:kind] == 'pattern'
        hub.psubscribe(name: entry[:name], patterns: [entry[:target]])
      else
        hub.subscribe(name: entry[:name], channels: [entry[:target]])
      end
    rescue ArgumentError
      # already present from a previous reset cycle
    end
  end
end

def parse_form_body(request)
  body = request.body.to_s
  URI.decode_www_form(body).each_with_object({}) do |(k, v), acc|
    (acc[k] ||= []) << v
  end
rescue ArgumentError
  {}
end

def first_param(params, key, default = '')
  values = params[key]
  value = values.is_a?(Array) ? values.first : values
  (value || default).to_s
end

def build_state(hub)
  subs = hub.subscriptions
  exact_channels = []
  subs.each do |sub|
    exact_channels.concat(sub.targets) unless sub.is_pattern?
  end
  exact_channels = exact_channels.uniq.sort

  {
    'subscriptions' => subs.map do |sub|
      sub.to_h.merge(
        'messages' => sub.messages(15).map(&:to_h)
      )
    end,
    'active_channels' => hub.active_channels,
    'numsub' => hub.channel_subscriber_counts(exact_channels),
    'stats' => hub.stats
  }
end

def send_json(response, payload, status = 200)
  response.status = status
  response['Content-Type'] = 'application/json'
  response.body = JSON.generate(payload)
end

HTML_PAGE = <<~HTML.freeze
  <!DOCTYPE html>
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
      <div class="pill">redis-rb + WEBrick</div>
      <h1>Redis Pub/Sub Demo</h1>
      <p class="lede">
        Publish messages to named channels and watch in-process subscribers receive them in
        real time through Redis. Exact-match subscribers register with <code>SUBSCRIBE</code>;
        pattern subscribers use <code>PSUBSCRIBE</code> with glob syntax
        (<code>notifications:*</code>, <code>orders:*</code>). Redis' own view of active
        subscribers &mdash; <code>PUBSUB CHANNELS</code>, <code>PUBSUB NUMSUB</code>,
        <code>PUBSUB NUMPAT</code> &mdash; is shown in the inspection panel.
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
          wrap.innerHTML = "<p class=meta>(no active subscribers &mdash; add one to start)</p>";
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
        setStatus("Hub reset &mdash; default subscribers re-seeded.", "ok");
        refresh();
      });

      refresh();
      setInterval(refresh, 800);
    </script>
  </body>
  </html>
HTML

def install_routes(server, hub)
  server.mount_proc('/') do |_request, response|
    response.status = 200
    response['Content-Type'] = 'text/html; charset=utf-8'
    response.body = HTML_PAGE
  end

  server.mount_proc('/index.html') do |_request, response|
    response.status = 200
    response['Content-Type'] = 'text/html; charset=utf-8'
    response.body = HTML_PAGE
  end

  server.mount_proc('/state') do |request, response|
    if request.request_method == 'GET'
      send_json(response, build_state(hub), 200)
    else
      response.status = 405
    end
  end

  server.mount_proc('/publish') do |request, response|
    if request.request_method != 'POST'
      response.status = 405
      next
    end
    params = parse_form_body(request)
    channel = first_param(params, 'channel').strip
    body = first_param(params, 'message').strip
    count_raw = first_param(params, 'count', '1')
    count =
      begin
        Integer(count_raw)
      rescue ArgumentError, TypeError
        1
      end
    count = 1 if count < 1
    count = 20 if count > 20

    if channel.empty?
      send_json(response, { 'error' => 'channel is required' }, 400)
      next
    end
    if body.empty?
      send_json(response, { 'error' => 'message is required' }, 400)
      next
    end

    results = []
    count.times do |index|
      delivered = hub.publish(channel, {
        'body' => body,
        'seq' => index + 1,
        'of' => count
      })
      results << delivered
    end

    send_json(response, {
      'channel' => channel,
      'publishes' => count,
      'delivered' => results,
      'state' => build_state(hub)
    }, 200)
  end

  server.mount_proc('/subscribe') do |request, response|
    if request.request_method != 'POST'
      response.status = 405
      next
    end
    params = parse_form_body(request)
    name = first_param(params, 'name').strip
    kind = first_param(params, 'kind', 'channel').strip
    targets_raw = first_param(params, 'target').strip

    if name.empty?
      send_json(response, { 'error' => 'name is required' }, 400)
      next
    end
    if targets_raw.empty?
      send_json(response, { 'error' => 'target is required' }, 400)
      next
    end
    unless %w[channel pattern].include?(kind)
      send_json(response, { 'error' => "kind must be 'channel' or 'pattern'" }, 400)
      next
    end

    targets = targets_raw.split(',').map(&:strip).reject(&:empty?)
    begin
      if kind == 'pattern'
        hub.psubscribe(name: name, patterns: targets)
      else
        hub.subscribe(name: name, channels: targets)
      end
    rescue ArgumentError => e
      send_json(response, { 'error' => e.message }, 400)
      next
    end

    send_json(response, build_state(hub), 200)
  end

  server.mount_proc('/unsubscribe') do |request, response|
    if request.request_method != 'POST'
      response.status = 405
      next
    end
    params = parse_form_body(request)
    name = first_param(params, 'name').strip
    if name.empty?
      send_json(response, { 'error' => 'name is required' }, 400)
      next
    end
    removed = hub.unsubscribe(name)
    send_json(response, { 'removed' => removed, 'state' => build_state(hub) }, 200)
  end

  server.mount_proc('/reset') do |request, response|
    if request.request_method != 'POST'
      response.status = 405
      next
    end
    hub.shutdown
    hub.reset_stats
    seed_default_subscriptions(hub)
    send_json(response, build_state(hub), 200)
  end
end

def parse_cli_args
  options = {
    host: '127.0.0.1',
    port: 8102,
    redis_host: 'localhost',
    redis_port: 6379
  }
  OptionParser.new do |opts|
    opts.banner = 'Usage: ruby demo_server.rb [options]'
    opts.on('--host HOST', 'HTTP bind host (default 127.0.0.1)') { |v| options[:host] = v }
    opts.on('--port PORT', Integer, 'HTTP bind port (default 8102)') { |v| options[:port] = v }
    opts.on('--redis-host HOST', 'Redis host (default localhost)') { |v| options[:redis_host] = v }
    opts.on('--redis-port PORT', Integer, 'Redis port (default 6379)') { |v| options[:redis_port] = v }
  end.parse!
  options
end

def main
  options = parse_cli_args

  hub = PubSubHub::RedisPubSubHub.new(
    redis_options: { host: options[:redis_host], port: options[:redis_port] }
  )
  seed_default_subscriptions(hub)

  access_log = []
  server = WEBrick::HTTPServer.new(
    BindAddress: options[:host],
    Port: options[:port],
    Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
    AccessLog: access_log
  )

  install_routes(server, hub)

  trap('INT') do
    Thread.new do
      hub.shutdown
      server.shutdown
    end
  end

  puts "Redis pub/sub demo server listening on http://#{options[:host]}:#{options[:port]}"
  puts "Using Redis at #{options[:redis_host]}:#{options[:redis_port]}"
  puts "Seeded #{DEFAULT_SUBSCRIPTIONS.length} default subscription(s)"

  begin
    server.start
  ensure
    hub.shutdown
  end
end

main if $PROGRAM_NAME == __FILE__

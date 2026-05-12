<?php
/**
 * Redis pub/sub demo server (PHP).
 *
 * Run with:
 *     php -S 127.0.0.1:8101 demo_server.php
 *
 * Visit http://127.0.0.1:8101 to publish messages to named channels,
 * add and remove subscribers live, and watch Redis fan each message out
 * to every interested listener.
 *
 * `php -S` runs each HTTP request in a fresh process, so subscribers
 * cannot live inside this server — they're spawned as separate OS
 * processes by `RedisPubSubHub`, with their state (PID, messages,
 * received counters) kept in Redis under `demo:pubsub:*` so every
 * request can see them.
 */

declare(strict_types=1);

require_once __DIR__ . '/vendor/autoload.php';
require_once __DIR__ . '/PubSubHub.php';

use Predis\Client as PredisClient;

$redisHost = getenv('REDIS_HOST') ?: '127.0.0.1';
$redisPort = (int) (getenv('REDIS_PORT') ?: 6379);

try {
    $redis = new PredisClient([
        'host' => $redisHost,
        'port' => $redisPort,
    ]);
    $redis->ping();
} catch (\Throwable $e) {
    http_response_code(500);
    header('Content-Type: text/plain');
    echo "Failed to connect to Redis at {$redisHost}:{$redisPort}: " . $e->getMessage();
    exit(1);
}

$hub = new RedisPubSubHub(
    $redis,
    __DIR__ . '/subscriber_worker.php',
    $redisHost,
    $redisPort
);

// Default seed subscriptions. Re-applied on first request when no
// subscriptions exist, and again on /reset.
$DEFAULT_SUBSCRIPTIONS = [
    ['name' => 'orders-listener',   'kind' => 'channel', 'target' => 'orders:new'],
    ['name' => 'billing-listener',  'kind' => 'channel', 'target' => 'billing:invoice'],
    ['name' => 'all-notifications', 'kind' => 'pattern', 'target' => 'notifications:*'],
];

function seed_default_subscriptions(RedisPubSubHub $hub, array $defaults): void
{
    foreach ($defaults as $entry) {
        try {
            if ($entry['kind'] === 'pattern') {
                $hub->psubscribe($entry['name'], [$entry['target']]);
            } else {
                $hub->subscribe($entry['name'], [$entry['target']]);
            }
        } catch (\InvalidArgumentException $exc) {
            // Already present from a previous request cycle.
            continue;
        }
    }
}

// Auto-seed once per demo lifetime. The "seeded" flag in Redis means a
// /unsubscribe call doesn't trigger an immediate re-seed on the next
// /state poll — defaults only come back on /reset.
$seededFlagKey = RedisPubSubHub::KEY_PREFIX . ':seeded';
if (!$redis->exists($seededFlagKey)) {
    seed_default_subscriptions($hub, $DEFAULT_SUBSCRIPTIONS);
    $redis->set($seededFlagKey, '1');
}

$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';

if ($method === 'GET' && ($path === '/' || $path === '/index.html')) {
    send_html(render_page());
    return;
}

if ($method === 'GET' && $path === '/state') {
    send_json(build_state($hub));
    return;
}

if ($method === 'POST' && $path === '/publish') {
    handle_publish($hub);
    return;
}

if ($method === 'POST' && $path === '/subscribe') {
    handle_subscribe($hub);
    return;
}

if ($method === 'POST' && $path === '/unsubscribe') {
    handle_unsubscribe($hub);
    return;
}

if ($method === 'POST' && $path === '/reset') {
    $hub->shutdown();
    $hub->resetStats();
    seed_default_subscriptions($hub, $DEFAULT_SUBSCRIPTIONS);
    send_json(build_state($hub));
    return;
}

http_response_code(404);
echo 'Not Found';

// ---------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------

function handle_publish(RedisPubSubHub $hub): void
{
    $params = read_form_data();
    $channel = trim((string) ($params['channel'] ?? ''));
    $body = trim((string) ($params['message'] ?? ''));
    $count = isset($params['count']) ? (int) $params['count'] : 1;
    $count = max(1, min(20, $count));

    if ($channel === '') {
        send_json(['error' => 'channel is required'], 400);
        return;
    }
    if ($body === '') {
        send_json(['error' => 'message is required'], 400);
        return;
    }

    $results = [];
    for ($i = 0; $i < $count; $i++) {
        $results[] = $hub->publish($channel, [
            'body' => $body,
            'seq' => $i + 1,
            'of' => $count,
        ]);
    }

    send_json([
        'channel' => $channel,
        'publishes' => $count,
        'delivered' => $results,
        'state' => build_state($hub),
    ]);
}

function handle_subscribe(RedisPubSubHub $hub): void
{
    $params = read_form_data();
    $name = trim((string) ($params['name'] ?? ''));
    $kind = trim((string) ($params['kind'] ?? 'channel'));
    $targetRaw = trim((string) ($params['target'] ?? ''));

    if ($name === '') {
        send_json(['error' => 'name is required'], 400);
        return;
    }
    if ($targetRaw === '') {
        send_json(['error' => 'target is required'], 400);
        return;
    }
    if ($kind !== 'channel' && $kind !== 'pattern') {
        send_json(['error' => "kind must be 'channel' or 'pattern'"], 400);
        return;
    }

    $targets = array_values(array_filter(array_map('trim', explode(',', $targetRaw))));
    if (empty($targets)) {
        send_json(['error' => 'target is required'], 400);
        return;
    }

    try {
        if ($kind === 'pattern') {
            $hub->psubscribe($name, $targets);
        } else {
            $hub->subscribe($name, $targets);
        }
    } catch (\InvalidArgumentException $exc) {
        send_json(['error' => $exc->getMessage()], 400);
        return;
    } catch (\RuntimeException $exc) {
        send_json(['error' => $exc->getMessage()], 500);
        return;
    }

    send_json(build_state($hub));
}

function handle_unsubscribe(RedisPubSubHub $hub): void
{
    $params = read_form_data();
    $name = trim((string) ($params['name'] ?? ''));
    if ($name === '') {
        send_json(['error' => 'name is required'], 400);
        return;
    }
    $removed = $hub->unsubscribe($name);
    send_json(['removed' => $removed, 'state' => build_state($hub)]);
}

function build_state(RedisPubSubHub $hub): array
{
    $subs = $hub->subscriptions();

    $exactChannels = [];
    foreach ($subs as $sub) {
        if (empty($sub['is_pattern'])) {
            foreach ($sub['targets'] as $t) {
                $exactChannels[$t] = true;
            }
        }
    }
    $exactChannels = array_keys($exactChannels);
    sort($exactChannels);

    return [
        'subscriptions' => $subs,
        'active_channels' => $hub->activeChannels(),
        'numsub' => $hub->channelSubscriberCounts($exactChannels),
        'stats' => $hub->stats(),
    ];
}

function read_form_data(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $parsed = [];
    parse_str($raw, $parsed);
    return $parsed;
}

function send_html(string $html, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: text/html; charset=utf-8');
    echo $html;
}

function send_json($payload, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
}

function render_page(): string
{
    return <<<'HTML'
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
    <div class="pill">Predis + PHP built-in dev server</div>
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
HTML;
}

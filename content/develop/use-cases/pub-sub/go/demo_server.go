// Redis pub/sub demo server.
//
// Create a main.go file in the same directory:
//
//	package main
//
//	import "pubsub"
//
//	func main() { pubsub.RunDemoServer() }
//
// Then run:
//
//	go build -o demo ./...
//	./demo --port 8097 --redis-host localhost --redis-port 6379
//
// Visit http://localhost:8097 to publish messages to named channels,
// watch in-process subscribers (exact-match and pattern) receive them
// in real time, and inspect Redis' own view of the active channels via
// PUBSUB CHANNELS / PUBSUB NUMSUB / PUBSUB NUMPAT.
package pubsub

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"

	"github.com/redis/go-redis/v9"
)

// defaultSubscription describes a seed subscription used both at
// startup and after a /reset.
type defaultSubscription struct {
	Name   string
	Kind   string // "channel" or "pattern"
	Target string
}

var defaultSubscriptions = []defaultSubscription{
	{Name: "orders-listener", Kind: "channel", Target: "orders:new"},
	{Name: "billing-listener", Kind: "channel", Target: "billing:invoice"},
	{Name: "all-notifications", Kind: "pattern", Target: "notifications:*"},
}

type demoServer struct {
	hub *RedisPubSubHub
}

// RunDemoServer is the entry point for the demo. Build a small main.go
// next to this file that calls pubsub.RunDemoServer().
func RunDemoServer() {
	host := flag.String("host", "127.0.0.1", "HTTP bind host")
	port := flag.Int("port", 8097, "HTTP bind port")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	flag.Parse()

	client := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
		// Each subscription holds its own connection; bump the pool
		// size so the seed subs plus a few user-added ones never have
		// to wait for one to free up.
		PoolSize: 32,
	})
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		log.Fatalf("could not reach Redis at %s:%d: %v", *redisHost, *redisPort, err)
	}

	hub := NewRedisPubSubHub(client, 50)
	seedDefaultSubscriptions(ctx, hub)

	srv := &demoServer{hub: hub}

	mux := http.NewServeMux()
	mux.HandleFunc("/", srv.handleRoot)
	mux.HandleFunc("/state", srv.handleState)
	mux.HandleFunc("/publish", srv.handlePublish)
	mux.HandleFunc("/subscribe", srv.handleSubscribe)
	mux.HandleFunc("/unsubscribe", srv.handleUnsubscribe)
	mux.HandleFunc("/reset", srv.handleReset)

	addr := fmt.Sprintf("%s:%d", *host, *port)
	httpSrv := &http.Server{Addr: addr, Handler: mux}

	go func() {
		log.Printf("Redis pub/sub demo server listening on http://%s", addr)
		log.Printf("Using Redis at %s:%d", *redisHost, *redisPort)
		log.Printf("Seeded %d default subscription(s)", len(defaultSubscriptions))
		if err := httpSrv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("http server: %v", err)
		}
	}()

	sigCh := make(chan os.Signal, 1)
	signal.Notify(sigCh, os.Interrupt, syscall.SIGTERM)
	<-sigCh
	log.Println("shutting down...")
	hub.Shutdown()
	shutdownCtx, shutdownCancel := context.WithCancel(context.Background())
	defer shutdownCancel()
	_ = httpSrv.Shutdown(shutdownCtx)
	_ = client.Close()
}

func seedDefaultSubscriptions(ctx context.Context, hub *RedisPubSubHub) {
	for _, entry := range defaultSubscriptions {
		var err error
		if entry.Kind == "pattern" {
			_, err = hub.PSubscribe(ctx, entry.Name, []string{entry.Target})
		} else {
			_, err = hub.Subscribe(ctx, entry.Name, []string{entry.Target})
		}
		if err != nil {
			// Most likely a duplicate name from a /reset round trip;
			// the hub guards against that and other failures are
			// non-fatal for the demo.
			log.Printf("seed subscription %q: %v", entry.Name, err)
		}
	}
}

// ---- HTTP handlers ----

func (s *demoServer) handleRoot(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	_, _ = w.Write([]byte(htmlPage))
}

func (s *demoServer) handleState(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	writeJSON(w, http.StatusOK, s.buildState(r.Context()))
}

func (s *demoServer) handlePublish(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		writeJSON(w, http.StatusBadRequest, errorBody(err.Error()))
		return
	}
	channel := strings.TrimSpace(r.FormValue("channel"))
	body := strings.TrimSpace(r.FormValue("message"))
	countStr := strings.TrimSpace(r.FormValue("count"))
	count := 1
	if countStr != "" {
		if parsed, err := strconv.Atoi(countStr); err == nil {
			count = parsed
		}
	}
	if count < 1 {
		count = 1
	}
	if count > 20 {
		count = 20
	}

	if channel == "" {
		writeJSON(w, http.StatusBadRequest, errorBody("channel is required"))
		return
	}
	if body == "" {
		writeJSON(w, http.StatusBadRequest, errorBody("message is required"))
		return
	}

	// Wrap each user message in a small envelope so the subscriber UI
	// has a stable JSON shape (`body`, `seq`, `of`) to render.
	delivered := make([]int64, 0, count)
	for i := 0; i < count; i++ {
		n, err := s.hub.Publish(r.Context(), channel, map[string]interface{}{
			"body": body,
			"seq":  i + 1,
			"of":   count,
		})
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, errorBody(err.Error()))
			return
		}
		delivered = append(delivered, n)
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"channel":   channel,
		"publishes": count,
		"delivered": delivered,
		"state":     s.buildState(r.Context()),
	})
}

func (s *demoServer) handleSubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		writeJSON(w, http.StatusBadRequest, errorBody(err.Error()))
		return
	}
	name := strings.TrimSpace(r.FormValue("name"))
	kind := strings.TrimSpace(r.FormValue("kind"))
	if kind == "" {
		kind = "channel"
	}
	targetsRaw := strings.TrimSpace(r.FormValue("target"))

	if name == "" {
		writeJSON(w, http.StatusBadRequest, errorBody("name is required"))
		return
	}
	if targetsRaw == "" {
		writeJSON(w, http.StatusBadRequest, errorBody("target is required"))
		return
	}
	if kind != "channel" && kind != "pattern" {
		writeJSON(w, http.StatusBadRequest, errorBody("kind must be 'channel' or 'pattern'"))
		return
	}

	// Allow comma-separated targets so one subscription can cover
	// several channels.
	var targets []string
	for _, t := range strings.Split(targetsRaw, ",") {
		t = strings.TrimSpace(t)
		if t != "" {
			targets = append(targets, t)
		}
	}
	if len(targets) == 0 {
		writeJSON(w, http.StatusBadRequest, errorBody("target is required"))
		return
	}

	var err error
	if kind == "pattern" {
		_, err = s.hub.PSubscribe(r.Context(), name, targets)
	} else {
		_, err = s.hub.Subscribe(r.Context(), name, targets)
	}
	if err != nil {
		writeJSON(w, http.StatusBadRequest, errorBody(err.Error()))
		return
	}

	writeJSON(w, http.StatusOK, s.buildState(r.Context()))
}

func (s *demoServer) handleUnsubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	if err := r.ParseForm(); err != nil {
		writeJSON(w, http.StatusBadRequest, errorBody(err.Error()))
		return
	}
	name := strings.TrimSpace(r.FormValue("name"))
	if name == "" {
		writeJSON(w, http.StatusBadRequest, errorBody("name is required"))
		return
	}
	removed := s.hub.Unsubscribe(name)
	writeJSON(w, http.StatusOK, map[string]interface{}{
		"removed": removed,
		"state":   s.buildState(r.Context()),
	})
}

func (s *demoServer) handleReset(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "method not allowed", http.StatusMethodNotAllowed)
		return
	}
	s.hub.Shutdown()
	s.hub.ResetStats()
	seedDefaultSubscriptions(r.Context(), s.hub)
	writeJSON(w, http.StatusOK, s.buildState(r.Context()))
}

// buildState returns the wire shape served by /state. The shared JS
// reads `subscriptions`, `active_channels`, `numsub`, and `stats`.
func (s *demoServer) buildState(ctx context.Context) map[string]interface{} {
	subs := s.hub.Subscriptions()

	// Collect every exact-match channel mentioned by any subscription
	// so the NUMSUB report is useful in the UI without an extra round
	// trip per channel.
	seen := make(map[string]struct{})
	var exact []string
	for _, sub := range subs {
		if sub.IsPattern() {
			continue
		}
		for _, t := range sub.Targets() {
			if _, ok := seen[t]; !ok {
				seen[t] = struct{}{}
				exact = append(exact, t)
			}
		}
	}

	subDicts := make([]map[string]interface{}, 0, len(subs))
	for _, sub := range subs {
		subDicts = append(subDicts, map[string]interface{}{
			"name":           sub.Name(),
			"targets":        sub.Targets(),
			"is_pattern":     sub.IsPattern(),
			"received_total": sub.ReceivedTotal(),
			"alive":          sub.IsAlive(),
			"messages":       sub.Messages(15),
		})
	}

	channels, err := s.hub.ActiveChannels(ctx, "*")
	if err != nil {
		channels = []string{}
	}
	numsub, err := s.hub.ChannelSubscriberCounts(ctx, exact)
	if err != nil {
		numsub = map[string]int64{}
	}

	return map[string]interface{}{
		"subscriptions":   subDicts,
		"active_channels": channels,
		"numsub":          numsub,
		"stats":           s.hub.Stats(ctx),
	}
}

func writeJSON(w http.ResponseWriter, status int, body interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(body); err != nil {
		log.Printf("write json: %v", err)
	}
}

func errorBody(msg string) map[string]string {
	return map[string]string{"error": msg}
}

// ---- HTML template ----

const htmlPage = `<!DOCTYPE html>
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
    <div class="pill">go-redis + net/http</div>
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
        .map(([ch, n]) => ` + "`${escapeHtml(ch)}: ${n}`" + `).join(", ") || "(none)";
      view.innerHTML = ` + "`" + `
        <dl>
          <dt>Published total</dt><dd>${stats.published_total}</dd>
          <dt>Redis delivered total</dt><dd>${stats.delivered_total}</dd>
          <dt>Received total (this process)</dt><dd>${stats.received_total}</dd>
          <dt>Active subscriptions</dt><dd>${stats.active_subscriptions}</dd>
          <dt>Pattern subscriptions (server)</dt><dd>${stats.pattern_subscriptions}</dd>
          <dt>Per-channel publishes</dt><dd>${perChannel}</dd>
        </dl>
      ` + "`" + `;
    }

    function renderServerView(state) {
      const view = document.getElementById("server-view");
      const channels = state.active_channels || [];
      const numsub = state.numsub || {};
      const channelsHtml = channels.length
        ? channels.map((c) => ` + "`<li><strong>${escapeHtml(c)}</strong> &middot; <span class=meta>${numsub[c] ?? 0} subscriber(s)</span></li>`" + `).join("")
        : "<li><span class=meta>(no active exact-match channels)</span></li>";
      view.innerHTML = ` + "`" + `
        <ul class="message-list">${channelsHtml}</ul>
      ` + "`" + `;
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
            ? ` + "`${escapeHtml(m.channel)} <span class=meta>(via ${escapeHtml(m.pattern)})</span>`" + `
            : escapeHtml(m.channel);
          return ` + "`<li>" + `
            <strong>${ch}</strong>
            <div class=meta>${escapeHtml(payload)}</div>
          ` + "</li>`" + `;
        }).join("");
        return ` + "`<div class=\"sub-card\">" + `
          <h3>${escapeHtml(sub.name)}
            <span class="badge ${kind}">${kind}</span>
            <span class="badge ${sub.alive ? "alive" : "dead"}">${sub.alive ? "live" : "stopped"}</span>
            <button class="tiny secondary" data-unsubscribe="${escapeHtml(sub.name)}">Unsubscribe</button>
          </h3>
          <div class=meta>Listening to: ${targets} &middot; received ${sub.received_total} message(s)</div>
          <ul class="message-list">${messages || '<li><span class=meta>(no messages yet)</span></li>'}</ul>
        ` + "</div>`" + `;
      }).join("");
      wrap.querySelectorAll("button[data-unsubscribe]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const body = new URLSearchParams({ name: btn.dataset.unsubscribe });
          await fetch("/unsubscribe", { method: "POST", body });
          setStatus(` + "`Unsubscribed ${btn.dataset.unsubscribe}.`" + `, "ok");
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
      setStatus(` + "`Published ${data.publishes} message(s) to ${data.channel}; Redis delivered ${delivered} time(s).`" + `, "ok");
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
`

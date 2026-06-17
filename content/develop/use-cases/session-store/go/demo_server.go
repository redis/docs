// Redis Session Store Demo Server
//
// Create a main.go file in the same directory:
//
//	package main
//
//	import "sessionstore"
//
//	func main() { sessionstore.RunDemoServer() }
//
// Then run:
//
//	go build -o demo ./...
//	./demo -port 8080 -redis-host localhost -redis-port 6379
package sessionstore

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"html"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"

	"github.com/redis/go-redis/v9"
)

type demoPayload struct {
	Authenticated bool              `json:"authenticated"`
	SessionID     string            `json:"session_id,omitempty"`
	Session       map[string]string `json:"session"`
	ConfiguredTTL int               `json:"configured_ttl,omitempty"`
	TTL           int               `json:"ttl,omitempty"`
	PageViews     int64             `json:"page_views,omitempty"`
	Error         string            `json:"error,omitempty"`
}

func parseTTLValue(raw string) (int, bool) {
	ttl, err := strconv.Atoi(raw)
	if err != nil || ttl < 1 {
		return 0, false
	}
	return ttl, true
}

func demoSession(store *RedisSessionStore, sessionID string) (map[string]string, bool, error) {
	session, ok, err := store.GetSession(context.Background(), sessionID, true)
	if err != nil || !ok {
		return nil, ok, err
	}

	ttl, err := store.GetTTL(context.Background(), sessionID)
	if err != nil {
		return nil, false, err
	}
	configuredTTL, ok, err := store.GetConfiguredTTL(context.Background(), sessionID)
	if err != nil || !ok {
		return nil, ok, err
	}

	session["ttl"] = strconv.Itoa(ttl)
	session["session_ttl"] = strconv.Itoa(configuredTTL)
	return session, true, nil
}

func writeJSON(w http.ResponseWriter, status int, payload demoPayload, clearCookie bool) {
	w.Header().Set("Content-Type", "application/json")
	if clearCookie {
		http.SetCookie(w, &http.Cookie{
			Name:   "sid",
			Value:  "",
			Path:   "/",
			MaxAge: -1,
		})
	}
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(payload)
}

func renderSessionHTML(sessionID string, session map[string]string) string {
	if sessionID == "" || session == nil {
		return "<p>No active session.</p><p>Create one to store state in Redis and receive a cookie-backed session ID.</p>"
	}

	return fmt.Sprintf(`
        <dl>
          <dt>Session ID</dt><dd>%s</dd>
          <dt>Username</dt><dd>%s</dd>
          <dt>Page views</dt><dd>%s</dd>
          <dt>Configured TTL</dt><dd>%s seconds</dd>
          <dt>Created</dt><dd>%s</dd>
          <dt>Last accessed</dt><dd>%s</dd>
          <dt>TTL</dt><dd>%s seconds</dd>
        </dl>
        <form id="ttl-form">
          <label for="active-ttl">Update session TTL (seconds)</label>
          <input id="active-ttl" name="ttl" type="number" value="%s" min="1" step="1">
          <button type="submit">Apply TTL</button>
        </form>
        <button id="increment-button">Increment page views</button>
        <button id="logout-button" class="secondary">Log out</button>
    `,
		html.EscapeString(sessionID),
		html.EscapeString(session["username"]),
		html.EscapeString(session["page_views"]),
		html.EscapeString(session["session_ttl"]),
		html.EscapeString(session["created_at"]),
		html.EscapeString(session["last_accessed_at"]),
		html.EscapeString(session["ttl"]),
		html.EscapeString(session["session_ttl"]),
	)
}

func demoPage(sessionID string, session map[string]string) string {
	return fmt.Sprintf(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Redis Session Store Demo</title>
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
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: Georgia, "Times New Roman", serif;
      color: var(--ink);
      background:
        radial-gradient(circle at top left, #fff7ea, transparent 32rem),
        linear-gradient(180deg, #f3ecdf 0%%, var(--bg) 100%%);
      min-height: 100vh;
    }
    main {
      max-width: 960px;
      margin: 0 auto;
      padding: 48px 20px 72px;
    }
    h1 {
      font-size: clamp(2.2rem, 5vw, 4rem);
      line-height: 1;
      margin-bottom: 12px;
    }
    p.lede {
      max-width: 48rem;
      font-size: 1.1rem;
      color: var(--muted);
    }
    .grid {
      display: grid;
      gap: 20px;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
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
    label { display: block; font-weight: bold; margin-bottom: 8px; }
    input {
      width: 100%%;
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
    button:hover { background: var(--accent-dark); }
    button.secondary:hover { background: #20282e; }
    dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 8px 14px;
      margin: 0;
    }
    dt { font-weight: bold; }
    dd { margin: 0; word-break: break-word; }
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
      button { width: 100%%; }
    }
  </style>
</head>
<body>
  <main>
    <div class="pill">go-redis + net/http demo server</div>
    <h1>Redis Session Store Demo</h1>
    <p class="lede">
      Start a session, refresh it by interacting with the page, and watch Redis
      hold the server-side session data while the browser keeps only an opaque cookie.
    </p>

    <div class="grid">
      <section class="panel">
        <h2>Start a session</h2>
        <form id="login-form">
          <label for="username">Username</label>
          <input id="username" name="username" value="Andrew" maxlength="40">
          <label for="ttl">Session TTL (seconds)</label>
          <input id="ttl" name="ttl" type="number" value="15" min="1" step="1">
          <button type="submit">Create session</button>
        </form>
        <p>Try a short TTL like 10 or 15 seconds to watch the session expire, then interact with the page to see the expiration refresh.</p>
      </section>

      <section class="panel">
        <h2>Current session</h2>
        <div id="session-view">%s</div>
      </section>
    </div>

    <div id="status"></div>
  </main>

  <script>
    const sessionView = document.getElementById("session-view");
    const statusBox = document.getElementById("status");

    function setStatus(message, kind) {
      statusBox.textContent = message;
      statusBox.className = kind;
    }

    function renderLoggedOut() {
      sessionView.innerHTML =
        "<p>No active session.</p>" +
        "<p>Create one to store state in Redis and receive a cookie-backed session ID.</p>";
    }

    function escapeHtml(value) {
      return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char]);
    }

    function renderSession(data) {
      if (!data || !data.authenticated) {
        renderLoggedOut();
        return;
      }

      const session = data.session || {};
      const sessionId = escapeHtml(data.session_id || "");
      const username = escapeHtml(session.username || "");
      const pageViews = escapeHtml(session.page_views || "0");
      const configuredTtl = escapeHtml(String(data.configured_ttl || session.session_ttl || ""));
      const createdAt = escapeHtml(session.created_at || "");
      const lastAccessed = escapeHtml(session.last_accessed_at || "");
      const ttl = escapeHtml(String(data.ttl || session.ttl || ""));

      sessionView.innerHTML =
        "<dl>" +
        "<dt>Session ID</dt><dd>" + sessionId + "</dd>" +
        "<dt>Username</dt><dd>" + username + "</dd>" +
        "<dt>Page views</dt><dd>" + pageViews + "</dd>" +
        "<dt>Configured TTL</dt><dd>" + configuredTtl + " seconds</dd>" +
        "<dt>Created</dt><dd>" + createdAt + "</dd>" +
        "<dt>Last accessed</dt><dd>" + lastAccessed + "</dd>" +
        "<dt>TTL</dt><dd>" + ttl + " seconds</dd>" +
        "</dl>" +
        '<form id="ttl-form">' +
        '<label for="active-ttl">Update session TTL (seconds)</label>' +
        '<input id="active-ttl" name="ttl" type="number" value="' + configuredTtl + '" min="1" step="1">' +
        '<button type="submit">Apply TTL</button>' +
        "</form>" +
        '<button id="increment-button">Increment page views</button>' +
        '<button id="logout-button" class="secondary">Log out</button>';

      document.getElementById("ttl-form").addEventListener("submit", updateTtl);
      document.getElementById("increment-button").addEventListener("click", incrementSession);
      document.getElementById("logout-button").addEventListener("click", logoutSession);
    }

    async function fetchSession() {
      const response = await fetch("/session");
      const data = await response.json();
      renderSession(data);
    }

    async function incrementSession() {
      const response = await fetch("/increment", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        renderLoggedOut();
        setStatus(data.error || "Unable to update the session.", "error");
        return;
      }

      renderSession(data);
      setStatus("Session updated in Redis and TTL refreshed.", "ok");
    }

    async function updateTtl(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const response = await fetch("/ttl", {
        method: "POST",
        body: new URLSearchParams(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          renderLoggedOut();
        }
        setStatus(data.error || "Unable to update the TTL.", "error");
        return;
      }

      renderSession(data);
      setStatus("Session TTL updated in Redis.", "ok");
    }

    async function logoutSession() {
      await fetch("/logout", { method: "POST" });
      renderLoggedOut();
      setStatus("Session deleted from Redis and cookie cleared.", "ok");
    }

    document.getElementById("login-form").addEventListener("submit", async (event) => {
      event.preventDefault();
      const formData = new FormData(event.target);
      const response = await fetch("/login", {
        method: "POST",
        body: new URLSearchParams(formData),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "Unable to create the session.", "error");
        return;
      }

      renderSession(data);
      setStatus("Session created in Redis and cookie issued.", "ok");
    });

    fetchSession();
  </script>
</body>
</html>`, renderSessionHTML(sessionID, session))
}

// RunDemoServer starts the interactive session store demo HTTP server.
func RunDemoServer() {
	port := flag.Int("port", 8080, "Port to run the server on")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	flag.Parse()

	ctx := context.Background()
	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})

	if err := rdb.Ping(ctx).Err(); err != nil {
		fmt.Fprintf(os.Stderr, "failed to connect to Redis at %s:%d: %v\n", *redisHost, *redisPort, err)
		os.Exit(1)
	}

	store := NewRedisSessionStore(SessionStoreConfig{
		Client: rdb,
	})

	mux := http.NewServeMux()
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path != "/" && r.URL.Path != "/index.html" {
			http.NotFound(w, r)
			return
		}

		cookie, err := r.Cookie("sid")
		if err != nil {
			fmt.Fprint(w, demoPage("", nil))
			return
		}

		session, ok, err := demoSession(store, cookie.Value)
		if err != nil || !ok {
			fmt.Fprint(w, demoPage("", nil))
			return
		}

		fmt.Fprint(w, demoPage(cookie.Value, session))
	})

	mux.HandleFunc("/session", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("sid")
		if err == http.ErrNoCookie {
			writeJSON(w, http.StatusOK, demoPayload{Authenticated: false, Session: nil}, false)
			return
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		session, ok, err := demoSession(store, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		if !ok {
			writeJSON(w, http.StatusOK, demoPayload{Authenticated: false, Session: nil}, true)
			return
		}

		configuredTTL, _, err := store.GetConfiguredTTL(ctx, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		ttl, err := store.GetTTL(ctx, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		writeJSON(w, http.StatusOK, demoPayload{
			Authenticated: true,
			SessionID:     cookie.Value,
			Session:       session,
			ConfiguredTTL: configuredTTL,
			TTL:           ttl,
		}, false)
	})

	mux.HandleFunc("/login", func(w http.ResponseWriter, r *http.Request) {
		if err := r.ParseForm(); err != nil {
			writeJSON(w, http.StatusBadRequest, demoPayload{Error: err.Error()}, false)
			return
		}

		username := r.FormValue("username")
		if username == "" {
			username = "Guest"
		}
		ttl, ok := parseTTLValue(r.FormValue("ttl"))
		if !ok {
			writeJSON(w, http.StatusBadRequest, demoPayload{Error: "TTL must be a whole number greater than 0."}, false)
			return
		}

		sessionID, err := store.CreateSession(ctx, map[string]string{
			"username":   username,
			"page_views": "1",
		}, ttl)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		http.SetCookie(w, &http.Cookie{
			Name:     "sid",
			Value:    sessionID,
			Path:     "/",
			HttpOnly: true,
			SameSite: http.SameSiteLaxMode,
		})

		session, _, err := demoSession(store, sessionID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		configuredTTL, _, err := store.GetConfiguredTTL(ctx, sessionID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		remainingTTL, err := store.GetTTL(ctx, sessionID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		writeJSON(w, http.StatusOK, demoPayload{
			Authenticated: true,
			SessionID:     sessionID,
			Session:       session,
			ConfiguredTTL: configuredTTL,
			TTL:           remainingTTL,
		}, false)
	})

	mux.HandleFunc("/increment", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("sid")
		if err == http.ErrNoCookie {
			writeJSON(w, http.StatusUnauthorized, demoPayload{Error: "No active session"}, false)
			return
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		pageViews, ok, err := store.IncrementField(ctx, cookie.Value, "page_views", 1)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		if !ok {
			writeJSON(w, http.StatusUnauthorized, demoPayload{Error: "Session expired"}, true)
			return
		}

		session, ok, err := demoSession(store, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		if !ok {
			writeJSON(w, http.StatusUnauthorized, demoPayload{Error: "Session expired"}, true)
			return
		}

		configuredTTL, _, err := store.GetConfiguredTTL(ctx, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		ttl, err := store.GetTTL(ctx, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		writeJSON(w, http.StatusOK, demoPayload{
			Authenticated: true,
			SessionID:     cookie.Value,
			Session:       session,
			ConfiguredTTL: configuredTTL,
			TTL:           ttl,
			PageViews:     pageViews,
		}, false)
	})

	mux.HandleFunc("/ttl", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("sid")
		if err == http.ErrNoCookie {
			writeJSON(w, http.StatusUnauthorized, demoPayload{Error: "No active session"}, false)
			return
		}
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		if err := r.ParseForm(); err != nil {
			writeJSON(w, http.StatusBadRequest, demoPayload{Error: err.Error()}, false)
			return
		}

		ttl, ok := parseTTLValue(r.FormValue("ttl"))
		if !ok {
			writeJSON(w, http.StatusBadRequest, demoPayload{Error: "TTL must be a whole number greater than 0."}, false)
			return
		}

		updated, err := store.SetSessionTTL(ctx, cookie.Value, ttl)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		if !updated {
			writeJSON(w, http.StatusUnauthorized, demoPayload{Error: "Session expired"}, true)
			return
		}

		session, ok, err := demoSession(store, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		if !ok {
			writeJSON(w, http.StatusUnauthorized, demoPayload{Error: "Session expired"}, true)
			return
		}

		configuredTTL, _, err := store.GetConfiguredTTL(ctx, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}
		remainingTTL, err := store.GetTTL(ctx, cookie.Value)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, demoPayload{Error: err.Error()}, false)
			return
		}

		writeJSON(w, http.StatusOK, demoPayload{
			Authenticated: true,
			SessionID:     cookie.Value,
			Session:       session,
			ConfiguredTTL: configuredTTL,
			TTL:           remainingTTL,
		}, false)
	})

	mux.HandleFunc("/logout", func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("sid")
		if err == nil {
			_, _ = store.DeleteSession(ctx, cookie.Value)
		}
		writeJSON(w, http.StatusOK, demoPayload{Authenticated: false}, true)
	})

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", *port),
		Handler: mux,
	}

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		_ = server.Close()
		_ = rdb.Close()
	}()

	fmt.Printf("Session store demo listening on http://localhost:%d\n", *port)
	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

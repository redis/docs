package leaderboard

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
	"sync"
	"syscall"

	"github.com/redis/go-redis/v9"
)

type demoPlayer struct {
	UserID   string
	Score    float64
	Metadata map[string]string
}

var samplePlayers = []demoPlayer{
	{
		UserID: "player-1",
		Score:  980,
		Metadata: map[string]string{
			"name":        "Avery",
			"description": "Steady climber who never wastes a turn.",
		},
	},
	{
		UserID: "player-2",
		Score:  1310,
		Metadata: map[string]string{
			"name":        "Mina",
			"description": "Always finds a way into the top three.",
		},
	},
	{
		UserID: "player-3",
		Score:  1175,
		Metadata: map[string]string{
			"name":        "Noah",
			"description": "Takes big swings and occasionally lands them.",
		},
	},
	{
		UserID: "player-4",
		Score:  1435,
		Metadata: map[string]string{
			"name":        "Priya",
			"description": "Current pace-setter with a ruthless endgame.",
		},
	},
	{
		UserID: "player-5",
		Score:  1080,
		Metadata: map[string]string{
			"name":        "Jules",
			"description": "Quietly consistent and hard to catch.",
		},
	},
	{
		UserID: "player-6",
		Score:  1240,
		Metadata: map[string]string{
			"name":        "Rin",
			"description": "Moves fast after every weekly reset.",
		},
	},
}

type demoState struct {
	mu          sync.RWMutex
	leaderboard *RedisLeaderboard
}

type stateResponse struct {
	LeaderboardKey string  `json:"leaderboard_key"`
	MaxEntries     int     `json:"max_entries"`
	TopCount       int     `json:"top_count"`
	AroundRank     int     `json:"around_rank"`
	AroundCount    int     `json:"around_count"`
	Size           int64   `json:"size"`
	TopEntries     []Entry `json:"top_entries"`
	AroundEntries  []Entry `json:"around_entries"`
}

var currentState demoState

func parsePositiveIntFromString(rawValue string, defaultValue int) int {
	value, err := strconv.Atoi(rawValue)
	if err != nil || value < 1 {
		return defaultValue
	}
	return value
}

func parseFloatFromString(rawValue string) (float64, error) {
	value, err := strconv.ParseFloat(rawValue, 64)
	if err != nil {
		return 0, err
	}
	return value, nil
}

func writeJSON(w http.ResponseWriter, statusCode int, payload any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(payload)
}

func leaderboardSnapshot() *RedisLeaderboard {
	currentState.mu.RLock()
	defer currentState.mu.RUnlock()
	return currentState.leaderboard
}

func resetDemoData(ctx context.Context) error {
	lb := leaderboardSnapshot()
	if err := lb.Clear(ctx); err != nil {
		return err
	}

	for _, player := range samplePlayers {
		if _, err := lb.UpsertUser(ctx, player.UserID, player.Score, player.Metadata); err != nil {
			return err
		}
	}

	return nil
}

func handleState(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	lb := leaderboardSnapshot()

	topCount := parsePositiveIntFromString(r.URL.Query().Get("top"), 5)
	aroundRank := parsePositiveIntFromString(r.URL.Query().Get("rank"), 3)
	aroundCount := parsePositiveIntFromString(r.URL.Query().Get("around"), 5)

	topEntries, err := lb.GetTop(ctx, topCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	aroundEntries, err := lb.GetAroundRank(ctx, aroundRank, aroundCount)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	size, err := lb.GetSize(ctx)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, stateResponse{
		LeaderboardKey: lb.key,
		MaxEntries:     lb.maxEntries,
		TopCount:       topCount,
		AroundRank:     aroundRank,
		AroundCount:    aroundCount,
		Size:           size,
		TopEntries:     topEntries,
		AroundEntries:  aroundEntries,
	})
}

func handlePlayerUpsert(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	lb := leaderboardSnapshot()

	if err := r.ParseForm(); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	userID := r.FormValue("user_id")
	score, err := parseFloatFromString(r.FormValue("score"))
	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "User ID is required."})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Score must be a valid number."})
		return
	}

	name := r.FormValue("name")
	if name == "" {
		name = userID
	}
	description := r.FormValue("description")
	if description == "" {
		description = "No description provided."
	}

	entry, err := lb.UpsertUser(ctx, userID, score, map[string]string{
		"name":        name,
		"description": description,
	})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message":     "Player saved.",
		"entry":       entry,
		"max_entries": lb.maxEntries,
	})
}

func handleIncrement(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	lb := leaderboardSnapshot()

	if err := r.ParseForm(); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	userID := r.FormValue("user_id")
	amount, err := parseFloatFromString(r.FormValue("amount"))
	if userID == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "User ID is required."})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Increment must be a valid number."})
		return
	}

	existingMetadata, err := lb.GetUserMetadata(ctx, userID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	metadata := map[string]string{}
	for field, value := range existingMetadata {
		metadata[field] = value
	}
	if len(metadata) == 0 {
		name := r.FormValue("name")
		if name == "" {
			name = userID
		}
		description := r.FormValue("description")
		if description == "" {
			description = "Created during score increment."
		}
		metadata["name"] = name
		metadata["description"] = description
	} else {
		if name := r.FormValue("name"); name != "" {
			metadata["name"] = name
		}
		if description := r.FormValue("description"); description != "" {
			metadata["description"] = description
		}
	}

	entry, err := lb.IncrementScore(ctx, userID, amount, metadata)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message":     "Score updated.",
		"entry":       entry,
		"max_entries": lb.maxEntries,
	})
}

func handleConfigUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	lb := leaderboardSnapshot()

	if err := r.ParseForm(); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	maxEntries := parsePositiveIntFromString(r.FormValue("max_entries"), 0)
	if maxEntries < 1 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Max entries must be a whole number greater than 0."})
		return
	}

	trimmedUserIDs, err := lb.SetMaxEntries(ctx, maxEntries)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{
		"message":          "Leaderboard limit updated.",
		"max_entries":      lb.maxEntries,
		"trimmed_user_ids": trimmedUserIDs,
	})
}

func handleReset(w http.ResponseWriter, r *http.Request) {
	if err := resetDemoData(r.Context()); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	lb := leaderboardSnapshot()
	writeJSON(w, http.StatusOK, map[string]any{
		"message":     "Demo leaderboard reset.",
		"max_entries": lb.maxEntries,
	})
}

func handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}

	title := html.EscapeString("Redis Leaderboard Demo")
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	fmt.Fprintf(w, htmlPage(), title)
}

// RunDemoServer starts the interactive leaderboard demo HTTP server.
func RunDemoServer() {
	port := flag.Int("port", 8080, "Port to run the server on")
	host := flag.String("host", "127.0.0.1", "Host to bind to")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	maxEntries := flag.Int("max-entries", 100, "Maximum number of leaderboard entries to keep")
	flag.Parse()

	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})

	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to connect to Redis: %v\n", err)
		fmt.Fprintf(os.Stderr, "Make sure Redis is running at %s:%d\n", *redisHost, *redisPort)
		os.Exit(1)
	}

	currentState = demoState{
		leaderboard: NewRedisLeaderboard(Config{
			Client:     rdb,
			Key:        "leaderboard:demo",
			MaxEntries: *maxEntries,
		}),
	}

	if err := resetDemoData(ctx); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to seed demo data: %v\n", err)
		os.Exit(1)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("/", handleHome)
	mux.HandleFunc("/api/state", handleState)
	mux.HandleFunc("/api/players", handlePlayerUpsert)
	mux.HandleFunc("/api/increment", handleIncrement)
	mux.HandleFunc("/api/config", handleConfigUpdate)
	mux.HandleFunc("/api/reset", handleReset)

	server := &http.Server{
		Addr:    fmt.Sprintf("%s:%d", *host, *port),
		Handler: mux,
	}

	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		fmt.Println("\nStopping server.")
		rdb.Close()
		os.Exit(0)
	}()

	fmt.Printf("Leaderboard demo server running at http://%s:%d\n", *host, *port)
	fmt.Printf("Connected to Redis at %s:%d\n", *redisHost, *redisPort)
	fmt.Printf("Keeping the top %d entries\n", currentState.leaderboard.maxEntries)
	fmt.Println("Press Ctrl+C to stop.")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("server error: %v", err)
	}
}

func htmlPage() string {
	return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>%s</title>
    <style>
        :root {
            color-scheme: light;
            --bg: #f7f4ec;
            --panel: #fffaf0;
            --panel-strong: #f0e6d2;
            --text: #1f2933;
            --muted: #52606d;
            --line: #d7cab2;
            --accent: #b45309;
            --accent-dark: #7c2d12;
            --good: #166534;
        }
        * {
            box-sizing: border-box;
        }
        body {
            margin: 0;
            font-family: Georgia, "Times New Roman", serif;
            background:
                radial-gradient(circle at top left, rgba(180, 83, 9, 0.12), transparent 28%),
                linear-gradient(180deg, #fbf7ef 0%, var(--bg) 100%);
            color: var(--text);
        }
        main {
            max-width: 1120px;
            margin: 0 auto;
            padding: 32px 20px 48px;
        }
        h1, h2, h3 {
            margin-top: 0;
            color: #3b2f2f;
        }
        p {
            color: var(--muted);
            line-height: 1.5;
        }
        .hero {
            background: linear-gradient(135deg, rgba(180, 83, 9, 0.12), rgba(124, 45, 18, 0.08));
            border: 1px solid var(--line);
            border-radius: 20px;
            padding: 28px;
            margin-bottom: 24px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 18px;
        }
        .panel {
            background: var(--panel);
            border: 1px solid var(--line);
            border-radius: 18px;
            padding: 20px;
            box-shadow: 0 14px 40px rgba(31, 41, 51, 0.05);
        }
        .banner {
            background: var(--panel-strong);
            color: var(--accent-dark);
            border: 1px solid var(--line);
            border-radius: 14px;
            padding: 12px 14px;
            margin-bottom: 16px;
            min-height: 48px;
        }
        form {
            display: grid;
            gap: 10px;
        }
        label {
            font-size: 0.95rem;
            font-weight: 700;
            color: #4b3b30;
        }
        input, textarea, button {
            font: inherit;
        }
        input, textarea {
            width: 100%;
            padding: 10px 12px;
            border-radius: 12px;
            border: 1px solid var(--line);
            background: #fffdf8;
            color: var(--text);
        }
        textarea {
            min-height: 90px;
            resize: vertical;
        }
        button {
            border: 0;
            border-radius: 999px;
            padding: 11px 16px;
            background: linear-gradient(135deg, var(--accent), var(--accent-dark));
            color: white;
            cursor: pointer;
            font-weight: 700;
        }
        button.secondary {
            background: #e6dcc8;
            color: #4b3b30;
        }
        .inline {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
        }
        .toolbar {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 14px;
        }
        .statline {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-top: 8px;
            color: var(--muted);
            font-size: 0.95rem;
        }
        .table-wrap {
            overflow-x: auto;
        }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th, td {
            text-align: left;
            padding: 10px 8px;
            border-bottom: 1px solid rgba(215, 202, 178, 0.8);
            vertical-align: top;
        }
        th {
            color: #4b3b30;
            font-size: 0.95rem;
        }
        .pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            background: rgba(180, 83, 9, 0.1);
            color: var(--accent-dark);
            font-size: 0.85rem;
            font-weight: 700;
        }
        .success {
            color: var(--good);
        }
        @media (max-width: 720px) {
            .inline {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <main>
        <section class="hero">
            <h1>Redis leaderboard demo</h1>
            <p>
                This demo stores scores in a Redis sorted set and keeps player details in per-user hashes.
                You can inspect the top performers, look around a rank position, and trim the board to a fixed size.
            </p>
            <div class="statline">
                <span class="pill">Sorted set rankings</span>
                <span class="pill">Hash-based metadata</span>
                <span class="pill">Top N and around-rank queries</span>
            </div>
        </section>

        <div class="banner" id="banner">Ready.</div>

        <div class="grid">
            <section class="panel">
                <h2>Add or update a player</h2>
                <form id="upsert-form">
                    <label>User ID <input name="user_id" value="player-7" required></label>
                    <div class="inline">
                        <label>Name <input name="name" value="Kai"></label>
                        <label>Score <input name="score" type="number" step="0.01" value="1125" required></label>
                    </div>
                    <label>Description <textarea name="description">New challenger climbing into contention.</textarea></label>
                    <button type="submit">Save player</button>
                </form>
            </section>

            <section class="panel">
                <h2>Increment a score</h2>
                <form id="increment-form">
                    <div class="inline">
                        <label>User ID <input name="user_id" value="player-2" required></label>
                        <label>Amount <input name="amount" type="number" step="0.01" value="25" required></label>
                    </div>
                    <label>Name for a new user <input name="name" value=""></label>
                    <label>Description for a new user <textarea name="description"></textarea></label>
                    <button type="submit">Add points</button>
                </form>
            </section>

            <section class="panel">
                <h2>Leaderboard settings</h2>
                <form id="config-form">
                    <div class="inline">
                        <label>Top entries to view <input id="top-count" type="number" min="1" value="5"></label>
                        <label>Entries around rank <input id="around-count" type="number" min="1" value="5"></label>
                    </div>
                    <div class="inline">
                        <label>Center rank <input id="around-rank" type="number" min="1" value="3"></label>
                        <label>Max leaderboard size <input name="max_entries" id="max-entries" type="number" min="1" value="100"></label>
                    </div>
                    <button type="submit">Apply max size</button>
                </form>
                <div class="toolbar" style="margin-top: 14px;">
                    <button class="secondary" id="refresh-button" type="button">Refresh view</button>
                    <button class="secondary" id="reset-button" type="button">Reset sample data</button>
                </div>
                <div class="statline">
                    <span>Leaderboard key: <strong id="leaderboard-key">leaderboard:demo</strong></span>
                    <span>Stored entries: <strong id="leaderboard-size">0</strong></span>
                    <span>Max kept: <strong id="leaderboard-limit">100</strong></span>
                </div>
            </section>
        </div>

        <div class="grid" style="margin-top: 18px;">
            <section class="panel">
                <h2>Top entries</h2>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Score</th>
                                <th>Metadata</th>
                            </tr>
                        </thead>
                        <tbody id="top-table"></tbody>
                    </table>
                </div>
            </section>

            <section class="panel">
                <h2>Entries around rank</h2>
                <div class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Rank</th>
                                <th>User</th>
                                <th>Score</th>
                                <th>Metadata</th>
                            </tr>
                        </thead>
                        <tbody id="around-table"></tbody>
                    </table>
                </div>
            </section>
        </div>
    </main>

    <script>
        const banner = document.getElementById('banner');

        function setBanner(message, isSuccess = true) {
            banner.textContent = message;
            banner.className = 'banner' + (isSuccess ? ' success' : '');
        }

        function renderRows(targetId, entries) {
            const target = document.getElementById(targetId);
            if (!entries.length) {
                target.innerHTML = '<tr><td colspan="4">No entries found for this view.</td></tr>';
                return;
            }

            target.innerHTML = entries.map((entry) => {
                const metadata = entry.metadata || {};
                const name = metadata.name || entry.user_id;
                const description = metadata.description || '';
                return '<tr>' +
                    '<td>#' + entry.rank + '</td>' +
                    '<td><strong>' + entry.user_id + '</strong><br><span>' + name + '</span></td>' +
                    '<td>' + entry.score + '</td>' +
                    '<td>' + description + '</td>' +
                    '</tr>';
            }).join('');
        }

        async function refreshState() {
            const top = document.getElementById('top-count').value || '5';
            const around = document.getElementById('around-count').value || '5';
            const rank = document.getElementById('around-rank').value || '3';
            const response = await fetch(
                '/api/state?top=' + encodeURIComponent(top) +
                '&around=' + encodeURIComponent(around) +
                '&rank=' + encodeURIComponent(rank)
            );
            const data = await response.json();

            document.getElementById('leaderboard-key').textContent = data.leaderboard_key;
            document.getElementById('leaderboard-size').textContent = data.size;
            document.getElementById('leaderboard-limit').textContent = data.max_entries;
            document.getElementById('max-entries').value = data.max_entries;

            renderRows('top-table', data.top_entries);
            renderRows('around-table', data.around_entries);
        }

        async function postForm(url, form) {
            const response = await fetch(url, {
                method: 'POST',
                body: new URLSearchParams(new FormData(form))
            });
            return response.json();
        }

        document.getElementById('upsert-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = await postForm('/api/players', event.target);
            if (data.error) {
                setBanner(data.error, false);
                return;
            }
            const trimmed = data.entry.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ' Trimmed: ' + trimmed.join(', ') + '.' : '';
            setBanner('Saved ' + data.entry.user_id + ' at rank #' + data.entry.rank + ' with score ' + data.entry.score + '.' + trimmedText);
            await refreshState();
        });

        document.getElementById('increment-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = await postForm('/api/increment', event.target);
            if (data.error) {
                setBanner(data.error, false);
                return;
            }
            const trimmed = data.entry.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ' Trimmed: ' + trimmed.join(', ') + '.' : '';
            setBanner('Updated ' + data.entry.user_id + ' to score ' + data.entry.score + ' at rank #' + data.entry.rank + '.' + trimmedText);
            await refreshState();
        });

        document.getElementById('config-form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = await postForm('/api/config', event.target);
            if (data.error) {
                setBanner(data.error, false);
                return;
            }
            const trimmed = data.trimmed_user_ids || [];
            const trimmedText = trimmed.length ? ' Trimmed: ' + trimmed.join(', ') + '.' : '';
            setBanner('Leaderboard limit set to ' + data.max_entries + '.' + trimmedText);
            await refreshState();
        });

        document.getElementById('refresh-button').addEventListener('click', refreshState);

        document.getElementById('reset-button').addEventListener('click', async () => {
            const response = await fetch('/api/reset', { method: 'POST' });
            const data = await response.json();
            setBanner(data.message);
            await refreshState();
        });

        refreshState().catch((error) => {
            setBanner('Failed to load leaderboard state: ' + error, false);
        });
    </script>
</body>
</html>`
}

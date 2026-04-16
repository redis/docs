// Token Bucket Rate Limiter Demo Server
//
// A simple HTTP server demonstrating the token bucket rate limiter.
// Run this server and visit http://localhost:8080 in your browser to test
// the rate limiting behavior interactively.
//
// To run, create a main.go in the same directory:
//
//	package main
//
//	import "ratelimiter"
//
//	func main() { ratelimiter.RunDemoServer() }
//
// Then: go run . [-port PORT] [-redis-host HOST] [-redis-port PORT]
package ratelimiter

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
	"sync"
	"syscall"
	"time"

	"github.com/redis/go-redis/v9"
)

// limiterState holds the shared rate limiter and its configuration.
type limiterState struct {
	mu             sync.Mutex
	limiter        *TokenBucket
	client         *redis.Client
	capacity       int
	refillRate     float64
	refillInterval float64
}

// testResponse is the JSON response for POST /test.
type testResponse struct {
	Allowed   bool              `json:"allowed"`
	Remaining float64           `json:"remaining"`
	Config    map[string]any    `json:"config"`
}

// configResponse is the JSON response for POST /config.
type configResponse struct {
	Success bool              `json:"success"`
	Config  map[string]any    `json:"config,omitempty"`
	Error   string            `json:"error,omitempty"`
}

var state limiterState

func configMap() map[string]any {
	return map[string]any{
		"capacity":        state.capacity,
		"refill_rate":     state.refillRate,
		"refill_interval": state.refillInterval,
	}
}

// handleTest handles POST /test — checks the rate limiter and returns JSON.
func handleTest(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	state.mu.Lock()
	limiter := state.limiter
	state.mu.Unlock()

	allowed, remaining, err := limiter.Allow(context.Background(), "demo:request")
	if err != nil {
		http.Error(w, "Rate limiter error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	resp := testResponse{
		Allowed:   allowed,
		Remaining: remaining,
		Config:    configMap(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// handleConfig handles POST /config — updates rate limiter settings.
func handleConfig(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	if err := r.ParseForm(); err != nil {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(configResponse{Success: false, Error: err.Error()})
		return
	}

	state.mu.Lock()
	defer state.mu.Unlock()

	capacity := state.capacity
	refillRate := state.refillRate
	refillInterval := state.refillInterval

	if v := r.FormValue("capacity"); v != "" {
		if parsed, err := strconv.Atoi(v); err == nil {
			capacity = parsed
		}
	}
	if v := r.FormValue("refill_rate"); v != "" {
		if parsed, err := strconv.ParseFloat(v, 64); err == nil {
			refillRate = parsed
		}
	}
	if v := r.FormValue("refill_interval"); v != "" {
		if parsed, err := strconv.ParseFloat(v, 64); err == nil {
			refillInterval = parsed
		}
	}

	state.capacity = capacity
	state.refillRate = refillRate
	state.refillInterval = refillInterval

	state.limiter = NewTokenBucket(TokenBucketConfig{
		Capacity:       capacity,
		RefillRate:     refillRate,
		RefillInterval: secondsToDuration(refillInterval),
		Client:         state.client,
	})

	resp := configResponse{Success: true, Config: configMap()}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// handleHome handles GET / — serves the interactive HTML page.
func handleHome(w http.ResponseWriter, r *http.Request) {
	if r.URL.Path != "/" && r.URL.Path != "/index.html" {
		http.NotFound(w, r)
		return
	}

	state.mu.Lock()
	cap := state.capacity
	rate := state.refillRate
	interval := state.refillInterval
	state.mu.Unlock()

	w.Header().Set("Content-Type", "text/html")
	fmt.Fprintf(w, htmlPage(),
		cap, rate, interval,
		cap, rate, interval,
	)
}

func secondsToDuration(s float64) time.Duration {
	return time.Duration(s * float64(time.Second))
}

// RunDemoServer starts the interactive rate limiter demo HTTP server.
// It uses the flag package to parse -port, -redis-host, and -redis-port arguments.
func RunDemoServer() {
	port := flag.Int("port", 8080, "Port to run the server on")
	redisHost := flag.String("redis-host", "localhost", "Redis host")
	redisPort := flag.Int("redis-port", 6379, "Redis port")
	flag.Parse()

	// Initialize Redis connection
	rdb := redis.NewClient(&redis.Options{
		Addr: fmt.Sprintf("%s:%d", *redisHost, *redisPort),
	})

	ctx := context.Background()
	if err := rdb.Ping(ctx).Err(); err != nil {
		fmt.Fprintf(os.Stderr, "✗ Failed to connect to Redis: %v\n", err)
		fmt.Fprintf(os.Stderr, "  Make sure Redis is running at %s:%d\n", *redisHost, *redisPort)
		os.Exit(1)
	}
	fmt.Printf("✓ Connected to Redis at %s:%d\n", *redisHost, *redisPort)

	// Initialize the rate limiter
	state = limiterState{
		client:         rdb,
		capacity:       10,
		refillRate:     1,
		refillInterval: 1.0,
	}
	state.limiter = NewTokenBucket(TokenBucketConfig{
		Capacity:       state.capacity,
		RefillRate:     state.refillRate,
		RefillInterval: time.Second,
		Client:         rdb,
	})

	// Set up routes
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleHome)
	mux.HandleFunc("/test", handleTest)
	mux.HandleFunc("/config", handleConfig)

	server := &http.Server{
		Addr:    fmt.Sprintf(":%d", *port),
		Handler: mux,
	}

	// Handle graceful shutdown
	go func() {
		sigCh := make(chan os.Signal, 1)
		signal.Notify(sigCh, syscall.SIGINT, syscall.SIGTERM)
		<-sigCh
		fmt.Println("\n✓ Server stopped")
		rdb.Close()
		os.Exit(0)
	}()

	fmt.Printf("✓ Server started at http://localhost:%d\n", *port)
	fmt.Printf("  Open your browser and visit http://localhost:%d\n", *port)
	fmt.Println("  Press Ctrl+C to stop the server")

	if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
		log.Fatalf("Server error: %v", err)
	}
}

// htmlPage returns the HTML template for the interactive demo UI.
// It uses fmt verbs: %d (capacity), %v (refill rate), %v (refill interval),
// then again %d, %v, %v for the form default values.
func htmlPage() string {
	return `<!DOCTYPE html>
<html>
<head>
    <title>Token Bucket Rate Limiter Demo</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }
        h1 { color: #333; }
        .config-section, .test-section {
            background: #f5f5f5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .form-group { margin: 10px 0; }
        label { display: inline-block; width: 150px; font-weight: bold; }
        input { padding: 5px; width: 200px; }
        button {
            background: #007bff; color: white; padding: 10px 20px;
            border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px 10px 0;
        }
        button:hover { background: #0056b3; }
        .result {
            padding: 15px; margin: 15px 0; border-radius: 5px;
            font-size: 18px; font-weight: bold;
        }
        .allowed {
            background: #d4edda; color: #155724; border: 1px solid #c3e6cb;
        }
        .denied {
            background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb;
        }
        .info {
            background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb;
            padding: 10px; margin: 10px 0; border-radius: 5px;
        }
    </style>
</head>
<body>
    <h1>Token Bucket Rate Limiter Demo</h1>

    <div class="info">
        <strong>How it works:</strong> The token bucket starts with a capacity of tokens.
        Each request consumes one token. Tokens refill at a constant rate. When the bucket
        is empty, requests are denied until tokens refill.
    </div>

    <div class="config-section">
        <h2>Configuration</h2>
        <p>Current settings:</p>
        <ul>
            <li><strong>Capacity:</strong> <span id="current-capacity">%d</span> tokens</li>
            <li><strong>Refill Rate:</strong> <span id="current-refill-rate">%v</span> tokens</li>
            <li><strong>Refill Interval:</strong> <span id="current-refill-interval">%v</span> seconds</li>
        </ul>

        <form id="config-form">
            <div class="form-group">
                <label for="capacity">Capacity:</label>
                <input type="number" id="capacity" name="capacity" value="%d" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_rate">Refill Rate:</label>
                <input type="number" id="refill_rate" name="refill_rate" value="%v" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_interval">Refill Interval (s):</label>
                <input type="number" id="refill_interval" name="refill_interval" value="%v" step="0.1" min="0.1" required>
            </div>
            <button type="submit">Update Configuration</button>
        </form>
    </div>

    <div class="test-section">
        <h2>Test Rate Limiting</h2>
        <p>Click the button below to submit a request and see if it's allowed or denied.</p>
        <button id="test-button">Submit Request</button>
        <div id="result"></div>
    </div>

    <script>
        document.getElementById('test-button').addEventListener('click', async () => {
            const response = await fetch('/test', { method: 'POST' });
            const data = await response.json();

            const resultDiv = document.getElementById('result');
            const status = data.allowed ? '✓ ALLOWED' : '✗ DENIED';
            const className = data.allowed ? 'allowed' : 'denied';

            resultDiv.className = 'result ' + className;
            resultDiv.innerHTML =
                '<div>' + status + '</div>' +
                '<div style="font-size: 14px; margin-top: 10px;">' +
                'Tokens remaining: ' + data.remaining.toFixed(2) +
                '</div>';
        });

        document.getElementById('config-form').addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(e.target);
            const response = await fetch('/config', {
                method: 'POST',
                body: new URLSearchParams(formData)
            });
            const data = await response.json();

            if (data.success) {
                document.getElementById('current-capacity').textContent = data.config.capacity;
                document.getElementById('current-refill-rate').textContent = data.config.refill_rate;
                document.getElementById('current-refill-interval').textContent = data.config.refill_interval;
                alert('Configuration updated successfully!');
            } else {
                alert('Error updating configuration: ' + data.error);
            }
        });
    </script>
</body>
</html>`
}


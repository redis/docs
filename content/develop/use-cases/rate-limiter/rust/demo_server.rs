//! Token Bucket Rate Limiter Demo Server
//!
//! A simple HTTP server demonstrating the token bucket rate limiter.
//! Run this server and visit http://localhost:8080 in your browser to test
//! the rate limiting behavior interactively.
//!
//! Usage:
//!     cargo run [-- [--port PORT] [--redis-host HOST] [--redis-port PORT]]

mod token_bucket;

use axum::{
    extract::State,
    http::StatusCode,
    response::{Html, IntoResponse, Json},
    routing::{get, post},
    Router,
};
use redis::{Client, Connection};
use serde::{Deserialize, Serialize};
use std::env;
use std::sync::{Arc, Mutex};
use token_bucket::TokenBucket;

/// Application state shared across handlers
struct AppState {
    redis_connection: Mutex<Connection>,
    limiter_config: Mutex<LimiterConfig>,
}

/// Rate limiter configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
struct LimiterConfig {
    capacity: i64,
    refill_rate: f64,
    refill_interval: f64,
}

impl Default for LimiterConfig {
    fn default() -> Self {
        Self {
            capacity: 10,
            refill_rate: 1.0,
            refill_interval: 1.0,
        }
    }
}

/// Response for /test endpoint
#[derive(Serialize)]
struct TestResponse {
    allowed: bool,
    remaining: f64,
    config: LimiterConfig,
}

/// Response for /config endpoint
#[derive(Serialize)]
struct ConfigResponse {
    success: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    config: Option<LimiterConfig>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<String>,
}

/// Handler for GET / - Serve HTML page
async fn handle_home(State(state): State<Arc<AppState>>) -> Html<String> {
    let config = state.limiter_config.lock().unwrap().clone();
    Html(get_html_page(&config))
}

/// Handler for POST /test - Check rate limit
async fn handle_test(State(state): State<Arc<AppState>>) -> impl IntoResponse {
    let config = state.limiter_config.lock().unwrap().clone();
    let limiter = TokenBucket::new(config.capacity, config.refill_rate, config.refill_interval);

    let mut conn = state.redis_connection.lock().unwrap();
    match limiter.allow(&mut *conn, "demo:request") {
        Ok(result) => Json(TestResponse {
            allowed: result.allowed,
            remaining: result.remaining,
            config,
        })
        .into_response(),
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Redis error: {}", e),
        )
            .into_response(),
    }
}

/// Handler for POST /config - Update configuration
async fn handle_config(
    State(state): State<Arc<AppState>>,
    Json(new_config): Json<LimiterConfig>,
) -> Json<ConfigResponse> {
    // Validate configuration
    if new_config.capacity < 1 {
        return Json(ConfigResponse {
            success: false,
            config: None,
            error: Some("Capacity must be at least 1".to_string()),
        });
    }
    if new_config.refill_rate < 0.1 {
        return Json(ConfigResponse {
            success: false,
            config: None,
            error: Some("Refill rate must be at least 0.1".to_string()),
        });
    }
    if new_config.refill_interval < 0.1 {
        return Json(ConfigResponse {
            success: false,
            config: None,
            error: Some("Refill interval must be at least 0.1".to_string()),
        });
    }

    // Update configuration
    *state.limiter_config.lock().unwrap() = new_config.clone();

    Json(ConfigResponse {
        success: true,
        config: Some(new_config),
        error: None,
    })
}

#[tokio::main]
async fn main() {
    // Parse command-line arguments
    let args: Vec<String> = env::args().collect();
    let port = parse_arg(&args, "--port").unwrap_or_else(|| "8080".to_string());
    let redis_host = parse_arg(&args, "--redis-host").unwrap_or_else(|| "localhost".to_string());
    let redis_port = parse_arg(&args, "--redis-port").unwrap_or_else(|| "6379".to_string());

    // Connect to Redis
    let redis_url = format!("redis://{}:{}", redis_host, redis_port);

    let client = match Client::open(redis_url.as_str()) {
        Ok(c) => c,
        Err(e) => {
            eprintln!("✗ Failed to create Redis client: {}", e);
            std::process::exit(1);
        }
    };

    let connection = match client.get_connection() {
        Ok(c) => {
            println!("✓ Connected to Redis at {}:{}", redis_host, redis_port);
            c
        }
        Err(e) => {
            eprintln!("✗ Failed to connect to Redis: {}", e);
            eprintln!("  Make sure Redis is running at {}:{}", redis_host, redis_port);
            std::process::exit(1);
        }
    };

    // Create shared state
    let state = Arc::new(AppState {
        redis_connection: Mutex::new(connection),
        limiter_config: Mutex::new(LimiterConfig::default()),
    });

    // Build the router
    let app = Router::new()
        .route("/", get(handle_home))
        .route("/test", post(handle_test))
        .route("/config", post(handle_config))
        .with_state(state);

    // Start the server
    let addr = format!("0.0.0.0:{}", port);
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|e| {
            eprintln!("✗ Failed to bind to {}: {}", addr, e);
            std::process::exit(1);
        });

    println!("✓ Server started at http://localhost:{}", port);
    println!("  Open your browser and visit http://localhost:{}", port);
    println!("  Press Ctrl+C to stop the server");

    axum::serve(listener, app)
        .await
        .unwrap_or_else(|e| {
            eprintln!("✗ Server error: {}", e);
            std::process::exit(1);
        });
}

/// Parse command-line argument value
fn parse_arg(args: &[String], flag: &str) -> Option<String> {
    args.iter()
        .position(|arg| arg == flag)
        .and_then(|pos| args.get(pos + 1))
        .cloned()
}

/// Generate the HTML page for the demo
fn get_html_page(config: &LimiterConfig) -> String {
    format!(
        r#"<!DOCTYPE html>
<html>
<head>
    <title>Token Bucket Rate Limiter Demo</title>
    <style>
        body {{
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
        }}
        h1 {{
            color: #333;
        }}
        .config-section, .test-section {{
            background: #f5f5f5;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .form-group {{
            margin: 10px 0;
        }}
        label {{
            display: inline-block;
            width: 150px;
            font-weight: bold;
        }}
        input {{
            padding: 5px;
            width: 200px;
        }}
        button {{
            background: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            margin: 10px 5px 10px 0;
        }}
        button:hover {{
            background: #0056b3;
        }}
        .result {{
            padding: 15px;
            margin: 15px 0;
            border-radius: 5px;
            font-size: 18px;
            font-weight: bold;
        }}
        .allowed {{
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }}
        .denied {{
            background: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }}
        .info {{
            background: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
            padding: 10px;
            margin: 10px 0;
            border-radius: 5px;
        }}
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
            <li><strong>Capacity:</strong> <span id="current-capacity">{}</span> tokens</li>
            <li><strong>Refill Rate:</strong> <span id="current-refill-rate">{}</span> tokens</li>
            <li><strong>Refill Interval:</strong> <span id="current-refill-interval">{}</span> seconds</li>
        </ul>

        <form id="config-form">
            <div class="form-group">
                <label for="capacity">Capacity:</label>
                <input type="number" id="capacity" name="capacity" value="{}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_rate">Refill Rate:</label>
                <input type="number" id="refill_rate" name="refill_rate" value="{}" min="1" step="0.1" required>
            </div>
            <div class="form-group">
                <label for="refill_interval">Refill Interval (s):</label>
                <input type="number" id="refill_interval" name="refill_interval" value="{}" step="0.1" min="0.1" required>
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
        // Handle test request
        document.getElementById('test-button').addEventListener('click', async () => {{
            const response = await fetch('/test', {{ method: 'POST' }});
            const data = await response.json();

            const resultDiv = document.getElementById('result');
            const status = data.allowed ? '✓ ALLOWED' : '✗ DENIED';
            const className = data.allowed ? 'allowed' : 'denied';

            resultDiv.className = 'result ' + className;
            resultDiv.innerHTML = `
                <div>${{status}}</div>
                <div style="font-size: 14px; margin-top: 10px;">
                    Tokens remaining: ${{data.remaining.toFixed(2)}}
                </div>
            `;
        }});

        // Handle config update
        document.getElementById('config-form').addEventListener('submit', async (e) => {{
            e.preventDefault();

            const formData = new FormData(e.target);
            const config = {{
                capacity: parseInt(formData.get('capacity')),
                refill_rate: parseFloat(formData.get('refill_rate')),
                refill_interval: parseFloat(formData.get('refill_interval'))
            }};

            const response = await fetch('/config', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify(config)
            }});
            const data = await response.json();

            if (data.success) {{
                document.getElementById('current-capacity').textContent = data.config.capacity;
                document.getElementById('current-refill-rate').textContent = data.config.refill_rate;
                document.getElementById('current-refill-interval').textContent = data.config.refill_interval;
                alert('Configuration updated successfully!');
            }} else {{
                alert('Error updating configuration: ' + data.error);
            }}
        }});
    </script>
</body>
</html>"#,
        config.capacity,
        config.refill_rate,
        config.refill_interval,
        config.capacity,
        config.refill_rate,
        config.refill_interval
    )
}


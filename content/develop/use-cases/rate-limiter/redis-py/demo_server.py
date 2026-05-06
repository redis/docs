#!/usr/bin/env python3
"""
Token Bucket Rate Limiter Demo Server

A simple HTTP server demonstrating the token bucket rate limiter.
Run this server and visit http://localhost:8080 in your browser to test
the rate limiting behavior interactively.

Usage:
    python demo_server.py [--port PORT] [--redis-host HOST] [--redis-port PORT]
"""

import argparse
import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

# Add current directory to path to import token_bucket
sys.path.insert(0, '.')

try:
    from token_bucket import TokenBucket
    import redis
except ImportError as e:
    print(f"Error: {e}")
    print("Make sure 'redis' package is installed: pip install redis")
    sys.exit(1)


class RateLimiterHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the rate limiter demo."""
    
    # Class-level variables for configuration
    limiter = None
    config = {
        'capacity': 10,
        'refill_rate': 1,
        'refill_interval': 1.0
    }
    
    def do_GET(self):
        """Handle GET requests - serve the main page."""
        if self.path == '/' or self.path == '/index.html':
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(self._get_html_page().encode())
        else:
            self.send_error(404)
    
    def do_POST(self):
        """Handle POST requests - test rate limiting or update config."""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/test':
            self._handle_test_request()
        elif parsed_path.path == '/config':
            self._handle_config_update()
        else:
            self.send_error(404)
    
    def _handle_test_request(self):
        """Test the rate limiter and return the result."""
        allowed, remaining = self.limiter.allow('demo:request')
        
        response = {
            'allowed': allowed,
            'remaining': remaining,
            'config': self.config
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def _handle_config_update(self):
        """Update the rate limiter configuration."""
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length)
        params = parse_qs(post_data.decode())
        
        try:
            capacity = int(params.get('capacity', [self.config['capacity']])[0])
            refill_rate = int(params.get('refill_rate', [self.config['refill_rate']])[0])
            refill_interval = float(params.get('refill_interval', [self.config['refill_interval']])[0])
            
            # Update configuration
            self.config['capacity'] = capacity
            self.config['refill_rate'] = refill_rate
            self.config['refill_interval'] = refill_interval
            
            # Recreate limiter with new config
            self.limiter = TokenBucket(
                redis_client=self.limiter.redis,
                capacity=capacity,
                refill_rate=refill_rate,
                refill_interval=refill_interval
            )
            
            response = {'success': True, 'config': self.config}
        except (ValueError, KeyError) as e:
            response = {'success': False, 'error': str(e)}
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response).encode())
    
    def _get_html_page(self):
        """Generate the HTML page for the demo."""
        return f"""<!DOCTYPE html>
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
            <li><strong>Capacity:</strong> <span id="current-capacity">{self.config['capacity']}</span> tokens</li>
            <li><strong>Refill Rate:</strong> <span id="current-refill-rate">{self.config['refill_rate']}</span> tokens</li>
            <li><strong>Refill Interval:</strong> <span id="current-refill-interval">{self.config['refill_interval']}</span> seconds</li>
        </ul>

        <form id="config-form">
            <div class="form-group">
                <label for="capacity">Capacity:</label>
                <input type="number" id="capacity" name="capacity" value="{self.config['capacity']}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_rate">Refill Rate:</label>
                <input type="number" id="refill_rate" name="refill_rate" value="{self.config['refill_rate']}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_interval">Refill Interval (s):</label>
                <input type="number" id="refill_interval" name="refill_interval" value="{self.config['refill_interval']}" step="0.1" min="0.1" required>
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
            const response = await fetch('/config', {{
                method: 'POST',
                body: new URLSearchParams(formData)
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
</html>
"""

    def log_message(self, format, *args):
        """Override to customize logging."""
        # Simple logging format
        print(f"[{self.log_date_time_string()}] {format % args}")


def main():
    """Main entry point for the demo server."""
    parser = argparse.ArgumentParser(description='Token Bucket Rate Limiter Demo Server')
    parser.add_argument('--port', type=int, default=8080, help='Port to run the server on (default: 8080)')
    parser.add_argument('--redis-host', default='localhost', help='Redis host (default: localhost)')
    parser.add_argument('--redis-port', type=int, default=6379, help='Redis port (default: 6379)')
    args = parser.parse_args()

    # Initialize Redis connection
    try:
        redis_client = redis.Redis(
            host=args.redis_host,
            port=args.redis_port,
            decode_responses=True
        )
        # Test connection
        redis_client.ping()
        print(f"✓ Connected to Redis at {args.redis_host}:{args.redis_port}")
    except redis.ConnectionError as e:
        print(f"✗ Failed to connect to Redis: {e}")
        print(f"  Make sure Redis is running at {args.redis_host}:{args.redis_port}")
        sys.exit(1)

    # Initialize the rate limiter
    RateLimiterHandler.limiter = TokenBucket(
        redis_client=redis_client,
        capacity=RateLimiterHandler.config['capacity'],
        refill_rate=RateLimiterHandler.config['refill_rate'],
        refill_interval=RateLimiterHandler.config['refill_interval']
    )

    # Start the server
    server = HTTPServer(('', args.port), RateLimiterHandler)
    print(f"✓ Server started at http://localhost:{args.port}")
    print(f"  Open your browser and visit http://localhost:{args.port}")
    print(f"  Press Ctrl+C to stop the server")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✓ Server stopped")
        sys.exit(0)


if __name__ == '__main__':
    main()



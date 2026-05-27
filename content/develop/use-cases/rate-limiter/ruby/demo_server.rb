#!/usr/bin/env ruby
# frozen_string_literal: true

#
# Token Bucket Rate Limiter Demo Server
#
# A simple HTTP server demonstrating the token bucket rate limiter.
# Run this server and visit http://localhost:8080 in your browser to test
# the rate limiting behavior interactively.
#
# Usage:
#     ruby demo_server.rb [--port PORT] [--redis-host HOST] [--redis-port PORT]
#

require 'webrick'
require 'json'
require 'uri'
require_relative 'token_bucket'

# Default configuration
$config = {
  capacity: 10,
  refill_rate: 1,
  refill_interval: 1.0
}

# Parse command-line arguments
port = Integer(ENV['PORT'] || 8080)
redis_host = ENV['REDIS_HOST'] || 'localhost'
redis_port = Integer(ENV['REDIS_PORT'] || 6379)

ARGV.each_with_index do |arg, i|
  case arg
  when '--port'
    port = Integer(ARGV[i + 1])
  when '--redis-host'
    redis_host = ARGV[i + 1]
  when '--redis-port'
    redis_port = Integer(ARGV[i + 1])
  end
end

# Initialize Redis connection
require 'redis'

begin
  redis_client = Redis.new(host: redis_host, port: redis_port)
  redis_client.ping
  puts "✓ Connected to Redis at #{redis_host}:#{redis_port}"
rescue Redis::CannotConnectError => e
  warn "✗ Failed to connect to Redis: #{e.message}"
  warn "  Make sure Redis is running at #{redis_host}:#{redis_port}"
  exit 1
end

# Initialize the rate limiter
$limiter = TokenBucket.new(
  redis: redis_client,
  capacity: $config[:capacity],
  refill_rate: $config[:refill_rate],
  refill_interval: $config[:refill_interval]
)

# Generate the HTML page for the interactive demo
def html_page
  capacity = $config[:capacity]
  refill_rate = $config[:refill_rate]
  refill_interval = $config[:refill_interval]

  <<~HTML
    <!DOCTYPE html>
    <html>
    <head>
        <title>Token Bucket Rate Limiter Demo</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
            h1 { color: #333; }
            .config-section, .test-section {
                background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;
            }
            .form-group { margin: 10px 0; }
            label { display: inline-block; width: 150px; font-weight: bold; }
            input { padding: 5px; width: 200px; }
            button {
                background: #007bff; color: white; padding: 10px 20px;
                border: none; border-radius: 5px; cursor: pointer; margin: 10px 5px 10px 0;
            }
            button:hover { background: #0056b3; }
            .result { padding: 15px; margin: 15px 0; border-radius: 5px; font-size: 18px; font-weight: bold; }
            .allowed { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
            .denied { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
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
                <li><strong>Capacity:</strong> <span id="current-capacity">#{capacity}</span> tokens</li>
                <li><strong>Refill Rate:</strong> <span id="current-refill-rate">#{refill_rate}</span> tokens</li>
                <li><strong>Refill Interval:</strong> <span id="current-refill-interval">#{refill_interval}</span> seconds</li>
            </ul>

            <form id="config-form">
                <div class="form-group">
                    <label for="capacity">Capacity:</label>
                    <input type="number" id="capacity" name="capacity" value="#{capacity}" min="1" required>
                </div>
                <div class="form-group">
                    <label for="refill_rate">Refill Rate:</label>
                    <input type="number" id="refill_rate" name="refill_rate" value="#{refill_rate}" min="1" required>
                </div>
                <div class="form-group">
                    <label for="refill_interval">Refill Interval (s):</label>
                    <input type="number" id="refill_interval" name="refill_interval" value="#{refill_interval}" step="0.1" min="0.1" required>
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
    </html>
  HTML
end

# Create the WEBrick server
server = WEBrick::HTTPServer.new(
  Port: port,
  Logger: WEBrick::Log.new($stdout, WEBrick::Log::INFO),
  AccessLog: [[File.open(File::NULL, 'w'), WEBrick::AccessLog::COMMON_LOG_FORMAT]]
)

# GET / — serve the HTML demo page
server.mount_proc '/' do |req, res|
  if req.request_method == 'GET'
    res['Content-Type'] = 'text/html'
    res.body = html_page
  else
    res.status = 405
    res.body = 'Method Not Allowed'
  end
end

# POST /test — check rate limit and return JSON
server.mount_proc '/test' do |req, res|
  unless req.request_method == 'POST'
    res.status = 405
    res.body = 'Method Not Allowed'
    next
  end

  result = $limiter.allow('demo:request')

  response = {
    allowed: result[:allowed],
    remaining: result[:remaining],
    config: $config
  }

  res['Content-Type'] = 'application/json'
  res.body = JSON.generate(response)
end

# POST /config — update rate limiter settings
server.mount_proc '/config' do |req, res|
  unless req.request_method == 'POST'
    res.status = 405
    res.body = 'Method Not Allowed'
    next
  end

  begin
    params = URI.decode_www_form(req.body || '').to_h

    capacity = Integer(params.fetch('capacity', $config[:capacity]))
    refill_rate = Integer(params.fetch('refill_rate', $config[:refill_rate]))
    refill_interval = Float(params.fetch('refill_interval', $config[:refill_interval]))

    $config[:capacity] = capacity
    $config[:refill_rate] = refill_rate
    $config[:refill_interval] = refill_interval

    # Recreate limiter with new config
    $limiter = TokenBucket.new(
      redis: redis_client,
      capacity: capacity,
      refill_rate: refill_rate,
      refill_interval: refill_interval
    )

    response = { success: true, config: $config }
  rescue StandardError => e
    response = { success: false, error: e.message }
  end

  res['Content-Type'] = 'application/json'
  res.body = JSON.generate(response)
end

# Graceful shutdown
trap('INT') { server.shutdown }
trap('TERM') { server.shutdown }

puts "✓ Server started at http://localhost:#{port}"
puts "  Open your browser and visit http://localhost:#{port}"
puts '  Press Ctrl+C to stop the server'

server.start


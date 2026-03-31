#!/usr/bin/env node
/**
 * Token Bucket Rate Limiter Demo Server
 *
 * A simple HTTP server demonstrating the token bucket rate limiter.
 * Run this server and visit http://localhost:8080 in your browser to test
 * the rate limiting behavior interactively.
 *
 * Usage:
 *     node demoServer.js [--port PORT] [--redis-host HOST] [--redis-port PORT]
 */

const http = require('http');
const { URL, URLSearchParams } = require('url');
const { TokenBucket } = require('./tokenBucket');
const { createClient } = require('redis');

// Parse command-line arguments
function parseArgs() {
    const args = process.argv.slice(2);
    const config = { port: 8080, redisHost: 'localhost', redisPort: 6379 };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--port':
                config.port = parseInt(args[++i], 10);
                break;
            case '--redis-host':
                config.redisHost = args[++i];
                break;
            case '--redis-port':
                config.redisPort = parseInt(args[++i], 10);
                break;
        }
    }
    return config;
}

// Rate limiter state
let limiter = null;
let limiterConfig = {
    capacity: 10,
    refillRate: 1,
    refillInterval: 1.0
};
let redisClient = null;

/**
 * Read the full request body as a string.
 * @param {http.IncomingMessage} req
 * @returns {Promise<string>}
 */
function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        req.on('data', (chunk) => { data += chunk; });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

/** Handle POST /test – check rate limit and return JSON. */
async function handleTestRequest(req, res) {
    const { allowed, remaining } = await limiter.allow('demo:request');

    const response = {
        allowed,
        remaining,
        config: limiterConfig
    };

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
}

/** Handle POST /config – update rate limiter settings. */
async function handleConfigUpdate(req, res) {
    const body = await readBody(req);
    const params = new URLSearchParams(body);

    let response;
    try {
        const capacity = parseInt(params.get('capacity') || limiterConfig.capacity, 10);
        const refillRate = parseInt(params.get('refill_rate') || limiterConfig.refillRate, 10);
        const refillInterval = parseFloat(params.get('refill_interval') || limiterConfig.refillInterval);

        limiterConfig = { capacity, refillRate, refillInterval };

        limiter = new TokenBucket({
            redisClient,
            capacity,
            refillRate,
            refillInterval
        });

        response = { success: true, config: limiterConfig };
    } catch (err) {
        response = { success: false, error: err.message };
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(response));
}

/** Handle GET / – serve the HTML demo page. */
function handleHomePage(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(getHtmlPage());
}

/** Route incoming requests. */
async function requestHandler(req, res) {
    const url = new URL(req.url, `http://${req.headers.host}`);

    try {
        if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
            handleHomePage(req, res);
        } else if (req.method === 'POST' && url.pathname === '/test') {
            await handleTestRequest(req, res);
        } else if (req.method === 'POST' && url.pathname === '/config') {
            await handleConfigUpdate(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
        }
    } catch (err) {
        console.error('Request error:', err);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
    }
}

/** Generate the HTML page for the interactive demo. */
function getHtmlPage() {
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
            <li><strong>Capacity:</strong> <span id="current-capacity">${limiterConfig.capacity}</span> tokens</li>
            <li><strong>Refill Rate:</strong> <span id="current-refill-rate">${limiterConfig.refillRate}</span> tokens</li>
            <li><strong>Refill Interval:</strong> <span id="current-refill-interval">${limiterConfig.refillInterval}</span> seconds</li>
        </ul>

        <form id="config-form">
            <div class="form-group">
                <label for="capacity">Capacity:</label>
                <input type="number" id="capacity" name="capacity" value="${limiterConfig.capacity}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_rate">Refill Rate:</label>
                <input type="number" id="refill_rate" name="refill_rate" value="${limiterConfig.refillRate}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_interval">Refill Interval (s):</label>
                <input type="number" id="refill_interval" name="refill_interval" value="${limiterConfig.refillInterval}" step="0.1" min="0.1" required>
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
                document.getElementById('current-refill-rate').textContent = data.config.refillRate;
                document.getElementById('current-refill-interval').textContent = data.config.refillInterval;
                alert('Configuration updated successfully!');
            } else {
                alert('Error updating configuration: ' + data.error);
            }
        });
    </script>
</body>
</html>`;
}

/** Main entry point for the demo server. */
async function main() {
    const args = parseArgs();

    // Initialize Redis connection
    redisClient = createClient({
        socket: {
            host: args.redisHost,
            port: args.redisPort
        }
    });

    redisClient.on('error', (err) => {
        console.error('✗ Redis error:', err.message);
    });

    try {
        await redisClient.connect();
        await redisClient.ping();
        console.log(`✓ Connected to Redis at ${args.redisHost}:${args.redisPort}`);
    } catch (err) {
        console.error(`✗ Failed to connect to Redis: ${err.message}`);
        console.error(`  Make sure Redis is running at ${args.redisHost}:${args.redisPort}`);
        process.exit(1);
    }

    // Initialize the rate limiter
    limiter = new TokenBucket({
        redisClient,
        capacity: limiterConfig.capacity,
        refillRate: limiterConfig.refillRate,
        refillInterval: limiterConfig.refillInterval
    });

    // Start the server
    const server = http.createServer(requestHandler);
    server.listen(args.port, () => {
        console.log(`✓ Server started at http://localhost:${args.port}`);
        console.log(`  Open your browser and visit http://localhost:${args.port}`);
        console.log('  Press Ctrl+C to stop the server');
    });

    process.on('SIGINT', async () => {
        console.log('\n✓ Server stopped');
        await redisClient.quit();
        process.exit(0);
    });
}

main();

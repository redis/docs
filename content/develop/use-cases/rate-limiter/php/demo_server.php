<?php
/**
 * Token Bucket Rate Limiter Demo Server
 *
 * A simple HTTP server demonstrating the token bucket rate limiter.
 * Run this server and visit http://localhost:8080 in your browser to test
 * the rate limiting behavior interactively.
 *
 * Usage:
 *     php -S localhost:8080 demo_server.php
 */

require_once __DIR__ . '/TokenBucket.php';

use Predis\Client as PredisClient;

// Default configuration
$defaultConfig = [
    'capacity' => 10,
    'refill_rate' => 1,
    'refill_interval' => 1.0,
];

$redisHost = getenv('REDIS_HOST') ?: 'localhost';
$redisPort = getenv('REDIS_PORT') ?: 6379;

try {
    $redis = new PredisClient([
        'host' => $redisHost,
        'port' => (int) $redisPort,
    ]);
    $redis->ping();
} catch (\Exception $e) {
    http_response_code(500);
    echo "Failed to connect to Redis at {$redisHost}:{$redisPort}: " . $e->getMessage();
    exit(1);
}

// Load persisted config from Redis, or use defaults
$storedConfig = $redis->get('demo:config');
$config = $storedConfig ? json_decode($storedConfig, true) : $defaultConfig;

$limiter = new TokenBucket(
    $config['capacity'],
    (float) $config['refill_rate'],
    $config['refill_interval'],
    $redis
);

// Route the request
$method = $_SERVER['REQUEST_METHOD'];
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if ($method === 'GET' && ($path === '/' || $path === '/index.html')) {
    handleHomePage($config);
} elseif ($method === 'POST' && $path === '/test') {
    handleTestRequest($limiter, $config);
} elseif ($method === 'POST' && $path === '/config') {
    handleConfigUpdate($redis, $config);
} else {
    http_response_code(404);
    echo 'Not Found';
}

/**
 * Handle GET / — serve the HTML demo page.
 */
function handleHomePage(array $config): void
{
    header('Content-Type: text/html');
    echo getHtmlPage($config);
}

/**
 * Handle POST /test — check rate limit and return JSON.
 */
function handleTestRequest(TokenBucket $limiter, array $config): void
{
    $result = $limiter->allow('demo:request');

    $response = [
        'allowed' => $result['allowed'],
        'remaining' => $result['remaining'],
        'config' => $config,
    ];

    header('Content-Type: application/json');
    echo json_encode($response);
}

/**
 * Handle POST /config — update rate limiter settings.
 */
function handleConfigUpdate(PredisClient $redis, array $config): void
{
    $input = file_get_contents('php://input');
    parse_str($input, $params);

    try {
        $capacity = isset($params['capacity']) ? (int) $params['capacity'] : $config['capacity'];
        $refillRate = isset($params['refill_rate']) ? (int) $params['refill_rate'] : $config['refill_rate'];
        $refillInterval = isset($params['refill_interval'])
            ? (float) $params['refill_interval']
            : $config['refill_interval'];

        $config = [
            'capacity' => $capacity,
            'refill_rate' => $refillRate,
            'refill_interval' => $refillInterval,
        ];

        // Persist config in Redis so it survives between requests
        $redis->set('demo:config', json_encode($config));

        $response = ['success' => true, 'config' => $config];
    } catch (\Exception $e) {
        $response = ['success' => false, 'error' => $e->getMessage()];
    }

    header('Content-Type: application/json');
    echo json_encode($response);
}

/**
 * Generate the HTML page for the interactive demo.
 */
function getHtmlPage(array $config): string
{
    $capacity = $config['capacity'];
    $refillRate = $config['refill_rate'];
    $refillInterval = $config['refill_interval'];

    return <<<HTML
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
            <li><strong>Capacity:</strong> <span id="current-capacity">{$capacity}</span> tokens</li>
            <li><strong>Refill Rate:</strong> <span id="current-refill-rate">{$refillRate}</span> tokens</li>
            <li><strong>Refill Interval:</strong> <span id="current-refill-interval">{$refillInterval}</span> seconds</li>
        </ul>

        <form id="config-form">
            <div class="form-group">
                <label for="capacity">Capacity:</label>
                <input type="number" id="capacity" name="capacity" value="{$capacity}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_rate">Refill Rate:</label>
                <input type="number" id="refill_rate" name="refill_rate" value="{$refillRate}" min="1" required>
            </div>
            <div class="form-group">
                <label for="refill_interval">Refill Interval (s):</label>
                <input type="number" id="refill_interval" name="refill_interval" value="{$refillInterval}" step="0.1" min="0.1" required>
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
HTML;
}


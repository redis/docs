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


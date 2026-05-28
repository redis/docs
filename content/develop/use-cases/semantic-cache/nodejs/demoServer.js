#!/usr/bin/env node
// Redis semantic-cache demo server (Node.js).
//
// Run this file and visit http://localhost:8087 to drive a small
// semantic-cache demo backed by Redis Search. The UI lets you:
//
// * Type a natural-language prompt and watch the cache decide hit or
//   miss. On a hit Redis returns the cached response in tens of
//   milliseconds and the demo LLM is not called at all; on a miss the
//   demo LLM "thinks" for ~1.5 s before answering and the new prompt,
//   response, and embedding are written back to Redis for next time.
// * Adjust the cosine-distance threshold to see how close a paraphrase
//   must be for the cache to serve it.
// * Switch tenant, locale, or model version to see metadata isolation
//   in action — entries written under one tenant cannot be served to
//   another, because the TAG filter goes into the same `FT.SEARCH`
//   call as the KNN.
// * Inspect every cached entry with TTL and hit count, and drop
//   individual entries to simulate eviction.
//
// The server holds a single `LocalEmbedder`, a single
// `RedisSemanticCache`, and a single `MockLLM` for the lifetime of
// the process. The first run downloads the embedding model into the
// local Hugging Face cache; everything after is local.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { createClient } from 'redis';
import { parseArgs } from 'node:util';

import { RedisSemanticCache } from './cache.js';
import { LocalEmbedder } from './embeddings.js';
import { MockLLM } from './mockLlm.js';
import { seed } from './seedCache.js';

const HERE = dirname(fileURLToPath(import.meta.url));

class SemanticCacheDemo {
  constructor({ cache, embedder, llm, defaultTenant = 'acme', defaultLocale = 'en' }) {
    this.cache = cache;
    this.embedder = embedder;
    this.llm = llm;
    this.defaultTenant = defaultTenant;
    this.defaultLocale = defaultLocale;
  }

  // Drop everything in scope and pre-populate with FAQ entries.
  async seed() {
    await this.cache.clear();
    return await seed(this.cache, this.embedder, {
      tenant: this.defaultTenant,
      locale: this.defaultLocale,
      modelVersion: this.llm.modelVersion,
    });
  }

  // The hot path: embed, look up, optionally call the LLM, cache.
  //
  // Timings are taken with `performance.now()` around each bounded
  // step so the UI can display the embed / lookup / LLM breakdown
  // separately. The cache write on a miss is *not* included in
  // `total_ms` so the latency number reflects the user-facing wait,
  // not the background bookkeeping.
  async runQuery({ prompt, tenant, locale, modelVersion, threshold, lookupOnly }) {
    const t0 = performance.now();
    const queryVec = await this.embedder.encodeOne(prompt);
    const embedMs = performance.now() - t0;

    const t1 = performance.now();
    const result = await this.cache.lookup({
      queryVec, tenant, locale, modelVersion,
      distanceThreshold: threshold,
    });
    const lookupMs = performance.now() - t1;

    if (result.kind === 'hit') {
      return {
        outcome: 'hit',
        response: result.response,
        entry_id: result.id,
        distance: result.distance,
        ttl_seconds: result.ttlSeconds,
        hit_count: result.hitCount,
        threshold,
        embed_ms: embedMs,
        lookup_ms: lookupMs,
        llm_ms: null,
        total_ms: embedMs + lookupMs,
        tokens_avoided: estimateResponseTokens(result.prompt, result.response),
        ms_avoided: this.llm.latencyMs,
      };
    }

    // Miss path. In "lookup only" mode the demo reports the miss
    // without actually calling the LLM — useful for sweeping the
    // threshold against a fixed prompt to see where the cutoff would
    // fall without polluting the cache.
    if (lookupOnly) {
      return {
        outcome: 'miss',
        response: '(LLM not called in lookup-only mode)',
        nearest_distance: result.nearestDistance,
        threshold,
        wrote_entry_id: null,
        embed_ms: embedMs,
        lookup_ms: lookupMs,
        llm_ms: null,
        total_ms: embedMs + lookupMs,
      };
    }

    const t2 = performance.now();
    const llmResponse = await this.llm.complete(prompt);
    const llmMs = performance.now() - t2;

    // Write the new entry back. The embedding is the same vector we
    // already used for the lookup — no need to re-encode.
    const entryId = await this.cache.put({
      prompt,
      response: llmResponse.response,
      embedding: queryVec,
      tenant, locale, modelVersion,
    });

    return {
      outcome: 'miss',
      response: llmResponse.response,
      nearest_distance: result.nearestDistance,
      threshold,
      wrote_entry_id: entryId,
      embed_ms: embedMs,
      lookup_ms: lookupMs,
      llm_ms: llmMs,
      total_ms: embedMs + lookupMs + llmMs,
    };
  }
}

function estimateResponseTokens(prompt, response) {
  return Math.max(1, Math.floor((prompt.length + response.length) / 4));
}

// ---- HTTP plumbing --------------------------------------------------

function sendJson(res, payload, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(payload));
}

function sendHtml(res, html, status = 200) {
  res.writeHead(status, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html);
}

// Cap POST bodies so a runaway client (or, more realistically, a
// curl --data-binary @big-file by mistake) can't accumulate
// unbounded memory before the handler runs. The demo's largest
// legitimate body is a few hundred bytes of form-encoded query
// fields; 1 MiB is a generous ceiling.
const MAX_BODY_BYTES = 1 * 1024 * 1024;

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', c => {
      total += c.length;
      if (total > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error(`request body exceeds ${MAX_BODY_BYTES} bytes`));
        return;
      }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
    req.on('error', reject);
  });
}

function parseForm(body) {
  const params = new URLSearchParams(body);
  const result = {};
  for (const [k, v] of params) result[k] = v;
  return result;
}

function clampThreshold(raw) {
  const parsed = parseFloat(raw);
  // `parseFloat` happily handles "nan" → NaN, "inf" → Infinity. Either
  // would silently turn the lookup into a permanent hit (NaN
  // comparisons are always false, so `distance > nan` cannot reject)
  // or a permanent miss. Clamp to the meaningful cosine-distance
  // range so a malformed POST can't override the threshold semantics.
  if (!Number.isFinite(parsed)) return 0.5;
  return Math.max(0.0, Math.min(2.0, parsed));
}

function buildState(cache, embedder, llm, stackLabel) {
  // Returns the same shape the Python demo serves so the shared HTML
  // works without modification. ``default_threshold`` is what the
  // ``--threshold`` flag actually configures; the UI slider
  // initialises to this on first load so the flag visibly changes
  // the demo's behaviour. ``stack_label`` lets the same HTML render
  // a per-language badge (redis-py, node-redis, etc.) without
  // forking the file per language.
  return (async () => {
    const info = await cache.indexInfo();
    return {
      index: {
        ...info,
        index_name: cache.indexName,
        model: embedder.modelName,
        mock_llm_latency_ms: llm.latencyMs,
        default_threshold: cache.distanceThreshold,
        stack_label: stackLabel,
      },
      entries: await cache.listEntries({ limit: 200 }),
    };
  })();
}

function makeHandler({ cache, embedder, llm, demo, htmlPage, stackLabel }) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET') {
        if (url.pathname === '/' || url.pathname === '/index.html') {
          return sendHtml(res, htmlPage);
        }
        if (url.pathname === '/state') {
          return sendJson(res, await buildState(cache, embedder, llm, stackLabel));
        }
        return sendJson(res, { error: 'not found' }, 404);
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const params = parseForm(body);

        if (url.pathname === '/query') {
          const prompt = (params.prompt || '').trim();
          if (!prompt) return sendJson(res, { error: 'prompt is required' }, 400);
          const payload = await demo.runQuery({
            prompt,
            tenant: params.tenant || 'acme',
            locale: params.locale || 'en',
            modelVersion: params.model_version || llm.modelVersion,
            threshold: clampThreshold(params.threshold ?? '0.5'),
            lookupOnly: !!params.lookup_only,
          });
          return sendJson(res, payload);
        }
        if (url.pathname === '/reset') {
          await demo.seed();
          return sendJson(res, { ok: true });
        }
        if (url.pathname === '/drop') {
          const entryId = (params.entry_id || '').trim();
          if (!entryId) return sendJson(res, { error: 'entry_id is required' }, 400);
          const deleted = await cache.deleteEntry(entryId);
          return sendJson(res, { deleted, entry_id: entryId });
        }
        return sendJson(res, { error: 'not found' }, 404);
      }
      return sendJson(res, { error: 'method not allowed' }, 405);
    } catch (exc) {
      // Without this wrapper, an exception escapes to the default
      // Node error handler and the client's `await res.json()`
      // explodes with an opaque parse error instead of surfacing
      // what actually went wrong.
      process.stderr.write(`[demo] handler error: ${exc?.stack || exc}\n`);
      try {
        sendJson(res, { error: String(exc?.message || exc), type: exc?.name || 'Error' }, 500);
      } catch {
        // Headers may already be partially flushed; nothing useful
        // left to do beyond letting the connection drop.
      }
    }
  };
}

// ---- Main -----------------------------------------------------------

function parseFlags() {
  const { values } = parseArgs({
    options: {
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '8087' },
      'redis-host': { type: 'string', default: 'localhost' },
      'redis-port': { type: 'string', default: '6379' },
      'index-name': { type: 'string', default: 'semcache:idx' },
      'key-prefix': { type: 'string', default: 'cache:' },
      'ttl-seconds': { type: 'string', default: '3600' },
      threshold: { type: 'string', default: '0.5' },
      'llm-latency-ms': { type: 'string', default: '1500' },
      'no-reset': { type: 'boolean', default: false },
    },
  });
  return values;
}

async function main() {
  const args = parseFlags();
  const port = Number(args.port);
  const redisHost = args['redis-host'];
  const redisPort = Number(args['redis-port']);
  const indexName = args['index-name'];
  const keyPrefix = args['key-prefix'];
  const ttlSeconds = Number(args['ttl-seconds']);
  const threshold = Number(args.threshold);
  const llmLatencyMs = Number(args['llm-latency-ms']);
  const resetOnStart = !args['no-reset'];

  const client = createClient({ socket: { host: redisHost, port: redisPort } });
  client.on('error', err => console.error('[redis]', err));
  try {
    await client.connect();
    await client.ping();
  } catch (exc) {
    console.error(`Error: cannot reach Redis at ${redisHost}:${redisPort}`);
    console.error(`  (${exc.message || exc})`);
    process.exit(1);
  }

  const cache = new RedisSemanticCache({
    client,
    indexName,
    keyPrefix,
    distanceThreshold: threshold,
    defaultTtlSeconds: ttlSeconds,
  });
  await cache.createIndex();

  console.log('Loading embedding model (first run downloads the ONNX weights)...');
  const embedder = await LocalEmbedder.create();
  const llm = new MockLLM({ latencyMs: llmLatencyMs });

  const demo = new SemanticCacheDemo({ cache, embedder, llm });
  if (resetOnStart) {
    console.log(
      `Dropping any existing cache under '${keyPrefix}*' and `
      + 're-seeding from the FAQ list (pass --no-reset to keep).',
    );
    const seeded = await demo.seed();
    console.log(`Seeded ${seeded} entries.`);
  }

  // Load the HTML once and replace the template tokens with the
  // configured index name and key prefix so the docs panel shows the
  // actual values in use rather than the default copies.
  const rawHtml = await readFile(join(HERE, 'index.html'), 'utf-8');
  const htmlPage = rawHtml
    .replaceAll('__INDEX_NAME__', indexName)
    .replaceAll('__KEY_PREFIX__', keyPrefix);

  const stackLabel = 'node-redis + @xenova/transformers + Node.js standard library HTTP server';
  const server = createServer(makeHandler({ cache, embedder, llm, demo, htmlPage, stackLabel }));
  server.listen(port, args.host, () => {
    console.log(`Redis semantic cache demo listening on http://${args.host}:${port}`);
    console.log(`Using Redis at ${redisHost}:${redisPort} with index '${indexName}'`);
  });

  // Clean shutdown so the Redis client closes its socket.
  const shutdown = async (signal) => {
    console.log(`\nReceived ${signal}, shutting down...`);
    server.close();
    try { await client.disconnect(); } catch {}
    process.exit(0);
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

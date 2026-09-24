#!/usr/bin/env node
// Redis agent-memory demo server (Node.js).
//
// Run this file and visit http://localhost:8089 to drive a small
// agent-memory demo backed by Redis Hashes, JSON, Search, and
// Streams. The UI lets you:
//
// * Type a turn as the user (or paste a goal). The server appends
//   the turn to the per-thread working-memory hash, embeds the
//   turn, recalls the top-k semantically nearest long-term memories,
//   optionally writes the turn back as a new memory with write-time
//   deduplication, and appends an event to the per-thread stream.
// * Watch the three memory tiers update in place: working memory in
//   one Hash, long-term memories as JSON documents under one index,
//   and the event log in one Stream.
// * Switch user, namespace, kind, and recall threshold to see how
//   scoping changes which memories the agent sees.
// * Inspect every long-term memory and drop individual memories to
//   simulate eviction.
//
// The server holds a single `LocalEmbedder`, one `AgentSession`,
// one `LongTermMemory`, and one `AgentEventLog` for the lifetime of
// the process. The first run downloads the embedding model into the
// local Hugging Face cache; everything after is local.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { createClient } from 'redis';

import { LocalEmbedder } from './embeddings.js';
import { AgentSession } from './sessionStore.js';
import { AgentEventLog } from './eventLog.js';
import { LongTermMemory } from './longTermMemory.js';
import { seed } from './seedMemory.js';

const HERE = dirname(fileURLToPath(import.meta.url));

// Demo state: working memory, long-term memory, event log.
class AgentMemoryDemo {
  constructor({
    sessionStore,
    memory,
    eventLog,
    embedder,
    defaultUser = 'default',
    defaultNamespace = 'default',
  }) {
    this.sessionStore = sessionStore;
    this.memory = memory;
    this.eventLog = eventLog;
    this.embedder = embedder;
    this.defaultUser = defaultUser;
    this.defaultNamespace = defaultNamespace;
    this.currentThreadId = sessionStore.newThreadId();
  }

  // Drop everything in scope and pre-populate with seed memories.
  async seed(user, namespace) {
    await this.memory.clear();
    await this.sessionStore.delete(this.currentThreadId);
    await this.eventLog.clear(this.currentThreadId);
    const written = await seed(this.memory, this.embedder, {
      user, namespace, sourceThread: 'seed',
    });
    this.currentThreadId = this.sessionStore.newThreadId();
    return written;
  }

  // Start a fresh thread. Long-term memory is unaffected.
  async newThread(user, namespace) {
    await this.eventLog.clear(this.currentThreadId);
    this.currentThreadId = this.sessionStore.newThreadId();
    await this.sessionStore.start(this.currentThreadId, {
      user, agent: 'demo-agent', goal: '',
    });
    await this.eventLog.record(
      this.currentThreadId,
      'thread_started',
      `user=${user} namespace=${namespace}`,
    );
    return this.currentThreadId;
  }

  // One pass through the agent loop: append, recall, remember, log.
  //
  // The order matters. We embed once and reuse the vector for both
  // the recall and (if asked) the remember step — no point encoding
  // the same text twice. Recall runs *before* the remember write so
  // the agent doesn't see its own just-written turn as a recalled
  // memory.
  async handleTurn({
    text, user, namespace, kind, role, threshold, action,
  }) {
    const threadId = this.currentThreadId;

    const t0 = performance.now();
    const vec = await this.embedder.encodeOne(text);
    const embedMs = performance.now() - t0;

    // `setGoal` only touches the goal field so existing turns aren't
    // wiped; `appendTurn` carries the request `user` through to the
    // auto-create path so a first turn for a new thread doesn't land
    // under the default user.
    let sessionAction;
    if (action === 'goal') {
      await this.sessionStore.setGoal(threadId, text, {
        user, agent: 'demo-agent',
      });
      sessionAction = 'goal_set';
    } else {
      await this.sessionStore.appendTurn(threadId, {
        role, content: text, user, agent: 'demo-agent',
      });
      sessionAction = `turn_appended:${role}`;
    }

    const t1 = performance.now();
    const recalled = await this.memory.recall({
      queryEmbedding: vec,
      user,
      namespace,
      k: 5,
      distanceThreshold: threshold,
    });
    const recallMs = performance.now() - t1;

    const writeSkipped = (kind === 'skip' || action === 'goal');
    let writeResult = null;
    let writeMs = 0;
    if (!writeSkipped) {
      const t2 = performance.now();
      writeResult = await this.memory.remember({
        text,
        embedding: vec,
        user,
        namespace,
        kind,
        sourceThread: threadId,
      });
      writeMs = performance.now() - t2;
    }

    if (writeResult) {
      const eventDetail = writeResult.deduped
        ? `deduped onto ${writeResult.id}`
        : `wrote ${writeResult.id} as ${kind}`;
      await this.eventLog.record(threadId, sessionAction, eventDetail);
    } else {
      await this.eventLog.record(threadId, sessionAction, '');
    }

    return {
      thread_id: threadId,
      write_skipped: writeSkipped,
      memory_id: writeResult?.id ?? null,
      deduped: writeResult?.deduped ?? false,
      existing_distance: writeResult?.existingDistance ?? null,
      kind: writeSkipped ? null : kind,
      recalled,
      embed_ms: embedMs,
      recall_ms: recallMs,
      write_ms: writeMs,
    };
  }
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

// Cap POST bodies so a runaway client (or a curl --data-binary
// @big-file by mistake) can't accumulate unbounded memory before the
// handler runs. The demo's largest legitimate body is a few hundred
// bytes of form-encoded query fields; 1 MiB is a generous ceiling.
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

function clampThreshold(raw, fallback) {
  const parsed = parseFloat(raw);
  // `parseFloat` happily handles "nan" → NaN, "inf" → Infinity. Either
  // would silently turn the lookup into a permanent match or a
  // permanent miss. Clamp to the meaningful cosine-distance range so
  // a malformed POST can't override the threshold semantics.
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0.0, Math.min(2.0, parsed));
}

async function buildState({
  demo, memory, sessionStore, eventLog, embedder, user, namespace, stackLabel,
}) {
  const info = await memory.indexInfo();
  const threadId = demo.currentThreadId;
  const [session, memories, events] = await Promise.all([
    sessionStore.load(threadId),
    memory.listMemories({ user, namespace, limit: 200 }),
    eventLog.recent(threadId, 20),
  ]);
  return {
    index: {
      ...info,
      index_name: memory.indexName,
      model: embedder.modelName,
      session_ttl_seconds: sessionStore.defaultTtlSeconds,
      dedup_threshold: memory.dedupThreshold,
      default_recall_threshold: memory.recallThreshold,
      stack_label: stackLabel,
    },
    thread_id: threadId,
    session,
    memories,
    events,
    // `recalled` is populated by /turn; on plain /state reads the UI
    // keeps showing the last turn's result, which is the useful
    // behaviour for an "agent" panel.
    recalled: [],
  };
}

function makeHandler({
  demo, memory, sessionStore, eventLog, embedder, htmlPage, stackLabel,
}) {
  return async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      if (req.method === 'GET') {
        if (url.pathname === '/' || url.pathname === '/index.html') {
          return sendHtml(res, htmlPage);
        }
        if (url.pathname === '/state') {
          const user = url.searchParams.get('user') || demo.defaultUser;
          const namespace = url.searchParams.get('namespace')
            || demo.defaultNamespace;
          return sendJson(res, await buildState({
            demo, memory, sessionStore, eventLog, embedder,
            user, namespace, stackLabel,
          }));
        }
        return sendJson(res, { error: 'not found' }, 404);
      }
      if (req.method === 'POST') {
        const body = await readBody(req);
        const params = parseForm(body);

        if (url.pathname === '/turn') {
          const text = (params.text || '').trim();
          if (!text) return sendJson(res, { error: 'text is required' }, 400);
          const threshold = clampThreshold(
            params.threshold ?? String(memory.recallThreshold),
            memory.recallThreshold,
          );
          const payload = await demo.handleTurn({
            text,
            user: params.user || 'default',
            namespace: params.namespace || 'default',
            kind: params.kind || 'episodic',
            role: params.role || 'user',
            threshold,
            action: params.action || 'turn',
          });
          return sendJson(res, payload);
        }
        if (url.pathname === '/new_thread') {
          const threadId = await demo.newThread(
            params.user || 'default',
            params.namespace || 'default',
          );
          return sendJson(res, { thread_id: threadId });
        }
        if (url.pathname === '/reset') {
          const seeded = await demo.seed(
            params.user || 'default',
            params.namespace || 'default',
          );
          return sendJson(res, { seeded });
        }
        if (url.pathname === '/drop_memory') {
          const memoryId = (params.memory_id || '').trim();
          if (!memoryId) {
            return sendJson(res, { error: 'memory_id is required' }, 400);
          }
          const deleted = await memory.deleteMemory(memoryId);
          return sendJson(res, { deleted, memory_id: memoryId });
        }
        return sendJson(res, { error: 'not found' }, 404);
      }
      return sendJson(res, { error: 'method not allowed' }, 405);
    } catch (exc) {
      // Without this wrapper, an exception escapes to the default
      // Node error handler and the client's `await res.json()` would
      // explode with an opaque parse error instead of surfacing what
      // actually went wrong.
      process.stderr.write(
        `[demo] handler error: ${exc?.stack || exc}\n`,
      );
      try {
        sendJson(res, {
          error: String(exc?.message || exc),
          type: exc?.name || 'Error',
        }, 500);
      } catch {
        // Headers may already be partially flushed; nothing left to do.
      }
    }
  };
}

// ---- Main -----------------------------------------------------------

function parseFlags() {
  const { values } = parseArgs({
    options: {
      host: { type: 'string', default: '127.0.0.1' },
      port: { type: 'string', default: '8089' },
      'redis-host': { type: 'string', default: 'localhost' },
      'redis-port': { type: 'string', default: '6379' },
      'mem-index-name': { type: 'string', default: 'agentmem:idx' },
      'mem-key-prefix': { type: 'string', default: 'agent:mem:' },
      'session-key-prefix': { type: 'string', default: 'agent:session:' },
      'event-key-prefix': { type: 'string', default: 'agent:events:' },
      'session-ttl-seconds': { type: 'string', default: '3600' },
      'dedup-threshold': { type: 'string', default: '0.20' },
      'recall-threshold': { type: 'string', default: '0.55' },
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
  const memIndexName = args['mem-index-name'];
  const memKeyPrefix = args['mem-key-prefix'];
  const sessionKeyPrefix = args['session-key-prefix'];
  const eventKeyPrefix = args['event-key-prefix'];
  const sessionTtlSeconds = Number(args['session-ttl-seconds']);
  const dedupThreshold = Number(args['dedup-threshold']);
  const recallThreshold = Number(args['recall-threshold']);
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

  const sessionStore = new AgentSession({
    client,
    keyPrefix: sessionKeyPrefix,
    defaultTtlSeconds: sessionTtlSeconds,
  });
  const memory = new LongTermMemory({
    client,
    indexName: memIndexName,
    keyPrefix: memKeyPrefix,
    dedupThreshold,
    recallThreshold,
  });
  await memory.createIndex();
  const eventLog = new AgentEventLog({
    client,
    keyPrefix: eventKeyPrefix,
  });

  console.log(
    'Loading embedding model (first run downloads the ONNX weights)...',
  );
  const embedder = await LocalEmbedder.create();

  const demo = new AgentMemoryDemo({
    sessionStore, memory, eventLog, embedder,
  });

  if (resetOnStart) {
    console.log(
      `Dropping any existing memories under '${memKeyPrefix}*' and `
      + 're-seeding from the sample memory list (pass --no-reset to keep).',
    );
    const seeded = await demo.seed('default', 'default');
    console.log(`Seeded ${seeded} memories.`);
  }

  // Load the HTML once and replace the template tokens with the
  // configured key prefixes and index name so the docs panel shows
  // the actual values in use.
  const rawHtml = await readFile(join(HERE, 'index.html'), 'utf-8');
  const htmlPage = rawHtml
    .replaceAll('__SESSION_PREFIX__', sessionKeyPrefix)
    .replaceAll('__MEM_PREFIX__', memKeyPrefix)
    .replaceAll('__MEM_INDEX__', memIndexName)
    .replaceAll('__EVENT_PREFIX__', eventKeyPrefix);

  const stackLabel =
    'node-redis + @xenova/transformers + Node.js standard library HTTP server';
  const server = createServer(makeHandler({
    demo, memory, sessionStore, eventLog, embedder, htmlPage, stackLabel,
  }));
  server.listen(port, args.host, () => {
    console.log(
      `Redis agent memory demo listening on http://${args.host}:${port}`,
    );
    console.log(
      `Using Redis at ${redisHost}:${redisPort}`
      + ` with memory index '${memIndexName}'`,
    );
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

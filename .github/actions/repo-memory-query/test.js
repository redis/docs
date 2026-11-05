/**
 * test.js
 *
 * Offline test of query.js with the mock embedding provider (no OpenAI key, no GitHub calls).
 *
 *   REPO_MEMORY_TEST_REDIS_URL=redis://localhost:6395 node test.js
 *
 * Needs a Redis with the Search module (Redis 8+ has it built in). It refuses to run unless the
 * database is EMPTY and deletes everything it creates, so it cannot touch real memory data.
 *
 * The seeded index and hashes copy the layout written by redis-learn/redis-repo-memory
 * (scripts/retrieve_memory.js). If that layout changes, update the seed here and in query.js.
 */
'use strict';

const assert = require('assert');
const { execFileSync } = require('child_process');
const path = require('path');
const { createClient, SchemaFieldTypes, VectorAlgorithms } = require('redis');

const url = process.env.REPO_MEMORY_TEST_REDIS_URL;
if (!url) {
  console.error('Set REPO_MEMORY_TEST_REDIS_URL to an EMPTY Redis (with Search) to run this test.');
  process.exit(2);
}

const REPO = 'test/repo';
const ITEMS = [
  ['1', 'Move the job-queue Jedis use case from JedisPool to RedisClient and close every pipeline'],
  ['2', 'Bump Lettuce pins in the harness poms to 7.9.0 and update install snippets'],
  ['3', 'Raise the redis-rs response timeout for blocking commands in the Rust demos'],
  ['4', 'Rewrite the sorted set tutorial to use ZRANGE with BYSCORE and REV'],
];

function query(env) {
  const out = execFileSync('node', [path.join(__dirname, 'query.js')], {
    env: {
      PATH: process.env.PATH,
      REDIS_URL: url,
      REPO_MEMORY_EMBED_PROVIDER: 'mock',
      GITHUB_REPOSITORY: REPO,
      ...env,
    },
    encoding: 'utf8',
  });
  const line = out.split('\n').find(l => l.startsWith('REPO_MEMORY_QUERY_RESULT_JSON '));
  assert.ok(line, `result line printed; output was: ${out}`);
  return JSON.parse(line.slice('REPO_MEMORY_QUERY_RESULT_JSON '.length));
}

async function main() {
  const { mockEmbedding } = require('./query.js');
  const client = createClient({ url });
  await client.connect();
  try {
    assert.strictEqual(await client.dbSize(), 0, 'refusing to run: the test Redis is not empty');

    // No index yet: nothing to find, and the index is not created.
    assert.deepStrictEqual(query({ QUERY_TEXT: 'anything' }).results, [], 'missing index returns no results');
    assert.ok(!(await client.sendCommand(['FT._LIST'])).includes('repo_memory_idx'), 'must not create the index');
    assert.strictEqual(await client.dbSize(), 0, 'missing-index query wrote nothing');

    await client.ft.create('repo_memory_idx', {
      type: { type: SchemaFieldTypes.TAG },
      repo: { type: SchemaFieldTypes.TAG },
      title: { type: SchemaFieldTypes.TEXT, WEIGHT: 2 },
      body_summary: { type: SchemaFieldTypes.TEXT },
      source_url: { type: SchemaFieldTypes.TEXT, NOSTEM: true },
      created_at: { type: SchemaFieldTypes.TEXT },
      tags: { type: SchemaFieldTypes.TAG, SEPARATOR: ',' },
      embedding: {
        type: SchemaFieldTypes.VECTOR,
        ALGORITHM: VectorAlgorithms.HNSW,
        TYPE: 'FLOAT32',
        DIM: 1536,
        DISTANCE_METRIC: 'COSINE',
      },
    }, { ON: 'HASH', PREFIX: 'memory:' });
    for (const [n, title] of ITEMS) {
      await client.hSet(`memory:test_repo_pr_${n}`, {
        id: `test_repo_pr_${n}`, type: 'pr_summary', repo: REPO, title,
        body_summary: title, source_url: `https://github.com/${REPO}/pull/${n}`,
        created_at: '2026-01-01T00:00:00Z', tags: '',
        embedding: Buffer.from(new Float32Array(mockEmbedding(`${title}\n${title}\n`)).buffer),
      });
    }
    // An item from another repository must never be returned.
    await client.hSet('memory:other_repo_pr_9', {
      id: 'other_repo_pr_9', type: 'pr_summary', repo: 'other/repo', title: ITEMS[0][1],
      body_summary: ITEMS[0][1], source_url: 'https://github.com/other/repo/pull/9',
      created_at: '2026-01-01T00:00:00Z', tags: '',
      embedding: Buffer.from(new Float32Array(mockEmbedding(ITEMS[0][1])).buffer),
    });

    const before = await client.dbSize();
    const q = 'Move the job-queue Jedis use case to RedisClient and close pipelines';

    // Closest item first, other repositories excluded, full text absent without a token.
    const r = query({ QUERY_TEXT: q, QUERY_FILES: 'content/develop/use-cases/job-queue/RedisJobQueue.java' });
    assert.ok(r.results.length >= 1, 'returns at least one result');
    assert.ok(/JedisPool to RedisClient/.test(r.results[0].title), `closest first, got: ${r.results[0].title}`);
    assert.ok(r.results.every(x => x.sourceUrl.includes(`/${REPO}/`)), 'only items from this repository');
    assert.strictEqual(r.results[0].fullText, undefined, 'no fullText without a token');
    assert.deepStrictEqual(r.files, ['content/develop/use-cases/job-queue/RedisJobQueue.java']);

    // Limit and distance are honored.
    assert.strictEqual(query({ QUERY_TEXT: q, QUERY_MAX_DISTANCE: '0.0001' }).results.length, 0, 'tight distance');
    const wide = query({ QUERY_TEXT: q, QUERY_MAX_DISTANCE: '1.5' }).results;
    assert.ok(wide.length >= 3, 'wide distance returns several results');
    assert.deepStrictEqual(wide.map(x => x.score), wide.map(x => x.score).sort((x, y) => x - y), 'nearest first');
    assert.strictEqual(query({ QUERY_TEXT: q, QUERY_MAX_DISTANCE: '1.5', QUERY_LIMIT: '2' }).results.length, 2, 'limit');

    // Read-only: nothing added, changed or indexed.
    assert.strictEqual(await client.dbSize(), before, 'query wrote nothing');

    // Missing inputs fail loudly.
    assert.throws(() => query({ QUERY_TEXT: '   ' }), /QUERY_TEXT is empty/, 'empty query is an error');
    assert.throws(() => query({ QUERY_TEXT: q, REDIS_URL: '' }), /REDIS_URL is not set/, 'missing url is an error');

    console.log('all repo-memory-query tests passed');
  } finally {
    for (const k of await client.keys('memory:*')) await client.del(k);
    await client.ft.dropIndex('repo_memory_idx').catch(() => {});
    await client.quit();
  }
}

main().catch(err => {
  console.error('FAILED:', err.message);
  process.exit(1);
});

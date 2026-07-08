'use strict';

/**
 * One-time seeding script: fetches PRs, issues, and issue comments from a GitHub
 * repo for the past N days, batches embeddings, and stores them in the Redis index.
 *
 * Usage:
 *   GITHUB_TOKEN=...  REDIS_URL=...  OPENAI_API_KEY=...  \
 *   SEED_REPO=redis/docs  DAYS_BACK=365  node scripts/memory/seed.js
 *
 * Optional env vars:
 *   SEED_REPO        — repo to fetch from (default: redis/docs)
 *   DAYS_BACK        — how many days of history to seed (default: 365)
 *   EMBEDDING_MODEL  — embedding model (default: text-embedding-3-small)
 *   DRY_RUN=true     — fetch and embed but do not write to Redis
 */

const { createClient, SchemaFieldTypes, VectorAlgorithms } = require('redis');
const OpenAI = require('openai');

const SEED_REPO   = process.env.SEED_REPO || 'redis/docs';
const DAYS_BACK   = parseInt(process.env.DAYS_BACK) || 365;
const EMBED_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const VECTOR_DIM  = 1536;
const BATCH_SIZE  = 100;
const INDEX_NAME  = 'repo_memory_idx';
const KEY_PREFIX  = 'memory:';
const DRY_RUN     = process.env.DRY_RUN === 'true';
const MIN_COMMENT_LENGTH = 80; // skip very short comments

function ghHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

async function ghFetch(url, token) {
  const res = await fetch(url, { headers: ghHeaders(token) });
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function fetchPRs(repo, cutoff, token) {
  const [owner, name] = repo.split('/');
  const safeRepo = repo.replace('/', '_');
  const items = [];
  let page = 1;

  while (true) {
    const batch = await ghFetch(
      `https://api.github.com/repos/${owner}/${name}/pulls?state=all&sort=created&direction=desc&per_page=100&page=${page}`,
      token
    );
    if (!batch.length) break;

    let done = false;
    for (const pr of batch) {
      if (new Date(pr.created_at) < cutoff) { done = true; break; }
      items.push({
        id:          `${safeRepo}_pr_${pr.number}`,
        type:        'pr_summary',
        repo,
        title:       pr.title,
        bodySummary: (pr.body || '').slice(0, 500),
        sourceUrl:   pr.html_url,
        createdAt:   pr.created_at,
        tags:        (pr.labels || []).map(l => l.name).join(','),
        searchText:  `${pr.title}\n${(pr.body || '').slice(0, 1000)}`,
      });
    }
    if (done || batch.length < 100) break;
    page++;
  }

  console.log(`  PRs: ${items.length}`);
  return items;
}

async function fetchIssues(repo, cutoff, token) {
  const [owner, name] = repo.split('/');
  const safeRepo = repo.replace('/', '_');
  const items = [];
  let page = 1;

  while (true) {
    const batch = await ghFetch(
      `https://api.github.com/repos/${owner}/${name}/issues?state=all&sort=created&direction=desc&per_page=100&page=${page}`,
      token
    );
    if (!batch.length) break;

    let done = false;
    for (const issue of batch) {
      if (new Date(issue.created_at) < cutoff) { done = true; break; }
      if (issue.pull_request) continue; // skip PRs returned by the issues endpoint
      items.push({
        id:          `${safeRepo}_issue_${issue.number}`,
        type:        'issue_summary',
        repo,
        title:       issue.title,
        bodySummary: (issue.body || '').slice(0, 500),
        sourceUrl:   issue.html_url,
        createdAt:   issue.created_at,
        tags:        (issue.labels || []).map(l => l.name).join(','),
        searchText:  `${issue.title}\n${(issue.body || '').slice(0, 1000)}`,
      });
    }
    if (done || batch.length < 100) break;
    page++;
  }

  console.log(`  Issues: ${items.length}`);
  return items;
}

async function fetchIssueComments(repo, cutoff, token) {
  const [owner, name] = repo.split('/');
  const safeRepo = repo.replace('/', '_');
  const items = [];
  let page = 1;

  while (true) {
    const batch = await ghFetch(
      `https://api.github.com/repos/${owner}/${name}/issues/comments?sort=created&direction=desc&per_page=100&page=${page}&since=${cutoff.toISOString()}`,
      token
    );
    if (!batch.length) break;

    for (const comment of batch) {
      if ((comment.body || '').length < MIN_COMMENT_LENGTH) continue;
      items.push({
        id:          `${safeRepo}_comment_${comment.id}`,
        type:        'issue_comment',
        repo,
        title:       comment.body.split('\n')[0].slice(0, 120),
        bodySummary: comment.body.slice(0, 500),
        sourceUrl:   comment.html_url,
        createdAt:   comment.created_at,
        tags:        '',
        searchText:  comment.body.slice(0, 1000),
      });
    }
    if (batch.length < 100) break;
    page++;
  }

  console.log(`  Comments (>=${MIN_COMMENT_LENGTH} chars): ${items.length}`);
  return items;
}

async function embedBatch(texts, openai) {
  const res = await openai.embeddings.create({ model: EMBED_MODEL, input: texts });
  return res.data.map(d => d.embedding);
}

async function ensureIndex(client) {
  const exists = await client.ft.info(INDEX_NAME).then(() => true).catch(() => false);
  if (exists) return;
  await client.ft.create(
    INDEX_NAME,
    {
      type:         { type: SchemaFieldTypes.TAG },
      repo:         { type: SchemaFieldTypes.TAG },
      title:        { type: SchemaFieldTypes.TEXT, WEIGHT: 2 },
      body_summary: { type: SchemaFieldTypes.TEXT },
      source_url:   { type: SchemaFieldTypes.TEXT, NOSTEM: true },
      created_at:   { type: SchemaFieldTypes.TEXT },
      tags:         { type: SchemaFieldTypes.TAG, SEPARATOR: ',' },
      embedding: {
        type:            SchemaFieldTypes.VECTOR,
        ALGORITHM:       VectorAlgorithms.HNSW,
        TYPE:            'FLOAT32',
        DIM:             VECTOR_DIM,
        DISTANCE_METRIC: 'COSINE',
      },
    },
    { ON: 'HASH', PREFIX: KEY_PREFIX }
  );
  console.log(`Created index: ${INDEX_NAME}`);
}

async function seedItems(items, openai, client) {
  if (!items.length) return 0;

  const embeddings = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const slice = items.slice(i, i + BATCH_SIZE);
    const vecs  = await embedBatch(slice.map(p => p.searchText), openai);
    embeddings.push(...vecs);
    process.stdout.write(`\r  embedded ${Math.min(i + BATCH_SIZE, items.length)}/${items.length}`);
  }
  process.stdout.write('\n');

  if (DRY_RUN) return items.length;

  let written = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const buf  = Buffer.from(new Float32Array(embeddings[i]).buffer);
    await client.hSet(`${KEY_PREFIX}${item.id}`, {
      id:           item.id,
      type:         item.type,
      repo:         item.repo,
      title:        item.title,
      body_summary: item.bodySummary,
      source_url:   item.sourceUrl,
      created_at:   item.createdAt,
      tags:         item.tags,
      embedding:    buf,
    });
    written++;
    if (written % 200 === 0) process.stdout.write(`\r  wrote ${written}/${items.length}`);
  }
  if (items.length >= 200) process.stdout.write('\n');
  return written;
}

async function main() {
  const token     = process.env.GITHUB_TOKEN;
  const redisUrl  = process.env.REDIS_URL;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!token)     { console.error('GITHUB_TOKEN is required');    process.exit(1); }
  if (!redisUrl)  { console.error('REDIS_URL is required');       process.exit(1); }
  if (!openaiKey) { console.error('OPENAI_API_KEY is required');  process.exit(1); }

  const cutoff = new Date(Date.now() - DAYS_BACK * 24 * 60 * 60 * 1000);
  console.log(`Seeding from ${SEED_REPO}, past ${DAYS_BACK} days (since ${cutoff.toISOString().slice(0, 10)})`);
  if (DRY_RUN) console.log('DRY RUN — no writes to Redis');

  console.log('\nFetching from GitHub...');
  const [prs, issues, comments] = await Promise.all([
    fetchPRs(SEED_REPO, cutoff, token),
    fetchIssues(SEED_REPO, cutoff, token),
    fetchIssueComments(SEED_REPO, cutoff, token),
  ]);

  const all = [...prs, ...issues, ...comments];
  console.log(`Total items to seed: ${all.length}`);
  if (!all.length) { console.log('Nothing to seed.'); return; }

  const openai = new OpenAI({ apiKey: openaiKey });
  const client = DRY_RUN ? null : createClient({ url: redisUrl });
  if (client) {
    client.on('error', err => console.error('Redis error:', err.message));
    await client.connect();
  }

  try {
    if (client) await ensureIndex(client);

    console.log(`\nEmbedding and writing PRs...`);
    const nPRs = await seedItems(prs, openai, client);

    console.log(`Embedding and writing issues...`);
    const nIssues = await seedItems(issues, openai, client);

    console.log(`Embedding and writing comments...`);
    const nComments = await seedItems(comments, openai, client);

    const verb = DRY_RUN ? 'Would seed' : 'Seeded';
    console.log(`\nDone. ${verb} ${nPRs} PRs, ${nIssues} issues, ${nComments} comments from ${SEED_REPO}.`);
  } finally {
    if (client) await client.quit();
  }
}

main().catch(err => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

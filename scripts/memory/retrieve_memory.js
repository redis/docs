'use strict';

const fs = require('fs');
const { createClient, SchemaFieldTypes, VectorAlgorithms } = require('redis');
const OpenAI = require('openai');

const INDEX_NAME = 'repo_memory_idx';
const KEY_PREFIX = 'memory:';
const VECTOR_DIM = 1536;
const SIMILARITY_THRESHOLD = 0.7; // cosine distance [0,2]; lower = more similar
const TOP_K = 10;
const MAX_RESULTS = 5;

async function ensureIndex(client) {
  const exists = await client.ft.info(INDEX_NAME).then(() => true).catch(() => false);
  if (exists) return;
  await client.ft.create(
    INDEX_NAME,
    {
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
        DIM: VECTOR_DIM,
        DISTANCE_METRIC: 'COSINE',
      },
    },
    { ON: 'HASH', PREFIX: KEY_PREFIX }
  );
  console.log(`created index: ${INDEX_NAME}`);
}

async function main() {
  const redisUrl = process.env.REDIS_URL;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (!redisUrl) {
    console.error('REDIS_URL secret is not set');
    process.exit(1);
  }
  if (!openaiKey) {
    console.error('OPENAI_API_KEY secret is not set');
    process.exit(1);
  }

  const context = JSON.parse(fs.readFileSync('/tmp/memory_context.json', 'utf8'));

  const client = createClient({ url: redisUrl });
  client.on('error', err => console.error('Redis error:', err.message));
  await client.connect();

  try {
    const openai = new OpenAI({ apiKey: openaiKey });

    await ensureIndex(client);

    const embeddingRes = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: context.searchText || context.title,
    });
    const embeddingBuffer = Buffer.from(
      new Float32Array(embeddingRes.data[0].embedding).buffer
    );

    const searchResult = await client.ft.search(
      INDEX_NAME,
      `*=>[KNN ${TOP_K} @embedding $BLOB AS score]`,
      {
        PARAMS: { BLOB: embeddingBuffer },
        RETURN: ['type', 'title', 'body_summary', 'source_url', 'created_at', 'score', 'repo'],
        SORTBY: { BY: 'score', DIRECTION: 'ASC' },
        DIALECT: 2,
      }
    );

    const related = searchResult.documents
      .filter(doc => {
        const score = parseFloat(doc.value.score ?? '2');
        return score < SIMILARITY_THRESHOLD && doc.value.repo === context.repo;
      })
      .slice(0, MAX_RESULTS);

    // Store the current context as a memory artifact
    const safeRepo = context.repo.replace(/\//g, '_');
    const itemId = context.prNumber
      ? `${safeRepo}_pr_${context.prNumber}`
      : `${safeRepo}_push_${context.sha?.slice(0, 8)}`;

    const sourceUrl = context.prNumber
      ? `https://github.com/${context.repo}/pull/${context.prNumber}`
      : `https://github.com/${context.repo}/commit/${context.sha}`;

    await client.hSet(`${KEY_PREFIX}${itemId}`, {
      id: itemId,
      type: context.type === 'pull_request' ? 'pr_summary' : 'push_summary',
      repo: context.repo,
      title: context.title,
      body_summary: context.body.slice(0, 500),
      source_url: sourceUrl,
      created_at: context.timestamp,
      tags: context.labels.join(','),
      embedding: embeddingBuffer,
    });

    console.log(`stored=${KEY_PREFIX}${itemId} related_count=${related.length}`);

    fs.writeFileSync(
      '/tmp/memory_results.json',
      JSON.stringify(
        {
          context,
          sourceUrl,
          related: related.map(doc => ({
            type: doc.value.type,
            title: doc.value.title,
            bodySummary: doc.value.body_summary,
            sourceUrl: doc.value.source_url,
            createdAt: doc.value.created_at,
            score: parseFloat(doc.value.score ?? '2'),
          })),
        },
        null,
        2
      )
    );
  } finally {
    await client.quit();
  }
}

main().catch(err => {
  console.error('retrieve_memory failed:', err.message);
  process.exit(1);
});

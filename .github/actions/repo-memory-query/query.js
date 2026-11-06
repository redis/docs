/**
 * query.js
 *
 * Searches a Repo Memory store (written by redis-learn/redis-repo-memory) for items related to a
 * description of planned work, and prints the matches. Read-only: it never creates the index,
 * never writes a key, and never posts to GitHub.
 *
 * It must stay compatible with how that action stores items: index `repo_memory_idx`, hashes
 * under `memory:`, a COSINE `embedding` field from text-embedding-3-small.
 *
 * Environment:
 *   REDIS_URL, OPENAI_API_KEY    Same values the memory action uses.
 *   QUERY_TEXT                   Required. The planned work.
 *   QUERY_FILES                  Optional. Files to be changed.
 *   QUERY_LIMIT, QUERY_MAX_DISTANCE
 *   GITHUB_TOKEN                 Optional. Without it results carry no full text.
 *   GITHUB_REPOSITORY            Only items from this repository are returned.
 *   REPO_MEMORY_EMBED_PROVIDER=mock   Tests only: deterministic local embedding, no API call.
 */
'use strict';

const fs = require('fs');
const { createClient } = require('redis');

const INDEX_NAME = 'repo_memory_idx';
const MODEL = 'text-embedding-3-small';
const DIM = 1536;
const DEFAULT_LIMIT = 5;
const DEFAULT_MAX_DISTANCE = 0.60;
const FULL_TEXT_MAX = 8000;

const isMock = () => process.env.REPO_MEMORY_EMBED_PROVIDER === 'mock';

function mockEmbedding(text) {
  const v = new Float32Array(DIM);
  for (const word of text.toLowerCase().match(/[a-z0-9_.]+/g) || []) {
    let h = 2166136261;
    for (let i = 0; i < word.length; i++) h = Math.imul(h ^ word.charCodeAt(i), 16777619) >>> 0;
    v[h % DIM] += 1;
  }
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1;
  return Array.from(v, x => x / norm);
}

async function embed(text, apiKey) {
  if (isMock()) return mockEmbedding(text);
  const OpenAI = require('openai');
  const res = await new OpenAI({ apiKey }).embeddings.create({ model: MODEL, input: text });
  return res.data[0].embedding;
}

async function githubGet(path, token) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (!res.ok) console.error(`GitHub API ${res.status} for ${path}`);
  return res.ok ? res.json() : null;
}

// Stored summaries are cut to 500 characters, so read the full text at the source: the squash
// commit message for a merged PR, the commit message for a push, the body otherwise. Returns {}
// when the lookup fails; the stored summary is still reported.
async function fullTextFor(item, token) {
  const m = (item.sourceUrl || '').match(/github\.com\/([^/]+\/[^/]+)\/(pull|commit|issues)\/([^/?#]+)/);
  if (!m || !token) return {};
  const [, repo, kind, id] = m;
  try {
    if (kind === 'commit') {
      const c = await githubGet(`/repos/${repo}/commits/${id}`, token);
      return c ? { fullText: c.commit.message.slice(0, FULL_TEXT_MAX), state: 'commit' } : {};
    }
    if (kind === 'pull') {
      const p = await githubGet(`/repos/${repo}/pulls/${id}`, token);
      if (!p) return {};
      if (p.merged && p.merge_commit_sha) {
        const c = await githubGet(`/repos/${repo}/commits/${p.merge_commit_sha}`, token);
        const msg = c && !/^Merge pull request/.test(c.commit.message) ? c.commit.message : (p.body || '');
        return { fullText: msg.slice(0, FULL_TEXT_MAX), state: 'merged', mergedAt: p.merged_at };
      }
      return { fullText: (p.body || '').slice(0, FULL_TEXT_MAX), state: p.state, mergedAt: null };
    }
    const i = await githubGet(`/repos/${repo}/issues/${id}`, token);
    return i ? { fullText: (i.body || '').slice(0, FULL_TEXT_MAX), state: i.state } : {};
  } catch {
    return {};
  }
}

// Escape every character that is special in a TAG filter, such as the "/" and "-" in a repo name.
const escapeTag = s => s.replace(/[^A-Za-z0-9_]/g, c => '\\' + c);

function report(query, files, results) {
  // One line that `gh run view --log` output can be grepped for and parsed.
  console.log('REPO_MEMORY_QUERY_RESULT_JSON ' + JSON.stringify({ query, files, results }));
  const lines = ['## 🧠 Redis Memory query', ''];
  if (results.length === 0) {
    lines.push('No related prior context found.');
  } else {
    for (const r of results) {
      const link = r.sourceUrl ? `[${r.title}](${r.sourceUrl})` : r.title;
      lines.push(`- ${link} (distance ${r.score.toFixed(2)}${r.state ? `, ${r.state}` : ''})`);
    }
  }
  const out = lines.join('\n') + '\n';
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, out);
  else process.stdout.write(out);
}

async function main() {
  const { REDIS_URL, OPENAI_API_KEY, GITHUB_TOKEN, GITHUB_REPOSITORY } = process.env;
  const query = (process.env.QUERY_TEXT || '').trim();
  if (!REDIS_URL) throw new Error('REDIS_URL is not set');
  if (!OPENAI_API_KEY && !isMock()) throw new Error('OPENAI_API_KEY is not set');
  if (!query) throw new Error('QUERY_TEXT is empty');
  if (!GITHUB_REPOSITORY) throw new Error('GITHUB_REPOSITORY is not set');

  const files = (process.env.QUERY_FILES || '').split(/[\s,]+/).filter(Boolean);
  const limit = Math.max(1, parseInt(process.env.QUERY_LIMIT || '', 10) || DEFAULT_LIMIT);
  const maxDistance = parseFloat(process.env.QUERY_MAX_DISTANCE || '') || DEFAULT_MAX_DISTANCE;

  // Same text shape the memory action embeds for a push: title, body, then the file list.
  const title = query.split('\n')[0].slice(0, 200);
  const searchText = [title, query, files.join(' ')].join('\n').slice(0, 4000);

  const client = createClient({ url: REDIS_URL });
  client.on('error', err => console.error('Redis error:', err.message));
  await client.connect();
  try {
    const exists = await client.ft.info(INDEX_NAME).then(() => true).catch(() => false);
    if (!exists) {
      console.log(`index ${INDEX_NAME} not found; nothing to search`);
      report(query, files, []);
      return;
    }

    const blob = Buffer.from(new Float32Array(await embed(searchText, OPENAI_API_KEY)).buffer);
    // Filter to this repository inside the search, so other repositories' items cannot use up the
    // neighbors, and set LIMIT because FT.SEARCH returns only 10 rows by default.
    const k = Math.max(10, limit * 2);
    const found = await client.ft.search(
      INDEX_NAME,
      `@repo:{${escapeTag(GITHUB_REPOSITORY)}}=>[KNN ${k} @embedding $BLOB AS score]`,
      {
        LIMIT: { from: 0, size: k },
        PARAMS: { BLOB: blob },
        RETURN: ['type', 'title', 'body_summary', 'source_url', 'created_at', 'score', 'repo'],
        SORTBY: { BY: 'score', DIRECTION: 'ASC' },
        DIALECT: 2,
      }
    );

    const related = found.documents
      .filter(d => parseFloat(d.value.score ?? '2') < maxDistance && d.value.repo === GITHUB_REPOSITORY)
      .slice(0, limit);

    const results = [];
    for (const d of related) {
      const item = {
        type: d.value.type,
        title: d.value.title,
        bodySummary: d.value.body_summary,
        sourceUrl: d.value.source_url,
        createdAt: d.value.created_at,
        score: parseFloat(d.value.score ?? '2'),
      };
      results.push({ ...item, ...(await fullTextFor(item, GITHUB_TOKEN)) });
    }
    report(query, files, results);
  } finally {
    await client.quit();
  }
}

if (require.main === module) {
  main().catch(err => {
    console.error('repo-memory-query failed:', err.message);
    process.exit(1);
  });
}

module.exports = { mockEmbedding };

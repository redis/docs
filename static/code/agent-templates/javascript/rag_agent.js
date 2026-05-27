/*
 * Redis Knowledge Assistant (RAG Agent)
 *
 * Features:
 *   - Ingest documents with automatic chunking and embedding
 *   - Redis-native hybrid retrieval: text pre-filter + KNN vector search, with a fallback vector pass
 *   - Semantic cache: skip LLM for similar queries (TTL-based expiry)
 *   - Per-session conversation memory in a Redis List
 *   - Citations: each answer references source documents with title, source URL, and chunk ID
 *
 * To run this code:
 *   Install dependencies:
 *     npm install redis openai
 *
 *   Set environment variables:
 *     LLM_API_KEY=your_api_key_here
 *     LLM_API_BASE_URL=your_base_url     (optional - default: ${CONFIG.models[formData.llmModel].baseUrl})
 *     LLM_MODEL=your_model               (optional - default: ${CONFIG.models[formData.llmModel].defaultModel})
 *     REDIS_URL=redis://host:port         (or REDIS_HOST / REDIS_PORT / REDIS_PASSWORD)
 *
 *   Note: this template uses the OpenAI SDK with a configurable base URL. It works with
 *   OpenAI directly and with any provider that exposes an OpenAI-compatible API endpoint.
 *
 *   Run:
 *     node rag_agent.js
 *
 *   Requires Redis Stack or Redis 8+ with Search module enabled.
 */

'use strict';

const { createClient, SchemaFieldTypes, VectorAlgorithms } = require('redis');
const OpenAI = require('openai');
const readline = require('readline');
const crypto = require('crypto');

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 50;
const MAX_SEARCH_RESULTS = 5;
const MAX_HISTORY_TURNS = 6;
const CACHE_TTL = 3600;
// Cosine similarity threshold for cache hits. vector_distance for cosine is in [0, 2]:
// 0 = identical, 1 = orthogonal, 2 = opposite. A hit fires when distance < (1 - threshold),
// i.e. when cosine similarity > threshold. Verify this against your node-redis version.
const CACHE_THRESHOLD = 0.92;
const VECTOR_DIM = parseInt(process.env.VECTOR_DIM) || 1536;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';

const DOC_INDEX = 'knowledge_docs';
const CACHE_INDEX = 'knowledge_cache';

// RediSearch special characters that must be backslash-escaped in query strings.
// Escaping preserves token meaning — "C\+\+" still matches "C++" in documents —
// whereas stripping would silently discard the + characters and change query intent.
// Note: this is a best-effort heuristic. It handles the common cases well but is not
// a full RediSearch query parser; phrase queries and advanced syntax may still produce
// unexpected results and will need manual adjustment.
const FT_SPECIAL_CHARS = /[,.<>{}\[\]"'`:;!@#$%^&*()\-+=~|\/\\?]/g;

// Sample Redis documentation for demonstration.
// Replace with your own documents or use loadDirectory() to load a folder of .txt / .md files.
const SAMPLE_DOCS = [
    {
        title:   'Redis Data Types',
        source:  'https://redis.io/docs/latest/develop/data-types/',
        content: 'Redis supports several core data types suited to different use cases. Strings store ' +
                 'sequences of bytes up to 512 MB and support atomic increment and decrement operations. ' +
                 'Lists are linked lists of strings with O(1) push and pop from both ends, useful for ' +
                 'queues and stacks. Sets are unordered collections of unique strings with O(1) add, ' +
                 'remove, and membership tests, plus union, intersection, and difference operations. ' +
                 'Sorted sets add a floating-point score to each member, enabling range queries by score ' +
                 'or rank in O(log N) time. Hashes store field-value pairs in a single key, ideal for ' +
                 'representing objects without serialization. Redis also supports Streams for append-only ' +
                 'logs with consumer groups, HyperLogLog for approximate cardinality estimation, Bitmaps ' +
                 'for efficient bit-level operations, and Geospatial indexes for location-based queries.'
    },
    {
        title:   'Redis Vector Search',
        source:  'https://redis.io/docs/latest/develop/ai/search-and-query/vectors/',
        content: 'Redis Vector Search lets you index and search vector embeddings stored in HASH or JSON ' +
                 'documents. Two index algorithms are available: FLAT (brute-force, exact results, best for ' +
                 'smaller datasets) and HNSW (Hierarchical Navigable Small World, approximate results, ' +
                 'much faster at scale using a multi-layer graph structure). Supported distance metrics are ' +
                 'cosine similarity, L2 Euclidean distance, and inner product. Hybrid queries combine a ' +
                 'vector KNN clause with a RediSearch filter expression in a single FT.SEARCH call, ' +
                 'pre-filtering documents by metadata before ranking by vector distance. This avoids ' +
                 'post-filtering and keeps result quality high. Vector fields are declared with DIM ' +
                 '(dimension count), TYPE (FLOAT32 or FLOAT64), and DISTANCE_METRIC parameters.'
    },
    {
        title:   'Redis Cloud',
        source:  'https://redis.io/docs/latest/operate/rc/',
        content: 'Redis Cloud is the fully managed cloud service for Redis, available on AWS, Google Cloud, ' +
                 'and Microsoft Azure. It provides automatic clustering, replication, and failover for high ' +
                 'availability and data durability without operational overhead. Deployment options include ' +
                 'Redis Stack for development, Redis Enterprise for mission-critical workloads, and active-' +
                 'active geo-distribution for multi-region deployments with conflict-free replication. ' +
                 'Built-in monitoring, automated backups, and vertical and horizontal scaling are included. ' +
                 'A free tier is available for development and testing. Supported modules include RediSearch ' +
                 'for full-text and vector search, RedisJSON for native JSON documents, RedisTimeSeries for ' +
                 'time-series data, and RedisBloom for probabilistic structures such as Bloom filters and ' +
                 'Count-Min sketches.'
    },
    {
        title:   'Redis Context Engine',
        source:  'https://redis.io/docs/latest/develop/ai/context-engine/',
        content: 'The Redis Context Engine is a suite of managed services on Redis Cloud that gives AI ' +
                 'agents the context they need. LangCache provides semantic response caching: incoming ' +
                 'queries are embedded and compared against cached query-response pairs, returning a cached ' +
                 'answer when cosine similarity exceeds a configurable threshold to reduce LLM API costs. ' +
                 'Agent Memory offers two-tier persistent memory with a session layer for recent turns and ' +
                 'a long-term layer backed by vector search, available as a REST API and Python SDK. ' +
                 'Context Retriever exposes structured business data as governed tools that agents can ' +
                 'query reliably without writing custom retrieval logic. Data Integration keeps a Redis ' +
                 'Cloud database in sync with relational databases in near real time using Change Data ' +
                 'Capture, so agents always query fresh data.'
    },
];


class KnowledgeAssistant {
    constructor(sessionId) {
        this.sessionId = sessionId || crypto.randomUUID();
        this.sessionKey = `session:${this.sessionId}:history`;
        this.client = null;
        this.llm = null;
        this.llmModel = null;
    }

    async init() {
        if (!process.env.LLM_API_KEY) {
            throw new Error('LLM_API_KEY environment variable is required');
        }

        const redisUrl = process.env.REDIS_URL ||
            `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;

        this.client = createClient({
            url: redisUrl,
            password: process.env.REDIS_PASSWORD || undefined,
            socket: {
                reconnectStrategy: (retries) =>
                    retries < 3 ? Math.min(retries * 100, 1000) : new Error('Max retries exceeded')
            }
        });
        this.client.on('error', (err) => console.error('Redis error:', err.message));
        await this.client.connect();
        console.log(`Connected to Redis. Session: ${this.sessionId}`);

        this.llm = new OpenAI({
            apiKey: process.env.LLM_API_KEY,
            baseURL: process.env.LLM_API_BASE_URL || '${CONFIG.models[formData.llmModel].baseUrl}'
        });
        this.llmModel = process.env.LLM_MODEL || '${CONFIG.models[formData.llmModel].defaultModel}';
        console.log(`LLM configured: ${this.llmModel}`);

        await this._createIndexes();
    }

    async _createIndexes() {
        const indexes = [
            {
                name: DOC_INDEX,
                prefix: 'doc:',
                schema: {
                    doc_id:    { type: SchemaFieldTypes.TAG },
                    chunk_id:  { type: SchemaFieldTypes.TAG },
                    title:     { type: SchemaFieldTypes.TEXT },
                    source:    { type: SchemaFieldTypes.TAG },
                    content:   { type: SchemaFieldTypes.TEXT },
                    embedding: {
                        type: SchemaFieldTypes.VECTOR,
                        ALGORITHM: VectorAlgorithms.FLAT,
                        TYPE: 'FLOAT32',
                        DIM: VECTOR_DIM,
                        DISTANCE_METRIC: 'COSINE'
                    }
                }
            },
            {
                name: CACHE_INDEX,
                prefix: 'ragcache:',
                schema: {
                    response:        { type: SchemaFieldTypes.TEXT },
                    citations:       { type: SchemaFieldTypes.TEXT },
                    query_embedding: {
                        type: SchemaFieldTypes.VECTOR,
                        ALGORITHM: VectorAlgorithms.FLAT,
                        TYPE: 'FLOAT32',
                        DIM: VECTOR_DIM,
                        DISTANCE_METRIC: 'COSINE'
                    }
                }
            }
        ];

        for (const { name, prefix, schema } of indexes) {
            try {
                await this.client.ft.create(name, schema, { ON: 'HASH', PREFIX: [prefix] });
            } catch (err) {
                if (!err.message.includes('Index already exists')) throw err;
            }
        }
    }

    // ── Document ingestion ────────────────────────────────────────────────────

    async loadDirectory(dirPath, extensions = ['.txt', '.md']) {
        const fs = require('fs').promises;
        const path = require('path');

        const walk = async (dir) => {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            const files = [];
            for (const entry of entries) {
                const full = path.join(dir, entry.name);
                if (entry.isDirectory()) files.push(...await walk(full));
                else if (extensions.includes(path.extname(entry.name).toLowerCase())) files.push(full);
            }
            return files;
        };

        const files = (await walk(dirPath)).sort();
        let loaded = 0;
        for (const file of files) {
            try {
                const content = (await fs.readFile(file, 'utf-8')).trim();
                if (content) {
                    await this.ingestDocument(content, path.basename(file, path.extname(file)), file);
                    loaded++;
                }
            } catch (err) {
                console.warn(`Skipping ${file}: ${err.message}`);
            }
        }
        console.log(`Loaded ${loaded} document(s) from ${dirPath}`);
        return loaded;
    }

    _chunkText(text) {
        // Character-based chunking is simple but not token-aware. For production,
        // consider a token-counting library (e.g. js-tiktoken).
        const chunks = [];
        let start = 0;
        while (start < text.length) {
            chunks.push(text.slice(start, start + CHUNK_SIZE));
            start += CHUNK_SIZE - CHUNK_OVERLAP;
        }
        return chunks;
    }

    async _embed(text) {
        const resp = await this.llm.embeddings.create({
            model: EMBEDDING_MODEL,
            input: text.slice(0, 8000)
        });
        return resp.data[0].embedding;
    }

    _toBuffer(embedding) {
        const buf = Buffer.allocUnsafe(embedding.length * 4);
        embedding.forEach((v, i) => buf.writeFloatLE(v, i * 4));
        return buf;
    }

    async ingestDocument(content, title, source = '') {
        const docId = crypto.randomUUID();
        const chunks = this._chunkText(content);
        for (let i = 0; i < chunks.length; i++) {
            const chunkId = `${docId}:${i}`;
            const embedding = await this._embed(chunks[i]);
            await this.client.hSet(`doc:${chunkId}`, {
                doc_id:    docId,
                chunk_id:  chunkId,
                title,
                source,
                content:   chunks[i],
                embedding: this._toBuffer(embedding)
            });
        }
        console.log(`Ingested '${title}': ${chunks.length} chunk(s) (doc_id: ${docId})`);
        return docId;
    }

    // ── Hybrid search ─────────────────────────────────────────────────────────
    // First pass: FT.SEARCH with a text pre-filter and an inline KNN clause —
    // "(text_terms)=>[KNN k @embedding $BLOB AS distance]" — so Redis applies
    // both filters in a single round trip. This is more Redis-native than running
    // two separate queries and fusing the results in JavaScript.
    // Second pass (fallback): if the text filter is too selective and returns nothing,
    // a pure vector search is issued so queries always return results when documents exist.

    _sanitizeFtQuery(text) {
        // Escape RediSearch special characters rather than strip them, so tokens like
        // "C++", "redis.io", and non-English text survive into the query intact.
        // We OR-join per-word terms for recall; the KNN step handles ranking.
        // This is a best-effort heuristic — see FT_SPECIAL_CHARS comment above.
        const terms = text.split(/\s+/).filter(Boolean);
        if (terms.length === 0) return '*';
        const escaped = terms.map(t => t.replace(FT_SPECIAL_CHARS, '\\$&'));
        return escaped.slice(0, 10).join(' | '); // cap at 10 terms
    }

    async _runKnnQuery(queryStr, queryEmbedding, topK) {
        const results = await this.client.ft.search(DOC_INDEX, queryStr, {
            PARAMS:  { K: topK, BLOB: this._toBuffer(queryEmbedding) },
            SORTBY:  { BY: 'distance', DIRECTION: 'ASC' },
            DIALECT: 2,
            RETURN:  ['chunk_id', 'doc_id', 'title', 'source', 'content', 'distance']
        });
        return (results?.documents ?? []).map(d => ({ id: d.id, ...d.value }));
    }

    async _hybridSearch(queryText, queryEmbedding, topK = MAX_SEARCH_RESULTS) {
        const safeText = this._sanitizeFtQuery(queryText);
        if (safeText !== '*') {
            try {
                const results = await this._runKnnQuery(
                    `(${safeText})=>[KNN $K @embedding $BLOB AS distance]`,
                    queryEmbedding, topK
                );
                if (results.length > 0) return results;
            } catch (err) {
                console.error('Hybrid search error:', err.message);
            }
        }
        // Fall back to pure vector search if the text filter returned nothing
        return this._runKnnQuery(
            `*=>[KNN $K @embedding $BLOB AS distance]`,
            queryEmbedding, topK
        );
    }

    // ── Semantic cache ────────────────────────────────────────────────────────

    async _checkCache(queryEmbedding) {
        const results = await this.client.ft.search(
            CACHE_INDEX,
            `*=>[KNN 1 @query_embedding $BLOB AS distance]`,
            {
                PARAMS:  { BLOB: this._toBuffer(queryEmbedding) },
                SORTBY:  { BY: 'distance', DIRECTION: 'ASC' },
                DIALECT: 2,
                RETURN:  ['response', 'citations', 'distance']
            }
        );
        const top = results?.documents?.[0];
        if (!top) return null;
        // vector_distance for cosine: 0=identical, 1=orthogonal. Hit when similarity > CACHE_THRESHOLD.
        const dist = parseFloat(top.value.distance ?? '1');
        if (dist < (1 - CACHE_THRESHOLD)) {
            return {
                response:  top.value.response,
                citations: JSON.parse(top.value.citations ?? '[]')
            };
        }
        return null;
    }

    async _storeCache(queryEmbedding, response, citations) {
        const key = `ragcache:${crypto.randomUUID()}`;
        await this.client.hSet(key, {
            response,
            citations:       JSON.stringify(citations),
            query_embedding: this._toBuffer(queryEmbedding)
        });
        await this.client.expire(key, CACHE_TTL);
    }

    // ── Session memory ────────────────────────────────────────────────────────

    async _getHistory() {
        const raw = await this.client.lRange(this.sessionKey, 0, MAX_HISTORY_TURNS * 2 - 1);
        return raw.reverse().map(s => {
            try { return JSON.parse(s); } catch { return null; }
        }).filter(Boolean);
    }

    async _saveHistory(role, content) {
        await this.client.lPush(this.sessionKey, JSON.stringify({ role, content }));
        await this.client.lTrim(this.sessionKey, 0, MAX_HISTORY_TURNS * 2 - 1);
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    async query(userQuery) {
        const queryEmbedding = await this._embed(userQuery);

        const cached = await this._checkCache(queryEmbedding);
        if (cached) {
            console.log('[cache hit]');
            await this._saveHistory('user', userQuery);
            await this._saveHistory('assistant', cached.response);
            return cached;
        }

        const topChunks = await this._hybridSearch(userQuery, queryEmbedding);
        if (topChunks.length === 0) {
            return { response: 'No documents found. Please ingest documents before querying.', citations: [] };
        }

        const contextParts = [];
        const citations = [];
        topChunks.forEach((chunk, i) => {
            contextParts.push(`[${i + 1}] ${chunk.title ?? 'Unknown'}\n${chunk.content ?? ''}`);
            citations.push({
                index:    i + 1,
                title:    chunk.title ?? 'Unknown',
                source:   chunk.source ?? '',
                chunk_id: chunk.chunk_id ?? '',
                doc_id:   chunk.doc_id ?? ''
            });
        });

        const history = await this._getHistory();
        const messages = [
            {
                role:    'system',
                content: 'You are a helpful knowledge assistant. Answer using only the provided context. ' +
                         'Reference sources as [1], [2], etc. If the context lacks the answer, say so clearly.'
            },
            ...history,
            { role: 'user', content: `Context:\n${contextParts.join('\n\n')}\n\nQuestion: ${userQuery}` }
        ];

        const completion = await this.llm.chat.completions.create({
            model: this.llmModel,
            messages
        });
        const answer = completion.choices[0].message.content;

        await this._storeCache(queryEmbedding, answer, citations);
        await this._saveHistory('user', userQuery);
        await this._saveHistory('assistant', answer);
        return { response: answer, citations };
    }
}

async function main() {
    const agent = new KnowledgeAssistant();
    await agent.init();

    // Only ingest sample documents when the index is empty so re-running the agent
    // does not re-embed the same content on every startup.
    // To load your own documents instead: await agent.loadDirectory('path/to/docs');
    const indexInfo = await agent.client.ft.info(DOC_INDEX);
    if (parseInt(indexInfo.numDocs ?? '0') === 0) {
        console.log('Empty index — ingesting sample documents...');
        for (const doc of SAMPLE_DOCS) {
            await agent.ingestDocument(doc.content, doc.title, doc.source);
        }
    } else {
        console.log(`Index already contains ${indexInfo.numDocs} document(s). Skipping ingestion.`);
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    console.log('\nKnowledge Assistant ready. Type your questions or "quit" to exit.\n');

    const ask = () => {
        rl.question('Question: ', async (input) => {
            const trimmed = input.trim();
            if (['quit', 'exit', 'bye'].includes(trimmed.toLowerCase())) {
                console.log('Goodbye!');
                rl.close();
                await agent.client.quit();
                return;
            }
            if (!trimmed) {
                ask();
                return;
            }
            try {
                const { response, citations } = await agent.query(trimmed);
                console.log(`\n${response}`);
                if (citations.length > 0) {
                    console.log('\nSources:');
                    citations.forEach(c => {
                        const src = c.source ? ` — ${c.source}` : '';
                        console.log(`  [${c.index}] ${c.title}${src}`);
                        console.log(`         chunk_id: ${c.chunk_id}`);
                    });
                }
                console.log();
            } catch (err) {
                console.error('Error:', err.message);
            }
            ask();
        });
    };
    ask();
}

main().catch(err => {
    console.error('Failed to initialize:', err.message);
    process.exit(1);
});

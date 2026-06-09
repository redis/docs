/*
 * Redis Conversational Agent (Node.js)
 * Uses node-redis with Redis Search for semantic message history
 *
 * Requires Redis Stack 6.2+ or Redis 8 with the Search module for JSON
 * vector indexing. The vector field is stored as a JSON array of floats,
 * which is the correct on-disk format for JSON-backed vector indexes.
 *
 * To run this code:
 *   Install dependencies:
 *     npm install redis openai dotenv
 *
 *   Set environment variables:
 *     LLM_API_KEY=your_${formData.llmModel.toLowerCase()}_api_key
 *     LLM_API_BASE_URL=your_base_url    (optional, default: ${CONFIG.models[formData.llmModel].baseUrl})
 *     LLM_MODEL=your_model_name         (optional, default: ${CONFIG.models[formData.llmModel].defaultModel})
 *     EMBEDDING_MODEL=your_embed_model  (optional, default: text-embedding-3-small)
 *     VECTOR_DIM=1536                   (optional, must match your embedding model's output dimension)
 *     REDIS_URL=redis://localhost:6379
 *       (or use REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_USERNAME separately)
 */

require('dotenv').config();
const { createClient } = require('redis');
const OpenAI = require('openai');

const INDEX_NAME      = 'message_history_idx';
const MESSAGE_PREFIX  = 'message:';
const RECENT_KEY      = (session) => `recent:${session}`;
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || 'text-embedding-3-small';
const VECTOR_DIM      = parseInt(process.env.VECTOR_DIM) || 1536;
const RECENT_WINDOW   = 6;  // always include this many recent turns in context
const SEMANTIC_TOP_K  = 4;  // additional turns retrieved by semantic similarity
const MAX_CONTENT_CHARS = 2000;

class ConversationalAgent {
  constructor(sessionName = 'chat') {
    this.sessionName = sessionName;
    this.messageCount = 0;
    this._dimValidated = false;

    // For local providers (e.g. Ollama), any non-empty string works. For hosted providers, use your real key.
    this.llmApiKey = process.env.LLM_API_KEY || 'no-key-needed';

    this.llmBaseUrl = process.env.LLM_API_BASE_URL || '${CONFIG.models[formData.llmModel].baseUrl}';
    this.llmModel   = process.env.LLM_MODEL         || '${CONFIG.models[formData.llmModel].defaultModel}';

    this.openai = new OpenAI({ apiKey: this.llmApiKey, baseURL: this.llmBaseUrl });
    this.redisClient = null;
  }

  async connect() {
    const clientOptions = process.env.REDIS_URL
      ? { url: process.env.REDIS_URL }
      : {
          socket: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT) || 6379,
          },
          password: process.env.REDIS_PASSWORD || undefined,
          username: process.env.REDIS_USERNAME  || 'default',
        };

    this.redisClient = createClient(clientOptions);
    this.redisClient.on('error', (err) => console.error('Redis error:', err));
    await this.redisClient.connect();
    console.log('Connected to Redis successfully');

    await this._ensureIndex();
    console.log('LLM configured:', this.llmModel);
    console.log('Embedding model:', EMBEDDING_MODEL, `(VECTOR_DIM=${VECTOR_DIM})`);
  }

  async _ensureIndex() {
    try {
      await this.redisClient.ft.info(INDEX_NAME);
    } catch {
      await this.redisClient.ft.create(
        INDEX_NAME,
        {
          '$.role':    { type: 'TAG',  AS: 'role' },
          '$.content': { type: 'TEXT', AS: 'content' },
          '$.session': { type: 'TAG',  AS: 'session' },
          '$.embedding': {
            type: 'VECTOR',
            AS: 'embedding',
            ALGORITHM: 'FLAT',
            TYPE: 'FLOAT32',
            DIM: VECTOR_DIM,
            DISTANCE_METRIC: 'COSINE',
          },
        },
        { ON: 'JSON', PREFIX: MESSAGE_PREFIX }
      );
      console.log('Created search index:', INDEX_NAME);
    }
  }

  async _embed(text) {
    const response = await this.openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    });
    const embedding = response.data[0].embedding;

    // Validate dimension on first call. If this throws, either set VECTOR_DIM
    // to the correct value in your environment, or recreate the index.
    if (!this._dimValidated) {
      if (embedding.length !== VECTOR_DIM) {
        throw new Error(
          `Embedding model '${EMBEDDING_MODEL}' returned ${embedding.length} dimensions ` +
          `but VECTOR_DIM is ${VECTOR_DIM}. ` +
          `Set VECTOR_DIM=${embedding.length} and recreate the index.`
        );
      }
      this._dimValidated = true;
    }

    return embedding; // plain JS number array
  }

  _toQueryBuffer(embedding) {
    return Buffer.from(new Float32Array(embedding).buffer);
  }

  async _storeMessage(role, content) {
    const truncated = content.slice(0, MAX_CONTENT_CHARS);
    const embedding = await this._embed(truncated);
    const key = `${MESSAGE_PREFIX}${this.sessionName}:${Date.now()}_${this.messageCount++}`;

    await this.redisClient.json.set(key, '$', {
      role,
      content: truncated,
      session: this.sessionName,
      embedding, // stored as JSON array of floats, required for JSON vector index
    });

    // Track insertion order for recent-turn retrieval.
    // Before trimming, collect any keys that will be evicted and delete their documents
    // so message JSON and embeddings don't accumulate in Redis indefinitely.
    const listLen = await this.redisClient.lLen(RECENT_KEY(this.sessionName));
    const evictCount = listLen - (RECENT_WINDOW * 2 - 1); // -1 because we haven't pushed yet
    if (evictCount > 0) {
      const toEvict = await this.redisClient.lRange(RECENT_KEY(this.sessionName), 0, evictCount - 1);
      if (toEvict.length) await this.redisClient.del(toEvict);
    }
    await this.redisClient.rPush(RECENT_KEY(this.sessionName), key);
    await this.redisClient.lTrim(RECENT_KEY(this.sessionName), -RECENT_WINDOW * 2, -1);
  }

  async _getRecentMessages() {
    const keys = await this.redisClient.lRange(RECENT_KEY(this.sessionName), -(RECENT_WINDOW * 2), -1);
    if (!keys.length) return [];
    const docs = await this.redisClient.json.mGet(keys, '$');
    return keys
      .map((key, i) => ({ key, doc: docs[i]?.[0] }))
      .filter(({ doc }) => doc != null)
      .map(({ key, doc }) => ({ role: doc.role, content: doc.content, _key: key }));
  }

  async _getSemanticMessages(query) {
    const queryBuffer = this._toQueryBuffer(await this._embed(query));
    const results = await this.redisClient.ft.search(
      INDEX_NAME,
      `(@session:{${this.sessionName}})=>[KNN ${SEMANTIC_TOP_K} @embedding $vec AS score]`,
      {
        PARAMS: { vec: queryBuffer },
        RETURN: ['role', 'content', '__key'],
        SORTBY: { BY: 'score', DIRECTION: 'ASC' },
        DIALECT: 2,
      }
    );
    return results.documents.map((doc) => ({
      role: doc.value.role,
      content: doc.value.content,
      _key: doc.id,
    }));
  }

  async _buildContext(userInput) {
    // Hybrid: recent turns for conversational coherence + semantic search for deeper context.
    const [recent, semantic] = await Promise.all([
      this._getRecentMessages().catch(() => []),
      this._getSemanticMessages(userInput).catch(() => []),
    ]);

    // Deduplicate by key, then sort chronologically — keys encode timestamp so
    // lexicographic order preserves insertion time across both result sets.
    const seen = new Set(recent.map((m) => m._key));
    const extra = semantic.filter((m) => !seen.has(m._key));

    return [...recent, ...extra]
      .sort((a, b) => (a._key < b._key ? -1 : a._key > b._key ? 1 : 0))
      .map(({ role, content }) => ({ role, content }));
  }

  async chat(userInput) {
    const context = await this._buildContext(userInput);

    const messages = [
      {
        role: 'system',
        content: 'You are a helpful assistant that answers questions based on the conversation history.',
      },
      ...context,
      { role: 'user', content: userInput },
    ];

    const response = await this.openai.chat.completions.create({
      model: this.llmModel,
      messages,
    });

    const assistantResponse = response.choices[0]?.message?.content;
    if (!assistantResponse) throw new Error('Empty response from LLM');

    await this._storeMessage('user', userInput);
    await this._storeMessage('assistant', assistantResponse);

    return assistantResponse;
  }

  async disconnect() {
    if (this.redisClient) await this.redisClient.disconnect();
  }
}

async function main() {
  const agent = new ConversationalAgent();
  try {
    await agent.connect();
    console.log(await agent.chat('Tell me about yourself.'));
  } catch (err) {
    console.error('Failed to initialize agent:', err.message);
    await agent.disconnect();
    process.exit(1);
  }

  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  const askQuestion = () => {
    rl.question('Enter a prompt: ', async (input) => {
      if (['quit', 'exit', 'bye'].includes(input.toLowerCase())) {
        console.log('Goodbye!');
        rl.close();
        await agent.disconnect();
        return;
      }
      try {
        console.log(await agent.chat(input));
      } catch (err) {
        console.error('Error:', err.message);
      }
      askQuestion();
    });
  };
  askQuestion();
}

main();

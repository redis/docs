'''
Redis Knowledge Assistant (RAG Agent)

Features:
- Ingest documents with automatic chunking and embedding
- Redis-native hybrid retrieval: text pre-filter + KNN vector search, with a fallback vector pass
- Semantic cache: skip LLM for similar queries using cached responses (TTL-based expiry)
- Per-session conversation memory in a Redis List
- Citations: each answer references source documents with title, source URL, and chunk ID

To run this code:
    Install dependencies:
        pip install redisvl[all] redis openai

    Set environment variables:
        export LLM_API_KEY=your_api_key_here
        export LLM_API_BASE_URL=your_${formData.llmModel.toLowerCase()}_api_base_url
            (optional - default: ${CONFIG.models[formData.llmModel].baseUrl})
        export LLM_MODEL=your_${formData.llmModel.toLowerCase()}_model
            (optional - default: ${CONFIG.models[formData.llmModel].defaultModel})
        export REDIS_HOST=your_redis_host
        export REDIS_PORT=your_redis_port
        export REDIS_PASSWORD=your_redis_password

        Embeddings use a separate client so you can mix providers:
        export EMBEDDING_API_KEY=your_embedding_api_key
            (optional - defaults to LLM_API_KEY)
        export EMBEDDING_API_BASE_URL=your_embedding_base_url
            (optional - defaults to LLM_API_BASE_URL)
        export EMBEDDING_MODEL=text-embedding-3-small
            (optional - for Ollama use nomic-embed-text; for OpenAI use text-embedding-3-small)

    Note: this template uses the OpenAI SDK with a configurable base URL. Chat completions
    and embeddings are configured independently, so you can use any OpenAI-compatible
    provider for each. For example: Anthropic for chat + OpenAI (or Ollama) for embeddings.

    Requires Redis Stack or Redis 8+ with Search module enabled.
'''

import json
import os
import re
import struct
import uuid

import openai
import redis
from redis.commands.search.query import Query as FTQuery
from redisvl.index import SearchIndex
from redisvl.schema import IndexSchema

CHUNK_SIZE = 500
CHUNK_OVERLAP = 50
MAX_SEARCH_RESULTS = 5
MAX_HISTORY_TURNS = 6
CACHE_TTL = 3600
# Cosine similarity threshold for cache hits. vector_distance for cosine is in [0, 2]:
# 0 = identical, 1 = orthogonal, 2 = opposite. A hit fires when distance < (1 - threshold),
# i.e. when cosine similarity > threshold. Treat this as a value to test, not assume.
CACHE_THRESHOLD = 0.92
VECTOR_DIM = int(os.getenv('VECTOR_DIM', '1536'))
EMBEDDING_MODEL = os.getenv('EMBEDDING_MODEL', 'text-embedding-3-small')

# RediSearch special characters that must be backslash-escaped in query strings.
# Escaping preserves token meaning — "C\+\+" still matches "C++" in documents —
# whereas stripping would silently discard the + characters and change query intent.
# Note: this is a best-effort heuristic. It handles the common cases well but is
# not a full RediSearch query parser; phrase queries and advanced syntax may still
# need manual adjustment.
_FT_SPECIAL = re.compile(r'([,.<>{}\[\]"\':;!@#$%^&*()\-+=~|/\\?])')

_DOC_SCHEMA = {
    'index': {'name': 'knowledge_docs', 'prefix': 'doc', 'storage_type': 'hash'},
    'fields': [
        {'name': 'doc_id', 'type': 'tag'},
        {'name': 'chunk_id', 'type': 'tag'},
        {'name': 'title', 'type': 'text'},
        {'name': 'source', 'type': 'tag'},
        {'name': 'content', 'type': 'text'},
        {'name': 'embedding', 'type': 'vector',
         'attrs': {'dims': VECTOR_DIM, 'algorithm': 'flat',
                   'distance_metric': 'cosine', 'datatype': 'float32'}}
    ]
}

_CACHE_SCHEMA = {
    'index': {'name': 'knowledge_cache', 'prefix': 'ragcache', 'storage_type': 'hash'},
    'fields': [
        {'name': 'response', 'type': 'text'},
        {'name': 'citations', 'type': 'text'},
        {'name': 'query_embedding', 'type': 'vector',
         'attrs': {'dims': VECTOR_DIM, 'algorithm': 'flat',
                   'distance_metric': 'cosine', 'datatype': 'float32'}}
    ]
}


# Sample Redis documentation for demonstration.
# Replace with your own documents or use load_directory() to load a folder of .txt / .md files.
SAMPLE_DOCS = [
    {
        'title': 'Redis Data Types',
        'source': 'https://redis.io/docs/latest/develop/data-types/',
        'content': (
            'Redis supports several core data types suited to different use cases. Strings store '
            'sequences of bytes up to 512 MB and support atomic increment and decrement operations. '
            'Lists are linked lists of strings with O(1) push and pop from both ends, useful for '
            'queues and stacks. Sets are unordered collections of unique strings with O(1) add, '
            'remove, and membership tests, plus union, intersection, and difference operations. '
            'Sorted sets add a floating-point score to each member, enabling range queries by score '
            'or rank in O(log N) time. Hashes store field-value pairs in a single key, ideal for '
            'representing objects without serialization. Redis also supports Streams for append-only '
            'logs with consumer groups, HyperLogLog for approximate cardinality estimation, Bitmaps '
            'for efficient bit-level operations, and Geospatial indexes for location-based queries.'
        )
    },
    {
        'title': 'Redis Vector Search',
        'source': 'https://redis.io/docs/latest/develop/ai/search-and-query/vectors/',
        'content': (
            'Redis Vector Search lets you index and search vector embeddings stored in HASH or JSON '
            'documents. Two index algorithms are available: FLAT (brute-force, exact results, best for '
            'smaller datasets) and HNSW (Hierarchical Navigable Small World, approximate results, '
            'much faster at scale using a multi-layer graph structure). Supported distance metrics are '
            'cosine similarity, L2 Euclidean distance, and inner product. Hybrid queries combine a '
            'vector KNN clause with a RediSearch filter expression in a single FT.SEARCH call, '
            'pre-filtering documents by metadata before ranking by vector distance. This avoids '
            'post-filtering and keeps result quality high. Vector fields are declared with DIM '
            '(dimension count), TYPE (FLOAT32 or FLOAT64), and DISTANCE_METRIC parameters.'
        )
    },
    {
        'title': 'Redis Cloud',
        'source': 'https://redis.io/docs/latest/operate/rc/',
        'content': (
            'Redis Cloud is the fully managed cloud service for Redis, available on AWS, Google Cloud, '
            'and Microsoft Azure. It provides automatic clustering, replication, and failover for high '
            'availability and data durability without operational overhead. Deployment options include '
            'Redis Stack for development, Redis Enterprise for mission-critical workloads, and active-'
            'active geo-distribution for multi-region deployments with conflict-free replication. '
            'Built-in monitoring, automated backups, and vertical and horizontal scaling are included. '
            'A free tier is available for development and testing. Supported modules include RediSearch '
            'for full-text and vector search, RedisJSON for native JSON documents, RedisTimeSeries for '
            'time-series data, and RedisBloom for probabilistic structures such as Bloom filters and '
            'Count-Min sketches.'
        )
    },
    {
        'title': 'Redis Context Engine',
        'source': 'https://redis.io/docs/latest/develop/ai/context-engine/',
        'content': (
            'The Redis Context Engine is a suite of managed services on Redis Cloud that gives AI '
            'agents the context they need. LangCache provides semantic response caching: incoming '
            'queries are embedded and compared against cached query-response pairs, returning a cached '
            'answer when cosine similarity exceeds a configurable threshold to reduce LLM API costs. '
            'Agent Memory offers two-tier persistent memory with a session layer for recent turns and '
            'a long-term layer backed by vector search, available as a REST API and Python SDK. '
            'Context Retriever exposes structured business data as governed tools that agents can '
            'query reliably without writing custom retrieval logic. Data Integration keeps a Redis '
            'Cloud database in sync with relational databases in near real time using Change Data '
            'Capture, so agents always query fresh data.'
        )
    },
]


class KnowledgeAssistant:
    def __init__(self, session_id=None):
        self.session_id = session_id or str(uuid.uuid4())
        self.session_key = f'session:{self.session_id}:history'

        self.llm_api_key = os.getenv('LLM_API_KEY')
        if not self.llm_api_key:
            raise ValueError('LLM_API_KEY environment variable is required')
        self.llm_base_url = os.getenv('LLM_API_BASE_URL', '${CONFIG.models[formData.llmModel].baseUrl}')
        self.llm_model = os.getenv('LLM_MODEL', '${CONFIG.models[formData.llmModel].defaultModel}')

        try:
            # Single client with decode_responses=False handles both text and binary (embedding) fields.
            self.client = redis.Redis(
                host=os.getenv('REDIS_HOST', 'localhost'),
                port=int(os.getenv('REDIS_PORT', 6379)),
                username=os.getenv('REDIS_USERNAME', 'default'),
                password=os.getenv('REDIS_PASSWORD', ''),
                decode_responses=False,
                socket_connect_timeout=5
            )
            self.client.ping()
            print(f'Connected to Redis. Session: {self.session_id}')
        except redis.ConnectionError as e:
            print(f'Failed to connect to Redis: {e}')
            raise

        self.llm = openai.OpenAI(api_key=self.llm_api_key, base_url=self.llm_base_url)
        print(f'LLM configured: {self.llm_model}')

        # Embeddings can use a different provider than chat completions.
        # For Anthropic users: set EMBEDDING_API_KEY and EMBEDDING_API_BASE_URL to an
        # OpenAI-compatible embedding endpoint (e.g. OpenAI, or Ollama with nomic-embed-text).
        embedding_api_key = os.getenv('EMBEDDING_API_KEY') or self.llm_api_key
        embedding_base_url = os.getenv('EMBEDDING_API_BASE_URL') or self.llm_base_url
        self.embedder = openai.OpenAI(api_key=embedding_api_key, base_url=embedding_base_url)

        # redisvl is used only for index creation; all queries use redis-py directly.
        doc_index = SearchIndex(IndexSchema.from_dict(_DOC_SCHEMA), redis_client=self.client)
        cache_index = SearchIndex(IndexSchema.from_dict(_CACHE_SCHEMA), redis_client=self.client)
        doc_index.create(overwrite=False)
        cache_index.create(overwrite=False)

    # ── Document ingestion ────────────────────────────────────────────────────

    def load_directory(self, path, extensions=('.txt', '.md')):
        """Ingest all matching files from a directory tree. Each file becomes one document."""
        import pathlib
        loaded = 0
        for filepath in sorted(pathlib.Path(path).rglob('*')):
            if filepath.suffix.lower() in extensions and filepath.is_file():
                try:
                    content = filepath.read_text(encoding='utf-8', errors='ignore').strip()
                    if content:
                        self.ingest_document(content, title=filepath.stem, source=str(filepath))
                        loaded += 1
                except Exception as e:
                    print(f'Skipping {filepath}: {e}')
        print(f'Loaded {loaded} document(s) from {path}')
        return loaded

    def _chunk_text(self, text):
        # Character-based chunking is simple but not token-aware. For production,
        # consider tiktoken or RecursiveCharacterTextSplitter from langchain.
        chunks, start = [], 0
        while start < len(text):
            chunks.append(text[start:start + CHUNK_SIZE])
            start += CHUNK_SIZE - CHUNK_OVERLAP
        return chunks

    def _embed(self, text):
        resp = self.embedder.embeddings.create(model=EMBEDDING_MODEL, input=text[:8000])
        return resp.data[0].embedding

    def _to_bytes(self, embedding):
        return struct.pack(f'{len(embedding)}f', *embedding)

    def _decode_doc(self, doc):
        def d(val):
            return val.decode('utf-8', errors='replace') if isinstance(val, bytes) else (val or '')
        return {
            'id':       d(doc.id),
            'chunk_id': d(getattr(doc, 'chunk_id', '')),
            'doc_id':   d(getattr(doc, 'doc_id', '')),
            'title':    d(getattr(doc, 'title', '')),
            'source':   d(getattr(doc, 'source', '')),
            'content':  d(getattr(doc, 'content', '')),
            'distance': d(getattr(doc, 'distance', '1.0'))
        }

    def ingest_document(self, content, title, source=''):
        doc_id = str(uuid.uuid4())
        chunks = self._chunk_text(content)
        for i, chunk in enumerate(chunks):
            chunk_id = f'{doc_id}:{i}'
            embedding = self._embed(chunk)
            self.client.hset(f'doc:{chunk_id}', mapping={
                b'doc_id':    doc_id.encode(),
                b'chunk_id':  chunk_id.encode(),
                b'title':     title.encode(),
                b'source':    source.encode(),
                b'content':   chunk.encode(),
                b'embedding': self._to_bytes(embedding)
            })
        print(f"Ingested '{title}': {len(chunks)} chunk(s) (doc_id: {doc_id})")
        return doc_id

    # ── Hybrid search ─────────────────────────────────────────────────────────
    # First pass: FT.SEARCH with a text pre-filter and an inline KNN clause —
    # "(text_terms) => [KNN k @embedding $BLOB AS distance]" — so Redis applies
    # both filters in a single round trip. This is more Redis-native than running
    # two separate queries and fusing the results in Python.
    # Second pass (fallback): if the text filter is too selective and returns nothing,
    # a pure vector search is issued so queries always return results when documents exist.

    def _sanitize_ft_query(self, text):
        # Escape RediSearch special characters rather than strip them, so tokens like
        # "C++", "redis.io", and non-English text survive into the query intact.
        # We OR-join per-word terms for recall; the KNN step handles ranking.
        # This is a best-effort heuristic — see _FT_SPECIAL comment above.
        terms = text.split()
        if not terms:
            return '*'
        escaped = [_FT_SPECIAL.sub(r'\\\1', t) for t in terms]
        return ' | '.join(escaped[:10])  # cap at 10 terms

    def _run_knn_query(self, query_str, query_embedding, top_k):
        return self.client.ft('knowledge_docs').search(
            FTQuery(query_str)
                .sort_by('distance', asc=True)
                .paging(0, top_k)
                .return_fields('chunk_id', 'doc_id', 'title', 'source', 'content', 'distance')
                .dialect(2),
            query_params={'K': top_k, 'BLOB': self._to_bytes(query_embedding)}
        )

    def _hybrid_search(self, query_text, query_embedding, top_k=MAX_SEARCH_RESULTS):
        safe_text = self._sanitize_ft_query(query_text)
        if safe_text != '*':
            try:
                result = self._run_knn_query(
                    f'({safe_text})=>[KNN $K @embedding $BLOB AS distance]',
                    query_embedding, top_k
                )
                if result.docs:
                    return [self._decode_doc(d) for d in result.docs]
            except Exception as e:
                print(f'Hybrid search error: {e}')
        # Fall back to pure vector search if the text filter returned nothing
        result = self._run_knn_query(
            '*=>[KNN $K @embedding $BLOB AS distance]',
            query_embedding, top_k
        )
        return [self._decode_doc(d) for d in result.docs]

    # ── Semantic cache ────────────────────────────────────────────────────────

    def _check_cache(self, query_embedding):
        try:
            result = self.client.ft('knowledge_cache').search(
                FTQuery('*=>[KNN 1 @query_embedding $BLOB AS distance]')
                    .sort_by('distance', asc=True)
                    .paging(0, 1)
                    .return_fields('response', 'citations', 'distance')
                    .dialect(2),
                query_params={'BLOB': self._to_bytes(query_embedding)}
            )
            if result.docs:
                raw = result.docs[0]
                def d(val):
                    return val.decode('utf-8', errors='replace') if isinstance(val, bytes) else (val or '')
                distance  = float(d(getattr(raw, 'distance',  '1.0')))
                response  = d(getattr(raw, 'response',  ''))
                citations = d(getattr(raw, 'citations', '[]'))
                # vector_distance for cosine: 0=identical, 1=orthogonal. Hit when similarity > CACHE_THRESHOLD.
                if distance < (1.0 - CACHE_THRESHOLD) and response:
                    return response, json.loads(citations)
        except Exception:
            pass
        return None, None

    def _store_cache(self, query_embedding, response, citations):
        key = f'ragcache:{uuid.uuid4()}'
        self.client.hset(key, mapping={
            b'response':        response.encode(),
            b'citations':       json.dumps(citations).encode(),
            b'query_embedding': self._to_bytes(query_embedding)
        })
        self.client.expire(key, CACHE_TTL)

    # ── Session memory ────────────────────────────────────────────────────────

    def _get_history(self):
        raw = self.client.lrange(self.session_key, 0, MAX_HISTORY_TURNS * 2 - 1)
        messages = []
        for item in reversed(raw):
            try:
                messages.append(json.loads(item.decode() if isinstance(item, bytes) else item))
            except Exception:
                pass
        return messages

    def _save_history(self, role, content):
        self.client.lpush(self.session_key, json.dumps({'role': role, 'content': content}).encode())
        self.client.ltrim(self.session_key, 0, MAX_HISTORY_TURNS * 2 - 1)

    # ── Query ─────────────────────────────────────────────────────────────────

    def query(self, user_query):
        query_embedding = self._embed(user_query)

        cached_response, cached_citations = self._check_cache(query_embedding)
        if cached_response:
            print('[cache hit]')
            self._save_history('user', user_query)
            self._save_history('assistant', cached_response)
            return cached_response, cached_citations

        top_chunks = self._hybrid_search(user_query, query_embedding)
        if not top_chunks:
            return 'No documents found. Please ingest documents before querying.', []

        context_parts, citations = [], []
        for i, chunk in enumerate(top_chunks):
            title = chunk.get('title', 'Unknown')
            source = chunk.get('source', '')
            context_parts.append(f'[{i + 1}] {title}\n{chunk.get("content", "")}')
            citations.append({
                'index':    i + 1,
                'title':    title,
                'source':   source,
                'chunk_id': chunk.get('chunk_id', ''),
                'doc_id':   chunk.get('doc_id', '')
            })

        messages = [
            {'role': 'system', 'content': (
                'You are a helpful knowledge assistant. Answer using only the provided context. '
                'Reference sources as [1], [2], etc. If the context lacks the answer, say so clearly.'
            )},
            *self._get_history(),
            {'role': 'user', 'content': f'Context:\n{chr(10).join(context_parts)}\n\nQuestion: {user_query}'}
        ]

        response = self.llm.chat.completions.create(model=self.llm_model, messages=messages)
        answer = response.choices[0].message.content

        self._store_cache(query_embedding, answer, citations)
        self._save_history('user', user_query)
        self._save_history('assistant', answer)
        return answer, citations


if __name__ == '__main__':
    try:
        agent = KnowledgeAssistant()

        # Only ingest sample documents when the index is empty so re-running the agent
        # does not re-embed the same content on every startup.
        # To load your own documents instead: agent.load_directory('path/to/docs')
        index_info = agent.client.ft('knowledge_docs').info()
        if int(index_info.get('num_docs', 0)) == 0:
            print('Empty index — ingesting sample documents...')
            for doc in SAMPLE_DOCS:
                agent.ingest_document(doc['content'], doc['title'], doc['source'])
        else:
            print(f"Index already contains {index_info.get('num_docs')} document(s). Skipping ingestion.")

        print('\nKnowledge Assistant ready. Type your questions or "quit" to exit.\n')
        while True:
            try:
                user_input = input('Question: ').strip()
                if user_input.lower() in ['quit', 'exit', 'bye']:
                    print('Goodbye!')
                    break
                if not user_input:
                    continue
                answer, citations = agent.query(user_input)
                print(f'\n{answer}')
                if citations:
                    print('\nSources:')
                    for c in citations:
                        src = f' — {c["source"]}' if c['source'] else ''
                        print(f'  [{c["index"]}] {c["title"]}{src}')
                        print(f'         chunk_id: {c["chunk_id"]}')
                print()
            except KeyboardInterrupt:
                print('\nGoodbye!')
                break
            except Exception as e:
                print(f'Error: {e}')
    except ValueError as e:
        print(f'Configuration error: {e}')
        exit(1)
    except Exception as e:
        print(f'Failed to initialize: {e}')
        exit(1)

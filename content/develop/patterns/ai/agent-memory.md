---
categories:
- docs
- develop
- stack
- oss
- rs
- rc
- kubernetes
- clients
description: Implement episodic, semantic, and working memory for AI agents
linkTitle: Agent memory
title: How do I implement AI agent memory?
weight: 2
---

## Problem

You need to give AI agents memory capabilities:

- **Episodic memory** - Remember conversation history
- **Semantic memory** - Store and retrieve knowledge
- **Working memory** - Track current context and state
- Support multi-turn conversations
- Retrieve relevant past interactions

LLMs are stateless and can't remember past interactions without external memory.

## Solution overview

Redis provides three types of agent memory:

1. **Episodic memory** - Lists/Streams for conversation history
2. **Semantic memory** - Vector search for knowledge retrieval
3. **Working memory** - Hashes/JSON for current session state

Combine all three for comprehensive agent memory.

**Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│              AI Agent Memory System                      │
└──────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  1. EPISODIC MEMORY (Conversation History)             │
│     Redis List: memory:episodic:session_123             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ [0] User: "What is Redis?"                         │ │
│  │ [1] Agent: "Redis is an in-memory data store..."   │ │
│  │ [2] User: "How do I use it for caching?"           │ │
│  │ [3] Agent: "You can use SET/GET commands..."       │ │
│  │ [4] User: "Show me an example"                     │ │
│  └────────────────────────────────────────────────────┘ │
│     TTL: 24 hours                                       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  2. SEMANTIC MEMORY (Knowledge Base)                   │
│     Redis Vector Index: idx:semantic_memory             │
│  ┌────────────────────────────────────────────────────┐ │
│  │ "Redis supports strings, hashes, lists..."         │ │
│  │  Vector: [0.23, -0.45, 0.67, ...]                  │ │
│  │  Category: redis_basics                            │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ "HNSW algorithm for vector search..."              │ │
│  │  Vector: [0.12, 0.89, -0.34, ...]                  │ │
│  │  Category: redis_advanced                          │ │
│  └────────────────────────────────────────────────────┘ │
│     Persistent, searchable by similarity               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  3. WORKING MEMORY (Current Context)                   │
│     Redis JSON: memory:working:session_123              │
│  ┌────────────────────────────────────────────────────┐ │
│  │ {                                                  │ │
│  │   "current_topic": "redis_caching",                │ │
│  │   "user_intent": "learning",                       │ │
│  │   "conversation_stage": "examples",                │ │
│  │   "context_variables": {                           │ │
│  │     "user_skill_level": "beginner",                │ │
│  │     "preferred_language": "python"                 │ │
│  │   },                                               │ │
│  │   "pending_actions": ["send_code_example"]         │ │
│  │ }                                                  │ │
│  └────────────────────────────────────────────────────┘ │
│     TTL: 1 hour                                         │
└─────────────────────────────────────────────────────────┘

Query: "How do I cache data?"
     │
     ├──▶ Episodic: Get last 5 messages
     ├──▶ Semantic: Search for "caching" knowledge
     └──▶ Working: Get current context
     │
     ▼
Combined Context ──▶ LLM ──▶ Contextual Response
```

## Prerequisites

Before implementing this pattern, review:

- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - Vector search for memory
- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Semantic search
- [Streams]({{< relref "/develop/data-types/streams" >}}) - Event history

## Implementation

### Step 1: Episodic memory (conversation history)

Store and retrieve conversation history.

**Python example:**

```python
import redis
import json
import time

r = redis.Redis(host='localhost', port=6379, decode_responses=True)

def add_to_episodic_memory(session_id, role, content, metadata=None):
    """Add message to conversation history"""
    metadata = metadata or {}

    message = {
        "role": role,
        "content": content,
        "timestamp": time.time(),
        **metadata
    }

    # Store in list (most recent first)
    key = f"memory:episodic:{session_id}"
    r.lpush(key, json.dumps(message))

    # Set TTL (e.g., 24 hours)
    r.expire(key, 86400)

def get_recent_history(session_id, limit=10):
    """Get recent conversation history"""
    key = f"memory:episodic:{session_id}"
    messages = r.lrange(key, 0, limit - 1)

    history = []
    for msg in reversed(messages):  # Reverse to get chronological order
        history.append(json.loads(msg))

    return history

def get_relevant_history(session_id, query, limit=5):
    """Get relevant conversation history using semantic search"""
    from openai import OpenAI
    import numpy as np

    openai_client = OpenAI()

    # Get all history
    all_history = get_recent_history(session_id, limit=100)

    if not all_history:
        return []

    # Generate query embedding
    query_response = openai_client.embeddings.create(
        input=query,
        model="text-embedding-3-small"
    )
    query_embedding = query_response.data[0].embedding

    # Calculate similarity for each message
    scored_messages = []
    for msg in all_history:
        # Generate embedding for message
        msg_response = openai_client.embeddings.create(
            input=msg['content'],
            model="text-embedding-3-small"
        )
        msg_embedding = msg_response.data[0].embedding

        # Calculate cosine similarity
        similarity = np.dot(query_embedding, msg_embedding) / (
            np.linalg.norm(query_embedding) * np.linalg.norm(msg_embedding)
        )

        scored_messages.append((msg, similarity))

    # Sort by similarity and return top N
    scored_messages.sort(key=lambda x: x[1], reverse=True)
    return [msg for msg, score in scored_messages[:limit]]

# Example usage
session_id = "user123_session456"

add_to_episodic_memory(session_id, "user", "What is Redis?")
add_to_episodic_memory(session_id, "assistant", "Redis is an in-memory data store...")
add_to_episodic_memory(session_id, "user", "How do I use it for caching?")

history = get_recent_history(session_id, limit=5)
print(f"Recent history: {history}")
```

### Step 2: Semantic memory (knowledge base)

Store and retrieve agent knowledge using vector search.

**Python example:**

```python
from redis.commands.json.path import Path
from redis.commands.search.field import VectorField, TextField, TagField
from redis.commands.search.indexDefinition import IndexDefinition, IndexType
from redis.commands.search.query import Query
import numpy as np

# Create semantic memory index
VECTOR_DIM = 1536

schema = (
    TextField("$.content", as_name="content"),
    TagField("$.category", as_name="category"),
    TagField("$.source", as_name="source"),
    VectorField(
        "$.embedding",
        "HNSW",
        {
            "TYPE": "FLOAT32",
            "DIM": VECTOR_DIM,
            "DISTANCE_METRIC": "COSINE"
        },
        as_name="embedding"
    )
)

index_def = IndexDefinition(prefix=["memory:semantic:"], index_type=IndexType.JSON)
try:
    r.ft("idx:semantic_memory").create_index(schema, definition=index_def)
except:
    pass

def add_to_semantic_memory(agent_id, content, category="general", source="learned"):
    """Add knowledge to semantic memory"""
    from openai import OpenAI
    import hashlib

    openai_client = OpenAI()

    # Generate embedding
    response = openai_client.embeddings.create(
        input=content,
        model="text-embedding-3-small"
    )
    embedding = response.data[0].embedding
    embedding_bytes = np.array(embedding, dtype=np.float32).tobytes()

    # Create memory key
    content_hash = hashlib.md5(content.encode()).hexdigest()
    key = f"memory:semantic:{agent_id}:{content_hash}"

    # Store memory
    r.json().set(key, Path.root_path(), {
        "content": content,
        "category": category,
        "source": source,
        "embedding": embedding_bytes.hex(),
        "timestamp": time.time()
    })

def recall_from_semantic_memory(agent_id, query, k=3, category=None):
    """Recall relevant knowledge from semantic memory"""
    from openai import OpenAI

    openai_client = OpenAI()

    # Generate query embedding
    response = openai_client.embeddings.create(
        input=query,
        model="text-embedding-3-small"
    )
    embedding = response.data[0].embedding
    query_bytes = np.array(embedding, dtype=np.float32).tobytes()

    # Build filter
    filter_expr = f"@category:{{{category}}}" if category else "*"
    query_str = f"{filter_expr}=>[KNN {k} @embedding $vec AS score]"

    # Search
    search_query = (
        Query(query_str)
        .return_fields("content", "category", "source", "score")
        .dialect(2)
    )

    results = r.ft("idx:semantic_memory").search(
        search_query,
        query_params={"vec": query_bytes}
    )

    memories = []
    for doc in results.docs:
        memories.append({
            "content": doc.content,
            "category": doc.category,
            "source": doc.source,
            "relevance": 1 - float(doc.score)
        })

    return memories

# Example usage
agent_id = "agent_001"

add_to_semantic_memory(
    agent_id,
    "Redis supports multiple data structures including strings, hashes, lists, sets, and sorted sets",
    category="redis_basics"
)

add_to_semantic_memory(
    agent_id,
    "Vector search in Redis uses HNSW algorithm for approximate nearest neighbor search",
    category="redis_advanced"
)

# Recall relevant knowledge
memories = recall_from_semantic_memory(agent_id, "What data structures does Redis have?")
print(f"Recalled memories: {memories}")
```

### Step 3: Working memory (current context)

Track current session state and context.

**Python example:**

```python
def initialize_working_memory(session_id, initial_state=None):
    """Initialize working memory for a session"""
    initial_state = initial_state or {}

    key = f"memory:working:{session_id}"

    default_state = {
        "current_topic": None,
        "user_intent": None,
        "context_variables": {},
        "pending_actions": [],
        "conversation_stage": "greeting",
        "last_updated": time.time()
    }

    state = {**default_state, **initial_state}
    r.json().set(key, Path.root_path(), state)
    r.expire(key, 3600)  # 1 hour TTL

    return state

def update_working_memory(session_id, updates):
    """Update working memory"""
    key = f"memory:working:{session_id}"

    for field, value in updates.items():
        r.json().set(key, f"$.{field}", value)

    r.json().set(key, "$.last_updated", time.time())
    r.expire(key, 3600)

def get_working_memory(session_id):
    """Get current working memory"""
    key = f"memory:working:{session_id}"
    return r.json().get(key)

def add_context_variable(session_id, var_name, var_value):
    """Add variable to context"""
    key = f"memory:working:{session_id}"
    r.json().set(key, f"$.context_variables.{var_name}", var_value)

def add_pending_action(session_id, action):
    """Add action to pending queue"""
    key = f"memory:working:{session_id}"
    r.json().arrappend(key, "$.pending_actions", action)

# Example usage
session_id = "user123_session456"

initialize_working_memory(session_id, {
    "current_topic": "redis_basics",
    "user_intent": "learning"
})

update_working_memory(session_id, {
    "conversation_stage": "answering_questions"
})

add_context_variable(session_id, "user_skill_level", "beginner")
add_pending_action(session_id, "send_tutorial_link")

working_memory = get_working_memory(session_id)
print(f"Working memory: {working_memory}")
```

### Step 4: Integrated memory system

Combine all three memory types for comprehensive agent memory.

**Python example:**

```python
class AgentMemory:
    def __init__(self, agent_id, session_id):
        self.agent_id = agent_id
        self.session_id = session_id
        self.r = redis.Redis(host='localhost', port=6379, decode_responses=True)

    def remember_interaction(self, user_message, agent_response):
        """Store interaction in episodic memory"""
        add_to_episodic_memory(self.session_id, "user", user_message)
        add_to_episodic_memory(self.session_id, "assistant", agent_response)

    def learn_fact(self, fact, category="general"):
        """Store fact in semantic memory"""
        add_to_semantic_memory(self.agent_id, fact, category, source="conversation")

    def update_context(self, **kwargs):
        """Update working memory context"""
        update_working_memory(self.session_id, kwargs)

    def get_full_context(self, query, history_limit=5, knowledge_limit=3):
        """Get complete context for query"""
        # Get recent conversation history
        recent_history = get_recent_history(self.session_id, limit=history_limit)

        # Get relevant knowledge
        relevant_knowledge = recall_from_semantic_memory(
            self.agent_id, query, k=knowledge_limit
        )

        # Get current working memory
        current_state = get_working_memory(self.session_id)

        return {
            "episodic": recent_history,
            "semantic": relevant_knowledge,
            "working": current_state
        }

    def generate_response_with_memory(self, user_query):
        """Generate response using all memory types"""
        from openai import OpenAI

        openai_client = OpenAI()

        # Get full context
        context = self.get_full_context(user_query)

        # Build prompt with memory
        history_text = "\n".join([
            f"{msg['role']}: {msg['content']}"
            for msg in context['episodic']
        ])

        knowledge_text = "\n".join([
            f"- {mem['content']}"
            for mem in context['semantic']
        ])

        prompt = f"""You are an AI assistant with memory.

Conversation history:
{history_text}

Relevant knowledge:
{knowledge_text}

Current context: {context['working']}

User: {user_query}


Assistant:"""

        # Generate response
        response = openai_client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}]
        )

        answer = response.choices[0].message.content

        # Remember this interaction
        self.remember_interaction(user_query, answer)

        return answer

# Example usage
memory = AgentMemory("agent_001", "user123_session456")

# Initialize
initialize_working_memory(memory.session_id)

# Have conversation
response = memory.generate_response_with_memory("What is Redis?")
print(f"Response: {response}")

# Learn from conversation
memory.learn_fact("Redis is an in-memory data store", category="redis_basics")

# Continue conversation with memory
response = memory.generate_response_with_memory("How do I use it?")
print(f"Response: {response}")
```

## Redis Cloud setup

When deploying agent memory to Redis Cloud:

1. **Set appropriate TTLs** - Balance memory vs freshness
2. **Monitor memory usage** - Episodic memory can grow large
3. **Use vector search** - For semantic memory retrieval
4. **Implement cleanup** - Remove old episodic memories
5. **Shard by agent/session** - Distribute load

Example configuration:
- **Episodic TTL**: 1-24 hours
- **Semantic memory**: Persistent
- **Working memory TTL**: 1 hour
- **History limit**: 10-50 messages
- **Knowledge limit**: 3-10 facts per query

## Common pitfalls

1. **No TTL on episodic memory** - Unbounded growth
2. **Not using semantic search** - Missing relevant memories
3. **Too much history** - Context window overflow
4. **Missing working memory** - Losing current state
5. **Not cleaning up** - Stale sessions accumulate

## Related patterns

- [RAG pipelines]({{< relref "/develop/patterns/ai/rag-pipeline" >}}) - Knowledge retrieval
- [Vector similarity search]({{< relref "/develop/patterns/queries/vector-similarity-search" >}}) - Semantic search
- [Semantic caching]({{< relref "/develop/patterns/ai/semantic-caching" >}}) - Response caching
- [Multi-agent coordination]({{< relref "/develop/patterns/ai/multi-agent-coordination" >}}) - Agent communication

## More information

- [RAG with Redis]({{< relref "/develop/get-started/rag" >}})
- [Vector database guide]({{< relref "/develop/get-started/vector-database" >}})
- [Streams]({{< relref "/develop/data-types/streams" >}})
- [JSON]({{< relref "/develop/data-types/json" >}})
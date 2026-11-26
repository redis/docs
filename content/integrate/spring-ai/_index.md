---
LinkTitle: Spring AI
Title: Redis with Spring AI
alwaysopen: false
categories:
- docs
- integrate
- oss
- rs
- rc
description: Use Redis as a Spring AI vector store, chat memory repository, and semantic cache.
group: ai
stack: true
summary: Use the Spring AI Redis modules to search embeddings, keep chat history, and cache chat responses by meaning in a Spring Boot application.
type: integration
weight: 30
---

[Spring AI](https://docs.spring.io/spring-ai/reference/) is a framework for building AI applications on Spring Boot. It has three Redis modules:

| Module | Use it to |
|--------|-----------|
| `spring-ai-starter-vector-store-redis` | Store embeddings and run vector, range, and text searches with metadata filters, using [Redis Search](/content/develop/ai/search-and-query/_index.md). |
| `spring-ai-starter-model-chat-memory-repository-redis` | Keep chat history for each conversation, with an optional expiry. |
| `spring-ai-redis-semantic-cache` | Cache chat responses by the meaning of the prompt, so a similar question skips the model call. |

See the [semantic cache](/content/develop/use-cases/semantic-cache/_index.md), [memory layer](/content/develop/use-cases/memory-layer/_index.md), and [recommendation engine](/content/develop/use-cases/recommendation-engine/_index.md) use cases for more information about when to use these patterns.

## Requirements

- A Spring Boot application with a Spring AI [`EmbeddingModel`](https://docs.spring.io/spring-ai/reference/api/embeddings.html) bean. For the semantic cache, you also need a `ChatModel`.
- Redis with [Redis Search](/content/develop/ai/search-and-query/_index.md) and [JSON](/content/develop/data-types/json/_index.md) (Redis 8 and later versions include both but earlier versions need Redis Stack).

The examples on this page were run with Spring AI 2.0.2, Spring Boot 4.1.2, Java 21, and Redis 8.10. They used a small test `EmbeddingModel` and `ChatModel` in place of a provider, so add the Spring AI starter for your own model provider.

Add the Spring AI bill of materials (BOM) and the Redis modules to your `pom.xml`:

```xml
<dependencyManagement>
  <dependencies>
    <dependency>
      <groupId>org.springframework.ai</groupId>
      <artifactId>spring-ai-bom</artifactId>
      <version>2.0.2</version>
      <type>pom</type>
      <scope>import</scope>
    </dependency>
  </dependencies>
</dependencyManagement>

<dependencies>
  <dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-data-redis</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.ai</groupId>
    <artifactId>spring-ai-starter-vector-store-redis</artifactId>
  </dependency>
</dependencies>
```

Spring AI's Redis modules use the [Jedis](/content/develop/clients/jedis/_index.md) client. The vector store's auto-configuration needs a `JedisConnectionFactory` bean, and Spring Boot creates one only when you ask for Jedis. Set `spring.data.redis.client-type` to `jedis`, together with the usual connection settings:

```properties
spring.data.redis.host=localhost
spring.data.redis.port=6379
spring.data.redis.client-type=jedis
```

Without `client-type`, the application fails to start with `required a bean of type 'org.springframework.data.redis.connection.jedis.JedisConnectionFactory' that could not be found`, because Boot chooses
[Lettuce](/content/develop/clients/lettuce/_index.md) when both clients are on the classpath.

## Search embeddings with the vector store

Set `initialize-schema` so that Spring AI creates the index on startup. It is `false` by default, and a search against a missing index fails with `SEARCH_INDEX_NOT_FOUND`:

```properties
spring.ai.vectorstore.redis.initialize-schema=true
spring.ai.vectorstore.redis.index-name=docs-index
spring.ai.vectorstore.redis.prefix=doc:
```

Then inject the `VectorStore`, add documents, and search:

```java
@Autowired VectorStore vectorStore;

vectorStore.add(List.of(
    new Document("Redis is an in-memory data store", Map.of("country", "UK", "year", 2021)),
    new Document("Llamas live in the Andes", Map.of("country", "PE", "year", 2019))));

List<Document> results = vectorStore.similaritySearch(
    SearchRequest.builder().query("data store").topK(2).build());
```

Spring AI stores each document as a Redis JSON document under the key prefix, and indexes it with a Redis Search index. The index takes its vector size from your embedding model. The default index name is `spring-ai-index`, the default prefix is `embedding:`, and the default algorithm is
[HNSW with cosine distance](/content/develop/ai/search-and-query/vectors/_index.md#hnsw-index). Set `spring.ai.vectorstore.redis.vector-algorithm` and `spring.ai.vectorstore.redis.distance-metric` to change them.

### Filter on metadata

Declare each metadata key that you filter on, with its type, as a `List<RedisVectorStore.MetadataField>` bean:

```java
@Bean
List<RedisVectorStore.MetadataField> redisMetadataFields() {
    return List.of(
        RedisVectorStore.MetadataField.tag("country"),
        RedisVectorStore.MetadataField.numeric("year"));
}
```

Then pass a filter expression to the search:

```java
List<Document> filtered = vectorStore.similaritySearch(
    SearchRequest.builder()
        .query("data store")
        .topK(5)
        .filterExpression("country in ['UK', 'NL'] && year >= 2020")
        .build());
```

A filter on a key that you didn't declare fails with `IllegalArgumentException: Not allowed filter identifier name: country`.

The vector store also supports `searchByRange()` for all documents within a similarity radius, and `searchByText()` for full-text search on a `text` metadata field. See the [Spring AI Redis vector store reference](https://docs.spring.io/spring-ai/reference/api/vectordbs/redis.html) for those and the HNSW tuning options.

## Keep chat history

Add the chat memory starter:

```xml
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-starter-model-chat-memory-repository-redis</artifactId>
</dependency>
```

This module reads its own connection properties, not `spring.data.redis.*`. Set them, and an optional expiry:

```properties
spring.ai.chat.memory.repository.redis.host=localhost
spring.ai.chat.memory.repository.redis.port=6379
spring.ai.chat.memory.repository.redis.time-to-live=24h
```

Wrap the auto-configured `RedisChatMemoryRepository` in a `ChatMemory`:

```java
@Autowired RedisChatMemoryRepository repository;

ChatMemory memory = MessageWindowChatMemory.builder()
    .chatMemoryRepository(repository)
    .maxMessages(10)
    .build();

memory.add("conversation-1", new UserMessage("Hello"));
memory.add("conversation-1", new AssistantMessage("Hi there"));
List<Message> history = memory.get("conversation-1");
```

Pass the same `ChatMemory` to a `MessageChatMemoryAdvisor` to give a `ChatClient` this history on every call.

The repository keeps each message as a Redis JSON document with a key of the form `chat-memory:<conversation id>:<timestamp>`, plus a `chat-memory:counter:<conversation id>` string. `time-to-live` sets a TTL on those keys. It also creates a Redis Search index, `chat-memory-idx` by default, so `AdvancedRedisChatMemoryRepository` can search messages by content, type, time range, and metadata.

## Cache responses by meaning

Add the semantic cache and its auto-configuration module:

```xml
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-redis-semantic-cache</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-autoconfigure-vector-store-redis-semantic-cache</artifactId>
</dependency>
<dependency>
  <groupId>org.springframework.ai</groupId>
  <artifactId>spring-ai-transformers</artifactId>
</dependency>
```

The auto-configuration only activates when `spring-ai-transformers` is on the classpath, because its default embedding model is a Transformers model. Without that dependency, no `SemanticCache` bean is created and no error explains why. An `EmbeddingModel` bean in your application replaces the default model. Configure the cache:

```properties
spring.ai.vectorstore.redis.semantic-cache.host=localhost
spring.ai.vectorstore.redis.semantic-cache.port=6379
spring.ai.vectorstore.redis.semantic-cache.similarity-threshold=0.8
```

Then add a `SemanticCacheAdvisor` to the `ChatClient` calls that should use the cache:

```java
@Autowired SemanticCache cache;
@Autowired ChatModel chatModel;

SemanticCacheAdvisor advisor = SemanticCacheAdvisor.builder().cache(cache).build();

String first = ChatClient.builder(chatModel).build()
    .prompt("What is the capital of France?")
    .advisors(advisor)
    .call().content();

String second = ChatClient.builder(chatModel).build()
    .prompt("Tell me the capital city of France?")   // similar: no model call
    .advisors(advisor)
    .call().content();
```

The second call returns the first call's answer without calling the model. A prompt with a different meaning, such as `How do I bake bread?`, calls the model. `similarity-threshold` is from 0 to 1, where a higher value specifies that a closer match is required. The cache creates the `semantic-cache-index` index and stores each entry as a JSON document with the key prefix `semantic-cache:`.

To create the cache yourself instead, use `DefaultSemanticCache` and the Jedis `RedisClient`. Its `distanceThreshold` specifies a distance between vectors, so a lower value is stricter here
(unlike `similarity-threshold` with the `SemanticCache` bean):

```java
RedisClient jedisClient = RedisClient.builder().hostAndPort("localhost", 6379).build();

SemanticCache cache = DefaultSemanticCache.builder()
    .jedisClient(jedisClient)
    .embeddingModel(embeddingModel)
    .distanceThreshold(0.3)
    .indexName("my-semantic-cache")
    .prefix("cache:")
    .build();

cache.set("What is the capital of France?", chatResponse, Duration.ofHours(1));
Optional<ChatResponse> hit = cache.get("Tell me the capital city of France");
```

The third argument to `set()` is an optional expiry. A semantic cache returns an earlier response for any prompt that is close enough, but this can be wrong when a small change in wording changes the answer. Set the threshold strict, or skip the cache, for prompts where small differences are significant.

## More information

- [Spring AI Redis vector store reference](https://docs.spring.io/spring-ai/reference/api/vectordbs/redis.html)
- [Spring AI chat memory reference](https://docs.spring.io/spring-ai/reference/api/chat-memory.html)
- [Spring Data Redis and Spring Session](/content/integrate/spring-framework-cache/_index.md), for caching, sessions, and data structures without Spring AI
- [Redis LangCache](/content/develop/ai/langcache/_index.md), a managed semantic cache

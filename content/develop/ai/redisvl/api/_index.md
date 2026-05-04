---
linkTitle: RedisVL API
title: RedisVL API
aliases:
- /integrate/redisvl/api
weight: 5
hideListLinks: true
---


Reference documentation for the RedisVL API.



* [Schema](schema/)
  * [IndexSchema](schema/#indexschema)
  * [Index-Level Stopwords Configuration](schema/#index-level-stopwords-configuration)
  * [Defining Fields](schema/#defining-fields)
  * [Basic Field Types](schema/#basic-field-types)
  * [Vector Field Types](schema/#vector-field-types)
  * [SVS-VAMANA Configuration Utilities](schema/#svs-vamana-configuration-utilities)
  * [Vector Algorithm Comparison](schema/#vector-algorithm-comparison)
* [Search Index Classes](searchindex/)
  * [SearchIndex](searchindex/#searchindex)
  * [AsyncSearchIndex](searchindex/#asyncsearchindex)
* [Vector](vector/)
  * [Vector](vector/#id1)
* [Query](query/)
  * [VectorQuery](query/#vectorquery)
  * [VectorRangeQuery](query/#vectorrangequery)
  * [AggregateHybridQuery](query/#aggregatehybridquery)
  * [HybridQuery](query/#hybridquery)
  * [TextQuery](query/#textquery)
  * [FilterQuery](query/#filterquery)
  * [CountQuery](query/#countquery)
  * [MultiVectorQuery](query/#multivectorquery)
  * [SQLQuery](query/#sqlquery)
* [Filter](filter/)
  * [FilterExpression](filter/#filterexpression)
  * [Tag](filter/#tag)
  * [Text](filter/#text)
  * [Num](filter/#num)
  * [Geo](filter/#geo)
  * [GeoRadius](filter/#georadius)
* [Vectorizers](vectorizer/)
  * [HFTextVectorizer](vectorizer/#hftextvectorizer)
  * [OpenAITextVectorizer](vectorizer/#openaitextvectorizer)
  * [AzureOpenAITextVectorizer](vectorizer/#azureopenaitextvectorizer)
  * [VertexAIVectorizer](vectorizer/#vertexaivectorizer)
  * [CohereTextVectorizer](vectorizer/#coheretextvectorizer)
  * [BedrockVectorizer](vectorizer/#bedrockvectorizer)
  * [CustomVectorizer](vectorizer/#customvectorizer)
  * [VoyageAIVectorizer](vectorizer/#voyageaivectorizer)
  * [MistralAITextVectorizer](vectorizer/#mistralaitextvectorizer)
* [Rerankers](reranker/)
  * [CohereReranker](reranker/#coherereranker)
  * [HFCrossEncoderReranker](reranker/#hfcrossencoderreranker)
  * [VoyageAIReranker](reranker/#voyageaireranker)
* [LLM Cache](cache/)
  * [SemanticCache](cache/#semanticcache)
  * [LangCacheSemanticCache](cache/#langcachesemanticcache)
  * [Cache Schema Classes](cache/#cache-schema-classes)
* [Embeddings Cache](cache/#embeddings-cache)
  * [EmbeddingsCache](cache/#embeddingscache)
* [LLM Message History](message_history/)
  * [SemanticMessageHistory](message_history/#semanticmessagehistory)
  * [MessageHistory](message_history/#messagehistory)
* [Semantic Router](router/)
  * [Semantic Router](router/#semantic-router-api)
  * [Routing Config](router/#routing-config)
  * [Route](router/#route)
  * [Route Match](router/#route-match)
  * [Distance Aggregation Method](router/#distance-aggregation-method)

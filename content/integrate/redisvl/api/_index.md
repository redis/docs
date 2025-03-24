---
linkTitle: RedisVL API
title: RedisVL API
type: integration
weight: 5
hideListLinks: true
---


Reference documentation for the RedisVL API.



* [Schema](schema/)
  * [IndexSchema](schema/#indexschema)
  * [Defining Fields](schema/#defining-fields)
  * [Supported Field Types and Attributes](schema/#supported-field-types-and-attributes)
* [Search Index Classes](searchindex/)
  * [SearchIndex](searchindex/#searchindex)
  * [AsyncSearchIndex](searchindex/#asyncsearchindex)
* [Query](query/)
  * [VectorQuery](query/#vectorquery)
  * [VectorRangeQuery](query/#vectorrangequery)
  * [FilterQuery](query/#filterquery)
  * [CountQuery](query/#countquery)
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
  * [VertexAITextVectorizer](vectorizer/#vertexaitextvectorizer)
  * [CohereTextVectorizer](vectorizer/#coheretextvectorizer)
  * [BedrockTextVectorizer](vectorizer/#bedrocktextvectorizer)
  * [CustomTextVectorizer](vectorizer/#customtextvectorizer)
  * [VoyageAITextVectorizer](vectorizer/#voyageaitextvectorizer)
* [Rerankers](reranker/)
  * [CohereReranker](reranker/#coherereranker)
  * [HFCrossEncoderReranker](reranker/#hfcrossencoderreranker)
  * [VoyageAIReranker](reranker/#voyageaireranker)
* [LLM Cache](cache/)
  * [SemanticCache](cache/#semanticcache)
* [LLM Session Manager](session_manager/)
  * [SemanticSessionManager](session_manager/#semanticsessionmanager)
  * [StandardSessionManager](session_manager/#standardsessionmanager)
* [Semantic Router](router/)
  * [Semantic Router](router/#semantic-router-api)
  * [Routing Config](router/#routing-config)
  * [Route](router/#route)
  * [Route Match](router/#route-match)
  * [Distance Aggregation Method](router/#distance-aggregation-method)

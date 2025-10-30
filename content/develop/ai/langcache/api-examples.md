---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Learn to use the Redis LangCache API for semantic caching.
hideListLinks: true
linktitle: API and SDK examples
title: Use the LangCache API and SDK
weight: 10
---

Use the [LangCache API]({{< relref "/develop/ai/langcache/api-reference" >}}) from your client app to store and retrieve LLM, RAG, or agent responses.

You can use any standard REST client or library to access the API. If your app is written in Python or Javascript, you can also use the LangCache Software Development Kits (SDKs) to access the API:

- [LangCache SDK for Python](https://pypi.org/project/langcache/)
- [LangCache SDK for Javascript](https://www.npmjs.com/package/@redis-ai/langcache)

## Authentication

To access the LangCache API, you need:

- LangCache API base URL
- LangCache service API key
- Cache ID

When you call the API, you need to pass the LangCache API key in the `Authorization` header as a Bearer token and the Cache ID as the `cacheId` path parameter.

For example:

{{< clients-example set="langcache_sdk" step="imports_setup" dft_tab_name="cURL" footer="hide" >}}
curl -s -X POST "https://$HOST/v1/caches/$CACHE_ID/entries/search" \
    -H "accept: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d '{ "prompt": "What is semantic caching" }'
{{< /clients-example >}}

This example expects several variables to be set in the shell:

- **$HOST** - the LangCache API base URL
- **$CACHE_ID** - the Cache ID of your cache
- **$API_KEY** - The LangCache API token

## Examples

### Search LangCache for similar responses

Use [`POST /v1/caches/{cacheId}/entries/search`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/search" >}}) to search the cache for matching responses to a user prompt.

{{< clients-example set="langcache_sdk" step="search_basic" dft_tab_name="REST API" footer="hide" >}}
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text"
}
{{< /clients-example >}}

Place this call in your client app right before you call your LLM's REST API. If LangCache returns a response, you can send that response back to the user instead of calling the LLM.

If LangCache does not return a response, you should call your LLM's REST API to generate a new response. After you get a response from the LLM, you can [store it in LangCache](#store-a-new-response-in-langcache) for future use.

#### Attributes
You can also scope the responses returned from LangCache by adding an `attributes` object to the request. LangCache will only return responses that match the attributes you specify.

{{< clients-example set="langcache_sdk" step="search_attributes" dft_tab_name="REST API" footer="hide" >}}
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text",
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
{{< /clients-example >}}

#### Search strategies
LangCache supports two search strategies when looking for a cached response:

- **`exact`**: Returns a result only when the stored prompt matches the query exactly (case insensitive).
- `**semantic**`: Uses vector similarity to find semantically similar prompts and responses.

By default, LangCache uses `semantic` search only. You can specify one or more search strategies in the request body.

{{< clients-example set="langcache_sdk" step="search_strategies" dft_tab_name="REST API" footer="hide" >}}
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text",
    "searchStrategies": ["exact", "semantic"]
}
{{< /clients-example >}}

### Store a new response in LangCache

Use [`POST /v1/caches/{cacheId}/entries`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/set" >}}) to store a new response in the cache.

{{< clients-example set="langcache_sdk" step="store_basic" dft_tab_name="REST API" footer="hide" >}}
POST https://[host]/v1/caches/{cacheId}/entries
{
    "prompt": "User prompt text",
    "response": "LLM response text"
}
{{< /clients-example >}}

Place this call in your client app after you get a response from the LLM. This will store the response in the cache for future use.

You can also store the responses with custom attributes by adding an `attributes` object to the request.

{{< clients-example set="langcache_sdk" step="store_attributes" dft_tab_name="REST API" footer="hide" >}}
POST https://[host]/v1/caches/{cacheId}/entries
{
    "prompt": "User prompt text",
    "response": "LLM response text",
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
{{< /clients-example >}}

### Delete cached responses

Use [`DELETE /v1/caches/{cacheId}/entries/{entryId}`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/delete" >}}) to delete a cached response from the cache.

{{< clients-example set="langcache_sdk" step="delete_entry" dft_tab_name="REST API" footer="hide" >}}
DELETE https://[host]/v1/caches/{cacheId}/entries/{entryId}
{{< /clients-example >}}

You can also use [`DELETE /v1/caches/{cacheId}/entries`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/deleteQuery" >}}) to delete multiple cached responses based on the `attributes` you specify. If you specify multiple `attributes`, LangCache will delete entries that contain all given attributes.

{{< warning >}}
If you do not specify any `attributes`, all responses in the cache will be deleted. This cannot be undone.
{{< /warning >}}

<br/>

{{< clients-example set="langcache_sdk" step="delete_query" dft_tab_name="REST API" footer="hide" >}}
DELETE https://[host]/v1/caches/{cacheId}/entries
{
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
{{< /clients-example >}}

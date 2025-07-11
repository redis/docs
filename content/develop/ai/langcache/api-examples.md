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

You can use the LangCache API from your client app to store and retrieve LLM, RAG, or agent responses.

To access the LangCache API, you need:

- LangCache API base URL
- LangCache service API key
- Cache ID

When you call the API, you need to pass the LangCache API key in the `Authorization` header as a Bearer token and the Cache ID as the `cacheId` path parameter. 

For example, to search the cache using `cURL`:

```bash
curl -s -X POST "https://$HOST/v1/caches/$CACHE_ID/entires/search" \
    -H "accept: application/json" \
    -H "Authorization: Bearer $API_KEY" \
    -d "{ 'prompt': 'What is semantic caching' }"
```

- The example expects several variables to be set in the shell:

    - **$HOST** - the LangCache API base URL
    - **$CACHE_ID** - the Cache ID of your cache
    - **$API_KEY** - The LangCache API token

{{% info %}}
This example uses `cURL` and Linux shell scripts to demonstrate the API; you can use any standard REST client or library.
{{% /info %}}

You can also use the [LangCache SDKs](#langcache-sdk) for Javascript and Python to access the API.

## API examples

### Search LangCache for similar responses

Use `POST /v1/caches/{cacheId}/entries/search` to search the cache for matching responses to a user prompt.

```sh
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text"
}
```

Place this call in your client app right before you call your LLM's REST API. If LangCache returns a response, you can send that response back to the user instead of calling the LLM.

If LangCache does not return a response, you should call your LLM's REST API to generate a new response. After you get a response from the LLM, you can [store it in LangCache](#store-a-new-response-in-langcache) for future use.

You can also scope the responses returned from LangCache by adding an `attributes` object to the request. LangCache will only return responses that match the attributes you specify. 

```sh
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text",
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
```

### Store a new response in LangCache

Use `POST /v1/caches/{cacheId}/entries` to store a new response in the cache.

```sh
POST https://[host]/v1/caches/{cacheId}/entries
{
    "prompt": "User prompt text",
    "response": "LLM response text"
}
```

Place this call in your client app after you get a response from the LLM. This will store the response in the cache for future use.

You can also store the responses with custom attributes by adding an `attributes` object to the request.

```sh
POST https://[host]/v1/caches/{cacheId}/entries
{
    "prompt": "User prompt text",
    "response": "LLM response text",
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
```

### Delete cached responses

Use `DELETE /v1/caches/{cacheId}/entries/{entryId}` to delete a cached response from the cache.

You can also use `DELETE /v1/caches/{cacheId}/entries` to delete multiple cached responses at once. If you provide an `attributes` object, LangCache will delete all responses that match the attributes you specify. 

```sh
DELETE https://[host]/v1/caches/{cacheId}/entries
{
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
```
## LangCache SDK

If your app is written in Javascript or Python, you can also use the LangCache Software Development Kits (SDKs) to access the API. 

To learn how to use the LangCache SDKs:

- [LangCache SDK for Javascript](https://www.npmjs.com/package/@redis-ai/langcache)
- [LangCache SDK for Python](https://pypi.org/project/langcache/)

---
alwaysopen: false
categories:
- docs
- operate
- rc
description: null
hideListLinks: true
linktitle: Use LangCache
title: Use the LangCache API with your GenAI app
weight: 10
---

You can use the LangCache API from your client app to store and retrieve LLM responses.

## Call the REST API

To access the LangCache API, you need:

- LangCache API base URL
- LangCache API token
- Cache ID

All of these values are available in the LangCache service's **Configuration** page.

When you call the API, you need to pass the LangCache API token in the `Authorization` header as a Bearer token and the Cache ID as the `cacheId` path parameter. 

For example, to check the health of the cache using `cURL`:

```bash
curl -s -X GET "https://$HOST/v1/caches/$CACHE_ID/health" \
    -H "accept: application/json" \
    -H "Authorization: Bearer $API_KEY"
```

- The example expects several variables to be set in the shell:

    - **$HOST** - the LangCache API base URL
    - **$CACHE_ID** - the Cache ID of your cache
    - **$API_KEY** - The LangCache API token

{{% info %}}
This example uses `cURL` and Linux shell scripts to demonstrate the API; you can use any standard REST client or library.
{{% /info %}}

## Check cache health

Use `GET /v1/caches/{cacheId}/health` to check the health of the cache.

```sh
GET https://[host]/v1/caches/{cacheId}/health
```

## Search LangCache for similar responses

Use `POST /v1/caches/{cacheId}/search` to search the cache for matching responses.

```sh
POST https://[host]/v1/caches/{cacheId}/search
{
    "prompt": "User prompt text"
}
```

Place this call in your client app right before you call your LLM's REST API. If LangCache returns a response, you can send that response back to the user instead of calling the LLM.

If LangCache does not return a response, you should call your LLM's REST API to generate a new response. After you get a response from the LLM, you can [store it in LangCache](#store-a-new-response-in-langcache) for future use.

## Store a new response in LangCache

Use `POST /v1/caches/{cacheId}/entries` to store a new response in the cache.

```sh
POST https://[host]/v1/caches/{cacheId}/entries
{
    "prompt": "User prompt text",
    "response": "LLM response text"
}
```

Place this call in your client app after you get a response from the LLM. This will store the response in the cache for future use.

## Delete cached responses
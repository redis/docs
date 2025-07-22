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

Use the LangCache API from your client app to store and retrieve LLM, RAG, or agent responses.

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

If your app is written in Python or Javascript, you can also use the LangCache Software Development Kits (SDKs) to access the API:

- [LangCache SDK for Python](https://pypi.org/project/langcache/)
- [LangCache SDK for Javascript](https://www.npmjs.com/package/@redis-ai/langcache)

## Examples

### Search LangCache for similar responses

Use [`POST /v1/caches/{cacheId}/entries/search`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/search" >}}}) to search the cache for matching responses to a user prompt.

{{< multitabs id="search-basic"
    tab1="REST API"
    tab2="Python"
    tab3="Javascript" >}}
```sh
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text"
}
```
-tab-sep-
```python
from langcache import LangCache
import os


with LangCache(
    server_url="https://<host>",
    cache_id="<cacheId>",
    service_key=os.getenv("LANGCACHE_SERVICE_KEY", ""),
) as lang_cache:

    res = lang_cache.search(
        prompt="User prompt text",
        similarity_threshold=0.9
    )

    print(res)
```
-tab-sep-
```js
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
  serverURL: "https://<host>",
  cacheId: "<cacheId>",
  serviceKey: "<LANGCACHE_SERVICE_KEY>",
});

async function run() {
  const result = await langCache.search({
    prompt: "User prompt text",
    similarityThreshold: 0.9
  });

  console.log(result);
}

run();
```
{{< /multitabs >}}

Place this call in your client app right before you call your LLM's REST API. If LangCache returns a response, you can send that response back to the user instead of calling the LLM.

If LangCache does not return a response, you should call your LLM's REST API to generate a new response. After you get a response from the LLM, you can [store it in LangCache](#store-a-new-response-in-langcache) for future use.

You can also scope the responses returned from LangCache by adding an `attributes` object to the request. LangCache will only return responses that match the attributes you specify.

{{< multitabs id="search-attributes"
    tab1="REST API"
    tab2="Python"
    tab3="Javascript" >}}
```sh
POST https://[host]/v1/caches/{cacheId}/entries/search
{
    "prompt": "User prompt text",
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
```
-tab-sep-
```python
from langcache import LangCache
import os


with LangCache(
    server_url="https://<host>",
    cache_id="<cacheId>",
    service_key=os.getenv("LANGCACHE_SERVICE_KEY", ""),
) as lang_cache:

    res = lang_cache.search(
        prompt="User prompt text",
        attributes={"customAttributeName": "customAttributeValue"},
        similarity_threshold=0.9,
    )

    print(res)
```
-tab-sep-
```js
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
  serverURL: "https://<host>",
  cacheId: "<cacheId>",
  serviceKey: "<LANGCACHE_SERVICE_KEY>",
});

async function run() {
  const result = await langCache.search({
    prompt: "User prompt text",
    similarityThreshold: 0.9,
    attributes: {
      "customAttributeName": "customAttributeValue",
    },
  });

  console.log(result);
}

run();
```
{{< /multitabs >}}

### Store a new response in LangCache

Use [`POST /v1/caches/{cacheId}/entries`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/set" >}}) to store a new response in the cache.

{{< multitabs id="store-basic"
    tab1="REST API"
    tab2="Python"
    tab3="Javascript" >}}

```sh
POST https://[host]/v1/caches/{cacheId}/entries
{
    "prompt": "User prompt text",
    "response": "LLM response text"
}
```

-tab-sep-

```python
from langcache import LangCache
import os


with LangCache(
    server_url="https://[host]",
    cache_id="{cacheId}",
    service_key=os.getenv("LANGCACHE_SERVICE_KEY", ""),
) as lang_cache:

    res = lang_cache.set(
        prompt="User prompt text",
        response="LLM response text",
    )

    print(res)
```

-tab-sep-

```js
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
  serverURL: "https://<host>",
  cacheId: "<cacheId>",
  serviceKey: "<LANGCACHE_SERVICE_KEY>",
});

async function run() {
  const result = await langCache.set({
    prompt: "User prompt text",
    response: "LLM response text",
  });

  console.log(result);
}

run();
```

{{< /multitabs >}}

Place this call in your client app after you get a response from the LLM. This will store the response in the cache for future use.

You can also store the responses with custom attributes by adding an `attributes` object to the request.

{{< multitabs id="store-attributes"
    tab1="REST API"
    tab2="Python"
    tab3="Javascript" >}}

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
-tab-sep-

```python
from langcache import LangCache
import os


with LangCache(
    server_url="https://[host]",
    cache_id="{cacheId}",
    service_key=os.getenv("LANGCACHE_SERVICE_KEY", ""),
) as lang_cache:

    res = lang_cache.set(
        prompt="User prompt text",
        response="LLM response text",
        attributes={"customAttributeName": "customAttributeValue"},
    )

    print(res)
```

-tab-sep-

```js
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
  serverURL: "https://<host>",
  cacheId: "<cacheId>",
  serviceKey: "<LANGCACHE_SERVICE_KEY>",
});

async function run() {
  const result = await langCache.set({
    prompt: "User prompt text",
    response: "LLM response text",
    attributes: {
      "customAttributeName": "customAttributeValue",
    },
  });

  console.log(result);
}

run();
```

{{< /multitabs >}}

### Delete cached responses

Use [`DELETE /v1/caches/{cacheId}/entries/{entryId}`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/delete" >}}) to delete a cached response from the cache.

{{< multitabs id="delete-entry"
    tab1="REST API"
    tab2="Python"
    tab3="Javascript" >}}

```sh
DELETE https://[host]/v1/caches/{cacheId}/entries/{entryId}
```
-tab-sep-

```python
from langcache import LangCache
import os


with LangCache(
    server_url="https://[host]",
    cache_id="{cacheId}",
    service_key=os.getenv("LANGCACHE_SERVICE_KEY", ""),
) as lang_cache:

    res = lang_cache.delete_by_id(entry_id="{entryId}")

    print(res)
```

-tab-sep-

```js
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
  serverURL: "https://<host>",
  cacheId: "<cacheId>",
  serviceKey: "<LANGCACHE_SERVICE_KEY>",
});

async function run() {
  const result = await langCache.deleteById({
    entryId: "<entryId>",
  });

  console.log(result);
}

run();
```

{{< /multitabs >}}

You can also use [`DELETE /v1/caches/{cacheId}/entries`]({{< relref "/develop/ai/langcache/api-reference#tag/Cache-Entries/operation/deleteQuery" >}}) to delete multiple cached responses based on the `attributes` you specify. If you specify multiple `attributes`, LangCache will delete entries that contain all given attributes. 

{{< warning >}}
If you do not specify any `attributes`, all responses in the cache will be deleted. This cannot be undone.
{{< /warning >}}

<br/>

{{< multitabs id="delete-attributes"
    tab1="REST API"
    tab2="Python"
    tab3="Javascript" >}}

```sh
DELETE https://[host]/v1/caches/{cacheId}/entries
{
    "attributes": {
        "customAttributeName": "customAttributeValue"
    }
}
```

-tab-sep-

```python
from langcache import LangCache
import os


with LangCache(
    server_url="https://[host]",
    cache_id="{cacheId}",
    service_key=os.getenv("LANGCACHE_SERVICE_KEY", ""),
) as lang_cache:

    res = lang_cache.delete_query(
        attributes={"customAttributeName": "customAttributeValue"},
    )

    print(res)
```

-tab-sep-

```js
import { LangCache } from "@redis-ai/langcache";

const langCache = new LangCache({
  serverURL: "https://<host>",
  cacheId: "<cacheId>",
  serviceKey: "<LANGCACHE_SERVICE_KEY>",
});

async function run() {
  const result = await langCache.deleteQuery({
    attributes: {
      "customAttributeName": "customAttributeValue",
    },
  });

  console.log(result);
}

run();
```

{{< /multitabs >}}


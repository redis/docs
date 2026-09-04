---
Title: Self-managed API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Use curl examples with the LangCache self-managed Control Plane and Data Plane APIs.
linkTitle: Self-managed API examples
weight: 70
hideListLinks: true
---

These examples show self-managed Control Plane and Data Plane requests.

They assume either an auth-disabled private Data Plane, the legacy per-cache
token described in [Authentication and authorization]({{< relref "/operate/iris/langcache/self-managed/authentication" >}}),
or agent-key auth for a Control Plane managed cache.

For the complete shared Data Plane schema, see the
[LangCache API]({{< relref "/develop/ai/context-engine/langcache/api-reference" >}}).
For the self-managed admin schema, see the
[Control Plane API reference]({{< relref "/operate/iris/langcache/self-managed/control-plane-api-reference" >}}).

## Control Plane API examples

Set variables:

```bash
CP_URL="http://localhost:9100"
LC_ADMIN_TOKEN="<admin-token>"
```

List caches:

```bash
curl -sS "$CP_URL/v1/caches" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN"
```

Create a cache:

```bash
curl -sS -X POST "$CP_URL/v1/caches" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my-cache",
    "databaseId": "cache-primary",
    "defaultSearchThreshold": 0.9,
    "defaultTtlMillis": -1,
    "attributes": []
  }'
```

Response:

```json
{
  "cacheId": "0123456789abcdef0123456789abcdef"
}
```

`databaseId` must match an entry in the Control Plane's configured
`databases` registry. `defaultSearchThreshold` is a float between 0 and 1.
`defaultTtlMillis` is `-1` for no expiration, or a positive number of
milliseconds.

Get a cache:

```bash
curl -sS "$CP_URL/v1/caches/<cache-id>" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN"
```

Response fields include `status` (`PROVISIONING`, `READY`, or
`UNAVAILABLE`), the deployment's `embeddingProvider`/`embeddingModel`/
`embeddingDimensions`, and the resolved `databaseName`.

Update a cache:

```bash
curl -sS -X PATCH "$CP_URL/v1/caches/<cache-id>" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "defaultSearchThreshold": 0.85
  }'
```

Flush a cache's entries without deleting the cache:

```bash
curl -sS -X DELETE "$CP_URL/v1/caches/<cache-id>/entries" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN"
```

Delete a cache:

```bash
curl -sS -X DELETE "$CP_URL/v1/caches/<cache-id>?flush=true" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN"
```

List the deployment's configured embedding providers and models:

```bash
curl -sS "$CP_URL/v1/embedding-providers" \
  -H "Authorization: Bearer $LC_ADMIN_TOKEN"
```

## Data Plane API examples

Set variables:

```bash
DP_URL="http://localhost:8080"
CACHE_ID="<cache-id>"
LC_TOKEN="<agent-key-or-legacy-token>"
```

For auth-disabled deployments, omit the `Authorization` header and rely on
the deployment's hosting controls.

### Set a cache entry

```bash
curl -sS -X POST "$DP_URL/v1/caches/$CACHE_ID/entries" \
  -H "Authorization: Bearer $LC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What is the capital of France?",
    "response": "The capital of France is Paris."
  }'
```

### Search for a cached response

```bash
curl -sS -X POST "$DP_URL/v1/caches/$CACHE_ID/entries/search" \
  -H "Authorization: Bearer $LC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "What'"'"'s the capital city of France?"
  }'
```

### Delete a specific entry

```bash
curl -sS -X DELETE "$DP_URL/v1/caches/$CACHE_ID/entries/<entry-id>" \
  -H "Authorization: Bearer $LC_TOKEN"
```

### Delete entries matching attributes

```bash
curl -sS -X DELETE "$DP_URL/v1/caches/$CACHE_ID/entries" \
  -H "Authorization: Bearer $LC_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "attributes": {
      "topic": "geography"
    }
  }'
```

### Flush all entries in a cache

```bash
curl -sS -X POST "$DP_URL/v1/caches/$CACHE_ID/flush" \
  -H "Authorization: Bearer $LC_TOKEN"
```

### Check cache health

```bash
curl -sS "$DP_URL/v1/caches/$CACHE_ID/health" \
  -H "Authorization: Bearer $LC_TOKEN"
```

For the full request and response schema for these operations, including
conversational search, see the
[LangCache API reference]({{< relref "/develop/ai/context-engine/langcache/api-reference" >}}).

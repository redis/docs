---
alwaysopen: false
categories:
- docs
- develop
- ai
description: List session metadata by owner or namespace, sort results, and follow pagination.
hideListLinks: true
linktitle: List sessions
title: List and sort sessions
weight: 10
---

Use session listing to let a user reopen an earlier conversation. The session rows contain IDs and available owner, timestamp, and namespace metadata. They do not contain conversation events or summary text. Retrieve the selected session with `GetSessionMemory` to build the agent's conversation context.

## Choose a listing operation

| Result you need | REST endpoint | Python method | TypeScript method |
|:----------------|:--------------|:--------------|:------------------|
| Session IDs | `GET /v1/stores/{storeId}/session-memory` | `list_sessions` | `listSessions` |
| Session rows with sorting | `GET /v1/stores/{storeId}/sessions` | `list_session_summaries` | `listSessionSummaries` |

The second method's name refers to metadata rows, not generated conversation summaries. The ID-only operation remains available. Both operations return `items`, `total`, and an optional `nextPageToken`.

For a user's personal conversations, set `filterOwnerId` to the user's authenticated ID. The session owner is the first event's `actorId`. Add `namespaceRef` to require an exact namespace ID as well. It does not include descendants, deprecated namespace labels, or sessions without a namespace resource. Owner and namespace matching is case-sensitive.

A request without filters must set `includeAll=true`. Do not combine `includeAll=true` with either filter. Authorize store-wide or shared namespace listing in your application before making the request. A filter selects records; it does not establish the caller's right to access them.

## Sort and paginate session rows

The default is `sortBy=updatedAt` and `sortOrder=desc`, so recent activity appears first. `sortBy` accepts `sessionId`, `createdAt`, or `updatedAt`. When omitted, `sortOrder` is `asc` for `sessionId` and `desc` for timestamps. `limit` accepts 1–1000 and defaults to 100.

The examples use Python `redis-agent-memory==0.5.0b1` or TypeScript `@redis-iris/agent-memory@0.4.0-beta.1`. Install that beta explicitly and use a service that supports the endpoint. Set `AGENT_MEMORY_URL`, `STORE_ID`, `API_KEY`, and `OWNER_ID` in your shell. See the [developer guide](/content/develop/ai/context-engine/agent-memory/developer-guide.md#connect-to-a-redis-agent-memory-service) for connection details.

These examples list all pages for one owner, with the most recently updated sessions first:

{{< multitabs id="sorted-session-list" tab1="Python" tab2="TypeScript" tab3="curl" >}}

```python
import asyncio
import os

from redis_agent_memory import AgentMemory


async def main():
    async with AgentMemory(
        os.environ["AGENT_MEMORY_URL"],
        store_id=os.environ["STORE_ID"],
        api_key=os.environ["API_KEY"],
    ) as agent_memory:
        page_token = None
        while True:
            page = await agent_memory.list_session_summaries_async(
                filter_owner_id=os.environ["OWNER_ID"],
                sort_by="updatedAt", sort_order="desc",
                limit=20, page_token=page_token,
            )
            for session in page.items:
                print(session.model_dump_json(by_alias=True))
            page_token = page.next_page_token
            if not page_token:
                break


asyncio.run(main())
```

-tab-sep-

```typescript
import { AgentMemory } from "@redis-iris/agent-memory";

async function main() {
  const { AGENT_MEMORY_URL, STORE_ID, API_KEY, OWNER_ID } = process.env;
  if (!AGENT_MEMORY_URL || !STORE_ID || !API_KEY || !OWNER_ID) {
    throw new Error("Set AGENT_MEMORY_URL, STORE_ID, API_KEY, and OWNER_ID.");
  }
  const agentMemory = new AgentMemory({
    serverURL: AGENT_MEMORY_URL, storeId: STORE_ID, apiKey: API_KEY,
  });
  let pageToken: string | undefined;
  do {
    const page = await agentMemory.listSessionSummaries(
      20, pageToken, OWNER_ID, undefined, undefined, "updatedAt", "desc",
    );
    console.dir(page.items, { depth: null });
    pageToken = page.nextPageToken;
  } while (pageToken);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
```

-tab-sep-

```sh
page_token=''
while :; do
  page=$(curl --fail-with-body --silent --show-error --get \
    --header "Authorization: Bearer $API_KEY" \
    --data-urlencode "filterOwnerId=$OWNER_ID" \
    --data-urlencode 'sortBy=updatedAt' --data-urlencode 'sortOrder=desc' \
    --data-urlencode 'limit=20' --data-urlencode "pageToken=$page_token" \
    "$AGENT_MEMORY_URL/v1/stores/$STORE_ID/sessions") || break
  printf '%s\n' "$page" | jq '.items'
  page_token=$(printf '%s\n' "$page" | jq -r '.nextPageToken // empty')
  [ -n "$page_token" ] || break
done
```

{{< /multitabs >}}

Pass each returned `nextPageToken` as `pageToken`. Keep filters and sort options unchanged; the token is bound to them. Stop when the token is absent. The token is opaque, so URL-encode it in REST requests. Changing a filter or sort requires a new request without the old token.

Legacy sessions can omit `ownerId`, `createdAt`, or `updatedAt`. Handle those missing values when rendering a conversation list. A row's timestamps describe session metadata; they do not promise that background extraction or summarization has completed.

TypeScript uses positional arguments. `listSessionSummaries` takes namespace filtering fourth, followed by `includeAll`, `sortBy`, and `sortOrder`. The older `listSessions` method keeps its previous argument order: `includeAll` is fourth, request options fifth, and the new namespace filter sixth. Do not copy one method's argument positions to the other.

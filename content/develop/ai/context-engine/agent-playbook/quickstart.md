---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Publish an FAQ, retrieve it for an agent, and update the answer with the Python SDK, TypeScript SDK, or HTTP API.
hideListLinks: true
linktitle: Quickstart
title: Agent Playbooks quickstart
weight: 10
---

Publish a FAQ, retrieve its answer to “Where can I see how my refund is progressing?”, and update the answer agents receive.

## Before you begin

Create a playbook API key with `write` and `publish` permissions. Both include `read`.

This walkthrough needs no agent framework or model-provider key.

Follow one tab throughout the page. The SDKs are alpha prereleases pinned to the versions used here. Python requires Python 3.10 or later; TypeScript requires Node.js 20 or later. The HTTP examples use Bash, curl, and jq.

{{< multitabs id="playbook-install" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-agent-playbook==0.1.0a2
```

-tab-sep-

```bash
npm init -y
npm install @redis-iris/agent-playbook@0.1.0-alpha.2
npm install --save-dev tsx typescript @types/node
```

-tab-sep-

```bash
curl --version
jq --version
```

{{< /multitabs >}}

## Save connection values

Export these values in the shell where you run the examples. Use the endpoint's base address, including `https://`, without the `/v1/playbooks/...` path.

```bash
export PLAYBOOK_URL='<data-plane-endpoint>'
export PLAYBOOK_ID='<playbook-id>'
export PLAYBOOK_API_KEY='<playbook-api-key>'
```

Keep keys out of skill files, source control, and model prompts.

## Connect to the playbook

Download the complete example: [Python]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart/" >}}quickstart.py), [TypeScript]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart/" >}}quickstart.mts), or [HTTP]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart/" >}}quickstart.sh). Run `python quickstart.py`, `npx tsx quickstart.mts`, or `bash quickstart.sh` once. The file publishes and retrieves the FAQ, publishes an update, and retains the entry for agent testing.

{{< multitabs id="playbook-connect" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
import os
from redis_agent_playbook import Playbook

playbook = Playbook(
    os.environ["PLAYBOOK_URL"],
    playbook_id=os.environ["PLAYBOOK_ID"],
    api_key=os.environ["PLAYBOOK_API_KEY"],
    retry_config=None,
)
print(playbook.get_playbook_health())
```

-tab-sep-

```typescript
import { Playbook } from "@redis-iris/agent-playbook";

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name}`);
  return value;
}

const playbook = new Playbook({
  serverURL: requiredEnv("PLAYBOOK_URL"),
  playbookId: requiredEnv("PLAYBOOK_ID"),
  apiKey: requiredEnv("PLAYBOOK_API_KEY"),
  retryConfig: { strategy: "none" },
});
console.log(await playbook.getPlaybookHealth());
```

-tab-sep-

```bash
set -euo pipefail
PLAYBOOK_API="${PLAYBOOK_URL%/}/v1/playbooks/$PLAYBOOK_ID"
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .
```

{{< /multitabs >}}

Retries are disabled to avoid repeating an uncertain write. Rerunning the file creates another entry; repeat only reads or searches when testing again. Keep the printed identifier for cleanup.

## 1. Create an FAQ

Create one answer with a locale and topic for retrieval filters. Save the returned entry identifier and version.

{{< multitabs id="playbook-quickstart-create" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
faq_content = {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {
        "faq": {
            "question": "How do I check the status of a refund?",
            "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
        }
    },
}
draft = playbook.create_faq(content=faq_content)
faq_id = draft.entry.entry_id
version = draft.version.version
print(faq_id, version, draft.entry.publication)
```

-tab-sep-

```typescript
const faqContent = {
  intents: ["Check a refund", "Find an existing refund"],
  attributes: { locale: "en-US", topic: "refund" },
  payload: { faq: {
    question: "How do I check the status of a refund?",
    answer: "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number.",
  } },
};
const draft = await playbook.createFaq({ content: faqContent });
const faqId = draft.entry.entryId;
const version = draft.version.version;
console.log(faqId, version, draft.entry.publication);
```

-tab-sep-

```bash
cat > faq.json <<'JSON'
{
  "content": {
    "intents": ["Check a refund", "Find an existing refund"],
    "attributes": {"locale": "en-US", "topic": "refund"},
    "payload": {"faq": {
      "question": "How do I check the status of a refund?",
      "answer": "Open the order in your order history and select Refund status. If no refund is listed, contact support with your order number."
    }}
  }
}
JSON
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq.json > draft.json
FAQ_ID=$(jq -er '.entry.entryId' draft.json)
VERSION=$(jq -er '.version.version' draft.json)
jq '{entryId: .entry.entryId, version: .version.version, publication: .entry.publication}' draft.json
```

{{< /multitabs >}}

The first version is `1`, and `publication` is absent or empty. You can review the entry, but search and discovery cannot return it yet.

## 2. Review and publish the answer

Read the exact version you created.

{{< multitabs id="playbook-quickstart-publish" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
stored = playbook.get_faq_version(faq_id=faq_id, version=version)
print(stored.content)
```

-tab-sep-

```typescript
const stored = await playbook.getFaqVersion(faqId, version);
console.log(stored.content);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_API/faqs/$FAQ_ID/versions/$VERSION" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" | jq .content
```

{{< /multitabs >}}

Review the question and answer. Then publish the version you read.

{{< multitabs id="playbook-quickstart-publication" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_faq(faq_id=faq_id, version=version)
```

-tab-sep-

```typescript
await playbook.publishFaq(faqId, { version });
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq -n --argjson version "$VERSION" '{version: $version}')" | jq .publication
```

{{< /multitabs >}}

The publication response identifies the version that agents can retrieve.

## 3. Search with a different question

Search with a paraphrase of the stored question.

{{< multitabs id="playbook-quickstart-search" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
results = playbook.search_faqs(
    query="Where can I see how my refund is progressing?",
    filter_={"eq": {"name": "locale", "value": "en-US"}},
    limit=5,
)
for match in results.matches:
    if match.faq is not None:
        print(match.entry_id, match.version, match.score, match.faq.answer)
```

-tab-sep-

```typescript
const results = await playbook.searchFaqs({
  query: "Where can I see how my refund is progressing?",
  filter: { eq: { name: "locale", value: "en-US" } },
  limit: 5,
});
for (const match of results.matches) {
  if (match.faq) {
    console.log(match.entryId, match.version, match.score, match.faq.answer);
  }
}
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where can I see how my refund is progressing?","filter":{"eq":{"name":"locale","value":"en-US"}},"limit":5}' \
  | jq '.matches[] | {entryId, version, score, answer: .faq.answer}'
```

{{< /multitabs >}}

Check for your entry identifier, version `1`, and the answer about order history. Scores and rankings vary with the embedding model and other entries. If no match appears, repeat only the search after a short wait, then check the locale filter and [similarity threshold]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#control-relevance-and-result-count" >}}).

## 4. Discover FAQs for an agent

Discovery returns FAQ answers and skill previews in one request. This example filters for refund guidance to add to the agent's context.

{{< multitabs id="playbook-quickstart-discover" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
discovery = playbook.discover_entries(
    query="Help a customer find their refund status",
    filter_={"eq": {"name": "topic", "value": "refund"}},
)
print(discovery.model_dump_json(by_alias=True, indent=2))
```

-tab-sep-

```typescript
const discovery = await playbook.discoverEntries({
  query: "Help a customer find their refund status",
  filter: { eq: { name: "topic", value: "refund" } },
});
console.log(JSON.stringify(discovery, null, 2));
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/discover" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Help a customer find their refund status","filter":{"eq":{"name":"topic","value":"refund"}}}' | jq .
```

{{< /multitabs >}}

With no pins, `pinnedEntries` is empty. Matching published entries appear in `discoveredEntries`. When you add skills later, discovery returns their previews without loading all their instructions.

## 5. Publish an updated answer

Append a complete replacement version to the same entry. Include the attributes and intents you want to retain.

{{< multitabs id="playbook-quickstart-update" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
from copy import deepcopy

updated_content = deepcopy(faq_content)
updated_content["payload"]["faq"]["answer"] += " Support can check the current stage but cannot guarantee a bank posting date."
updated = playbook.append_faq_version(faq_id=faq_id, content=updated_content)
print("Review this version:", updated.version.version, updated.version.content)
```

-tab-sep-

```typescript
const updatedContent = structuredClone(faqContent);
updatedContent.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date.";
const updated = await playbook.appendFaqVersion(faqId, { content: updatedContent });
console.log("Review this version:", updated.version.version, updated.version.content);
```

-tab-sep-

```bash
jq '.content.payload.faq.answer += " Support can check the current stage but cannot guarantee a bank posting date."' \
  faq.json > faq-update.json
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/$FAQ_ID/versions" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' --data-binary @faq-update.json > updated.json
jq .version updated.json
```

{{< /multitabs >}}

The identifier stays the same, and search still serves the first publication. Review and publish the new version, then search again.

{{< multitabs id="playbook-quickstart-republish" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.publish_faq(faq_id=faq_id, version=updated.version.version)
updated_results = playbook.search_faqs(
    query="Where can I see how my refund is progressing?",
    filter_={"eq": {"name": "locale", "value": "en-US"}},
    limit=5,
)
for match in updated_results.matches:
    if match.entry_id == faq_id and match.faq is not None:
        print("Published answer:", match.version, match.faq.answer)
```

-tab-sep-

```typescript
await playbook.publishFaq(faqId, { version: updated.version.version });
const updatedResults = await playbook.searchFaqs({
  query: "Where can I see how my refund is progressing?",
  filter: { eq: { name: "locale", value: "en-US" } },
  limit: 5,
});
for (const match of updatedResults.matches) {
  if (match.entryId === faqId && match.faq) {
    console.log("Published answer:", match.version, match.faq.answer);
  }
}
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X PUT "$PLAYBOOK_API/faqs/$FAQ_ID/publication" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data "$(jq '{version: .version.version}' updated.json)" | jq .publication
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_API/faqs/search" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY" \
  -H 'Content-Type: application/json' \
  --data '{"query":"Where can I see how my refund is progressing?","filter":{"eq":{"name":"locale","value":"en-US"}},"limit":5}' \
  | jq --arg id "$FAQ_ID" '.matches[] | select(.entryId == $id) | {version, answer: .faq.answer}'
```

{{< /multitabs >}}

The result for your FAQ should now identify version `2` and include the added sentence about bank posting dates. If it still shows version `1` or is absent, repeat only the search.

## Clean up

Keep the sample published while testing [an agent]({{< relref "/develop/ai/context-engine/agent-playbook/mcp" >}}). The downloads omit cleanup. When you finish, delete the FAQ and its versions. If you used a download, start a new script with the client setup and use the printed entry identifier for deletion. [Withdraw it]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#withdraw-or-delete-an-faq" >}}) instead to retain history.

{{< multitabs id="playbook-quickstart-delete" tab1="Python" tab2="TypeScript" tab3="HTTP" >}}

```python
playbook.delete_faq(faq_id=faq_id)
```

-tab-sep-

```typescript
await playbook.deleteFaq(faqId);
```

-tab-sep-

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$PLAYBOOK_API/faqs/$FAQ_ID" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"
```

{{< /multitabs >}}

## Use Python asynchronously

Every Python SDK operation has an `_async` counterpart. This standalone example uses `async with` to close connections after the search. Save it as `async_search.py` and run `python async_search.py` with the same environment variables and a reader key. Keep an FAQ published to test matching.

```python
import asyncio
import os
from redis_agent_playbook import Playbook

async def main():
    async with Playbook(
        os.environ["PLAYBOOK_URL"],
        playbook_id=os.environ["PLAYBOOK_ID"],
        api_key=os.environ["PLAYBOOK_API_KEY"],
        retry_config=None,
        timeout_ms=30_000,
    ) as playbook:
        results = await playbook.search_faqs_async(
            query="Where can I see how my refund is progressing?", limit=5,
        )
        for match in results.matches:
            if match.faq is not None:
                print(match.faq.answer)

asyncio.run(main())
```

`timeout_ms` sets a request timeout in milliseconds on the client or an individual operation. For custom headers, proxies, or transport settings, pass an `httpx.Client` as `client` or an `httpx.AsyncClient` as `async_client`. You own and close a client you supply. See the [Python SDK's custom HTTP client documentation](https://pypi.org/project/redis-agent-playbook/0.1.0a2/#custom-http-client) for configuration examples.

## Next steps

- [Manage FAQs]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs" >}}) to roll back or withdraw an answer.
- [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/skills" >}}) to publish a procedure and load supporting files.
- [Review proposals]({{< relref "/develop/ai/context-engine/agent-playbook/proposals" >}}) to accept suggested answers before publishing them.
- [Connect with MCP]({{< relref "/develop/ai/context-engine/agent-playbook/mcp" >}}) to retrieve this knowledge through agent tools.

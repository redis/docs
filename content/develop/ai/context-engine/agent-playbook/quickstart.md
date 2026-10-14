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

**Python**

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install redis-agent-playbook==0.1.0a2
```

**TypeScript**

```bash
npm init -y
npm install @redis-iris/agent-playbook@0.1.0-alpha.2
npm install --save-dev tsx typescript @types/node
```

**HTTP**

```bash
curl --version
jq --version
```

## Save connection values

Export these values in the shell where you run the examples. Use the endpoint's base address, including `https://`, without the `/v1/playbooks/...` path.

```bash
export PLAYBOOK_URL='<data-plane-endpoint>'
export PLAYBOOK_ID='<playbook-id>'
export PLAYBOOK_API_KEY='<playbook-api-key>'
```

Keep keys out of skill files, source control, and model prompts.

## Connect to the playbook

Expand an example to copy the complete program. Save it as `quickstart.py`, `quickstart.mts`, or `quickstart.sh`, then run `python quickstart.py`, `npx tsx quickstart.mts`, or `bash quickstart.sh`.

{{< clients-example set="iris_playbook_quickstart" step="playbook-connect" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Retries are disabled to avoid repeating an uncertain write. Rerunning the file creates another entry; repeat only reads or searches when testing again. Keep the printed identifier for cleanup.

## 1. Create an FAQ

Create one answer with a locale and topic for retrieval filters. Save the returned entry identifier and version.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-create" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The first version is `1`, and `publication` is absent or empty. You can review the entry, but search and discovery cannot return it yet.

## 2. Review and publish the answer

Read the exact version you created.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-publish" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Review the question and answer. Then publish the version you read.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-publication" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The publication response identifies the version that agents can retrieve.

## 3. Search with a different question

Search with a paraphrase of the stored question.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-search" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

Check for your entry identifier, version `1`, and the answer about order history. Scores and rankings vary with the embedding model and other entries. If no match appears, repeat only the search after a short wait, then check the locale filter and [similarity threshold]({{< relref "/develop/ai/context-engine/agent-playbook/retrieval#control-relevance-and-result-count" >}}).

## 4. Discover FAQs for an agent

Discovery returns FAQ answers and skill previews in one request. This example filters for refund guidance to add to the agent's context.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-discover" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

With no pins, `pinnedEntries` is empty. Matching published entries appear in `discoveredEntries`. When you add skills later, discovery returns their previews without loading all their instructions.

## 5. Publish an updated answer

Append a complete replacement version to the same entry. Include the attributes and intents you want to retain.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-update" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The identifier stays the same, and search still serves the first publication. Review and publish the new version, then search again.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-republish" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

The result for your FAQ should now identify version `2` and include the added sentence about bank posting dates. If it still shows version `1` or is absent, repeat only the search.

## Clean up

Keep the sample published while testing [an agent]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}). Complete-program copies retain the FAQ. When you finish, set `PLAYBOOK_FAQ_ID` to the printed entry identifier and run the deletion example with the same connection values. [Withdraw it]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs#withdraw-or-delete-an-faq" >}}) instead to retain history.

{{< clients-example set="iris_playbook_quickstart_delete" step="playbook-quickstart-delete" description="" lang_filter="Python (Iris),TypeScript (Iris),cURL (Iris)" footer="hide" />}}

## Use Python asynchronously

Every Python SDK operation has an `_async` counterpart. This standalone example uses `async with` to close connections after the search. Save it as `async_search.py` and run `python async_search.py` with the same environment variables and a reader key. Keep an FAQ published to test matching.

{{< clients-example set="iris_playbook_async" step="playbook-async-search" description="" lang_filter="Python (Iris)" footer="hide" />}}

`timeout_ms` sets a request timeout in milliseconds on the client or an individual operation. For custom headers, proxies, or transport settings, pass an `httpx.Client` as `client` or an `httpx.AsyncClient` as `async_client`. You own and close a client you supply. See the [Python SDK's custom HTTP client documentation](https://pypi.org/project/redis-agent-playbook/0.1.0a2/#custom-http-client) for configuration examples.

## Next steps

- [Manage FAQs]({{< relref "/develop/ai/context-engine/agent-playbook/manage-faqs" >}}) to roll back or withdraw an answer.
- [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbook/manage-skills" >}}) to publish a procedure and load supporting files.
- [Review proposals]({{< relref "/develop/ai/context-engine/agent-playbook/proposals" >}}) to accept suggested answers before publishing them.
- [Integrate with an agent]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}) to retrieve context before a turn and load skills through MCP.

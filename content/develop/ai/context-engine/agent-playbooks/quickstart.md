---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Publish an FAQ, retrieve it for an agent, and update the answer with Python, HTTP, or the Iris CLI.
hideListLinks: true
linktitle: Quickstart
title: Redis Agent Playbooks quickstart
weight: 10
---

Use Redis Agent Playbooks to publish a FAQ, retrieve its answer to “Where can I see how my refund is progressing?”, and update the answer agents receive.

## Before you begin

[Create a playbook](/content/operate/iris/agent-playbook/create-playbook.md) and wait until it is **Ready**. [Create an authoring key](/content/operate/iris/agent-playbook/create-playbook.md#give-an-agent-access) with `write` and `publish` permissions. Both include `read`.

This walkthrough needs no agent framework or model-provider key.

Follow one tab throughout the page. The Python SDK and command-line interface (CLI) require Python 3.11 or later. The cURL and CLI examples use Bash and jq.

## Connect to the playbook

1. For Python or CLI examples, install the unified package:

    ```bash
    python -m venv .venv
    source .venv/bin/activate
    python -m pip install 'redis-iris>=1.0.0'
    ```

1. Copy the **Endpoint** and **Playbook ID** from the console's [Connect dialog](/content/operate/iris/agent-playbook/create-playbook.md#give-an-agent-access). Save them with your authoring key in `.env`. Replace the placeholders in this file. Use the endpoint's base address, including `https://`, without the `/iris/data/v1/agent-playbooks/...` path.

    ```dotenv
    IRIS_AGENT_PLAYBOOKS_URL='<data-plane-endpoint>'
    IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID='<playbook-id>'
    IRIS_AGENT_PLAYBOOKS_API_KEY='<playbook-api-key>'
    ```

1. Load the file in the shell where you run the examples:

    ```bash
    set -a; source .env; set +a
    ```

1. Expand an example to copy the complete program. Save it as `quickstart.py`, `quickstart.cli.sh`, or `quickstart.sh` (cURL), then run `python quickstart.py`, `bash quickstart.cli.sh`, or `bash quickstart.sh`.

Keep `.env` out of source control and keys out of skill files and model prompts. Use [`iris.toml` profiles](/content/develop/ai/context-engine/sdk-and-cli.md) for several deployments. All three clients use the authoring key in `.env` for this walkthrough.

`AgentPlaybooks.from_env()` reads the connection values. Its public `.client` property exposes authoring, search, and review operations. The CLI reads the same environment variables and uses `--json` when saving or processing responses.

{{< clients-example set="iris_playbook_quickstart" step="playbook-connect" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Keep the printed identifier for cleanup. SDK and cURL examples create another entry when rerun. The CLI uses `refund-status` as a stable entry key: `faqs push` creates missing content, appends changed content, and skips unchanged content. Start with an unused key for this walkthrough. After an uncertain write, inspect entry state before retrying.

## Create an FAQ

Create one answer with a locale and topic for retrieval filters. Save the returned entry identifier and version.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-create" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The first version is `1`, and `publication` is absent or empty. You can review the entry, but search and discovery cannot return it yet.

The CLI prepares a flat FAQ JSON file and validates it locally before pushing it. Its result is an action report containing the entry identifier and version, rather than the HTTP creation response. `push` leaves the version unpublished unless you request publication.

## Review and publish the answer

Read the exact version you created.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-publish" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Review the question and answer. Then publish the version you read.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-publication" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The publication response identifies the version that agents can retrieve.

## Search with a different question

Search with a paraphrase of the stored question.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-search" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

Check for your entry identifier, version `1`, and the answer about order history. Scores and rankings vary with the embedding model and other entries. If no match appears, repeat only the search after a short wait, then check the locale filter and [similarity threshold]({{< relref "/develop/ai/context-engine/agent-playbooks/retrieval#control-relevance-and-result-count" >}}).

## Discover FAQs for an agent

Discovery returns FAQ answers and skill previews in one request. This example filters for refund guidance to add to the agent's context.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-discover" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

With no pins, `pinnedEntries` is empty. Matching published entries appear in `discoveredEntries`. Python exposes these collections as `discovery.pinned` and `discovery.discovered`; `as_prompt()` formats them for agent context. When you add skills later, discovery returns their previews without loading all their instructions.

## Publish an updated answer

Append a complete replacement version to the same entry. Include the attributes and intents you want to retain.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-update" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The identifier stays the same, and search still serves the first publication. Review and publish the new version, then search again.

{{< clients-example set="iris_playbook_quickstart" step="playbook-quickstart-republish" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

The result for your FAQ should now identify version `2` and include the added sentence about bank posting dates. If it still shows version `1` or is absent, repeat only the search.

## Clean up

Keep the sample published while testing [an agent]({{< relref "/develop/ai/context-engine/agent-playbooks/agent-integration" >}}). Complete-program copies retain the FAQ. When you finish, set `PLAYBOOK_FAQ_ID` to the printed entry identifier and run the deletion example with the same connection values. [Withdraw it]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs#withdraw-or-delete-an-faq" >}}) instead to retain history.

{{< clients-example set="iris_playbook_quickstart_delete" step="playbook-quickstart-delete" description="" lang_filter="Python (Iris),CLI (Iris),cURL (Iris)" footer="hide" />}}

## Use Python asynchronously

Unified Python helpers use names such as `adiscover` and `askill`. Generated operations on `.client` use an `_async` suffix. This standalone example uses `async with` to close connections after the search. Save it as `async_search.py` and run `python async_search.py` with the same environment variables and a reader key. Keep an FAQ published to test matching.

{{< clients-example set="iris_playbook_async" step="playbook-async-search" description="" lang_filter="Python (Iris)" footer="hide" />}}

`AgentPlaybooksSettings.timeout` sets the request timeout in seconds. Generated `.client` operations accept `timeout_ms` in milliseconds. For custom transport settings, construct a generated client and pass it to `AgentPlaybooks(client=...)`. See the [generated client's custom HTTP client documentation](https://pypi.org/project/redis-agent-playbook/#custom-http-client) for ownership and configuration details.

## Next steps

- [Manage FAQs]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-faqs" >}}) to roll back or withdraw an answer.
- [Manage skills]({{< relref "/develop/ai/context-engine/agent-playbooks/manage-skills" >}}) to publish a procedure and load supporting files.
- [Review proposals]({{< relref "/develop/ai/context-engine/agent-playbooks/proposals" >}}) to accept suggested answers before publishing them.
- [Integrate with an agent]({{< relref "/develop/ai/context-engine/agent-playbooks/agent-integration" >}}) to retrieve context before a turn and load skills through MCP.

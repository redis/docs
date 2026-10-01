---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Use filters, pinned entries, similarity thresholds, and preview budgets to control retrieval.
hideListLinks: true
linktitle: Control discovery
title: Control discovery
weight: 40
---

Use discovery to retrieve published skills and frequently asked questions (FAQs) for a task. It returns ordered `pinnedEntries` and ranked `discoveredEntries`. FAQ results include answers; skill results contain previews that an agent can choose to load.

## Filter by attributes

Set `content.attributes` when authoring entries. For example, use `locale` and `topic` to select content for a particular audience. Filters apply exact, typed comparisons to attributes; they do not search `metadata` or replace access grants.

This example uses the Python software development kit (SDK) from the [quickstart]({{< relref "/develop/ai/context-engine/agent-playbooks/quickstart" >}}) and your reader key:

```python
import os
from redis_agent_playbook import Playbook

with Playbook(
    os.environ["PLAYBOOK_URL"],
    playbook_id=os.environ["PLAYBOOK_ID"],
    api_key=os.environ["PLAYBOOK_READ_API_KEY"],
    retry_config=None,
    timeout_ms=10000,
) as client:
    result = client.discover_entries(
        query="Where is my refund?",
        filter_={"and_": [
            {"eq": {"name": "locale", "value": "en-US"}},
            {"eq": {"name": "topic", "value": "refund"}},
        ]},
        limit=5,
    )
    for entry in result.discovered_entries:
        print(entry.entry_id, entry.version)
    print("Count limit:", result.truncated)
    print("Preview budget:", result.budget_truncated)
```

In direct requests and Model Context Protocol (MCP) calls, use `and` and `or` instead of Python's `and_` and `or_`. Each filter node has one operator: `and`, `or`, or `eq`. Boolean `true` differs from the string `"true"`.

## Pin required entries

Use `pinned_entries` when an agent needs known published content regardless of query relevance. Each pin specifies exactly one of `entry_id` or `entry_key`.

Pins bypass semantic ranking and the request filter. They consume result slots and preview budget. A missing, unpublished, duplicate, or oversized pin fails the request. Choose pins that belong to the request's audience and locale.

## Configure relevance and result count

An administrator sets discovery defaults through the [control-plane application programming interface (API)]({{< relref "/operate/iris/agent-playbooks/control-plane-api-reference" >}}):

| Setting | Default | Effect |
|:--------|:--------|:-------|
| `discovery.faqMinimumScore` | `0.7` | Minimum similarity for FAQ results. |
| `discovery.skillMinimumScore` | `0.7` | Minimum similarity for skill results. |
| `discovery.maxResults` | `10` | Combined discovery limit, including pins; range `1`–`50`. |
| `discovery.maxPreviewTokens` | Disabled | Estimated token ceiling for discovery previews; minimum configured value `64`. |

The request's `limit` can reduce the discovery result count. It cannot exceed `maxResults`. Type-specific `search_faqs` and `search_skills` accept their own `minimum_score` and explicit `limit`.

Similarity is a ranking signal, not a probability that an answer is correct. Test thresholds against representative tasks, paraphrases, and irrelevant requests.

## Limit preview size

`maxPreviewTokens` limits the discovery payload. It excludes model framing, conversation history, loaded instructions, and fetched files. Your application still controls the model's total context size.

| Result | Meaning |
|:-------|:--------|
| `truncated: true` | The fetched candidate set exceeded the available result slots. |
| `budgetTruncated: true` | One or more previews were omitted to fit the token ceiling. |
| Empty results with budget truncation | Matching content was omitted; it does not mean nothing matched. |

To fit more content, shorten previews or ask an administrator to raise the ceiling. Increasing `limit` does not raise it. Omitting the ceiling in a policy update preserves it; setting it to `null` disables it.

Before release, test an empty result, a long answer that exceeds the budget, a wrong-locale filter, and a skill republished between discovery and loading.

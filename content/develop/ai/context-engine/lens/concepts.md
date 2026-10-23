---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Understand sessions, turns, steps, fetched and used context, outcomes, agents, content capture, and retention in Lens.
hideListLinks: true
linktitle: Concepts
title: Lens concepts
weight: 5
---

Lens records each agent turn as one trace. It shows what your agent retrieved, what entered the prompt, which model and tool calls it made, and how the turn ended.

## Sessions, threads, and turns

A **turn** is one agent exchange: a user message in, an answer out. Lens records each turn as one OpenTelemetry (OTel) trace, and the trace ID is the turn ID.

A **session** groups the turns of one conversation. A **thread** is a sequence of turns within a session. You choose the session and thread IDs and pass them when you open a turn. When you omit the thread ID, Lens uses the session ID.

Use opaque values, such as internal IDs or hashes, for session, thread, user, and agent IDs.

<!-- TODO: add lens-turn.svg: one turn as its steps (memory recall, Playbook discovery, prompt assembly, model call, Context Gateway tool call, outcome). -->

## What a turn records

Each operation in a turn is a **step**. A turn can include these steps:

| Step | What Lens records |
| ---- | ----------------- |
| Retrieval | The query, the data source, and each result's ID, score, and text. |
| Memory recall | A retrieval from long-term memory, with the same details. |
| Prompt assembly | Which retrieved items entered the prompt. |
| Model call | The prompt, the completion, and token counts. |
| Tool call | The tool, its input, its result, and how long it took. |
| Iris product call | Agent Memory, Agent Playbooks, and Context Gateway calls. These products record their own steps. |
| Custom step | Any operation you wrap yourself. |

Every step records its timing and whether it succeeded. See [Instrument an agent](/content/develop/ai/context-engine/lens/instrument.md) to record each kind of step.

## Fetched and used context

Lens compares what a source returned with what reached the model:

- **Fetched** items are everything a retrieval or memory recall returned.
- **Used** items are the fetched items that entered the prompt.

When you record prompt assembly, Lens marks each source's results as entered the prompt, fetched but not used, or returned empty. This shows when a relevant result was retrieved but dropped, for example at a token limit.

Lens also records each result's score where the source provides one. Agent Playbooks discovery results include their similarity score, and Context Gateway results include their hybrid search score. Your own retrievals include the scores you record. Lens groups scores into high, medium, and low bands, and records the similarity threshold a request set.

## Turn outcomes

Set an outcome on each turn to record how it ended. You can then filter sessions by outcome.

| Outcome | Use it when |
| ------- | ----------- |
| `completed` | The agent finished its answer. |
| `failed` | An error stopped the turn. |
| `abandoned` | The user left before the turn finished. |
| `refused` | The agent declined the request. |
| `timeout` | The turn ran out of time. |

## Agents

Each agent has an **agent ID**, set once per process or per turn. One Lens instance holds the sessions of all your agents, and you choose an agent to view its sessions.

## Content capture

Lens captures content by default: prompts, completions, queries, retrieved text, memory text, FAQ answers, skill text, and tool inputs and results.

You can turn content capture off. Lens then keeps each step's IDs, content hashes, counts, sizes, timing, and outcome. Fetched and used comparisons still work, because Lens compares hashes. See [Configure Lens](/content/develop/ai/context-engine/lens/configure.md).

## Retention

Lens keeps turn structure, timing, scores, and outcomes for the full retention window. Captured text has a shorter window. Your administrator sets both windows.
<!-- TODO: link the operator retention settings when the operator pages exist. -->

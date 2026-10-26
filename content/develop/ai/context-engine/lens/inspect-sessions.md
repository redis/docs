---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Find a session in the Lens UI and read each turn's steps, timing, and captured content.
hideListLinks: true
linktitle: Inspect sessions
title: Inspect sessions
weight: 25
---

Use the Lens user interface (UI) to find a session, open a turn, and see what happened at each step.

## Connect to Lens

Open Lens. If Lens asks for a credential, paste your read key and select **Connect**.
<!-- TODO: describe where to open Lens on Redis Cloud and self-managed when the operator pages exist. -->

## Find a session

1. Select an agent. Lens lists that agent's sessions, newest activity first.
1. Choose a time range. Lens offers the ranges your instance retains.
1. To narrow the loaded sessions, search by any part of a session ID or user ID.

Each session shows its number of turns, its user IDs, and the outcomes of its turns. To search a whole time range by session ID prefix, user ID, or outcome, use the [read application programming interface (API)](/content/develop/ai/context-engine/lens/read-api.md#list-sessions).

## Read a turn's steps

Select a session to see its turns, then expand a turn. Lens shows the turn's steps as a timeline, in the order they ran:

- Each step shows its name and how long it took. Steps that ran at the same time appear together.
- Recall steps list each result with its score, where the source provides one, and mark it **Entered prompt** or **Not used**.
- Iris service steps show the service and the operation, such as an Agent Playbooks discovery or a Context Gateway tool call.

Select a recall, tool, or Iris service step to open its details, including the request and result Lens captured for it.

## View captured content

Step details show the text Lens captured, such as the recall query, each result, and tool input and output. When text isn't available, the step says why:

| Label | Meaning |
| ----- | ------- |
| Content expired | The text is older than the content retention window. |
| Content not captured | Content capture was off when the turn ran. |
| Content could not be fetched | Lens couldn't load the text. Try again later. |

See [content capture](/content/develop/ai/context-engine/lens/concepts.md#content-capture) and [retention](/content/develop/ai/context-engine/lens/concepts.md#retention).

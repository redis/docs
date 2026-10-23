---
alwaysopen: false
categories:
- docs
- develop
- ai
description: List agents and sessions, and read turns and their captured content with the Lens read API.
hideListLinks: true
linktitle: Read API
title: Query sessions and turns
weight: 35
---

Use the Lens read application programming interface (API) to list sessions and read turns from code, for example to export failed turns or build your own reports. The Python examples use the Lens read client:

```bash
python -m pip install redis-agent-lens
```

The cURL examples use Bash and jq. Every operation is a `GET` request.

## Authenticate

Export the read endpoint, your instance ID, and a read key:

```bash
export LENS_URL='<lens-read-endpoint>'
export LENS_INSTANCE_ID='<lens-instance-id>'
export LENS_API_KEY='<lens-read-key>'
```

The read client reads its key from `LENS_API_KEY` and sends it as a bearer token. Every operation is scoped to your instance:

{{< clients-example set="iris_lens_read_api" step="connect" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

## List agents

List every agent with at least one retained session:

{{< clients-example set="iris_lens_read_api" step="list_agents" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

## List sessions

List one agent's sessions over a time range, newest activity first. This example lists the sessions with a failed turn in the last 24 hours, then follows the cursor to the next page:

{{< clients-example set="iris_lens_read_api" step="list_sessions" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

| Parameter | Description |
| --------- | ----------- |
| `agentId` | Required. The agent whose sessions to list. |
| `range` | Required. A lookback duration such as `24h`, `7d`, or `30d`. |
| `sessionIdPrefix` | Sessions whose ID starts with this value, ignoring case. At least 2 characters. |
| `userId` | Sessions with this user ID, ignoring case. |
| `outcome` | Sessions with a turn that has any of these outcomes. Use `unset` for turns without an outcome. |
| `limit` | Sessions per page, up to 200. Default 50. |
| `cursor` | The `nextCursor` value from the previous page. |

The Python client uses the same parameters in snake_case, such as `agent_id` and `session_id_prefix`.

Lens fits the range to your instance's retention. The response returns the range it used as `effectiveRange`, and the ranges your instance supports as `availableRanges`.

To read the next page, pass `nextCursor` with the same filters. When `nextCursor` is absent, you have the last page. A cursor expires after 5 minutes without use; start again from the first page.

## Get a session

Read a session's threads, turn summaries, and outcome counts:

{{< clients-example set="iris_lens_read_api" step="get_session" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Each turn summary includes the turn ID, outcome, duration, number of steps, and token counts.

## Get a turn

Read one turn by its ID. The response includes the turn's steps, token counts, outcome, and its **context manifest**: one entry per retrieval step, with what it fetched and what the prompt used.

{{< clients-example set="iris_lens_read_api" step="get_turn" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

Each manifest entry has one of these states:

| State | Meaning |
| ----- | ------- |
| `entered-prompt` | At least one result entered the prompt. |
| `fetched-not-used` | The source returned results, and none entered the prompt. |
| `invoked-empty` | The source returned no results. |
| `not-instrumented` | The turn recorded no prompt assembly, or the results had no text to match. |

Each candidate in an entry includes its ID, score where the source provides one, and whether it entered the prompt.

## Get captured content

Captured text, such as a retrieved document or a model prompt, is stored by content hash. Read it with the turn ID and the hash from the turn:

{{< clients-example set="iris_lens_read_api" step="get_content" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The response's `availability` is `available` with the text in `body`, or says why the text isn't available, such as `expired` or `not-captured`. See [retention](/content/develop/ai/context-engine/lens/concepts.md#retention).

## Get a Context Gateway tool result

Read the result of a Context Gateway tool call in a turn, by the step's ID. The turn lists these steps in `contextRetrieverToolSteps`:

{{< clients-example set="iris_lens_read_api" step="gateway_result" description="" lang_filter="Python (Iris),cURL (Iris)" footer="hide" />}}

The result classifies what the tool returned, such as `records` or `aggregate`, and includes the returned data.

## Next steps

- See the [API reference](/content/develop/ai/context-engine/lens/api-reference.md) for every field.
- See [Limits and errors](/content/develop/ai/context-engine/lens/limits.md) for request limits and error responses.

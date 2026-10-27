---
alwaysopen: false
categories:
- docs
- develop
- ai
description: Connect an application to Redis Intent Router and work with intents through Python, the Iris CLI, or HTTP.
hideListLinks: true
linktitle: Developer guide
title: Redis Intent Router developer guide
weight: 5
---

Use the Python package, the Iris command-line interface (CLI), or Hypertext Transfer Protocol (HTTP) requests to author intents, match queries, and administer Routers.

## Integration workflow

1. Get a Router's data-plane endpoint, its ID, and an agent key with a grant on it.
1. Author the Router's intents and their example phrasings.
1. Match each incoming query and dispatch on the target of the best intent.
1. Add examples for the queries that match the wrong intent or none.

Platform teams create the Router and the agent keys. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md).

## Choose a client

| Client | Use it when | Package and guide |
|:-------|:------------|:------------------|
| Python | Your application or agent uses Python. | Install [`redis-iris`](https://pypi.org/project/redis-iris/) and follow the [quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md). `IntentRouter` matches queries and authors intents, and its `service` property administers Routers. Its `client` property is the generated client, for a call the library doesn't wrap. |
| CLI | You work from a shell, a script, or continuous integration. | The `iris intent-router` commands ship in the same [`redis-iris`](https://pypi.org/project/redis-iris/) package. |
| HTTP | You need language-independent access or don't want a package dependency. | No package required. Send requests as shown in the [API reference](/content/develop/ai/context-engine/intent-router/api-reference.md). |

The `redis-iris` package requires Python 3.11 or later.

## Connect to a Router

Data-plane requests need:

* The data plane's base URL.
* The Router's ID, which starts with `rtr_`.
* An agent key with a grant on the Router, sent as a bearer token on every request. Matching needs `read`, and authoring needs `write`.

Export them as `IRIS_INTENT_ROUTER_URL`, `IRIS_INTENT_ROUTER_ID`, and `IRIS_INTENT_ROUTER_API_KEY`. The CLI reads these variables, and in Python `IntentRouter.from_env()` builds a client from them.

Administration requests go to the control plane and need its URL and the admin token, which your platform team holds. The Python package and the CLI read them from `IRIS_INTENT_ROUTER_SERVICE_URL` and `IRIS_INTENT_ROUTER_SERVICE_TOKEN`. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md#before-you-begin).

Keep the admin token out of application configuration. An agent key can't create, change, or delete Routers.

## Work with intents

Create or replace an intent with `define` in Python or `intents put` in the CLI, add several at once with the bulk operation, and manage examples separately from an intent's configuration. See [Manage intents and examples](/content/develop/ai/context-engine/intent-router/manage-intents.md).

## Match queries

Send each query to `match` and read the best item's target. In Python, `match` returns the items best first, and `best` is the closest intent, or `None`. An empty list means no intent is close enough. See [Match queries](/content/develop/ai/context-engine/intent-router/match.md).

## Handle errors

A failed request returns an HTTP status and a problem `type`. Match on the `type`. A `409` from a Router that isn't serving, a `424` from the embedding provider, or a `503` is worth retrying with backoff. A `412` means the intent changed since you read it. A `401` means the key is missing, invalid, expired, or revoked. See [service limits and errors](/content/develop/ai/context-engine/intent-router/limits.md#handle-request-errors).

## References

* [Quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md)
* [Python and CLI package reference](https://pypi.org/project/redis-iris/)
* [Data-plane API reference](/content/develop/ai/context-engine/intent-router/api-reference.md)
* [Control-plane API reference](/content/operate/iris/intent-router/self-managed/control-plane-api-reference.md)

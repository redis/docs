---
Title: Operate self-managed Intent Router
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, rotate credentials, watch memory, update configuration, back up, upgrade, and uninstall Redis Intent Router.
linkTitle: Operations
weight: 90
hideListLinks: true
---

This page describes how to operate self-managed Intent Router after you deploy it and give Routers to developers. It covers routine checks, such as service health and data-plane Redis memory, and how the deployment responds when Redis is unavailable. It also covers rotating credentials, updating Secrets, and backing up. Upgrades and uninstalls run on the suite release.

## Check service health

Every service answers `/health/liveness` and `/health/readiness` without a credential:

```bash
curl -sS http://localhost:9400/health/readiness
curl -sS http://localhost:9401/health/readiness
curl -sS http://localhost:9200/health/readiness
```

Check one Router with its health route. It returns `ok` and a `checks` list that covers the Router's state, the embedding provider, the intent store, and the search index. A failing check carries a `message` that says why:

```bash
curl -sS "$IRIS_INTENT_ROUTER_URL/iris/data/v1/intent/routers/$IRIS_INTENT_ROUTER_ID/health" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" | jq .
```

`helm test iris --namespace <namespace-name>` creates a Router with the admin token, mints a scoped key, and calls the data plane with it.

## Rotate credentials

Rotate the control plane and Identity Service tokens as described in [Rotate credentials](/content/operate/iris/intent-router/self-managed/authentication.md#rotate-credentials). To rotate an embedding provider credential, update `embedders_connection_details` in the inference Secret, update `intent.inference.existingSecretChecksum`, and [upgrade the release](/content/operate/iris/intent-router/self-managed/deploy.md#3-install-or-upgrade-the-release), so the data plane rolls.

## Watch the data-plane Redis

The data-plane Redis holds every Router's examples and vector index. Watch its memory against the estimate in [Size memory](/content/operate/iris/intent-router/self-managed/prerequisites.md#size-memory), and add memory before a large authoring run. Intent limits stop a Router growing past `intent.dataplane.limits.max_intents_per_router`, but not past the memory of the database. A Router whose database runs out of memory answers `424` with `/errors/database-out-of-memory`.

The data plane rebuilds a Router's index if it is lost, and reports the Router ready only after the index is built. While it rebuilds, match requests return `503` with `Retry-After`.

## Handle Redis outages

A Router whose database is unreachable answers `503` with `Retry-After` until the database returns. See [Customer databases](/content/operate/iris/intent-router/self-managed/configuration.md#customer-databases) for what happens to a new Router.

## Update configuration Secrets

When you change the storage or inference Secret, update its `existingSecretChecksum` under `intent:` and upgrade the release, so the pods roll and read the new content. Changing a customer database URL needs this restart.

## Back up the deployment

Back up the metadata Redis, which holds the Router records, and the data-plane Redis, which holds intents and examples. Back up the Identity Service metadata too, so agent keys survive a restore. Keep the Secrets and the values file in your secret store and source control.

A restored data-plane Redis rebuilds its Router indexes. Embeddings are stored with each example, so a restore doesn't call the embedding provider.

## Upgrade, remove, or uninstall

Intent Router upgrades with the suite release. Check readiness on every service afterward. See [Upgrade](/content/operate/iris/self-managed/operations.md#upgrade).

To remove Intent Router and its data, see [Remove a service permanently](/content/operate/iris/self-managed/operations.md#remove-a-service-permanently). To remove the whole suite, see [Uninstall](/content/operate/iris/self-managed/operations.md#uninstall).

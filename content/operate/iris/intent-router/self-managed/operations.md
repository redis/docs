---
Title: Operate self-managed Redis Intent Router
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, rotate credentials, watch memory, update configuration, back up, upgrade, and uninstall Redis Intent Router.
linkTitle: Operations
weight: 80
hideListLinks: true
---

## Check service health

Both planes answer `/health/liveness` and `/health/readiness` without a credential:

```bash
curl -sS http://localhost:9400/health/readiness
curl -sS http://localhost:9401/health/readiness
```

Check one Router with its health route. It returns `ok` and a `checks` list that covers the Router's state, the embedding provider, the intent store, and the search index. A failing check carries a `message` that says why:

```bash
curl -sS "http://localhost:9401/iris/v2/intent/routers/$ROUTER_ID/health" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" | jq .
```

With `tests.enabled=true`, `helm test intent -n <namespace-name>` probes every service and runs the shared security-profile checks.

## Rotate credentials

Rotate the control plane and Identity Service tokens as described in [Rotate credentials](/content/operate/iris/intent-router/self-managed/authentication.md#rotate-credentials). Rotate an embedding provider credential by updating the `embedders_connection_details` in the inference Secret, then restart the data plane.

## Watch the data-plane Redis

The data-plane Redis holds every Router's examples and vector index. Watch its memory against the estimate in [Size memory](/content/operate/iris/intent-router/self-managed/prerequisites.md#size-memory), and add memory before a large authoring run. Intent limits stop a Router growing past `max_intents_per_router`, but not past the memory of the database.

The data plane rebuilds a Router's index if it is lost, and reports the Router ready only after the index is built. While it rebuilds, match requests return `503` with `Retry-After`.

## Handle Redis outages

A Router whose database is unreachable answers `503` with `Retry-After` until the database returns. A new Router in that state keeps waiting with the reason, then fails at the provisioning deadline.

## Update configuration and license Secrets

When you change a Secret, update its `existingSecretChecksum` in the values and run `helm upgrade`, so the pods roll and read the new content. Changing a customer database URL needs this restart.

## Back up the deployment

Back up the metadata Redis, which holds the Router records, and the data-plane Redis, which holds intents and examples. Back up the Identity Service metadata too, so agent keys survive a restore. Keep the Secrets and the values file in your secret store and source control.

A restored data-plane Redis rebuilds its Router indexes. Embeddings are stored with each example, so a restore doesn't call the embedding provider.

## Upgrade the chart

```bash
helm repo update redis-ai
helm upgrade intent redis-ai/redis-intent-router \
  --version <chart-version> \
  --namespace <namespace-name> \
  -f intent-values.yaml \
  --wait --timeout 5m
```

Set the image tags from the release manifest for the new chart version. Check readiness on both planes afterward.

## Uninstall the chart

```bash
helm uninstall intent --namespace <namespace-name>
```

Uninstalling doesn't delete the Redis databases or the Secrets you created. The chart keeps the auto-generated token Secrets (`helm.sh/resource-policy: keep`), so delete them yourself if you don't plan to reinstall.

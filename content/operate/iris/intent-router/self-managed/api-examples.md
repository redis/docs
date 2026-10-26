---
Title: Self-managed Intent Router API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create a Router, mint an agent key, verify agent access, and rotate or revoke keys.
linkTitle: API examples
weight: 70
hideListLinks: true
---

Create a Router that the [developer quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md) uses, issue one agent key, and hand the connection values to a developer.

Before you begin, [deploy the chart](/content/operate/iris/intent-router/self-managed/deploy.md) and [load the admin token](/content/operate/iris/intent-router/self-managed/authentication.md#control-plane-admin-token).

## Set connection values

Forward the control plane and the Identity Service in separate terminals, as in [Deploy](/content/operate/iris/intent-router/self-managed/deploy.md#5-verify-pods-and-health), then export the connection values:

```bash
export IRIS_INTENT_ROUTER_SERVICE_URL='http://localhost:9400'
export IRIS_IDENTITY_URL='http://localhost:9200'
export IRIS_IDENTITY_TOKEN='<identity-service-control-token>'
export IRIS_IDENTITY_TENANT='<tenant-id>'
umask 077
```

`IRIS_INTENT_ROUTER_SERVICE_TOKEN` holds the admin token. For application deployment, use the control plane and Identity Service endpoints your platform exposes.

## Create a Router

List the offered models, then create a Router with one of them and wait for it to be ready. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) for each step with Python, TypeScript, and the CLI.

{{< clients-example set="iris_intent_router_service" step="models-list" description="" lang_filter="cURL (Iris),CLI (Iris)" footer="hide" />}}

{{< clients-example set="iris_intent_router_service" step="router-create" description="" lang_filter="cURL (Iris),CLI (Iris)" footer="hide" />}}

{{< clients-example set="iris_intent_router_service" step="router-wait" description="" lang_filter="cURL (Iris),CLI (Iris)" footer="hide" />}}

Save the `routerId` for the next step.

## Mint an agent key

Issue one key with a `write` grant on the Router:

```bash
export ROUTER_ID='<router-id>'
jq -n --arg tenant "$IRIS_IDENTITY_TENANT" --arg router "$ROUTER_ID" '{
  name: "support-app",
  grants: [
    {tenant: $tenant, product: "intent", resourceType: "intent-router", resourceId: $router, actions: ["write"]}
  ]
}' > agent-grant.json

curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @agent-grant.json > agent-key.json

export INTENT_ROUTER_API_KEY="$(jq -er '.token' agent-key.json)"
jq '{keyId, createdAt}' agent-key.json
```

The response holds the `keyId` and the key's `token`. The token is returned once, when you mint or rotate the key. Store it in a secret manager and keep it out of source control. Use `read` instead of `write` for an application that only classifies queries.

## Verify agent access

Check that the key reaches the Router:

```bash
curl --fail-with-body --silent --show-error \
  "http://localhost:9401/iris/v2/intent/routers/$ROUTER_ID/health" \
  -H "Authorization: Bearer $INTENT_ROUTER_API_KEY" | jq .
```

Give the developer the data-plane URL, the Router ID, and the key. They continue with the [quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md).

## Rotate or revoke agent keys

Rotate a key to get a new token, and revoke it to stop it working. Rotation returns the new token once:

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>/rotate" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"

curl --fail-with-body --silent --show-error \
  -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

A revoked key stops working within 300 seconds, the data plane's default key cache lifetime. Revoke the keys for a Router before you delete it.

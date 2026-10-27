---
Title: Self-managed Intent Router API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create a Router, mint an agent key, verify agent access, hand off to a developer, and rotate or revoke keys.
linkTitle: API examples
weight: 70
hideListLinks: true
---

After you deploy Intent Router, developers still can't use it until a Router and an agent key exist. This page walks through that setup: you create a Router, issue an agent key for it, check that the key works, and give the connection values to a developer. The developer then continues with the [developer quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md). The page also covers rotating and revoking agent keys after handoff.

Before you begin, [deploy the chart](/content/operate/iris/intent-router/self-managed/deploy.md) and [load the administration tokens](/content/operate/iris/intent-router/self-managed/authentication.md#load-the-administration-tokens).

## Set connection values

Forward the control plane, the data plane, and the Identity Service in separate terminals, as in [Deploy](/content/operate/iris/intent-router/self-managed/deploy.md#5-verify-pods-and-health), then export the connection values:

```bash
export IRIS_INTENT_ROUTER_SERVICE_URL='http://localhost:9400'
export IRIS_INTENT_ROUTER_URL='http://localhost:9401'
export IRIS_IDENTITY_URL='http://localhost:9200'
export IRIS_IDENTITY_TENANT='<tenant-id>'
umask 077
```

`IRIS_INTENT_ROUTER_SERVICE_TOKEN` holds the admin token and `IRIS_IDENTITY_TOKEN` holds the Identity Service control token. `IRIS_IDENTITY_TENANT` is the deployment's `tenantId`. For application deployment, use the endpoints your platform exposes.

## Create a Router

List the offered models, then create a Router with one of them and wait for it to be ready. See [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md) for each step with Python, TypeScript, and the command-line interface (CLI).

{{< clients-example set="iris_intent_router_service" step="models-list" description="" lang_filter="cURL (Iris),CLI (Iris)" footer="hide" />}}

{{< clients-example set="iris_intent_router_service" step="router-create" description="" lang_filter="cURL (Iris),CLI (Iris)" footer="hide" />}}

{{< clients-example set="iris_intent_router_service" step="router-wait" description="" lang_filter="cURL (Iris),CLI (Iris)" footer="hide" />}}

The create step saves the new Router's ID in `ROUTER_ID`.

## Mint an agent key

Issue one key with a `write` grant on the Router. In a new shell, first set `ROUTER_ID` to the saved `routerId`.

```bash
: "${ROUTER_ID:?Set ROUTER_ID to the saved routerId}"
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

export IRIS_INTENT_ROUTER_ID="$ROUTER_ID"
export IRIS_INTENT_ROUTER_API_KEY="$(jq -er '.token' agent-key.json)"
KEY_ID="$(jq -er '.keyId' agent-key.json)"
jq '{keyId, createdAt}' agent-key.json
```

> [!WARNING]
> The response holds the key's `token` only once, when you mint or rotate the key. Store it in a secret manager and keep it out of source control.

Use `read` instead of `write` for an application that only classifies queries.

## Verify agent access

Check that the key reaches the Router:

```bash
curl --fail-with-body --silent --show-error \
  "$IRIS_INTENT_ROUTER_URL/iris/v2/intent/routers/$IRIS_INTENT_ROUTER_ID/health" \
  -H "Authorization: Bearer $IRIS_INTENT_ROUTER_API_KEY" | jq .
```

## Hand off to a developer

Give the developer the data-plane endpoint as `IRIS_INTENT_ROUTER_URL`, the Router ID as `IRIS_INTENT_ROUTER_ID`, and the agent key as `IRIS_INTENT_ROUTER_API_KEY`. They continue with the [quickstart](/content/develop/ai/context-engine/intent-router/quickstart.md). Give platform teams who manage Routers the control-plane URL and admin token for [Manage Routers](/content/develop/ai/context-engine/intent-router/manage-routers.md). Remove `agent-key.json` and `agent-grant.json` after you save the token.

## Rotate or revoke agent keys

Rotating a key mints a replacement with a new `keyId` and token. The old key keeps working for a grace period, 3,600 seconds by default, so applications can switch over. Set `graceSeconds` to change it. Rotation returns the new token once:

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys/$KEY_ID/rotate?graceSeconds=600" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" > agent-key.json
export IRIS_INTENT_ROUTER_API_KEY="$(jq -er '.token' agent-key.json)"
KEY_ID="$(jq -er '.keyId' agent-key.json)"
jq '{keyId, createdAt, oldExpiresAt}' agent-key.json
```

Revoke a key to stop it working:

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/$KEY_ID" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

A revoked key stops working within 300 seconds, the Identity Service's default cache lifetime. Revoke the keys for a Router before you delete it.

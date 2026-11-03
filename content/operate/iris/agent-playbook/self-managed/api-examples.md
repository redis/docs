---
Title: Self-managed Agent Playbooks API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create a playbook, mint publisher and reader agent keys, verify agent access, and hand connection details to a developer.
linkTitle: API examples
weight: 70
hideListLinks: true
---

Create a playbook, issue publisher and reader agent keys, and verify application access with curl or the Iris command-line interface (CLI).

Before you begin, [deploy the chart and forward the APIs](/content/operate/iris/agent-playbook/self-managed/deploy.md#6-verify-pods-and-health), then [load the administrative credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#load-the-administrative-credentials). Keep response files private:

```bash
umask 077
```

The local HTTP addresses use the Kubernetes port-forwards. For application deployment, give developers the data-plane endpoint your platform exposes.

## Create a playbook

List the embedding models configured for this deployment:

```bash
curl --fail-with-body -sS \
  "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/models" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" \
  | jq '.items[] | select(.purpose == "EMBEDDING")'
```

Create the playbook with one of the returned identities:

```bash
jq -n \
  --arg provider '<provider>' \
  --arg model '<model>' \
  --argjson dimensions '<dimensions>' \
  '{name: "support", embedding: {provider: $provider, model: $model, dimensions: $dimensions}}' \
  > playbook-request.json

curl --fail-with-body -sS \
  -X POST "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @playbook-request.json > playbook.json
export IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID="$(jq -er '.playbookId' playbook.json)"
```

Playbook IDs start with `pb_`. Read the playbook's state:

```bash
curl --fail-with-body -sS \
  "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" \
  | jq '{playbookId, state, embedding, discovery}'
```

Continue when `state` is `READY`. If it is `PROVISIONING`, repeat the read. If it is `FAILED`, check service health and logs before you retry. Creating a playbook with a name already in use returns `409`.

To list playbooks, send `GET /iris/v1/agent-playbooks/playbooks`. The response holds `items` and, when more follow, a `nextCursor` to pass back as `cursor`.

## Create agent keys

Create a publisher grant for this playbook:

```bash
jq -n --arg id "$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" '{
  name: "support-publisher",
  grants: [{
    tenant: "default",
    product: "playbook",
    resourceType: "playbook",
    resourceId: $id,
    actions: ["write", "publish"]
  }]
}' > publisher-grant.json
```

Use the deployment's `tenantId` as `tenant`. Issue the key through the Identity Service:

```bash
curl --fail-with-body -sS \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @publisher-grant.json > publisher-key.json
export IRIS_AGENT_PLAYBOOKS_API_KEY="$(jq -er '.token' publisher-key.json)"
```

Issue a separate reader key for the same playbook:

```bash
jq '.name = "support-reader" | .grants[0].actions = ["read"]' publisher-grant.json \
  | curl --fail-with-body -sS \
    -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
    -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
    -H 'Content-Type: application/json' \
    --data-binary @- > reader-key.json
```

Save both tokens in your secret manager and keep their `keyId` values. The Identity Service returns a token only when it creates or rotates a key. Minting fails if the playbook doesn't exist or the grant names another tenant.

## Verify application access

```bash
curl --fail-with-body -sS \
  "$IRIS_AGENT_PLAYBOOKS_URL/iris/data/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/health" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_API_KEY"
```

The response reports `READY` for the playbook, its metadata and content Redis, the embedding provider, and the license.

## Hand off to a developer

Give the content team the data-plane endpoint, the playbook ID, and the publisher key for the [developer quickstart](/content/develop/ai/context-engine/agent-playbooks/quickstart.md). They set these variables:

```dotenv
IRIS_AGENT_PLAYBOOKS_URL='<data-plane-endpoint>'
IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID='<playbook-id>'
IRIS_AGENT_PLAYBOOKS_API_KEY='<playbook-api-key>'
```

Give runtime agents the reader key instead, for [agent integration](/content/develop/ai/context-engine/agent-playbooks/agent-integration.md) over REST or [MCP](/content/develop/ai/context-engine/agent-playbooks/mcp.md). Remove the local key-response files after you save both tokens.

## Use the Iris CLI

The Iris CLI reads the same variables. Install it with Python 3.11 or later:

```bash
python -m pip install 'redis-iris'
```

Create a playbook and mint a read-only key for it in one step, writing the connection values to `.env`:

```bash
iris agent-playbooks service create --name support \
  --embedding-provider openai \
  --embedding-model '<model>' \
  --embedding-dimensions '<dimensions>' \
  --key-actions read \
  --write-env .env
```

`--embedding-provider` accepts `openai` or `noop`, so the CLI can create playbooks only for a connection named `openai`. The CLI sends FAQ and skill minimum scores of `0.3` unless you pass `--faq-min-score` and `--skill-min-score`; calibrate them against your own scores. Add `--dry-run` to print the request without sending it.

Mint a content key with `read`, `write`, and `publish` for an existing playbook, then check every hop from the control plane to a data read:

```bash
iris agent-playbooks service key "$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" --role content --write .env
iris agent-playbooks service check "$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" --env-file .env
```

Inspect a playbook with `iris agent-playbooks service show <playbook-id>`, and list, rotate, or revoke keys with `iris identity keys`. Keys the CLI mints expire after 90 days unless you pass `--expires`.

For retrieval settings, see [Playbook settings](/content/operate/iris/agent-playbook/self-managed/configuration.md#playbook-settings).

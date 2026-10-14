---
Title: Self-managed Agent Playbooks API examples
alwaysopen: false
categories:
- docs
- operate
- iris
description: Create a playbook, issue application keys, and hand connection details to a developer.
linkTitle: API examples
weight: 70
hideListLinks: true
---

Create a playbook, issue publisher and reader keys, and verify application access.

Before you begin, [deploy the chart and forward the APIs]({{< relref "/operate/iris/agent-playbook/self-managed/deploy#connect-to-the-apis" >}}), then [load the administrative tokens]({{< relref "/operate/iris/agent-playbook/self-managed/authentication#read-the-bootstrap-credentials" >}}).

## Set connection values

Use the same tenant identifier as `tenantId` in `playbook-values.yaml`:

```bash
export PLAYBOOK_CONTROL_URL='http://localhost:9200'
export PLAYBOOK_URL='http://localhost:9201'
export IDENTITY_URL='http://localhost:9202'
export TENANT_ID='<tenant-id>'
umask 077
```

The local HTTP addresses use the Kubernetes port-forwards. For application deployment, provide the data-plane endpoint configured by your platform.

## Create a playbook

Select a provider, model, and dimension count from the deployment's `inference.models`. This request matches the [embedding configuration example]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#embedding-configuration" >}}):

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$PLAYBOOK_CONTROL_URL/v1/playbooks" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{
    "name": "Support",
    "embedding": {
      "provider": "openai",
      "model": "text-embedding-3-small",
      "dimensions": 1536
    }
  }' > playbook.json
export PLAYBOOK_ID="$(jq -er '.playbookId' playbook.json)"
```

Inspect its state:

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_CONTROL_URL/v1/playbooks/$PLAYBOOK_ID" \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  | jq '{playbookId, state, embedding}'
```

Proceed when `state` is `ready`. If it is `provisioning`, repeat the read. If it is `failed`, inspect service health and logs before retrying setup.

## Create application keys

Create a publisher grant for this playbook and tenant:

```bash
jq -n --arg tenant "$TENANT_ID" --arg id "$PLAYBOOK_ID" '{
  name: "support-publisher",
  grants: [{
    tenant: $tenant,
    product: "playbook",
    resourceType: "playbook",
    resourceId: $id,
    actions: ["write", "publish"]
  }]
}' > publisher-grant.json
```

Issue the key through Identity Service:

```bash
curl --fail-with-body --silent --show-error \
  -X POST "$IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IDENTITY_CONTROL_TOKEN" \
  -H 'Content-Type: application/json' \
  --data-binary @publisher-grant.json > publisher-key.json
export PLAYBOOK_API_KEY="$(jq -er '.token' publisher-key.json)"
```

Issue a separate reader key using the same tenant and playbook:

```bash
jq '.name = "support-reader" | .grants[0].actions = ["read"]' publisher-grant.json \
  | curl --fail-with-body --silent --show-error \
    -X POST "$IDENTITY_URL/v1/api-keys" \
    -H "Authorization: Bearer $IDENTITY_CONTROL_TOKEN" \
    -H 'Content-Type: application/json' \
    --data-binary @- > reader-key.json
```

Save both tokens in your secret manager and retain their `keyId` values. Tokens are returned only on creation or rotation.

## Verify application access

```bash
curl --fail-with-body --silent --show-error \
  "$PLAYBOOK_URL/v1/playbooks/$PLAYBOOK_ID/health" \
  -H "Authorization: Bearer $PLAYBOOK_API_KEY"
```

Use the current publisher connection for the [developer quickstart]({{< relref "/develop/ai/context-engine/agent-playbook/quickstart" >}}). Give runtime applications `PLAYBOOK_URL`, `PLAYBOOK_ID`, and the reader key for [agent integration]({{< relref "/develop/ai/context-engine/agent-playbook/agent-integration" >}}). Remove the local key-response files after saving both tokens.

For retrieval settings, see [Playbook settings]({{< relref "/operate/iris/agent-playbook/self-managed/configuration#playbook-settings" >}}).

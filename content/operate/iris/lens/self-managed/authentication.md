---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Understand the Lens credentials, create API keys with grants, turn on operator sign-in, and rotate credentials.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

Self-managed Lens uses three kinds of credentials. Service tokens authenticate operators and the components to each other. API keys, minted by the Identity Service, authenticate agents and readers to the data plane. Operator sign-in tokens from your identity provider (IdP) are optional and authenticate operators on the read API and the control plane.

## Credentials

| Credential | Who presents it to whom | Secret | What it unlocks |
| --- | --- | --- | --- |
| Control-plane admin token | Operator → control plane (`:9300`) | `iris-lens-admin-token`, or the Secret in `lens.controlplane.adminToken.existingSecret` | `GET` and `PATCH /iris/v1beta1/lens/instance` |
| Control-plane internal token | Identity Service → control plane | `iris-lens-internal-token`, key `lens` | Validating a key's grant before the Identity Service stores it |
| Data-plane runtime credential | Data plane → Identity Service | `iris-lens-dataplane-credential`, key `lens-dp` | Checking API keys for `lens` |
| Identity Service control token | Operator → Identity Service (`:9200`) | `iris-identity-service-control-token` | Creating, rotating, and revoking API keys |
| API key | Agent or reader → data plane (`:9000`) | None. Returned once when minted | Ingest or reads on the instance its grant names |

The suite generates these Secrets once and keeps them across upgrades. See [Credentials](/content/operate/iris/self-managed/_index.md#credentials).

Load the two administration tokens before you call the control plane or the Identity Service:

```bash
export LENS_ADMIN_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-lens-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

The health routes need no credential.

## Grants and scopes

Each API key carries a grant on the Lens instance:

| Grant field | Value |
| --- | --- |
| `product` | `lens` |
| `resourceType` | `lens-instance` |
| `resourceId` | `default`, the suite's one Lens instance. |
| `actions` | One or more of `ingest`, `read`, and `full`. |

| Action | What it allows |
| --- | --- |
| `ingest` | Send turns to `POST /iris/data/v1beta1/lens/v1/traces`. Gets `403` on the read API. |
| `read` | Read agents, sessions, turns, and content. |
| `full` | Both. |

The Identity Service stamps the deployment's tenant on a grant that omits one. It asks the control plane to validate each grant before it stores the key, so a grant for another instance ID is refused.

## Create API keys

With the Identity Service port-forwarded to `localhost:9200`, create an ingest key for an agent:

```bash
export IRIS_IDENTITY_URL='http://localhost:9200'
curl --fail-with-body --silent --show-error \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"support-bot-ingest","grants":[{"product":"lens","resourceType":"lens-instance","resourceId":"default","actions":["ingest"]}]}' \
  > ingest-key.json
export IRIS_LENS_API_KEY="$(jq -er '.token' ingest-key.json)"
jq '{keyId, createdAt}' ingest-key.json
```

Create a read key the same way, with `"actions":["read"]`, and save its `.token` in `LENS_API_KEY`.

> [!WARNING]
> The Identity Service returns each key's token only once. Save it to your secret store, then delete the JSON file.

Agents send the key as `Authorization: Bearer <key>` or `X-Api-Key: <key>`. The read client sends it as a bearer token.

## Revoke API keys

Revoke a key with its `keyId`:

```bash
curl --fail-with-body --silent --show-error \
  -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

The data plane caches each key check. A revoked key stops working when the Identity Service's runtime cache expires, set by `identityService.runtime.cache` (300 seconds by default).

## Operator sign-in

The data plane and control plane accept access tokens from your IdP beside API keys, so operators signed in to the Iris console can read sessions and turns. The suite configures this from `global.iris.auth.oidc` and `global.iris.auth.roleBindings`, with a `product: lens` binding for Lens roles. Don't set `oidc` values under `lens:`. See [Write `iris-values.yaml`](/content/operate/iris/self-managed/_index.md#3-write-iris-valuesyaml).

An operator token is accepted on the read API with `viewer` or a higher role. It always gets `403` on ingest, because ingest needs an API key. The admin token keeps working beside operator tokens.

Revoking an API key doesn't affect operator tokens. Removing an operator's role in the IdP takes effect when their current token expires.

## Rotate credentials

To rotate a service token, change its Secret in place, as [Credentials](/content/operate/iris/self-managed/_index.md#credentials) describes. Lens and the Identity Service mount the same `iris-lens-internal-token` and `iris-lens-dataplane-credential` Secrets, so one change covers both.

To replace an API key, create a new key, give it to the application, then revoke the old one.

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
| Control-plane admin token | Operator → control plane (`:9300`) | Generated as `<release>-redis-lens-controlplane-admin-token`, or the Secret in `controlplane.adminToken.existingSecret` | `GET` and `PATCH /iris/v1beta1/lens/instance` |
| Control-plane internal token | Identity Service → control plane | `controlplane.internalToken.existingSecret`, also the Identity Service's `productValidation.products.lens.credential` | Validating a key's grant before the Identity Service stores it |
| Data-plane runtime credential | Data plane → Identity Service | `identityService.credential.existingSecret`, also the Identity Service's `runtime.serviceCredentials` entry `lens-dataplane` | Checking API keys for `lens` |
| Identity Service control token | Operator → Identity Service (`:9200`) | The Identity Service release's `control` Secret | Creating, rotating, and revoking API keys |
| API key | Agent or reader → data plane (`:9000`) | None. Returned once when minted | Ingest or reads on the instance its grant names |

The generated admin token has the key `token`. The chart keeps it across upgrades (`helm.sh/resource-policy: keep`) and never rotates it. The chart refuses to mount one Secret key as two of its credentials.

Load the two administration tokens before you call the control plane or the Identity Service. With the Secret names from [Deploy](/content/operate/iris/lens/self-managed/deploy.md#2-create-secrets):

```bash
export LENS_ADMIN_TOKEN="$(kubectl -n <namespace-name> get secret \
  lens-redis-lens-controlplane-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  ids-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

The health routes need no credential.

## Grants and scopes

Each API key carries a grant on the Lens instance:

| Grant field | Value |
| --- | --- |
| `product` | `lens` |
| `resourceType` | `lens-instance` |
| `resourceId` | The `instance.id`, such as `default`. |
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

The data plane caches each key check. A revoked key stops working when the Identity Service's runtime cache expires, set by its `runtime.cache` values (300 seconds by default).

## Operator sign-in

The data plane can accept access tokens from your IdP beside API keys, so operators signed in to the Iris console can read sessions and turns. Turn it on in `lens-values.yaml`:

```yaml
auth:
  oidc:
    audience: api://redis-iris
dataplane:
  oidc:
    enabled: true
    issuer: <issuer>
    jwksURI: https://<idp-host>/<jwks-path>
    tenantIDClaim: ""
    roleMappings:
      <idp-group>: viewer
controlplane:
  oidc:
    enabled: true
```

| Value | Purpose |
| --- | --- |
| `auth.oidc.audience` | The audience the IdP puts in the token's `aud`. Use the same Iris API audience in every Iris chart. On Microsoft Entra ID v2, it's the API's Application (client) ID. Empty and wildcard values are refused. |
| `dataplane.oidc.issuer` | Compared with the token's `iss`, and never fetched, so `http://` is allowed. On Active Directory Federation Services (AD FS), use the discovery document's `access_token_issuer`. |
| `dataplane.oidc.jwksURI` | Fetched for signing keys. Must be `https://` unless `dataplane.oidc.allowInsecureTransport=true`. |
| `dataplane.oidc.tenantIDClaim` | The claim that names the tenant. Empty treats every token as `tenantId`'s. |
| `dataplane.oidc.roleClaims` | The claims that carry groups. Empty uses `roles` and `groups`. |
| `dataplane.oidc.roleMappings` | Required. Maps IdP groups to Iris roles: `viewer`, `operator`, `product_admin`, or `suite_admin`. Unmapped groups are never accepted. |
| `controlplane.oidc.enabled` | The control plane validates the same tokens with the same settings. Requires `dataplane.oidc.enabled`. |

An operator token is accepted on the read API with `viewer` or a higher role. It always gets `403` on ingest, because ingest needs an API key. The admin token keeps working beside operator tokens.

Revoking an API key doesn't affect operator tokens. Removing an operator's role in the IdP takes effect when their current token expires.

## Rotate credentials

To rotate a service token, update its Secret, update the matching `existingSecretChecksum`, and run `helm upgrade`, so the pods roll:

- **Admin token**: Lens only.
- **Internal token** and **runtime credential**: both releases mount them. Update the Secret, then upgrade both releases together.
- **Identity Service control token**: the Identity Service release only.

To replace an API key, create a new key, give it to the application, then revoke the old one.

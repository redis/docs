---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure Context Gateway Control Plane credentials, agent-key grants, and identity provider sign-in for agents.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control Plane admin token | Operator → Control Plane (`:9100`) | `iris-context-gateway-admin-token` / `token` | Yes, by the suite | Gateway and Upstream management: `/iris/v1/context-gateway/gateways` |
| Control Plane internal token | Identity Service → Control Plane | `iris-context-gateway-internal-token` / `context-gateway` | Yes, by the suite | Checking that the Gateway in a grant exists |
| Data Plane runtime token | Data Plane → Identity Service | `iris-context-gateway-dataplane-credential` / `context-gateway-dp` | Yes, by the suite | Checking agent keys for `context-gateway` |
| Identity Service control token | Operator → Identity Service (`:9200`) | `iris-identity-service-control-token` / `token` | Yes, by the suite | Creating, listing, rotating, and revoking agent keys |
| Agent key | Agent → Data Plane (`:8083`) | None. Returned once when minted or rotated | No | Listing and calling tools on the Gateways its grants name |
| Identity provider access token | Agent → Data Plane (`:8083`) | None. Issued by your identity provider | No | With the `gateway_user` role, every Gateway in the tenant. Without it, none |

The admin, internal, and runtime tokens must be distinct. An agent key gets `401` from the Control Plane. No credential that an agent presents is sent to an Upstream.

The suite generates these Secrets on first install and keeps them across upgrades. To supply your own, see [Credentials](/content/operate/iris/self-managed/_index.md#credentials).

## Control Plane admin token

The examples use the admin token in `Authorization: Bearer <token>` for Gateway and Upstream operations. When `global.iris.auth.oidc` sets an issuer, the Control Plane also authorizes administrators with identity provider access tokens. The admin token remains available, and the health routes need no credential.

Load the token before you call the Control Plane:

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-context-gateway-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
```

## Gateway authorization and grants

An agent key needs a grant on each Gateway it uses:

| Grant field | Value |
| --- | --- |
| `tenant` | The suite's `global.iris.tenantId`. |
| `product` | `context-gateway` |
| `resourceType` | `gateway` |
| `resourceId` | The Gateway ID. |
| `actions` | `["use"]` or `["full"]` |

One grant covers listing and calling every tool on the Gateway, including tools that change data. Model Context Protocol (MCP) tool annotations do not limit it.

The Identity Service mints a key only for a Gateway that exists in the tenant and is not being deleted. A revoked key stops working within the Identity Service cache lifetime, 300 seconds by default.

The [API examples](/content/operate/iris/context-gateway/self-managed/api-examples.md#mint-an-agent-key) show the complete request.

## Identity provider sign-in

Turn on sign-in to let MCP clients use access tokens from your identity provider (IdP). The Data Plane validates each token itself and serves protected resource metadata so that clients can find the IdP. IdP tokens are accepted only in `Authorization: Bearer`, never in `X-Api-Key`, and they never reach an Upstream.

Set these keys under `contextGateway.dataplane.config.auth.oidc`. The suite doesn't derive them from `global.iris.auth.oidc`:

| Key | Value |
| --- | --- |
| `enabled` | `true` |
| `issuer` | Your IdP's issuer URL. |
| `audience` | Exactly one API identifier that belongs to the Data Plane alone, such as `api://context-gateway-dp`. Not the shared `api://redis-iris`. Tokens audienced at a Gateway's MCP URL are also accepted. |
| `jwks_uri` | Your IdP's JSON Web Key Set (JWKS) URL. |
| `user_id_claim` | The claim that identifies a user. `sub` by default, `oid` for Microsoft Entra ID. |
| `role_mappings` | Maps IdP role or group claim values to Iris roles, such as `gateway_user`. |

`contextGateway.dataplane.config.oauth.public_base_url` defaults to `contextGateway.publicBaseURL`, the Data Plane's public origin. The issuer and key set URLs must use HTTPS.

Register the Data Plane's audience as a separate API at your IdP. On Microsoft Entra ID, that is a second app registration. Don't use the shared `api://redis-iris` audience that the Control Plane and the Iris UI use. MCP clients hold the sign-in token, and the shared audience would also open Agent Memory and Playbook for the user. The Data Plane refuses to start with `api://redis-iris`. It cannot see a renamed shared audience, so if you renamed it, choose a different value here too. Don't give MCP clients the shared audience or its scope either: a token that carries both audiences still opens Agent Memory and Playbook.

### Upgrade from the shared audience

Preview charts documented `api://redis-iris` for the Data Plane, and the Data Plane now fails at startup with that value. Before you reinstall a deployment that had sign-in turned on with the shared audience:

1. Register the separate API at your IdP and assign roles on it.
1. Set `contextGateway.dataplane.config.auth.oidc.audience` to the new API identifier.
1. Install or upgrade the `iris` release.

MCP clients then need to sign in again to receive tokens for the new audience.

### Grant signed-in users access

Map an IdP group to the `gateway_user` role in `role_mappings`. The role grants `use` on every Gateway in the tenant.

In a `redis-iris` installation the Data Plane can't read Identity Service [subject grants](/content/operate/iris/identity-service/self-managed/authentication.md#subject-grants), so they have no effect. Signed-in users can't be limited to selected Gateways, and a signed-in user without `gateway_user` can't use any Gateway. To give an agent access to selected Gateways only, give it an agent key with a grant for each one.

<!-- TODO: Add the tested settings for Okta, Microsoft Entra ID, Auth0, and Keycloak. -->

## Rotate credentials

See [Operations](/content/operate/iris/context-gateway/self-managed/operations.md#rotate-credentials).

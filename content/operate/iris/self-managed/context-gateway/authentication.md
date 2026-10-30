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
aliases:
- /operate/iris/context-gateway/self-managed/authentication/
---

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control Plane admin token | Operator → Control Plane (`:9100`) | The Secret in `controlplane.adminToken` / `token` | No | Gateway and Upstream management: `/v1/gateways` |
| Control Plane internal token | Identity Service → Control Plane | The Secret in `controlplane.internalToken` / `token` | No | Checking that the Gateway in a grant exists |
| Data Plane runtime token | Data Plane → Identity Service | The Secret in `dataplane.runtimeToken` / `token` | No | Checking agent keys for `context-gateway` |
| Identity Service control token | Operator → Identity Service (`:9200`) | Set on the Identity Service release | Depends on the Identity Service release | Creating, listing, rotating, and revoking agent keys |
| Agent key | Agent → Data Plane (`:8083`) | None. Returned once when minted or rotated | No | Listing and calling tools on the Gateways its grants name |
| Identity provider access token | Agent → Data Plane (`:8083`) | None. Issued by your identity provider | No | The Gateways its role or subject grants name |

The admin, internal, and runtime tokens must be distinct. An agent key gets `401` from the Control Plane. No credential that an agent presents is sent to an Upstream.

<!-- TODO: Confirm whether the chart can generate the three tokens at GA, as the Agent Memory chart does. -->

## Control Plane admin token

Every Gateway and Upstream operation needs the admin token in `Authorization: Bearer <token>`. The health routes need no credential.

Load the token from your Secret before you call the Control Plane:

```bash
export IRIS_CONTEXT_GATEWAY_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  <admin-token-secret> -o jsonpath='{.data.token}' | base64 --decode)"
```

## Gateway authorization and grants

An agent key needs a grant on each Gateway it uses:

| Grant field | Value |
| --- | --- |
| `tenant` | The deployment's `tenantId`. |
| `product` | `context-gateway` |
| `resourceType` | `gateway` |
| `resourceId` | The Gateway ID. |
| `actions` | `["use"]` or `["full"]` |

One grant covers listing and calling every tool on the Gateway, including tools that change data. Model Context Protocol (MCP) tool annotations do not limit it.

The Identity Service mints a key only for a Gateway that exists in the tenant and is not being deleted. A revoked key stops working within the Identity Service cache lifetime, 300 seconds by default.

The [API examples](/content/operate/iris/self-managed/context-gateway/api-examples.md#mint-an-agent-key) show the complete request.

## Identity provider sign-in

Turn on sign-in to let MCP clients use access tokens from your identity provider (IdP). The Data Plane validates each token itself and serves protected resource metadata so that clients can find the IdP. IdP tokens are accepted only in `Authorization: Bearer`, never in `X-Api-Key`, and they never reach an Upstream.

Set these keys under `dataplane.config.auth.oidc`:

| Key | Value |
| --- | --- |
| `enabled` | `true` |
| `issuer` | Your IdP's issuer URL. |
| `audience` | The audience that names the Gateway API, or each Gateway's exact URL. |
| `jwks_uri` | Your IdP's JSON Web Key Set (JWKS) URL. |
| `user_id_claim` | The claim that identifies a user. `sub` by default, `oid` for Microsoft Entra ID. |
| `role_mappings` | Maps IdP role or group claim values to Iris roles, such as `gateway_user`. |

Set `dataplane.config.oauth.public_base_url` to the Data Plane's public origin, the same value as `publicBaseURL`. The issuer and key set URLs must use HTTPS.

### Grant signed-in users access

Grant signed-in users access in either way:

- Map an IdP group to the `gateway_user` role. The role grants `use` on every Gateway in the tenant.
- Assign Identity Service subject grants to individual users for selected Gateways, with `PUT /v1/subject-grants` on the Identity Service. A subject grant names the IdP's issuer, the user's `user_id_claim` value, and the same product, resource type, Gateway ID, and `use` action as an agent-key grant.

A specific subject grant cannot narrow the all-Gateway role, and removing a subject grant does not remove access that a role gives. To restrict a user to selected Gateways, don't map them to `gateway_user`.

<!-- TODO: Add the subject grant request body and the tested settings for Okta, Microsoft Entra ID, Auth0, and Keycloak. -->

## Rotate credentials

See [Operations](/content/operate/iris/self-managed/context-gateway/operations.md#rotate-credentials).

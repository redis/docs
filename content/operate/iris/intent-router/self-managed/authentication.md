---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Understand the Intent Router credentials, agent-key grants, and how to load the administration tokens.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

Self-managed Intent Router uses three kinds of credentials. Service tokens authenticate operators and the Intent Router components to each other. The `redis-iris` suite generates them for you. Operator access tokens from your identity provider (IdP) authenticate operators to the control plane when you configure OpenID Connect (OIDC). Agent keys authenticate applications to the data plane, and each key's grants control which Routers it can use and what it can do on them.

## Credentials

| Credential | Who presents it to whom | Secret / key | What it unlocks |
| --- | --- | --- | --- |
| Control-plane admin token | Operator → control plane (`:9400`) | `iris-intent-admin-token` / `token` | Router administration: `/iris/v1/intent/routers` and `/iris/v1/intent/models` |
| Operator access token | Operator → control plane (`:9400`) | None. Your IdP issues it | Router administration, as the operator's Iris role allows |
| Control-plane internal token | Identity Service → control plane | `iris-intent-internal-token` / `intent` | Checking that the Router in a grant exists |
| Identity Service control token | Operator → Identity Service (`:9200`) | `iris-identity-service-control-token` / `token` | Creating, listing, rotating, and revoking agent keys |
| Data-plane runtime credential | Data plane → Identity Service | `iris-intent-dataplane-credential` / `intent-dp` | Checking agent keys for `intent` |
| Agent key | Application → data plane (`:9401`) | None. Returned once when minted or rotated | Authoring and matching on the Routers its grants name |

The suite generates these Secrets once and keeps them across upgrades. To supply your own, see [Credentials](/content/operate/iris/self-managed/_index.md#credentials).

An agent key gets `401` from the control plane. A key without a grant on a Router, or without the action an operation needs, gets `403` from the data plane. The data plane holds no credential for the control plane: the planes never call each other.

## Load the administration tokens

Every Router operation needs a control-plane credential in `Authorization: Bearer <token>`: the admin token, or an operator access token when you configure OIDC. Every agent-key operation needs the Identity Service control token. The health routes need no credential.

The suite configures control-plane OIDC from `global.iris.auth.oidc`, and it maps IdP groups to Iris roles with `global.iris.auth.roleBindings` and the product `intent`. See [Write `iris-values.yaml`](/content/operate/iris/self-managed/_index.md#3-write-iris-valuesyaml). An operator access token gives only the access of its role:

| Role | What it allows |
| --- | --- |
| `viewer` | List the models, and list and read Routers. |
| `operator` | Also create and change Routers. |
| `product_admin`, `suite_admin` | Also delete Routers. |

The admin token allows every Router operation. Without OIDC, use the admin token, as [Admin token mode](/content/operate/iris/self-managed/_index.md#admin-token-mode) describes.

Load the admin token and the Identity Service control token from their Secrets before you call the control plane or the Identity Service:

```bash
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-intent-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  iris-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

## Router authorization and grants

An agent key needs a grant on each Router it uses:

| Grant field | Value |
| --- | --- |
| `tenant` | The suite's `global.iris.tenantId`. |
| `product` | `intent` |
| `resourceType` | `intent-router` |
| `resourceId` | The Router ID, which starts with `rtr_`. |
| `actions` | `read`, `write`, or `full` |

| Action | What it allows |
| --- | --- |
| `read` | Match queries, read intents and examples, and check the Router's health. |
| `write` | Create, change, and delete intents and examples, and clear the Router. Includes `read`. |
| `full` | Includes `write`. No operation needs more than `write` today. |

A grant can't use a wildcard resource ID and can't carry constraints. The Identity Service mints a key only for a Router that exists in the tenant. It asks the control plane to confirm this through the grant-validation callback, authenticated with the internal token.

The data plane checks every key with the Identity Service, which caches the answer. A revoked key stops working within the Identity Service's cache lifetime, `identityService.runtime.cache.hardTtlSeconds`, 300 seconds by default. The [API examples](/content/operate/iris/intent-router/self-managed/api-examples.md#mint-an-agent-key) show the complete request.

## Rotate credentials

To rotate a token, change its Secret in place, as [Credentials](/content/operate/iris/self-managed/_index.md#credentials) describes. Intent Router and the Identity Service mount the same internal token and runtime credential Secrets, so one change covers both. Rotate an agent key with the Identity Service, as shown in [Rotate or revoke agent keys](/content/operate/iris/intent-router/self-managed/api-examples.md#rotate-or-revoke-agent-keys).

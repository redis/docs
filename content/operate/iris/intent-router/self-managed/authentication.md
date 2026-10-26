---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Understand the Intent Router credentials, agent-key grants, and how to load the admin token.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control plane admin token | Operator → control plane (`:9400`) | The Secret in `controlplane.adminToken` | Yes, by default | Router administration: `/iris/v2/intent/routers` and `/iris/v2/intent/models` |
| Control plane internal token | Identity Service → control plane | The Secret in `controlplane.internalToken` | Yes, by default | Checking that the Router in a grant exists |
| Identity Service control token | Operator → Identity Service (`:9200`) | The Secret in `identityService.controlToken` | Yes, by default | Creating, listing, rotating, and revoking agent keys |
| Identity Service runtime token | Data plane → Identity Service | The Secret in `identityService.runtimeToken` | Yes, by default | Checking agent keys for `intent` |
| Agent key | Application → data plane (`:9401`) | None. Returned once when minted or rotated | No | Authoring and matching on the Routers its grants name |

Every token defaults to `autoGenerate: true`: the chart creates a random Secret, keeps it across upgrades, and never rotates it. Set `existingSecret` to supply your own, and set the matching `existingSecretChecksum` so the pods roll when the Secret changes. Two credentials can't reference the same Secret key, and rendering fails if they do.

An agent key gets `401` from the control plane. A key without a grant on a Router, or without the action an operation needs, gets `403` from the data plane. The data plane holds no credential for the control plane: the planes never call each other.

## Control plane admin token

Every Router operation needs the admin token in `Authorization: Bearer <token>`. The health routes need no credential.

Load the token from your Secret before you call the control plane:

```bash
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  <admin-token-secret> -o jsonpath='{.data.token}' | base64 --decode)"
```

## Router authorization and grants

An agent key needs a grant on each Router it uses:

| Grant field | Value |
| --- | --- |
| `tenant` | The deployment's `tenantId`. |
| `product` | `intent` |
| `resourceType` | `intent-router` |
| `resourceId` | The Router ID, which starts with `rtr_`. |
| `actions` | `read`, `write`, or `full` |

| Action | What it allows |
| --- | --- |
| `read` | Match queries, read intents and examples, and check the Router's health. |
| `write` | Create, change, and delete intents and examples, and clear the Router. Includes `read`. |
| `full` | Everything on the Router. Includes `write`. |

A grant can't use a wildcard resource ID and can't carry constraints. The Identity Service mints a key only for a Router that exists in the tenant. It asks the control plane to confirm this through the grant-validation callback, authenticated with the internal token.

The data plane checks every key with the Identity Service and caches the answer. A revoked key stops working within the cache's hard lifetime, `identityService.runtimeCache.hardTTLSeconds`, 300 seconds by default. The [API examples](/content/operate/iris/intent-router/self-managed/api-examples.md#mint-an-agent-key) show the complete request.

## Configure the Identity Service

When you deploy the bundled Identity Service, the chart configures it. To use an Identity Service deployed elsewhere, set `identityService.enabled=false`, point `dataplane.identityServiceBaseURL` at it, and set `identityService.runtimeToken.existingSecret` to the runtime token it accepts. Then configure that Identity Service to check grants and to accept the data plane's runtime token:

| Identity Service value | Setting |
| --- | --- |
| `runtime.serviceCredentials[]` | A credential for the data plane with `allowedOperations: [api-key-introspect]` and `allowedProducts: [intent]`, from the same Secret as `identityService.runtimeToken`. |
| `productValidation.products.intent.baseURL` | The control plane Service, for example `http://intent-redis-intent-router-controlplane:9400`. |
| `productValidation.products.intent.credential` | The same Secret as `controlplane.internalToken`. |
| `runtime.apiKeyTenant.singleTenantID` | The same value as `tenantId`. |

## Rotate credentials

To rotate a token, update its Secret and its `existingSecretChecksum` and run `helm upgrade`, so the pods roll. Rotate the control plane internal token on the Identity Service release at the same time, because the two must match. Rotate an agent key with the Identity Service, as shown in [Rotate or revoke agent keys](/content/operate/iris/intent-router/self-managed/api-examples.md#rotate-or-revoke-agent-keys).

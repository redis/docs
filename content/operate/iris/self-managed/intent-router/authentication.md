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
aliases:
- /operate/iris/intent-router/self-managed/authentication/
---

Self-managed Intent Router uses two kinds of credentials. Service tokens authenticate operators and the Intent Router components to each other, and the chart generates them for you by default. Agent keys authenticate applications to the data plane, and each key's grants control which Routers it can use and what it can do on them.

This page lists each credential and what it unlocks. It also shows how to load the administration tokens and how grants authorize agent keys. It then covers connecting an Identity Service deployed outside this chart and rotating credentials.

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control-plane admin token | Operator → control plane (`:9400`) | The Secret in `controlplane.adminToken` | Yes, by default | Router administration: `/iris/v1/intent/routers` and `/iris/v1/intent/models` |
| Control-plane internal token | Identity Service → control plane | The Secret in `controlplane.internalToken` | Yes, by default | Checking that the Router in a grant exists |
| Identity Service control token | Operator → Identity Service (`:9200`) | The Secret in `identityService.controlToken` | Yes, by default | Creating, listing, rotating, and revoking agent keys |
| Identity Service runtime token | Data plane → Identity Service | The Secret in `identityService.runtimeToken` | Yes, by default | Checking agent keys for `intent` |
| Agent key | Application → data plane (`:9401`) | None. Returned once when minted or rotated | No | Authoring and matching on the Routers its grants name |

Every token defaults to `autoGenerate: true`: without `existingSecret`, the chart creates a random Secret named `<release>-redis-intent-router-<component>-token`, with the key `token`, keeps it across upgrades, and never rotates it. For a release named `intent`, the admin token is in `intent-redis-intent-router-controlplane-admin-token`. Set `existingSecret` to supply your own, and set the matching `existingSecretChecksum` so the pods roll when the Secret changes. Two credentials can't reference the same Secret key, and rendering fails if they do.

An agent key gets `401` from the control plane. A key without a grant on a Router, or without the action an operation needs, gets `403` from the data plane. The data plane holds no credential for the control plane: the planes never call each other.

## Load the administration tokens

Every Router operation needs the admin token in `Authorization: Bearer <token>`, and every agent-key operation needs the Identity Service control token. The health routes need no credential.

Load both from their Secrets before you call the control plane or the Identity Service. With the Secret names from [Deploy](/content/operate/iris/self-managed/intent-router/deploy.md#2-create-secrets):

```bash
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  intent-controlplane-admin -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  intent-identity-control -o jsonpath='{.data.token}' | base64 --decode)"
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
| `full` | Includes `write`. No operation needs more than `write` today. |

A grant can't use a wildcard resource ID and can't carry constraints. The Identity Service mints a key only for a Router that exists in the tenant. It asks the control plane to confirm this through the grant-validation callback, authenticated with the internal token.

The data plane checks every key with the Identity Service, which caches the answer. A revoked key stops working within the Identity Service's cache lifetime, `identityService.runtimeCache.hardTTLSeconds`, 300 seconds by default. The [API examples](/content/operate/iris/self-managed/intent-router/api-examples.md#mint-an-agent-key) show the complete request.

## Configure the Identity Service

When you deploy the bundled Identity Service, the chart configures it. To use an Identity Service deployed elsewhere, set `identityService.enabled=false`, point `dataplane.identityServiceBaseURL` at it, and set `identityService.runtimeToken.existingSecret` to the runtime token it accepts. Then set these values in that Identity Service's release, so it checks grants and accepts the data plane's runtime token:

| Identity Service value | Setting |
| --- | --- |
| `runtime.serviceCredentials[]` | An entry for the data plane with a `name` and `subject` (for example `intent-dataplane`), `allowedOperations: [api-key-introspect]`, `allowedProducts: [intent]`, and `existingSecret` set to the same Secret as `identityService.runtimeToken`. |
| `productValidation.products.intent.enabled` | `true` |
| `productValidation.products.intent.baseURL` | The control-plane Service, for example `http://intent-redis-intent-router-controlplane:9400`. |
| `productValidation.products.intent.credential.existingSecret` | The same Secret as `controlplane.internalToken`. |
| `runtime.apiKeyTenant.singleTenantID` | The same value as `tenantId`. |

## Rotate credentials

To rotate a token, update its Secret and its `existingSecretChecksum` and run `helm upgrade`, so the pods roll. When the Identity Service runs in its own release, rotate the internal token there at the same time, because the two must match. Rotate an agent key with the Identity Service, as shown in [Rotate or revoke agent keys](/content/operate/iris/self-managed/intent-router/api-examples.md#rotate-or-revoke-agent-keys).

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

Self-managed Intent Router uses two kinds of credentials. Service tokens authenticate operators and the Intent Router components to each other. The chart generates the control-plane tokens for you by default. Agent keys authenticate applications to the data plane, and each key's grants control which Routers it can use and what it can do on them.

This page lists each credential and what it unlocks. It also shows how to load the administration tokens and how grants authorize agent keys. It then covers connecting an Identity Service deployed outside this chart and rotating credentials.

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control-plane admin token | Operator → control plane (`:9400`) | The Secret in `controlplane.adminToken` | Yes, by default | Router administration: `/iris/v1/intent/routers` and `/iris/v1/intent/models` |
| Control-plane internal token | Identity Service → control plane | The Secret in `controlplane.internalToken` | Yes, by default | Checking that the Router in a grant exists |
| Identity Service control token | Operator → Identity Service (`:9200`) | Set on the Identity Service release with `control.*`. That chart generates `<fullname>-control-token` by default | Yes, by the Identity Service release | Creating, listing, rotating, and revoking agent keys |
| Identity Service runtime token | Data plane → Identity Service | The Secret in `identityService.credential` / `token` | No. Register it on the Identity Service release | Checking agent keys for `intent` |
| Agent key | Application → data plane (`:9401`) | None. Returned once when minted or rotated | No | Authoring and matching on the Routers its grants name |

`controlplane.adminToken` and `controlplane.internalToken` default to `autoGenerate: true`: without `existingSecret`, the chart creates a random Secret named `<release>-redis-intent-router-controlplane-admin-token` or `-internal-token`, with the key `token`, keeps it across upgrades, and never rotates it. For a release named `intent`, the admin token is in `intent-redis-intent-router-controlplane-admin-token`. The chart never generates `identityService.credential`. Set `existingSecret` to supply your own, and set the matching `existingSecretChecksum` so the pods roll when the Secret changes. Two credentials can't reference the same Secret key, and rendering fails if they do.

An agent key gets `401` from the control plane. A key without a grant on a Router, or without the action an operation needs, gets `403` from the data plane. The data plane holds no credential for the control plane: the planes never call each other.

## Load the administration tokens

Every Router operation needs the admin token in `Authorization: Bearer <token>`, and every agent-key operation needs the Identity Service control token. The health routes need no credential.

Load both from their Secrets before you call the control plane or the Identity Service. The admin token uses the Secret name from [Deploy](/content/operate/iris/intent-router/self-managed/deploy.md#2-create-secrets). The control token example assumes an Identity Service release named `ids` that generates its control token; with `control.existingSecret`, read that Secret instead:

```bash
export IRIS_INTENT_ROUTER_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  intent-controlplane-admin -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  ids-iris-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
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

The data plane checks every key with the Identity Service, which caches the answer. A revoked key stops working within the Identity Service's cache lifetime, `runtime.cache.hardTtlSeconds` on the Identity Service release, 300 seconds by default. The [API examples](/content/operate/iris/intent-router/self-managed/api-examples.md#mint-an-agent-key) show the complete request.

## Configure the Identity Service

The Intent Router chart deploys no Identity Service. Install the Identity Service as its own release, point `dataplane.identityServiceBaseURL` at it, and set `identityService.credential.existingSecret` to the runtime credential it accepts. For an `http://` in-cluster URL, also set `identityService.allowInsecureTransport=true`; the FIPS profile refuses it. Then set these values in the Identity Service release, so it checks grants and accepts the data plane's runtime credential:

| Identity Service value | Setting |
| --- | --- |
| `runtime.serviceCredentials[]` | An entry for the data plane with a `name` and `subject` (for example `intent-dp`), `allowedOperations: [api-key-introspect]`, `allowedProducts: [intent]`, and the same `existingSecret` and `secretKey` as `identityService.credential`. |
| `productValidation.products.intent.enabled` | `true` |
| `productValidation.products.intent.baseURL` | The control-plane Service, for example `http://intent-redis-intent-router-controlplane:9400`. |
| `productValidation.products.intent.credential.existingSecret` | The same Secret as `controlplane.internalToken`. |
| `runtime.apiKeyTenant.singleTenantID` | The same value as `tenantId`. |

{{< note >}}
Use Identity Service chart `1.0.0` or later. Earlier releases don't accept the `intent` product in `allowedProducts` or `productValidation.products`.
{{< /note >}}

## Rotate credentials

To rotate a token, update its Secret and its `existingSecretChecksum` and run `helm upgrade`, so the pods roll. Rotate the internal token on the Identity Service release at the same time, because the two must match. Rotate an agent key with the Identity Service, as shown in [Rotate or revoke agent keys](/content/operate/iris/intent-router/self-managed/api-examples.md#rotate-or-revoke-agent-keys).

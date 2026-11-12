---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Understand the Agent Playbooks credentials, load the administration tokens, scope agent-key grants, and configure operator sign-in with OpenID Connect.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

Self-managed Agent Playbooks uses administrative tokens for management and scoped agent keys for applications.

| Caller | API | Credential |
| --- | --- | --- |
| Playbook administrator | Control plane, `/iris/v1/agent-playbooks` | Admin token, or an operator's OpenID Connect (OIDC) access token. |
| Key administrator | Identity Service, `/v1/api-keys` | Identity Service control token. |
| Application or agent | Data plane, `/iris/data/v1/agent-playbooks` | Agent key with grants for the requested playbook. |
| Administrator working with content | Data plane, `/iris/data/v1/agent-playbooks` | Admin token, or an OIDC access token with a mapped admin role. |

Keep administrative tokens out of application configuration and model prompts.

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Admin token | Operator → control plane (`:9200`) and data plane (`:9201`) | `playbook-controlplane-admin-token` / `token` | Yes (`controlplane.adminToken.autoGenerate`) | Full Agent Playbooks access in `tenantId` on both planes, including content, proposals, and skill uploads |
| Control-plane internal token | Identity Service → control plane | `playbook-controlplane-internal` / `token` in the walkthrough | You provision it for both releases | Validating playbook grants before a key is stored. Set `controlplane.internalToken.existingSecret` on Agent Playbooks and `productValidation.products.playbook.credential.existingSecret` on Identity Service. |
| Data-plane runtime credential | Data plane → Identity Service | `playbook-dp-credential` / `token` in the walkthrough | You provision it for both releases | Checking agent keys for `playbook`. Set `identityService.credential.existingSecret` on Agent Playbooks and register it in `runtime.serviceCredentials[]` as `playbook-dp` on Identity Service. |
| Identity Service control token | Operator → Identity Service (`:9200`) | `ids-control-token` / `token` in the walkthrough | Supplied through `control.existingSecret` on Identity Service; that chart can also generate one | Creating, listing, rotating, and revoking agent keys |

Keep every credential distinct. The chart refuses to mount one Secret key as two of its credentials, but it can't compare values held in differently named Secrets.

The admin token is a shared recovery credential. It grants no access to other Iris products, and audits identify shared recovery use rather than an individual operator. Prefer [operator OIDC access](#configure-operator-oidc-access) for day-to-day administration and keep the admin token for recovery.

## Load the administrative credentials

Use an account that can read Secrets, with the [port-forwards from Deploy](/content/operate/iris/agent-playbook/self-managed/deploy.md#4-verify-the-deployment) running:

```bash
export IRIS_AGENT_PLAYBOOKS_SERVICE_URL='http://localhost:9200'
export IRIS_AGENT_PLAYBOOKS_URL='http://localhost:9201'
export IRIS_IDENTITY_URL='http://localhost:9202'
export IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN="$(kubectl -n <namespace-name> get secret \
  playbook-controlplane-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IRIS_IDENTITY_TOKEN="$(kubectl -n <namespace-name> get secret \
  ids-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

The Secret name assumes `fullnameOverride: playbook` and a chart-generated admin token. If you set `controlplane.adminToken.existingSecret`, read that Secret, or load the token from your secret manager. The [API examples](/content/operate/iris/agent-playbook/self-managed/api-examples.md) and the Iris command-line interface (CLI) read these variables.

## Supply the admin token

By default, the chart generates the admin token in a Secret annotated `helm.sh/resource-policy: keep` and reuses its value on each live `helm upgrade`. For GitOps or offline chart rendering, which can't look up the existing value, supply your own Secret so a fresh render doesn't generate a new token:

```yaml
controlplane:
  adminToken:
    existingSecret: playbook-controlplane-admin
    autoGenerate: false
```

The same `existingSecret`, `secretKey` (default `token`), `autoGenerate`, and `existingSecretChecksum` settings apply to `controlplane.internalToken`. The data-plane runtime credential has no generator; you always supply it.

## Agent-key grants

Each grant names a tenant, the `playbook` product and resource type, one playbook ID, and its actions:

```json
{
  "tenant": "default",
  "product": "playbook",
  "resourceType": "playbook",
  "resourceId": "<playbook-id>",
  "actions": ["read"]
}
```

Set `tenant` to the deployment's `tenantId`. The Identity Service fills an omitted tenant with its `runtime.apiKeyTenant.singleTenantID` and rejects grants for another tenant. Before it stores a key, it asks the control plane to confirm that the playbook exists.

| Action | What it allows |
| --- | --- |
| `read` | Retrieve published knowledge, list and inspect entry summaries, and read proposals. |
| `write` | Create entries, append versions, inspect drafts, delete entries, and review proposals. Includes `read`. |
| `publish` | Publish or withdraw entries and inspect versions. Includes `read`. |
| `propose` | Create proposals and attach evidence. Includes `read`. |

`write` doesn't include `publish` or `propose`. See [Playbooks](/content/develop/ai/context-engine/agent-playbooks/concepts.md#playbooks) for how developers use these actions. The [key examples](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-agent-keys) show the complete request. For rotation and revocation, see [Operations](/content/operate/iris/agent-playbook/self-managed/operations.md#rotate-or-revoke-agent-keys).

## Configure operator OIDC access

You can keep the admin token and also accept OIDC access tokens from your identity provider (IdP). The control plane and data plane share one issuer, tenant source, audience, and trusted group mapping. Both validate tokens locally against the IdP's JSON Web Key Set (JWKS); neither calls the Identity Service for this. Agent keys stay enabled.

Add this overlay to `playbook-values.yaml`:

```yaml
auth:
  oidc:
    audience: api://redis-iris

dataplane:
  oidc:
    enabled: true
    issuer: https://<identity-provider-host>/<issuer-path>
    jwksURI: https://<identity-provider-host>/<jwks-path>
    tenantIDClaim: <tenant-claim>
    roleClaims:
      - groups
    roleMappings:
      <viewer-group>: viewer
      <operator-group>: operator
      <playbook-admin-group>: product_admin

controlplane:
  oidc:
    enabled: true
```

- `auth.oidc.audience` is the value your IdP puts in the token's `aud` claim. It defaults to `api://redis-iris`, the audience shared by every Iris service; use the same value in every Iris chart. On Entra ID with v2 tokens, use the API's Application (client) ID instead. The chart refuses an empty or wildcard audience.
- `issuer` is compared with the token's `iss` claim and is never fetched, so it can use `http://`, including under the Federal Information Processing Standards (FIPS) profile. On Active Directory Federation Services (AD FS), set it to the discovery document's `access_token_issuer`, such as `http://<adfs-host>/adfs/services/trust`.
- `jwksURI` is fetched for signing keys, so it must use `https://` unless you set the development-only `allowInsecureTransport: true`. The FIPS profile refuses that setting. Mount a private CA through `tls.caCertSecret` when the IdP uses one, and allow both planes egress to the JWKS endpoint.
- Set exactly one of `tenantIDClaim` and `staticTenantID`. A resolved or static tenant must equal `tenantId`. Use `staticTenantID` only when the issuer and its mapped groups are confined to this deployment's tenant.
- `controlplane.oidc.enabled` requires `dataplane.oidc.enabled` and non-empty `roleMappings`.

`roleMappings` defaults to empty. Unmapped claim values grant no access, even when a value matches an Iris role name. Map only trusted human administrator groups, and keep service identities out of them.

The control plane applies these role tiers:

| Role | Control-plane access |
| --- | --- |
| `viewer` | List models, and list and read playbooks. |
| `operator` | Viewer access plus create and update playbooks. |
| `product_admin`, `suite_admin` | Operator access plus clear or delete playbooks, and list extraction sources and create or enable extraction bindings. |

On the data plane, explicitly mapped `product_admin` and `suite_admin` users receive full Agent Playbooks access within the configured tenant.

The planes cache the JWKS for 10 minutes and allow 5 minutes of clock skew. If a key refresh fails and no cached key validates the token, the request fails with a temporary service error rather than an authentication error. A signed token normally stays usable until it expires. Account for these fixed defaults when you set token lifetimes and retire an IdP signing key.

## OIDC access to agent-key administration

The Identity Service has its own OIDC policy for its control API, configured on the Identity Service release with `controlAuth.oidc` and `controlAuth.roleBindings`. Configure it when operators must manage agent keys without the Identity Service control token. The control token remains available as a deployment-administration credential. See [operator sign-in with your identity provider](/content/operate/iris/identity-service/authentication.md#operator-sign-in-with-your-identity-provider) in the Identity Service guide.

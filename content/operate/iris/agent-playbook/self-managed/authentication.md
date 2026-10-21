---
Title: Agent Playbooks authentication and access
alwaysopen: false
categories:
- docs
- operate
- iris
description: Separate administrative credentials from application API keys and grant access to self-managed playbooks.
linkTitle: Authentication and access
weight: 60
hideListLinks: true
---

Use administrative tokens for management and scoped API keys for applications.

| Caller | API | Credential |
| --- | --- | --- |
| Playbook administrator | Control plane, `/v1/playbooks` | Control-plane admin token. |
| Key administrator | Identity Service, `/v1/api-keys` | Identity Service control token. |
| Application or agent | Playbook data plane | API key with grants for the requested playbook. |

Keep both administrative tokens out of application configuration and model prompts.

## Read the bootstrap credentials

For [chart-generated credentials]({{< relref "/operate/iris/agent-playbook/self-managed/deploy" >}}), use an account that can read Secrets to load the administrative tokens:

```bash
export PLAYBOOK_ADMIN_TOKEN="$(kubectl -n "$PLAYBOOK_NAMESPACE" get secret \
  playbook-controlplane-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IDENTITY_CONTROL_TOKEN="$(kubectl -n "$PLAYBOOK_NAMESPACE" get secret \
  playbook-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

The Secret names assume `fullnameOverride: playbook`. If you supply credentials externally, load them from your secret manager instead.

Use these tokens to [create a playbook and application keys]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}). See [playbook grants]({{< relref "/develop/ai/context-engine/agent-playbook/concepts#playbooks" >}}) for allowed actions.

## Supply service credentials

By default, the chart generates four service credentials. It retains their Secrets and reuses the values during live Helm upgrades.

For GitOps or offline chart rendering, supply existing Secrets to avoid generating new credentials on each render. Use a different value for each of the four credentials.

| Credential | Helm Secret reference | Used by |
| --- | --- | --- |
| Control-plane admin token | `controlplane.adminToken.existingSecret` | Operators administering playbooks. |
| Control-plane internal token | `controlplane.internalToken.existingSecret` | Identity Service validating playbook grants. |
| Identity Service control token | `identityService.controlToken.existingSecret` | Operators administering application keys. |
| Identity Service runtime token | `identityService.runtimeToken.existingSecret` | Data plane validating application keys. |

Each block supports `secretKey` (default `token`), `autoGenerate`, and `existingSecretChecksum`. Set `autoGenerate: false` to require an externally managed Secret.

For example, provision four Secrets with a `token` key and add this overlay to `playbook-values.yaml`:

```yaml
controlplane:
  adminToken:
    existingSecret: playbook-controlplane-admin
    autoGenerate: false
  internalToken:
    existingSecret: playbook-controlplane-internal
    autoGenerate: false

identityService:
  controlToken:
    existingSecret: playbook-identity-control
    autoGenerate: false
  runtimeToken:
    existingSecret: playbook-identity-runtime
    autoGenerate: false
```

## Tenant and grant scope

Set each grant's `tenant` to the deployment's `tenantId` and scope it to a playbook and allowed actions. The [key examples]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples#create-application-keys" >}}) show the complete request.

For rotation and revocation, see [Operations]({{< relref "/operate/iris/agent-playbook/self-managed/operations#rotate-or-revoke-application-keys" >}}).

## Configure operator OIDC access

You can keep the bootstrap tokens and also accept OpenID Connect (OIDC) access tokens from your identity provider. The control plane and data plane share one issuer, tenant source, audience, and trusted group mapping.

Add this overlay to `playbook-values.yaml`:

```yaml
auth:
  oidc:
    audience: <iris-api-audience>

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

Set exactly one of `tenantIDClaim` and `staticTenantID`. A resolved or static tenant must equal `tenantId`. Use a static tenant only when the issuer and mapped groups are restricted to this deployment's tenant.

The control plane applies these role tiers:

| Role | Control-plane access |
| --- | --- |
| `viewer` | List models and read playbooks. |
| `operator` | Viewer access plus create and update playbooks and manage extraction bindings. |
| `product_admin`, `suite_admin` | Operator access plus clear or delete playbooks. |

On the data plane, explicitly mapped `product_admin` and `suite_admin` users receive full access within the configured tenant. Unmapped claim values grant no access, even when a value matches an Iris role name. Keep service identities out of human administrator groups.

The issuer and JSON Web Key Set (JWKS) endpoints must use HTTPS unless you set the development-only `allowInsecureTransport: true`. The Federal Information Processing Standards (FIPS)-oriented profile requires HTTPS. Mount a private certificate authority through `tls.caCertSecret` when required.

## Configure OIDC access to API-key administration

Identity Service Control has a separate OIDC policy. Configure it when operators must manage application keys without the bootstrap control token:

```yaml
identityService:
  controlAuth:
    oidc:
      enabled: true
      issuer: https://<identity-provider-host>/<issuer-path>
      jwks_uri: https://<identity-provider-host>/<jwks-path>
      audience:
        - <identity-service-audience>
      role_mappings:
        <playbook-admin-group>: product_admin
    roleBindings:
      - claim_value: <playbook-admin-group>
        scope: product
        product: playbook
        role: product_admin
```

The control token remains available as a deployment-administration credential. By default, `identityService.apiKeyTenant.singleTenantID` inherits `tenantId`. Identity Service fills an omitted grant tenant with that value and rejects grants for another tenant.

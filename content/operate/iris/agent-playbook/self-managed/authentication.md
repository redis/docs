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

For the two releases' [chart-generated administrative credentials]({{< relref "/operate/iris/agent-playbook/self-managed/deploy" >}}), use an account that can read Secrets to load the administrative tokens:

```bash
export PLAYBOOK_ADMIN_TOKEN="$(kubectl -n "$PLAYBOOK_NAMESPACE" get secret \
  playbook-controlplane-admin-token -o jsonpath='{.data.token}' | base64 --decode)"
export IDENTITY_CONTROL_TOKEN="$(kubectl -n "$PLAYBOOK_NAMESPACE" get secret \
  playbook-identity-service-control-token -o jsonpath='{.data.token}' | base64 --decode)"
```

The Secret names assume the Playbook and Identity Service naming overrides from the deployment values. If you supply credentials externally, load them from your secret manager instead.

Use these tokens to [create a playbook and application keys]({{< relref "/operate/iris/agent-playbook/self-managed/api-examples" >}}). See [playbook grants]({{< relref "/develop/ai/context-engine/agent-playbook/concepts#playbooks" >}}) for allowed actions.

## Supply service credentials

Use four distinct credentials. The installation procedure supplies existing Secrets for shared internal and runtime credentials; the two charts generate their own administrative tokens unless you supply them.

| Credential | Playbook values | Identity Service values |
| --- | --- | --- |
| Control-plane admin token | `controlplane.adminToken.existingSecret` | Not shared. |
| Control-plane internal token | `controlplane.internalToken.existingSecret` | `productValidation.products.playbook.credential.existingSecret` |
| Identity Service control token | Not shared. | `control.existingSecret` |
| Data-plane runtime credential | `identityService.credential.existingSecret` | `runtime.serviceCredentials[]` entry named `playbook-dp`: `existingSecret` |

Secret keys default to `token`. The shared values must match on both releases. The runtime credential allows `api-key-introspect` for `playbook`; extraction needs no additional lookup operation. Preserve independently configured service-subject integrations.

To supply existing administrative tokens too, add this to `playbook-values.yaml`:

```yaml
controlplane:
  adminToken:
    existingSecret: playbook-controlplane-admin
    autoGenerate: false
```

Add this to `identity-values.yaml`:

```yaml
control:
  existingSecret: playbook-identity-control
  autoGenerate: false
```

Provision those Secrets before installing. Load externally managed credentials from your secret manager instead of the chart-generated names.

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
| `operator` | Viewer access plus create and update playbooks; inspect extraction bindings, update their FAQ policy, pause, or delete them. |
| `product_admin`, `suite_admin` | Operator access plus clear or delete playbooks; list extraction sources, create bindings, and enable or recover them. |

On the data plane, explicitly mapped `product_admin` and `suite_admin` users receive full access within the configured tenant. Unmapped claim values grant no access, even when a value matches an Iris role name. Keep service identities out of human administrator groups.

The issuer and JSON Web Key Set (JWKS) endpoints must use HTTPS unless you set the development-only `allowInsecureTransport: true`. The Federal Information Processing Standards (FIPS)-oriented profile requires HTTPS. Mount a private certificate authority through `tls.caCertSecret` when required.

## Configure OIDC access to API-key administration

Identity Service Control has a separate OIDC policy. Add this to `identity-values.yaml` when operators must manage application keys without the bootstrap control token:

```yaml
controlAuth:
  oidc:
    enabled: true
    issuer: https://<identity-provider-host>/<issuer-path>
    jwks_uri: https://<identity-provider-host>/<jwks-path>
    audience:
      - <identity-service-audience>
  roleBindings:
    - claim_value: <playbook-admin-group>
      scope: product
      product: playbook
      role: product_admin
```

The control token remains available as a deployment-administration credential. Set `runtime.apiKeyTenant.singleTenantID` in the Identity Service values to Playbook's `tenantId`. Identity Service fills an omitted grant tenant with that value and rejects grants for another tenant.

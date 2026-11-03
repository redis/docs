---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Understand the Identity Service credentials and roles, let operators sign in with your identity provider, and give IdP users subject grants.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

The Identity Service uses separate credentials for each job: operators manage agent keys through its control API, product planes call its runtime API, and agents present agent keys to product data planes. This page lists each credential and the roles on the control API. It then shows how to let operators sign in with your identity provider (IdP) and how to give IdP users access with subject grants.

## Credentials

| Credential | Who presents it to whom | Secret / key | What it unlocks |
| --- | --- | --- | --- |
| Control token | Operator → Identity Service control API (`:9200`) | `control.existingSecret` / `token`, or the generated `<release>-iris-identity-service-control-token` | Every control operation: create, list, update, rotate, and revoke agent keys, and manage subject grants. |
| Operator access token | Operator → Identity Service control API | None. Issued by your IdP | The control operations of the operator's roles, from `controlAuth.roleBindings`. |
| Workload token | Kubernetes workload → Identity Service control API | None. A projected service account token | Subject grant operations only, from `controlAuth.workloadIdentity`. |
| Runtime credential | Product data plane → Identity Service runtime API | The shared Secret in a `runtime.serviceCredentials[]` entry | Checking agent keys, and reading subject grants when allowed, for the entry's products. |
| Internal token | Identity Service → product control plane | The shared Secret in `productValidation.products.<product>.credential` | Grant validation: confirming that a resource exists before a key is stored. |
| Agent key | Agent → product data plane | None. Returned once when minted or rotated | The resources and actions its grants name. |

Each credential needs its own value. The Identity Service doesn't start when two credentials have the same value, and the chart refuses to render when two reference the same Secret key.

The control token is a shared secret, and the audit log can't name a person for it. Keep it for setup and recovery, and let operators sign in with your IdP for daily work.

## Agent keys and grants

An agent key looks like `iris_<key-id>.<secret>`. The Identity Service returns the full key only in the response to a mint or a rotation, and stores only a SHA-256 hash of it. If you lose a key, rotate it or mint a new one.

Each key carries one or more grants:

| Grant field | Meaning | Example |
| --- | --- | --- |
| `tenant` | The installation's tenant. If you omit it, the Identity Service adds `runtime.apiKeyTenant.singleTenantID`. | `default` |
| `product` | The Iris product. | `memory` |
| `resourceType` | The type of resource in that product. | `mem-store` |
| `resourceId` | One resource. Wildcards aren't accepted. | `<store-id>` |
| `actions` | What the key can do with the resource. | `["read", "write"]` |

| Product | `product` | `resourceType` | Actions |
| --- | --- | --- | --- |
| Agent Memory | `memory` | `mem-store` | `read`; `write` (includes `read`); `full` (includes `write`) |
| Agent Playbooks | `playbook` | `playbook` | `read`; `write`, `publish`, and `propose` (each includes `read`); `full` (includes all) |
| Context Gateway | `context-gateway` | `gateway` | `use`; `full` (includes `use`) |
| Intent Router | `intent` | `intent-router` | `read`; `write` (includes `read`); `full` (includes `write`) |
| Lens | `lens` | `lens-instance` | `ingest` and `read`, independent of each other; `full` (includes both) |

All the grants of one key use the same tenant. Each product's authentication page explains what its actions allow. To mint and manage keys, see [Manage agent keys](/content/operate/iris/identity-service/operations.md#manage-agent-keys).

## Roles on the control API

| Caller | How it gets the role | What it can do |
| --- | --- | --- |
| Control token | It holds the token | Every operation. |
| `suite_admin` | A role binding with `scope: global` | Every operation for every product, in its own tenant only. |
| `product_admin` | A role binding with `scope: product` and a `product` | Every operation for that product, in its own tenant only. |
| `subject_grant_admin` | A workload identity subject | Subject grant operations only, in its own tenant. |
| `deployment_admin` | A role binding with `scope: deployment` and an `issuer` | Support work across tenants: list, read, and revoke keys, and list and delete subject grants. It can't create, update, or rotate keys, or add grants. An installation with one tenant doesn't need it. |
| Any other caller | None | Nothing. The request gets `403`. |

The product control-plane roles, such as `operator` and `viewer`, give no access to the Identity Service control API. An operator who must mint keys needs `suite_admin` or `product_admin` here, in addition to their role on the product's control plane.

If one of an operator's roles is `deployment_admin`, that operator can't create, update, or rotate keys, also in their own tenant and also when they have another role. Give `deployment_admin` only to people who don't need those operations.

## Operator sign-in with your identity provider

Operators can call the control API with an access token from your IdP, using OpenID Connect (OIDC). The audit log then names each operator, and you can grant access by IdP group. The control token keeps working.

### 1. Register Iris in your IdP

1. Register one API for the whole Iris suite with one audience, for example `api://redis-iris`. On Microsoft Entra ID v2, the audience is the API's application (client) ID. Use the same audience that the product control planes accept.
1. Create groups or app roles for key administrators, for example `iris-suite-admins` and `memory-admins`, and assign operators to them.
1. Make sure the group or role values reach the access token. On Entra ID, prefer app roles: raw `groups` claims arrive as IDs and are dropped for users in many groups. On Okta, add a groups claim with a filter.
1. Restrict the application to the assigned groups. On Entra ID, set **User assignment required** to **Yes**.

### 2. Configure `controlAuth`

Add these values to `values-ids.yaml`:

```yaml
controlAuth:
  oidc:
    enabled: true
    issuer: https://<idp-host>/<issuer-path>
    jwks_uri: https://<idp-host>/<jwks-path>
    audience: [api://redis-iris]
  roleBindings:
    - {claim_value: iris-suite-admins, scope: global, role: suite_admin}
    - {claim_value: memory-admins, scope: product, product: memory, role: product_admin}
```

- The fields under `oidc` use snake_case, because the chart copies them into the service configuration as written.
- `issuer` must equal the token's `iss` claim exactly, including its scheme. The Identity Service never fetches it. On Active Directory Federation Services (AD FS), use the discovery document's `access_token_issuer`.
- `jwks_uri`, the JSON Web Key Set (JWKS) URI, must use `https://`. The pod must reach it and trust its CA. See [TLS, FIPS, and network](/content/operate/iris/identity-service/configuration.md#tls-fips-and-network).
- Role bindings match the values of the `roles` and `groups` claims by default. Set `role_claims` under `oidc` to read other claims. A `claim_value` matches without regard to letter case.
- With `runtime.apiKeyTenant.singleTenantID` set, the chart adds the tenant for you. Rendering fails if you also set `tenant_id_claim` or a different `static_tenant_id`.
- The control API refuses `allow_unmapped_roles`. Use `roleBindings` for every role.

### 3. Apply and check

1. Run `helm upgrade ids redis-ai/iris-identity-service --version 1.0.0 -n <namespace-name> -f values-ids.yaml`.
1. Get an access token for an operator from your IdP.
1. Call the control API with it:

   ```bash
   curl -sS -o /dev/null -w '%{http_code}\n' \
     -H "Authorization: Bearer <operator-access-token>" \
     "$IRIS_IDENTITY_URL/v1/api-keys"
   ```

| Status | Meaning |
| --- | --- |
| `200` | The token is valid and a role binding matches. |
| `401` | The issuer, audience, or signature is wrong, or the token expired. Compare the token's `iss` and `aud` claims with `controlAuth.oidc`. |
| `403` | The token is valid, but no role binding matches its groups, or the role doesn't cover this operation or product. |
| `503` | The Identity Service can't reach the JWKS URI. The control token still works. |

The `iris` command-line interface (CLI) accepts an operator access token in `IRIS_IDENTITY_TOKEN` in place of the control token.

### Remove a role binding

To revoke a binding that gives too much access, add a [policy overlay](/content/operate/iris/identity-service/configuration.md#configuration-overlays) Secret with the same binding and `role: none`, then change `secrets.checksum` and run `helm upgrade`.

## Subject grants

A subject grant gives an IdP user or workload access to a product resource without an agent key. The product's data plane checks the user's token itself, then asks the Identity Service for the grants of that subject. The Identity Service never sees the user's token.

Context Gateway reads subject grants for users who sign in with your IdP. Agent Memory and Agent Playbooks read them only for service subjects. Lens and Intent Router don't use them.

To give IdP users access to a Context Gateway:

1. Add `subject-grant-lookup` to the data plane's runtime credential:

   ```yaml
   runtime:
     serviceCredentials:
       - name: context-gateway-dp
         subject: context-gateway-dp
         allowedOperations: [api-key-introspect, subject-grant-lookup]
         allowedProducts: [context-gateway]
         existingSecret: gateway-runtime
         secretKey: token
   ```

1. Allow the grant shape:

   ```yaml
   subjectGrants:
     allowed:
       - {product: context-gateway, resourceType: gateway, actions: [use]}
   ```

1. Run `helm upgrade` for the Identity Service release.
1. Give the grant to the user. The `subject` is the value of the user's `sub` claim, or of the claim that the data plane reads as the user ID:

   ```bash
   curl -sS -X POST "$IRIS_IDENTITY_URL/v1/subject-grants/apply" \
     -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{
       "issuer": "https://<idp-host>/<issuer-path>",
       "subject": "<user-id>",
       "product": "context-gateway",
       "grants": {"gateway": {"<gateway-id>": {"actions": ["use"]}}}
     }'
   ```

   The control token must send `issuer`. An operator who signs in with the IdP can omit it, and the Identity Service uses the issuer of the operator's token.

1. To remove the grant, send the same request with `"<gateway-id>": null`. The data plane can keep using its cached grants for up to `runtime.cache.hardTtlSeconds`.

The issuer must equal the user token's `iss` claim exactly. Don't use an email address as the subject, because a user can change it.

These resource types accept subject grants:

| `resourceType` | Allowed actions |
| --- | --- |
| `mem-store` | `read`, `write`, `full`, `read_all_owners` |
| `playbook` | `read`, `propose` |
| `gateway` | `use`, `full` |

If you remove a shape from `subjectGrants.allowed`, the Identity Service stops returning grants of that shape after its next restart. It doesn't delete them.

## Workload identity

A Kubernetes workload can manage subject grants with its own projected service account token instead of the control token:

```yaml
controlAuth:
  workloadIdentity:
    enabled: true
    issuer: <cluster-service-account-issuer>
    jwks_uri: <cluster-jwks-uri>
    audience: [<audience>]
    subjects:
      - subject: system:serviceaccount:<namespace-name>:<service-account-name>
        roles: [subject_grant_admin]
```

Take the issuer and the JWKS URI from the cluster's `/.well-known/openid-configuration`. A subject can't get `suite_admin`. A subject without a `tenant` gets `runtime.apiKeyTenant.singleTenantID`.

Agent Playbooks extraction from Agent Memory needs no workload identity on the Identity Service.

## Recover from a lockout

- **Your IdP is down, or the role bindings are wrong.** Use the control token. It always works.
- **You lost the control token, and the chart generated it.** Delete its Secret, if it still exists, and run `helm upgrade`. The chart generates a new token. If you supply the token with `control.existingSecret`, put a new value in your Secret. The Identity Service reads the token file on each request, so the new value works after Kubernetes updates the mounted file, in about a minute.
- **You lost the metadata Redis.** Restore it from your backup. See [Back up and restore](/content/operate/iris/identity-service/operations.md#back-up-and-restore).

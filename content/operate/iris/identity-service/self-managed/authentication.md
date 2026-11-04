---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Understand the Identity Service credentials, agent keys, tenants, and roles, let operators sign in with your identity provider, and recover from a lockout.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
aliases:
- /operate/iris/identity-service/authentication/
---

The Identity Service uses a separate credential for each job: operators manage agent keys through its control API, service planes call its runtime API, and agents present agent keys to service data planes. This page lists each credential, the agent key grants, tenants, and the roles on the control API. It then shows how to let operators sign in with your identity provider (IdP).

## Credentials

| Credential | Held by | What it does |
| --- | --- | --- |
| Control token | The operator, in a Kubernetes Secret | The rescue credential. It can do every control operation. |
| Operator access token | An operator who signs in to your IdP | Gives the operator's control roles, from `global.iris.auth.roleBindings`. |
| Runtime credential | A service data plane, for example `memory-dp` | Lets the data plane check agent keys. |
| Internal token | A service control plane and the Identity Service | Lets the Identity Service ask the control plane whether a grant is valid. |
| Agent key | An agent | Gives the agent access to service resources. |

Each credential has one job, so don't use one value for two jobs. The Identity Service doesn't start when two of the control token, the runtime credentials, and the internal tokens have the same value.

The control token is a shared secret, and the audit log can't name a person for it. Keep it for setup and recovery, and let operators [sign in with your IdP](#operator-sign-in-with-your-identity-provider) for daily work.

## Agent keys and grants

An agent key looks like `iris_<key-id>.<secret>`. The Identity Service returns the full key only once, in the response to a create or a rotation, and stores only a SHA-256 hash of it. If you lose a key, rotate it or create a new one.

Each key has one or more grants:

| Grant field | Meaning | Example |
| --- | --- | --- |
| `product` | The Iris service. | `memory` |
| `resourceType` | The type of resource in that service. | `mem-store` |
| `resourceId` | One resource. Wildcards aren't accepted. | `<store-id>` |
| `actions` | What the key can do with the resource. | `["read", "write"]` |
| `tenant` | The resource's tenant. The Identity Service adds it. | `default` |

| Service | `product` | `resourceType` | Actions |
| --- | --- | --- | --- |
| Agent Memory | `memory` | `mem-store` | `read`; `write` (includes `read`); `full` (includes `write`) |
| Agent Playbooks | `playbook` | `playbook` | `read`; `write`, `publish`, and `propose` (each includes `read`); `full` (includes all) |
| Lens | `lens` | `lens-instance` | `ingest` and `read`, independent of each other; `full` (includes both) |
| Context Gateway | `context-gateway` | `gateway` | `use`; `full` (includes `use`) |
| Intent Router | `intent` | `intent-router` | `read`; `write` (includes `read`); `full` (includes `write`) |

Before the Identity Service stores a grant, it asks the service's control plane whether the resource exists and the actions are valid. Each service's authentication page explains what its actions allow. To create and manage keys, see [Give an agent access with an agent key](/content/operate/iris/identity-service/self-managed/operations.md#give-an-agent-access-with-an-agent-key).

A data plane caches each key check. After you revoke a key, it can keep working for up to `runtime.cache.hardTtlSeconds`, 300 seconds by default.

### Subject grants

The control API also has routes for subject grants, `/v1/subject-grants`. In a `redis-iris` installation, no data plane reads subject grants, so they have no effect. IdP users get access from their roles in each service, and agents use agent keys.

## Tenants

A tenant is a boundary for keys, grants, and service data, such as one customer or one business unit. A caller in one tenant can't see the keys of another tenant: the Identity Service returns `404` for them.

The Identity Service has no tenant object, and no API creates, lists, or deletes tenants. A tenant is only an ID that each key, grant, and service resource carries.

A `redis-iris` release serves one tenant, set once in `global.iris.tenantId`. The chart gives this ID to the Identity Service and to each service. To serve more than one tenant, install one release for each tenant, each in its own namespace. For a preview of several tenants in one Agent Memory installation, see [Serve more than one tenant with Agent Memory](/content/operate/iris/identity-service/self-managed/multi-tenant.md).

| Task | What to do |
| --- | --- |
| Create a tenant | Choose the ID before the first install, and set `global.iris.tenantId`. |
| Change the ID | Not supported. Keys, grants, and service data keep the old ID, and no tool moves them. A new `global.iris.tenantId` doesn't make the old data available. |
| Remove a tenant | Uninstall its release, and delete its data. There is no tenant object to delete. |

A grant's `tenant` field works like this:

| `tenant` in the grant | Result |
| --- | --- |
| Not set | The Identity Service uses `global.iris.tenantId`. |
| `global.iris.tenantId` | Accepted. |
| Another tenant | `400`. |

All the grants of one key must have the same tenant.

## Roles on the control API

| Caller | How it gets the role | What it can do |
| --- | --- | --- |
| Control token | It holds the token | Every operation. |
| `suite_admin` | A role binding without `product` | Every operation for every service, in its own tenant. |
| `product_admin` | A role binding with `product` | Every operation for that service, in its own tenant. |
| `operator`, `viewer` | A role binding with `product` | No key operations. These roles apply only in the service. |
| Any other caller with a valid token | None | No key operations. |

The Identity Service also has a `deployment_admin` role, for installations with more than one tenant. A `redis-iris` release has one tenant, so it doesn't need this role, and the suite role bindings can't give it.

For each control API request, the Identity Service finds the caller's role like this:

1. If the bearer value is the control token, the caller can do every operation, and there are no more checks.
1. Otherwise, the Identity Service reads the value as a JSON Web Token (JWT) from your IdP. It checks the issuer, the signature, the audience, and the expiry. If a check fails, it returns `401`.
1. It compares the values of the role claim, `groups` by default, with the `group` of each role binding. Each matching binding gives its role, so an operator can have more than one role.
1. It checks the roles against the operation and the service. If no role allows the operation, it returns `403`.

A caller with a valid token and no role can still read `GET /v1/products`. `GET /v1/api-keys` returns `200` with only the keys the caller can manage, so for such a caller the list is empty.

For example, an operator's token has `groups: [memory-admins]`, and the binding `{group: memory-admins, role: product_admin, product: agent_memory}` matches. The operator can create keys for Agent Memory, and a key for Agent Playbooks returns `403`.

## Operator sign-in with your identity provider

Operators can call the control API with an access token from your IdP, using OpenID Connect (OIDC). The audit log then names each operator. The control token keeps working.

### 1. Register Iris in your IdP

1. Register the Iris console as a web application.
1. Register one API for the whole suite with one audience, for example `api://redis-iris`.
1. Create groups for key administrators, for example `iris-suite-admins` and `memory-admins`, and add operators to them.

### 2. Configure `global.iris.auth`

Add these values to `iris-values.yaml`, together with the `ui.sso` values from the [suite install](/content/operate/iris/self-managed/_index.md#3-write-iris-valuesyaml):

```yaml
global:
  iris:
    publicURL: https://<console-host>
    auth:
      oidc:
        issuer: https://<idp-host>/<issuer-path>
        jwksURI: https://<idp-host>/<jwks-path>
        audience: api://redis-iris
      roleBindings:
        - {group: iris-suite-admins, role: suite_admin}
        - {group: memory-admins, role: product_admin, product: agent_memory}
        - {group: memory-ops, role: operator, product: agent_memory}
```

- `issuer` is the issuer of the IdP discovery document. If the access tokens' `iss` claim differs, for example on Active Directory Federation Services (AD FS), set `accessTokenIssuer` to that value. The Identity Service compares it with the `iss` claim exactly.
- `jwksURI`, the JSON Web Key Set (JWKS) URI, must use `https://`. The pods must reach it and trust its certificate authority (CA). See [TLS, FIPS, and network](/content/operate/iris/identity-service/self-managed/configuration.md#tls-fips-and-network).
- Role bindings read the `groups` claim by default. Set `roleClaims` to read other claims. A `group` matches without regard to letter case.
- The service names in `roleBindings` are `agent_memory`, `playbook`, `lens`, `context_gateway`, and `intent`.
- On the Identity Service, only `suite_admin` and `product_admin` can manage keys.
- A binding for a service that isn't enabled has no effect. The chart keeps it, and uses it again when you enable the service.

The console sends the operator's access token to the Identity Service. The chart sets the same audience and issuer in the console and the Identity Service, so they always match.

### 3. Apply and check

1. Run `helm upgrade` for the release.
1. Get an access token for an operator from your IdP, and save it in `OPERATOR_TOKEN`.
1. Create a key for a resource of one of the operator's services, as in [Give an agent access with an agent key](/content/operate/iris/identity-service/self-managed/operations.md#give-an-agent-access-with-an-agent-key), with the operator's token. Then delete it:

   ```bash
   curl -sS -X POST "$IRIS_IDENTITY_URL/v1/api-keys" \
     -H "Authorization: Bearer $OPERATOR_TOKEN" \
     -H 'Content-Type: application/json' \
     -d '{"name": "sso-check", "grants": [<grant>]}'
   curl -sS -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
     -H "Authorization: Bearer $OPERATOR_TOKEN"
   ```

| Status | Meaning |
| --- | --- |
| `201` | The token is valid and a role binding allows the operation. |
| `401` | The issuer, audience, or signature is wrong, or the token expired. Compare the token's `iss` and `aud` claims with `global.iris.auth.oidc`. |
| `403` | No role binding gives `suite_admin`, or `product_admin` for that service, to the operator's groups. |

Don't use `GET /v1/api-keys` for this check: without a role, it returns `200` with an empty list. Keep the control token for recovery.

## Recover from a lockout

- **Your IdP is down, or the role bindings are wrong.** Use the control token. It always works.
- **The console can't sign in.** Switch the console to [admin token mode](/content/operate/iris/self-managed/_index.md#admin-token-mode) until the IdP works again.
- **You don't have the control token Secret.** If the chart generated the token (`global.iris.secrets.generate: true`), delete the Secret, if it still exists, and run `helm upgrade`. The chart generates a new token. If you supplied the Secret, create a new one with a new token yourself.
- **You lost the metadata Redis.** Restore it from your backup. See [Back up and restore](/content/operate/iris/identity-service/self-managed/operations.md#back-up-and-restore). Without it, every agent key and grant stops working.

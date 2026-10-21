---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- operate
- iris
description: Configure Redis Agent Memory self-managed Control Plane authentication, Data Plane auth modes, worker callbacks, and gateway integration.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
aliases:
- /develop/ai/context-engine/agent-memory/self-managed/authentication/
---

Self-managed Redis Agent Memory uses separate authentication models for the Control
Plane and Data Plane.

The Control Plane uses an admin token for management endpoints. The Data Plane checks each agent
key with the Identity Service, using the Data Plane service credential, and enforces store-level
grants.

## Credentials

| Credential | Who presents it to whom | Secret / key | Auto-generated? | What it unlocks |
| --- | --- | --- | --- | --- |
| Control Plane admin token | Operator → Control Plane (`:9100`) | `redis-agent-memory-controlplane-admin-token` / `token` | Yes (`controlplane.adminToken.autoGenerate`) | Store management: `/v1/stores`, `/v1/detectors` |
| Control Plane internal token | Identity Service → Control Plane | `memory-internal-token` / `token` in the walkthrough | You provision it for both releases | Checking that the store in a grant exists. Set `controlplane.internalToken.existingSecret` on Memory and `productValidation.products.memory.credential.existingSecret` on Identity Service. |
| Identity Service control token | Operator → Identity Service (`:9200`) | `ids-control-token` / `token` in the walkthrough | Supplied through `control.existingSecret` on Identity Service; that chart can also generate one | Creating, listing, updating, rotating and revoking agent keys |
| Data Plane service credential | Data Plane → Identity Service | `memory-dp-credential` / `token` in the walkthrough | You provision it for both releases | Checking agent keys for `memory`. Set `identityService.credential.existingSecret` on Memory and register it in `runtime.serviceCredentials[]` on Identity Service. |
| Agent key | Application → Data Plane (`:9000`) | None; returned once when minted or rotated | No | The Data Plane operations its grants allow |

Generated token Secrets are retained across upgrades and uninstalls (`helm.sh/resource-policy: keep`).
Use existing Secrets for shared credentials and for reproducible deployment automation.
Secret names and keys must agree between releases. See
[Secret rotation](/content/operate/iris/agent-memory/self-managed/operations.md#secret-rotation).

## Control Plane admin token

Control Plane management endpoints require:

```http
Authorization: Bearer <admin-token>
```

Production deployments should read the token from a mounted Secret file:

```yaml
profile: prod

auth:
  type: admin-token
  admin_token:
    token_file: /etc/controlplane-onprem/admin/token
```

The Control Plane reads the token file on each request, so rotating the Secret
does not require a Control Plane redeploy.

## Data Plane auth modes

The Data Plane defaults to agent-key authentication whenever no auth method is set.

### Agent-key authentication

The [`deploy` walkthrough](/content/operate/iris/agent-memory/self-managed/deploy.md) uses agent-key
authentication from the start. In the chart-rendered configuration, the chart writes the agent-key
introspection settings from `dataplane.identityServiceBaseURL` and `identityService.credential`.
These must point to the standalone release and its registered `memory-dp` credential.

A bring-your-own (BYO) Data Plane configuration needs the `auth.agent_keys.introspection` block,
including a BYO configuration without `auth`. See
[Bring-your-own (BYO) configuration](/content/operate/iris/agent-memory/self-managed/configuration.md#bring-your-own-byo-configuration).
The `MEM_AUTH_METHOD` environment variable overrides the method.

Clients send agent keys as Bearer credentials:

```http
Authorization: Bearer <agent-key>
```

Treat agent keys as opaque credentials. Do not parse their contents.

### Auth-disabled Data Plane

Use auth-disabled mode for development and testing only:

```yaml
profile: dev
auth:
  method: none
```

These are application configuration fields; put them under `memory` in Helm values.
The Data Plane refuses `auth.method: none` unless `profile` is exactly `dev`.
Chart-rendered configuration fails to render otherwise. With a supplied configuration Secret,
the same rule is enforced at process startup.

> [!WARNING]
> Do not expose an auth-disabled Data Plane to untrusted callers. In auth-disabled
> mode, Redis Agent Memory does not authenticate or authorize Data Plane requests; any
> caller that can reach the API can read or write memory for configured stores.

## Store authorization and grants

For agent-key requests, Redis Agent Memory checks both identity and resource
authorization:

1. The Data Plane asks the Identity Service whether the key is valid, and caches the answer per pod.
2. The key has a grant for the requested store resource.
3. The grant includes the permission required by the operation.

Because of the cache, a revoked key stops working within up to 5 minutes (180 seconds soft, 300
seconds hard). If the Identity Service can't be reached, keys that aren't cached get `503`.

A grant names the tenant, product, store, and actions:

```json
{
  "tenant": "<your-tenant-id>",
  "product": "memory",
  "resourceType": "mem-store",
  "resourceId": "<store-id>",
  "actions": ["read", "write"]
}
```

Use the installation's tenant on every grant, for example `default`. Set Memory's `tenantId`
and Identity Service's `runtime.apiKeyTenant.singleTenantID` to that same value. With a rendered
Control Plane configuration, `tenantId` sets `auth.admin_tenant_id`, so admin-token stores belong
to that tenant too. With a supplied Control Plane configuration Secret, set `auth.admin_tenant_id`
yourself. Neither release checks the other release's tenant setting.

Grant actions:

| Action | Meaning |
| --- | --- |
| `read` | Read and search memory data. |
| `write` | Mutate memory data. `write` implies `read`. |
| `full` | `full` implies `write`. |

Operation mapping:

{{< table-scrollable >}}
| Required permission | Data Plane operations |
| --- | --- |
| `read` | List sessions, get session memory, get session event, get session property, search long-term memory, get long-term memory. |
| `write` | Add/delete session events, delete session memory, set session summary, set session property, create/update/delete long-term memory. |
{{< /table-scrollable >}}

## Server-side ownership enforcement

Store grants let a caller use a store. Ownership enforcement adds a check within that store: a caller can access their own personal records and shared records. This option is available for on-prem deployments and is disabled by default.

With enforcement disabled, `ownerId` is client-supplied information, not an access check. Your application must authenticate the user and restrict every request to that user's personal memories or shared memories they can access. For searches and session lists, derive the owner filter from the authenticated user. For direct-ID requests, check access before making the request. See [Authorize every memory request](/content/develop/ai/context-engine/agent-memory/developer-guide.md#authorize-every-memory-request).

### Match stored owners to authenticated users

Use one stable user ID across your application and its identity provider (IdP). It must meet the identifier format in the [API reference](/content/develop/ai/context-engine/agent-memory/api-reference.md). Enforcement compares stored owners with the authenticated User ID, including case. It does not take the current user's identity from an `ownerId` field in the request.

The source of that authenticated ID depends on the credential:

| Credential | Source of the authenticated User ID |
| --- | --- |
| Agent key with a user binding | The user ID associated with the key. The client cannot change it by sending a different owner ID. |
| Agent key without a user binding | No User ID. With enforcement enabled, it can access shared records but cannot access personal records or create a record for a named owner. |
| OpenID Connect (OIDC) token | The verified token claim selected by `auth.oidc.user_id_claim`, which defaults to `sub`. Claim mapping alone does not grant store access. |

There are two limits to the current identity setup:

* The Identity Service's `POST /v1/api-keys` endpoint does not accept a user binding or copy the creator's User ID into the key. The key created in the [deployment walkthrough](/content/operate/iris/agent-memory/self-managed/deploy.md#7-mint-an-agent-key) is unbound. Configuring an IdP claim does not bind that key to a user.
* Direct OIDC authentication in the Redis Agent Memory Data Plane is a preview. It validates tokens but does not yet resolve the subject's store grants. A valid token alone therefore receives `403 Forbidden` for store operations.

Before enabling enforcement for personal memories, confirm that your deployment can supply an authenticated User ID. The standard key-minting walkthrough alone does not meet this requirement.

For example, if the authenticated User ID is `user-42`:

| Operation | Required owner value |
| --- | --- |
| Start a session | Set the first event's `actorId` to `user-42`. The server copies it to the session's `ownerId`; the event request has no separate owner field. |
| Add to an accessible session | You can use another `actorId`, such as `travel-agent`, for an assistant message. This does not change the session owner. |
| Create a long-term memory directly | Set `ownerId` to `user-42`. This applies even when placing the record in a shared namespace. |
| Create a personal namespace root | Set `ownerId` to `user-42`. Child namespaces inherit the root owner. |

Changing a long-term memory's owner also requires the new `ownerId` to match the authenticated User ID. An attempt to assign another user as owner returns `403 Forbidden`.

### Enable ownership enforcement

For an existing store, first confirm that its namespace placement index migration is complete. Compare the owners of existing personal sessions, memories, and namespace roots with the authenticated user IDs your deployment supplies. The setting does not rewrite stored owners. A mismatch, or a missing owner, makes those personal records inaccessible to ordinary callers after enforcement is enabled.

In chart-rendered Helm values, set:

```yaml
memory:
  ownership:
    enabled: true
```

In a bring-your-own Data Plane configuration file, use the same setting at the root:

```yaml
ownership:
  enabled: true
```

The environment variable `MEM_OWNERSHIP_ENABLED` overrides the file setting. Its default is `false`. Apply the configuration to the Data Plane servers, then verify access with two different users:

1. Confirm each user can retrieve their own personal records and search for them.
1. Confirm neither user can retrieve the other's personal records by ID or find them by changing an owner filter.
1. Confirm both users can access shared records when their store grants allow it.
1. Confirm an unbound agent key cannot read personal records or create a session with a named user as its first actor.

Search and list operations apply ownership restrictions in addition to client filters. An owner filter cannot expand access. Direct-ID requests for another user's personal record return `404 Not Found`.

Shared scope grants access to all callers with the required store permission. It does not restrict access to a particular team. Keep team membership checks in your application, or separate teams into stores with different grants. Configured worker identities retain access across owners for background work; do not give worker credentials to applications.

## Worker callbacks

Redis Agent Memory workers consume background jobs and call the Data Plane to read
session events and write extracted long-term memories.

The [`deploy` values](/content/operate/iris/agent-memory/self-managed/deploy.md#3-create-ram-valuesyaml)
already enable worker callbacks. Each platform also needs the setup in
[Prepare worker identity for your platform](/content/operate/iris/agent-memory/self-managed/deploy.md#prepare-worker-identity-for-your-platform).

For deployments where Redis Agent Memory Data Plane auth is enabled, workers should
authenticate with Kubernetes projected service-account tokens. The Helm
`workerAuth.enabled` preset creates or uses a worker ServiceAccount and mounts a
projected token into the worker pod. The Data Plane must also be configured to
validate and authorize that token through `auth.worker_identity`.

Minimal worker-auth values:

```yaml
workerAuth:
  enabled: true

# Optional customization when the default worker ServiceAccount is not suitable.
worker:
  serviceAccount:
    name: ""        # set to use an existing ServiceAccount
    create: false   # set true to create a dedicated ServiceAccount without the preset
    annotations: {}
    token:
      audience: redis-agent-memory
      expirationSeconds: 3600
      mountPath: /var/run/secrets/redis-agent-memory-worker
      fileName: token
```

Matching Data Plane config:

```yaml
dataplane_client:
  base_url: http://redis-agent-memory:9000
  auth:
    disabled: false
    type: service_account_token
    token_file: /var/run/secrets/redis-agent-memory-worker/token

auth:
  method: agent_key
  worker_identity:
    enabled: true
    issuer: <service-account-issuer>
    jwks_uri: "https://kubernetes.default.svc/openid/v1/jwks"
    audience:
      - redis-agent-memory
    subjects:
      - subject: "system:serviceaccount:<namespace>:redis-agent-memory-worker"
        user_id: "redis-agent-memory-worker"
        roles:
          - operator
        resources:
          "mem-store:*":
            permissions:
              - write
```

Worker identity access is controlled by `auth.worker_identity.subjects`.
Configure worker identity to:

- Trust one or more exact Kubernetes service-account subjects.
- Validate worker tokens by issuer, JWKS URI, audience, and signing algorithm.
- Map each trusted subject to a Redis Agent Memory `Principal` with roles, scopes,
  and resource grants.
- Grant store access with resource keys such as `mem-store:<store-id>`.
- Use `mem-store:*` for a shared worker identity, or use narrower store grants
  and separate worker ServiceAccounts for stronger isolation.
- Grant `read`, `write`, or `full`; `write` implies `read`, and `full` implies
  `write`.

The Helm ServiceAccount/token settings only provide the Kubernetes credential.
Redis Agent Memory authorization still comes from the server-side
`auth.worker_identity` subject grants. With agent-key authentication, you must configure worker
identity.

## Gateway and identity provider integration

Use a gateway when it owns external authentication and coarse policy. For
example, a gateway can authenticate callers through an identity provider before
it forwards requests to Redis Agent Memory.

If the gateway also owns the standard `Authorization` header, forward the Agent
Memory key in `X-Api-Key`:

```http
Authorization: Bearer <gateway-token>
X-Api-Key: <ram-agent-key>
```

Redis Agent Memory uses `X-Api-Key` as the Redis Agent Memory credential when present. The
gateway token is still available to the gateway, but Redis Agent Memory authorizes the
request from the server-side grants attached to the Redis Agent Memory key.

Gateway rules:

- The gateway owns external authentication and perimeter policy.
- Redis Agent Memory owns store-level authorization.
- Redis Agent Memory keys are stored and forwarded by trusted infrastructure or
  trusted applications.
- Callers must not be able to bypass the gateway and reach the Data Plane
  directly unless they also present a valid Redis Agent Memory credential.

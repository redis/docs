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
| Control Plane internal token | Identity Service → Control Plane | `redis-agent-memory-controlplane-internal-token` / `token` | Yes (`controlplane.internalToken.autoGenerate`) | Checking that the store in a grant exists. Chart-managed; you handle it only with bring-your-own (BYO) configuration |
| Identity Service control token | Operator → Identity Service (`:9200`) | `redis-agent-memory-identity-service-control-token` / `token` | Yes (`identityService.controlToken.autoGenerate`) | Creating, listing, updating, rotating and revoking agent keys |
| Data Plane service credential | Data Plane → Identity Service | `redis-agent-memory-identity-service-runtime-memory-dp` / `token` | Yes (`identityService.runtime.serviceCredentials`) | Checking agent keys for `memory`. Chart-managed; you handle it only with bring-your-own (BYO) configuration |
| Agent key | Application → Data Plane (`:9000`) | None; returned once when minted or rotated | No | The Data Plane operations its grants allow |

Each generated Secret keeps its value across upgrades (`helm.sh/resource-policy: keep`). To bring
your own, set `existingSecret` on the matching value.

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
introspection settings for you, so you add nothing more.

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
auth:
  method: none
```

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

Use the same tenant on every grant of a key.

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
    issuer: "https://kubernetes.default.svc"
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

---
Title: Authentication and authorization
alwaysopen: false
categories:
- docs
- develop
- ai
description: Configure Redis Agent Memory self-managed Control Plane authentication, Data Plane auth modes, worker callbacks, and gateway integration.
linkTitle: Authentication and authorization
weight: 60
hideListLinks: true
---

Self-managed Agent Memory uses separate authentication models for the Control
Plane and Data Plane.

The Control Plane uses an admin token for management endpoints. The Data Plane
can run behind infrastructure controls with Agent Memory auth disabled, or it
can validate Agent Memory agent keys and enforce store-level grants.

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

Choose the Data Plane auth mode based on how callers reach the Data Plane.

| Mode | Config | Use when |
| --- | --- | --- |
| Auth-disabled Data Plane | `auth.method: none` | The Data Plane is reachable only by trusted internal components. |
| Agent-key authentication | `auth.method: agent_key` | Agent Memory should validate keys and enforce per-store grants. |

### Auth-disabled Data Plane

```yaml
auth:
  method: none
```

Use this only when hosting controls restrict Data Plane access to trusted
components.

{{< warning >}}
Do not expose an auth-disabled Data Plane to untrusted callers. In auth-disabled
mode, Agent Memory does not authenticate or authorize Data Plane requests; any
caller that can reach the API can read or write memory for configured stores.
{{< /warning >}}

### Agent-key authentication

Agent-key auth requires Control Plane managed stores. The Data Plane must be
able to load both store records and agent-key records from Metadata Redis.

Starting from static store configuration, make these changes:

1. Replace static `metadata.stores` with `metadata.source: live`.
2. Configure `metadata.live.urls`, `metadata.live.namespace`, and
   `metadata.live.store_db.urls`.
3. Set `auth.method: agent_key`.
4. Add the `embedding` selection block.
5. Keep `embedders_connection_details` for the embedder endpoint and
   credentials.
6. If Agent Memory workers are enabled, configure worker identity as described in
   [Worker callbacks](#worker-callbacks) so worker-to-Data Plane calls carry an
   accepted credential.

Working Data Plane config shape for Control Plane managed stores:

```yaml
metadata:
  source: live
  live:
    urls:
      - redis://default:<password>@<metadata-host>:<metadata-port>
    namespace: iris:memory
    store_db:
      urls:
        - redis://default:<password>@<store-host>:<store-port>

auth:
  method: agent_key

embedding:
  provider: openai
  models:
    default_embedding_model: text-embedding-3-large
    dimensions: 3072

embedders_connection_details:
  openai:
    base_url: https://api.openai.com
    credentials:
      type: static
      api_key: "<openai-api-key>"
    batching:
      embeddings:
        enabled: true
        max_batch_size: 10
        max_wait_time: 20ms
        num_workers: 10
        queue_size: 1000
```

When the Data Plane uses `metadata.source: live`, Agent Memory defaults to
`auth.method: agent_key` when no auth method is configured. Set it explicitly in
production values so the intended security posture is visible in review. If
agent-key auth is enabled without `metadata.source: live`, the Data Plane fails
startup with a validation error.

Clients send agent keys as Bearer credentials:

```http
Authorization: Bearer <agent-key>
```

Treat agent keys as opaque credentials. Do not parse their contents.

## Store authorization and grants

For agent-key requests, Agent Memory checks both identity and resource
authorization:

1. The key exists in metadata Redis and its secret validates.
2. The key has a grant for the requested store resource.
3. The grant includes the permission required by the operation.

Grant actions:

| Action | Meaning |
| --- | --- |
| `read` | Read and search memory data. |
| `write` | Mutate memory data. `write` implies `read`. |

Operation mapping:

{{< table-scrollable >}}
| Required permission | Data Plane operations |
| --- | --- |
| `read` | List sessions, get session memory, get session event, get session property, search long-term memory, get long-term memory. |
| `write` | Add/delete session events, delete session memory, set session summary, set session property, create/update/delete long-term memory. |
{{< /table-scrollable >}}

## Worker callbacks

Agent Memory workers consume background jobs and call the Data Plane to read
session events and write extracted long-term memories.

For deployments where Agent Memory Data Plane auth is enabled, workers should
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
- Map each trusted subject to an Agent Memory `Principal` with roles, scopes,
  and resource grants.
- Grant store access with resource keys such as `mem-store:<store-id>`.
- Use `mem-store:*` for a shared worker identity, or use narrower store grants
  and separate worker ServiceAccounts for stronger isolation.
- Grant `read`, `write`, or `full`; `write` implies `read`, and `full` implies
  `write`.

The Helm ServiceAccount/token settings only provide the Kubernetes credential.
Agent Memory authorization still comes from the server-side
`auth.worker_identity` subject grants. If worker auth is not configured, keep
the Data Plane auth-disabled and reachable only by trusted internal components.

## Gateway and identity provider integration

Use a gateway when it owns external authentication and coarse policy. For
example, a gateway can authenticate callers through an identity provider before
it forwards requests to Agent Memory.

If the gateway also owns the standard `Authorization` header, forward the Agent
Memory key in `X-Api-Key`:

```http
Authorization: Bearer <gateway-token>
X-Api-Key: <ram-agent-key>
```

Agent Memory uses `X-Api-Key` as the Agent Memory credential when present. The
gateway token is still available to the gateway, but Agent Memory authorizes the
request from the server-side grants attached to the Agent Memory key.

Gateway rules:

- The gateway owns external authentication and perimeter policy.
- Agent Memory owns store-level authorization.
- Agent Memory keys are stored and forwarded by trusted infrastructure or
  trusted applications.
- Callers must not be able to bypass the gateway and reach the Data Plane
  directly unless they also present a valid Agent Memory credential.

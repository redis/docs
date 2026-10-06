---
Title: Connect Playbook extraction
alwaysopen: false
categories:
- docs
- operate
- iris
description: Connect Redis Agent Playbook to a tenant-owned Redis Agent Memory store using service identities and extraction bindings.
linkTitle: Playbook extraction
weight: 65
hideListLinks: true
---

An extraction binding connects one Redis Agent Playbook to one tenant-owned Redis
Agent Memory store. Creation prepares the connection with read grants and verifies
live store access. Enable the binding separately after it becomes `ready`.
Extraction workers require a worker-enabled Playbook release; the binding API alone
does not process sessions.

## Configure the connection

1. Configure Redis Agent Memory's [external service authentication](/content/operate/iris/agent-memory/self-managed/authentication.md#authenticate-external-services).
1. Add the Playbook Control Plane and worker ServiceAccount subjects to the Redis
   Agent Memory allowlist. Their projected tokens must use audience `api://memory-dp`.
1. Configure these Playbook Helm values:

```yaml
extraction:
  enabled: true
  connection:
    enabled: true
    issuer: https://<serviceaccount-issuer>
    identityServiceBaseURL: https://<identity-service-host>:9200
    controlToken:
      existingSecret: <identity-service-control-token-secret>
    ramDataPlaneBaseURL: https://<memory-dataplane-host>:9000
    workerSubjects:
      - system:serviceaccount:<namespace>:<playbook-worker-serviceaccount>
```

The chart configures the Playbook Control Plane's own ServiceAccount and projected
source token. Only that Control Plane receives the Identity Service Control
credential. It grants `read` on the exact source store to itself and the configured
workers. Workers use their own identity to read sessions and do not receive the
Control credential or source write permission.

Use reachable transport layer security (TLS) endpoints and the required certificate
authorities. The Identity Service Control credential is distinct from both the
Playbook admin token and Redis Agent Memory's runtime lookup credential. Bindings
contain store identifiers and FAQ policy, never URLs or credentials.

## Create and enable a binding

The management application programming interface (API) uses the Playbook Control
Plane. Set `PLAYBOOK_CP_URL`, `PLAYBOOK_ADMIN_TOKEN`, `PLAYBOOK_ID`, and
`RAM_STORE_ID` for your deployment. These commands require `curl` and `jq`:

```bash
# Optional suggestions; these do not verify or restrict the selected store.
curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  "$PLAYBOOK_CP_URL/v1/playbooks/$PLAYBOOK_ID/extraction/stores"

# Create one disabled binding. The Playbook tenant must own the RAM store.
BINDING=$(curl --fail-with-body --silent --show-error \
  -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
  -H 'Content-Type: application/json' \
  -d "$(jq -n --arg store "$RAM_STORE_ID" \
    '{source:{type:"redis_agent_memory",storeId:$store},job:{type:"faq"}}')" \
  "$PLAYBOOK_CP_URL/v1/playbooks/$PLAYBOOK_ID/extraction/bindings")
BINDING_ID=$(printf '%s' "$BINDING" | jq -r '.bindingId')
```

The response is `202` with `status: preparing` and `enabled: false`. Poll the
binding with a finite timeout. Inspect `blockedReason` if preparation fails:

```bash
READY=false
for attempt in $(seq 1 60); do
  BINDING=$(curl --fail-with-body --silent --show-error \
    -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
    "$PLAYBOOK_CP_URL/v1/playbooks/$PLAYBOOK_ID/extraction/bindings/$BINDING_ID") || break
  STATUS=$(printf '%s' "$BINDING" | jq -r '.status')
  printf 'Preparation: %s\n' "$STATUS"
  if [ "$STATUS" = ready ]; then READY=true; break; fi
  if [ "$STATUS" = blocked ]; then printf '%s\n' "$BINDING"; break; fi
  sleep 2
done
# Continue only after successful live source verification.
if [ "$READY" = true ]; then
  VERSION=$(printf '%s' "$BINDING" | jq '.version')
  curl --fail-with-body --silent --show-error -X PATCH \
    -H "Authorization: Bearer $PLAYBOOK_ADMIN_TOKEN" \
    -H 'Content-Type: application/json' \
    -d "$(jq -n --argjson v "$VERSION" '{expectedVersion:$v,enabled:true}')" \
    "$PLAYBOOK_CP_URL/v1/playbooks/$PLAYBOOK_ID/extraction/bindings/$BINDING_ID"
fi
```

`ready` confirms source-store authorization. It does not report that session
extraction has completed. A ready binding stays disabled until PATCH enables it.
The source is immutable and covers the whole store. To change stores, delete the
binding and create a replacement. The scan interval is read-only at 300 seconds.
FAQ policy defaults to an idle window of 1,800 seconds and an input budget of 8,192
tokens; allowed ranges are 60–86,400 seconds and 256–8,192 tokens.

## Pause, resume, or delete

Fetch the binding's current `version`, then PATCH with `expectedVersion` and
`enabled: false` to pause, or `enabled: true` to resume. Each successful update
returns the new version. A stale version returns `409`; reload before retrying.
Pause stops admission of new extraction work. An already-started provider request
can finish, but a stale binding revision cannot commit proposals. Pause retains
source grants.

DELETE the binding URL to retire the connection. It returns `202 deleting`; poll
GET until `404`. When multiple Playbooks bind the same tenant/store, grants remain
until the last nondeleting binding is removed. Failed cleanup retains the deleting
record for retry.

| Response | Meaning |
| --- | --- |
| `202 preparing` | Grant preparation and live source verification are pending. |
| `200 ready` | The source connection is verified; inspect `enabled` separately. |
| `200 blocked` | Preparation or source access failed; inspect `blockedReason`. |
| `202 deleting` | Durable cleanup is pending. |
| `403` | `ExtractionForbiddenError`: the caller lacks Playbook management permission. The problem type is `/errors/insufficient-permissions`. |
| `409` | Binding state/version conflict, or `/errors/extraction-disabled` for a disabled deployment gate. |

The deployment gate `extraction.enabled` defaults to false. When disabled, creation,
policy updates, and activation are rejected; inspection, pause, and deletion remain
available. Without a configured source connection, preparation remains pending and cannot be
enabled. Dependency outages retry; permanent source denial becomes blocked.
For complete request and response schemas, see the
[Playbook binding API reference](/content/operate/iris/agent-memory/self-managed/playbook-binding-api-reference.md).

## Retire a service identity

Pause affected bindings, stop the old workload, and remove its subject from every
Playbook Control Plane replica's configuration. Finish that rollout. Reconciliation
of preparing/ready bindings revokes retired identities recorded in the deployment's durable tenant/store grant
journal. Delete/recreate blocked bindings to retire their recorded identities.
Failed deletion retains the history for retry. Remove the retired subject
from Redis Agent Memory's allowlist too. Verify the old identity is denied after
the configured hard grant-cache lifetime, and verify replacement access before
resuming. Old replicas can regrant their configured subjects during rollout.

The journal does not discover historical or other deployments' grants. Clean up
those grants through Identity Service Control using only the exact tenant/store
identities this deployment owns. Changing the Identity Service endpoint requires
deleting all affected bindings while Playbook still uses the previous authority.
Wait for `404`, which confirms grant cleanup and journal removal. Then switch
endpoints and recreate bindings. If already switched, restore the old endpoint
first. Manual grant deletion alone does not clear the journal; reconciliation
fails closed while entries for a previous authority remain. Preserve metadata and the grant journal in
backups. Deleting grants does not immediately flush Redis Agent Memory's caches.

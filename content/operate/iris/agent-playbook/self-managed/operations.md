---
Title: Operate self-managed Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Check health, rotate keys and Secrets, clear, suspend, or delete playbooks, back up storage, and upgrade Agent Playbooks in a redis-iris suite release.
linkTitle: Operations
weight: 90
hideListLinks: true
---

## Check service health

With the [local port-forwards](/content/operate/iris/agent-playbook/self-managed/deploy.md#4-verify-the-deployment) running:

```bash
curl --fail-with-body -sS http://localhost:9200/health/readiness
curl --fail-with-body -sS http://localhost:9201/health/readiness
curl --fail-with-body -sS http://localhost:9202/health/readiness
```

Inspect pods and the affected service's logs when readiness fails:

```bash
kubectl -n <namespace-name> get pods -l app.kubernetes.io/instance=iris,app.kubernetes.io/name=playbook
kubectl -n <namespace-name> describe pod <pod-name>
kubectl -n <namespace-name> logs deployment/redis-agent-playbook-dataplane
```

Redact credentials and content before you share logs or configuration. For common symptoms, see [Troubleshooting](/content/operate/iris/agent-playbook/self-managed/reference.md#troubleshooting).

Scrape `/metrics` on every control-plane and data-plane pod, on ports `9200` and `9201`, and on the [extraction worker](/content/operate/iris/agent-playbook/self-managed/extraction.md#monitor-extraction). Metrics use bounded operation and outcome labels. Agent Playbooks doesn't emit per-entry usage records. All three services can export traces through the shared [tracing configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md#configure-tracing).

## Rotate or revoke agent keys

Use the Identity Service control token and connection values from [Load the administrative credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#load-the-administrative-credentials).

Rotate a key with a one-hour grace period:

```bash
umask 077
curl --fail-with-body -sS \
  -X POST "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>/rotate?graceSeconds=3600" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN" > rotated-key.json
```

Store the returned token and update its consumers before the grace period ends. The Identity Service caps the grace period with `identityService.apiKeys.maxRotateGraceSeconds`, 604,800 seconds (seven days) by default.

Revoke a key:

```bash
curl --fail-with-body -sS \
  -X DELETE "$IRIS_IDENTITY_URL/v1/api-keys/<key-id>" \
  -H "Authorization: Bearer $IRIS_IDENTITY_TOKEN"
```

With the Iris command-line interface (CLI), run `iris identity keys rotate <key-id> --grace 1h` or `iris identity keys revoke <key-id>`.

Key validation is cached. `identityService.runtime.cache.hardTtlSeconds` defaults to 300 seconds. Allow for cached decisions, and verify that the old key is denied before you treat revocation as complete.

## Clear playbook content

Clearing removes entries, proposals, or both, and keeps the playbook and its configuration. It needs the admin token or an OpenID Connect (OIDC) token with the `product_admin` or `suite_admin` role. For example, clear entries:

```bash
curl --fail-with-body -sS \
  -X POST "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/clear?scope=ENTRIES" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN"
```

Set `scope` to `ENTRIES`, `PROPOSALS`, or `ALL`. The scope is required. A successful clear returns `204`. The playbook must be `READY`.

Clearing isn't atomic across content. After a failure, resolve it and retry the same scope. Clearing doesn't suspend the playbook or stop concurrent writers, including the extraction worker.

With the CLI, run `iris agent-playbooks clear --scope entries`.

## Suspend or remove a playbook

Suspend a playbook to stop runtime access and keep its content and configuration:

```bash
curl --fail-with-body -sS \
  -X PATCH "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"state":"SUSPENDED"}'
```

Resume it by setting `state` to `READY`.

Deleting a playbook permanently removes its content and configuration. Back up what you need and revoke its agent keys first:

```bash
curl --fail-with-body -sS \
  -X DELETE "$IRIS_AGENT_PLAYBOOKS_SERVICE_URL/iris/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_SERVICE_TOKEN"
```

Deleting needs the same roles as clearing.

## Update configuration and license Secrets

Update an existing Secret from its source files. For example, update the storage configuration:

```bash
kubectl -n <namespace-name> create secret generic playbook-storage \
  --from-file=playbook-storage.yaml=./playbook-storage.yaml \
  --dry-run=client -o yaml | kubectl apply -f -
```

Calculate the updated Secret payload's checksum:

{{< multitabs id="playbook-storage-checksum" tab1="Linux" tab2="macOS" >}}

```bash
kubectl -n <namespace-name> get secret playbook-storage -o json \
  | jq -cS '.data' | sha256sum | awk '{print $1}'
```

-tab-sep-

```bash
kubectl -n <namespace-name> get secret playbook-storage -o json \
  | jq -cS '.data' | shasum -a 256 | awk '{print $1}'
```

{{< /multitabs >}}

Copy it into `playbook.storage.existingSecretChecksum` in `iris-values.yaml` and [upgrade the release](#upgrade-the-release). A changed checksum rolls only the workloads that consume that Secret. It triggers a rollout; it doesn't validate integrity. If a Secret controller already restarts consumers on rotation, leave the checksum empty. Without a checksum, restart the affected Deployment after you change a Secret in place.

The same pattern applies to these Secrets:

| Secret | Checksum value | Rolls |
| --- | --- | --- |
| License | `playbook.license.existingSecretChecksum` | Control plane, data plane, and extraction worker |
| Embedding configuration | `playbook.inference.existingSecretChecksum` | Data plane |
| Private certificate authority (CA) | `playbook.tls.caCertSecretChecksum` | Every workload |
| Extraction worker configuration | `playbook.worker.existingSecretChecksum` | Extraction worker |

To rotate the admin token, the internal token, or the data-plane credential, change the suite's Secret in place, as [Credentials](/content/operate/iris/self-managed/_index.md#credentials) describes. Both planes and the Identity Service reread those files, so no rollout is needed, but Kubernetes updates mounted Secrets eventually, so rotation isn't atomic across pods. For immutable Secrets, create a new name and update the reference.

## Back up the deployment

- Back up the metadata Redis, which holds playbook configuration and extraction bindings.
- Back up the content Redis, which holds entries, proposals, and search indexes.
- Back up the Identity Service metadata Redis, which holds agent-key records.
- Keep the values files, configuration files, license material, and secret-manager records you need to recreate the services.

Coordinate metadata and content snapshots. See [Back up ahead of time](/content/operate/iris/self-managed/operations.md#back-up-ahead-of-time) for the whole suite. A metadata-only restore can't recover authored content. Validate restore procedures in an isolated environment before you rely on them.

<!-- TODO: Add a qualified backup and restore procedure and supported recovery guarantees for the GA release. -->

## Upgrade the release

Agent Playbooks upgrades with the rest of the suite. Follow [Upgrade](/content/operate/iris/self-managed/operations.md#upgrade), and recalculate checksums for changed Secrets first. Then check the Agent Playbooks rollouts:

```bash
kubectl -n <namespace-name> rollout status deployment/redis-agent-playbook-controlplane
kubectl -n <namespace-name> rollout status deployment/redis-agent-playbook-dataplane
```

With extraction on, also run `kubectl -n <namespace-name> rollout status deployment/redis-agent-playbook-worker`. Reconnect the local port-forwards, then repeat the [application-access check](/content/operate/iris/agent-playbook/self-managed/api-examples.md#verify-application-access). Helm doesn't restore Redis data on a rollback.

Upgrades from preview or standalone charts aren't supported. Reinstall with the suite chart against the same Redis databases, as [Move from a preview or standalone install](/content/operate/iris/self-managed/_index.md#move-from-a-preview-or-standalone-install) describes. When you carry values over:

- **Embedding configuration**: the data plane and control plane reject the legacy `inference.models[].client` field. Keep only `provider`, `model`, and `dimensions` in `playbook.inference.models`, and move endpoints and credentials into `embedders_connection_details` in the [embedding Secret](/content/operate/iris/agent-playbook/self-managed/configuration.md#embedding-configuration). Keep the same vector-space identity.
- **OIDC audience**: see [Configure operator OIDC access](/content/operate/iris/agent-playbook/self-managed/authentication.md#configure-operator-oidc-access).

## Remove Agent Playbooks

To switch Agent Playbooks off, set `global.iris.products.playbook.enabled: false` and upgrade the release. Its credentials and data stay, so turning it on again continues where it stopped. To remove it for good, follow [Remove a service permanently](/content/operate/iris/self-managed/operations.md#remove-a-service-permanently). To remove the whole suite, see [Uninstall](/content/operate/iris/self-managed/operations.md#uninstall).

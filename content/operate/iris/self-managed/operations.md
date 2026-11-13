---
title: Operate the Redis Iris suite
description: Upgrade and roll back the redis-iris release, rotate the metadata Redis credential, recover a lost namespace, remove a service, and uninstall.
linkTitle: Operations
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 10
hideListLinks: true
---

These procedures apply to the whole `redis-iris` release. For one service's own operations, see its guide. The examples use release `iris` in namespace `<namespace-name>`.

The suite keeps no state in the cluster beyond Secrets. Data, agent keys, and queued jobs live in your Redis databases, so most procedures here come down to keeping the Secrets and the databases consistent.

## Upgrade

1. Read the release notes of the new chart version.
1. Run the [preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) with the new version and your values. A new version can run more pods.
1. Upgrade the release with the same values:

   ```bash
   helm upgrade iris redis-ai/redis-iris \
     --version <chart-version> \
     --namespace <namespace-name> \
     -f iris-values.yaml \
     --atomic --timeout 15m
   ```

1. Verify the release:

   ```bash
   helm test iris --namespace <namespace-name> --logs
   ```

Helm upgrades every component at the same time. Upgrade within one minor version, or from the last patch of the previous minor version to the new minor version. Don't skip a minor version.

With `--atomic`, Helm returns to the previous revision by itself when the upgrade doesn't become ready. It reverts Kubernetes resources and Helm values, but it doesn't undo writes to Redis. A value that the new version refuses fails the render, names the field, and applies nothing.

`1.0.1` renames the Agent Memory queue monitor from `redis-agent-memory-asynqmon` to `redis-agent-memory-asynqdash`. If you turned on its Ingress, delete the old one before you upgrade to `1.0.1` or roll back to `1.0.0`, and update any NetworkPolicy or monitoring rule that matches the old name:

```bash
kubectl -n <namespace-name> delete ingress redis-agent-memory-asynqmon
```

### Recover an interrupted upgrade

An upgrade whose client was interrupted leaves the release in `pending-upgrade`, and Helm refuses every later upgrade. Find the last `deployed` revision, then roll back to it:

```bash
helm history iris --namespace <namespace-name>
helm rollback iris <revision> --namespace <namespace-name> --wait --timeout 15m
```

## Roll back

```bash
helm rollback iris <revision> --namespace <namespace-name> --wait --timeout 15m
```

A rollback restores the workloads and the values of that revision. It doesn't undo data or metadata written to Redis. It never restores a credential: the generated Secrets aren't part of the release, so a rotated or revoked value stays rotated or revoked. The same version rules as for an upgrade apply. You can't roll back to `1.0.0` on `arm64` nodes, because its images are `amd64` only.

Keep the chart of each version you install, so you can roll back without the repository:

```bash
helm pull redis-ai/redis-iris --version <chart-version>
```

## Rotate the metadata Redis credential

The metadata Redis holds the Identity Service's keys, every service's metadata, the Agent Memory job queue, and the console's session store. The components read its URLs, credentials included, only at startup, so a new credential reaches them through restarts in a fixed order. Nothing is unavailable during the rotation, because both users work until you delete the old one.

These values name Secrets that can hold the metadata Redis connection. Check every one that your values set:

| Component | Values field | What it holds |
| --- | --- | --- |
| Identity Service | `identityService.metadata.existingSecret` | `metadata.urls` |
| Agent Memory | `memory.secrets.secretName` | The `metadata`, `databases`, and `background_jobs` URLs |
| Agent Memory queue monitor, with `memory.controlplane.queueMonitor.enabled` | `memory.controlplane.queueMonitor.redis.existingSecret` | `REDIS_URL`, the `background_jobs` Redis, and optionally `REDIS_USERNAME` |
| Agent Playbooks | `playbook.storage.existingSecret` | `storage.metadata`, and `storage.content` |
| Agent Playbooks worker, with extraction | `playbook.worker.existingSecret` | `worker.redis`, the extraction queue |
| Lens | `lens.storage.existingSecret` | `storage.metadata` in both planes |
| Context Gateway | `contextGateway.metadataDB.existingSecret` | `metadata_db` |
| Intent Router | `intent.storage.existingSecret` | `storage.metadata` for the control plane, and `runtime.redis` for the data plane |
| Iris console, with IdP sign-in | `ui.sso.redis.existingSecret` | The session store URLs |

1. Create a second database user with the same permissions as the current one. On Redis Software, add the user to the database's role. On Redis Open Source, connect as an access control list (ACL) administrator and reproduce the current application user's command, key, and channel rules. Don't grant `+@all`, `~*`, or `&*` unless the current user already has those permissions. Persist the rules with `ACL SAVE` for an external ACL file, or `CONFIG REWRITE` for `redis.conf`. On a Redis Open Source cluster, apply and verify the user on every node.
1. Write the new user and password into each connection entry in the table that points to the metadata Redis, in place, with `kubectl apply` or your secret manager. Leave entries for other Redis databases unchanged.
1. Restart the components in this order, and wait for each group to finish before the next. This function skips a Deployment you didn't install, such as a disabled service, the Agent Playbooks worker without extraction, `iris-ui-auth` without IdP sign-in, or the Agent Memory queue monitor:

   ```bash
   restart() { local d present=()
               for d in "$@"; do kubectl -n <namespace-name> get deployment/$d >/dev/null 2>&1 && present+=("$d"); done
               for d in "${present[@]}"; do kubectl -n <namespace-name> rollout restart deployment/$d; done
               for d in "${present[@]}"; do kubectl -n <namespace-name> rollout status deployment/$d --timeout=5m; done; }
   restart iris-identity-service
   restart redis-agent-memory-controlplane redis-agent-playbook-controlplane redis-lens-controlplane \
     redis-context-gateway-controlplane redis-intent-router-controlplane
   restart redis-agent-memory redis-agent-memory-worker redis-agent-memory-asynqdash redis-agent-playbook-dataplane \
     redis-agent-playbook-worker redis-lens-dataplane redis-lens-worker redis-context-gateway-dataplane \
     redis-intent-router-dataplane
   restart iris-ui iris-ui-auth
   ```

   Jobs queued before the restart stay queued, and run once the workers are back.

1. Verify the release:

   ```bash
   helm test iris --namespace <namespace-name> --logs
   ```

1. Keep the old user. Each Agent Memory store keeps the database credential it was created with, so deleting the old user breaks every store created before the rotation with `Database Authentication Failed`.

<!-- TODO: MOD-20791. Once Agent Memory stores stop keeping their creation-time credential, document deleting the old user after every pod runs with the new one. -->

## Planned outage of the metadata Redis

For maintenance that stops the metadata Redis, such as an upgrade without replication or a host move, the suite reports the outage and recovers by itself. Nothing needs a restart.

1. Plan the window. Queued Agent Memory and Agent Playbooks jobs stay in the database when it persists, with an append-only file or replication, and run after it returns. New writes fail during the window.
1. Stop the database. The Identity Service, the Agent Memory control plane, both Agent Playbooks planes and its worker, Intent Router, and the Lens planes turn unready, so their Services stop routing to them. Kubernetes doesn't restart the pods. The Agent Memory data plane, both Context Gateway planes, and the Lens worker stay ready, and return errors instead.
1. Start the database again. Readiness recovers without intervention, usually within a minute:

   ```bash
   kubectl -n <namespace-name> wait pod -l app.kubernetes.io/instance=iris \
     --field-selector=status.phase=Running --for=condition=Ready --timeout=5m
   ```

1. Verify the release with `helm test iris --namespace <namespace-name> --logs`. Queued jobs complete on their own.

<!-- TODO: MOD-20800. Update step 2 when the Agent Memory data plane, Context Gateway, and the Lens worker turn unready during an outage. -->

## Restore a lost namespace

If the release namespace is lost, for example deleted or on a rebuilt cluster, and the databases survive, restore its Secrets and reinstall the same chart with the same values. The suite comes back with its data, and existing agent keys keep working.

### Back up ahead of time

Export every Secret in the release namespace, and keep the export with your values file and the installed chart archive:

```bash
kubectl -n <namespace-name> get secrets -o json \
  | jq '{apiVersion: "v1", kind: "List", items: [.items[]
        | select(.type != "helm.sh/release.v1" and .type != "kubernetes.io/service-account-token")
        | del(.metadata.uid, .metadata.resourceVersion, .metadata.creationTimestamp, .metadata.managedFields,
              .metadata.ownerReferences, .metadata.namespace)]}' > iris-secrets.json
```

The export holds credentials in clear text, base64 encoded, so store it as you store database passwords. It covers the Secrets you supplied and the ones the chart generated. Refresh it after every credential rotation.

### Restore

Restore into a namespace with the same name. Workload identity trusts the ServiceAccounts of that namespace, and the services reach the Identity Service by a name that includes it. A different namespace needs a new install, not a restore.

1. Recreate the namespace:

   ```bash
   kubectl create namespace <namespace-name>
   ```

1. Apply the export:

   ```bash
   kubectl -n <namespace-name> apply -f iris-secrets.json
   ```

1. Install the same chart version with the same values. The chart finds its generated credentials and reuses them:

   ```bash
   helm install iris ./redis-iris-<chart-version>.tgz \
     --namespace <namespace-name> \
     -f iris-values.yaml \
     --wait --timeout 10m
   ```

1. Run `helm test iris --namespace <namespace-name> --logs`, then read a known record with an existing agent key.

If the chart-generated credential Secrets are lost, first recreate every customer-supplied Secret referenced by your values from its backup or external secret manager. Install again with the same values. The chart generates new suite credentials. Existing agent keys keep working only if the Identity Service metadata database survives. This recovery path is documented but hasn't been tested.

## Remove a service permanently

Turning a service off with `global.iris.products.<alias>.enabled: false` keeps its credentials and its data, so turning it on again continues where it stopped. To remove a service for good, so that a new install of it starts empty with new credentials:

1. Set `global.iris.products.<alias>.enabled: false`, and run `helm upgrade`.
1. Delete its generated Secrets, where `<service>` is `memory`, `playbook`, `lens`, `context-gateway`, or `intent`:

   ```bash
   kubectl -n <namespace-name> delete secret \
     iris-<service>-dataplane-credential iris-<service>-internal-token iris-<service>-admin-token
   ```

1. Delete its data by key pattern, on every Redis database that its Secrets name.

   | Service | Key patterns, with the default prefixes | Where |
   | --- | --- | --- |
   | Agent Memory | `iris:memory:*`, `{iris:memory:*` | The metadata database and the job idempotency URL |
   | | `memory:*`, `memory-write:*`, `{memory-write:*` | Its store databases, from `databases` |
   | | `asynq:{ram:*` | Its job queue |
   | Agent Playbooks | `iris:playbook:*` | The metadata and content databases |
   | | `asynq:{playbook-extraction:*`, `playbook-queue-admission:{playbook-extraction:*` | The worker's queue |
   | Lens | `iris:lens:*` | The metadata database |
   | | `lens:*` | The streams, content, and index databases |
   | Context Gateway | `iris:context-gateway:*` | The metadata database |
   | | `context-gateway/*` | The credential storage Redis, with `credentialStorage.provider: redis` |
   | Intent Router | `iris:intent:*` | The metadata database, the mailbox, and the Router databases |

   A database can hold other services' data too. Never delete `iris:*` or `asynq:*`: they include the Identity Service's keys and the other services' queues. Flush or delete a whole database only after you check that no other component's Secret names it.

   Delete the keys one per command, with the same URL that the Secret holds. A clustered database refuses a multi-key delete across slots with `CROSSSLOT`, which would leave data behind:

   ```bash
   R=(-u 'rediss://<user>:<password>@<host>:<port>/<db>')
   redis-cli "${R[@]}" --scan --pattern '<key-pattern>' | xargs -r -n 1 redis-cli "${R[@]}" unlink
   ```

   - On a Redis Open Source cluster, `--scan` sees only the node it connects to, so run it against each primary.
   - For a queue, also remove its names from the shared queue set. List them with `redis-cli "${R[@]}" smembers asynq:queues`, then run `redis-cli "${R[@]}" srem asynq:queues <queue-name>` for each `ram:*` (Agent Memory) or `playbook-extraction:*` (Agent Playbooks) name.
   - Deleting keys leaves search indexes in place. List them with `redis-cli "${R[@]}" FT._LIST`, then run `redis-cli "${R[@]}" FT.DROPINDEX <index-name>` for each index that starts with one of the service's prefixes.

1. For Context Gateway with `credentialStorage.provider` set to `vault` or `aws_secrets_manager`, also delete its upstream credentials there. They're named `<base-path>/tenant/<tenant>/gateway/<gateway-id>/credentials/<id>`, where `<base-path>` is `credentialStorage.basePath`:

   - **Vault:** every secret under `<base-path>/` in the KV v2 mount, `credentialStorage.vault.mount`. List them with `vault kv list -mount=<mount> <base-path>/tenant/` and the levels below it, and delete each one with `vault kv metadata delete -mount=<mount> <path>`.
   - **AWS Secrets Manager:** every secret whose name starts with `<base-path>/`, in `credentialStorage.aws.region`:

     ```bash
     aws secretsmanager list-secrets --region <region> --filters Key=name,Values=<base-path>/ \
       --query 'SecretList[].Name' --output text | tr '\t' '\n' \
       | xargs -r -n 1 aws secretsmanager delete-secret --region <region> --force-delete-without-recovery --secret-id
     ```

The agent keys of a removed service stay in the Identity Service. [Revoke them](/content/operate/iris/identity-service/_index.md) if you don't need them.

## Uninstall

`helm uninstall` removes the release's workloads, Services, Ingresses, and configuration. It keeps the credential Secrets the chart generated, so that a reinstall keeps every service and agent key working, and the pods and permissions of the last `helm test`. It never touches your own Secrets or your databases.

1. Uninstall the release:

   ```bash
   helm uninstall iris --namespace <namespace-name> --wait --timeout 5m
   ```

   Wait until only the `Completed` `helm test` pods are left:

   ```bash
   kubectl -n <namespace-name> get pods -l app.kubernetes.io/instance=iris
   ```

1. List what's left:

   ```bash
   kubectl -n <namespace-name> get secrets -l app.kubernetes.io/instance=iris,app.kubernetes.io/component=credentials
   kubectl -n <namespace-name> get pods,serviceaccounts,roles,rolebindings,configmaps -l app.kubernetes.io/instance=iris
   ```

   To reinstall later with the same credentials, stop here.

1. To remove everything, delete it:

   ```bash
   kubectl -n <namespace-name> delete secrets -l app.kubernetes.io/instance=iris,app.kubernetes.io/component=credentials
   kubectl -n <namespace-name> delete pods,serviceaccounts,roles,rolebindings,configmaps -l app.kubernetes.io/instance=iris
   ```

   A new install then generates new admin tokens, a new control token, and new service credentials. Agent keys live in the Identity Service's database, not in these Secrets.

1. The databases keep the suite's data. Delete it with your database tooling when you decommission the install. The Secrets you supplied, such as the database URLs, the license, and the IdP client, are yours to delete too.

---
Title: Deploy Redis Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Add Redis Agent Playbooks to a Redis Iris suite release, then create a playbook, mint an agent key, and make one authenticated call.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Agent Playbooks installs as part of the `redis-iris` Helm chart. Follow [Install the Redis Iris suite](/content/operate/iris/self-managed/_index.md) for the prerequisites, the shared Secrets, the preflight, and the install. This page covers what Agent Playbooks adds to that release, and ends with one authenticated call to the data plane.

Agent Playbooks is on by default (`global.iris.products.playbook.enabled: true`). Its values go under the `playbook:` key in `iris-values.yaml`. The chart's `examples/playbook.yaml` is a working values file for these steps.

## 1. Create the Agent Playbooks Secrets

Prepare `playbook-storage.yaml` and `inference.yaml` as shown in [Configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md). The metadata and content Redis must be two different Redis deployments, and the content Redis needs JSON and Search. Then create the Secrets:

```bash
kubectl -n <namespace-name> create secret generic playbook-storage \
  --from-file=playbook-storage.yaml=./playbook-storage.yaml
kubectl -n <namespace-name> create secret generic playbook-inference \
  --from-file=inference.yaml=./inference.yaml
```

You don't need `playbook-inference` when every model is `noop`.

## 2. Add the Agent Playbooks values

Add the storage, models, and inference Secret to `iris-values.yaml`. See [Helm values](/content/operate/iris/agent-playbook/self-managed/configuration.md#helm-values) for each model setting.

```yaml
playbook:
  storage:
    existingSecret: playbook-storage
  inference:
    existingSecret: playbook-inference
    models:
      - provider: openai
        model: <embedding-model-name>
        dimensions: <embedding-dimensions>
```

The suite sets these Agent Playbooks values itself. Don't set them under `playbook:`: a value that differs fails the render and names the field.

- `tenantId`, from `global.iris.tenantId`.
- `license.existingSecret` and `license.secretKey`, from `global.iris.license`.
- `dataplane.identityServiceBaseURL` and `identityService.allowInsecureTransport`, for the suite's own Identity Service.
- `identityService.credential` and `controlplane.internalToken`, from the credentials the suite generates or that you supply in `global.iris.secrets`. The admin token is in the Secret `iris-playbook-admin-token`.
- `auth.oidc.audience`, `dataplane.oidc`, and `controlplane.oidc.enabled`, from `global.iris.auth.oidc` and `global.iris.auth.roleBindings`.
- The extraction connection and worker settings, from `global.iris.extraction.enabled`. See [Configure background FAQ extraction](/content/operate/iris/agent-playbook/self-managed/extraction.md#extraction-with-the-redis-iris-suite-chart).
- `fullnameOverride` (`redis-agent-playbook`), the Service ports, `dataplane.strategy`, and `podDisruptionBudget.enabled`, which the suite fixes. The suite runs two data-plane replicas by default.

Check these values before you install. If one is wrong, you see the symptom in its row.

| Check | Symptom | Fix |
| --- | --- | --- |
| `inference.models` lists at least one model | Rendering fails | List each model the deployment offers. |
| Each model's `provider` names an `embedders_connection_details` entry in `inference.yaml` | Creating a playbook fails, or it doesn't become `READY` | Add the entry under that provider name. |
| The content Redis has JSON and Search | The data plane isn't ready, or a playbook is `FAILED` | Use a Redis 8 build that includes JSON and Search. |

## 3. Install or upgrade the release

For a new release, follow [Run the preflight](/content/operate/iris/self-managed/_index.md#4-run-the-preflight) and [Install](/content/operate/iris/self-managed/_index.md#5-install). To add Agent Playbooks to a running release, upgrade it:

```bash
helm upgrade iris redis-ai/redis-iris \
  --version '~1.0.1' \
  --namespace <namespace-name> \
  -f iris-values.yaml
```

## 4. Verify the deployment

```bash
kubectl -n <namespace-name> rollout status deployment/redis-agent-playbook-controlplane
kubectl -n <namespace-name> rollout status deployment/redis-agent-playbook-dataplane
helm test iris --namespace <namespace-name> --logs
```

`helm test` creates a playbook, mints a scoped agent key, and calls the data plane with it. See [Verify the release](/content/operate/iris/self-managed/_index.md#6-verify-the-release).

To call the services from your workstation, run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-playbook-controlplane 9200:9200
```

```bash
kubectl -n <namespace-name> port-forward svc/redis-agent-playbook-dataplane 9201:9201
```

```bash
kubectl -n <namespace-name> port-forward svc/iris-identity-service 9202:9200
```

Rerun a port-forward after its pod is replaced.

## 5. Create a playbook

[Load the administrative credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#load-the-administrative-credentials), then follow [Create a playbook](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-a-playbook). Continue when its state is `READY`.

To create the playbook and its agent key in one step instead, use the `iris` CLI as in [Create a store with the `iris` CLI](/content/operate/iris/self-managed/_index.md#7-create-a-store-with-the-iris-cli).

## 6. Mint an agent key

Mint a key with a grant on the playbook through the Identity Service. See [Create agent keys](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-agent-keys).

## 7. Make one authenticated call

Check the playbook with the key against the data plane:

```bash
curl --fail-with-body -sS \
  "$IRIS_AGENT_PLAYBOOKS_URL/iris/data/v1/agent-playbooks/playbooks/$IRIS_AGENT_PLAYBOOKS_PLAYBOOK_ID/health" \
  -H "Authorization: Bearer $IRIS_AGENT_PLAYBOOKS_API_KEY"
```

The response reports `READY` for the playbook and for its metadata Redis, content Redis, embedding provider, and license. A `401` means the key is wrong, expired, or revoked. A `403` means it has no grant on the playbook.

## Next steps

- [Publish and retrieve your first FAQ](/content/develop/ai/context-engine/agent-playbooks/quickstart.md).
- [Operate the deployment](/content/operate/iris/agent-playbook/self-managed/operations.md).

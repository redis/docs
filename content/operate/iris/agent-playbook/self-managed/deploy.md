---
Title: Deploy Redis Agent Playbooks
alwaysopen: false
categories:
- docs
- operate
- iris
description: Install the Identity Service and Redis Agent Playbooks, then create a playbook, mint an agent key, and make one authenticated call.
linkTitle: Deploy
weight: 50
hideListLinks: true
---

Follow these steps to install the Agent Playbooks control plane and data plane with the `redis-agent-playbook` Helm chart, connect them to an Identity Service release, and end with one authenticated call to the data plane.

Install Identity Service as release `ids`, then Agent Playbooks as release `playbook`, in one namespace. These steps use Agent Playbooks chart `1.0.0` and Identity Service chart `1.0.0`. You create the two credentials both releases share and the Identity Service control token; Agent Playbooks generates its admin token. See [Credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#credentials).


Before installing, provide two Transport Layer Security (TLS) endpoints through your hosting environment: one forwarding to `ids-iris-identity-service:9200`, and one forwarding to `playbook-controlplane:9200`. Neither chart terminates TLS. Obtain their certificate authority (CA) certificates as a PEM bundle named `ca.crt`. For a network-isolated lab without TLS, see [Isolated lab without TLS](/content/operate/iris/agent-playbook/self-managed/configuration.md#isolated-lab-without-tls).

If an Identity Service release already serves Redis Agent Memory in this namespace, use it: add the Agent Playbooks entries from [step 3](#3-install-identity-service-first) to its values and upgrade it instead of installing a second release. Both products must use the same tenant.

Before you begin, review the [prerequisites](/content/operate/iris/agent-playbook/self-managed/prerequisites.md).

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create Secrets

Prepare `playbook-storage.yaml`, `ids-metadata.yaml`, and `inference.yaml` as shown in [Configuration](/content/operate/iris/agent-playbook/self-managed/configuration.md), and save your license as `license`. Then create the Secrets:

```bash
kubectl -n <namespace-name> create secret generic playbook-storage \
  --from-file=playbook-storage.yaml=./playbook-storage.yaml
kubectl -n <namespace-name> create secret generic playbook-license \
  --from-file=license=./license
kubectl -n <namespace-name> create secret generic playbook-inference \
  --from-file=inference.yaml=./inference.yaml
kubectl -n <namespace-name> create secret generic ids-metadata \
  --from-file=metadata.yaml=./ids-metadata.yaml
kubectl -n <namespace-name> create secret generic playbook-dp-credential \
  --from-literal=token="$(openssl rand -hex 32)"
kubectl -n <namespace-name> create secret generic playbook-controlplane-internal \
  --from-literal=token="$(openssl rand -hex 32)"
kubectl -n <namespace-name> create secret generic ids-control-token \
  --from-literal=token="$(openssl rand -hex 32)"
kubectl -n <namespace-name> create secret generic playbook-ca \
  --from-file=ca.crt=./ca.crt
```

Both releases mount `playbook-dp-credential` and `playbook-controlplane-internal`. You own these Secrets; neither release generates them in this procedure. The runtime credential lets the data plane check agent keys. The internal token lets the Identity Service validate grants against the control plane. The `ids-control-token` Secret is used only by the Identity Service.

## 3. Install Identity Service first

Save this as `values-ids.yaml`:

```yaml
metadata:
  existingSecret: ids-metadata
control:
  existingSecret: ids-control-token
  autoGenerate: false
runtime:
  apiKeyTenant:
    singleTenantID: default
  serviceCredentials:
    - name: playbook-dp
      subject: playbook-dp
      allowedOperations: [api-key-introspect]
      allowedProducts: [playbook]
      existingSecret: playbook-dp-credential
      secretKey: token
productValidation:
  products:
    playbook:
      baseURL: https://<playbook-control-plane-tls-endpoint>
      credential:
        existingSecret: playbook-controlplane-internal
        secretKey: token
tls:
  caCertSecret: playbook-ca
```

If the release also serves Agent Memory, keep its `memory-dp` credential, `memory` validator, and `runtime.unscopedGrantsProduct: memory`, and add these `playbook-dp` and `playbook` entries next to them.

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install ids redis-ai/iris-identity-service \
  --version 1.0.0 \
  --namespace <namespace-name> \
  -f values-ids.yaml
```

The Agent Playbooks control plane doesn't exist yet. Configure its endpoint now, but wait until both releases and the TLS routes are ready before you mint keys: the Identity Service calls the control plane to validate each playbook grant.

## 4. Create `playbook-values.yaml`

Write the values file from [Helm values](/content/operate/iris/agent-playbook/self-managed/configuration.md#helm-values), with your embedding model and the Identity Service TLS endpoint.

## Before you install: check your values

Check each value before you install. If one is wrong, you see the symptom in its row.

{{< table-scrollable >}}
| Check | Symptom | Fix |
| --- | --- | --- |
| `controlplane.image.tag` and `dataplane.image.tag` are set | Rendering fails with a named message, or pods `ImagePullBackOff` | Set both tags. |
| `dataplane.identityServiceBaseURL` is `https://`, or `identityService.allowInsecureTransport` is `true` | Rendering fails | Use the TLS endpoint, or the [lab option](/content/operate/iris/agent-playbook/self-managed/configuration.md#isolated-lab-without-tls). |
| The admin token, internal token, and runtime credential reference three different Secret keys | Rendering fails | Use distinct Secrets. |
| `inference.models` lists at least one model | Rendering fails | List each model the deployment offers. |
| Each model's `provider` names an `embedders_connection_details` entry in `inference.yaml` | Creating a playbook fails, or it doesn't become `READY` | Add the entry under that provider name. |
| `tenantId` equals the Identity Service's `runtime.apiKeyTenant.singleTenantID` | Minting a key fails, or agent keys get `403` | Set both to the same tenant. |
| The content Redis has JSON and Search | The data plane isn't ready, or a playbook is `FAILED` | Use a Redis 8 build that includes JSON and Search. |
{{< /table-scrollable >}}

## 5. Install

```bash
helm install playbook redis-ai/redis-agent-playbook \
  --version 1.0.0 \
  --namespace <namespace-name> \
  -f playbook-values.yaml \
  --wait --timeout 10m
```

## 6. Verify pods and health

```bash
kubectl -n <namespace-name> rollout status deployment/playbook-controlplane
kubectl -n <namespace-name> rollout status deployment/playbook-dataplane
kubectl -n <namespace-name> get pods -l app.kubernetes.io/instance=ids
helm test playbook --namespace <namespace-name> --logs
```

`helm test` checks readiness on both planes and the configured security profile. It doesn't check that the two releases are consistent with each other; the remaining steps do.

Run each port-forward in its own terminal and leave it running:

```bash
kubectl -n <namespace-name> port-forward svc/playbook-controlplane 9200:9200
```

```bash
kubectl -n <namespace-name> port-forward svc/playbook-dataplane 9201:9201
```

```bash
kubectl -n <namespace-name> port-forward svc/ids-iris-identity-service 9202:9200
```

Then check readiness on every service:

```bash
curl -sS http://localhost:9200/health/readiness
curl -sS http://localhost:9201/health/readiness
curl -sS http://localhost:9202/health/readiness
```

Rerun a port-forward after its pod is replaced.

## 7. Create a playbook

[Load the administrative credentials](/content/operate/iris/agent-playbook/self-managed/authentication.md#load-the-administrative-credentials), then follow [Create a playbook](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-a-playbook). Continue when its state is `READY`.

## 8. Mint an agent key

Mint a key with a grant on the playbook through the Identity Service. See [Create agent keys](/content/operate/iris/agent-playbook/self-managed/api-examples.md#create-agent-keys).

## 9. Make one authenticated call

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

---
title: Install the Redis Iris suite
description: Install the Identity Service, the Redis Iris services, and the Iris console on Kubernetes as one Helm release.
linkTitle: Self-managed suite
alwaysopen: false
categories:
- docs
- operate
- iris
weight: 28
hideListLinks: true
---

The `redis-iris` Helm chart installs the Identity Service, the Redis Iris services you choose, and the Iris console as one release. It's the supported way to run Redis Iris on your own Kubernetes cluster. The product charts that each service guide describes, such as `redis-agent-memory` and `iris-identity-service`, are published as dependencies of this chart. Installing one on its own isn't a supported install path.

> [!NOTE]
> You need a Redis Iris suite license. Contact your Redis representative or
> [contact sales](https://redis.io/contact/).

## What you deploy

The chart installs every component under a fixed name in the release namespace, whatever you call the release, so the components reach each other by Service name.

| Component | Values key | Services | Installed when |
| --- | --- | --- | --- |
| Identity Service | `identityService` | `iris-identity-service` (`9200`) | Always |
| [Agent Memory](/content/operate/iris/agent-memory/self-managed/_index.md) | `memory` | `redis-agent-memory` (`9000`), `redis-agent-memory-controlplane` (`9100`) | `global.iris.products.memory.enabled` |
| [Agent Playbooks](/content/operate/iris/agent-playbook/self-managed/_index.md) | `playbook` | `redis-agent-playbook-controlplane` (`9200`), `redis-agent-playbook-dataplane` (`9201`) | `global.iris.products.playbook.enabled` |
| [Lens](/content/operate/iris/lens/self-managed/_index.md) | `lens` | `redis-lens-dataplane` (`9000`), `redis-lens-controlplane` (`9300`) | `global.iris.products.lens.enabled` |
| [Context Gateway](/content/operate/iris/context-gateway/self-managed/_index.md) | `contextGateway` | `redis-context-gateway-controlplane` (`9100`), `redis-context-gateway-dataplane` (`8083`) | `global.iris.products.contextGateway.enabled` |
| [Intent Router](/content/operate/iris/intent-router/self-managed/_index.md) | `intent` | `redis-intent-router-controlplane` (`9400`), `redis-intent-router-dataplane` (`9401`) | `global.iris.products.intent.enabled` |
| Iris console | `ui` | `iris-ui` | Always |

Every service is on by default. Set `enabled: false` for each one you don't install. A disabled service needs none of its values.

Install one release per namespace, and keep other Iris releases out of that namespace. The release is one tenant.

## Prerequisites

| Requirement | Details |
| --- | --- |
| Kubernetes | Kubernetes 1.28 or later. The baseline is 3 worker nodes with 12 vCPU and 24 GiB allocatable in total. The [preflight](#4-run-the-preflight) warns below it. |
| Node architecture | `linux/amd64`. The `1.0.0` images are published for `amd64` only. To evaluate on Apple silicon, see [Evaluate on a local kind cluster](#evaluate-on-a-local-kind-cluster). |
| Metrics API | `metrics.k8s.io/v1beta1`, so the HorizontalPodAutoscalers can scale. |
| Helm | Helm 3.10 or later, with the Redis AI repository `https://helm.redis.io/ai`. Helm 4 isn't supported in this release. |
| `kubectl` | Configured for the cluster and namespace. |
| License | One suite license that covers every service you install. |
| Redis databases | A metadata Redis for the Identity Service, plus the databases each service guide lists. |
| Identity provider (IdP) | An OpenID Connect (OIDC) IdP for operator sign-in to the console and the control planes, with a confidential client for the console. To start without one, see [Admin token mode](#admin-token-mode). |
| Ingress | An ingress controller, a host name for the console, and a Transport Layer Security (TLS) Secret for that host. |

## 1. Create the namespace

```bash
kubectl create namespace <namespace-name>
```

## 2. Create the shared Secrets

Create these Secrets in the release namespace. Each service guide lists that service's own Secrets in its suite section.

| Secret | Key | Holds |
| --- | --- | --- |
| `iris-license` | `license.key` | The suite license. |
| `ids-metadata` | `metadata.yaml` | The Identity Service metadata Redis connection. See [Create the metadata Secret](/content/operate/iris/identity-service/deploy.md#2-create-the-metadata-secret). |
| `cluster-ca` | `ca.crt` | The certificate authority (CA) bundle every component trusts: the cluster CA from the `kube-root-ca.crt` ConfigMap, plus any private CA your Redis or IdP uses. |
| `iris-ui-oidc` | `client-secret` | The console's client secret at your IdP. Register the redirect URI `<public-url>/auth/callback`. |
| `ui-session-redis` | `urls` | The Redis URL for console sessions. Needed only with console sign-in on (`ui.sso.enabled`). |
| `iris-tls` | `tls.crt`, `tls.key` | The TLS certificate for the console host. |

```bash
kubectl -n <namespace-name> create secret generic iris-license \
  --from-file=license.key=./license.key
```

The chart generates every credential the components share, including each service's admin token. See [Credentials](#credentials).

### Service Secrets and Redis databases

Each service you install also needs its own Secrets. The names below are the ones the chart's `examples/*.yaml` files use. Any name works if the value on the right points at it.

| Service | Secret | Keys | Values key |
| --- | --- | --- | --- |
| Agent Memory | `mem-secrets` | `overlay.yaml` | `memory.secrets.secretName` |
| Agent Playbooks | `playbook-storage` | `playbook-storage.yaml` | `playbook.storage.existingSecret` |
| Lens | `lens-storage` | `lens-dataplane-storage.yaml`, `lens-controlplane-storage.yaml` | `lens.storage.existingSecret` |
| Context Gateway | `gateway-metadata` | `config.yaml` | `contextGateway.metadataDB.existingSecret` |
| Context Gateway | `gateway-credential-redis` | `config.yaml` | `contextGateway.credentialStorage.redis.connection.existingSecret` |
| Context Gateway | `gateway-keyring` | `k1` | `contextGateway.credentialStorage.redis.keyring.existingSecret` |
| Intent Router | `intent-storage` | `intent-controlplane-storage.yaml`, `intent-dataplane-storage.yaml` | `intent.storage.existingSecret` |
| Intent Router | `intent-inference` | `inference.yaml` | `intent.inference.existingSecret` |

What each Secret holds, and what a local evaluation can use instead:

- **`mem-secrets`:** The Memory Redis URLs and model provider credentials. Locally, the `noop` embedder and inference work. See the chart's `examples/memory-only.yaml`.
- **`playbook-storage`:** The metadata and content Redis URLs. They must be two different Redis deployments. Locally, the `noop` embedding model works.
- **`lens-storage`:** The data plane's streams, content, index, and metadata Redis URLs, and the control plane's metadata Redis URL. Locally, use real Redis URLs. Lens needs no model provider.
- **`gateway-metadata`:** `metadata_db.urls`, the Gateway metadata Redis. Locally, use a real Redis URL.
- **`gateway-credential-redis`:** `credential_storage.redis.urls`. Use a different Redis from the metadata one. Locally, use a real Redis URL.
- **`gateway-keyring`:** A base64 32-byte key, from `openssl rand -base64 32`. Any generated key works locally.
- **`intent-storage`:** The control plane metadata Redis, the data plane Redis, and the database registry. Register each database in both keys with the same ID. Locally, use real Redis URLs.
- **`intent-inference`:** `embedders_connection_details` for the embedding provider. Locally, too, it needs a real OpenAI-compatible endpoint and key. See [Verify the release](#6-verify-the-release).

Each service guide's suite section describes the file format of each key.

Use Redis databases with persistent storage. Resource IDs, such as store, Playbook, Gateway, and Router IDs, live in these databases, so a Redis without persistence loses them when its pod restarts.

## 3. Write `iris-values.yaml`

Set the values the services share once, under `global`. The services derive their tenant, license, CA trust, OIDC settings, and Identity Service wiring from them. A service value that differs from a derived one fails the render and names the field.

```yaml
global:
  tls:
    caCertSecret: cluster-ca
  iris:
    tenantId: default
    license:
      existingSecret: iris-license
    publicURL: https://<console-host>
    ingress:
      className: <ingress-class>
      tls:
        secretName: iris-tls
    auth:
      oidc:
        issuer: https://<idp-host>/<issuer-path>
        jwksURI: https://<idp-host>/<jwks-path>
      roleBindings:
        - { group: <admin-group>, role: suite_admin }
        - { group: <memory-operators-group>, role: operator, product: agent_memory }
    products:
      contextGateway:
        enabled: false

identityService:
  metadata:
    existingSecret: ids-metadata

ui:
  sso:
    clientId: <console-client-id>
    clientCredential:
      existingSecret: iris-ui-oidc
    redis:
      existingSecret: ui-session-redis
```

| Value | Default | Meaning |
| --- | --- | --- |
| `global.iris.tenantId` | `default` | The release's one tenant. You can't change it later. |
| `global.iris.license.existingSecret`, `global.iris.license.secretKey` | `iris-license`, `license.key` | The suite license Secret. |
| `global.iris.publicURL` | None | The console's public origin. |
| `global.iris.ingress.className`, `global.iris.ingress.tls.secretName` | None | The console Ingress class and TLS Secret. |
| `global.iris.auth.oidc.issuer`, `global.iris.auth.oidc.jwksURI` | None | The IdP, set once for the console, every control plane, and the Identity Service. |
| `global.iris.auth.oidc.audience` | `api://redis-iris` | The audience in operator access tokens. |
| `global.iris.auth.oidc.roleClaims` | `[groups]` | The token claims that carry IdP groups. |
| `global.iris.auth.roleBindings` | `[]` | IdP group to Iris role. `suite_admin` takes no `product`. `product_admin`, `operator`, and `viewer` take a `product`: `agent_memory`, `playbook`, `lens`, `context_gateway`, `intent`, or `identity`. |
| `global.iris.workloadIdentity.issuer`, `global.iris.workloadIdentity.jwksURI` | The in-cluster API server | The ServiceAccount token issuer the Memory and Playbooks workers are verified against. On Amazon EKS, set both to the cluster's OIDC issuer. |
| `global.iris.extraction.enabled` | `false` | Agent Playbooks FAQ extraction from Agent Memory. See [Extraction with the Redis Iris suite chart](/content/operate/iris/agent-playbook/self-managed/extraction.md#extraction-with-the-redis-iris-suite-chart). |
| `global.tls.caCertSecret` | `""` | The CA bundle Secret every component trusts. |

Every service is installed by default. Turn one off with `global.iris.products.<service>.enabled: false`, where `<service>` is `memory`, `playbook`, `lens`, `contextGateway`, or `intent`. The chart's `examples/` folder has one values file per service, which you can pass as extra `-f` files:

```bash
helm pull redis-ai/redis-iris --version 1.0.0 --untar
ls redis-iris/examples
```

Then add each service's values under its key, as its guide describes:

- [Agent Memory](/content/operate/iris/agent-memory/self-managed/deploy.md#2-add-the-agent-memory-values), under `memory:`. Set the license path as that section shows, or Memory fails to start with `invalid license format`.
- [Agent Playbooks](/content/operate/iris/agent-playbook/self-managed/deploy.md#2-add-the-agent-playbooks-values), under `playbook:`
- [Lens](/content/operate/iris/lens/self-managed/deploy.md#2-add-the-lens-values), under `lens:`
- [Context Gateway](/content/operate/iris/context-gateway/self-managed/deploy.md#2-add-the-context-gateway-values), under `contextGateway:`
- [Intent Router](/content/operate/iris/intent-router/self-managed/deploy.md#2-add-the-intent-router-values), under `intent:`

### Admin token mode

Without an IdP, turn off console sign-in and the console Ingress. Operators then paste each service's admin token into the console, and `publicURL`, `ingress`, and `auth.oidc` aren't needed:

```yaml
ui:
  sso:
    enabled: false
  ingress:
    enabled: false
```

Use admin token mode for evaluation, or as the break-glass path when your IdP is unavailable.

## 4. Run the preflight

The chart includes a preflight that checks the cluster before an install. It reads no Secret value, prints none, and creates no permissions.

| Check | Result |
| --- | --- |
| Kubernetes version | Fails below 1.28. |
| Baseline sizing: 3 worker nodes, with 12 vCPU and 24 GiB allocatable in total | Warns below each figure. Control-plane nodes don't count. |
| Metrics API | Warns when it's missing, because the HorizontalPodAutoscalers can't scale. |
| Ingress class, with `ui.ingress.enabled` | Fails when no IngressClass named `global.iris.ingress.className` exists. |
| Credential keys, with `global.iris.secrets.generate: false` | Fails for each enabled service whose `<service>-dp` or `<service>` key is missing or empty in the supplied Secrets. |
| Workload identity, for Agent Memory, and for Agent Playbooks with extraction | Fails when `global.iris.workloadIdentity.issuer` isn't the cluster's ServiceAccount issuer, or when its JSON Web Key Set (JWKS) isn't reachable without a credential. |

Run it with the [`kubectl preflight`](https://troubleshoot.sh/docs/#installation) plugin, v0.124.0 or later. Older versions only warn on the ingress class check. The namespace must exist:

```bash
helm template iris redis-ai/redis-iris --version <chart-version> -n <namespace-name> -f iris-values.yaml \
  --show-only templates/preflight.yaml \
  | yq '.stringData["preflight.yaml"]' | kubectl preflight -
```

After the install, run it again from the Secret the chart creates:

```bash
kubectl preflight secret/<namespace-name>/iris-preflight
```

On Amazon EKS, set both `global.iris.workloadIdentity` fields from the cluster's OIDC issuer: `issuer` from `aws eks describe-cluster --query cluster.identity.oidc.issuer`, and `jwksURI` as `<issuer>/keys`.

On clusters that refuse anonymous access to the ServiceAccount issuer, such as kubeadm clusters, the workload identity check fails and prints the binding to create. The chart creates no cluster-scoped permissions:

```bash
kubectl create clusterrolebinding <namespace-name>-issuer-discovery \
  --clusterrole=system:service-account-issuer-discovery --group=system:unauthenticated
```

## 5. Install

```bash
helm repo add redis-ai https://helm.redis.io/ai
helm repo update redis-ai
helm install iris redis-ai/redis-iris \
  --version 1.0.0 \
  --namespace <namespace-name> \
  -f iris-values.yaml
```

A missing or conflicting value fails the install and names the field to fix.

## 6. Verify the release

Check that every Deployment is available:

```bash
kubectl -n <namespace-name> get deployments
```

With every service installed, the release has these Deployments:

| Service | Deployments |
| --- | --- |
| Identity Service | `iris-identity-service` |
| Iris console | `iris-ui` |
| Agent Memory | `redis-agent-memory`, `redis-agent-memory-worker`, `redis-agent-memory-controlplane` |
| Agent Playbooks | `redis-agent-playbook-controlplane`, `redis-agent-playbook-dataplane` |
| Lens | `redis-lens-controlplane`, `redis-lens-dataplane`, `redis-lens-worker` |
| Context Gateway | `redis-context-gateway-controlplane`, `redis-context-gateway-dataplane` |
| Intent Router | `redis-intent-router-controlplane`, `redis-intent-router-dataplane` |

Then run the release tests:

```bash
helm test iris --namespace <namespace-name> --logs
```

For each installed service, the test creates a resource with the admin token, mints a scoped agent key, calls the data plane with it, calls the console, and then removes what it created. It creates its temporary Agent Memory store in Memory database `1`. If your Memory `databases` registry uses another key, set `tests.suiteVerify.databaseId`.

The Intent Router check upserts and matches an intent, which calls the embedding provider in `intent-inference`. With a placeholder key, the upsert fails with `424`. Use a real OpenAI-compatible endpoint and key, or turn Intent Router off.

## 7. Create a store with the `iris` CLI

The `iris` CLI in the [`redis-iris`](https://pypi.org/project/redis-iris/) package turns the admin tokens the chart generated into a working service in three commands. It creates the resource, mints its agent key, writes the connection values to `.env` without printing the key, and checks every hop. This example creates an Agent Memory store. The other services follow the same steps. See [SDK and CLI setup](/content/develop/ai/context-engine/sdk-and-cli.md#set-up-on-a-self-managed-deployment).

1. Install the package:

    ```bash
    pip install 'redis-iris>=1.0.0'
    ```

1. If you run the CLI outside the cluster, forward the Agent Memory and Identity Service ports, each in its own terminal:

    ```bash
    kubectl -n <namespace-name> port-forward svc/redis-agent-memory-controlplane 9100:9100
    ```

    ```bash
    kubectl -n <namespace-name> port-forward svc/redis-agent-memory 9000:9000
    ```

    ```bash
    kubectl -n <namespace-name> port-forward svc/iris-identity-service 9200:9200
    ```

1. Create `iris.toml`. It holds URLs only:

    ```toml
    [profiles.suite]
    kind = "self-managed"

    [profiles.suite.agent_memory]
    service_url = "http://localhost:9100"
    url = "http://localhost:9000"
    identity_url = "http://localhost:9200"
    ```

1. Write the chart's admin and control tokens to `.env.admin`, separate from your application's `.env`:

    ```bash
    {
      echo "IRIS_CONFIG=./iris.toml"
      echo "IRIS_PROFILE=suite"
      echo "IRIS_AGENT_MEMORY_SERVICE_TOKEN=$(kubectl -n <namespace-name> get secret iris-memory-admin-token -o jsonpath='{.data.token}' | base64 -d)"
      echo "IRIS_IDENTITY_TOKEN=$(kubectl -n <namespace-name> get secret iris-identity-service-control-token -o jsonpath='{.data.token}' | base64 -d)"
    } > .env.admin
    ```

1. Create the store and its agent key:

    ```bash
    set -a; source .env.admin; set +a
    iris agent-memory service create --name support-memory --write-env .env
    ```

1. Check every hop, from the Control Plane to a read with the agent key. The check needs the admin settings from `.env.admin` as well as the store settings in `.env`, so load both:

    ```bash
    set -a; source .env.admin; source .env; set +a
    iris agent-memory service check "$IRIS_AGENT_MEMORY_STORE_ID" --env-file .env
    ```

Your application reads the same `.env`.

## Credentials

By default, the chart generates every shared credential once, as Secrets it keeps across upgrades, rollbacks, and uninstalls.

| Secret | Key | Used by |
| --- | --- | --- |
| `iris-<service>-dataplane-credential` | `<service>-dp` | The service's data plane and the Identity Service |
| `iris-<service>-internal-token` | `<service>` | The service's control plane and the Identity Service |
| `iris-<service>-admin-token` | `token` | The service's admin API |
| `iris-identity-service-control-token` | `token` | The Identity Service control API |
| `iris-ui-session-key` | `key` | Console sessions, with `ui.sso.enabled` |

`<service>` is `memory`, `playbook`, `lens`, `context-gateway`, or `intent`. Read an admin token with:

```bash
kubectl -n <namespace-name> get secret iris-memory-admin-token -o jsonpath='{.data.token}' | base64 -d
```

To rotate a credential, change its Secret in place. A rollback never restores an old value. `helm uninstall` keeps these Secrets, so a reinstall reuses them. To start over, delete them as described in [Uninstall](/content/operate/iris/self-managed/operations.md#uninstall).

To supply your own credentials, for example for an offline render with Argo CD or Flux, set `global.iris.renderMode: gitops` and `global.iris.secrets.generate: false`. Then name two Secrets: `global.iris.secrets.dataplaneServiceCredentials.existingSecret`, with a `<service>-dp` key for each installed service, and `global.iris.secrets.controlplaneInternalTokens.existingSecret`, with a `<service>` key for each.

## Availability

Rolling upgrades and node drains keep every data plane serving.

| Setting | Value | Can you change it? |
| --- | --- | --- |
| Data-plane rollout | `RollingUpdate`, with `maxUnavailable: 0` and `maxSurge: 1`, also under a HorizontalPodAutoscaler | No. Another strategy fails the render and names the field. |
| PodDisruptionBudgets | `maxUnavailable: 1`, for each Deployment that keeps more than one pod | No. |
| Replicas | Two for the Identity Service, the console gateway and sign-in service, and the Agent Playbooks, Lens, Context Gateway, and Intent Router data planes. The Agent Memory server and worker autoscale from 2 to 10 and from 2 to 5. One for each control plane and for the Agent Playbooks and Lens workers. | Yes. Size them for your load. |

A rollout starts one new pod, and removes an old one only when the new one is ready, so leave room for one extra pod in your requests and quota. Without that room, the rollout waits, with every old pod still serving. A stopping pod keeps accepting requests for 5 seconds after it receives `SIGTERM`, while it leaves its Services' endpoints. It then finishes the requests in flight within the rest of its 30-second grace period.

A Deployment with one replica gets no PodDisruptionBudget, so a node drain evicts its pod. Scale it to two to keep it serving through drains.

## Operate the suite

To upgrade, roll back, rotate the metadata Redis credential, restore a lost namespace, remove a service, or uninstall, see [Operate the Redis Iris suite](/content/operate/iris/self-managed/operations.md).

## Evaluate on a local kind cluster

You can evaluate the suite on a [kind](https://kind.sigs.k8s.io/) cluster on your workstation. This setup isn't for production.

You need Docker Desktop, `kind`, `kubectl`, Helm 3.10 or later, and your license file.

### Run the `amd64` images on Apple silicon

> [!NOTE]
> The `1.0.0` images are published for `amd64` only. Until `arm64` images are
> published, Apple silicon runs them under emulation, as described in this section.

On Apple silicon, create a native `arm64` kind node, which is the default. Docker Desktop's x86 emulation then runs the `amd64` images inside it.

Don't create an `amd64` kind node. Under QEMU emulation the kubelet reports `seccomp is not supported` and the node doesn't start. If you rebuilt a cluster and Docker cached the `kindest/node` image as `amd64`, check and remove it before you create the cluster again:

```bash
docker image inspect kindest/node:<tag> --format '{{.Architecture}}'
docker rmi kindest/node:<tag>
```

### Start throwaway Redis databases

Five Redis deployments cover every service:

| Redis | Used by | Secrets that point at it |
| --- | --- | --- |
| `metadata-db` | The Identity Service, Agent Memory, and each service's metadata. With console sign-in on, also console sessions. | `ids-metadata`, `mem-secrets`, the metadata URLs in `playbook-storage`, `lens-storage`, and `intent-storage`, and `gateway-metadata`. With console sign-in on, also `ui-session-redis`. |
| `playbook-content` | Agent Playbooks content, which must be separate from its metadata | The content URL in `playbook-storage` |
| `telemetry-db` | The Lens data plane's streams, content, and index | The data plane URLs in `lens-storage` |
| `gateway-secrets` | Context Gateway credential storage, which must be separate from its metadata | `gateway-credential-redis` |
| `intent-db` | The Intent Router data plane | The data plane URLs in `intent-storage` |

Leave out the databases of any service you turned off.

```bash
for db in metadata-db playbook-content telemetry-db gateway-secrets intent-db; do
  kubectl -n <namespace-name> create deployment "$db" --image=redis:8.2
  kubectl -n <namespace-name> expose deployment "$db" --port=6379
done
```

Their URLs are `redis://<name>.<namespace-name>.svc:6379`. These deployments have no persistent volume, so a pod restart loses every resource ID. Don't use them past an evaluation.

### Write local values

Start from [Admin token mode](#admin-token-mode) and add these values to `iris-values.yaml`:

```yaml
global:
  tls:
    caCertSecret: cluster-ca

identityService:
  configData:
    profile: dev

ui:
  sso:
    enabled: false
  ingress:
    enabled: false

contextGateway:
  dataplane:
    ingress:
      enabled: false
```

| Value | Why |
| --- | --- |
| `global.tls.caCertSecret` | The workers verify the cluster's ServiceAccount issuer over TLS. Create `cluster-ca` from the `kube-root-ca.crt` ConfigMap, as in [Create the shared Secrets](#2-create-the-shared-secrets). |
| `identityService.configData.profile: dev` | Relaxes the Identity Service's production-only configuration checks. Never set it in production. |
| `ui.ingress.enabled: false`, `contextGateway.dataplane.ingress.enabled: false` | A kind cluster has no ingress controller. Reach the Services with `kubectl port-forward`. |

### Open the console

Forward the console Service:

```bash
kubectl -n <namespace-name> port-forward svc/iris-ui <local-port>:8080
```

If you turned console sign-in on, the local port must be the one in `global.iris.publicURL`, and your IdP must register `<publicURL>/auth/callback` for it. Forwarding on any other port breaks sign-in. If the port is taken, `port-forward` fails with `address already in use`. Free the port rather than picking another one.

### Reach every service from your workstation

To call the services from an application outside the cluster, forward each Service you installed. Several Services use the same container port, so give each a distinct local port:

| Service | Local port | Service port | Purpose |
| --- | --- | --- | --- |
| `iris-identity-service` | 9200 | 9200 | Agent keys |
| `redis-agent-memory` | 9000 | 9000 | Agent Memory Data Plane |
| `redis-agent-memory-controlplane` | 9100 | 9100 | Agent Memory Control Plane |
| `redis-agent-playbook-dataplane` | 9201 | 9201 | Agent Playbooks Data Plane |
| `redis-agent-playbook-controlplane` | 9202 | 9200 | Agent Playbooks Control Plane |
| `redis-lens-dataplane` | 9010 | 9000 | Lens Data Plane |
| `redis-lens-controlplane` | 9300 | 9300 | Lens Control Plane |
| `redis-intent-router-dataplane` | 9401 | 9401 | Intent Router Data Plane |
| `redis-intent-router-controlplane` | 9400 | 9400 | Intent Router Control Plane |
| `redis-context-gateway-dataplane` | 8083 | 8083 | Context Gateway Data Plane |
| `redis-context-gateway-controlplane` | 8084 | 9100 | Context Gateway Control Plane |

Run all the forwards from one script. It stops them when you press Ctrl-C:

```bash
#!/usr/bin/env bash
NS=<namespace-name>
pids=()
trap 'kill "${pids[@]}" 2>/dev/null' EXIT INT TERM

forward() {  # <service> <local port> <service port>
  kubectl -n "$NS" port-forward "svc/$1" "$2:$3" >/dev/null 2>&1 &
  pids+=("$!")
}

forward iris-identity-service 9200 9200
forward redis-agent-memory 9000 9000
forward redis-agent-memory-controlplane 9100 9100
# Add a line for each other Service you installed.
wait
```

A forward stays attached to the pod it started on. When an upgrade replaces the pod, the forward stops answering, so stop the script and run it again.

## Move from a preview or standalone install

Upgrading to `redis-iris` from preview charts (`0.x`) or from product charts installed on their own isn't supported. Reinstall instead, against the same Redis databases:

1. Record your values.
1. Run `helm uninstall` for every Iris release in the namespace.
1. Write `iris-values.yaml` with the same Redis Secrets, and install `redis-iris`.

Data in those databases is kept, except from Agent Memory `0.0.x` and Agent Playbooks `0.1.x` previews, which can't be upgraded. Expect a few minutes of downtime.

## Tenancy and identity provider limits

A release has one tenant, one identity provider issuer, and one token audience. The chart takes each from `global.iris` and applies it to every service, so every key and token resolves to that tenant.

- `global.iris.tenantId` becomes the tenant of every service and the Identity Service's `singleTenantID`. An empty value fails the schema check.
- `global.iris.auth.oidc` supplies the issuer, JWKS URL, role claims, role mappings, and audience.

A service value that sets any of these differently fails the render, and the error names the value to remove:

| Value you set | Why it fails |
| --- | --- |
| `memory.tenantId`, `playbook.tenantId`, or `identityService.runtime.apiKeyTenant.singleTenantID` that differs from `global.iris.tenantId` | The release has one tenant. |
| `tenant_id_claim` in an enabled service OIDC block, such as `memory.memory.auth.oidc` | A claim names a tenant per token, which a single-tenant release doesn't use. |
| `static_tenant_id` that differs from `global.iris.tenantId` | The tenant is already pinned. |
| `role_mappings`, `issuer`, or `jwks_uri` in a service OIDC block that differs from `global.iris.auth.oidc` | The suite derives them once for every service. |
| `audience` in a service OIDC block that differs from `global.iris.auth.oidc.audience` | Every service accepts the one audience. |

To serve a second tenant or issuer, install another release in its own namespace.

Because a release has one tenant, every valid agent key and every valid token from the configured issuer acts in `global.iris.tenantId`. No request can name another tenant, so the suite never refuses a request as cross-tenant.

## Not supported in this release

| Feature | Status |
| --- | --- |
| FIPS profile (`global.security.profile: fips`) | The install fails. Planned for `1.1`. |
| Helm 4 | Planned for `1.1`. |
| Standalone product chart installs | Published as dependencies of `redis-iris` only. |
| More than one tenant, issuer, or audience per release | A release has one of each. An empty `global.iris.tenantId` fails the install. See [Tenancy and identity provider limits](#tenancy-and-identity-provider-limits). |

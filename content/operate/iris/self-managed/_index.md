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
| `ids-metadata` | `metadata.yaml` | The Identity Service metadata Redis connection. See [Create the metadata Secret](/content/operate/iris/identity-service/self-managed/deploy.md#2-create-the-metadata-secret). |
| `cluster-ca` | `ca.crt` | The certificate authority (CA) bundle every component trusts: the cluster CA from the `kube-root-ca.crt` ConfigMap, plus any private CA your Redis or IdP uses. |
| `iris-ui-oidc` | `client-secret` | The console's client secret at your IdP. Register the redirect URI `<public-url>/auth/callback`. |
| `ui-session-redis` | `urls` | The Redis URL for console sessions. |
| `iris-tls` | `tls.crt`, `tls.key` | The TLS certificate for the console host. |

```bash
kubectl -n <namespace-name> create secret generic iris-license \
  --from-file=license.key=./license.key
```

The chart generates every credential the components share, including each service's admin token. See [Credentials](#credentials).

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

Then add each service's values under its key, as its guide describes:

- [Agent Memory](/content/operate/iris/agent-memory/self-managed/deploy.md#install-with-the-redis-iris-suite-chart), under `memory:`
- [Agent Playbooks](/content/operate/iris/agent-playbook/self-managed/deploy.md#install-with-the-redis-iris-suite-chart), under `playbook:`
- [Lens](/content/operate/iris/lens/self-managed/deploy.md#install-with-the-redis-iris-suite-chart), under `lens:`
- [Context Gateway](/content/operate/iris/context-gateway/self-managed/deploy.md#install-with-the-redis-iris-suite-chart), under `contextGateway:`
- [Intent Router](/content/operate/iris/intent-router/self-managed/deploy.md#install-with-the-redis-iris-suite-chart), under `intent:`

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

```bash
helm test iris --namespace <namespace-name> --logs
```

For each installed service, the test creates a resource with the admin token, mints a scoped agent key, calls the data plane with it, calls the console, and then removes what it created. It creates its temporary Agent Memory store in Memory database `1`. If your Memory `databases` registry uses another key, set `tests.suiteVerify.databaseId`.

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

## Move from a preview or standalone install

Upgrading to `redis-iris` from preview charts (`0.x`) or from product charts installed on their own isn't supported. Reinstall instead, against the same Redis databases:

1. Record your values.
1. Run `helm uninstall` for every Iris release in the namespace.
1. Write `iris-values.yaml` with the same Redis Secrets, and install `redis-iris`.

Data in those databases is kept, except from Agent Memory `0.0.x` and Agent Playbooks `0.1.x` previews, which can't be upgraded. Expect a few minutes of downtime.

## Not supported in this release

| Feature | Status |
| --- | --- |
| FIPS profile (`global.security.profile: fips`) | The install fails. Planned for `1.1`. |
| Helm 4 | Planned for `1.1`. |
| Standalone product chart installs | Published as dependencies of `redis-iris` only. |

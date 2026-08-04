---
Title: Deploy
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Deploy and operate Feature Form on Kubernetes.
linkTitle: Deploy
weight: 60
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Install Feature Form on Kubernetes with the Helm chart and verify the core services.

## Install

These steps install Feature Form with OIDC authentication and PostgreSQL-backed durable state — the recommended production configuration. The install sequence (after meeting the prerequisites):

1. Get the chart
2. Choose auth and state values
3. Pick the base chart or a profile
4. Install with Helm
5. Validate pods and services
6. Record the endpoints
7. Install the `ff` CLI

### Prerequisites

- Kubernetes 1.27+.
- Helm 3.14+.
- An OIDC issuer URL and client ID — see [Configure authentication and RBAC]({{< relref "/operate/featureform/configure-auth" >}}) to set one up before installing.
- A PostgreSQL connection path or existing secret.

### 1. Get the chart

The Feature Form Helm chart is published as an OCI artifact on Docker Hub:

```text
oci://registry-1.docker.io/redisfeatureform/featureform
```

Helm pulls the chart directly from this path with the `--version` flag — no `helm pull` step is required unless you want a local copy. Pin to the same version as the server and dashboard images you intend to run.

### 2. Choose auth and state values

Pick one PostgreSQL-backed state path before installation:

- `postgres.url` for a connection string.
- `postgres.secretName` to point at an existing Kubernetes secret holding the connection details.
- `addons.statePostgres.enabled=true` to install the chart's bundled state PostgreSQL.

External PostgreSQL is the documented durable default.

### 3. Pick the base chart or a profile

Pick one based on what infrastructure already exists in your cluster and what observability you need:

- **Base chart** — for environments where Postgres, Redis, and other provider infrastructure already exist.
- **`profiles/memory.yaml`** — local or test-only installs; uses in-memory state (not durable).
- **`profiles/provider-stack.yaml`** — adds bundled Postgres and Redis addons so you don't need external infrastructure.
- **`profiles/observability-postgres.yaml`** — adds Prometheus and Grafana with durable Postgres state.
- **`profiles/provider-observability.yaml`** — both bundled providers and observability.

### 4. Install with Helm

```bash
helm upgrade --install featureform \
  oci://registry-1.docker.io/redisfeatureform/featureform \
  --version <featureform-version> \
  --set postgres.url=postgres://featureform:featureform@my-postgres:5432/featureform?sslmode=disable \
  --set auth.oidcIssuerURL=https://idp.example.com/realms/featureform \
  --set auth.oidcClientID=featureform-api \
  --set rest.ingress.enabled=true \
  --set rest.ingress.className=nginx \
  --set rest.ingress.hosts[0].host=api.example.com \
  --set rest.ingress.hosts[0].paths[0].path=/ \
  --set rest.ingress.hosts[0].paths[0].pathType=Prefix
```

### 5. Validate pods and services

```bash
kubectl get pods -n <namespace>
kubectl get svc -n <namespace>
kubectl describe deployment featureform-featureform-server -n <namespace>
```

The deployment is healthy when:

- Pods show `STATUS Running` with `READY 1/1`.
- Both REST and gRPC services are present.
- When PostgreSQL state is enabled, the migration init container shows `STATUS Completed` (`kubectl logs <pod> -c migrate` for details).

### 6. Record the endpoints

Capture the URLs or hosts your teams will need:

- REST API endpoint
- gRPC endpoint
- dashboard URL if enabled
- Grafana URL if enabled

Find them with:

```bash
kubectl get ingress -n <namespace>   # ingress hosts
kubectl get svc -n <namespace>       # LoadBalancer EXTERNAL-IPs
```

### 7. Install the `ff` CLI

The Feature Form CLI ships as the `redis-featureform` package on PyPI. **Don't run `pip install featureform`** — that installs an unrelated upstream project. Install into a virtual environment, pinned to the same version as your deployment:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install redis-featureform==<featureform-version>
ff --help
```

### Common pitfalls

- **One shared server deployment exposes both REST and gRPC.** They're not separate deployments — don't try to scale them independently or expose them on different services.
- **`auth.enabled=false` is not supported.** The chart refuses to render. Configure OIDC and set `auth.enabled=true`.
- **`stateBackend=memory` is not durable.** Workspace state, applied resources, and serving metadata are lost on pod restart. Use this only for ephemeral testing.
- **`dashboard.enabled=true` alone won't render the dashboard.** You also need `dashboard.publicAPIURL`, `dashboard.auth.*`, and a resolvable auth URL — see [Dashboard requirements](#dashboard-requirements).

## Configure external access

After installation, publish the right Feature Form endpoints for users, automation, and optional UI access.

### REST ingress example

Append these flags to the `helm upgrade --install` command to publish REST through ingress:

```bash
--set rest.ingress.enabled=true \
--set rest.ingress.className=nginx \
--set rest.ingress.hosts[0].host=api.example.com \
--set rest.ingress.hosts[0].paths[0].path=/ \
--set rest.ingress.hosts[0].paths[0].pathType=Prefix
```

### gRPC exposure guidance

Use `grpc.ingress.*` only with an ingress controller that supports gRPC backends. If ingress isn't an option, use `grpc.service.type=LoadBalancer`.

### Dashboard requirements

Enabling the dashboard requires:

- `dashboard.enabled=true`
- a resolvable public API URL
- dashboard auth secrets
- a resolvable auth URL

### Unified ingress

Unified ingress publishes one host with chart-managed paths for API, dashboard, and optionally Grafana. Do not combine it with service-specific ingress settings.

### Direct load balancers

If your platform prefers direct external services, expose:

- `rest.service.type=LoadBalancer`
- `grpc.service.type=LoadBalancer`
- `dashboard.service.type=LoadBalancer`

### Troubleshooting

- **Missing ingress hosts.** Set `rest.ingress.hosts[0].host` and `paths`. If ingress isn't a fit, switch to `rest.service.type=LoadBalancer` instead.
- **Unified ingress mixed with service-specific ingresses.** Pick one — either configure `unifiedIngress.*`, or the per-service `rest.ingress.*` / `grpc.ingress.*` / `dashboard.ingress.*`, never both.
- **Dashboard enabled without API URL or auth secrets.** `dashboard.enabled=true` also requires `dashboard.publicAPIURL` and the `dashboard.auth.*` settings listed in [Dashboard requirements](#dashboard-requirements).
- **Grafana ingress configured without the observability stack enabled.** Enable observability via `profiles/observability-postgres.yaml` (or the matching `observability.*` keys) before adding Grafana ingress.

## Next steps

- [Configure authentication and RBAC]({{< relref "/operate/featureform/configure-auth" >}}) — set up OIDC and grant roles.
- [Manage workspaces]({{< relref "/develop/ai/featureform/manage-workspace" >}}) — create your first workspace.
- [Register providers]({{< relref "/develop/ai/featureform/register-providers" >}}) — connect Postgres, Redis, S3, and other backends.
- [Quickstart]({{< relref "/develop/ai/featureform/quickstart" >}}) — verify the install end to end.

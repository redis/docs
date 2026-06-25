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

Use this guide to install Feature Form with the Helm chart and verify that the core services are healthy.

## Install

The default documented path is OIDC-enabled auth plus durable PostgreSQL-backed state.

### Prerequisites

- Kubernetes 1.27+
- Helm 3.14+
- an OIDC issuer URL and client ID
- a PostgreSQL connection path or existing secret

### 1. Get the chart

The Feature Form Helm chart is published as an OCI artifact on Docker Hub:

```text
oci://registry-1.docker.io/redisfeatureform/featureform
```

Helm pulls the chart directly from this path with the `--version` flag — no `helm pull` step is required unless you want a local copy. Pin to the same version as the server and dashboard images you intend to run.

### 2. Choose auth and state values

Pick one PostgreSQL-backed state path before installation:

- `postgres.url`
- `postgres.secretName`
- `addons.statePostgres.enabled=true`

External PostgreSQL is the documented durable default.

### 3. Pick the base chart or a profile

- Base chart for environments where provider infrastructure already exists
- `profiles/memory.yaml` for local or test-only installs
- `profiles/provider-stack.yaml` for bundled providers
- `profiles/observability-postgres.yaml` for observability
- `profiles/provider-observability.yaml` for both

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

Look for a healthy shared API deployment, both REST and gRPC services, and completed migrations when PostgreSQL state is enabled.

### 6. Record the endpoints

Capture the URLs or hosts your teams will need:

- REST API endpoint
- gRPC endpoint
- dashboard URL if enabled
- Grafana URL if enabled

### 7. Install the `ff` CLI

The Feature Form CLI ships as the `redis-featureform` package on PyPI. **Don't run `pip install featureform`** — that installs an unrelated upstream project. Install into a virtual environment, pinned to the same version as your deployment:

```bash
python3 -m venv .venv && source .venv/bin/activate
pip install redis-featureform==<featureform-version>
ff --help
```

### Common pitfalls

- One shared server deployment exposes both REST and gRPC; they are not separate deployments.
- `auth.enabled=false` is not supported.
- `stateBackend=memory` is not durable.
- The dashboard needs more than `dashboard.enabled=true`; it also needs correct auth and API URL settings.

## Configure external access

Use this section after installation to publish the right Feature Form endpoints for users, automation, and optional UI access.

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

Use `grpc.ingress.*` only with an ingress controller that supports gRPC backends. If ingress is not a fit, use `grpc.service.type=LoadBalancer`.

### Dashboard requirements

A working dashboard path needs all of the following:

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

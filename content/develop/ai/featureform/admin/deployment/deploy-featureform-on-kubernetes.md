---
title: Deploy Featureform on Kubernetes
description: Install the Featureform Helm chart and validate the core workloads.
linkTitle: Deploy on Kubernetes
weight: 20
---

Use this guide to install Featureform with the Helm chart and verify that the core services are healthy. The default documented path is OIDC-enabled auth plus durable PostgreSQL-backed state.

## Before you begin

- Kubernetes 1.27+
- Helm 3.14+
- an OIDC issuer URL and client ID
- a PostgreSQL connection path or existing secret

## 1. Choose auth and state values

Pick one PostgreSQL-backed state path before installation:

- `postgres.url`
- `postgres.secretName`
- `addons.statePostgres.enabled=true`

External PostgreSQL is the documented durable default.

## 2. Pick the base chart or a profile

- Base chart for environments where provider infrastructure already exists
- `profiles/memory.yaml` for local or test-only installs
- `profiles/provider-stack.yaml` for bundled providers
- `profiles/observability-postgres.yaml` for observability
- `profiles/provider-observability.yaml` for both

## 3. Install with Helm

```bash
helm upgrade --install featureform charts/featureform \
  --set postgres.url=postgres://featureform:featureform@my-postgres:5432/featureform?sslmode=disable \
  --set auth.oidcIssuerURL=https://idp.example.com/realms/featureform \
  --set auth.oidcClientID=featureform-api \
  --set rest.ingress.enabled=true \
  --set rest.ingress.className=nginx \
  --set rest.ingress.hosts[0].host=api.example.com \
  --set rest.ingress.hosts[0].paths[0].path=/ \
  --set rest.ingress.hosts[0].paths[0].pathType=Prefix
```

## 4. Validate pods and services

```bash
kubectl get pods -n <namespace>
kubectl get svc -n <namespace>
kubectl describe deployment featureform-featureform-server -n <namespace>
```

Look for a healthy shared API deployment, both REST and gRPC services, and completed migrations when PostgreSQL state is enabled.

## 5. Record the endpoints

Capture the URLs or hosts your teams will need:

- REST API endpoint
- gRPC endpoint
- dashboard URL if enabled
- Grafana URL if enabled

## High-risk confusion points

- One shared server deployment exposes both REST and gRPC; they are not separate deployments.
- `auth.enabled=false` is not supported.
- `stateBackend=memory` is not durable.
- The dashboard needs more than `dashboard.enabled=true`; it also needs correct auth and API URL settings.

## Read next

- [Configure external access]({{< relref "/develop/ai/featureform/admin/deployment/configure-external-access" >}})
- [Operate a workspace]({{< relref "/develop/ai/featureform/operations/operate-a-workspace" >}})

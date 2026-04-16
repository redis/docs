---
title: Configure external access
description: Expose Featureform REST, gRPC, dashboard, and optional Grafana endpoints without conflicting ingress settings.
linkTitle: Configure access
weight: 30
---

Use this page after installation to publish the right Featureform endpoints for users, automation, and optional UI access.

## REST ingress example

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

## gRPC exposure guidance

Use `grpc.ingress.*` only with an ingress controller that supports gRPC backends. If ingress is not a fit, use `grpc.service.type=LoadBalancer`.

## Dashboard requirements

A working dashboard path needs all of the following:

- `dashboard.enabled=true`
- a resolvable public API URL
- dashboard auth secrets
- a resolvable auth URL

## Unified ingress

Unified ingress publishes one host with chart-managed paths for API, dashboard, and optionally Grafana. Do not combine it with service-specific ingress settings.

## Direct load balancers

If your platform prefers direct external services, expose:

- `rest.service.type=LoadBalancer`
- `grpc.service.type=LoadBalancer`
- `dashboard.service.type=LoadBalancer`

## Common validation failures

- missing ingress hosts
- unified ingress mixed with service-specific ingresses
- dashboard enabled without API URL or auth secrets
- Grafana ingress configured without the observability stack enabled

## Read next

- [Featureform deployment overview]({{< relref "/develop/ai/featureform/admin/deployment/overview" >}})
- [Deploy Featureform on Kubernetes]({{< relref "/develop/ai/featureform/admin/deployment/deploy-featureform-on-kubernetes" >}})

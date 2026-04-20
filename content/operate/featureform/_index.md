---
Title: Redis Feature Form
alwaysopen: false
categories:
- docs
- operate
- featureform
description: Deploy and operate Feature Form on Kubernetes.
linkTitle: Redis Feature Form
weight: 50
bannerText: Feature Form is currently in preview and subject to change. To request access to the Feature Form Docker image, contact your Redis account team.
bannerChildren: true
---

Feature Form runs as a Kubernetes-based platform for feature engineering and online feature serving. Use this section to prepare your environment, choose a deployment method, install Feature Form, and verify that the platform is ready for application teams.

These docs are cloud-neutral in framing. Where Terraform examples are useful, request them from your Redis account team.

Use this section to decide how you want to install Feature Form before you create workspaces or register providers.

## Deployment model

The Helm chart deploys:

- one shared API server deployment that exposes both REST and gRPC
- separate services for REST and gRPC
- an optional dashboard
- optional addons for Postgres state, provider infrastructure, and observability

Authentication is required. Standard installs need OIDC configuration.

## State-backend choices

- External PostgreSQL: the durable default for shared deployments
- Bundled state PostgreSQL: useful for self-contained evaluation or test installs
- Memory state: local or CI only, not durable

With memory state, gRPC and REST do not share one durable graph. Keep that in mind when troubleshooting “missing” workspaces or resources.

## Exposure choices

- internal-only services
- service-specific ingresses
- unified ingress
- direct `LoadBalancer` services

Do not combine unified ingress with service-specific ingress settings.

## Helm profiles

- base chart
- `profiles/memory.yaml`
- `profiles/provider-stack.yaml`
- `profiles/observability-postgres.yaml`
- `profiles/provider-observability.yaml`
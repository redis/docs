---
title: Featureform deployment overview
description: Choose the right Featureform state backend, exposure model, and Helm profile before installation.
linkTitle: Overview
weight: 10
---

Use this page to decide how you want to install Featureform before you create workspaces or register providers.

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

## Read next

- [Deploy Featureform on Kubernetes]({{< relref "/develop/ai/featureform/admin/deployment/deploy-featureform-on-kubernetes" >}})
- [Configure external access]({{< relref "/develop/ai/featureform/admin/deployment/configure-external-access" >}})

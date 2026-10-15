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
bannerText: Feature Form is currently in preview and subject to change. Feature Form Docker images are available on Docker Hub; contact your Redis account team for a license key to deploy.
bannerChildren: true
---

Deploy and operate Feature Form on Kubernetes: prepare your environment, install the Helm chart, configure authentication, and verify the platform.

This section is for platform engineers and admins. Building features in Feature Form rather than deploying it? See the [develop docs]({{< relref "/develop/ai/featureform" >}}).

Start with [Deploy]({{< relref "/operate/featureform/deploy" >}}) for the install steps, and [Configure authentication and RBAC]({{< relref "/operate/featureform/configure-auth" >}}) for OIDC and roles.

The default install path is cloud-agnostic. For Terraform examples, contact your Redis account team.

## Deployment model

The Helm chart deploys:

- One shared API server deployment that exposes both REST and gRPC.
- Separate services for REST and gRPC.
- An optional dashboard.
- Optional addons: bundled Postgres state, bundled provider infrastructure (Postgres, Redis, MinIO, LocalStack), and observability (Prometheus, Grafana).

Authentication is required. Standard installs use [OIDC]({{< relref "/operate/featureform/configure-auth" >}}).

## Decisions you'll make during install

- **State backend.** External PostgreSQL (the durable default), the chart's bundled state Postgres, or memory state (CI and local only — not durable). See [Choose auth and state values]({{< relref "/operate/featureform/deploy#2-choose-auth-and-state-values" >}}).
- **Exposure.** Internal-only services, per-service ingresses, unified ingress, or direct `LoadBalancer` services. See [Configure external access]({{< relref "/operate/featureform/deploy#configure-external-access" >}}).
- **Helm profile.** Base chart, or one of four bundled profiles for memory state, provider stack, observability, or both. See [Pick the base chart or a profile]({{< relref "/operate/featureform/deploy#3-pick-the-base-chart-or-a-profile" >}}).

If workspaces or resources seem to be missing after a restart, memory state is usually the cause — REST and gRPC see different in-memory data.
